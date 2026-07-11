import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, db } from "../core/firebase.js";

export function watchGames(onData) {
  return onSnapshot(collection(db, "games"), snapshot => {
    onData(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  });
}

export function saveGame(gameId, data) {
  return setDoc(doc(db, "games", gameId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function deleteGameDocument(gameId) {
  return deleteDoc(doc(db, "games", gameId));
}

export function saveGameOrder(gameId, sortOrder) {
  return setDoc(doc(db, "games", gameId), { sortOrder, updatedAt: serverTimestamp() }, { merge: true });
}
