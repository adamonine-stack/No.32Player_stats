import { getGameStatsRegistrationType } from '../calculations/stats-calculations.js';

export const LOAD_ERROR='既存スタッツを確認できません。最新データを読み込み直してください。';
export const CONFLICT_ERROR='他の端末または別の操作でスタッツが更新されています。最新データを読み込み直してください。';
// Stable value comparison, including shots/associations and history clocks. Only
// document metadata is excluded; timestamps are never our concurrency token.
export function fingerprint(value) {
  const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canonical(v[k])])):v;
  return JSON.stringify(canonical(value));
}
function statValue(stat) {if(!stat)return null;const {id,updatedAt,...value}=stat;return value;}
function gameValue(game) {return {mode:getGameStatsRegistrationType(game),quarters:game.quarters,seasonId:game.seasonId,playEvents:game.playEvents||[],eventSequenceOverrides:game.eventSequenceOverrides||{},historyClock:game.historyClock||{}};}
export function createStatsBaseline(game,stat,playerId,quarter) {
  const mode=getGameStatsRegistrationType(game);
  if(!game.id||!playerId||(mode==='quarter'&&(!Number.isInteger(quarter)||quarter<1)))throw Error(LOAD_ERROR);
  const source=mode==='quarter'?stat?.quarters?.['q'+quarter]:stat;
  if(source!=null&&(typeof source!=='object'||Array.isArray(source)))throw Error(LOAD_ERROR);
  if(stat&&(stat.gameId!==game.id||stat.playerId!==playerId))throw Error(LOAD_ERROR);
  return Object.freeze({gameId:game.id,playerId,mode,quarter:mode==='quarter'?quarter:null,statId:stat?.id||`${game.id}_${playerId}`,statFingerprint:fingerprint(statValue(stat)),gameFingerprint:fingerprint(gameValue(game))});
}
export function assertStatsBaseline(baseline,game,stats,action) {
  if(!baseline||baseline.gameId!==game.id||baseline.playerId!==action.playerId||baseline.quarter!==action.quarter)throw Error(LOAD_ERROR);
  const matching=stats.filter(s=>s.gameId===game.id&&s.playerId===action.playerId);
  if(matching.length>1)throw Error(CONFLICT_ERROR);
  const current=createStatsBaseline(game,matching[0],action.playerId,action.quarter);
  if(fingerprint(current)!==fingerprint(baseline))throw Error(CONFLICT_ERROR);
}
export async function withStatsLoadTimeout(load,milliseconds=12000) {
  let timer;
  try{return await Promise.race([load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(LOAD_ERROR)),milliseconds)})]);}
  finally{clearTimeout(timer);}
}
