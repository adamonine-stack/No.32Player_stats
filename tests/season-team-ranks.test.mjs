import assert from 'node:assert/strict';
import {
  OPPONENT_RANKS,
  calculateSeasonRanks,
  calculateSeasonalTeamRank,
  calculateTeamPower,
  calculateHistoricalTeamBonus,
  calculatePrefectureStrengthBonuses,
  isValidTournamentAchievement,
  placementLabelToRank,
  rankToScore
} from '../js/calculations/opponent-team-calculations.js';

const p=(season,label,extra={})=>({
  season,
  placementLabel:label,
  tournamentLevel:'prefecture',
  tournamentName:extra.tournamentName||`県大会 ${season}`,
  ...extra
});

assert.deepEqual(OPPONENT_RANKS,['E','D','C','B','A','A+','S']);
assert.deepEqual(['E','D','C','B','A','A+','S'].map(rankToScore),[1,2,3,4,5,6,7]);
assert.equal(placementLabelToRank('優勝'),'S');
assert.equal(placementLabelToRank('準優勝'),'A+');
assert.equal(placementLabelToRank('ベスト4'),'A');
assert.equal(placementLabelToRank('ベスト8'),'B');
assert.equal(placementLabelToRank('ベスト16'),'C');
assert.equal(placementLabelToRank('ベスト32'),'D');
assert.equal(placementLabelToRank('ベスト64以下・県大会出場'),'E');

assert.equal(isValidTournamentAchievement(p('2025-26','優勝')),true);
assert.equal(isValidTournamentAchievement({season:'2025-26'}),false);
assert.equal(isValidTournamentAchievement({season:'2025-26',tournamentName:'旧大会',placementLabel:''}),false);
assert.equal(isValidTournamentAchievement({season:'2025-26',tournamentName:'旧大会',placementLabel:'出場'}),true);

const highest=calculateSeasonRanks([p('2026-27','ベスト8'),p('2026-27','準優勝')])['2026-27'];
assert.equal(highest.rank,'A+');
assert.equal(calculateSeasonalTeamRank([p('2025-26','優勝')],{currentSeason:'2026-27'}).overallRankStatus,'provisional');

const noHistoryCurrent=calculateTeamPower([
  p('2026-27','優勝'),
  {season:'2026-27',tournamentLevel:'block',tournamentName:'近畿大会',placementLabel:'ベスト4'}
],{season:'2026-27'});
assert.equal(noHistoryCurrent.prefecturePower,700);
assert.equal(noHistoryCurrent.upperTournamentPower,100);
assert.equal(noHistoryCurrent.hasHistoricalResults,false);
assert.equal(noHistoryCurrent.power,0);

const historical=[
  p('2025-26','優勝'),
  p('2025-26','ベスト8',{tournamentName:'別の県大会'}),
  {season:'2024-25',tournamentLevel:'block',tournamentName:'近畿大会',placementLabel:'優勝'},
  p('2024-25','ベスト16'),
  {season:'2023-24',tournamentLevel:'national',tournamentName:'全国大会',placementLabel:'ベスト8'},
  p('2023-24','ベスト16')
];
const history=calculateHistoricalTeamBonus(historical,{currentSeason:'2026-27'});
assert.equal(history.details[0].achievementPoints,77.5);
assert.equal(history.details[0].weightedPoints,46.5);
assert.equal(history.details[1].achievementPoints,70);
assert.equal(history.details[1].weightedPoints,21);
assert.equal(history.details[2].achievementPoints,47.5);
assert.equal(history.details[2].weightedPoints,4.8);
assert.equal(history.rawBonus,72.3);
assert.equal(history.bonus,72.3);

const phantomHistory=[
  {season:'2025-26',tournamentName:'',placementLabel:''},
  {season:'2025-26',sourceType:'registeredGames'},
  {year:2025,tournamentName:'旧データ',placementLabel:''}
];
const phantomBonus=calculateHistoricalTeamBonus(phantomHistory,{currentSeason:'2026-27'});
assert.equal(phantomBonus.details[0].recordCount,0);
assert.equal(phantomBonus.rawBonus,0);
assert.equal(phantomBonus.bonus,0);
const phantomPower=calculateTeamPower(phantomHistory,{season:'2026-27'});
assert.equal(phantomPower.historicalRecordCount,0);
assert.equal(phantomPower.hasHistoricalResults,false);
assert.equal(phantomPower.power,0);

const previousFallback=calculateTeamPower([p('2025-26','優勝')],{season:'2026-27'});
assert.equal(previousFallback.prefecturePower,700);
assert.equal(previousFallback.prefecturePowerSource,'previous');
assert.equal(previousFallback.historicalAchievementBonus,60);
assert.equal(previousFallback.historicalRecordCount,1);
assert.equal(previousFallback.power,760);

const currentOverridesPrevious=calculateTeamPower([
  p('2026-27','ベスト16'),
  p('2025-26','優勝')
],{season:'2026-27'});
assert.equal(currentOverridesPrevious.prefecturePower,300);
assert.equal(currentOverridesPrevious.prefecturePowerSource,'current');
assert.equal(currentOverridesPrevious.historicalAchievementBonus,60);
assert.equal(currentOverridesPrevious.power,360);

const maximum=calculateTeamPower([
  p('2026-27','優勝'),
  {season:'2026-27',tournamentLevel:'national',tournamentName:'全国大会',placementLabel:'優勝'},
  p('2025-26','優勝'),
  p('2024-25','優勝'),
  p('2023-24','優勝')
],{season:'2026-27'});
assert.equal(maximum.prefecturePower,700);
assert.equal(maximum.historicalAchievementBonus,100);
assert.equal(maximum.upperTournamentPower,200);
assert.equal(maximum.power,1000);

const strengths=calculatePrefectureStrengthBonuses([
  {prefecture:'兵庫県',tournamentPlacements:[{season:'2026-27',tournamentLevel:'block',tournamentName:'近畿大会',placementLabel:'ベスト8'}]}
],{season:'2026-27'});
assert.equal(strengths['兵庫県'].bonus,28);

console.log('season team ranks and validated Team Power history: ok');
