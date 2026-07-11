import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, db } from "../core/firebase.js";

export function watchStats(onData) {
  return onSnapshot(collection(db, "stats"), snapshot => {
    onData(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  });
}

export function saveStats(statsId, data) {
  return setDoc(doc(db, "stats", statsId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function deleteStatsDocument(statsId) {
  return deleteDoc(doc(db, "stats", statsId));
}
