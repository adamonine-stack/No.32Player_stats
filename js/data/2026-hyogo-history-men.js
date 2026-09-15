import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';

const SPECIAL={
  '望海':{teamName:'明石市立望海中学校',aliases:['望海','望海中学校']},
  '報徳学園':{teamName:'報徳学園中学校',aliases:['報徳学園']},
  '衣川':{teamName:'明石市立衣川中学校',aliases:['衣川','衣川中学校']},
  '園田':{teamName:'尼崎市立園田中学校',aliases:['園田','園田中学校']},
  '県立大付属・上郡':{teamName:'兵庫県立大学附属・上郡',aliases:['県立大付属・上郡','兵庫県立大学附属・上郡中学校']},
  '富士･狭間':{teamName:'富士･狭間',aliases:['富士・狭間','富士･狭間中学校']},
  'ゆりのき台･藍':{teamName:'ゆりのき台･藍',aliases:['ゆりのき台・藍','ゆりのき台･藍中学校']},
};
function canonical(sourceName){
  const special=SPECIAL[sourceName];
  if(special)return special;
  const teamName=sourceName.endsWith('中学校')?sourceName:`${sourceName}中学校`;
  return {teamName,aliases:[sourceName]};
}
const team=(sourceName,placementLabel,rank,extra={})=>{const c=canonical(sourceName);return {sourceName,teamName:c.teamName,normalizedTeamName:normalizeTeamNameForMatching(c.teamName),aliases:c.aliases,placementLabel,rank,...extra}};

export const TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN={
  id:'2026-hyogo-jhs-soutai-men',year:2026,season:'2026-27',generation:'2026-27',
  name:'令和8年度 兵庫県中学校総合体育大会 バスケットボール大会 男子',
  shortName:'2026 兵庫県中学校総体 男子',prefecture:'兵庫県',category:'U15男子',gender:'男子',
  type:'県大会 / 中学校総体',tournamentLevel:'prefecture',participantCount:16,resultConfirmed:true,resultStatus:'completed',sourceType:'official_tournament_result',
  source:{organization:'兵庫県中学校体育連盟バスケットボール部 / 兵庫県バスケットボール協会U15部会中学校委員会',document:'兵庫県中学校総合体育大会2026 最終結果',publishedDate:'2026-07-26',pageUrl:'https://www.hyogo-jhs-basketball.net/%E7%B7%8F%E5%90%88%E4%BD%93%E8%82%B2%E5%A4%A7%E4%BC%9A2026',verified:true}
};

const ALL=['書写','朝日','県立大付属・上郡','太子西','香住第一','豊岡北','望海','衣川','富士･狭間','ゆりのき台･藍','報徳学園','園田','南淡','津名','長田','横尾'];
const TOP={
  '望海':['優勝','S'],
  '報徳学園':['準優勝','A+'],
  '衣川':['ベスト4','A'],
  '園田':['ベスト4','A'],
  '南淡':['ベスト8','B'],
  '書写':['ベスト8','B'],
  '香住第一':['ベスト8','B'],
  '豊岡北':['ベスト8','B']
};
export const TEAMS_2026_HYOGO_JHS_SOUTAI_MEN=ALL.map(name=>{const result=TOP[name]||['ベスト16','C'];return team(name,result[0],result[1],{ageGroup:'U15'})});
