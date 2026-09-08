import { HistoryJournal, createHistoryOverlay } from './history-journal.js?v=20260908-quarter-session-v2';
import { state } from './state.js';
import { listOfflineOperations, removeOfflineOperation } from './offline-operation-queue.js?v=20260908-quarter-session-v2';
export { createHistoryOverlay };
const journal=new HistoryJournal();
let ownerUid='';
const owned=operation=>!operation.ownerUid||operation.ownerUid===ownerUid;
export function receiveHistoryDocuments(collection,rows){journal.receive(collection,rows);const result=journal.project(collection,rows);retire();return result}
export function projectLocalHistory(){
  state.allGames=journal.project('games',state.allGames);
  const byId=new Map(state.allGames.map(game=>[game.id,game]));
  state.games=state.games.map(game=>byId.get(game.id)||game);
  state.stats=journal.project('stats',state.stats);
}
function retire(){for(const id of journal.retire())removeOfflineOperation(id).catch(console.error)}
export async function restoreLocalHistory(user){
  ownerUid=user?.uid||'';
  journal.operations.clear();journal.documents.clear();
  if(!user)return;
  for(const operation of await listOfflineOperations())if(owned(operation))journal.start(operation);
  projectLocalHistory();
}
globalThis.addEventListener?.('r32-offline-operation-change',event=>{
  const {action,operation,operationId}=event.detail||{};
  if(operation?.overlay&&owned(operation))journal.start(operation);
  if(action==='completed')journal.complete(operationId);
  if(action==='discarded')journal.operations.delete(operationId);
  projectLocalHistory();retire();
  globalThis.dispatchEvent?.(new CustomEvent('r32-local-history-changed'));
});
