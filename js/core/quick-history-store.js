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

function eventMatches(game, event, playerId, quarter) {
  if (event?.playerId !== playerId) return false;
  return !quarterMode(game) || Number(event.quarter || 0) === Number(quarter || 0);
}

function storedEventTotals(game, playerId, quarter) {
  const totals = {};
  for (const event of game.playEvents || []) {
    if (!eventMatches(game, event, playerId, quarter)) continue;
    if (event.type === 'freeThrow') {
      totals.fta = number(totals.fta) + number(event.attempts);
      totals.ftm = number(totals.ftm) + number(event.made);
      continue;
    }
    if (!['stat', 'foul', 'foulReceived'].includes(event.type)) continue;
    const key = event.type === 'foul' ? 'pf' : event.type === 'foulReceived' ? 'fouled' : event.statKey;
    if (key) totals[key] = number(totals[key]) + 1;
  }
  return totals;
}

function healSourceFromHistory(game, stat, quarter) {
  const source = sourceFor(game, stat, quarter), totals = storedEventTotals(game, stat.playerId, quarter), healed = {...source};
  for (const [key, total] of Object.entries(totals)) healed[key] = Math.max(number(healed[key]), total);
  return healed;
}

export async function commitQuickStatMutation({gameId, player, quarter, changes, pending, seasonId, historyClock}) {
  return runTransaction(db, async transaction => {
    const gameRef=doc(db,'games',gameId),statRef=doc(db,'stats',`${gameId}_${player.id}`);
    const [gameSnap,statSnap]=await Promise.all([transaction.get(gameRef),transaction.get(statRef)]);
    if(!gameSnap.exists())throw new Error('試合が見つかりません。');
    const game={id:gameId,...gameSnap.data()},stat=statSnap.exists()?{id:statSnap.id,...statSnap.data()}:{id:statSnap.id,gameId,playerId:player.id};
    if(historyClock&&Number(game.historyClock?.[historyClock.clientId]||0)>=historyClock.revision)return {game,stat,addedIds:[]};
    const ids=new Set((game.playEvents||[]).map(item=>item.id)),missing=(pending||[]).filter(item=>item?.id&&!ids.has(item.id));
    const previous=healSourceFromHistory(game,stat,quarter),next={...previous};
    for(const item of missing)next[item.statKey]=number(next[item.statKey])+number(item.delta||1);
    const reconciled=reconcileStatEvents({game,player,quarter:quarterMode(game)?quarter:null,previous,next,pending:missing});
    const nextStat=statWithSource(game,stat,quarter,next),nextGame={...game,playEvents:reconciled.playEvents};
    const {id,...statData}=nextStat;
    transaction.set(statRef,{...statData,...(historyClock?{historyClock:{...(stat.historyClock||{}),[historyClock.clientId]:historyClock.revision}}:{}),...(seasonId?{seasonId}:{}),updatedAt:serverTimestamp()},{merge:true});
    if(historyClock||reconciled.added.length||reconciled.removed.length)transaction.set(gameRef,{playEvents:nextGame.playEvents,...(historyClock?{historyClock:{...(game.historyClock||{}),[historyClock.clientId]:historyClock.revision}}:{}),updatedAt:serverTimestamp()},{merge:true});
    return {game:nextGame,stat:nextStat,addedIds:(pending||[]).map(item=>item.id).filter(Boolean)};
  });
}

export async function commitQuickFreeThrowMutation({gameId, player, quarter, attempts, made, remainingSeconds, operation, eventId=null, seasonId, historyClock}) {
  return runTransaction(db, async transaction => {
    const gameRef=doc(db,'games',gameId),statRef=doc(db,'stats',`${gameId}_${player.id}`);
    const [gameSnap,statSnap]=await Promise.all([transaction.get(gameRef),transaction.get(statRef)]);
    if(!gameSnap.exists())throw new Error('試合が見つかりません。');
    const game={id:gameId,...gameSnap.data()},stat=statSnap.exists()?{id:statSnap.id,...statSnap.data()}:{id:statSnap.id,gameId,playerId:player.id};
    if(historyClock&&Number(game.historyClock?.[historyClock.clientId]||0)>=historyClock.revision)return {game,stat,event:(game.playEvents||[]).find(e=>e.id===(eventId||operation.operationId)),addedIds:[]};
    const targetId=eventId||operation.operationId,existing=(game.playEvents||[]).find(item=>item.id===targetId);
    const previous=healSourceFromHistory(game,stat,quarter),oldAttempts=number(existing?.attempts),oldMade=number(existing?.made);
    const next={...previous,fta:Math.max(0,number(previous.fta)-oldAttempts+attempts),ftm:Math.max(0,number(previous.ftm)-oldMade+made)};
    const event=createPlayEvent({...(existing||{}),id:targetId,gameId,quarter:quarterMode(game)?quarter:null,player,type:'freeThrow',attempts,made,remainingSeconds,sequence:existing?.sequence||operation.sequence,createdAt:existing?.createdAt||operation.createdAt});
    const sameEvent=existing&&number(existing.attempts)===number(attempts)&&number(existing.made)===number(made)&&String(existing.remainingSeconds??'')===String(remainingSeconds??'');
    const nextGame=sameEvent?game:{...game,playEvents:[...(game.playEvents||[]).filter(item=>item.id!==targetId),event]},nextStat=statWithSource(game,stat,quarter,next),{id,...statData}=nextStat;
    transaction.set(statRef,{...statData,...(historyClock?{historyClock:{...(stat.historyClock||{}),[historyClock.clientId]:historyClock.revision}}:{}),...(seasonId?{seasonId}:{}),updatedAt:serverTimestamp()},{merge:true});
    if(historyClock||!sameEvent)transaction.set(gameRef,{playEvents:nextGame.playEvents,...(historyClock?{historyClock:{...(game.historyClock||{}),[historyClock.clientId]:historyClock.revision}}:{}),updatedAt:serverTimestamp()},{merge:true});
    return {game:nextGame,stat:nextStat,event:existing&&sameEvent?existing:event,addedIds:eventId?[]:[targetId]};
  });
}
