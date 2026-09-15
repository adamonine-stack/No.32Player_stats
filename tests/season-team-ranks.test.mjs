import assert from 'node:assert/strict';
import { OPPONENT_RANKS, calculateSeasonRanks, calculateSeasonalTeamRank, calculateTeamPower, calculateHistoricalTeamBonus, calculatePrefectureStrengthBonuses, placementLabelToRank, rankToScore } from '../js/calculations/opponent-team-calculations.js';

const p=(season,label,extra={})=>({season,placementLabel:label,tournamentLevel:'prefecture',...extra});

assert.deepEqual(OPPONENT_RANKS,['E','D','C','B','A','A+','S']);
assert.deepEqual(['E','D','C','B','A','A+','S'].map(rankToScore),[1,2,3,4,5,6,7]);
assert.equal(placementLabelToRank('優勝'),'S');
assert.equal(placementLabelToRank('準優勝'),'A+');
assert.equal(placementLabelToRank('ベスト4'),'A');
assert.equal(placementLabelToRank('ベスト8'),'B');
assert.equal(placementLabelToRank('ベスト16'),'C');
assert.equal(placementLabelToRank('ベスト32'),'D');
assert.equal(placementLabelToRank('ベスト64以下・県大会出場'),'E');
assert.equal(placementLabelToRank('初戦敗退'),null);
assert.equal(placementLabelToRank('1回戦敗退'),null);

const highest=calculateSeasonRanks([p('2026-27','ベスト8'),p('2026-27','準優勝')])['2026-27'];
assert.equal(highest.rank,'A+');
assert.equal(highest.calculationMethod,'highest-prefecture-placement');
assert.equal(calculateSeasonalTeamRank([p('2026-27','ベスト8'),p('2025-26','優勝')],{currentSeason:'2026-27'}).rank,'B');
assert.equal(calculateSeasonalTeamRank([p('2025-26','優勝')],{currentSeason:'2026-27'}).overallRankStatus,'provisional');

const placements=[
  p('2026-27','ベスト8'),
  {season:'2026-27',tournamentLevel:'block',placementLabel:'ベスト4'}
];
const currentPower=calculateTeamPower(placements,{season:'2026-27',prefectureStrengthBonus:30});
assert.equal(currentPower.rank,'B');
assert.equal(currentPower.basePower,400);
assert.equal(currentPower.prefecturePower,400);
assert.equal(currentPower.prefectureStrengthBonus,0);
assert.equal(currentPower.blockBonus,100);
assert.equal(currentPower.nationalBonus,0);
assert.equal(currentPower.upperTournamentPower,100);
assert.equal(currentPower.historicalAchievementBonus,0);
assert.equal(currentPower.power,500);
assert.equal(currentPower.maxPower,1000);
assert.equal(currentPower.calculationMethod,'current-prefecture-700-plus-history-100-plus-upper-200');

const historical=[
  p('2025-26','優勝'),
  p('2025-26','ベスト8'),
  {season:'2024-25',tournamentLevel:'block',placementLabel:'優勝'},
  p('2024-25','ベスト16'),
  {season:'2023-24',tournamentLevel:'national',placementLabel:'ベスト8'},
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
assert.equal(history.maxBonus,100);
assert.equal(history.calculationMethod,'season-average-weighted-60-30-10');

const capped=calculateHistoricalTeamBonus([
  {season:'2025-26',tournamentLevel:'national',placementLabel:'優勝'},
  {season:'2024-25',tournamentLevel:'national',placementLabel:'優勝'},
  {season:'2023-24',tournamentLevel:'national',placementLabel:'優勝'}
],{currentSeason:'2026-27'});
assert.equal(capped.rawBonus,100);
assert.equal(capped.bonus,100);

const maximum=calculateTeamPower([
  p('2026-27','優勝'),
  {season:'2026-27',tournamentLevel:'national',placementLabel:'優勝'},
  p('2025-26','優勝'),
  p('2024-25','優勝'),
  p('2023-24','優勝')
],{season:'2026-27'});
assert.equal(maximum.prefecturePower,700);
assert.equal(maximum.historicalAchievementBonus,100);
assert.equal(maximum.upperTournamentPower,200);
assert.equal(maximum.power,1000);

const previousFallback=calculateTeamPower([
  p('2025-26','優勝')
],{season:'2026-27'});
assert.equal(previousFallback.rank,'S');
assert.equal(previousFallback.currentRank,null);
assert.equal(previousFallback.previousRank,'S');
assert.equal(previousFallback.prefecturePower,700);
assert.equal(previousFallback.prefecturePowerSource,'previous');
assert.equal(previousFallback.prefecturePowerSeason,'2025-26');
assert.equal(previousFallback.isPrefecturePowerProvisional,true);
assert.equal(previousFallback.historicalAchievementBonus,60);
assert.equal(previousFallback.upperTournamentPower,0);
assert.equal(previousFallback.power,760);
assert.equal(previousFallback.calculationMethod,'current-prefecture-or-previous-fallback-700-plus-history-100-plus-upper-200');

const currentOverridesPrevious=calculateTeamPower([
  p('2026-27','ベスト16'),
  p('2025-26','優勝')
],{season:'2026-27'});
assert.equal(currentOverridesPrevious.rank,'C');
assert.equal(currentOverridesPrevious.currentRank,'C');
assert.equal(currentOverridesPrevious.previousRank,'S');
assert.equal(currentOverridesPrevious.prefecturePower,300);
assert.equal(currentOverridesPrevious.prefecturePowerSource,'current');
assert.equal(currentOverridesPrevious.isPrefecturePowerProvisional,false);
assert.equal(currentOverridesPrevious.historicalAchievementBonus,60);
assert.equal(currentOverridesPrevious.power,360);

const previousFallbackWithUpper=calculateTeamPower([
  {season:'2026-27',tournamentLevel:'national',placementLabel:'出場'},
  p('2025-26','優勝')
],{season:'2026-27'});
assert.equal(previousFallbackWithUpper.rank,'S');
assert.equal(previousFallbackWithUpper.prefecturePower,700);
assert.equal(previousFallbackWithUpper.historicalAchievementBonus,60);
assert.equal(previousFallbackWithUpper.upperTournamentPower,100);
assert.equal(previousFallbackWithUpper.power,860);

const strengths=calculatePrefectureStrengthBonuses([
  {prefecture:'兵庫県',tournamentPlacements:[{season:'2026-27',tournamentLevel:'block',placementLabel:'ベスト8'}]}
],{season:'2026-27'});
assert.equal(strengths['兵庫県'].bonus,28);

console.log('season team ranks and 1000-point Team Power: ok');
