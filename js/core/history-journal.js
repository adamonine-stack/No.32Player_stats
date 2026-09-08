// Pure projection: server documents + ordered local changes. No timers or reads.
const clone = value => structuredClone(value);
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const map = value => value && typeof value === 'object' && !Array.isArray(value);
const keyed = value => Array.isArray(value) && value.every(item => item && typeof item.id === 'string');
function diff(before, after, field='') {
  if (equal(before,after)) return null;
  if (keyed(after) && (before == null || keyed(before))) {
    const old = new Map((before || []).map(item=>[item.id,item]));
    return {kind:'rows', removed:[...old.keys()].filter(id=>!after.some(item=>item.id===id)), rows:after.filter(item=>!equal(old.get(item.id),item)).map(clone)};
  }
  if (map(after)) {
    const fields={};
    for (const key of Object.keys(after)) {
      if (['updatedAt','historyClock'].includes(key)) continue;
      const change=diff(map(before)?before[key]:undefined,after[key],key);
      if(change)fields[key]=change;
    }
    return {kind:'map',fields};
  }
  // Counters are deltas; another device's increment must remain intact.
  if(['twoPa','twoPm','threePa','threePm','fta','ftm','ast','or','dr','blk','pf','fouled','shotFouledCount','passCut','dribbleCut','stealOther','passMiss','dribbleMiss','catchMiss','violation','otherTo'].includes(field) && typeof after==='number' && (before==null || typeof before==='number'))return {kind:'number',value:after,delta:after-(before||0)};
  return {kind:'value',value:clone(after)};
}
export function applyHistoryPatch(value, patch) {
  if(!patch)return value;
  if(patch.kind==='rows')return [...(Array.isArray(value)?value:[]).filter(item=>!patch.removed.includes(item.id)&&!patch.rows.some(row=>row.id===item.id)),...clone(patch.rows)];
  if(patch.kind==='map'){const result=map(value)?clone(value):{};for(const [key,change] of Object.entries(patch.fields))result[key]=applyHistoryPatch(result[key],change);return result}
  if(patch.kind==='number')return Math.max(0,(Number(value)||0)+patch.delta);
  return clone(patch.value);
}
export function createHistoryOverlay(beforeGame,beforeStats,afterGame,afterStats) {
  const documents=[];
  // Include the game even for a shot-only mutation: the transaction writes its receipt.
  documents.push({key:`games/${afterGame.id}`,before:clone(beforeGame),patch:diff(beforeGame,afterGame)});
  for(const after of afterStats){const before=beforeStats.find(item=>item.id===after.id);if(!equal(before,after))documents.push({key:`stats/${after.id}`,before:clone(before||{id:after.id,gameId:after.gameId,playerId:after.playerId}),patch:diff(before,after)})}
  return {documents};
}
const time = value => Number(value?.seconds||0)*1e9+Number(value?.nanoseconds||0);
export class HistoryJournal {
  constructor(){this.documents=new Map();this.operations=new Map()}
  start(operation){
    if(!operation.overlay)return;
    for(const item of operation.overlay.documents)if(!this.documents.has(item.key))this.documents.set(item.key,clone(item.before));
    this.operations.set(operation.id,clone(operation));
  }
  receive(collection,rows){
    for(const row of rows){const key=`${collection}/${row.id}`,previous=this.documents.get(key);
      // Firestore's cached/older snapshot must never roll back a newer document.
      if(previous && (time(previous.updatedAt)>time(row.updatedAt) || Object.entries(previous.historyClock||{}).some(([client,revision])=>Number(row.historyClock?.[client]||0)<revision)))continue;
      this.documents.set(key,clone(row));
    }
  }
  acknowledged(operation){const clock=operation.historyClock;return clock && operation.overlay.documents.every(item=>Number(this.documents.get(item.key)?.historyClock?.[clock.clientId]||0)>=clock.revision)}
  complete(id){const entry=this.operations.get(id);if(entry)entry.committed=true}
  retire(){const ids=[];for(const [id,entry] of this.operations)if(entry.committed&&this.acknowledged(entry)){this.operations.delete(id);ids.push(id)}return ids}
  project(collection,rows){
    const keys=new Set(rows.map(row=>`${collection}/${row.id}`));
    for(const entry of this.operations.values())for(const item of entry.overlay.documents)if(item.key.startsWith(`${collection}/`))keys.add(item.key);
    const operations=[...this.operations.values()].sort((a,b)=>a.createdAt-b.createdAt||(a.localSequence||0)-(b.localSequence||0)||a.id.localeCompare(b.id));
    return [...keys].map(key=>{let result=clone(this.documents.get(key)||rows.find(row=>`${collection}/${row.id}`===key));
      for(const entry of operations){const item=entry.overlay.documents.find(doc=>doc.key===key);if(!item)continue;const clock=entry.historyClock;if(clock&&Number(this.documents.get(key)?.historyClock?.[clock.clientId]||0)>=clock.revision)continue;result=applyHistoryPatch(result,item.patch)}return result}).filter(Boolean);
  }
}
