import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_KYOTO_U15_MEN={id:'2026-kyoto-u15-club-championship-men',year:2026,name:'2026年度 京都府U15クラブバスケットボール選手権大会',shortName:'2026年度 京都府U15クラブバスケットボール選手権大会',prefecture:'京都府',category:'U15',gender:'男子',type:'都道府県大会',participantCount:16,resultConfirmed:true,resultStatus:'completed',sourceType:'confirmedTournamentResult'};

const RESULTS=[
  ['KYOTO DREAMERS','優勝',1,'S'],['B.UNITE','準優勝',2,'A+'],
  ['京都neo advance','ベスト4',null,'A'],['FUBC','ベスト4',null,'A'],
  ['京都フェニックス','ベスト8',null,'B+'],['YAMASHIRO UNITED','ベスト8',null,'B+'],['黄紫アストラル','ベスト8',null,'B+'],['Risicare','ベスト8',null,'B+'],
  ['京都LYCAONS','初戦敗退',null,'D'],['Les Ailes','初戦敗退',null,'D'],['TITANS','初戦敗退',null,'D'],['YAMASHIRO EAGLES','初戦敗退',null,'D'],['BLAST','初戦敗退',null,'D'],['チーム舞鶴','初戦敗退',null,'D'],['@z','初戦敗退',null,'D'],['GRiT U15','初戦敗退',null,'D']
];
export const TEAMS_2026_KYOTO_U15_MEN=RESULTS.map(([teamName,placementLabel,placement,rank])=>({teamName,normalizedTeamName:normalizeImportedTeamName(teamName),placementLabel,placement,rank}));

const match=(round,matchNumber,teamA,teamAScore,teamB,teamBScore)=>({round,matchNumber,teamA,teamAScore,teamB,teamBScore,winner:teamAScore>teamBScore?teamA:teamB,loser:teamAScore>teamBScore?teamB:teamA,resultConfirmed:true,scoreConfirmed:true,sourceType:'confirmedTournamentResult'});
export const MATCHES_2026_KYOTO_U15_MEN=[
  match('初戦',1,'京都LYCAONS',47,'B.UNITE',106),match('初戦',2,'Les Ailes',15,'京都フェニックス',101),match('初戦',3,'TITANS',4,'YAMASHIRO UNITED',129),match('初戦',4,'YAMASHIRO EAGLES',31,'京都neo advance',58),
  match('初戦',5,'BLAST',20,'FUBC',119),match('初戦',6,'チーム舞鶴',50,'黄紫アストラル',62),match('初戦',7,'@z',39,'Risicare',66),match('初戦',8,'GRiT U15',28,'KYOTO DREAMERS',91),
  match('準々決勝',1,'京都フェニックス',56,'B.UNITE',64),match('準々決勝',2,'YAMASHIRO UNITED',27,'京都neo advance',51),match('準々決勝',3,'黄紫アストラル',32,'FUBC',111),match('準々決勝',4,'Risicare',40,'KYOTO DREAMERS',86),
  match('準決勝',1,'京都neo advance',49,'B.UNITE',75),match('準決勝',2,'FUBC',34,'KYOTO DREAMERS',82),match('決勝',1,'B.UNITE',61,'KYOTO DREAMERS',68)
];
