import test from 'node:test';
import assert from 'node:assert/strict';
import {TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN,TEAMS_2025_OSAKA_CLUB_CUP_MEN,TOURNAMENT_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN,TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN} from '../js/data/2025-osaka-history-men.js';
import {findDuplicateHistoricalResultSet,findDuplicateHistoricalTournament,findExistingHistoricalPlacement,findSimilarHistoricalTeamCandidates} from '../js/calculations/historical-import-calculations.js';

test('official Osaka 2025 tournament datasets have expected counts and top results',()=>{
  assert.equal(TEAMS_2025_OSAKA_CLUB_CUP_MEN.length,31);
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.length,48);
  assert.equal(TEAMS_2025_OSAKA_CLUB_CUP_MEN.find(x=>x.teamName==='REDFORCES').placementLabel,'優勝');
  assert.equal(TEAMS_2025_OSAKA_CLUB_CUP_MEN.find(x=>x.teamName==='EAST.O.ACADEMY U-15 TEAM').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='KAGO CLUB').placementLabel,'優勝');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='T-SMILE BASKET BALL TEAM U15').placementLabel,'準優勝');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='REDFORCES').placementLabel,'ベスト8');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='Sparkle Basketball Club').placementLabel,'ベスト16');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='Akans').placementLabel,'ベスト32');
  assert.equal(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='TEAM GRIT').placementLabel,'県大会出場');
  assert.equal(new Set(TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.map(x=>x.teamName)).size,48);
});

test('same tournament is recognized even when id or legacy naming differs',()=>{
  const duplicate={...TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN,id:'legacy-id'};
  assert.equal(findDuplicateHistoricalTournament(TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN,[duplicate])?.id,'legacy-id');
  const legacy={id:'legacy-name',name:'2025年度 第6回大阪府クラブカップ 男子',year:2025,prefecture:'大阪府'};
  assert.equal(findDuplicateHistoricalTournament(TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN,[legacy])?.id,'legacy-name');
  const placement={tournamentId:'legacy-id',tournamentName:'第6回 大阪府クラブカップ大会',year:2025,prefecture:'大阪府'};
  assert.equal(findExistingHistoricalPlacement([placement],TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN),placement);
});

test('duplicate result set is detected even under a different tournament name',()=>{
  const placements=[
    ['REDFORCES','S'],['EAST.O.ACADEMY U-15 TEAM','A+'],['KAGO CLUB','A'],['NEXTEST','A']
  ].map(([teamName,rank],index)=>({id:String(index),teamName,prefecture:'大阪府',category:'U15',tournamentPlacements:[{tournamentId:'legacy-club-cup',tournamentName:'令和7年度クラブ大会',year:2025,prefecture:'大阪府',category:'U15',gender:'男子',placementRank:rank}]}));
  const duplicate=findDuplicateHistoricalResultSet(TEAMS_2025_OSAKA_CLUB_CUP_MEN,TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN,placements);
  assert.equal(duplicate?.tournamentId,'legacy-club-cup');
});

test('similar names return candidates instead of silently merging',()=>{
  const imported=TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='BC Alma枚方');
  const candidates=findSimilarHistoricalTeamCandidates(imported,TOURNAMENT_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN,[{id:'a',teamName:'BC Almo枚方',prefecture:'大阪府',category:'U15'}]);
  assert.equal(candidates[0].team.id,'a');
  const ibbc=TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN.find(x=>x.teamName==='IBARAKI BASKETBALL CLUB');
  const ibbcCandidates=findSimilarHistoricalTeamCandidates(ibbc,TOURNAMENT_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN,[{id:'ibbc',teamName:'IBBC',prefecture:'大阪府',category:'U15'}]);
  assert.equal(ibbcCandidates[0].team.id,'ibbc');
});
