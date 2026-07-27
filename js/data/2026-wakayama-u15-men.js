import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_WAKAYAMA_U15_MEN={
  id:'2026-wakayama-u15-club-championship-men',
  year:2026,
  name:'2026年度第1回和歌山県U15クラブバスケットボール選手権大会',
  prefecture:'和歌山県',
  category:'U15男子',
  gender:'男子',
  type:'都道府県大会',
  startDate:'2026-06-13',
  endDate:'2026-06-14',
  venue:'和歌山ビッグホエール',
  participantCount:8,
  resultConfirmed:true,
  resultStatus:'completed',
  sourceType:'officialTournamentPdf'
};

const RESULTS=[
  ['adorare','優勝',3,'S',1],
  ['ROOKIES','準優勝',2,'A',2],
  ['RED KINGS','ベスト4',1,'C',null],
  ['Jr御坊','ベスト4',1,'C',null],
  ['ブランリオン','ベスト8（初戦敗退）',0,'D',null],
  ['GLÄNZ','ベスト8（初戦敗退）',0,'D',null],
  ['GLÄNZ ZWEI','ベスト8（初戦敗退）',0,'D',null],
  ['adorare second','ベスト8（初戦敗退）',0,'D',null]
];

export const TEAMS_2026_WAKAYAMA_U15_MEN=RESULTS.map(([teamName,placementLabel,wins,rank,placement])=>({
  teamName,
  normalizedTeamName:normalizeImportedTeamName(teamName),
  placementLabel,
  wins,
  rank,
  placement
}));

const match=(round,matchNumber,teamA,teamAScore,teamB,teamBScore)=>({
  round,matchNumber,teamA,teamAScore,teamB,teamBScore,
  winner:teamAScore>teamBScore?teamA:teamB,
  loser:teamAScore>teamBScore?teamB:teamA,
  resultConfirmed:true,
  scoreConfirmed:true,
  sourceType:'officialTournamentPdf'
});

export const MATCHES_2026_WAKAYAMA_U15_MEN=[
  match('1回戦',1,'ブランリオン',25,'RED KINGS',130),
  match('1回戦',2,'adorare',62,'GLÄNZ',46),
  match('1回戦',3,'Jr御坊',81,'GLÄNZ ZWEI',38),
  match('1回戦',4,'adorare second',41,'ROOKIES',90),
  match('準決勝',1,'RED KINGS',58,'adorare',66),
  match('準決勝',2,'Jr御坊',55,'ROOKIES',58),
  match('決勝',1,'adorare',61,'ROOKIES',59)
];
