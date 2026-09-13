import assert from 'node:assert/strict';
import { TOURNAMENT_2026_KINKI_U15_MEN, TEAMS_2026_KINKI_U15_MEN, MATCHES_2026_KINKI_U15_MEN } from '../js/data/2026-kinki-u15-men.js';
import { upperTournamentBonus } from '../js/calculations/opponent-team-calculations.js';
import { findExistingTournamentTeam } from '../js/calculations/team-name-matching.js';
assert.equal(TOURNAMENT_2026_KINKI_U15_MEN.tournamentLevel,'block');
assert.equal(TEAMS_2026_KINKI_U15_MEN.length,9);
assert.equal(MATCHES_2026_KINKI_U15_MEN.length,8);
assert.deepEqual(TEAMS_2026_KINKI_U15_MEN.slice(0,4).map(team=>[team.teamName,team.placementLabel]),[['KAGO CLUB','優勝'],['T-SMILE','準優勝'],['サンシャインズ','ベスト4'],['B.UNITE','ベスト4']]);
assert.equal(upperTournamentBonus({...TEAMS_2026_KINKI_U15_MEN[0],tournamentLevel:'block'}),120);
assert.equal(upperTournamentBonus({...TEAMS_2026_KINKI_U15_MEN[8],tournamentLevel:'block'}),20);
assert.ok(MATCHES_2026_KINKI_U15_MEN.every(game=>TEAMS_2026_KINKI_U15_MEN.some(team=>team.teamName===game.winner)&&TEAMS_2026_KINKI_U15_MEN.some(team=>team.teamName===game.loser)));
const duplicateKagoTeams=[
  {id:'legacy-kago',teamName:'KAGO CLUB',prefecture:'大阪府',tournamentPlacements:[{tournamentId:'2025-osaka-jr-winter-cup-men'}]},
  {id:'official-2026-kago',teamName:'KAGO CLUB',prefecture:'大阪府',tournamentPlacements:[{tournamentId:'2026-osaka-u15-club-men'}]}
];
const resolvedKago=findExistingTournamentTeam({teamName:'KAGO CLUB',prefecture:'大阪府'},duplicateKagoTeams,'2026-osaka-u15-club-men');
assert.equal(resolvedKago.result,'PREFERRED_TOURNAMENT_MATCH');
assert.equal(resolvedKago.team.id,'official-2026-kago');
assert.equal(findExistingTournamentTeam({teamName:'KAGO CLUB',prefecture:'大阪府'},duplicateKagoTeams,'missing').result,'AMBIGUOUS');
console.log('2026 Kinki U15 men official results: ok');
