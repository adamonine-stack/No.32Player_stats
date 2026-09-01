import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, db } from "../core/firebase.js?v=20260901-fallback-v1";

export function watchPlayers(onData) {
  return onSnapshot(collection(db, "players"), snapshot => {
    onData(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  });
}

export function savePlayer(playerId, data) {
  return setDoc(doc(db, "players", playerId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function deletePlayerDocument(playerId) {
  return deleteDoc(doc(db, "players", playerId));
}

export function savePlayerOrder(playerId, sortOrder) {
  return setDoc(doc(db, "players", playerId), { sortOrder, updatedAt: serverTimestamp() }, { merge: true });
}
