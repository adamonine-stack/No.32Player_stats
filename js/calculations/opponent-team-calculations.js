export const OPPONENT_RANKS=["D","C","B","B+","A","A+","S"];
const SCORE={D:1,C:2,B:3,"B+":4,A:5,"A+":6,S:7};
export function rankToScore(rank){return SCORE[rank]||0}
export function scoreToRank(score){if(score>=6.5)return "S";if(score>=5.5)return "A+";if(score>=4.5)return "A";if(score>=3.5)return "B+";if(score>=2.5)return "B";if(score>=1.5)return "C";return score>0?"D":null}
export function calculateOpponentTeamRank(placements=[]){const scores=placements.map(item=>rankToScore(item.placementRank)).filter(Boolean);if(!scores.length)return {rank:null,score:null};const score=scores.reduce((a,b)=>a+b,0)/scores.length;return {rank:scoreToRank(score),score:Number(score.toFixed(2))}}
export function sortPlayerNumbers(values=[]){return [...new Set(values.map(value=>String(value).trim()).filter(value=>/^\d+$/.test(value)))].sort((a,b)=>Number(a)-Number(b)||a.localeCompare(b))}
