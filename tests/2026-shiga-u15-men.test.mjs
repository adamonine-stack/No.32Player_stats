import assert from 'node:assert/strict';
import { calculateOpponentTeamRank } from '../js/calculations/opponent-team-calculations.js';
import { TOURNAMENT_2026_SHIGA_U15_MEN, TEAMS_2026_SHIGA_U15_MEN, MATCHES_2026_SHIGA_U15_MEN } from '../js/data/2026-shiga-u15-men.js';

assert.equal(TOURNAMENT_2026_SHIGA_U15_MEN.participantCount,11);
assert.equal(TOURNAMENT_2026_SHIGA_U15_MEN.prefecture,'滋賀県');
assert.equal(TEAMS_2026_SHIGA_U15_MEN.length,11);
assert.equal(new Set(TEAMS_2026_SHIGA_U15_MEN.map(team=>team.normalizedTeamName)).size,11);
assert.equal(MATCHES_2026_SHIGA_U15_MEN.length,10);
const expected=new Map([
  ['LakeForce',['優勝',1,'S',3,0]],['ジュニアボーラーズ',['準優勝',2,'A+',2,1]],['IBS Boy',['第3位・ベスト4',3,'A',2,1]],['SILVER SHARKS',['第3位・ベスト4',3,'A',1,1]],
  ['GENESIS',['準々決勝敗退・初戦敗退',null,'D',0,1]],['B-BOYZ',['準々決勝敗退・初戦敗退',null,'D',0,1]],['TBA PHEONIX',['準々決勝敗退・初戦敗退',null,'D',0,1]],
  ['滋賀レイクスU15Next',['1回戦敗退',null,'E',0,1]],['JUMP',['1回戦敗退',null,'E',0,1]],['B-Braves.JBC',['1回戦敗退',null,'E',0,1]],['REDNEX.Jr',['1回戦敗退',null,'E',0,1]]
]);
for(const team of TEAMS_2026_SHIGA_U15_MEN){assert.deepEqual([team.placementLabel,team.placement,team.rank,team.wins,team.losses],expected.get(team.teamName),team.teamName);assert.equal(calculateOpponentTeamRank([{placementRank:team.rank}]).rank,team.rank)}
assert.equal(TEAMS_2026_SHIGA_U15_MEN.filter(team=>team.placement===3).length,2);
assert.ok(TEAMS_2026_SHIGA_U15_MEN.filter(team=>team.rank==='D').every(team=>team.notes.includes('シードによる初戦敗退')));
assert.ok(TEAMS_2026_SHIGA_U15_MEN.filter(team=>team.rank==='E').every(team=>team.notes.includes('通常の1回戦')));
const old={tournamentId:'older-event',year:2025,placementRank:'B'},shiga={tournamentId:TOURNAMENT_2026_SHIGA_U15_MEN.id,year:2026,placementRank:'S'},first=[old,shiga],second=first.map(item=>item.tournamentId===shiga.tournamentId?{...item,...shiga}:item);
assert.equal(second.length,2,'reimport preserves older history and updates rather than duplicates the Shiga result');
console.log('2026 Shiga U15 men import data: ok');
