import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const PREFECTURE='滋賀県';
const CATEGORY='U15';
const GENDER='男子';

const SCHOOL_CANONICAL={
  '滋賀大附属':'滋賀大学教育学部附属中学校',
  '湖北（拠）':'湖北中学校'
};
const SCHOOL_ALIASES={
  '滋賀大附属':['滋賀大学附属中学校','滋賀大学附属','滋賀大附属中','滋賀大附属'],
  '湖北（拠）':['湖北中','湖北','湖北（拠）','湖北（拠点校）']
};
const CLUB_ALIASES={
  'LakeForce':['Lake Force','LAKE FORCE'],
  '滋賀レイクスU15':['滋賀レイクス U15','滋賀レイクスU15男子'],
  '滋賀レイクスU15 Next':['滋賀レイクスU15Next','滋賀レイクス U15 Next'],
  'IBS Boy':['IBS boy','IBS BOY'],
  'TBA PHEONIX':['TBA PHOENIX','TBA Pheonix'],
  'ジュニアボーラーズ':['Junior Ballers']
};

function tournament({id,year,name,shortName=name,season,type='都道府県大会',source,sourceType='verifiedTournamentResult',teamPowerEligible=true,parentTournamentId=null,competitionStage='final',resultScope=null}){
  return {
    id,year,name,shortName,season,generation:season,prefecture:PREFECTURE,category:CATEGORY,gender:GENDER,
    type,tournamentLevel:'prefecture',resultConfirmed:true,resultStatus:'completed',source,sourceType,
    teamPowerEligible,parentTournamentId,competitionStage,...(resultScope?{resultScope}:{})
  };
}
function school(sourceName,placementLabel,rank,extra={}){
  const teamName=SCHOOL_CANONICAL[sourceName]||`${sourceName}中学校`;
  const aliases=[sourceName,`${sourceName}中`,...(SCHOOL_ALIASES[sourceName]||[])];
  return {
    sourceName,teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),
    aliases:[...new Set(aliases)],teamType:'中学校',ageGroup:CATEGORY,placementLabel,rank,...extra
  };
}
function club(teamName,placementLabel,rank,extra={}){
  return {
    sourceName:teamName,teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),
    aliases:CLUB_ALIASES[teamName]||[],teamType:'クラブチーム',ageGroup:CATEGORY,placementLabel,rank,...extra
  };
}
const qualifierSchool=(name,label,rank='S')=>school(name,label,rank,{teamPowerEligible:false});

export const TOURNAMENT_2025_SHIGA_JHS_SPRING_ZONES_MEN=tournament({
  id:'2025-shiga-jhs-spring-zones-men',
  year:2025,
  name:'令和7年度 第62回滋賀県中学校春季体育大会 バスケットボール男子',
  shortName:'2025 滋賀県中学校春季体育大会 男子（4ゾーン）',
  season:'2025-26',
  type:'都道府県大会予選',
  teamPowerEligible:false,
  competitionStage:'zone-qualifier',
  resultScope:'男子4ゾーンの1位・2位',
  source:{
    organization:'滋賀県中学校体育連盟 / 滋賀県教育委員会',
    document:'令和7年度 第62回滋賀県中学校春季体育大会 成績結果一覧表＜団体＞',
    publishedDate:'2025-05-16',
    pageUrl:'https://www.pref.shiga.lg.jp/edu/ma08/16860.html',
    pdfUrl:'https://www.pref.shiga.lg.jp/documents/16860/5541023.pdf',
    verified:true
  },
  sourceType:'officialShigaChutairenResult'
});
export const TEAMS_2025_SHIGA_JHS_SPRING_ZONES_MEN=[
  qualifierSchool('日野','Aゾーン優勝'),qualifierSchool('栗東','Aゾーン準優勝','A+'),
  qualifierSchool('滋賀大附属','Bゾーン優勝'),qualifierSchool('瀬田','Bゾーン準優勝','A+'),
  qualifierSchool('明富','Cゾーン優勝'),qualifierSchool('老上','Cゾーン準優勝','A+'),
  qualifierSchool('甲西北','Dゾーン優勝'),qualifierSchool('びわ','Dゾーン準優勝','A+')
];

export const TOURNAMENT_2025_SHIGA_JHS_SOUTAI_MEN=tournament({
  id:'2025-shiga-jhs-soutai-men',
  year:2025,
  name:'第78回滋賀県中学校夏季総合体育大会 バスケットボール男子',
  shortName:'2025 滋賀県中学校夏季総体 男子',
  season:'2025-26',
  resultScope:'男子ベスト8',
  source:{
    organization:'滋賀県中学校体育連盟 / 滋賀県教育委員会',
    document:'第78回滋賀県中学校夏季総合体育大会 成績結果一覧表',
    publishedDate:'2025-07-26',
    pageUrl:'https://www.pref.shiga.lg.jp/edu/ma08/16860.html',
    pdfUrl:'https://www.pref.shiga.lg.jp/documents/16860/5556900.pdf',
    verified:true
  },
  sourceType:'officialShigaChutairenResult'
});
export const TEAMS_2025_SHIGA_JHS_SOUTAI_MEN=[
  school('日野','優勝','S'),school('明富','準優勝','A+'),
  school('甲西北','3位・ベスト4','A'),school('打出','3位・ベスト4','A'),
  school('滋賀大附属','ベスト8','B'),school('びわ','ベスト8','B'),
  school('城山','ベスト8','B'),school('老上','ベスト8','B')
];

export const TOURNAMENT_2025_SHIGA_JHS_ROOKIES_ZONES_MEN=tournament({
  id:'2025-shiga-jhs-rookies-zones-men',
  year:2025,
  name:'令和7年度 第72回滋賀県中学校秋季新人大会・ブロック強化練習会 バスケットボール男子',
  shortName:'2025 滋賀県中学校秋季新人大会 男子（ブロック・ゾーン）',
  season:'2025-26',
  type:'都道府県大会予選',
  teamPowerEligible:false,
  competitionStage:'block-zone-qualifier',
  resultScope:'公式優勝者一覧に掲載された男子各ブロック・ゾーン優勝',
  source:{
    organization:'滋賀県中学校体育連盟 / 滋賀県教育委員会',
    document:'第72回滋賀県中学校秋季新人大会 優勝者一覧表（ブロック大会 団体戦）',
    publishedDate:'2025-10-17',
    pageUrl:'https://www.pref.shiga.lg.jp/edu/ma08/16860.html',
    pdfUrl:'https://www.pref.shiga.lg.jp/documents/16860/5571025.pdf',
    basketballPdfUrl:'https://shiga.japanbasketball.jp/jhs/img/man-2025shiga_autom_newblock.pdf',
    verified:true
  },
  sourceType:'officialShigaChutairenQualifier'
});
export const TEAMS_2025_SHIGA_JHS_ROOKIES_ZONES_MEN=[
  qualifierSchool('粟津','第2ブロックAゾーン優勝'),
  qualifierSchool('打出','第2ブロックBゾーン優勝'),
  qualifierSchool('皇子山','第2ブロックCゾーン優勝'),
  qualifierSchool('仰木','第2ブロックDゾーン優勝'),
  qualifierSchool('老上','第3AブロックAゾーン優勝'),
  qualifierSchool('栗東','第3AブロックBゾーン優勝'),
  qualifierSchool('高穂','第3AブロックCゾーン優勝'),
  qualifierSchool('新堂','第3AブロックDゾーン優勝'),
  qualifierSchool('明富','第3BブロックAゾーン優勝'),
  qualifierSchool('守山南','第3BブロックBゾーン優勝'),
  qualifierSchool('中主','第3BブロックCゾーン優勝'),
  qualifierSchool('野洲','第3BブロックDゾーン優勝'),
  qualifierSchool('水口','第4ブロックAゾーン優勝'),
  qualifierSchool('甲賀','第4ブロックBゾーン優勝'),
  qualifierSchool('城山','第4ブロックCゾーン優勝'),
  qualifierSchool('甲西北','第4ブロックDゾーン優勝'),
  qualifierSchool('能登川','第5ブロックAゾーン優勝'),
  qualifierSchool('日野','第5ブロックBゾーン優勝'),
  qualifierSchool('稲枝','第6ブロックAゾーン優勝'),
  qualifierSchool('彦根東','第6ブロックBゾーン優勝'),
  qualifierSchool('彦根中央','第6ブロックCゾーン優勝'),
  qualifierSchool('彦根','第6ブロックDゾーン優勝'),
  qualifierSchool('浅井','第8ブロックAゾーン優勝'),
  qualifierSchool('湖北（拠）','第8ブロックBゾーン優勝'),
  qualifierSchool('湖西','第8ブロックCゾーン優勝'),
  qualifierSchool('高島','第8ブロックDゾーン優勝')
];

export const TOURNAMENT_2025_SHIGA_U15_CHAMPIONSHIP_MEN=tournament({
  id:'2025-shiga-u15-championship-men',
  year:2025,
  name:'2025年度 第6回滋賀県U15バスケットボール選手権大会 兼 Jr.ウインターカップ滋賀県予選 男子',
  shortName:'2025 Jr.ウインターカップ滋賀県予選 男子',
  season:'2025-26',
  resultScope:'男子ベスト4確認済み',
  source:{
    organization:'滋賀レイクス / LakeForce BASKETBALL CLUB',
    document:'2025-26 滋賀県U15バスケットボール選手権大会 試合結果',
    publishedDate:'2025-11-02',
    pageUrl:'https://shigalakes.com/team/youth/result_2025-26/',
    secondaryUrl:'https://chachaki.wixsite.com/lakeforce/boys',
    verified:true
  },
  sourceType:'verifiedOfficialTeamResult'
});
export const TEAMS_2025_SHIGA_U15_CHAMPIONSHIP_MEN=[
  club('LakeForce','優勝','S'),club('滋賀レイクスU15','準優勝','A+'),
  club('TBA PHEONIX','ベスト4','A'),club('ジュニアボーラーズ','ベスト4','A')
];

export const TOURNAMENT_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN=tournament({
  id:'2025-shiga-junior-championship-men',
  year:2025,
  name:'第11回滋賀県ジュニア選手権 男子',
  shortName:'2025 第11回滋賀県ジュニア選手権 男子',
  season:'2025-26',
  resultScope:'優勝・準優勝・準決勝1チーム確認済み',
  source:{
    organization:'LakeForce BASKETBALL CLUB',
    document:'2025-26 第11回滋賀県ジュニア選手権 男子 試合結果',
    pageUrl:'https://chachaki.wixsite.com/lakeforce/boys',
    verified:true
  },
  sourceType:'verifiedOfficialTeamResult'
});
export const TEAMS_2025_SHIGA_JUNIOR_CHAMPIONSHIP_MEN=[
  club('LakeForce','優勝','S'),club('ジュニアボーラーズ','準優勝','A+'),club('IBS Boy','ベスト4','A')
];

export const TOURNAMENT_2026_SHIGA_JHS_SPRING_ZONES_MEN=tournament({
  id:'2026-shiga-jhs-spring-zones-men',
  year:2026,
  name:'令和8年度 第63回滋賀県中学校春季体育大会 バスケットボール男子',
  shortName:'2026 滋賀県中学校春季体育大会 男子（4ゾーン）',
  season:'2026-27',
  type:'都道府県大会予選',
  teamPowerEligible:false,
  competitionStage:'zone-qualifier',
  resultScope:'男子4ゾーンの1位・2位',
  source:{
    organization:'滋賀県中学校体育連盟 / 滋賀県教育委員会',
    document:'令和8年度 第63回滋賀県中学校春季体育大会 成績結果一覧表＜団体＞',
    publishedDate:'2026-05-15',
    pageUrl:'https://www.pref.shiga.lg.jp/edu/ma08/24414.html',
    pdfUrl:'https://www.pref.shiga.lg.jp/documents/24414/5615825.pdf',
    verified:true
  },
  sourceType:'officialShigaChutairenResult'
});
export const TEAMS_2026_SHIGA_JHS_SPRING_ZONES_MEN=[
  qualifierSchool('甲西北','Aゾーン優勝'),qualifierSchool('甲賀','Aゾーン準優勝','A+'),
  qualifierSchool('打出','Bゾーン優勝'),qualifierSchool('水口','Bゾーン準優勝','A+'),
  qualifierSchool('城山','Cゾーン優勝'),qualifierSchool('彦根中央','Cゾーン準優勝','A+'),
  qualifierSchool('野洲','Dゾーン優勝'),qualifierSchool('高島','Dゾーン準優勝','A+')
];

export const TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN=tournament({
  id:'2026-shiga-jhs-soutai-men',
  year:2026,
  name:'第79回滋賀県中学校夏季総合体育大会 バスケットボール男子',
  shortName:'2026 滋賀県中学校夏季総体 男子',
  season:'2026-27',
  resultScope:'公式団体結果掲載の男子ベスト4',
  source:{
    organization:'滋賀県中学校体育連盟 / 滋賀県教育委員会',
    document:'第79回滋賀県中学校夏季総合体育大会 成績結果一覧表',
    publishedDate:'2026-07-28',
    pageUrl:'https://www.pref.shiga.lg.jp/edu/ma08/24414.html',
    pdfUrl:'https://www.pref.shiga.lg.jp/documents/24414/5627555.pdf',
    verified:true
  },
  sourceType:'officialShigaChutairenResult'
});
export const TEAMS_2026_SHIGA_JHS_SOUTAI_MEN=[
  school('甲西北','優勝','S'),school('打出','準優勝','A+'),
  school('瀬田北','3位・ベスト4','A'),school('野洲','3位・ベスト4','A')
];
