import { db } from '../firebase/config.js';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const generateId = () => doc(collection(db, "_")).id;

export async function writeActivityLog(actorUserId, actionType, entityType, entityId, message) {
  const id = generateId();
  const logRef = doc(db, "activityLogs", id);
  await setDoc(logRef, {
    id, actorUserId, actionType, entityType, entityId, message,
    createdAt: serverTimestamp()
  });
}

export { generateId };