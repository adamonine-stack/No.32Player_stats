import { db, doc, getDoc, setDoc, serverTimestamp } from './firebase.js?v=20260901-scoped-reads-v1';
import { commitAssistMutation } from './assist-play-store.js?v=20260908-quarter-session-v2';
import { commitQuickFreeThrowMutation, commitQuickStatMutation } from './quick-history-store.js?v=20260908-quarter-session-v2';
import { commitQuarterOperation } from './quarter-session-store.js?v=20260916-history-rebase-v1';
import { sessionScope } from './quarter-session-model.js?v=20260916-history-rebase-v1';
import {
  compactRedundantSessionOperations,
  createOfflineOperation,
  enqueueOfflineOperation,
  enqueueSessionOperation,
  markQuarterReady,
  isRetryableNetworkError,
  listOfflineOperations,
  offlineOperationCount,
  removeOfflineOperation,
  removeOfflineOperationSafely,
  updateOfflineOperation
} from './offline-operation-queue.js?v=20260920-pending-manager-v1';

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

async function compactCurrentPendingOperations() {
  if(!currentUser)return {removed:0,removedIds:[]};
  const compacted=await compactRedundantSessionOperations(currentUser.uid).catch(error=>{console.warn('Offline pending cleanup failed',error);return {removed:0,removedIds:[]}});
  for(const operationId of compacted.removedIds||[])announceOperation({action:'discarded',operationId});
  return compacted;
}

function operationTargetGameId(operation={}) {
  const overlayGame=(operation.overlay?.documents||[]).find(item=>String(item?.key||'').startsWith('games/'));
  return operation.gameId||operation.payload?.gameId||operation.payload?.game?.id||(overlayGame?String(overlayGame.key).slice('games/'.length):'');
}

async function operationTargetGameExists(operation={}) {
  const gameId=operationTargetGameId(operation);
  if(!gameId)return true;
  const snapshot=await getDoc(doc(db,'games',gameId));
  return snapshot.exists();
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
  if(options.overlay && (options.overlay.documents||[]).every(change=>!change.patch)) {
    return {queued:false, result:null, noop:true};
  }
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
        if(!(await operationTargetGameExists(operation))){await removeOfflineOperation(operation.id);announceOperation({action:'discarded',operationId:operation.id});await status('syncing');continue}
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


function pendingOperationReason(operation={}) {
  const raw=String(operation.lastError||'').trim();
  const lower=raw.toLowerCase();
  if(raw.includes('前の入力'))return {code:'predecessor',message:'前の入力がまだ同期されていないため、この入力は待機しています。',technical:raw};
  if(raw.includes('試合が見つかりません'))return {code:'missing-game',message:'対象の試合がサーバー側で見つからないため同期できません。',technical:raw};
  if(raw.includes('登録方式が変更'))return {code:'registration-changed',message:'試合の登録方式が保存時から変更されているため、安全のため同期を停止しています。',technical:raw};
  if(lower.includes('permission-denied')||raw.includes('権限'))return {code:'permission',message:'サーバーへの書き込み権限が拒否されています。ログイン状態や権限を確認してください。',technical:raw};
  if(lower.includes('network')||lower.includes('offline')||lower.includes('failed to fetch')||lower.includes('unavailable'))return {code:'network',message:'通信エラーのため同期できません。ネットワーク接続を確認してください。',technical:raw};
  if(raw)return {code:'server-error',message:raw,technical:raw};
  if(operation.syncState==='draft')return {code:'draft',message:'Qがまだ確定されていないため、同期待ちになっています。',technical:''};
  if(operation.syncState==='error')return {code:'error',message:'同期処理でエラーが発生しています。再同期して詳細を確認してください。',technical:''};
  if(operation.predecessorId)return {code:'waiting',message:'前の入力の同期完了を待っています。',technical:''};
  return {code:'pending',message:'同期待ちの入力です。',technical:''};
}

function pendingOperationSummary(operation={}) {
  const action=operation.payload?.action||{};
  if(operation.type==='gamePatch'){
    const data=operation.payload?.data||{},qk=`q${Number(operation.quarter)||1}`;
    if(data.quarterParticipation?.[qk]?.starters)return '開始5人・出場情報の保存';
    if(data.temporaryPlayers)return '未登録選手の保存';
    return '試合情報の更新';
  }
  if(action.kind==='saveShot')return 'シュート登録';
  if(action.kind==='delete')return '履歴削除';
  if(action.kind==='edit')return '履歴修正';
  if(action.kind==='substitution')return '選手交代';
  if(operation.type==='quickStat')return 'クイックスタッツ登録';
  if(operation.type==='freeThrow')return 'フリースロー登録';
  if(operation.type==='assist')return action.kind?String(action.kind):'スタッツ登録';
  if(operation.type==='documentBatch')return '一括データ更新';
  return String(operation.type||'未同期入力');
}

function pendingOperationView(operation={}) {
  const reason=pendingOperationReason(operation);
  return {
    id:operation.id,
    operationId:operation.operationId||operation.id,
    gameId:operationTargetGameId(operation),
    quarter:Number(operation.quarter)||null,
    type:operation.type||'',
    summary:pendingOperationSummary(operation),
    createdAt:Number(operation.createdAt)||0,
    syncState:operation.syncState||'pending',
    attempts:Number(operation.attempts)||0,
    predecessorId:operation.predecessorId||'',
    ownerMissing:!operation.ownerUid,
    reasonCode:reason.code,
    reason:reason.message,
    technicalError:reason.technical
  };
}

export async function listPendingOperations() {
  await journalWrites;
  if(!currentUser)return [];
  return (await listOfflineOperations())
    .filter(operation=>(!operation.ownerUid||operation.ownerUid===currentUser.uid)&&!operation.committed)
    .map(pendingOperationView);
}

export async function retryPendingOperation(operationId) {
  await journalWrites;
  if(!currentUser)throw new Error('ログインが必要です。');
  const operation=(await listOfflineOperations()).find(item=>item.id===operationId&&(!item.ownerUid||item.ownerUid===currentUser.uid)&&!item.committed);
  if(!operation)throw new Error('対象の未同期入力が見つかりません。');
  if(operation.sessionVersion){
    await markQuarterReady(operation.gameId,operation.quarter,currentUser.uid);
  }else if(operation.syncState==='error'){
    await updateOfflineOperation({...operation,syncState:'ready',lastError:''});
  }
  if(activeSync)try{await activeSync}catch{}
  await synchronizeOfflineOperations();
  const remaining=(await listOfflineOperations()).find(item=>item.id===operationId&&!item.committed);
  return remaining?{synced:false,operation:pendingOperationView(remaining)}:{synced:true};
}

export async function deletePendingOperation(operationId) {
  await journalWrites;
  if(!currentUser)throw new Error('ログインが必要です。');
  if(activeSync)try{await activeSync}catch{}
  const target=(await listOfflineOperations()).find(item=>item.id===operationId&&(!item.ownerUid||item.ownerUid===currentUser.uid)&&!item.committed);
  if(!target)throw new Error('対象の未同期入力が見つかりません。');
  const result=await removeOfflineOperationSafely(operationId,currentUser.uid);
  if(result.removed)announceOperation({action:'discarded',operationId});
  await status(globalThis.navigator?.onLine===false?'offline':'idle');
  return {removed:Boolean(result.removed),rewired:Number(result.rewired)||0};
}

export async function discardPendingOperationsForGame(gameId) {
  await journalWrites;
  if (!gameId) return {discarded: 0};
  if (activeSync) {
    try { await activeSync; } catch {}
  }
  const operations = (await listOfflineOperations()).filter(operation =>
    operation.gameId === gameId ||
    operation.payload?.gameId === gameId ||
    operation.payload?.game?.id === gameId
  );
  for (const operation of operations) {
    await removeOfflineOperation(operation.id);
    announceOperation({action: 'discarded', operationId: operation.id});
  }
  await status(globalThis.navigator?.onLine === false ? 'offline' : 'idle');
  return {discarded: operations.length};
}

export async function confirmAllPendingSessions() {
  await journalWrites;
  if (!currentUser) {
    const pending = await status('idle');
    return {sessions: 0, pending};
  }
  await compactCurrentPendingOperations();
  const operations = await listOfflineOperations();
  const drafts = operations.filter(operation =>
    operation.sessionVersion &&
    (!operation.ownerUid || operation.ownerUid === currentUser.uid) &&
    !operation.committed &&
    operation.syncState === 'draft'
  );
  const scopes = [...new Map(drafts.map(operation => {
    const quarter = Number(operation.quarter);
    return [`${operation.gameId}:${quarter}`, {gameId: operation.gameId, quarter}];
  })).values()];
  for (const scope of scopes) await markQuarterReady(scope.gameId, scope.quarter, currentUser.uid);
  if (activeSync) await activeSync;
  await synchronizeOfflineOperations();
  const remaining = (await listOfflineOperations()).filter(operation =>
    (!operation.ownerUid || operation.ownerUid === currentUser.uid) &&
    !operation.committed
  );
  return {sessions: scopes.length, pending: remaining.length};
}

export async function confirmQuarterSession(gameId,quarter) {
  await journalWrites;
  await compactCurrentPendingOperations();
  const operations=(await listOfflineOperations()).filter(op=>op.sessionVersion&&op.gameId===gameId&&op.quarter===Number(quarter)&&(!op.ownerUid||op.ownerUid===currentUser?.uid)&&!op.committed);
  await markQuarterReady(gameId,quarter,currentUser?.uid);
  if(activeSync)await activeSync;
  await synchronizeOfflineOperations();
  const remaining=(await listOfflineOperations()).filter(op=>op.gameId===gameId&&op.quarter===Number(quarter)&&(!op.ownerUid||op.ownerUid===currentUser?.uid)&&!op.committed);
  if(remaining.length)throw Error(remaining.find(op=>op.lastError)?.lastError||'未同期入力を端末に保持しています。オンラインで再度確定してください。');
  return {count:operations.length};
}

export async function quarterSessionStatus(gameId,quarter) {
  const operations=(await listOfflineOperations()).filter(op=>op.gameId===gameId&&op.quarter===Number(quarter)&&(!op.ownerUid||op.ownerUid===currentUser?.uid)&&!op.committed);
  return {pending:operations.length,failed:operations.some(op=>op.lastError),syncing:syncing&&operations.some(op=>op.syncState!=='draft')};
}

export async function initializeOfflineSync(user) {
  currentUser = user || null;
  if(currentUser)await compactCurrentPendingOperations();
  await status(globalThis.navigator?.onLine === false ? 'offline' : 'idle');
  if (currentUser) await synchronizeOfflineOperations();
}

export function installOfflineSyncListeners() {
  globalThis.addEventListener?.('online', () => synchronizeOfflineOperations());
  globalThis.addEventListener?.('offline', () => status('offline'));
}

export { offlineOperationCount };
