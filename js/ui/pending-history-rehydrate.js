import { state } from '../core/state.js';
import { listOfflineOperations } from '../core/offline-operation-queue.js?v=20260904-offline-v1';
import { createPlayEvent, reconcileStatEvents } from '../calculations/game-event-calculations.js?v=20260902-history-order-v1';
import { planAssistMutation } from '../calculations/assist-play-calculations.js?v=20260906-game-scope-v1';
import { getGameStatsRegistrationType, quarterKey } from '../calculations/stats-calculations.js';

const activeOperations = new Map();
const COMPLETED_GRACE_MS = 2500;
const number = value => Number(value) || 0;

function gameCopies(gameId) {
  const copies = [];
  for (const list of [state.games, state.allGames]) {
    const game = list?.find(item => item.id === gameId);
    if (game && !copies.includes(game)) copies.push(game);
  }
  return copies;
}

function primaryGame(gameId) { return gameCopies(gameId)[0] || null; }
function mirrorGame(gameId, source) { for (const game of gameCopies(gameId)) if (game !== source) Object.assign(game, source); }
function ensureStat(gameId, playerId, seasonId = '') {
  const id = `${gameId}_${playerId}`;
  let stat = state.stats.find(item => item.id === id || (item.gameId === gameId && item.playerId === playerId));
  if (!stat) { stat = {id, gameId, playerId, ...(seasonId ? {seasonId} : {})}; state.stats.push(stat); }
  return stat;
}
function sourceFor(game, stat, quarter) { return getGameStatsRegistrationType(game) === 'quarter' ? (stat.quarters?.[quarterKey(quarter)] || {}) : stat; }
function setSource(game, stat, quarter, next) {
  if (getGameStatsRegistrationType(game) === 'quarter') stat.quarters = {...(stat.quarters || {}), [quarterKey(quarter)]: {...next, registered:true, quarter:Number(quarter)}};
  else Object.assign(stat, next);
}
function historyTotals(game,playerId,quarter){const totals={};for(const event of game.playEvents||[]){if(event.playerId!==playerId)continue;if(getGameStatsRegistrationType(game)==='quarter'&&Number(event.quarter||0)!==Number(quarter||0))continue;if(event.type==='freeThrow'){totals.fta=number(totals.fta)+number(event.attempts);totals.ftm=number(totals.ftm)+number(event.made);continue}if(!['stat','foul','foulReceived'].includes(event.type))continue;const key=event.type==='foul'?'pf':event.type==='foulReceived'?'fouled':event.statKey;if(key)totals[key]=number(totals[key])+1}return totals}
function healedSource(game,stat,quarter){const source={...sourceFor(game,stat,quarter)};for(const [key,total] of Object.entries(historyTotals(game,stat.playerId,quarter)))source[key]=Math.max(number(source[key]),total);return source}
function applyQuickStat(operation) {
  const payload=operation.payload||{}, game=primaryGame(payload.gameId); if(!game||!payload.player?.id)return;
  const stat=ensureStat(payload.gameId,payload.player.id,payload.seasonId), existingIds=new Set((game.playEvents||[]).map(item=>item.id)), missing=(payload.pending||[]).filter(item=>item?.id&&!existingIds.has(item.id)), previous=healedSource(game,stat,payload.quarter), next={...previous};
  for(const item of missing)next[item.statKey]=number(next[item.statKey])+number(item.delta||1);
  const reconciled=reconcileStatEvents({game,player:payload.player,quarter:getGameStatsRegistrationType(game)==='quarter'?payload.quarter:null,previous,next,pending:missing});
  game.playEvents=reconciled.playEvents; setSource(game,stat,payload.quarter,next); mirrorGame(payload.gameId,game);
}
function applyFreeThrow(operation) {
  const payload=operation.payload||{}, game=primaryGame(payload.gameId); if(!game||!payload.player?.id)return;
  const targetId=payload.eventId||payload.operation?.operationId; if(!targetId)return;
  const stat=ensureStat(payload.gameId,payload.player.id,payload.seasonId),existing=(game.playEvents||[]).find(item=>item.id===targetId),previous=healedSource(game,stat,payload.quarter),same=existing&&number(existing.attempts)===number(payload.attempts)&&number(existing.made)===number(payload.made)&&String(existing.remainingSeconds??'')===String(payload.remainingSeconds??''),next={...previous};
  if(!same){next.fta=Math.max(0,number(previous.fta)-number(existing?.attempts)+number(payload.attempts));next.ftm=Math.max(0,number(previous.ftm)-number(existing?.made)+number(payload.made))}
  if(!same){const event=createPlayEvent({...existing,id:targetId,gameId:payload.gameId,quarter:getGameStatsRegistrationType(game)==='quarter'?payload.quarter:null,player:payload.player,type:'freeThrow',attempts:number(payload.attempts),made:number(payload.made),remainingSeconds:payload.remainingSeconds,sequence:existing?.sequence||payload.operation?.sequence||0,createdAt:existing?.createdAt||payload.operation?.createdAt||operation.createdAt});game.playEvents=[...(game.playEvents||[]).filter(item=>item.id!==targetId),event]}
  setSource(game,stat,payload.quarter,next); mirrorGame(payload.gameId,game);
}
function applyAssist(operation) {
  const payload=operation.payload||{}, gameId=payload.game?.id, game=primaryGame(gameId); if(!game||!payload.action)return;
  try { const result=planAssistMutation(game,state.stats,payload.players||[],payload.action); Object.assign(game,result.game); for(const changed of result.stats||[]){const existing=state.stats.find(item=>item.id===changed.id);if(existing)Object.assign(existing,changed);else state.stats.push(changed)} mirrorGame(gameId,game); } catch(error){ console.warn('Pending assist replay skipped',error); }
}
function applyGamePatch(operation){const payload=operation.payload||{};if(!payload.gameId||!payload.data)return;for(const game of gameCopies(payload.gameId))Object.assign(game,payload.data)}
function applyOperation(operation){if(!operation)return;if(operation.type==='quickStat')applyQuickStat(operation);else if(operation.type==='freeThrow')applyFreeThrow(operation);else if(operation.type==='assist')applyAssist(operation);else if(operation.type==='gamePatch')applyGamePatch(operation)}
export function rehydratePendingHistoryState(){const operations=[...activeOperations.values()].map(entry=>entry.operation).filter(Boolean).sort((a,b)=>number(a.createdAt)-number(b.createdAt)||String(a.id).localeCompare(String(b.id)));for(const operation of operations)applyOperation(operation)}
function pruneCompleted(){const now=Date.now();for(const [id,entry] of activeOperations)if(entry.phase==='completed'&&now-number(entry.completedAt)>COMPLETED_GRACE_MS)activeOperations.delete(id)}
async function refreshQueuedOperations(){try{const rows=await listOfflineOperations(),queuedIds=new Set(rows.map(operation=>operation.id));for(const [id,entry] of activeOperations)if(entry.phase==='queued'&&!queuedIds.has(id))activeOperations.delete(id);for(const operation of rows)activeOperations.set(operation.id,{phase:'queued',operation});pruneCompleted();rehydratePendingHistoryState()}catch(error){console.warn('Pending history queue refresh failed',error)}}
window.addEventListener('r32-offline-operation-change',event=>{const detail=event.detail||{},operation=detail.operation;if((detail.action==='started'||detail.action==='queued')&&operation?.id)activeOperations.set(operation.id,{phase:detail.action,operation});else if(detail.action==='completed'&&detail.operationId){const previous=activeOperations.get(detail.operationId);if(previous?.operation){activeOperations.set(detail.operationId,{...previous,phase:'completed',completedAt:Date.now()});setTimeout(()=>{pruneCompleted();rehydratePendingHistoryState()},COMPLETED_GRACE_MS+50)}else activeOperations.delete(detail.operationId)}rehydratePendingHistoryState()});
window.addEventListener('r32-sync-status',()=>refreshQueuedOperations());
window.addEventListener('r32-games-snapshot-applied',()=>{pruneCompleted();rehydratePendingHistoryState()});
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const opensHistory=button.id==='quickHistory'||button.id==='gameHistory'||button.classList.contains('team-history-button')||String(button.getAttribute('onclick')||'').includes('openGameHistory');if(opensHistory){pruneCompleted();rehydratePendingHistoryState()}},true);
refreshQueuedOperations();