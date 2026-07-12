import { db } from '../firebase/config.js';
import {
  collection, doc, setDoc, updateDoc, getDoc, getDocs,
  query, where, runTransaction, serverTimestamp
} from 'firebase/firestore';
import { writeActivityLog, generateId } from './activityLogService.js';

export async function allocateAsset(assetId, allocatedToUserId, allocatedToDepartmentId, expectedReturnDate, allocatedByUserId) {
  const assetRef = doc(db, "assets", assetId);
  const allocationId = generateId();
  const allocationRef = doc(db, "assetAllocations", allocationId);

  await runTransaction(db, async (transaction) => {
    const assetSnap = await transaction.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset not found");

    const assetData = assetSnap.data();
    if (assetData.status !== "Available") {
      let currentHolderName = "Unknown";
      const currentHolderId = assetData.assignedToUserId;
      if (currentHolderId) {
        const holderSnap = await transaction.get(doc(db, "users", currentHolderId));
        if (holderSnap.exists()) currentHolderName = holderSnap.data().name;
      }
      throw { code: "ALREADY_ALLOCATED", currentHolderName, currentHolderId };
    }

    transaction.set(allocationRef, {
      id: allocationId, assetId, allocatedToUserId, allocatedToDepartmentId, allocatedByUserId,
      allocationDate: serverTimestamp(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      actualReturnDate: null, status: "Active", conditionNotes: ""
    });

    transaction.update(assetRef, {
      status: "Allocated",
      assignedToUserId: allocatedToUserId || null,
      assignedToDepartmentId: allocatedToDepartmentId || null
    });
  });

  await writeActivityLog(allocatedByUserId, "ASSET_ALLOCATION", "assets", assetId,
    `Allocated asset ${assetId} to ${allocatedToUserId || allocatedToDepartmentId}`);
}

export async function requestTransfer(assetId, fromUserId, toUserId, requestedByUserId, reason = "") {
  const id = generateId();
  await setDoc(doc(db, "transferRequests", id), {
    id, assetId, fromUserId, toUserId, requestedByUserId,
    reason,
    approvedByUserId: null, status: "Requested",
    requestedAt: serverTimestamp(), approvedAt: null
  });
  return id;
}

export async function approveTransfer(transferRequestId, approvedByUserId) {
  const approverSnap = await getDoc(doc(db, "users", approvedByUserId));
  if (!approverSnap.exists()) throw new Error("Approver record not found");

  const { role, departmentId } = approverSnap.data();
  if (role !== "AssetManager" && role !== "DeptHead" && role !== "Admin") {
    throw new Error("UNAUTHORIZED: Missing operational permissions.");
  }

  const requestRef = doc(db, "transferRequests", transferRequestId);
  const reqSnapPre = await getDoc(requestRef);
  if (!reqSnapPre.exists() || reqSnapPre.data().status !== "Requested") {
    throw new Error("Transfer request is no longer valid or active.");
  }
  const { assetId, fromUserId, toUserId } = reqSnapPre.data();

  const activeAllocQuery = query(
    collection(db, "assetAllocations"),
    where("assetId", "==", assetId),
    where("allocatedToUserId", "==", fromUserId),
    where("status", "==", "Active")
  );
  const allocSnapPre = await getDocs(activeAllocQuery);
  const oldAllocIds = allocSnapPre.docs.map(d => d.id);

  await runTransaction(db, async (transaction) => {
    const assetRef = doc(db, "assets", assetId);
    const assetSnap = await transaction.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset data not found");

    if (role === "DeptHead" && assetSnap.data().assignedToDepartmentId !== departmentId) {
      throw new Error("UNAUTHORIZED: DeptHeads can only approve transfers within their department.");
    }

    oldAllocIds.forEach((id) => {
      transaction.update(doc(db, "assetAllocations", id), {
        status: "Returned", actualReturnDate: serverTimestamp()
      });
    });

    const newAllocId = generateId();
    transaction.set(doc(db, "assetAllocations", newAllocId), {
      id: newAllocId, assetId, allocatedToUserId: toUserId,
      allocatedToDepartmentId: assetSnap.data().assignedToDepartmentId || null,
      allocatedByUserId: approvedByUserId, allocationDate: serverTimestamp(),
      expectedReturnDate: null, actualReturnDate: null,
      status: "Active", conditionNotes: "Transferred allocation"
    });

    transaction.update(assetRef, { assignedToUserId: toUserId });
    transaction.update(requestRef, { status: "Completed", approvedByUserId, approvedAt: serverTimestamp() });
  });

  await writeActivityLog(approvedByUserId, "TRANSFER_APPROVED", "transferRequests", transferRequestId,
    `Transfer request ${transferRequestId} approved and processed.`);
}

export async function rejectTransfer(transferRequestId) {
  await updateDoc(doc(db, "transferRequests", transferRequestId), { status: "Rejected" });
}

export async function returnAsset(allocationId, conditionNotes = "") {
  const allocationRef = doc(db, "assetAllocations", allocationId);
  const allocSnap = await getDoc(allocationRef);
  if (!allocSnap.exists()) throw new Error("Allocation not found");

  const { assetId, allocatedByUserId } = allocSnap.data();
  const assetRef = doc(db, "assets", assetId);

  await runTransaction(db, async (transaction) => {
    transaction.update(allocationRef, { status: "Returned", actualReturnDate: serverTimestamp(), conditionNotes });
    transaction.update(assetRef, { status: "Available", assignedToUserId: null, assignedToDepartmentId: null });
  });

  await writeActivityLog(allocatedByUserId || "SYSTEM", "ASSET_RETURNED", "assets", assetId,
    `Asset ${assetId} successfully returned.`);
}

export async function flagOverdueAllocations() {
  const now = new Date();
  const q = query(collection(db, "assetAllocations"), where("status", "==", "Active"));
  const snapshot = await getDocs(q);
  const updates = [];
  snapshot.forEach((allocDoc) => {
    const data = allocDoc.data();
    if (data.expectedReturnDate && data.expectedReturnDate.toDate() < now) {
      updates.push(updateDoc(doc(db, "assetAllocations", allocDoc.id), { status: "Overdue" }));
    }
  });
  await Promise.all(updates);
}