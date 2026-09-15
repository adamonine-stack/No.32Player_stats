import test from 'node:test';
import assert from 'node:assert/strict';
import {TOURNAMENT_2025_HYOGO_JHS_SOUTAI_MEN,TEAMS_2025_HYOGO_JHS_SOUTAI_MEN,TOURNAMENT_2025_HYOGO_JHS_ROOKIES_MEN,TEAMS_2025_HYOGO_JHS_ROOKIES_MEN} from '../js/data/2025-hyogo-history-men.js';
import {findDuplicateHistoricalResultSet,findSimilarHistoricalTeamCandidates} from '../js/calculations/historical-import-calculations.js';

test('2025 Hyogo middle-school datasets have official counts and top results',()=>{
  assert.equal(TEAMS_2025_HYOGO_JHS_SOUTAI_MEN.length,16);
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.length,64);
  assert.equal(new Set(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.map(x=>x.sourceName)).size,64);
  assert.equal(TEAMS_2025_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='報徳学園').placementLabel,'優勝');
  assert.equal(TEAMS_2025_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='上ヶ原').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='望海').placementLabel,'優勝');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='報徳学園').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='宝梅').placementLabel,'ベスト8');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='松陽').placementLabel,'ベスト16');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='西代').placementLabel,'ベスト32');
  assert.equal(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='多田BW').placementLabel,'ベスト64');
});

test('Hyogo school short/full names are surfaced as merge candidates',()=>{
  const imported=TEAMS_2025_HYOGO_JHS_ROOKIES_MEN.find(x=>x.sourceName==='望海');
  const existing=[{id:'mo',teamName:'明石市立望海中学校',prefecture:'兵庫県',category:'U15男子'}];
  assert.equal(findSimilarHistoricalTeamCandidates(imported,TOURNAMENT_2025_HYOGO_JHS_ROOKIES_MEN,existing)[0]?.team.id,'mo');
});

test('Hyogo same top-four result set can block a renamed duplicate tournament',()=>{
  const rows=[['望海中学校','S'],['報徳学園中学校','A+'],['稲美北中学校','A'],['長田中学校','A']].map(([teamName,rank],i)=>({id:String(i),teamName,prefecture:'兵庫県',category:'U15男子',tournamentPlacements:[{tournamentId:'legacy-rookies',tournamentName:'県新人2025',year:2025,prefecture:'兵庫県',category:'U15男子',gender:'男子',placementRank:rank}]}));
  assert.equal(findDuplicateHistoricalResultSet(TEAMS_2025_HYOGO_JHS_ROOKIES_MEN,TOURNAMENT_2025_HYOGO_JHS_ROOKIES_MEN,rows)?.tournamentId,'legacy-rookies');
});
