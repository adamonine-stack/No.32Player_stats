import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const CLUB_ALIASES={
  'PIRATES':['PIRATES U15','Pirates U15','Pirates u15'],
  'サンシャインズ':['Sunshines','サンシャインズA'],
  'バンビシャス奈良':['バンビシャス奈良U15'],
  'Y.MONKEYS':['Y MONKEYS','Y・MONKEY'],
  'BANZAI junior.':['BANZAIjunior','BANZAI jr.','BANZAI.jr'],
  'Rafioants':['Rafio ants'],
  'NARA FUTURE':['NARAFUTURE'],
  'Esperanza HEGURI':['EsperanzaHEGURI'],
  'Strike Force':['STRIKE FORCE']
};

function school(sourceName,placementLabel,rank,extra={}){
  const teamName=sourceName==='教育大'?'奈良教育大学附属中学校':sourceName.endsWith('中学校')?sourceName:`${sourceName}中学校`;
  const aliases=[sourceName,sourceName.endsWith('中学校')?sourceName.replace(/中学校$/u,''):sourceName+'中'];
  if(sourceName==='教育大')aliases.push('奈良教育大学附属','教育大学附属');
  return {sourceName,teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),aliases:[...new Set(aliases)],teamType:'中学校',ageGroup:'U15',placementLabel,rank,...extra};
}
function club(teamName,placementLabel,rank,extra={}){
  return {sourceName:teamName,teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),aliases:CLUB_ALIASES[teamName]||[],teamType:'クラブチーム',ageGroup:'U15',placementLabel,rank,...extra};
}
function tournament(base){
  return {prefecture:'奈良県',category:'U15男子',gender:'男子',tournamentLevel:'prefecture',resultConfirmed:true,resultStatus:'completed',sourceType:'verifiedTournamentResult',...base};
}

export const TOURNAMENT_2025_NARA_JHS_CHAMPIONSHIP_MEN=tournament({
  id:'2025-nara-jhs-championship-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'第71回奈良県中学校バスケットボール選手権大会 男子',
  shortName:'2025 奈良県中学校選手権 男子',type:'県大会 / 中学校選手権',
  participantCount:null,resultScope:'男子ベスト8確認済み',
  source:{organization:'奈良新聞デジタル',document:'第71回奈良県中学校バスケットボール選手権大会 男子 大会結果',publishedDate:'2025-05-04',pageUrl:'https://www.nara-np.co.jp/sports/basketball/tournament42.html',verified:true}
});
export const TEAMS_2025_NARA_JHS_CHAMPIONSHIP_MEN=[
  school('新庄','優勝','S'),school('登美ヶ丘北','準優勝','A+'),school('平群','3位','A'),school('大成','4位','A'),
  school('天理南','ベスト8','B'),school('広陵','ベスト8','B'),school('二名','ベスト8','B'),school('飛鳥','ベスト8','B')
];

export const TOURNAMENT_2025_NARA_JHS_SOUTAI_MEN=tournament({
  id:'2025-nara-jhs-soutai-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'第76回奈良県中学校総合体育大会バスケットボールの部 男子',
  shortName:'2025 奈良県中学校総体 男子',type:'県大会 / 中学校総体',
  participantCount:null,resultScope:'男子ベスト8確認済み',
  source:{organization:'奈良県バスケットボール協会 / 奈良新聞デジタル',document:'第76回奈良県中学校総合体育大会バスケットボールの部 男子 大会結果',publishedDate:'2025-07-26',pageUrl:'https://www.nara-np.co.jp/sports/basketball/tournament47.html',pdfUrl:'https://nara.japanbasketball.jp/jhs/2025/25_sotai_720.pdf',verified:true}
});
export const TEAMS_2025_NARA_JHS_SOUTAI_MEN=[
  school('新庄','優勝','S'),school('登美ヶ丘北','準優勝','A+'),school('平群','3位','A'),school('大成','4位','A'),
  school('榛原','ベスト8','B'),school('天理南','ベスト8','B'),school('天理西','ベスト8','B'),school('三笠','ベスト8','B')
];

export const TOURNAMENT_2025_NARA_JHS_ROOKIES_MEN=tournament({
  id:'2025-nara-jhs-rookies-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'第74回奈良県中学校バスケットボール新人大会 男子',
  shortName:'2025 奈良県中学校新人大会 男子',type:'県大会 / 中学校新人',
  participantCount:null,resultScope:'男子ベスト4確認済み',
  source:{organization:'奈良県バスケットボール協会U15',document:'2025年度 奈良県中学校バスケットボール新人大会 結果',publishedDate:'2025-11-03',pageUrl:'https://www.iezo.net/forum/basketball-j/134858/',verified:true}
});
export const TEAMS_2025_NARA_JHS_ROOKIES_MEN=[
  school('榛原','優勝','S'),school('上','準優勝','A+'),school('大成','ベスト4','A'),school('畝傍','ベスト4','A')
];

export const TOURNAMENT_2025_NARA_JR_WINTER_MEN=tournament({
  id:'2025-nara-jr-winter-qualifier-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'2025年度第6回奈良県U15バスケットボール選手権大会 兼 Jr.ウインターカップ奈良県予選 男子',
  shortName:'2025 Jr.ウインターカップ奈良県予選 男子',type:'県大会 / Jr.ウインターカップ奈良県予選',
  participantCount:8,resultScope:'男子全8チーム確認済み',
  source:{organization:'奈良県バスケットボール協会U15 / JBA',document:'2025年度第6回奈良県U15バスケットボール選手権大会 結果',publishedDate:'2025-11-16',pageUrl:'https://www.iezo.net/forum/basketball-j/132750/',jbaUrl:'https://juniorwintercup2025-26.japanbasketball.jp/areagames/',verified:true}
});
export const TEAMS_2025_NARA_JR_WINTER_MEN=[
  club('バンビシャス奈良','優勝','S'),club('PIRATES','準優勝','A+'),club('Rafioants','ベスト4','A'),club('サンシャインズ','ベスト4','A'),
  club('Y.MONKEYS','ベスト8','B'),club('BANZAI junior.','ベスト8','B'),club('NARA FUTURE','ベスト8','B'),club('Esperanza HEGURI','ベスト8','B')
];

export const TOURNAMENT_2025_NARA_CLUB_CHAMPIONSHIP_MEN=tournament({
  id:'2025-nara-u15-club-championship-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'2025年度 奈良県U15クラブ選手権大会 男子',
  shortName:'2025 奈良県U15クラブ選手権 男子',type:'県大会 / U15クラブ選手権',
  participantCount:null,resultScope:'男子決勝・優勝準優勝確認済み',
  source:{organization:'PIRATES NARA',document:'奈良県U15クラブ選手権大会 決勝戦評・チーム実績',publishedDate:'2025-09-28',pageUrl:'https://www.pirates-nara.com/category/u15-boys/',verified:true}
});
export const TEAMS_2025_NARA_CLUB_CHAMPIONSHIP_MEN=[club('PIRATES','優勝','S'),club('サンシャインズ','準優勝','A+')];

export const TOURNAMENT_2026_NARA_JHS_SOUTAI_MEN=tournament({
  id:'2026-nara-jhs-soutai-men',year:2026,season:'2026-27',generation:'2026-27',
  name:'第77回奈良県中学校総合体育大会バスケットボールの部 男子',
  shortName:'2026 奈良県中学校総体 男子',type:'県大会 / 中学校総体',
  participantCount:null,resultScope:'男子ベスト8確認済み',
  source:{organization:'奈良県中学校体育連盟 / 奈良県バスケットボール協会U15',document:'第77回奈良県中学校総合体育大会 バスケットボール男子 結果',publishedDate:'2026-07-28',pageUrl:'https://www.iezo.net/forum/basketball-j/148900/',verified:true}
});
export const TEAMS_2026_NARA_JHS_SOUTAI_MEN=[
  school('榛原','優勝','S'),club('Strike Force','準優勝','A+'),school('王寺北','3位','A'),school('都跡','4位','A'),
  school('三郷','ベスト8','B'),school('教育大','ベスト8','B'),school('天理','ベスト8','B'),school('新庄','ベスト8','B')
];
