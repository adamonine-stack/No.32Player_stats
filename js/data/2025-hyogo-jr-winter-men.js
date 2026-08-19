import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';
export const HYOGO_OPPONENT_TEAM_MERGES=[
  ['All Blacks A','All blacks'],
  ['BAYCROWN JUNIOR','BAY CROWN JUNIOR'],
  ['BRAVEBIRDS','BRAVE BIRDS'],
  ['EPIC BASKETBALL CLUB U15','EPIC BASKETBALL CLUB'],
  ['NorthWave','North Wave'],
  ['teamDENY','team DENY'],
  ['TEDDY BASKETBALL CLUB','UNICORN BASKETBALL CLUB(旧TEDDY)'],
  ['ファルコンズ','Falcons U15 basketball club team']
].map(([sourceName,targetName])=>({sourceName,targetName}));
export const HYOGO_IMPORT_CANONICAL_NAMES=new Map(HYOGO_OPPONENT_TEAM_MERGES.map(item=>[item.sourceName,item.targetName]));
export const TOURNAMENT_2025_HYOGO_JR_WINTER_MEN={id:'2025-hyogo-jr-winter-cup-qualifier-men',year:2025,season:'2025-26',name:'Jr.ウィンターカップ2025-2026 2025年度 第6回全国U15バスケットボール選手権 兵庫県予選大会（代表決定戦）男子',shortName:'Jr.ウィンターカップ2025-2026 兵庫県予選大会',competitionName:'Jr.ウィンターカップ2025-2026 兵庫県予選大会',competitionType:'prefectural_championship',prefecture:'兵庫県',category:'U15男子',gender:'男子',type:'県大会 / Jr.ウィンターカップ兵庫県予選',participantCount:50,generationType:'previous',sourceType:'official_tournament_bracket',resultConfirmed:true,resultStatus:'completed'};
const RESULT={champion:['優勝','S'],runner_up:['準優勝','A+'],best4:['ベスト4','A'],best8:['ベスト8','B+'],best16:['ベスト16','B'],best32:['ベスト32','C'],first_round:['初戦敗退','D']};
const rows=[['V-WAVE','best8',2],['西神戸ユニバース','best32',1],['宝梅中学校','first_round',0],['精道中学校','first_round',0],['WINGS','best16',1],['All Blacks B','best32',1],['Dpro Laluz','first_round',0],['甲南中学校','best16',2],['VEARTH','best32',1],['DIVE basketball academy','first_round',0],['ZERO','first_round',0],['神戸ストークスU15','best32',1],['EPIC BASKETBALL CLUB U15','best4',3],['HDC Academy Cranes','best8',2],['BRUINS ashiya','best32',1],['VLakers Basketball Club U14 男子','first_round',0],['Three B','best16',2],['えびす','first_round',0],['センターサークル','first_round',0],['U14 ゴッドドア','best16',1],['COULEUR','first_round',0],['G.Dark Horse','best32',1],['ARMS','first_round',0],['たつの市立龍野西中学校','best32',1],['ゴッドドア','champion',5],['VLakers Basketball Club U15 男子','best16',1],['神戸ストークスU14','first_round',0],['NorthWave','best32',1],['神戸HOPES','first_round',0],['Turkeys','best32',1],['BAYCROWN JUNIOR','best8',2],['ICE','best16',2],['Turkeys 2nd','first_round',0],['Wild Wolves','best32',1],['VLakers Basketball Club U13 男子','first_round',0],['teamDENY','best32',1],['報徳学園中学校','runner_up',4],['KARTER','best8',2],['RED PIECE','first_round',0],['BRAVEBIRDS u14','best32',1],['SAKURA PRESS','first_round',0],['All Blacks A','best16',2],['B.P.F ACADEMY','first_round',0],['GOAT','first_round',0],['明石市立望海中学校','best32',1],['BRAVEBIRDS','best4',3],['KobeCenterCircle','first_round',0],['Falcons U15 basketball club team','first_round',0],['TEDDY BASKETBALL CLUB','best16',2],['RIVER WEST SEADRAGONS','first_round',0]];
const ageGroup=name=>/U14/i.test(name)?'U14':/U13/i.test(name)?'U13':'U15';
const clubId=name=>normalizeImportedTeamName(name.replace(/\s*u1[345].*$/i,'').replace(/^U14\s+/i,''));
export const TEAMS_2025_HYOGO_JR_WINTER_MEN=rows.map(([teamName,result,wins])=>{const [placementLabel,seasonRank]=RESULT[result];return {teamName,normalizedTeamName:normalizeImportedTeamName(teamName),placementLabel,result,seasonRank,rank:seasonRank,wins,losses:result==='champion'?0:1,season:'2025-26',generationType:'previous',ageGroup:ageGroup(teamName),clubId:clubId(teamName)}});
