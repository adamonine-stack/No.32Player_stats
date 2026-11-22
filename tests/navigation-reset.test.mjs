import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetNavigationViewState } from '../js/ui/navigation-reset.js';

test('tapping Team again exits individual shot comparison and resets its filters',()=>{
  const s={tab:'team',teamDetail:{type:'fg',scrollY:600},teamReturn:{teamMode:'all'},teamMode:'all',teamTargetId:'match-1',teamCategoryId:'U15',teamOpponentRankMin:'A',teamOpponentRankMax:'B',teamPeriodStart:'2026-01-01',teamPeriodEnd:'2026-11-01',teamPreserveEmptyTarget:true,detailStatsViews:{'match-1':'q3'},selectedSeasonId:'2026',lastPlayerId:'p1',games:[{id:'match-1'}]};
  resetNavigationViewState(s,'team');
  assert.equal(s.tab,'team');
  assert.equal(s.teamDetail,null);
  assert.equal(s.teamReturn,null);
  assert.equal(s.teamMode,'game');
  assert.equal(s.teamTargetId,'');
  assert.equal(s.teamCategoryId,'');
  assert.equal(s.teamOpponentRankMin,'');
  assert.equal(s.teamOpponentRankMax,'');
  assert.equal(s.teamPeriodStart,'');
  assert.equal(s.teamPeriodEnd,'');
  assert.equal(s.teamPreserveEmptyTarget,false);
  assert.deepEqual(s.detailStatsViews,{});
  assert.equal(s.selectedSeasonId,'2026');
  assert.equal(s.lastPlayerId,'p1');
  assert.deepEqual(s.games,[{id:'match-1'}]);
});

test('Analysis tab returns from a drilldown to default game mode',()=>{
  const s={tab:'team',statsMode:'tournament',targetId:'event',categoryId:'club',opponentRankMin:'A',opponentRankMax:'C',periodStart:'2026-01-01',analysisReturn:{scrollY:123},analysisPreserveEmptyTarget:true,detailStatsViews:{game:'q2'}};
  resetNavigationViewState(s,'stats');
  assert.equal(s.tab,'stats');
  assert.equal(s.statsMode,'game');
  assert.equal(s.targetId,'');
  assert.equal(s.categoryId,'');
  assert.equal(s.opponentRankMin,'');
  assert.equal(s.opponentRankMax,'');
  assert.equal(s.periodStart,'');
  assert.equal(s.analysisReturn,null);
  assert.equal(s.analysisPreserveEmptyTarget,false);
  assert.deepEqual(s.detailStatsViews,{});
});

test('Game and Opponent Team icons return from detail screens to their lists',()=>{
  const s={tab:'gameDetail',selectedGameId:'game-123',gameListReturnPosition:{scrollY:100},selectedOpponentTeamId:'team-123',opponentTeamListReturnPosition:{scrollY:300}};
  resetNavigationViewState(s,'games');
  assert.equal(s.tab,'games');
  assert.equal(s.selectedGameId,'');
  assert.equal(s.gameListReturnPosition,null);
  resetNavigationViewState(s,'opponentTeams');
  assert.equal(s.tab,'opponentTeams');
  assert.equal(s.selectedOpponentTeamId,'');
  assert.equal(s.opponentTeamListReturnPosition,null);
});

test('Home icon resets view only and preserves global player and season preferences',()=>{
  const s={tab:'home',homeStatsMode:'fourQuarterAverage',lastPlayerId:'player-A',selectedSeasonId:'season-B',gameSortDirection:'asc'};
  resetNavigationViewState(s,'home');
  assert.equal(s.homeStatsMode,'total');
  assert.equal(s.lastPlayerId,'player-A');
  assert.equal(s.selectedSeasonId,'season-B');
  assert.equal(s.gameSortDirection,'asc');
});

test('Both mobile and desktop nav use the shared reset handler and scroll to the top',()=>{
  const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.match(app,/function activateNavigationTab\(tab\)\{[\s\S]*?resetNavigationViewState\(state,tab\)/);
  assert.match(app,/if\(tab==='opponentTeams'\)\{[\s\S]*?opponentTeamSearch=''/);
  assert.match(app,/requestAnimationFrame\(\(\)=>window\.scrollTo\(\{top:0,left:0,behavior:'auto'\}\)\)/);
  assert.match(app,/for\(const id of \['pcNav','mobileNav'\]\)/);
  assert.match(index,/js\/app\.js\?v=20261123-navigation-reset-v1/);
  assert.match(sw,/js\/ui\/navigation-reset\.js\?v=20261123-navigation-reset-v1/);
});
