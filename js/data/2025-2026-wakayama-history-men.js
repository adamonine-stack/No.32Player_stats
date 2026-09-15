import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const SCHOOL_SPECIAL={
  '東陽':{teamName:'田辺市立東陽中学校',aliases:['東陽','東陽中学校']},
  '吉備':{teamName:'有田川町立吉備中学校',aliases:['吉備','吉備中学校']},
  '東':{teamName:'和歌山市立東中学校',aliases:['東','東中学校']},
  '荒川':{teamName:'紀の川市立荒川中学校',aliases:['荒川','荒川中学校']},
  '有和':{teamName:'有田市立有和中学校',aliases:['有和','有和中学校']},
  '上富田':{teamName:'上富田町立上富田中学校',aliases:['上富田','上富田中学校']},
  '近大和歌山':{teamName:'近畿大学附属和歌山中学校',aliases:['近大和歌山','近畿大学附属和歌山','近畿大学附属和歌山中']},
  '妙寺':{teamName:'かつらぎ町立妙寺中学校',aliases:['妙寺','妙寺中学校']},
  '楠見':{teamName:'和歌山市立楠見中学校',aliases:['楠見','楠見中学校']},
  '城南':{teamName:'新宮市立城南中学校',aliases:['城南','城南中学校']},
  '明洋':{teamName:'田辺市立明洋中学校',aliases:['明洋','明洋中学校']},
  '亀川':{teamName:'海南市立亀川中学校',aliases:['亀川','亀川中学校']},
  '那智':{teamName:'那智勝浦町立那智中学校',aliases:['那智','那智中学校']},
  '紀伊':{teamName:'和歌山市立紀伊中学校',aliases:['紀伊','紀伊中学校']},
  '紀美野':{teamName:'紀美野町立紀美野中学校',aliases:['紀美野','紀美野中学校']},
  '南部':{teamName:'みなべ町立南部中学校',aliases:['南部','南部中学校']},
  '高積':{teamName:'和歌山市立高積中学校',aliases:['高積','高積中学校']},
  '岩出第二':{teamName:'岩出市立岩出第二中学校',aliases:['岩出第二','岩出第二中学校']},
  '高野口':{teamName:'橋本市立高野口中学校',aliases:['高野口','高野口中学校']},
  '緑丘':{teamName:'新宮市立緑丘中学校',aliases:['緑丘','緑丘中学校']},
  '高雄':{teamName:'田辺市立高雄中学校',aliases:['高雄','高雄中学校']},
  '巽':{teamName:'海南市立巽中学校',aliases:['巽','巽中学校']},
  '日高':{teamName:'日高町立日高中学校',aliases:['日高','日高中学校']},
  '岩出':{teamName:'岩出市立岩出中学校',aliases:['岩出','岩出中学校']},
  '紀見北':{teamName:'橋本市立紀見北中学校',aliases:['紀見北','紀見北中学校']},
  '海南第三':{teamName:'海南市立海南第三中学校',aliases:['海南第三','海南第三中学校']},
  '貴志川':{teamName:'紀の川市立貴志川中学校',aliases:['貴志川','貴志川中学校']},
  '日進':{teamName:'和歌山市立日進中学校',aliases:['日進','日進中学校']}
};
const CLUB_SPECIAL={
  'ASLEAD有田':{teamName:'ASLEAD有田',aliases:['ASLEAD 有田'],teamType:'クラブチーム'},
  'G-LiGAR':{teamName:'G-LiGAR',aliases:['G LiGAR','G-LIGAR'],teamType:'クラブチーム'},
  'GLÄNZ':{teamName:'GLÄNZ',aliases:['GLANZ','Glanz'],teamType:'クラブチーム'},
  'GLÄNZ ZWEI':{teamName:'GLÄNZ ZWEI',aliases:['GLANZ ZWEI'],teamType:'クラブチーム'},
  'ONELYS wakayama U15':{teamName:'ONELYS wakayama U15',aliases:['ONELYS wakayama','ONELYS U15'],teamType:'クラブチーム'},
  'アイアイジュニア':{teamName:'アイアイジュニア',aliases:[],teamType:'クラブチーム'},
  'adorare':{teamName:'adorare',aliases:[],teamType:'クラブチーム'},
  'adorare second':{teamName:'adorare second',aliases:[],teamType:'クラブチーム'},
  'RED KINGS':{teamName:'RED KINGS',aliases:[],teamType:'クラブチーム'},
  'CHOICE':{teamName:'CHOICE',aliases:[],teamType:'クラブチーム'},
  'ROOKIES':{teamName:'ROOKIES',aliases:[],teamType:'クラブチーム'},
  'ブランリオン':{teamName:'ブランリオン',aliases:['ブラリオン'],teamType:'クラブチーム'},
  "Gr’s":{teamName:"Gr’s",aliases:["Gr's",'Grs'],teamType:'クラブチーム'},
  'BLACK PANTHERS':{teamName:'BLACK PANTHERS',aliases:['B.P','B. P','BLACKPANTHERS'],teamType:'クラブチーム'},
  'CLEVER CATS':{teamName:'和歌山 CLEVER CATS',aliases:['CLEVER CATS','和歌山ＣＬＥＶＥＲ ＣＡＴＳ'],teamType:'クラブチーム'},
  'Re-birth':{teamName:'Re-birth',aliases:['Reｰbirth','Rebirth'],teamType:'クラブチーム'}
};

function schoolIdentity(sourceName){
  const special=SCHOOL_SPECIAL[sourceName];
  if(special)return {...special,teamType:'中学校'};
  const teamName=sourceName.endsWith('中学校')?sourceName:`${sourceName}中学校`;
  return {teamName,aliases:[sourceName],teamType:'中学校'};
}
function clubIdentity(sourceName){
  return CLUB_SPECIAL[sourceName]||{teamName:sourceName,aliases:[],teamType:'クラブチーム'};
}
function row(sourceName,placementLabel,rank,{kind='school',...extra}={}){
  const identity=kind==='club'?clubIdentity(sourceName):schoolIdentity(sourceName);
  return {
    sourceName,
    teamName:identity.teamName,
    normalizedTeamName:normalizeTeamNameForMatching(identity.teamName),
    aliases:identity.aliases,
    teamType:identity.teamType,
    placementLabel,
    rank,
    ageGroup:'U15',
    ...extra
  };
}
function tournament(base){
  return {
    prefecture:'和歌山県',
    category:'U15男子',
    gender:'男子',
    tournamentLevel:'prefecture',
    resultConfirmed:true,
    resultStatus:'completed',
    sourceType:'officialTournamentResult',
    ...base
  };
}

export const TOURNAMENT_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN=tournament({
  id:'2025-wakayama-jhs-championship-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'第75回和歌山県中学校バスケットボール選手権大会 男子',
  shortName:'2025 和歌山県中学校選手権 男子',
  type:'県大会 / 中学校選手権',
  participantCount:4,
  source:{organization:'和歌山県バスケットボール協会',document:'第75回和歌山県中学校バスケットボール選手権大会 大会結果',publishedDate:'2025-06-10',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/news/4106/',pdfUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2025/06/R7kensenshuken_kekka0608.pdf',verified:true}
});
export const TEAMS_2025_WAKAYAMA_JHS_CHAMPIONSHIP_MEN=[
  row('東陽','優勝','S'),
  row('吉備','準優勝','A+'),
  row('東','ベスト4','A'),
  row('荒川','ベスト4','A')
];

export const TOURNAMENT_2025_WAKAYAMA_JHS_SOUTAI_MEN=tournament({
  id:'2025-wakayama-jhs-soutai-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'第77回和歌山県中学校総合体育大会バスケットボール競技の部 男子',
  shortName:'2025 和歌山県中学校総体 男子',
  type:'県大会 / 中学校総体',
  participantCount:16,
  source:{organization:'和歌山県バスケットボール協会',document:'第77回和歌山県中学校総合体育大会 大会結果',publishedDate:'2025-07-28',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/4269/',pdfUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2025/07/R07_kensotai_kekka.pdf',verified:true}
});
const SOUTAI_2025={
  '東陽':['優勝','S'],'有和':['準優勝','A+'],'那智':['ベスト4','A'],'東':['ベスト4','A'],
  '亀川':['ベスト8','B'],'吉備':['ベスト8','B'],'紀伊':['ベスト8','B'],'紀美野':['ベスト8','B']
};
export const TEAMS_2025_WAKAYAMA_JHS_SOUTAI_MEN=[
  '東陽','妙寺','亀川','南部','那智','高積','吉備','荒川','東','岩出第二','紀伊','高野口','紀美野','緑丘','高雄','有和'
].map(name=>{const [placementLabel,rank]=SOUTAI_2025[name]||['ベスト16','C'];return row(name,placementLabel,rank)});

export const TOURNAMENT_2025_WAKAYAMA_JR_WINTER_MEN=tournament({
  id:'2025-wakayama-jr-winter-qualifier-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'2025年度第7回和歌山県U15バスケットボール選手権大会 兼 Jr.ウインターカップ2025-26 和歌山県予選会 男子',
  shortName:'2025 Jr.ウインターカップ和歌山県予選 男子',
  type:'県大会 / Jr.ウインターカップ和歌山県予選',
  participantCount:13,
  source:{organization:'和歌山県バスケットボール協会',document:'第7回和歌山県U15バスケットボール選手権大会 結果',publishedDate:'2025-10-30',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/4315/',pdfUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2025/10/7th_U15senshuken_kekka.pdf',verified:true}
});
const JR_WINTER_2025={
  'G-LiGAR':['優勝','S'],
  'adorare':['準優勝','A+'],
  'GLÄNZ':['ベスト4','A'],
  'CHOICE':['ベスト4','A'],
  'アイアイジュニア':['ベスト8','B'],
  'RED KINGS':['ベスト8','B'],
  'adorare second':['ベスト8','B'],
  'ROOKIES':['ベスト8','B']
};
export const TEAMS_2025_WAKAYAMA_JR_WINTER_MEN=[
  'G-LiGAR','adorare','GLÄNZ','CHOICE','アイアイジュニア','RED KINGS','adorare second','ROOKIES',
  'ASLEAD有田','ブランリオン','ONELYS wakayama U15','GLÄNZ ZWEI',"Gr’s"
].map(name=>{const [placementLabel,rank]=JR_WINTER_2025[name]||['ベスト16','C'];return row(name,placementLabel,rank,{kind:'club'})});



export const TOURNAMENT_2025_WAKAYAMA_JHS_ROOKIES_MEN=tournament({
  id:'2025-wakayama-jhs-rookies-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'第41回和歌山県中学校バスケットボール新人大会 男子',
  shortName:'2025 和歌山県中学校新人大会 男子',
  type:'県大会 / 中学校新人',
  participantCount:12,
  source:{organization:'和歌山県バスケットボール協会',document:'第41回和歌山県中学校バスケットボール新人大会 大会結果',publishedDate:'2025-11-09',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/4489/',pdfUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2025/11/R7kenshinjin_kekka1109.pdf',verified:true}
});
const ROOKIES_2025={
  '有和':['優勝','S'],
  '近大和歌山':['準優勝','A+'],
  '楠見':['ベスト4','A'],
  'CHOICE GB':['ベスト4','A']
};
export const TEAMS_2025_WAKAYAMA_JHS_ROOKIES_MEN=[
  '有和','城南','海南第三','高野口','楠見','緑丘','高雄','岩出','近大和歌山','荒川','ASLEAD有田','CHOICE GB'
].map(name=>{
  const [placementLabel,rank]=ROOKIES_2025[name]||['県大会出場','E'];
  return row(name,placementLabel,rank,{kind:['ASLEAD有田','CHOICE GB'].includes(name)?'club':'school',ageGroup:'U14'});
});



export const TOURNAMENT_2025_WAKAYAMA_JUNIOR_CLUB_MEN=tournament({
  id:'2025-wakayama-junior-club-games-men',
  year:2025,season:'2025-26',generation:'2025-26',
  name:'第11回和歌山県ジュニアバスケットボール選手権大会 兼 第14回U15クラブバスケットボールゲームス 和歌山県予選会 男子',
  shortName:'2025 和歌山県ジュニア選手権・クラブゲームス予選 男子',
  type:'県大会 / U15クラブバスケットボールゲームス予選',
  participantCount:null,
  resultScope:'男子ベスト4確認済み',
  source:{organization:'和歌山県バスケットボール協会',document:'第11回和歌山県ジュニアバスケットボール選手権大会 大会結果',publishedDate:'2025-11-16',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/4428/',pdfUrl:'https://wakayama.pba-japanbasketball.jp/wp-content/uploads/2025/11/kekkka_kanan.pdf',verified:true}
});
export const TEAMS_2025_WAKAYAMA_JUNIOR_CLUB_MEN=[
  row('BLACK PANTHERS','優勝','S',{kind:'club'}),
  row('adorare','準優勝','A+',{kind:'club'}),
  row('CLEVER CATS','ベスト4','A',{kind:'club'}),
  row('Re-birth','ベスト4','A',{kind:'club'})
];

export const TOURNAMENT_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN=tournament({
  id:'2026-wakayama-jhs-championship-men',
  year:2026,season:'2026-27',generation:'2026-27',
  name:'第76回和歌山県中学校バスケットボール選手権大会 男子',
  shortName:'2026 和歌山県中学校選手権 男子',
  type:'県大会 / 中学校選手権',
  participantCount:4,
  source:{organization:'和歌山県バスケットボール協会',document:'第76回和歌山県中学校バスケットボール選手権大会 大会結果',publishedDate:'2026-06-09',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/4807/',verified:true}
});
export const TEAMS_2026_WAKAYAMA_JHS_CHAMPIONSHIP_MEN=[
  row('有和','優勝','S'),
  row('上富田','準優勝','A+'),
  row('近大和歌山','ベスト4','A'),
  row('妙寺','ベスト4','A')
];

export const TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN=tournament({
  id:'2026-wakayama-jhs-soutai-men',
  year:2026,season:'2026-27',generation:'2026-27',
  name:'第78回和歌山県中学校総合体育大会バスケットボール競技の部 男子',
  shortName:'2026 和歌山県中学校総体 男子',
  type:'県大会 / 中学校総体',
  participantCount:16,
  source:{organization:'和歌山県バスケットボール協会',document:'第78回和歌山県中学校総合体育大会 大会結果',publishedDate:'2026-07-28',pageUrl:'https://wakayama.pba-japanbasketball.jp/u15/game/5015/',verified:true}
});
const SOUTAI_2026={
  '有和':['優勝','S'],'上富田':['準優勝','A+'],'明洋':['ベスト4','A'],'楠見':['ベスト4','A'],
  '城南':['ベスト8','B'],'近大和歌山':['ベスト8','B'],'海南第三':['ベスト8','B'],'緑丘':['ベスト8','B']
};
export const TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN=[
  '有和','巽','城南','日高','岩出','明洋','近大和歌山','紀見北','楠見','妙寺','ASLEAD有田','海南第三','緑丘','貴志川','日進','上富田'
].map(name=>{
  const [placementLabel,rank]=SOUTAI_2026[name]||['ベスト16','C'];
  return row(name,placementLabel,rank,{kind:name==='ASLEAD有田'?'club':'school'});
});
