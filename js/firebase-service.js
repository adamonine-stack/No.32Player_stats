import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, collection, addDoc, setDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyDiaAHF0iceYJNlSDKFKtHKnCETeMCW8IA',
  authDomain: 'no32-player-stats.firebaseapp.com',
  projectId: 'no32-player-stats',
  storageBucket: 'no32-player-stats.firebasestorage.app',
  messagingSenderId: '934416639889',
  appId: '1:934416639889:web:cd0e319fa86c1acb3fdc30'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const COLLECTIONS = ['players','games','stats','videos','settings'];

export function listenCollection(name, cb, errCb){
  const q = query(collection(db, name), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({id:d.id, ...d.data()})));
  }, err => {
    console.error(`[Firestore] ${name}`, err);
    if (errCb) errCb(err);
  });
}

export async function saveItem(collectionName, item){
  const payload = {...item, updatedAt: serverTimestamp()};
  if (item.id){
    const {id, ...rest} = payload;
    await setDoc(doc(db, collectionName, id), rest, {merge:true});
    return id;
  }
  payload.createdAt = serverTimestamp();
  const ref = await addDoc(collection(db, collectionName), payload);
  return ref.id;
}

export async function removeItem(collectionName, id){
  await deleteDoc(doc(db, collectionName, id));
}

export async function login(email,password){ return signInWithEmailAndPassword(auth,email,password); }
export async function logout(){ return signOut(auth); }
export function onAuth(cb){ return onAuthStateChanged(auth, cb); }
export { COLLECTIONS };
