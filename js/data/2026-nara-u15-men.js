import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_NARA_U15_MEN={id:'2026-nara-u15-club-championship-men',year:2026,name:'2026年度 奈良県U15クラブチーム選手権大会（男子）',shortName:'2026年度 奈良県U15クラブチーム選手権大会',prefecture:'奈良県',category:'U15男子',type:'都道府県大会',participantCount:18,resultConfirmed:true,resultStatus:'completed',sourceType:'officialTournamentPdf'};

const RESULTS=[
  ['サンシャインズ','優勝',1],['PIRATES','準優勝',2],['Unity MONKEYS','ベスト4',null],['FELKYS','ベスト4',null],
  ['WIZARDS U15','ベスト8',null],['YAMATO RIPPLE','ベスト8',null],['ARAN ARDENT ACADEMY','ベスト8',null],['バンビシャス奈良U15-2nd','ベスト8',null],
  ['三郷TreaSsure U15','ベスト16（初戦敗退）',null],['BANZAI jr.','ベスト16（初戦敗退）',null],['GJ ballers','ベスト16（初戦敗退）',null],['川西クラブ','ベスト16（初戦敗退）',null],['NARA FUTURE','ベスト16（初戦敗退）',null],['キャプテンハーロックU15','ベスト16（初戦敗退）',null],['Esperanza HEGURI','ベスト16（初戦敗退）',null],
  ['Rafioants','1回戦敗退',null],['JETARCS','1回戦敗退',null],['葛城 WILD BEES','1回戦敗退',null]
];
export const TEAMS_2026_NARA_U15_MEN=RESULTS.map(([teamName,placementLabel,placement])=>({teamName,normalizedTeamName:normalizeImportedTeamName(teamName),placementLabel,placement}));

const match=(round,matchNumber,teamA,teamAScore,teamB,teamBScore)=>({round,matchNumber,teamA,teamAScore,teamB,teamBScore,winner:teamAScore>teamBScore?teamA:teamB,loser:teamAScore>teamBScore?teamB:teamA,resultConfirmed:true,scoreConfirmed:true,sourceType:'officialTournamentPdf'});
export const MATCHES_2026_NARA_U15_MEN=[
  match('1回戦',1,'PIRATES',113,'WIZARDS U15',46),match('1回戦',2,'三郷TreaSsure U15',94,'YAMATO RIPPLE',54),match('1回戦',3,'BANZAI jr.',67,'GJ ballers',53),match('1回戦',4,'Unity MONKEYS',128,'川西クラブ',22),match('1回戦',5,'ARAN ARDENT ACADEMY',56,'NARA FUTURE',45),match('1回戦',6,'FELKYS',71,'葛城 WILD BEES',34),match('1回戦',7,'バンビシャス奈良U15-2nd',110,'キャプテンハーロックU15',23),match('1回戦',8,'サンシャインズ',78,'Esperanza HEGURI',50),
  match('準々決勝',1,'PIRATES',123,'三郷TreaSsure U15',40),match('準々決勝',2,'Unity MONKEYS',64,'BANZAI jr.',48),match('準々決勝',3,'FELKYS',80,'ARAN ARDENT ACADEMY',43),match('準々決勝',4,'サンシャインズ',71,'バンビシャス奈良U15-2nd',40),
  match('準決勝',1,'PIRATES',62,'Unity MONKEYS',57),match('準決勝',2,'サンシャインズ',73,'FELKYS',59),match('決勝',1,'サンシャインズ',83,'PIRATES',48)
];
