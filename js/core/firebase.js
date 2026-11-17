import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "../config/firebase-config.js";
import { tryEnableFirestorePersistence } from "./firestore-persistence.js?v=20260901-scoped-reads-v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const firestorePersistenceReady = tryEnableFirestorePersistence(enableIndexedDbPersistence, db);

// Auth persistence is useful, but it must never gate loading the application.
// Safari/PWA can leave IndexedDB-backed persistence initialization pending when
// storage is locked or being migrated. Keep startup live and let Auth restore
// its state asynchronously instead of blocking the entire ES module graph.
const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(error => {
  console.warn("Auth persistence unavailable; continuing without blocking startup.", error);
  return false;
});

export {
  app,
  auth,
  db,
  firestorePersistenceReady,
  authPersistenceReady,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
};
