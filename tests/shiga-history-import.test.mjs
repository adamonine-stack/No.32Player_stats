import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURNAMENT_2025_SHIGA_JHS_SPRING_ZONES_MEN,TEAMS_2025_SHIGA_JHS_SPRING_ZONES_MEN,
  TOURNAMENT_2025_SHIGA_JHS_SOUTAI_MEN,TEAMS_2025_SHIGA_JHS_SOUTAI_MEN,
  TOURNAMENT_2025_SHIGA_JHS_ROOKIES_ZONES_MEN,TEAMS_2025_SHIGA_JHS_ROOKIES_ZONES_MEN,
  TOURNAMENT_2025_SHIGA_U15_CHAMPIONSHIP_MEN,TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN,
  TOURNAMENT_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN,TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN,
  TOURNAMENT_2026_SHIGA_JHS_SPRING_ZONES_MEN,TEAMS_2026_SHIGA_JHS_SPRING_ZONES_MEN,
  TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN,TEAMS_2026_SHIGA_JHS_SOUTAI_MEN
} from '../js/data/2025-2026-shiga-history-men.js';

const bySource=(rows,name)=>rows.find(item=>item.sourceName===name);
const byTeam=(rows,name)=>rows.find(item=>item.teamName===name);

test('Shiga 2025 school results are represented',()=>{
  assert.equal(TEAMS_2025_SHIGA_JHS_SPRING_ZONES_MEN.length,8);
  assert.equal(TOURNAMENT_2025_SHIGA_JHS_SPRING_ZONES_MEN.teamPowerEligible,false);
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_SPRING_ZONES_MEN,'日野').placementLabel,'Aゾーン優勝');
  assert.equal(TEAMS_2025_SHIGA_JHS_SOUTAI_MEN.length,8);
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_SOUTAI_MEN,'日野').placementLabel,'優勝');
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_SOUTAI_MEN,'明富').placementLabel,'準優勝');
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_SOUTAI_MEN,'甲西北').rank,'A');
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_SOUTAI_MEN,'老上').rank,'B');
  assert.equal(TEAMS_2025_SHIGA_JHS_ROOKIES_ZONES_MEN.length,26);
  assert.equal(TOURNAMENT_2025_SHIGA_JHS_ROOKIES_ZONES_MEN.teamPowerEligible,false);
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_ROOKIES_ZONES_MEN,'粟津').placementLabel,'第2ブロックAゾーン優勝');
  assert.equal(bySource(TEAMS_2025_SHIGA_JHS_ROOKIES_ZONES_MEN,'高島').placementLabel,'第8ブロックDゾーン優勝');
});

test('Shiga 2025 club and Jr Winter results are represented',()=>{
  assert.equal(TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN.length,4);
  assert.equal(byTeam(TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN,'LakeForce').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN,'滋賀レイクスU15').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN,'TBA PHEONIX').rank,'A');
  assert.equal(byTeam(TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN,'ジュニアボーラーズ').rank,'A');
  assert.equal(TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN.length,3);
  assert.equal(byTeam(TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN,'LakeForce').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN,'ジュニアボーラーズ').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN,'IBS Boy').rank,'A');
});

test('Shiga 2026 completed school results are represented',()=>{
  assert.equal(TEAMS_2026_SHIGA_JHS_SPRING_ZONES_MEN.length,8);
  assert.equal(TOURNAMENT_2026_SHIGA_JHS_SPRING_ZONES_MEN.teamPowerEligible,false);
  assert.equal(bySource(TEAMS_2026_SHIGA_JHS_SPRING_ZONES_MEN,'甲西北').placementLabel,'Aゾーン優勝');
  assert.equal(TEAMS_2026_SHIGA_JHS_SOUTAI_MEN.length,4);
  assert.equal(bySource(TEAMS_2026_SHIGA_JHS_SOUTAI_MEN,'甲西北').placementLabel,'優勝');
  assert.equal(bySource(TEAMS_2026_SHIGA_JHS_SOUTAI_MEN,'打出').placementLabel,'準優勝');
  assert.equal(bySource(TEAMS_2026_SHIGA_JHS_SOUTAI_MEN,'瀬田北').rank,'A');
  assert.equal(TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN.season,'2026-27');
});
