import { buildGameHistory, createPlayEvent, reconcileStatEvents } from './game-event-calculations.js?v=20260831-grouped-history-v1';
import { currentPlayersAt, quarterParticipation, quarterDurationSeconds, validateQuarterParticipation } from './participation-calculations.js?v=20260824-compact-sub-time-v3';
import { detailedShotTotals, shotReceivedFoulCount } from './shot-calculations.js?v=20260822-foul-stats-v2';

export const isAssistEvent = item => item?.type === 'stat' && item.statKey === 'ast';
export const isMadeEvent = item => item?.type === 'shot' ? item.result === 'made' : ['twoPm','threePm'].includes(item?.statKey);
const sameQuarter = (a,b) => Number(a.quarter || 0) === Number(b.quarter || 0);
export function nearbyMadeShots(history, assist) {
  const index = history.findIndex(item => item.eventId === assist.eventId);
  return history.map((item,i) => ({item,distance:Math.abs(i-index)}))
    .filter(({item}) => isMadeEvent(item) && sameQuarter(item,assist) && item.playerId !== assist.playerId)
    .sort((a,b) => a.distance-b.distance).map(({item}) => item);
}
export function assistCandidates(game, quarter, shot, players, stats = []) {
  const q = quarterParticipation(game,quarter);
  let ids;
  if ((q.starters || []).length === 5) {
    if (shot.remainingSeconds !== '' && shot.remainingSeconds != null) ids = currentPlayersAt(game,quarter,shot.remainingSeconds);
    else if (Array.isArray(shot.onCourtPlayerIds)) ids = shot.onCourtPlayerIds;
    else {
      // Untimed historical shots use original recording order, never drag order.
      const recorded = Number(shot.createdAt);
      const substitutions = (q.substitutions || []).filter(event => !recorded || Number(event.sequence) <= recorded);
      ids = validateQuarterParticipation({...q,substitutions,durationSeconds:quarterDurationSeconds(game)}).currentPlayers || [];
    }
  } else {
    const registered = stats.filter(stat => stat.gameId === game.id).map(stat => stat.playerId);
    ids = registered.length ? [...new Set([...registered,...(game.temporaryPlayers || []).map(p=>p.id)])] : players.map(p=>p.id);
  }
  return [...new Set(ids)].filter(id=>id!==shot.playerId).map(id=>players.find(p=>p.id===id)||{id,number:'-',name:'未登録選手'});
}

// Pure mutation planner. The caller commits all changed documents in one transaction.
// Event IDs remain stable even when a legacy aggregate is materialized on demand.
export function planAssistMutation(originalGame, originalStats, players, action) {
  const game = {...originalGame,playEvents:(originalGame.playEvents||[]).map(e=>({...e}))};
  const stats = originalStats.map(s=>({...s,quarters:s.quarters && typeof s.quarters==='object'?Object.fromEntries(Object.entries(s.quarters).map(([k,q])=>[k,{...q,shots:q.shots?.map(v=>({...v}))}])):s.quarters,shots:s.shots?.map(v=>({...v}))}));
  const changed = new Set(), addedIds = [];
  const quarterMode = game.statsRegistrationType === 'quarter';
  const sourceFor = (playerId,quarter) => {
    let stat=stats.find(s=>s.playerId===playerId);
    if(!stat){stat={id:`${game.id}_${playerId}`,gameId:game.id,playerId};stats.push(stat)}
    if(quarterMode){stat.quarters ||= {};stat.quarters[`q${quarter}`] ||= {registered:true,quarter};}
    return {stat,source:quarterMode?stat.quarters[`q${quarter}`]:stat};
  };
  const history = () => buildGameHistory(game,stats,players);
  const resolve = id => {
    const item=history().find(e=>e.eventId===id);
    if(!item)throw new Error('対象の履歴が変更されています。履歴を開き直してください。');
    if(item.sourceKind==='shot'){
      const {stat,source}=sourceFor(item.playerId,item.quarter);
      return {item,record:source.shots.find(s=>s.id===item.sourceId),stat};
    }
    if(item.sourceKind==='legacyStat') {
      // Materialize the entire matching remainder, preserving every legacy row ID.
      for(const legacy of history().filter(e=>e.sourceKind==='legacyStat'&&e.playerId===item.playerId&&sameQuarter(e,item)&&e.statKey===item.statKey)) {
        game.playEvents.push(createPlayEvent({id:legacy.eventId,gameId:game.id,quarter:legacy.quarter,player:players.find(p=>p.id===legacy.playerId)||{id:legacy.playerId},statKey:legacy.statKey,sequence:legacy.sortValue||action.now,createdAt:action.now}));
      }
    }
    return {item,record:game.playEvents.find(e=>e.id===id)};
  };
  const touch = ref => {if(ref.stat)changed.add(ref.stat.id)};
  const unlink = ref => {
    const partnerId=isAssistEvent(ref.item)?ref.record.shotEventId:ref.record.assistEventId;
    if(partnerId){
      const partner=history().find(e=>e.eventId===partnerId);
      if(partner){const other=resolve(partnerId);Object.assign(other.record,isAssistEvent(other.item)?{shotEventId:null,shooterPlayerId:null,playId:null}:{assistEventId:null,assistPlayerId:null});touch(other)}
    }
    Object.assign(ref.record,isAssistEvent(ref.item)?{shotEventId:null,shooterPlayerId:null,playId:null}:{assistEventId:null,assistPlayerId:null});touch(ref);
  };
  const replaceShots = (playerId,quarter,nextShots) => {
    const {stat,source}=sourceFor(playerId,quarter),previous=source.shots||[];
    const totals=detailedShotTotals(source,previous,nextShots),fouled=Math.max(0,Number(source.fouled||0)-Number(source.shotFouledCount||0)+shotReceivedFoulCount(nextShots));
    Object.assign(source,{shots:nextShots,...totals,fouled,shotFouledCount:shotReceivedFoulCount(nextShots),shotInputMode:'detailed',shotTrackingMode:'detailed',...(quarterMode?{registered:true,quarter}:{})});changed.add(stat.id);
  };
  let shotRef;
  if(action.kind==='reconcileStats') {
    const {stat,source}=sourceFor(action.playerId,action.quarter);
    const next={...source,...action.values};
    const reconciled=reconcileStatEvents({game,player:players.find(p=>p.id===action.playerId)||{id:action.playerId},quarter:action.quarter,previous:source,next,pending:action.pending||[]});
    for(const id of reconciled.removed){const item=history().find(e=>e.eventId===id);if(item?.shotEventId||item?.assistEventId)unlink(resolve(id))}
    game.playEvents=[...game.playEvents.filter(e=>!reconciled.removed.includes(e.id)),...reconciled.added];
    // Do not overwrite link cleanup or fresh shot arrays with a stale form snapshot.
    Object.assign(source,action.values);changed.add(stat.id);
    return {game,stats:stats.filter(s=>changed.has(s.id)),addedIds:reconciled.added.map(e=>e.id)};
  } else if(action.kind==='saveShot') {
    const shot={...action.shot},quarter=quarterMode?shot.quarter:null,{stat,source}=sourceFor(shot.playerId,quarter);
    const eventId=`shot:${stat.id}:${quarter||0}:${shot.id}`;
    const previous=(source.shots||[]).find(s=>s.id===shot.id);
    if(previous && !action.edit)return {game:originalGame,stats:[],addedIds:[]}; // retry of the same operation
    if(previous){Object.assign(shot,{playId:previous.playId||null,assistPlayerId:previous.assistPlayerId||null,assistEventId:previous.assistEventId||null,...(previous.onCourtPlayerIds?{onCourtPlayerIds:previous.onCourtPlayerIds}:{})});if(shot.result!=='made'){unlink(resolve(eventId));shot.assistPlayerId=null;shot.assistEventId=null}}
    else {shot.playId=action.playId;shot.assistPlayerId=null;shot.assistEventId=null;addedIds.push(eventId)}
    replaceShots(shot.playerId,quarter,[...(source.shots||[]).filter(s=>s.id!==shot.id),shot]);
    shotRef=resolve(eventId);
    if(!action.assistPlayerId)return {game,stats:stats.filter(s=>changed.has(s.id)),addedIds};
  } else if(action.kind==='unlink') {
    unlink(resolve(action.eventId));return {game,stats:stats.filter(s=>changed.has(s.id)),addedIds};
  } else if(action.kind==='delete') {
    const ref=resolve(action.eventId);unlink(ref);
    if(ref.item.sourceKind==='shot') {const {source}=sourceFor(ref.item.playerId,ref.item.quarter);replaceShots(ref.item.playerId,ref.item.quarter,source.shots.filter(s=>s.id!==ref.item.sourceId))}
    else {const {stat,source}=sourceFor(ref.item.playerId,ref.item.quarter);source[ref.item.statKey]=Math.max(0,Number(source[ref.item.statKey]||0)-1);changed.add(stat.id);game.playEvents=game.playEvents.filter(e=>e.id!==ref.record.id)}
    return {game,stats:stats.filter(s=>changed.has(s.id)),addedIds};
  } else shotRef=resolve(action.shotEventId);
  if(!isMadeEvent(shotRef.item))throw new Error('Madeシュートを選択してください。');
  let assistRef;
  if(action.assistEventId)assistRef=resolve(action.assistEventId);
  else {
    const playerId=action.assistPlayerId;
    if(!playerId||playerId===shotRef.item.playerId)throw new Error('シューター以外を選択してください。');
    const candidates=assistCandidates(game,shotRef.item.quarter||1,shotRef.record,players,action.kind==='saveShot'?originalStats:stats);
    if(!candidates.some(p=>p.id===playerId))throw new Error('そのプレー時点の出場選手を選択してください。');
    // Reuse the current AST when changing its player. Prefer an existing unlinked
    // AST for the selected player; never silently create a second counted AST.
    const current=shotRef.record.assistEventId?resolve(shotRef.record.assistEventId):null;
    const existing=action.kind==='saveShot'?[]:history().filter(e=>isAssistEvent(e)&&sameQuarter(e,shotRef.item)&&e.playerId===playerId&&!e.shotEventId);
    if(current?.item.playerId===playerId)assistRef=current;
    else if(existing.length) {
      if(!action.useExisting)throw new Error('既存ASTを選択して関連付けてください。');
      assistRef=resolve(existing[0].eventId);
    } else if(current) {
      const old=sourceFor(current.item.playerId,current.item.quarter),next=sourceFor(playerId,current.item.quarter);
      old.source.ast=Math.max(0,Number(old.source.ast||0)-1);next.source.ast=Number(next.source.ast||0)+1;
      changed.add(old.stat.id);changed.add(next.stat.id);
      const p=players.find(p=>p.id===playerId)||{id:playerId};Object.assign(current.record,{playerId,playerNumber:String(p.number||''),playerName:p.name||''});current.item={...current.item,playerId};assistRef=current;
    } else {
      const {stat,source}=sourceFor(playerId,shotRef.item.quarter);source.ast=Number(source.ast||0)+1;changed.add(stat.id);
      const event=createPlayEvent({id:action.assistId,gameId:game.id,quarter:shotRef.item.quarter,player:players.find(p=>p.id===playerId)||{id:playerId},statKey:'ast',sequence:action.now,createdAt:action.now,...(shotRef.record.remainingSeconds==null||shotRef.record.remainingSeconds===''?{}:{remainingSeconds:shotRef.record.remainingSeconds})});
      game.playEvents.push(event);addedIds.push(event.id);assistRef=resolve(event.id);
    }
  }
  if(!isAssistEvent(assistRef.item)||!sameQuarter(assistRef.item,shotRef.item)||assistRef.item.playerId===shotRef.item.playerId)throw new Error('同一Q・別選手のASTを選択してください。');
  unlink(shotRef);unlink(assistRef);
  const playId=shotRef.record.playId||action.playId;
  Object.assign(shotRef.record,{playId,assistPlayerId:assistRef.item.playerId,assistEventId:assistRef.record.id});touch(shotRef);
  Object.assign(assistRef.record,{playId,shotEventId:shotRef.item.eventId,shooterPlayerId:shotRef.item.playerId});
  return {game,stats:stats.filter(s=>changed.has(s.id)),addedIds};
}
