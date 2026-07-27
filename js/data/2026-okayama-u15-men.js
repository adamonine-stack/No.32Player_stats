import { normalizeImportedTeamName } from './2026-hyogo-u15-men.js';

export const TOURNAMENT_2026_OKAYAMA_U15_MEN={
  id:'2026-okayama-u15-club-summer-men',
  year:2026,
  name:'岡山県U15クラブ夏季大会',
  shortName:'岡山県U15クラブ夏季大会',
  prefecture:'岡山県',
  category:'U15男子',
  type:'都道府県大会',
  participantCount:18,
  resultConfirmed:true,
  resultStatus:'completed',
  sourceType:'confirmedTournamentResult'
};

const TOP=[
  ["D's",'優勝',1],
  ['SunBraves','準優勝',2],
  ['KIZUNA','3位',3],
  ['CROSSLINK','4位',4],
  ['IBC STARS','5位',5],
  ['SOJA NAVY SHRINES','6位',6],
  ['Southern Cross','7位',7],
  ['ダルマーズ','8位',8]
];
const FIRST_ROUND=['ADAPT FR','ADAPT Vivid','NEW LOOK SPURS','トライフープ岡山U15','TITANS','FIVE STARS','WEAST','ADAPT Quest','ADAPT KG','GEMSTONE'];
const ALL=[...TOP.map(([name])=>name),...FIRST_ROUND];

export const TEAMS_2026_OKAYAMA_U15_MEN=ALL.map(teamName=>{
  const top=TOP.find(([name])=>name===teamName);
  return {
    teamName,
    normalizedTeamName:normalizeImportedTeamName(teamName),
    placementLabel:top?.[1]||'初戦敗退',
    placement:top?.[2]||null
  };
});
