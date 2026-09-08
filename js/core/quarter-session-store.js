import { runTransaction } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db,doc,serverTimestamp } from './firebase.js?v=20260901-scoped-reads-v1';
import { projectSessionDocument } from './quarter-session-model.js';
import { assertStatsBaseline } from './normal-stats-guard.js';

const clean=value=>Array.isArray(value)?value.map(clean):value&&Object.getPrototypeOf(value)===Object.prototype?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)])):value;

// Receipt and every affected document commit together. A lost response can
// always be retried with the original operation ID, including edits/deletes.
export async function commitQuarterOperation(operation) {
  return runTransaction(db,async transaction=>{
    const receiptRef=doc(db,'inputOperations',operation.operationId);
    const receipt=await transaction.get(receiptRef);
    const changes=operation.overlay.documents;
    const refs=changes.map(change=>doc(db,...change.key.split('/')));
    const snapshots=await Promise.all(refs.map(ref=>transaction.get(ref)));
    if (!snapshots[0].exists()) throw new Error('試合が見つかりません。未確定入力を保持しています。');
    if (receipt.exists()) return {duplicate:true};
    if(operation.predecessorId){
      const predecessor=await transaction.get(doc(db,'inputOperations',operation.predecessorId));
      if(!predecessor.exists())throw Error('前の入力を同期中です。少し待ってから再度確定してください。');
    }
    const game={...snapshots[0].data(),id:snapshots[0].id};
    if(game.statsRegistrationType!==changes[0].before.statsRegistrationType)throw Error('試合の登録方式が変更されています。未確定入力を保持しています。');
    if(operation.payload?.action?.kind==='reconcileStats'){
      const action=operation.payload.action;
      const baselineKey=`stats/${action.baseline?.statId}`;
      const baselineSnapshot=changes.some(change=>change.key===baselineKey)?null:await transaction.get(doc(db,'stats',action.baseline.statId));
      const statSnapshots=[...snapshots.slice(1),...(baselineSnapshot?[baselineSnapshot]:[])];
      assertStatsBaseline(action.baseline,game,statSnapshots.filter(s=>s.exists()).map(s=>({...s.data(),id:s.id})),action);
    }
    for(let index=0;index<changes.length;index++) {
      const change=changes[index],snapshot=snapshots[index];
      const current=snapshot.exists()?{...snapshot.data(),id:snapshot.id}:undefined;
      const projected=projectSessionDocument(current,change);
      const {id,...data}=projected;
      const clock=operation.historyClock;
      transaction.set(refs[index],clean({...data,historyClock:{...(current?.historyClock||{}),[clock.clientId]:clock.revision},updatedAt:serverTimestamp()}),{merge:true});
    }
    transaction.set(receiptRef,clean({operationId:operation.operationId,gameId:operation.gameId,quarter:operation.quarter,deviceId:operation.deviceId,clientCreatedAt:operation.clientCreatedAt,localSequence:operation.localSequence,type:operation.type,ownerUid:operation.ownerUid,syncState:'synced',changes:changes.map(({key,patch})=>({key,patch})),committedAt:serverTimestamp()}));
    return {duplicate:false};
  });
}
