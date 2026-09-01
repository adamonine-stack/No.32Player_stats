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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "../config/firebase-config.js";
import { tryEnableFirestorePersistence } from "./firestore-persistence.js?v=20260901-fallback-v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const firestorePersistenceReady = tryEnableFirestorePersistence(enableIndexedDbPersistence, db);

await setPersistence(auth, browserLocalPersistence);

export {
  app,
  auth,
  db,
  firestorePersistenceReady,
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
  serverTimestamp
};
