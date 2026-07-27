import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_OSAKA_U15_MEN={id:'2026-osaka-u15-club-men',year:2026,name:'大阪府U15クラブバスケットボール選手権（近畿サマー予選）男子',shortName:'2026年度 大阪府U15クラブ選手権',prefecture:'大阪府',category:'U15男子',type:'都道府県大会',startDate:'2026-07-04',endDate:'2026-07-25',participantCount:24,resultConfirmed:true,resultStatus:'completed',sourceType:'officialTournamentPdf'};

const TOP=[['KAGO CLUB','優勝',1],['REDFORCES','準優勝',2],['SUN HEARTS','3位',3],['T-SMILE','4位',4]];
const BEST8=['RGS','ANGRY OWLS','AIR','RED FROGS'];
const BEST16=['ENERGY','大阪GOLDEN EGG','HOOPERS','CLUB SPIRITS','FRONTIER SPIRITS','B☆MAX','EAST.O.ACADEMY','Secret Base'];
const ALL=['KAGO CLUB','ENERGY','ディノニクスU15','sHow time','RGS','大阪GOLDEN EGG','ANGRY OWLS','HOOPERS','HOSOGO GIBSONS','NEXTEST','CLUB SPIRITS','SUN HEARTS','REDFORCES','FRONTIER SPIRITS','BLACK UNICORN','B☆MAX','BC Alma','AIR','RED FROGS','EAST.O.ACADEMY','Switch! U15','Secret Base','IBBC','T-SMILE'];
export const TEAMS_2026_OSAKA_U15_MEN=ALL.map(teamName=>{const top=TOP.find(([name])=>name===teamName),placementLabel=top?.[1]||(BEST8.includes(teamName)?'ベスト8':BEST16.includes(teamName)?'ベスト16':'初戦敗退');return {teamName,normalizedTeamName:normalizeImportedTeamName(teamName),placementLabel,placement:top?.[2]||null}});

const match=(date,court,gameNumber,round,teamA,teamAScore,teamB,teamBScore,winner,extra={})=>({date,court,gameNumber,round,teamA,teamAScore,teamB,teamBScore,winner,loser:winner===teamA?teamB:teamA,resultConfirmed:true,scoreConfirmed:true,sourceType:'officialTournamentPdf',...extra});
export const MATCHES_2026_OSAKA_U15_MEN=[
  match('2026-07-04','A',5,'初戦','ENERGY',78,'ディノニクスU15',42,'ENERGY'),
  match('2026-07-04','B',5,'初戦','sHow time',51,'RGS',52,'RGS'),
  match('2026-07-05','B',3,'初戦','NEXTEST',43,'CLUB SPIRITS',60,'CLUB SPIRITS'),
  match('2026-07-05','A',1,'初戦','FRONTIER SPIRITS',104,'BLACK UNICORN',49,'FRONTIER SPIRITS'),
  match('2026-07-05','B',1,'初戦','B☆MAX',55,'BC Alma',41,'B☆MAX'),
  match('2026-07-05','A',3,'初戦','HOOPERS',68,'HOSOGO GIBSONS',56,'HOOPERS'),
  match('2026-07-05','A',2,'初戦','EAST.O.ACADEMY',86,'Switch! U15',61,'EAST.O.ACADEMY'),
  match('2026-07-05','B',2,'初戦','Secret Base',50,'IBBC',48,'Secret Base'),
  match('2026-07-12','A',1,'ベスト16','KAGO CLUB',78,'ENERGY',43,'KAGO CLUB'),
  match('2026-07-12','B',1,'ベスト16','RGS',68,'大阪GOLDEN EGG',66,'RGS'),
  match('2026-07-12','A',4,'ベスト16','ANGRY OWLS',63,'HOOPERS',41,'ANGRY OWLS'),
  match('2026-07-12','B',4,'ベスト16','CLUB SPIRITS',57,'SUN HEARTS',71,'SUN HEARTS'),
  match('2026-07-12','A',2,'ベスト16','REDFORCES',77,'FRONTIER SPIRITS',50,'REDFORCES'),
  match('2026-07-12','B',2,'ベスト16','B☆MAX',42,'AIR',48,'AIR'),
  match('2026-07-12','A',3,'ベスト16','RED FROGS',72,'EAST.O.ACADEMY',50,'RED FROGS'),
  match('2026-07-12','B',3,'ベスト16','Secret Base',24,'T-SMILE',94,'T-SMILE'),
  match('2026-07-18','A',3,'準々決勝','KAGO CLUB',66,'RGS',45,'KAGO CLUB'),
  match('2026-07-18','B',3,'準々決勝','ANGRY OWLS',55,'SUN HEARTS',57,'SUN HEARTS',{scoreRequiresReview:true,requiresManualReview:true,provisionalScore:{'ANGRY OWLS':55,'SUN HEARTS':57}}),
  match('2026-07-18','A',4,'準々決勝','REDFORCES',52,'AIR',47,'REDFORCES'),
  match('2026-07-18','B',4,'準々決勝','RED FROGS',40,'T-SMILE',61,'T-SMILE'),
  match('2026-07-25','A',2,'準決勝','KAGO CLUB',66,'SUN HEARTS',47,'KAGO CLUB'),
  match('2026-07-25','B',2,'準決勝','REDFORCES',null,'T-SMILE',null,'REDFORCES',{winnerConfirmed:true,scoreConfirmed:false,requiresManualReview:true,sourcePrintedScore:'61-61',reviewReason:'PDFの得点が同点表記だが、勝ち上がり線ではREDFORCESが決勝進出'}),
  match('2026-07-25','B',4,'3位決定戦','SUN HEARTS',83,'T-SMILE',61,'SUN HEARTS',{sourceConflict:true,sourcePrintedOpponent:'REDFORCES',correctedOpponent:'T-SMILE',correctionReason:'REDFORCESは決勝進出チームであり、トーナメント構造上3位決定戦の対戦相手は準決勝敗退のT-SMILEとなるため'}),
  match('2026-07-25','A',4,'決勝','KAGO CLUB',52,'REDFORCES',35,'KAGO CLUB')
];
