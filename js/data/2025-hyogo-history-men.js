import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const SPECIAL={
  '相生バスケットボールクラブ':{teamName:'相生バスケットボールクラブ',aliases:['相生BC','相生ＢＣ']},
  'Falcons':{teamName:'Falcons U15 basketball club team',aliases:['Falcons','ファルコンズ']},
  'RED PIECE':{teamName:'RED PIECE',aliases:[]},
  '西部拠点校':{teamName:'西部拠点校',aliases:['西部拠点']},
  '市島・柏原':{teamName:'市島・柏原',aliases:['市島・柏原中学校']},
  '兵庫県立大学附属・上郡':{teamName:'兵庫県立大学附属・上郡',aliases:['兵庫県立大学附属・上郡中学校']},
  '多田BW':{teamName:'多田BW',aliases:['多田 BW']},
};
function canonical(sourceName){
  const special=SPECIAL[sourceName];
  if(special)return special;
  const teamName=sourceName.endsWith('中学校')?sourceName:`${sourceName}中学校`;
  return {teamName,aliases:[sourceName]};
}
const team=(sourceName,placementLabel,rank,extra={})=>{const c=canonical(sourceName);return {sourceName,teamName:c.teamName,normalizedTeamName:normalizeTeamNameForMatching(c.teamName),aliases:c.aliases,placementLabel,rank,...extra}};

export const TOURNAMENT_2025_HYOGO_JHS_SOUTAI_MEN={
  id:'2025-hyogo-jhs-soutai-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'令和7年度 第69回兵庫県中学校総合体育大会 第77回兵庫県中学校バスケットボール競技大会 男子',
  shortName:'2025 兵庫県中学校総体 男子',prefecture:'兵庫県',category:'U15男子',gender:'男子',
  type:'県大会 / 中学校総体',tournamentLevel:'prefecture',participantCount:16,resultConfirmed:true,resultStatus:'completed',sourceType:'official_tournament_result',
  source:{organization:'兵庫県中学校体育連盟バスケットボール部 / 兵庫県バスケットボール協会U15部会中学校委員会',document:'兵庫県中学校総合体育大会2025 最終結果',publishedDate:'2025-07-24',pageUrl:'https://www.hyogo-jhs-basketball.net/%E7%B7%8F%E5%90%88%E4%BD%93%E8%82%B2%E5%A4%A7%E4%BC%9A2025',pdfUrl:'https://www.hyogo-jhs-basketball.net/_files/ugd/7b84d6_c4e6db23b20f4bb3b3b5090d098ff967.pdf',verified:true}
};
const SOUTAI_ALL=['日高東','香住第一','望海','稲美北','三原','南淡','西部拠点校','小部','けやき台','狭間','報徳学園','上ヶ原','書写','朝日','龍野西','相生バスケットボールクラブ'];
const SOUTAI_TOP={
  '報徳学園':['優勝','S'],
  '上ヶ原':['準優勝','A+'],
  '相生バスケットボールクラブ':['ベスト4','A'],
  '書写':['ベスト4','A'],
  '三原':['ベスト8','B'],
  '日高東':['ベスト8','B'],
  'けやき台':['ベスト8','B'],
  '稲美北':['ベスト8','B']
};
export const TEAMS_2025_HYOGO_JHS_SOUTAI_MEN=SOUTAI_ALL.map(name=>{const result=SOUTAI_TOP[name]||['ベスト16','C'];return team(name,result[0],result[1],{ageGroup:'U15'})});

export const TOURNAMENT_2025_HYOGO_JHS_ROOKIES_MEN={
  id:'2025-hyogo-jhs-rookies-men',year:2025,season:'2025-26',generation:'2025-26',
  name:'令和7年度 兵庫県中学校バスケットボール新人大会 兼 第77回兵庫県中学校バスケットボール選抜優勝大会 男子',
  shortName:'2025 兵庫県中学校新人大会 男子',prefecture:'兵庫県',category:'U15男子',gender:'男子',
  type:'県大会 / 中学校新人',tournamentLevel:'prefecture',participantCount:64,resultConfirmed:true,resultStatus:'completed',sourceType:'official_tournament_result',
  source:{organization:'兵庫県中学校体育連盟バスケットボール部 / 兵庫県バスケットボール協会U15部会中学校委員会',document:'令和7年度 兵庫県中学校バスケットボール新人大会 男子結果',publishedDate:'2025-12-26',pageUrl:'https://www.hyogo-jhs-basketball.net/%E6%96%B0%E4%BA%BA%E5%A4%A7%E4%BC%9A2025',verified:true}
};
const ROOKIES_ALL=['稲美北','多田BW','西代','城山','松陽','市島・柏原','精道','兵庫','浜脇','長峰','香住第一','狭間','雲雀丘','書写','南淡','伊丹東','園田','相生バスケットボールクラブ','大原','氷上','北条','広畑','西部拠点校','園田東','Falcons','山南','長田','氷丘','中部','小園','青雲','多聞東','豊岡南','本山','大久保','大庄','衣川','鈴蘭台','伊丹南','豊岡北','報徳学園','大久保北','福崎東','鷹取','甲南','浜の宮','横尾','兵庫県立大学附属・上郡','今津','野々池','玉津','朝日','有野','東浦','二見','甲武','望海','宝塚','灘','菅野','宝梅','和田山','向洋','RED PIECE'];
const ROOKIES_TOP={
  '望海':['優勝','S'],
  '報徳学園':['準優勝','A+'],
  '稲美北':['ベスト4','A'],
  '長田':['ベスト4','A'],
  '宝梅':['ベスト8','B'],
  '園田':['ベスト8','B'],
  '今津':['ベスト8','B'],
  '横尾':['ベスト8','B'],
  '松陽':['ベスト16','C'],
  '雲雀丘':['ベスト16','C'],
  '浜脇':['ベスト16','C'],
  '衣川':['ベスト16','C'],
  '北条':['ベスト16','C'],
  '大久保':['ベスト16','C'],
  '青雲':['ベスト16','C'],
  '有野':['ベスト16','C'],
  '西代':['ベスト32','D'],
  '精道':['ベスト32','D'],
  '香住第一':['ベスト32','D'],
  '南淡':['ベスト32','D'],
  '大原':['ベスト32','D'],
  '西部拠点校':['ベスト32','D'],
  'Falcons':['ベスト32','D'],
  '中部':['ベスト32','D'],
  '豊岡南':['ベスト32','D'],
  '伊丹南':['ベスト32','D'],
  '福崎東':['ベスト32','D'],
  '甲南':['ベスト32','D'],
  '玉津':['ベスト32','D'],
  '二見':['ベスト32','D'],
  '灘':['ベスト32','D'],
  '向洋':['ベスト32','D']
};
export const TEAMS_2025_HYOGO_JHS_ROOKIES_MEN=ROOKIES_ALL.map(name=>{const result=ROOKIES_TOP[name]||['ベスト64','E'];return team(name,result[0],result[1],{ageGroup:'U14'})});
