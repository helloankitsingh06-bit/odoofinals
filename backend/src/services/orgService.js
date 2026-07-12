import { db } from '../firebase/config.js';
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { writeActivityLog, generateId } from './activityLogService.js';

export async function createDepartment(name, headUserId = null, parentDepartmentId = null) {
  const id = generateId();
  await setDoc(doc(db, "departments", id), {
    id, name, headUserId, parentDepartmentId, status: "Active"
  });
  return id;
}

export async function editDepartment(id, updates) {
  await updateDoc(doc(db, "departments", id), updates);
}

export async function deactivateDepartment(id) {
  await updateDoc(doc(db, "departments", id), { status: "Inactive" });
}

export async function createCategory(name, description, customFields = {}) {
  const id = generateId();
  await setDoc(doc(db, "assetCategories", id), {
    id, name, description, customFields, status: "Active"
  });
  return id;
}

export async function editCategory(id, updates) {
  await updateDoc(doc(db, "assetCategories", id), updates);
}

export async function listEmployees() {
  const q = query(collection(db, "users"), where("status", "==", "Active"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
}

export async function promoteUser(callerUid, targetUid, newRole) {
  const callerSnap = await getDoc(doc(db, "users", callerUid));
  if (!callerSnap.exists() || callerSnap.data().role !== "Admin") {
    throw new Error("UNAUTHORIZED: Only Admins can modify security groups.");
  }
  await updateDoc(doc(db, "users", targetUid), { role: newRole });
  await writeActivityLog(callerUid, "USER_PROMOTION", "users", targetUid, `Promoted user role to ${newRole}`);
}