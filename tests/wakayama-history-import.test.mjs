import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURNAMENT_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,TEAMS_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,
  TOURNAMENT_2025_WAKAYAMA_JHS_SOUTAI_MEN,TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN,
  TOURNAMENT_2025_WAKAYAMA_JHS_ROOKIES_MEN,TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN,
  TOURNAMENT_2025_WAKAYAMA_JR_WINTER_MEN,TEAMS_2025_WAKAYAMA_JR_WINTER_MEN,
  TOURNAMENT_2025_WAKAYAMA_JUNIOR_CLUB_MEN,TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN,
  TOURNAMENT_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,
  TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN,TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN
} from '../js/data/2025-2026-wakayama-history-men.js';
import {findDuplicateHistoricalResultSet,findSimilarHistoricalTeamCandidates} from '../js/calculations/historical-import-calculations.js';

const placement=(rows,name)=>rows.find(item=>item.sourceName===name)?.placementLabel;

test('Wakayama 2025 verified boys results are represented',()=>{
  assert.equal(TEAMS_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN.length,4);
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,'東陽'),'優勝');
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,'吉備'),'準優勝');

  assert.equal(TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN.length,16);
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN,'東陽'),'優勝');
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN,'有和'),'準優勝');
  assert.deepEqual(['那智','東'].map(name=>placement(TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN,name)),['ベスト4','ベスト4']);

  assert.equal(TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN.length,12);
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN,'有和'),'優勝');
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN,'近大和歌山'),'準優勝');
  assert.deepEqual(['楠見','CHOICE GB'].map(name=>placement(TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN,name)),['ベスト4','ベスト4']);

  assert.equal(TEAMS_2025_WAKAYAMA_JR_WINTER_MEN.length,13);
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JR_WINTER_MEN,'G-LiGAR'),'優勝');
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JR_WINTER_MEN,'adorare'),'準優勝');
  assert.deepEqual(['GLÄNZ','CHOICE'].map(name=>placement(TEAMS_2025_WAKAYAMA_JR_WINTER_MEN,name)),['ベスト4','ベスト4']);
});

test('Wakayama 2025 junior club top four is represented',()=>{
  assert.equal(TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN.length,4);
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN,'BLACK PANTHERS'),'優勝');
  assert.equal(placement(TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN,'adorare'),'準優勝');
  assert.deepEqual(['CLEVER CATS','Re-birth'].map(name=>placement(TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN,name)),['ベスト4','ベスト4']);
});

test('Wakayama 2026 verified boys results are represented',()=>{
  assert.equal(TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN.length,4);
  assert.equal(placement(TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,'有和'),'優勝');
  assert.equal(placement(TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,'上富田'),'準優勝');
  assert.deepEqual(['近大和歌山','妙寺'].map(name=>placement(TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN,name)),['ベスト4','ベスト4']);

  assert.equal(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN.length,16);
  assert.equal(placement(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN,'有和'),'優勝');
  assert.equal(placement(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN,'上富田'),'準優勝');
  assert.deepEqual(['明洋','楠見'].map(name=>placement(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN,name)),['ベスト4','ベスト4']);
  assert.deepEqual(['城南','近大和歌山','海南第三','緑丘'].map(name=>placement(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN,name)),Array(4).fill('ベスト8'));
});

test('Wakayama school abbreviations surface existing teams for user merge choice',()=>{
  const imported=TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN.find(item=>item.sourceName==='有和');
  const existing=[{id:'ariwa',teamName:'有和中学校',prefecture:'和歌山県',category:'U15男子'}];
  assert.equal(findSimilarHistoricalTeamCandidates(imported,TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN,existing)[0]?.team.id,'ariwa');
});

test('Wakayama duplicate result set guard catches renamed tournament',()=>{
  const teams=[['有和中学校','S'],['上富田中学校','A+'],['明洋中学校','A'],['楠見中学校','A']].map(([teamName,rank],i)=>({
    id:String(i),teamName,prefecture:'和歌山県',category:'U15男子',
    tournamentPlacements:[{tournamentId:'legacy-wakayama-soutai-2026',tournamentName:'令和8年度県総体',year:2026,season:'2026-27',prefecture:'和歌山県',category:'U15男子',gender:'男子',placementRank:rank}]
  }));
  assert.equal(findDuplicateHistoricalResultSet(TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN,TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN,teams)?.tournamentId,'legacy-wakayama-soutai-2026');
});
