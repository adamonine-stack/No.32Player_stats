import { state } from '../core/state.js';
import { statHasRegisteredData } from '../calculations/stats-calculations.js';
import { playerPlayingTime, formatClock } from '../calculations/participation-calculations.js?v=20260824-compact-sub-time-v3';
import { OPPONENT_RANKS } from '../calculations/opponent-team-calculations.js';
import { filterByOpponentFilterRange, filterByRegisteredGameCategory, filterByAggregationCondition } from '../calculations/game-filter-calculations.js';

function targetGames(){
  const filtered=filterByOpponentFilterRange(state.games,state.teamCategoryId,state.teamOpponentRankMin,state.teamOpponentRankMax,state.opponentTeams,OPPONENT_RANKS);
  const aggregated=filterByAggregationCondition(filtered,state.teamMode,state.teamTargetId,state.teamPeriodStart,state.teamPeriodEnd);
  const categorized=filterByRegisteredGameCategory(aggregated,state.teamCategoryId);
  const statGameIds=new Set(state.stats.filter(stat=>statHasRegisteredData(stat,state.games.find(game=>game.id===stat.gameId))).map(stat=>stat.gameId));
  return categorized.filter(game=>statGameIds.has(game.id));
}

function totalPlayingTime(games,playerId){
  let seconds=0,registered=false;
  for(const game of games){
    const value=playerPlayingTime(game,playerId);
    if(value?.registered){registered=true;seconds+=Number(value.seconds)||0}
  }
  return registered?formatClock(seconds):'--:--';
}

function apply(){
  const table=document.querySelector('.team-stat-detail .team-detail-table');
  if(!table)return;
  const games=targetGames();
  const playersByLabel=new Map(state.players.map(player=>[`#${player.number||''} ${player.name||''}`.trim(),player]));
  table.querySelectorAll('.team-detail-row:not(.header)').forEach(row=>{
    const playerCell=row.children[1];
    if(!playerCell||playerCell.querySelector('.team-detail-player-min'))return;
    const label=(playerCell.textContent||'').trim(),player=playersByLabel.get(label);
    if(!player)return;
    const min=document.createElement('small');
    min.className='team-detail-player-min';
    min.textContent=totalPlayingTime(games,player.id);
    min.setAttribute('aria-label',`出場時間 ${min.textContent}`);
    playerCell.appendChild(min);
  });
}

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.getElementById('view'),{childList:true,subtree:true});
requestAnimationFrame(apply);
