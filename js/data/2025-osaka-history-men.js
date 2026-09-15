import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const commonAliases={
  'BC Alma枚方':['BC Alma','BC Almo枚方'],
  'EAST.O.ACADEMY U-15 TEAM':['EAST.O.ACADEMY','EAST.O.ACADEMY U15 TEAM'],
  'FRONTIER SPIRITS U15':['FRONTIER SPIRITS'],
  'IBARAKI BASKETBALL CLUB':['IBBC','ＩＢＡＲＡＫＩ ＢＢＣ'],
  'K\'sLEO BASKETBALL CLUB':["K's LEO BASKETBALL CLUB","K’s LEO BASKETBALL CLUB","K'sLEO"],
  'OSAKA FIREFLY':['Osaka Firefly'],
  'REDFORCES':['RED FORCES'],
  'Secret BaseU15':['Secret Base','Secret Base U15'],
  'SUNHEARTS':['SUN HEARTS'],
  'T-SMILE BASKET BALL TEAM U15':['T-SMILE','T-SMILE BASKETBALL TEAM U15'],
  "T's CROWS":["T’s CROWS","T ’sCROWS"],
  '八上ワイルドキャッツU-15':['八上ワイルドキャッツ'],
  '大阪エヴェッサU-15':['大阪エヴェッサU-15（クラブ）']
};
const team=(teamName,placementLabel,rank,extra={})=>({teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),placementLabel,rank,aliases:commonAliases[teamName]||[],...extra});

export const TOURNAMENT_2025_OSAKA_CLUB_CUP_MEN={
  id:'2025-osaka-club-cup-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'第6回クラブカップ',shortName:'第6回クラブカップ',prefecture:'大阪府',category:'U15',gender:'男子',
  type:'クラブカップ',tournamentLevel:'prefecture',participantCount:31,resultConfirmed:true,resultStatus:'completed',sourceType:'official_bracket',
  source:{organization:'大阪府バスケットボール協会U15部会',document:'第6回クラブカップ 最終結果',publishedDate:'2025-05-26',pageUrl:'https://u15.osakabasketball.jp/?p=813',pdfUrl:'https://u15.osakabasketball.jp/wp/wp-content/uploads/2025/05/%E6%9C%80%E7%B5%82_%E7%B5%90%E6%9E%9C.pdf',verified:true}
};

const CLUB_CUP_ALL=['Akans','ANGRY OWLS','B☆MAX','BLACK UNICORN','B-NETZ','CLUB SPIRITS','EAST.O.ACADEMY U-15 TEAM','EDGE','FRONTIER SPIRITS U15','HOOPERS','HOS','HOSOGO GIBSONS','KAGO CLUB',"K'sLEO BASKETBALL CLUB",'monolith U15','NEXTEST','RED FROGS','REDFORCES','RGS','RISING STAR','sHow time','Sparkle Basketball Club','Switch!',"T's CROWS",'T-SMILE BASKET BALL TEAM U15','ディノニクスU15','SHINE','寝屋川B.C.','泉大津ジュニアバスケットボールクラブ','大阪エヴェッサU-15','八上ワイルドキャッツU-15'];
const CLUB_CUP_TOP={
  'REDFORCES':['優勝','S'],
  'EAST.O.ACADEMY U-15 TEAM':['準優勝','A+'],
  'KAGO CLUB':['ベスト4','A'],
  'NEXTEST':['ベスト4','A'],
  'T-SMILE BASKET BALL TEAM U15':['ベスト8','B'],
  'FRONTIER SPIRITS U15':['ベスト8','B'],
  "K'sLEO BASKETBALL CLUB":['ベスト8','B'],
  'CLUB SPIRITS':['ベスト8','B'],
  'HOS':['ベスト16','C'],
  "T's CROWS":['ベスト16','C'],
  'Sparkle Basketball Club':['ベスト16','C'],
  '八上ワイルドキャッツU-15':['ベスト16','C'],
  'B☆MAX':['ベスト16','C'],
  'RGS':['ベスト16','C'],
  'RISING STAR':['ベスト16','C'],
  'sHow time':['ベスト16','C']
};
export const TEAMS_2025_OSAKA_CLUB_CUP_MEN=CLUB_CUP_ALL.map(name=>{const result=CLUB_CUP_TOP[name]||['予選敗退（ベスト32相当）','D'];return team(name,result[0],result[1])});

export const TOURNAMENT_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN={
  id:'2025-osaka-junior-championship-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'第11回大阪府ジュニアバスケットボール選手権',shortName:'第11回大阪府ジュニア選手権',prefecture:'大阪府',category:'U15',gender:'男子',
  type:'大阪府ジュニアバスケットボール選手権',tournamentLevel:'prefecture',participantCount:48,resultConfirmed:true,resultStatus:'completed',sourceType:'official_bracket',
  source:{organization:'大阪府バスケットボール協会U15部会',document:'第11回大阪府ジュニアバスケットボール選手権 最終結果',publishedDate:'2025-11-24',pageUrl:'https://u15.osakabasketball.jp/?p=883',pdfUrl:'https://u15.osakabasketball.jp/wp/wp-content/uploads/2025/11/%E6%9C%80%E7%B5%82%E7%B5%90%E6%9E%9C.pdf',verified:true}
};
const JUNIOR_ALL=['AIR','Akans','ANGRY OWLS','B☆MAX','BC Alma枚方','BLACK UNICORN','Blue Dolphins','B-NETZ','CLUB SPIRITS','DSELECT','E.M.B.C. U15','EAST.O.ACADEMY U-15 TEAM','EDGE','EL.DRAGON U-15','FRONTIER SPIRITS U15','GRITS','HIRAKATA UNITED BC','HOOPERS','HOS','HOSOGO GIBSONS','IBARAKI BASKETBALL CLUB','KAGO CLUB',"K'sLEO BASKETBALL CLUB",'monolith U15','NEXT HEROES','NEXTEST','OSAKA FIREFLY','RED FROGS','REDFORCES','RGS','RISING STAR','Secret BaseU15','SHINE','sHow time','Sparkle Basketball Club','SUNHEARTS','Switch! U15',"T's CROWS",'TEAM GRIT','T-SMILE BASKET BALL TEAM U15','ディノニクスU15','なみはやバスケットボールクラブ','泉大津ジュニアバスケットボールクラブ','大阪GOLDEN EGG','大阪エヴェッサU-15','八上ワイルドキャッツU-15','ENERGY','TAKATSU CLUB'];
const JUNIOR_TOP={
  'KAGO CLUB':['優勝','S'],
  'T-SMILE BASKET BALL TEAM U15':['準優勝','A+'],
  'EAST.O.ACADEMY U-15 TEAM':['ベスト4','A'],
  "T's CROWS":['ベスト4','A'],
  'REDFORCES':['ベスト8','B'],
  'SUNHEARTS':['ベスト8','B'],
  'AIR':['ベスト8','B'],
  'CLUB SPIRITS':['ベスト8','B'],
  'Sparkle Basketball Club':['ベスト16','C'],
  "K'sLEO BASKETBALL CLUB":['ベスト16','C'],
  '大阪GOLDEN EGG':['ベスト16','C'],
  'NEXTEST':['ベスト16','C'],
  'RGS':['ベスト16','C'],
  'FRONTIER SPIRITS U15':['ベスト16','C'],
  'RISING STAR':['ベスト16','C'],
  'B☆MAX':['ベスト16','C']
};
const JUNIOR_SECOND_ROUND=new Set(['Akans','E.M.B.C. U15','BLACK UNICORN','HIRAKATA UNITED BC','sHow time','EDGE','HOS','泉大津ジュニアバスケットボールクラブ','ANGRY OWLS','ディノニクスU15','八上ワイルドキャッツU-15','Switch! U15','RED FROGS','EL.DRAGON U-15','B-NETZ','HOOPERS']);
export const TEAMS_2025_OSAKA_JUNIOR_CHAMPIONSHIP_MEN=JUNIOR_ALL.map(name=>{const result=JUNIOR_TOP[name]||(JUNIOR_SECOND_ROUND.has(name)?['2次予選敗退（ベスト32相当）','D']:['1次予選敗退（ベスト64相当）','E']);return team(name,result[0],result[1])});
