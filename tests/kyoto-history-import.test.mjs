import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURNAMENT_2025_KYOTO_JHS_SOUTAI_MEN,TEAMS_2025_KYOTO_JHS_SOUTAI_MEN,
  TOURNAMENT_2025_KYOTO_JR_WINTER_MEN,TEAMS_2025_KYOTO_JR_WINTER_MEN,
  TOURNAMENT_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN,TEAMS_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN,
  TOURNAMENT_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN,TEAMS_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN,
  TOURNAMENT_2025_KYOTO_ROOKIES_FINAL_MEN,TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN,
  TOURNAMENT_2026_KYOTO_JHS_SOUTAI_MEN,TEAMS_2026_KYOTO_JHS_SOUTAI_MEN
} from '../js/data/2025-2026-kyoto-history-men.js';
import { calculateTeamPower } from '../js/calculations/opponent-team-calculations.js';

const byTeam=(rows,name)=>rows.find(item=>item.teamName===name);

test('Kyoto 2025 verified boys results are represented',()=>{
  assert.equal(TEAMS_2025_KYOTO_JHS_SOUTAI_MEN.length,8);
  assert.equal(byTeam(TEAMS_2025_KYOTO_JHS_SOUTAI_MEN,'京都精華学園中学校').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JHS_SOUTAI_MEN,'亀岡中学校').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JHS_SOUTAI_MEN,'木幡中学校').placementLabel,'ベスト4');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JHS_SOUTAI_MEN,'大宮中学校').placementLabel,'ベスト8');

  assert.equal(TEAMS_2025_KYOTO_JR_WINTER_MEN.length,4);
  assert.equal(byTeam(TEAMS_2025_KYOTO_JR_WINTER_MEN,'京都精華学園中学校').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JR_WINTER_MEN,'KYOTO DREAMERS').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JR_WINTER_MEN,'京都フェニックス').placementLabel,'3位');
  assert.equal(byTeam(TEAMS_2025_KYOTO_JR_WINTER_MEN,'B.UNITE').placementLabel,'4位');

  assert.equal(TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN.length,4);
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN,'京都精華学園中学校').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN,'B.UNITE').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN,'亀岡中学校').placementLabel,'3位');
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN,'京都ハンナリーズU15').placementLabel,'4位');

  assert.equal(TOURNAMENT_2025_KYOTO_JHS_SOUTAI_MEN.resultConfirmed,true);
  assert.equal(TOURNAMENT_2025_KYOTO_JR_WINTER_MEN.resultConfirmed,true);
  assert.equal(TOURNAMENT_2025_KYOTO_ROOKIES_FINAL_MEN.resultConfirmed,true);
});

test('Kyoto verified newcomer qualifiers are stored but excluded from power',()=>{
  assert.equal(TOURNAMENT_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN.teamPowerEligible,false);
  assert.equal(TOURNAMENT_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN.teamPowerEligible,false);
  assert.equal(TEAMS_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN.length,4);
  assert.equal(TEAMS_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN.length,4);
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN,'京都精華学園中学校').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN,'B.UNITE').placementLabel,'優勝');

  const qualifier={
    season:'2025-26',tournamentName:TOURNAMENT_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN.name,
    tournamentLevel:'prefecture',placementLabel:'優勝',placementRank:'S',resultConfirmed:true,teamPowerEligible:false
  };
  const final={
    season:'2025-26',tournamentName:TOURNAMENT_2025_KYOTO_ROOKIES_FINAL_MEN.name,
    tournamentLevel:'prefecture',placementLabel:'準優勝',placementRank:'A+',resultConfirmed:true,teamPowerEligible:true
  };
  const power=calculateTeamPower([qualifier,final],{season:'2026-27'});
  assert.equal(power.previousRank,'A+');
  assert.equal(power.historicalRecordCount,1);
  assert.equal(power.power,651);
});

test('Kyoto 2026 school soutai top eight is represented',()=>{
  assert.equal(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN.length,8);
  assert.equal(byTeam(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN,'京都精華学園中学校').placementLabel,'優勝');
  assert.equal(byTeam(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN,'亀岡中学校').placementLabel,'準優勝');
  assert.equal(byTeam(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN,'城南中学校').placementLabel,'ベスト4');
  assert.equal(byTeam(TEAMS_2026_KYOTO_JHS_SOUTAI_MEN,'木幡中学校').placementLabel,'ベスト4');
  assert.equal(TOURNAMENT_2026_KYOTO_JHS_SOUTAI_MEN.season,'2026-27');
});
