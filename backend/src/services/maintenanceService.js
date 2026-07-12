import { db, storage } from '../firebase/config.js';
import { doc, setDoc, updateDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { writeActivityLog, generateId } from './activityLogService.js';

export async function raiseMaintenanceRequest(assetId, requestedByUserId, issueDescription, priority, attachmentFile = null) {
  let attachmentUrl = "";
  if (attachmentFile) {
    const storageRef = ref(storage, `maintenance/${Date.now()}_${attachmentFile.name}`);
    const uploadResult = await uploadBytes(storageRef, attachmentFile);
    attachmentUrl = await getDownloadURL(uploadResult.ref);
  }

  const id = generateId();
  await setDoc(doc(db, "maintenanceRequests", id), {
    id, assetId, requestedByUserId, issueDescription, priority, attachmentUrl,
    status: "Pending", approvedByUserId: null, technicianName: "",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return id;
}

export async function approveMaintenance(requestId, approvedByUserId) {
  const approverSnap = await getDoc(doc(db, "users", approvedByUserId));
  if (!approverSnap.exists() || approverSnap.data().role !== "AssetManager") {
    throw new Error("UNAUTHORIZED: Only Asset Managers can approve maintenance requests.");
  }

  const reqRef = doc(db, "maintenanceRequests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request details missing.");

  const assetId = reqSnap.data().assetId;
  const assetRef = doc(db, "assets", assetId);

  await runTransaction(db, async (transaction) => {
    transaction.update(reqRef, { status: "Approved", approvedByUserId, updatedAt: serverTimestamp() });
    transaction.update(assetRef, { status: "UnderMaintenance" });
  });

  await writeActivityLog(approvedByUserId, "MAINTENANCE_APPROVED", "assets", assetId,
    `Maintenance request approved. Asset moved to repair state.`);
}

export async function rejectMaintenance(requestId) {
  await updateDoc(doc(db, "maintenanceRequests", requestId), { status: "Rejected", updatedAt: serverTimestamp() });
}

export async function assignTechnician(requestId, technicianName) {
  await updateDoc(doc(db, "maintenanceRequests", requestId), {
    status: "TechnicianAssigned", technicianName, updatedAt: serverTimestamp()
  });
}

export async function startWork(requestId) {
  await updateDoc(doc(db, "maintenanceRequests", requestId), { status: "InProgress", updatedAt: serverTimestamp() });
}

export async function resolveMaintenance(requestId, resolvedByUserId) {
  const reqRef = doc(db, "maintenanceRequests", requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request details missing.");

  const assetId = reqSnap.data().assetId;
  const assetRef = doc(db, "assets", assetId);

  await runTransaction(db, async (transaction) => {
    const assetSnap = await transaction.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset not found");

    transaction.update(reqRef, { status: "Resolved", updatedAt: serverTimestamp() });

    const assetStatus = assetSnap.data().status;
    if (assetStatus !== "Retired" && assetStatus !== "Disposed") {
      transaction.update(assetRef, { status: "Available" });
    }
  });

  await writeActivityLog(resolvedByUserId, "MAINTENANCE_RESOLVED", "assets", assetId,
    `Maintenance completed for asset ${assetId}.`);
}