import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_SHIGA_U15_MEN={
  id:'2026-shiga-u15-club-championship-men',
  year:2026,
  name:'令和8年度滋賀県U15クラブバスケットボール選手権大会',
  secondaryName:'令和8年度近畿U15クラブバスケットボール選手権大会 滋賀県予選会',
  prefecture:'滋賀県',
  category:'U15男子',
  gender:'男子',
  type:'都道府県大会',
  startDate:'2026-07-11',
  endDate:'2026-07-12',
  venue:'能登川アリーナ',
  participantCount:11,
  resultConfirmed:true,
  resultStatus:'completed',
  sourceType:'officialTournamentPdf'
};

const RESULTS=[
  ['LakeForce','優勝',3,0,'S',1,'3勝0敗'],
  ['ジュニアボーラーズ','準優勝',2,1,'A+',2,'2勝1敗'],
  ['IBS Boy','第3位・ベスト4',2,1,'A',3,'2勝1敗'],
  ['SILVER SHARKS','第3位・ベスト4',1,1,'A',3,'1勝1敗'],
  ['GENESIS','準々決勝敗退・初戦敗退',0,1,'D',null,'0勝1敗・シードによる初戦敗退'],
  ['B-BOYZ','準々決勝敗退・初戦敗退',0,1,'D',null,'0勝1敗・シードによる初戦敗退'],
  ['TBA PHEONIX','準々決勝敗退・初戦敗退',0,1,'D',null,'0勝1敗・シードによる初戦敗退'],
  ['滋賀レイクスU15Next','1回戦敗退',0,1,'E',null,'0勝1敗・通常の1回戦で初戦敗退'],
  ['JUMP','1回戦敗退',0,1,'E',null,'0勝1敗・通常の1回戦で初戦敗退'],
  ['B-Braves.JBC','1回戦敗退',0,1,'E',null,'0勝1敗・通常の1回戦で初戦敗退'],
  ['REDNEX.Jr','1回戦敗退',0,1,'E',null,'0勝1敗・通常の1回戦で初戦敗退']
];

export const TEAMS_2026_SHIGA_U15_MEN=RESULTS.map(([teamName,placementLabel,wins,losses,rank,placement,notes])=>({
  teamName,
  normalizedTeamName:normalizeImportedTeamName(teamName),
  placementLabel,
  wins,
  losses,
  rank,
  placement,
  notes
}));

const match=(round,matchNumber,teamA,teamAScore,teamB,teamBScore)=>({
  round,matchNumber,teamA,teamAScore,teamB,teamBScore,
  winner:teamAScore>teamBScore?teamA:teamB,
  loser:teamAScore>teamBScore?teamB:teamA,
  resultConfirmed:true,
  scoreConfirmed:true,
  sourceType:'officialTournamentPdf'
});

export const MATCHES_2026_SHIGA_U15_MEN=[
  match('1回戦',1,'LakeForce',77,'滋賀レイクスU15Next',36),
  match('1回戦',2,'IBS Boy',48,'JUMP',34),
  match('1回戦',3,'ジュニアボーラーズ',89,'B-Braves.JBC',18),
  match('1回戦',4,'SILVER SHARKS',51,'REDNEX.Jr',41),
  match('準々決勝',1,'LakeForce',70,'GENESIS',28),
  match('準々決勝',2,'IBS Boy',37,'TBA PHEONIX',21),
  match('準々決勝',3,'ジュニアボーラーズ',76,'B-BOYZ',8),
  match('準決勝',1,'LakeForce',74,'IBS Boy',44),
  match('準決勝',2,'ジュニアボーラーズ',68,'SILVER SHARKS',42),
  match('決勝',1,'LakeForce',73,'ジュニアボーラーズ',30)
];
