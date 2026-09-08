const DB_NAME = 'r32-offline-operations';
import { stampSessionOverlay } from './quarter-session-model.js';
const DB_VERSION = 2;
const STORE_NAME = 'operations';
const OPEN_TIMEOUT_MS = 1500;

let databasePromise;

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('端末内保存を利用できません。'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      databasePromise = undefined;
      finish(reject, new Error('端末内保存の初期化がタイムアウトしました。'));
    }, OPEN_TIMEOUT_MS);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      request.result.onversionchange=()=>{request.result.close();databasePromise=undefined};
      finish(resolve, request.result);
    };
    request.onerror = () => {
      databasePromise = undefined;
      finish(reject, request.error || new Error('端末内保存を開けません。'));
    };
    request.onblocked = () => {
      databasePromise = undefined;
      finish(reject, new Error('端末内保存が別の画面で使用中です。'));
    };
  });
  return databasePromise;
}

async function withStore(mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;
    try { result = callback(store); } catch (error) { reject(error); return; }
    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error || new Error('端末内保存に失敗しました。'));
    transaction.onabort = () => reject(transaction.error || new Error('端末内保存を中断しました。'));
  });
}

export function createOfflineOperation(type, payload, {id, createdAt = Date.now(), ownerUid = ''} = {}) {
  return {
    id: id || crypto.randomUUID(),
    type,
    payload,
    createdAt,
    ownerUid,
    attempts: 0,
    lastError: ''
  };
}

export async function enqueueOfflineOperation(operation) {
  await withStore('readwrite', store => store.put(operation));
  return operation;
}

export async function listOfflineOperations() {
  const rows = await withStore('readonly', store => store.getAll());
  return sortOfflineOperations(rows || []);
}

export function sortOfflineOperations(rows = []) {
  return [...rows].sort((a, b) => Number(a.createdAt) - Number(b.createdAt) || Number(a.localSequence||0)-Number(b.localSequence||0) || String(a.id).localeCompare(String(b.id)));
}

export async function enqueueSessionOperation(operation) {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction([STORE_NAME,'metadata'],'readwrite');
    const metadata=transaction.objectStore('metadata'),request=metadata.get('device');
    request.onsuccess=()=>{
      const previous=request.result||{deviceId:crypto.randomUUID(),localSequence:0,clientCreatedAt:0};
      const clock={deviceId:previous.deviceId,localSequence:previous.localSequence+1,clientCreatedAt:Math.max(Date.now(),previous.clientCreatedAt)};
      metadata.put(clock,'device');
      Object.assign(operation,clock,{operationId:operation.id,createdAt:clock.clientCreatedAt,syncState:'draft',sessionVersion:1});
      operation.historyClock={clientId:`${clock.deviceId}:q${operation.quarter}`,revision:clock.localSequence};
      stampSessionOverlay(operation.overlay,{...clock,operationId:operation.id});
      const scopeKey=`session:${operation.ownerUid}:${operation.gameId}:${operation.quarter}`;
      const head=metadata.get(scopeKey);
      head.onsuccess=()=>{
        operation.predecessorId=head.result||null;
        metadata.put(operation.operationId,scopeKey);
        transaction.objectStore(STORE_NAME).put(operation);
      };
    };
    transaction.oncomplete=()=>resolve(operation);
    transaction.onabort=transaction.onerror=()=>reject(transaction.error||Error('端末への保存に失敗しました。'));
  });
}

export async function removeOfflineOperation(id) {
  await withStore('readwrite', store => store.delete(id));
}

export async function updateOfflineOperation(operation) {
  await withStore('readwrite', store => store.put(operation));
}

export async function markQuarterReady(gameId,quarter,ownerUid) {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,'readwrite'),store=tx.objectStore(STORE_NAME),request=store.getAll();
    request.onsuccess=()=>{for(const op of request.result)if(op.sessionVersion&&op.gameId===gameId&&op.quarter===Number(quarter)&&op.ownerUid===ownerUid&&op.syncState==='draft')store.put({...op,syncState:'ready'})};
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
  });
}

export async function offlineOperationCount() {
  return (await listOfflineOperations()).filter(operation=>!operation.committed).length;
}

export function isRetryableNetworkError(error) {
  const code = String(error?.code || '').replace(/^firestore\//, '');
  const message = String(error?.message || '').toLowerCase();
  return globalThis.navigator?.onLine === false
    || ['unavailable', 'deadline-exceeded', 'network-request-failed'].includes(code)
    || message.includes('offline')
    || message.includes('network error')
    || message.includes('failed to fetch');
}
