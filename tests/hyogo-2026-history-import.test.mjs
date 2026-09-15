import test from 'node:test';
import assert from 'node:assert/strict';
import {TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN,TEAMS_2026_HYOGO_JHS_SOUTAI_MEN} from '../js/data/2026-hyogo-history-men.js';
import {findDuplicateHistoricalResultSet,findSimilarHistoricalTeamCandidates} from '../js/calculations/historical-import-calculations.js';

test('2026 Hyogo junior-high soutai has official field and results',()=>{
  assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.length,16);
  assert.equal(new Set(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.map(x=>x.sourceName)).size,16);
  assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='望海').placementLabel,'優勝');
  assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='報徳学園').placementLabel,'準優勝');
  assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='衣川').placementLabel,'ベスト4');
  assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='園田').placementLabel,'ベスト4');
  for(const name of ['南淡','書写','香住第一','豊岡北'])assert.equal(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName===name).placementLabel,'ベスト8');
});

test('2026 Hyogo school aliases surface existing school candidates',()=>{
  const imported=TEAMS_2026_HYOGO_JHS_SOUTAI_MEN.find(x=>x.sourceName==='望海');
  const existing=[{id:'mo',teamName:'望海中学校',prefecture:'兵庫県',category:'U15男子'}];
  assert.equal(findSimilarHistoricalTeamCandidates(imported,TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN,existing)[0]?.team.id,'mo');
});

test('2026 Hyogo renamed duplicate result set is blocked',()=>{
  const rows=[['望海中学校','S'],['報徳学園中学校','A+'],['衣川中学校','A'],['園田中学校','A']].map(([teamName,rank],i)=>({id:String(i),teamName,prefecture:'兵庫県',category:'U15男子',tournamentPlacements:[{tournamentId:'legacy-soutai-2026',tournamentName:'兵庫県総体2026',year:2026,season:'2026-27',prefecture:'兵庫県',category:'U15男子',gender:'男子',placementRank:rank}]}));
  assert.equal(findDuplicateHistoricalResultSet(TEAMS_2026_HYOGO_JHS_SOUTAI_MEN,TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN,rows)?.tournamentId,'legacy-soutai-2026');
});
