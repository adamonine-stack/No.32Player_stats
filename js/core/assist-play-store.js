import { runTransaction } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db,doc,serverTimestamp } from './firebase.js';
import { planAssistMutation } from '../calculations/assist-play-calculations.js?v=20260831-assist-v1';
import { buildGameHistory,historyInsertionOverrides } from '../calculations/game-event-calculations.js?v=20260831-assist-v1';

function clean(value) {
  if(Array.isArray(value))return value.map(clean);
  if(value && Object.getPrototypeOf(value)===Object.prototype)return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)]));
  return value;
}
export async function commitAssistMutation(game,stats,players,action,insertion=null) {
  const request={...action,now:Date.now(),playId:crypto.randomUUID(),assistId:crypto.randomUUID()};
  const ids=[...new Set([...stats.filter(s=>s.gameId===game.id).map(s=>s.id),...players.map(p=>`${game.id}_${p.id}`)])];
  return runTransaction(db,async transaction=>{
    const gameRef=doc(db,'games',game.id),gameSnap=await transaction.get(gameRef);
    if(!gameSnap.exists())throw new Error('試合が見つかりません。');
    const snapshots=await Promise.all(ids.map(id=>transaction.get(doc(db,'stats',id))));
    const latest={...gameSnap.data(),id:game.id},latestStats=snapshots.filter(s=>s.exists()).map(s=>({...s.data(),id:s.id}));
    const result=planAssistMutation(latest,latestStats,players,request);
    const gamePatch={playEvents:result.game.playEvents,updatedAt:serverTimestamp()};
    if(insertion?.returnToHistory&&result.addedIds.length) {
      const combined=[...latestStats.filter(s=>!result.stats.some(n=>n.id===s.id)),...result.stats];
      gamePatch.eventSequenceOverrides=historyInsertionOverrides(buildGameHistory(result.game,combined,players),result.addedIds,insertion.insertAfterId);
      result.game.eventSequenceOverrides=gamePatch.eventSequenceOverrides;
    }
    for(const stat of result.stats){const {id,...data}=stat;const seasonId=data.seasonId||latest.seasonId||game.seasonId;transaction.set(doc(db,'stats',id),clean({...data,...(seasonId?{seasonId}:{}),updatedAt:serverTimestamp()}),{merge:true})}
    transaction.set(gameRef,gamePatch,{merge:true});
    return result;
  });
}
