import { db, doc, setDoc, serverTimestamp } from './firebase.js?v=20260901-scoped-reads-v1';
import { commitAssistMutation } from './assist-play-store.js?v=20260902-history-order-v1';
import { commitQuickFreeThrowMutation, commitQuickStatMutation } from './quick-history-store.js?v=20260902-history-order-v1';
import {
  createOfflineOperation,
  enqueueOfflineOperation,
  isRetryableNetworkError,
  listOfflineOperations,
  offlineOperationCount,
  removeOfflineOperation,
  updateOfflineOperation
} from './offline-operation-queue.js?v=20260904-offline-v1';

let syncing = false;
let currentUser = null;

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
  const payload = operation.payload || {};
  if (operation.type === 'quickStat') return commitQuickStatMutation(payload);
  if (operation.type === 'freeThrow') return commitQuickFreeThrowMutation(payload);
  if (operation.type === 'assist') return commitAssistMutation(payload.game, payload.stats, payload.players, payload.action, payload.insertion);
  if (operation.type === 'gamePatch') return setDoc(doc(db, 'games', payload.gameId), {...payload.data, updatedAt: serverTimestamp()}, {merge: true});
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

export async function synchronizeOfflineOperations() {
  if (syncing || !currentUser || globalThis.navigator?.onLine === false) {
    await status(globalThis.navigator?.onLine === false ? 'offline' : 'idle');
    return;
  }
  syncing = true;
  let failed = 0;
  try {
    const operations = (await listOfflineOperations()).filter(operation => !operation.ownerUid || operation.ownerUid === currentUser.uid);
    if (!operations.length) { await status('synced'); return; }
    await status('syncing');
    for (const operation of operations) {
      try {
        await execute(operation);
        // A successfully acknowledged operation is removed immediately so
        // synchronized stat payloads never accumulate on the device.
        await removeOfflineOperation(operation.id);
        announceOperation({action: 'completed', operationId: operation.id});
        await status('syncing');
      } catch (error) {
        if (isRetryableNetworkError(error)) break;
        failed++;
        await updateOfflineOperation({...operation, attempts: Number(operation.attempts || 0) + 1, lastError: String(error?.message || error)});
      }
    }
    const pending = await offlineOperationCount();
    await status(pending ? (failed ? 'error' : 'pending') : 'synced', {failed});
  } finally {
    syncing = false;
  }
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
