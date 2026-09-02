import { runTransaction } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db, doc, serverTimestamp } from './firebase.js?v=20260901-scoped-reads-v1';
import { createPlayEvent, reconcileStatEvents } from '../calculations/game-event-calculations.js?v=20260902-history-order-v1';

const number = value => Number(value) || 0;
const qKey = quarter => `q${Number(quarter)}`;
const isMap = value => value != null && typeof value === 'object' && !Array.isArray(value);
const quarterMode = game => game.statsRegistrationType === 'quarter';

function sourceFor(game, stat, quarter) {
  if (!quarterMode(game)) return stat;
  return isMap(stat.quarters?.[qKey(quarter)]) ? stat.quarters[qKey(quarter)] : {};
}

function statWithSource(game, stat, quarter, source) {
  if (!quarterMode(game)) return {...stat, ...source, quarters: game.quarters || 4};
  const quarters = isMap(stat.quarters) ? {...stat.quarters} : {};
  quarters[qKey(quarter)] = {...source, registered: true, quarter: Number(quarter)};
  return {...stat, quarters};
}

export async function commitQuickStatMutation({gameId, player, quarter, changes, pending, seasonId}) {
  return runTransaction(db, async transaction => {
    const gameRef=doc(db,'games',gameId),statRef=doc(db,'stats',`${gameId}_${player.id}`);
    const [gameSnap,statSnap]=await Promise.all([transaction.get(gameRef),transaction.get(statRef)]);
    if(!gameSnap.exists())throw new Error('試合が見つかりません。');
    const game={id:gameId,...gameSnap.data()},stat=statSnap.exists()?{id:statSnap.id,...statSnap.data()}:{id:statSnap.id,gameId,playerId:player.id};
    const ids=new Set((game.playEvents||[]).map(item=>item.id));
    if(pending.length&&pending.every(item=>ids.has(item.id)))return {game,stat,addedIds:pending.map(item=>item.id)};
    const previous=sourceFor(game,stat,quarter),next={...previous};
    for(const [key,delta] of Object.entries(changes))next[key]=number(previous[key])+delta;
    const reconciled=reconcileStatEvents({game,player,quarter:quarterMode(game)?quarter:null,previous,next,pending});
    const nextStat=statWithSource(game,stat,quarter,next),nextGame={...game,playEvents:reconciled.playEvents};
    const {id,...statData}=nextStat;
    transaction.set(statRef,{...statData,...(seasonId?{seasonId}:{}),updatedAt:serverTimestamp()},{merge:true});
    transaction.set(gameRef,{playEvents:nextGame.playEvents,updatedAt:serverTimestamp()},{merge:true});
    return {game:nextGame,stat:nextStat,addedIds:reconciled.added.map(item=>item.id)};
  });
}

export async function commitQuickFreeThrowMutation({gameId, player, quarter, attempts, made, remainingSeconds, operation, eventId=null, seasonId}) {
  return runTransaction(db, async transaction => {
    const gameRef=doc(db,'games',gameId),statRef=doc(db,'stats',`${gameId}_${player.id}`);
    const [gameSnap,statSnap]=await Promise.all([transaction.get(gameRef),transaction.get(statRef)]);
    if(!gameSnap.exists())throw new Error('試合が見つかりません。');
    const game={id:gameId,...gameSnap.data()},stat=statSnap.exists()?{id:statSnap.id,...statSnap.data()}:{id:statSnap.id,gameId,playerId:player.id};
    const targetId=eventId||operation.operationId,existing=(game.playEvents||[]).find(item=>item.id===targetId);
    if(!eventId&&existing)return {game,stat,event:existing,addedIds:[targetId]};
    const previous=sourceFor(game,stat,quarter),oldAttempts=number(existing?.attempts),oldMade=number(existing?.made);
    const next={...previous,fta:Math.max(0,number(previous.fta)-oldAttempts+attempts),ftm:Math.max(0,number(previous.ftm)-oldMade+made)};
    const event=createPlayEvent({...(existing||{}),id:targetId,gameId,quarter:quarterMode(game)?quarter:null,player,type:'freeThrow',attempts,made,remainingSeconds,sequence:existing?.sequence||operation.sequence,createdAt:existing?.createdAt||operation.createdAt});
    const nextGame={...game,playEvents:[...(game.playEvents||[]).filter(item=>item.id!==targetId),event]},nextStat=statWithSource(game,stat,quarter,next),{id,...statData}=nextStat;
    transaction.set(statRef,{...statData,...(seasonId?{seasonId}:{}),updatedAt:serverTimestamp()},{merge:true});
    transaction.set(gameRef,{playEvents:nextGame.playEvents,updatedAt:serverTimestamp()},{merge:true});
    return {game:nextGame,stat:nextStat,event,addedIds:eventId?[]:[targetId]};
  });
}
