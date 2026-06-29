import { firebaseConfig, useFirebase } from './firebase-config.js';

const LOCAL_KEY='no32_player_stats_v1';
const initialData={players:[],games:[]};

export async function loadData(){
  // Ver1.0はローカル保存を標準。Firebaseを有効化する場合はここにFirestore読込を追加。
  const raw=localStorage.getItem(LOCAL_KEY);
  return raw?JSON.parse(raw):structuredClone(initialData);
}
export async function saveData(data){localStorage.setItem(LOCAL_KEY,JSON.stringify(data));return true;}
export function exportJson(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=`no32-stats-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}
export function importJson(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{try{resolve(JSON.parse(r.result))}catch(e){reject(e)}};r.onerror=reject;r.readAsText(file);});}
