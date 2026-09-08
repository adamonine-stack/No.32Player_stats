import { db, doc, setDoc, serverTimestamp } from './firebase.js?v=20260901-scoped-reads-v1';
import { commitAssistMutation } from './assist-play-store.js?v=20260908-quarter-session-v2';
import { commitQuickFreeThrowMutation, commitQuickStatMutation } from './quick-history-store.js?v=20260908-quarter-session-v2';
import { commitQuarterOperation } from './quarter-session-store.js?v=20260908-quarter-session-v2';
import { sessionScope } from './quarter-session-model.js?v=20260908-quarter-session-v2';
import {
  createOfflineOperation,
  enqueueOfflineOperation,
  enqueueSessionOperation,
  markQuarterReady,
  isRetryableNetworkError,
  listOfflineOperations,
  offlineOperationCount,
  removeOfflineOperation,
  updateOfflineOperation
} from './offline-operation-queue.js?v=20260908-quarter-session-v2';

let syncing = false;
let currentUser = null;
let journalWrites=Promise.resolve();

function announce(detail) {
  globalThis.dispatchEvent?.(new CustomEvent('r32-sync-status', {detail}));
}

function announceOperation(detail) {
  globalThis.dispatchEvent?.(new CustomEvent('r32-offline-operation-change', {detail}));
}

async function status(state, extra = {}) {
  const pending = await offlineOperationCount().catch(() => 0);
  announce({state, pending, online: globalThis.navigator?.onLine !== false, ...extra});
  return pending;
}

async function execute(operation) {
  if (operation.sessionVersion) return commitQuarterOperation(operation);
  const payload = operation.payload || {};
  if (operation.type === 'quickStat') return commitQuickStatMutation(payload);
  if (operation.type === 'freeThrow') return commitQuickFreeThrowMutation(payload);
  if (operation.type === 'assist') return commitAssistMutation(payload.game, payload.stats, payload.players, payload.action, payload.insertion);
  if (operation.type === 'gamePatch') return setDoc(doc(db, 'games', payload.gameId), {...payload.data,...(payload.historyClock?{historyClock:{[payload.historyClock.clientId]:payload.historyClock.revision}}:{}), updatedAt: serverTimestamp()}, {merge: true});
  if (operation.type === 'documentBatch') {
    for (const write of payload.writes || []) {
      await setDoc(doc(db, write.collection, write.id), {...write.data, updatedAt: serverTimestamp()}, {merge: write.merge !== false});
    }
    return;
  }
  throw new Error(`未対応の未同期操作です: ${operation.type}`);
}

export async function submitOfflineCapable(type, payload, onlineAction, options = {}) {
  const operation = createOfflineOperation(type, payload, {...options, ownerUid: currentUser?.uid || ''});
  if(options.overlay){
    Object.assign(operation,sessionScope(type,payload,options));
    operation.overlay=options.overlay;
    const saved=journalWrites.then(()=>enqueueSessionOperation(operation));
    journalWrites=saved.catch(()=>{});
    await saved;
    announceOperation({action:'started',operation});
    void status('pending');
    return {queued:true,operation};
  }
  announceOperation({action: 'started', operation});
  if (globalThis.navigator?.onLine !== false) {
    try {
      const result = await onlineAction();
      announceOperation({action: 'completed', operationId: operation.id});
      return {queued: false, result};
    } catch (error) {
      if (!isRetryableNetworkError(error)) {
        announceOperation({action: 'completed', operationId: operation.id});
        throw error;
      }
    }
  }
  await enqueueOfflineOperation(operation);
  announceOperation({action: 'queued', operation});
  await status('pending');
  if (globalThis.navigator?.onLine !== false) globalThis.setTimeout?.(() => synchronizeOfflineOperations(), 3000);
  return {queued: true, operation};
}

let activeSync;
export function synchronizeOfflineOperations() {
  if(activeSync)return activeSync;
  activeSync=runOfflineSynchronization().finally(()=>{activeSync=null});
  return activeSync;
}
async function runOfflineSynchronization() {
  if (syncing || !currentUser || globalThis.navigator?.onLine === false) {
    await status(globalThis.navigator?.onLine === false ? 'offline' : 'idle');
    return;
  }
  syncing = true;
  let failed = 0,lastBatchCreatedAt=Infinity;
  try {
    const operations = (await listOfflineOperations()).filter(operation => (!operation.ownerUid || operation.ownerUid === currentUser.uid) && (!operation.sessionVersion || operation.syncState!=='draft'));
    lastBatchCreatedAt=operations.at(-1)?.createdAt||Infinity;
    if (!operations.length) { await status('synced'); return; }
    await status('syncing');
    for (const operation of operations) {
      try {
        if(operation.committed){announceOperation({action:'completed',operationId:operation.id});continue}
        await execute(operation);
        // Keep the durable overlay until listeners acknowledge every affected document.
        if(operation.overlay)await updateOfflineOperation({...operation,committed:true,syncState:'synced',lastError:''});
        else await removeOfflineOperation(operation.id);
        announceOperation({action: 'completed', operationId: operation.id});
        await status('syncing');
      } catch (error) {
        failed++;
        await updateOfflineOperation({...operation,syncState:'error', attempts: Number(operation.attempts || 0) + 1, lastError: String(error?.message || error)});
        break; // A dependent edit/delete must never overtake its failed create.
      }
    }
    const pending = await offlineOperationCount();
    await status(pending ? (failed ? 'error' : 'pending') : 'synced', {failed});
  } finally {
    syncing = false;
    const remaining=await listOfflineOperations();
    if(!failed && remaining.some(op=>!op.sessionVersion&&!op.committed && op.createdAt>lastBatchCreatedAt))globalThis.setTimeout?.(()=>synchronizeOfflineOperations(),0);
  }
}

export async function confirmQuarterSession(gameId,quarter) {
  await journalWrites;
  const operations=(await listOfflineOperations()).filter(op=>op.sessionVersion&&op.gameId===gameId&&op.quarter===Number(quarter)&&op.ownerUid===currentUser?.uid&&!op.committed);
  await markQuarterReady(gameId,quarter,currentUser?.uid);
  if(activeSync)await activeSync;
  await synchronizeOfflineOperations();
  const remaining=(await listOfflineOperations()).filter(op=>op.gameId===gameId&&op.quarter===Number(quarter)&&op.ownerUid===currentUser?.uid&&!op.committed);
  if(remaining.length)throw Error(remaining.find(op=>op.lastError)?.lastError||'未同期入力を端末に保持しています。オンラインで再度確定してください。');
  return {count:operations.length};
}

export async function quarterSessionStatus(gameId,quarter) {
  const operations=(await listOfflineOperations()).filter(op=>op.gameId===gameId&&op.quarter===Number(quarter)&&op.ownerUid===currentUser?.uid&&!op.committed);
  return {pending:operations.length,failed:operations.some(op=>op.lastError),syncing:syncing&&operations.some(op=>op.syncState!=='draft')};
}

export async function initializeOfflineSync(user) {
  currentUser = user || null;
  await status(globalThis.navigator?.onLine === false ? 'offline' : 'idle');
  if (currentUser) await synchronizeOfflineOperations();
}

export function installOfflineSyncListeners() {
  globalThis.addEventListener?.('online', () => synchronizeOfflineOperations());
  globalThis.addEventListener?.('offline', () => status('offline'));
}

export { offlineOperationCount };
