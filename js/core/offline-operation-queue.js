const DB_NAME = 'r32-offline-operations';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

let databasePromise;

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('端末内保存を利用できません。'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('端末内保存を開けません。'));
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
  return [...rows].sort((a, b) => Number(a.createdAt) - Number(b.createdAt) || String(a.id).localeCompare(String(b.id)));
}

export async function removeOfflineOperation(id) {
  await withStore('readwrite', store => store.delete(id));
}

export async function updateOfflineOperation(operation) {
  await withStore('readwrite', store => store.put(operation));
}

export async function offlineOperationCount() {
  return Number(await withStore('readonly', store => store.count())) || 0;
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
