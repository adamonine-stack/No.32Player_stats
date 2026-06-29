import { firebaseConfig, useFirebase, firestoreCollection, firestoreDocument } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

const LOCAL_KEY='no32_player_stats_v1';
const initialData={players:[],games:[]};

let app=null;
let db=null;
let auth=null;
let currentUser=null;
let firebaseReady=false;

function cloneInitial(){return typeof structuredClone==='function'?structuredClone(initialData):JSON.parse(JSON.stringify(initialData));}
function localLoad(){const raw=localStorage.getItem(LOCAL_KEY); return raw?JSON.parse(raw):cloneInitial();}
function localSave(data){localStorage.setItem(LOCAL_KEY,JSON.stringify(data));}
function cloudDocRef(){return doc(db, firestoreCollection, firestoreDocument);}

export function isCloudEnabled(){return !!(useFirebase && firebaseReady);}
export function getCurrentUser(){return currentUser;}
export function canEditCloud(){return !isCloudEnabled() || !!currentUser;}

export async function initStorage(onChange){
  if(!useFirebase){return {cloud:false,user:null};}
  try{
    app=initializeApp(firebaseConfig);
    db=getFirestore(app);
    auth=getAuth(app);
    firebaseReady=true;
    onAuthStateChanged(auth, user=>{
      currentUser=user;
      if(onChange) onChange(user);
    });
    return {cloud:true,user:currentUser};
  }catch(e){
    console.warn('Firebase init failed. Fallback to local storage.', e);
    firebaseReady=false;
    return {cloud:false,user:null,error:e};
  }
}

export async function loadData(){
  if(isCloudEnabled()){
    try{
      const snap=await getDoc(cloudDocRef());
      if(snap.exists()){
        const data=snap.data()?.data || cloneInitial();
        localSave(data); // 端末側にもバックアップ
        return data;
      }
      const local=localLoad();
      return local;
    }catch(e){
      console.warn('Cloud load failed. Fallback to local storage.', e);
      return localLoad();
    }
  }
  return localLoad();
}

export async function saveData(data){
  localSave(data); // 常にスマホ内にもバックアップ
  if(isCloudEnabled()){
    if(!currentUser){
      throw new Error('クラウド保存には管理者ログインが必要です。');
    }
    await setDoc(cloudDocRef(), {data, updatedAt: serverTimestamp(), updatedBy: currentUser.email}, {merge:true});
  }
  return true;
}

export async function loginAdmin(email,password){
  if(!isCloudEnabled()) throw new Error('Firebaseが有効ではありません。');
  const result=await signInWithEmailAndPassword(auth,email,password);
  currentUser=result.user;
  return currentUser;
}

export async function logoutAdmin(){
  if(!isCloudEnabled()) return;
  await signOut(auth);
  currentUser=null;
}

export function exportJson(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=`no32-stats-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}
export function importJson(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{try{resolve(JSON.parse(r.result))}catch(e){reject(e)}};r.onerror=reject;r.readAsText(file);});}
