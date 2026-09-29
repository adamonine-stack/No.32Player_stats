import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_CBG_HYOGO_MEN = {
  id: '2026-27-cbg-hyogo-men',
  competitionId: '2026-27-cbg-hyogo-men',
  year: 2026,
  season: '2026-27',
  generation: '2026-27',
  name: '2026 U15 CLUB BASKETBALL GAMES 兵庫県予選大会 男子',
  shortName: '2026 CBG兵庫県予選大会 男子',
  competitionName: '2026 U15 CLUB BASKETBALL GAMES 兵庫県予選大会',
  competitionType: '兵庫県大会',
  type: '県大会 / CBG兵庫県予選',
  tournamentLevel: 'prefecture',
  prefecture: '兵庫県',
  category: 'U15男子',
  gender: '男子',
  participantCount: 50,
  confirmedPlacementCount: 8,
  resultConfirmed: true,
  resultStatus: 'completed',
  completedDate: '2026-09-23',
  sourceType: 'chat_verified_final_result_image',
  source: {
    document: '2026 U15男子バスケ兵庫県予選最終結果',
    verifiedDate: '2026-09-30',
    scope: '最終順位1位〜8位'
  }
};

const FINAL_TOP8 = [
  ['BRAVE BIRDS', '優勝', 1, ['BRAVEBIRDS']],
  ['North Wave', '準優勝', 2, ['NorthWave']],
  ['センターサークル', '3位', 3, []],
  ['BAY CROWN JUNIOR', '4位', 4, ['BAYCROWN JUNIOR']],
  ['V-WAVE', '5位', 5, []],
  ['DunkGo Club', '6位', 6, []],
  ['HDC Academy Cranes', '7位', 7, []],
  ['DIVE basketball academy', '8位', 8, ['DIVE']]
];

export const TEAMS_2026_CBG_HYOGO_MEN = FINAL_TOP8.map(([teamName, placementLabel, placement, aliases]) => ({
  teamName,
  normalizedTeamName: normalizeImportedTeamName(teamName),
  aliases,
  placementLabel,
  placement,
  rank: placement === 1 ? 'S' : placement === 2 ? 'A+' : placement <= 4 ? 'A' : 'B',
  teamType: 'クラブチーム',
  ageGroup: 'U15'
}));

const match = (matchNumber, round, teamA, teamAScore, teamB, teamBScore, winner) => ({
  matchNumber,
  round,
  date: '2026-09-23',
  teamA,
  teamAScore,
  teamB,
  teamBScore,
  winner,
  loser: winner === teamA ? teamB : teamA,
  result: 'completed',
  season: '2026-27'
});

export const MATCHES_2026_CBG_HYOGO_MEN = [
  match('classification-5', '5位決定戦', 'V-WAVE', 62, 'DunkGo Club', 58, 'V-WAVE'),
  match('classification-7', '7位決定戦', 'HDC Academy Cranes', 68, 'DIVE basketball academy', 54, 'HDC Academy Cranes'),
  match('third-place', '3位決定戦', 'センターサークル', 58, 'BAY CROWN JUNIOR', 45, 'センターサークル'),
  match('final', '決勝', 'BRAVE BIRDS', 63, 'North Wave', 51, 'BRAVE BIRDS')
];
