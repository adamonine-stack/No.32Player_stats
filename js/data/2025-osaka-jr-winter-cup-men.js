import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

export const TOURNAMENT_2025_OSAKA_JR_WINTER_CUP_MEN={
  id:'2025-osaka-jr-winter-cup-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'大阪府Jr.ウィンターカップ2025',shortName:'大阪府Jr.ウィンターカップ2025',
  prefecture:'大阪府',category:'U15',gender:'男子',type:'Jr.ウィンターカップ',participantCount:83,
  resultConfirmed:true,resultStatus:'completed',sourceType:'official_bracket',
  source:{organization:'大阪府U15バスケットボール',document:'大阪府U15選手権 男子 決勝トーナメント',season:'2025-26',verified:true}
};

const LEFT=[
 ['REDFORCES',5],['E.M.B.C. U15',1],['摂津市立第二中学校',0],['RED FROGS',2],['大阪市立歌島中学校',0],['sHow time',0],['東大阪市立縄手北中学校',0],['ANGRY OWLS',2],['大阪市立三稜中学校',0],['T\'s CROWS',2],['大阪市立下福島中学校',1],['TEAM GRIT',0],['寝屋川B.C.',1],['大阪市立東生野中学校',2],['NEXT HEROES',0],['EDGE',2],['monolith U15',0],['Akans',1],['明星中学校',0],['FRONTIER SPIRITS U15',2],['T-SMILE BASKET BALL TEAM U15',3],['高槻市立阿武野中学校',0],['大阪市立住吉中学校',1],['門真市立第二中学校',2],['Secret Base U15',0],['大阪市立大和川中学校',0],['シャイン柏原',1],['ＩＢＡＲＡＫＩ ＢＢＣ',1],['豊中市立第十三中学校',0],['大阪市立三国中学校',2],['Osaka Firefly',0],['泉大津ジュニアバスケットボールクラブ',2],['Blue Dolphins',0],['RGS',3],['大阪市立旭陽中学校',0],['RISING STAR',0],['吹田市立第五中学校',0],['HOS',2],['大阪市立東淀中学校',1],['茨木市立天王中学校',0],['NEXTEST',2]
];
const RIGHT=[
 ['KAGO CLUB',4],['堺市立長尾中学校',0],['大阪市立天下茶屋中学校',1],['AIR',2],['Golden Wombats',0],['大阪市立今津中学校',0],['SUNHEARTS',3],['高槻市立第三中学校',0],['B☆MAX',2],['八尾市立東中学校',0],['Sparkle Basketball Club',0],['大阪エヴェッサU-15（ユース）',2],['大阪市立港南中学校',1],['八尾市立上之島中学校',0],['なみはやバスケットボールクラブ',1],['ENERGY',0],['東大阪市立石切中学校',1],['大阪市立大正中央中学校',0],['HOOPERS',2],['関西大学第一中学校',0],['CLUB SPIRITS',2],['大阪市立巽中学校',0],['大阪市立大正西中学校',1],['BLACK UNICORN',0],['BC Alma枚方',0],['大阪市立花乃井中学校',4],['Switch! U15',1],['ディノニクスU15',0],['八上ワイルドキャッツU-15',3],['大阪エヴェッサU-15（クラブ）',0],['大阪市立住之江中学校',0],['HOSOGO GIBSONS',0],['K\'sLEO BASKETBALL CLUB',3],['SHINE',0],['HIRAKATA UNITED BC',0],['近畿大学附属中学校',2],['羽曳野市立高鷲南中学校',0],['大阪GOLDEN EGG',2],['大阪市立新北島中学校',0],['摂津市立第四中学校',1],['八尾市立南高安中学校',0],['EAST.O.ACADEMY U-15 TEAM',3]
];

const BEST4=new Set(['T-SMILE BASKET BALL TEAM U15','EAST.O.ACADEMY U-15 TEAM']);
const BEST8=new Set(['FRONTIER SPIRITS U15','NEXTEST','CLUB SPIRITS','大阪GOLDEN EGG']);
const BEST16=new Set(['T\'s CROWS','大阪市立東生野中学校','大阪市立三国中学校','RGS','SUNHEARTS','大阪市立巽中学校','大阪市立住之江中学校','羽曳野市立高鷲南中学校']);
const BEST32=new Set(['RED FROGS','ANGRY OWLS','大阪市立下福島中学校','EDGE','泉大津ジュニアバスケットボールクラブ','HOS','門真市立第二中学校','シャイン柏原','AIR','B☆MAX','大阪エヴェッサU-15（ユース）','HOOPERS','大阪市立花乃井中学校','八上ワイルドキャッツU-15','K\'sLEO BASKETBALL CLUB','近畿大学附属中学校']);

function resultFor(teamName,wins){
  if(teamName==='REDFORCES')return ['優勝','S',1];
  if(teamName==='KAGO CLUB')return ['準優勝','A+',2];
  if(BEST4.has(teamName))return ['ベスト4',wins?'A':'D',null];
  if(BEST8.has(teamName))return ['ベスト8',wins?'B+':'D',null];
  if(BEST16.has(teamName))return ['ベスト16',wins?'B':'D',null];
  if(BEST32.has(teamName))return ['ベスト32',wins?'C':'D',null];
  return [wins?'ベスト64':'初戦敗退',wins?'C':'D',null];
}

export const TEAMS_2025_OSAKA_JR_WINTER_CUP_MEN=[...LEFT,...RIGHT].map(([teamName,wins])=>{
  const [placementLabel,rank,placement]=resultFor(teamName,wins);
  return {teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),placementLabel,placement,wins,losses:teamName==='REDFORCES'?0:1,rank};
});
