import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURNAMENT_2025_NARA_JHS_CHAMPIONSHIP_MEN,TEAMS_2025_NARA_JHS_CHAMPIONSHIP_MEN,
  TOURNAMENT_2025_NARA_JHS_SOUTAI_MEN,TEAMS_2025_NARA_JHS_SOUTAI_MEN,
  TOURNAMENT_2025_NARA_JHS_ROOKIES_MEN,TEAMS_2025_NARA_JHS_ROOKIES_MEN,
  TOURNAMENT_2025_NARA_JR_WINTER_MEN,TEAMS_2025_NARA_JR_WINTER_MEN,
  TOURNAMENT_2025_NARA_CLUB_CHAMPIONSHIP_MEN,TEAMS_2025_NARA_CLUB_CHAMPIONSHIP_MEN,
  TOURNAMENT_2026_NARA_JHS_SOUTAI_MEN,TEAMS_2026_NARA_JHS_SOUTAI_MEN
} from '../js/data/2025-2026-nara-history-men.js';
import {findDuplicateHistoricalResultSet,findSimilarHistoricalTeamCandidates} from '../js/calculations/historical-import-calculations.js';

const bySource=(rows,name)=>rows.find(item=>item.sourceName===name);

test('Nara 2025 verified boys results are represented',()=>{
  assert.equal(TEAMS_2025_NARA_JHS_CHAMPIONSHIP_MEN.length,8);
  assert.equal(bySource(TEAMS_2025_NARA_JHS_CHAMPIONSHIP_MEN,'新庄').placementLabel,'優勝');
  assert.equal(bySource(TEAMS_2025_NARA_JHS_CHAMPIONSHIP_MEN,'登美ヶ丘北').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_NARA_JHS_SOUTAI_MEN.length,8);
  assert.equal(bySource(TEAMS_2025_NARA_JHS_SOUTAI_MEN,'平群').placementLabel,'3位');
  assert.equal(TEAMS_2025_NARA_JHS_ROOKIES_MEN.length,4);
  assert.equal(bySource(TEAMS_2025_NARA_JHS_ROOKIES_MEN,'榛原').placementLabel,'優勝');
  assert.equal(TEAMS_2025_NARA_JR_WINTER_MEN.length,8);
  assert.equal(bySource(TEAMS_2025_NARA_JR_WINTER_MEN,'バンビシャス奈良').placementLabel,'優勝');
  assert.equal(bySource(TEAMS_2025_NARA_JR_WINTER_MEN,'PIRATES').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_NARA_CLUB_CHAMPIONSHIP_MEN.length,2);
  assert.equal(bySource(TEAMS_2025_NARA_CLUB_CHAMPIONSHIP_MEN,'PIRATES').placementLabel,'優勝');
});

test('Nara 2026 school soutai top eight is represented',()=>{
  assert.equal(TEAMS_2026_NARA_JHS_SOUTAI_MEN.length,8);
  assert.equal(bySource(TEAMS_2026_NARA_JHS_SOUTAI_MEN,'榛原').placementLabel,'優勝');
  assert.equal(bySource(TEAMS_2026_NARA_JHS_SOUTAI_MEN,'Strike Force').placementLabel,'準優勝');
  assert.equal(bySource(TEAMS_2026_NARA_JHS_SOUTAI_MEN,'王寺北').placementLabel,'3位');
  assert.equal(bySource(TEAMS_2026_NARA_JHS_SOUTAI_MEN,'都跡').placementLabel,'4位');
});

test('Nara aliases surface existing teams for explicit merge choice',()=>{
  const pirates=bySource(TEAMS_2025_NARA_JR_WINTER_MEN,'PIRATES');
  const existing=[{id:'pirates',teamName:'PIRATES U15',prefecture:'奈良県',category:'U15男子'}];
  assert.equal(findSimilarHistoricalTeamCandidates(pirates,TOURNAMENT_2025_NARA_JR_WINTER_MEN,existing)[0]?.team.id,'pirates');
});

test('Nara duplicate result set guard catches renamed tournament',()=>{
  const teams=[['新庄中学校','S'],['登美ヶ丘北中学校','A+'],['平群中学校','A'],['大成中学校','A']].map(([teamName,rank],i)=>({
    id:String(i),teamName,prefecture:'奈良県',category:'U15男子',
    tournamentPlacements:[{tournamentId:'legacy-nara-soutai-2025',tournamentName:'令和7年度奈良県総体',year:2025,season:'2025-26',prefecture:'奈良県',category:'U15男子',gender:'男子',placementRank:rank}]
  }));
  assert.equal(findDuplicateHistoricalResultSet(TEAMS_2025_NARA_JHS_SOUTAI_MEN,TOURNAMENT_2025_NARA_JHS_SOUTAI_MEN,teams)?.tournamentId,'legacy-nara-soutai-2025');
});
