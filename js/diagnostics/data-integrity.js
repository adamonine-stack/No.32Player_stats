import { derived, getGameStatsRegistrationType, quarterKey, registeredQuarterNumbers, STAT_KEYS, sumStats } from "../calculations/stats-calculations.js";
import { gamePlayingTime, quarterDurationSeconds, validateQuarterParticipation } from "../calculations/participation-calculations.js";

const integer=value=>Number.isFinite(Number(value))?Math.max(0,Math.trunc(Number(value))):0;
const issue=(issues,code,collection,id,detail={})=>issues.push({code,collection,id,...detail});
const sourcesFor=(stat,game)=>getGameStatsRegistrationType(game)==="quarter"
  ? registeredQuarterNumbers(stat).map(q=>({quarter:q,value:stat.quarters?.[quarterKey(q)]||{}}))
  : [{quarter:null,value:stat}];

export function integrityMetrics({games=[],stats=[]}={}) {
  const totals=sumStats(stats,games),calculated=derived(totals),shots=[];
  for(const stat of stats){const game=games.find(item=>item.id===stat.gameId);for(const source of sourcesFor(stat,game))for(const shot of source.value.shots||[])shots.push(shot)}
  const playingSeconds=games.reduce((total,game)=>total+Object.values(gamePlayingTime(game)).reduce((sum,value)=>sum+integer(value),0),0);
  const linkedAssists=games.reduce((total,game)=>total+(game.playEvents||[]).filter(event=>event.statKey==="ast"&&event.shotEventId).length,0);
  return {games:games.length,stats:stats.length,q:totals.q,...Object.fromEntries(STAT_KEYS.map(key=>[key,totals[key]])),pts:calculated.pts,reb:calculated.reb,stl:calculated.stl,to:calculated.to,shots:shots.length,made:shots.filter(shot=>shot.result==="made").length,missed:shots.filter(shot=>shot.result==="missed").length,playingSeconds,linkedAssists};
}

export function auditR32Data({games=[],players=[],stats=[],opponentTeams=[]}={}) {
  const issues=[],gameById=new Map(games.map(item=>[item.id,item])),playerIds=new Set(players.map(item=>item.id)),teamIds=new Set(opponentTeams.map(item=>item.id)),shotLinks=new Map();
  for(const stat of stats){const game=gameById.get(stat.gameId);if(!game)issue(issues,"ORPHAN_STAT_GAME","stats",stat.id,{gameId:stat.gameId});if(!playerIds.has(stat.playerId))issue(issues,"ORPHAN_STAT_PLAYER","stats",stat.id,{playerId:stat.playerId});if(typeof stat.quarters==="number")issue(issues,"LEGACY_NUMERIC_QUARTERS","stats",stat.id,{value:stat.quarters});if(stat.quarters&&typeof stat.quarters==="object")for(const [key,value] of Object.entries(stat.quarters)){const q=integer(key.replace(/\D/g,""));if(value===null)issue(issues,"DELETED_QUARTER_NULL","stats",stat.id,{quarter:q});if(q>integer(game?.quarters||game?.quarterCount||4))issue(issues,"QUARTER_OUT_OF_RANGE","stats",stat.id,{quarter:q});}
    for(const {quarter,value} of sourcesFor(stat,game)){for(const [made,attempt] of [["twoPm","twoPa"],["threePm","threePa"],["ftm","fta"]])if(integer(value[made])>integer(value[attempt]))issue(issues,"MADE_EXCEEDS_ATTEMPT","stats",stat.id,{quarter,made,attempt});for(const shot of value.shots||[]){if(shot.id)shotLinks.set(`shot:${stat.id}:${quarter||0}:${shot.id}`,shot);if(!shot.id||!shot.shotArea||!shot.shotType||!["made","missed"].includes(shot.result))issue(issues,"LEGACY_SHOT","stats",stat.id,{quarter,shotId:shot.id||null});}}
  }
  for(const game of games){if(game.opponentTeamId&&!teamIds.has(game.opponentTeamId))issue(issues,"ORPHAN_OPPONENT","games",game.id,{opponentTeamId:game.opponentTeamId});const events=game.playEvents||[],eventById=new Map(events.map(event=>[event.id,event]));for(const event of events){if(event.playerId&&!playerIds.has(event.playerId)&&!game.temporaryPlayers?.some(player=>player.id===event.playerId))issue(issues,"EVENT_UNKNOWN_PLAYER","games",game.id,{eventId:event.id,playerId:event.playerId});if(integer(event.quarter)>integer(game.quarters||game.quarterCount||4))issue(issues,"EVENT_QUARTER_OUT_OF_RANGE","games",game.id,{eventId:event.id,quarter:event.quarter});if(event.statKey==="ast"&&event.shotEventId){const shotEvent=eventById.get(event.shotEventId)||shotLinks.get(event.shotEventId);if(!shotEvent)issue(issues,"AST_SHOT_MISSING","games",game.id,{eventId:event.id,shotEventId:event.shotEventId});else if(shotEvent.result&&shotEvent.result!=="made")issue(issues,"AST_LINKED_TO_MISS","games",game.id,{eventId:event.id,shotEventId:event.shotEventId});}}
    const qCount=Math.max(1,integer(game.quarters||game.quarterCount||4));for(let q=1;q<=qCount;q++){const participation=game.quarterParticipation?.[quarterKey(q)];if(!participation)continue;const result=validateQuarterParticipation({...participation,durationSeconds:quarterDurationSeconds(game)});if(!result.valid)issue(issues,"PARTICIPATION_INVALID","games",game.id,{quarter:q,error:result.error,eventId:result.eventId||null});const total=Object.values(result.secondsByPlayer||{}).reduce((sum,value)=>sum+integer(value),0),maximum=quarterDurationSeconds(game)*5;if(total>maximum)issue(issues,"PLAYING_TIME_EXCEEDS_QUARTER","games",game.id,{quarter:q,total,maximum});}}
  return {generatedAt:new Date().toISOString(),metrics:integrityMetrics({games,stats}),issues,counts:Object.fromEntries([...new Set(issues.map(item=>item.code))].sort().map(code=>[code,issues.filter(item=>item.code===code).length]))};
}

export function compareIntegrityMetrics(before,after) {
  const keys=[...new Set([...Object.keys(before||{}),...Object.keys(after||{})])],differences=keys.filter(key=>before?.[key]!==after?.[key]).map(key=>({key,before:before?.[key],after:after?.[key]}));
  return {equal:differences.length===0,differences};
}
