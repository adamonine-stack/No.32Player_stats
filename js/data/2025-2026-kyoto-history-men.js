import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const PREFECTURE='京都府';
const CATEGORY='U15';
const GENDER='男子';

function tournament({id,year,name,shortName=name,season,type='都道府県大会',source,sourceType='officialTournamentResult',teamPowerEligible=true,parentTournamentId=null,competitionStage='final'}){
  return {id,year,name,shortName,season,generation:season,prefecture:PREFECTURE,category:CATEGORY,gender:GENDER,type,tournamentLevel:'prefecture',resultConfirmed:true,resultStatus:'completed',source,sourceType,teamPowerEligible,parentTournamentId,competitionStage};
}
function team(teamName,placementLabel,rank,aliases=[],teamType='中学校',extra={}){
  return {teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),placementLabel,rank,aliases,teamType,ageGroup:CATEGORY,...extra};
}

const KYOTO_SEIKA_ALIASES=['京都精華学園','京都精華','京都精華学園中'];
const KAMEOKA_ALIASES=['亀岡市立亀岡中学校','亀岡市立亀岡中','亀岡'];
const KIHATA_ALIASES=['宇治市立木幡中学校','木幡'];
const OIKE_ALIASES=['京都市立京都御池中学校','京都御池','御池'];
const UJI_ALIASES=['宇治市立宇治中学校','宇治'];
const SHUGAKUIN_ALIASES=['京都市立修学院中学校','修学院'];

export const TOURNAMENT_2025_KYOTO_JHS_SOUTAI_MEN=tournament({
  id:'2025-kyoto-jhs-soutai-men',
  year:2025,
  name:'2025年度 第78回京都府中学校総合体育大会 バスケットボール男子',
  shortName:'2025 京都府中学校総体 男子',
  season:'2025-26',
  source:'https://www.kyoto-be.ne.jp/chutairen-kyoto/cms/wp-content/uploads/2025/07/%E2%91%A3%E3%83%90%E3%82%B9%E3%82%B1%E3%83%83%E3%83%88%E3%83%9C%E3%83%BC%E3%83%AB.pdf',
  sourceType:'officialKyotoChutairenResult'
});
export const TEAMS_2025_KYOTO_JHS_SOUTAI_MEN=[
  team('京都精華学園中学校','優勝','S',KYOTO_SEIKA_ALIASES),
  team('亀岡中学校','準優勝','A+',KAMEOKA_ALIASES),
  team('木幡中学校','ベスト4','A',KIHATA_ALIASES),
  team('京都御池中学校','ベスト4','A',OIKE_ALIASES),
  team('大宮中学校','ベスト8','B',['京都府立大宮中学校','大宮']),
  team('綾部中学校','ベスト8','B',['綾部市立綾部中学校','綾部']),
  team('久世中学校','ベスト8','B',['京都市立久世中学校','久世']),
  team('宇治中学校','ベスト8','B',UJI_ALIASES)
];

export const TOURNAMENT_2025_KYOTO_JR_WINTER_MEN=tournament({
  id:'2025-kyoto-jr-winter-men',
  year:2025,
  name:'2025年度 第6回Jr.ウインターカップ 京都府予選会 男子',
  shortName:'2025 Jr.ウインター京都府予選 男子',
  season:'2025-26',
  source:'https://www.iezo.net/forum/basketball-j/132740/',
  sourceType:'verifiedKyotoBasketballResult'
});
export const TEAMS_2025_KYOTO_JR_WINTER_MEN=[
  team('京都精華学園中学校','優勝','S',KYOTO_SEIKA_ALIASES),
  team('KYOTO DREAMERS','準優勝','A+',[], 'クラブチーム'),
  team('京都フェニックス','3位','A',[], 'クラブチーム'),
  team('B.UNITE','4位','A',[], 'クラブチーム')
];

export const TOURNAMENT_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN=tournament({
  id:'2025-kyoto-rookies-school-qualifier-men',
  year:2025,
  name:'2025年度 第28回京都府中学生バスケットボール新人大会 中学校部活動の部 男子',
  shortName:'2025 京都府新人大会 中学校部活動の部',
  season:'2025-26',
  type:'都道府県大会予選',
  source:'https://basket-park.jp/2026/01/19/u15-15/',
  sourceType:'verifiedKyotoBasketballQualifier',
  teamPowerEligible:false,
  parentTournamentId:'2025-kyoto-rookies-final-men',
  competitionStage:'qualifier-school'
});
export const TEAMS_2025_KYOTO_ROOKIES_SCHOOL_QUALIFIER_MEN=[
  team('京都精華学園中学校','優勝','S',KYOTO_SEIKA_ALIASES,'中学校',{teamPowerEligible:false}),
  team('亀岡中学校','準優勝','A+',KAMEOKA_ALIASES,'中学校',{teamPowerEligible:false}),
  team('嘉楽中学校','ベスト4','A',['京都市立嘉楽中学校','嘉楽'],'中学校',{teamPowerEligible:false}),
  team('修学院中学校','ベスト4','A',SHUGAKUIN_ALIASES,'中学校',{teamPowerEligible:false})
];

export const TOURNAMENT_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN=tournament({
  id:'2025-kyoto-rookies-club-qualifier-men',
  year:2025,
  name:'2025年度 第28回京都府中学生バスケットボール新人大会 クラブ・Bユースの部 男子',
  shortName:'2025 京都府新人大会 クラブ・Bユースの部',
  season:'2025-26',
  type:'都道府県大会予選',
  source:'https://basket-park.jp/2026/01/19/u15-15/',
  sourceType:'verifiedKyotoBasketballQualifier',
  teamPowerEligible:false,
  parentTournamentId:'2025-kyoto-rookies-final-men',
  competitionStage:'qualifier-club'
});
export const TEAMS_2025_KYOTO_ROOKIES_CLUB_QUALIFIER_MEN=[
  team('B.UNITE','優勝','S',[],'クラブチーム',{teamPowerEligible:false}),
  team('京都ハンナリーズU15','準優勝','A+',[],'クラブチーム',{teamPowerEligible:false}),
  team('KYOTO DREAMERS','ベスト4','A',[],'クラブチーム',{teamPowerEligible:false}),
  team('FUBC','ベスト4','A',[],'クラブチーム',{teamPowerEligible:false})
];

export const TOURNAMENT_2025_KYOTO_ROOKIES_FINAL_MEN=tournament({
  id:'2025-kyoto-rookies-final-men',
  year:2025,
  name:'2025年度 第28回京都府中学生バスケットボール新人大会 決勝リーグ 男子',
  shortName:'2025 京都府新人大会 決勝リーグ 男子',
  season:'2025-26',
  source:'https://kbba.jp/cms/wp-content/uploads/2026/02/%E4%BA%AC%E9%83%BD%E5%BA%9C%E6%96%B0%E4%BA%BA%E5%A4%A7%E4%BC%9A%E3%80%80%E6%B1%BA%E5%8B%9D%E3%83%AA%E3%83%BC%E3%82%B0.pdf',
  sourceType:'officialKyotoBasketballResult'
});
export const TEAMS_2025_KYOTO_ROOKIES_FINAL_MEN=[
  team('京都精華学園中学校','優勝','S',KYOTO_SEIKA_ALIASES),
  team('B.UNITE','準優勝','A+',[],'クラブチーム'),
  team('亀岡中学校','3位','A',KAMEOKA_ALIASES),
  team('京都ハンナリーズU15','4位','A',[],'クラブチーム')
];

export const TOURNAMENT_2026_KYOTO_JHS_SOUTAI_MEN=tournament({
  id:'2026-kyoto-jhs-soutai-men',
  year:2026,
  name:'2026年度 京都府中学校総合体育大会 バスケットボール男子',
  shortName:'2026 京都府中学校総体 男子',
  season:'2026-27',
  source:'https://www.kyoto-be.ne.jp/chutairen-kyoto/cms/wp-content/uploads/2026/07/%E2%91%A3%E3%83%90%E3%82%B9%E3%82%B1%E3%83%83%E3%83%88%E3%83%9C%E3%83%BC%E3%83%AB.pdf',
  sourceType:'officialKyotoChutairenResult'
});
export const TEAMS_2026_KYOTO_JHS_SOUTAI_MEN=[
  team('京都精華学園中学校','優勝','S',KYOTO_SEIKA_ALIASES),
  team('亀岡中学校','準優勝','A+',KAMEOKA_ALIASES),
  team('城南中学校','ベスト4','A',['京都府立城南中学校','城南']),
  team('木幡中学校','ベスト4','A',KIHATA_ALIASES),
  team('詳徳中学校','ベスト8','B',['亀岡市立詳徳中学校','詳徳']),
  team('加茂川中学校','ベスト8','B',['京都市立加茂川中学校','加茂川']),
  team('京都御池中学校','ベスト8','B',OIKE_ALIASES),
  team('修学院中学校','ベスト8','B',SHUGAKUIN_ALIASES)
];
