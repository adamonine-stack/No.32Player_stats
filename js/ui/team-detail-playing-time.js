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
  const rows=[...table.querySelectorAll('.team-detail-row')];
  if(!rows.length||rows[0].querySelector('.team-detail-min'))return;
  const games=targetGames(),playersByLabel=new Map(state.players.map(player=>[`#${player.number||''} ${player.name||''}`.trim(),player]));
  rows.forEach((row,index)=>{
    const cells=[...row.children];
    if(cells.length<3)return;
    const cell=document.createElement('div');
    cell.className='team-detail-min';
    if(index===0)cell.textContent='出場時間';
    else{
      const label=(cells[1].textContent||'').trim(),player=playersByLabel.get(label);
      cell.textContent=player?totalPlayingTime(games,player.id):'--:--';
    }
    cells[2].after(cell);
    row.style.gridTemplateColumns=table.classList.contains('shot')?'42px minmax(110px,1.45fr) minmax(52px,.65fr) minmax(70px,.8fr) repeat(3,minmax(58px,.75fr))':'42px minmax(110px,1.55fr) minmax(52px,.65fr) minmax(70px,.85fr) minmax(58px,.8fr)';
  });
}

const observer=new MutationObserver(apply);
observer.observe(document.getElementById('view'),{childList:true,subtree:true});
apply();
