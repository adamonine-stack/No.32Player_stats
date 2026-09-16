import assert from 'node:assert/strict';
import {
  TOURNAMENT_2026_ALL_JAPAN_JHS_MEN,TEAMS_2026_ALL_JAPAN_JHS_MEN,
  TOURNAMENT_2025_ALL_JAPAN_JHS_MEN,TEAMS_2025_ALL_JAPAN_JHS_MEN,
  TOURNAMENT_2025_JR_WINTER_CUP_MEN,TEAMS_2025_JR_WINTER_CUP_MEN,
  TOURNAMENT_2025_U15_CBG_MEN,TEAMS_2025_U15_CBG_MEN
} from '../js/data/2025-2026-national-history-men.js';
import { calculateSeasonalTeamRank,calculateTeamPower,upperTournamentBonus } from '../js/calculations/opponent-team-calculations.js';

const entries=[
  [TOURNAMENT_2026_ALL_JAPAN_JHS_MEN,TEAMS_2026_ALL_JAPAN_JHS_MEN,24],
  [TOURNAMENT_2025_ALL_JAPAN_JHS_MEN,TEAMS_2025_ALL_JAPAN_JHS_MEN,24],
  [TOURNAMENT_2025_JR_WINTER_CUP_MEN,TEAMS_2025_JR_WINTER_CUP_MEN,52],
  [TOURNAMENT_2025_U15_CBG_MEN,TEAMS_2025_U15_CBG_MEN,47]
];
for(const [tournament,teams,count] of entries){
  assert.equal(tournament.tournamentLevel,'national',tournament.shortName);
  assert.equal(tournament.prefecture,'全国',tournament.shortName);
  assert.equal(teams.length,count,tournament.shortName);
  assert.equal(new Set(teams.map(team=>team.teamName)).size,count,`${tournament.shortName}: duplicate team names`);
  assert.ok(teams.every(team=>team.prefecture&&team.prefecture!=='全国'),`${tournament.shortName}: every team has its real prefecture`);
  assert.ok(teams.every(team=>team.placementLabel),`${tournament.shortName}: every team has a placement`);
}

assert.equal(TEAMS_2026_ALL_JAPAN_JHS_MEN.find(team=>team.placementLabel==='優勝').teamName,'四日市メリノール学院中学校');
assert.equal(TEAMS_2025_ALL_JAPAN_JHS_MEN.find(team=>team.placementLabel==='優勝').teamName,'金沢学院大学附属中学校');
assert.equal(TEAMS_2025_JR_WINTER_CUP_MEN.find(team=>team.placementLabel==='優勝').teamName,'京都精華学園中学校');

const cbgTop8=new Map([
  ['Jamaney Youth','優勝'],['BIG EIGHT','準優勝'],['HANABUSA','3位'],['ピュア・チャンプス','4位'],
  ['CONFIANZA東京U15','5位'],['KAGO CLUB','6位'],['S&S PHOENIX','7位'],['津ジュニアゴールデンアウルズ','8位']
]);
for(const [teamName,label] of cbgTop8)assert.equal(TEAMS_2025_U15_CBG_MEN.find(team=>team.teamName===teamName)?.placementLabel,label,teamName);
assert.equal(TEAMS_2025_U15_CBG_MEN.filter(team=>team.placementLabel==='出場').length,39);

const nationalPlacement=(label,season='2026-27')=>({
  tournamentId:'national-test',tournamentName:'全国大会',tournamentLevel:'national',season,
  placementLabel:label,resultConfirmed:true,teamPowerEligible:true
});
assert.equal(upperTournamentBonus(nationalPlacement('優勝')),200);
assert.equal(upperTournamentBonus(nationalPlacement('ベスト4')),180);
assert.equal(upperTournamentBonus(nationalPlacement('ベスト8')),160);
assert.equal(upperTournamentBonus(nationalPlacement('ベスト16')),140);
assert.equal(upperTournamentBonus(nationalPlacement('ベスト32')),120);
assert.equal(upperTournamentBonus(nationalPlacement('出場')),100);
assert.equal(calculateSeasonalTeamRank([nationalPlacement('優勝')],{currentSeason:'2026-27',previousSeason:'2025-26'}).rank,null,'national result must not become prefecture rank');


const nationalOnlyCurrent=calculateTeamPower([nationalPlacement('出場')],{currentSeason:'2026-27'});
assert.equal(nationalOnlyCurrent.rank,null,'national result must not become official prefecture rank');
assert.equal(nationalOnlyCurrent.prefecturePowerRank,'A+');
assert.equal(nationalOnlyCurrent.prefecturePower,600);
assert.equal(nationalOnlyCurrent.prefecturePowerSource,'national-inferred-current');
assert.equal(nationalOnlyCurrent.isPrefecturePowerInferredFromNational,true);
assert.equal(nationalOnlyCurrent.nationalBonus,100);
assert.equal(nationalOnlyCurrent.power,700);

const nationalOnlyPrevious=calculateTeamPower([nationalPlacement('出場','2025-26')],{currentSeason:'2026-27'});
assert.equal(nationalOnlyPrevious.rank,null);
assert.equal(nationalOnlyPrevious.prefecturePowerRank,'A+');
assert.equal(nationalOnlyPrevious.prefecturePower,600);
assert.equal(nationalOnlyPrevious.prefecturePowerSource,'national-inferred-previous');
assert.equal(nationalOnlyPrevious.isPrefecturePowerProvisional,true);
assert.equal(nationalOnlyPrevious.isPrefecturePowerInferredFromNational,true);
assert.equal(nationalOnlyPrevious.nationalBonus,0);
assert.equal(nationalOnlyPrevious.historicalAchievementBonus,6);
assert.equal(nationalOnlyPrevious.power,606);

const prefecturePlacement={
  tournamentId:'pref-test',tournamentName:'県大会',tournamentLevel:'prefecture',season:'2026-27',
  placementLabel:'ベスト8',placementRank:'B',resultConfirmed:true,teamPowerEligible:true
};
const currentPower=calculateTeamPower([prefecturePlacement,nationalPlacement('優勝')],{currentSeason:'2026-27'});
assert.equal(currentPower.rank,'B');
assert.equal(currentPower.basePower,400);
assert.equal(currentPower.nationalBonus,200);
assert.equal(currentPower.power,600);

const historicalPower=calculateTeamPower([prefecturePlacement,nationalPlacement('優勝','2025-26')],{currentSeason:'2026-27'});
assert.equal(historicalPower.rank,'B');
assert.equal(historicalPower.nationalBonus,0);
assert.equal(historicalPower.historicalAchievementBonus,60);
assert.equal(historicalPower.power,460);

console.log('2025-2026 national U15 men results and Team Power behavior: ok');
