import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_KINKI_U15_MEN={
  id:'2026-kinki-u15-club-championship-men',
  year:2026,
  season:'2026-27',
  name:'2026年度 近畿U15クラブバスケットボール選手権大会（男子）',
  shortName:'2026年度 近畿U15クラブ選手権',
  tournamentLevel:'block',
  type:'ブロック大会',
  category:'U15男子',
  gender:'男子',
  startDate:'2026-08-08',
  endDate:'2026-08-09',
  venue:'にっしんでんきアリーナ京都',
  participantCount:9,
  resultConfirmed:true,
  resultStatus:'completed',
  source:'https://kbba.jp/u15/game/%e4%bb%a4%e5%92%8c%ef%bc%98%e5%b9%b4%e5%ba%a6%e8%bf%91%e7%95%bfu15%e3%82%af%e3%83%a9%e3%83%96%e3%83%90%e3%82%b9%e3%82%b1%e3%83%83%e3%83%88%e3%83%9c%e3%83%bc%e3%83%ab%e9%81%b8%e6%89%8b%e6%a8%a9/',
  sourceType:'officialTournamentImage'
};

const RESULTS=[
  ['KAGO CLUB','大阪府','優勝',1],
  ['T-SMILE','大阪府','準優勝',2],
  ['サンシャインズ','奈良県','ベスト4',null],
  ['B.UNITE','京都府','ベスト4',null],
  ['センターサークル','兵庫県','ベスト8',null],
  ['KYOTO DREAMERS','京都府','ベスト8',null],
  ['adorare','和歌山県','ベスト8',null],
  ['Lake Force','滋賀県','ベスト8',null],
  ['North Wave','兵庫県','出場',null]
];

export const TEAMS_2026_KINKI_U15_MEN=RESULTS.map(([teamName,prefecture,placementLabel,placement])=>({
  teamName,prefecture,placementLabel,placement,normalizedTeamName:normalizeImportedTeamName(teamName)
}));

const match=(date,court,gameNumber,round,teamA,teamAScore,teamB,teamBScore)=>({date,court,gameNumber,round,teamA,teamAScore,teamB,teamBScore,winner:teamAScore>teamBScore?teamA:teamB,loser:teamAScore>teamBScore?teamB:teamA,resultConfirmed:true,scoreConfirmed:true,sourceType:'officialTournamentImage'});
export const MATCHES_2026_KINKI_U15_MEN=[
  match('2026-08-08','A',1,'出場決定戦','North Wave',59,'B.UNITE',62),
  match('2026-08-08','B',3,'出場決定戦','Lake Force',43,'KAGO CLUB',69),
  match('2026-08-08','A',2,'準々決勝','サンシャインズ',72,'センターサークル',62),
  match('2026-08-08','B',2,'準々決勝','T-SMILE',86,'KYOTO DREAMERS',56),
  match('2026-08-08','A',3,'準々決勝','adorare',55,'B.UNITE',72),
  match('2026-08-09','A',1,'準決勝','サンシャインズ',49,'T-SMILE',65),
  match('2026-08-09','B',1,'準決勝','B.UNITE',47,'KAGO CLUB',70),
  match('2026-08-09','A',2,'決勝','T-SMILE',49,'KAGO CLUB',66)
];
