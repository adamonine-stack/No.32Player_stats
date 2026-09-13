export const OPPONENT_RANKS=["E","D","C","B","A","A+","S"];

const SCORE={E:1,D:2,C:3,B:4,"B+":4,A:5,"A+":6,S:7};
export const TEAM_POWER_BASE={E:100,D:200,C:300,B:400,A:500,"A+":600,S:700};
const BLOCK_POWER_BONUS={champion:120,runnerUp:100,best4:80,best8:60,best16:40,participation:20};
const NATIONAL_POWER_BONUS={champion:250,runnerUp:220,best4:180,best8:140,best16:100,best32:70,participation:40};
const HISTORICAL_ACHIEVEMENT_POINTS={
  prefecture:{champion:10,runnerUp:8,best4:6,best8:4,best16:2,best32:0,participation:0},
  block:{champion:14,runnerUp:12,best4:10,best8:8,best16:6,best32:6,participation:6},
  national:{champion:20,runnerUp:18,best4:16,best8:14,best16:12,best32:10,participation:10}
};
export const HISTORICAL_TEAM_POWER_WEIGHTS=[0.6,0.3,0.1];
export const HISTORICAL_TEAM_POWER_MAX=15;

export function rankToScore(rank){return SCORE[rank]||0}
export function scoreToRank(score){
  if(score>=6.5)return "S";
  if(score>=5.5)return "A+";
  if(score>=4.5)return "A";
  if(score>=3.5)return "B";
  if(score>=2.5)return "C";
  if(score>=1.5)return "D";
  return score>0?"E":null;
}
export function seasonFromYear(year){const start=Number(year);return Number.isFinite(start)&&start>0?`${start}-${String((start+1)%100).padStart(2,"0")}`:""}
export function currentSeasonLabel(date=new Date()){const value=date instanceof Date?date:new Date(date),year=value.getFullYear(),start=value.getMonth()>=3?year:year-1;return seasonFromYear(start)}
export function previousSeasonLabel(season){const start=Number(String(season||"").slice(0,4));return Number.isFinite(start)?seasonFromYear(start-1):""}
export function previousSeasonLabels(season,count=3){const start=Number(String(season||"").slice(0,4));if(!Number.isFinite(start)||count<=0)return [];return Array.from({length:count},(_,index)=>seasonFromYear(start-index-1))}
export function placementSeason(item={}){return item.season||seasonFromYear(item.year)}

export function normalizeTournamentLevel(item={}){
  const explicit=String(item.tournamentLevel||item.competitionLevel||"").toLowerCase();
  if(["prefecture","block","national"].includes(explicit))return explicit;
  const text=`${item.tournamentType||item.type||""} ${item.tournamentName||""}`;
  if(/全国/u.test(text))return "national";
  if(/近畿|関東|東海|北信越|東北|中国|四国|九州|北海道|ブロック/u.test(text))return "block";
  return "prefecture";
}

function normalizedPlacementText(label=""){return String(label||"").normalize("NFKC").replace(/\s+/gu,"")}

export function placementLabelToRank(label){
  const text=normalizedPlacementText(label);
  if(!text)return null;
  if(text==="優勝"||/(^|[^準])優勝/u.test(text))return "S";
  if(/準優勝|2位|第2位/u.test(text))return "A+";
  if(/ベスト4|3位|第3位|4位|第4位|準決勝敗退/u.test(text))return "A";
  if(/ベスト8|5位|第5位|6位|第6位|7位|第7位|8位|第8位|準々決勝敗退/u.test(text))return "B";
  if(/ベスト16/u.test(text))return "C";
  if(/ベスト32/u.test(text))return "D";
  if(/ベスト64|県大会出場|都道府県大会出場/u.test(text))return "E";
  // 「初戦敗退」「1回戦敗退」だけでは、シードや予選構造により最終順位を特定できない。
  return null;
}

function normalizeLegacyRank(rank){return rank==="B+"?"B":OPPONENT_RANKS.includes(rank)?rank:null}

export function prefectureRankForPlacement(item={}){
  if(normalizeTournamentLevel(item)!=="prefecture")return null;
  const byPlacement=placementLabelToRank(item.placementLabel||item.placement);
  if(byPlacement)return byPlacement;
  const label=normalizedPlacementText(item.placementLabel||item.placement);
  if(/初戦敗退|1回戦敗退/u.test(label))return null;
  return normalizeLegacyRank(item.prefectureRank||item.seasonRank||item.placementRank||item.rankValue);
}

export function calculateSeasonRanks(placements=[]){
  const groups={};
  for(const item of placements){
    const season=placementSeason(item),rank=prefectureRankForPlacement(item),score=rankToScore(rank);
    if(!season||!score)continue;
    const group=groups[season]||{rank:null,score:0,recordCount:0,calculationMethod:"highest-prefecture-placement"};
    group.recordCount++;
    if(score>group.score){group.rank=rank;group.score=score}
    groups[season]=group;
  }
  return groups;
}

export function calculateSeasonalTeamRank(placements=[],options={}){
  const currentSeason=options.currentSeason||currentSeasonLabel(),previousSeason=options.previousSeason||previousSeasonLabel(currentSeason),seasonRanks=calculateSeasonRanks(placements),current=seasonRanks[currentSeason],previous=seasonRanks[previousSeason];
  if(!current&&!previous)return {rank:null,score:null,overallRank:null,overallScore:null,overallRankStatus:"unranked",currentSeason,previousSeason,seasonRanks};
  if(!current)return {rank:previous.rank,score:previous.score,overallRank:previous.rank,overallScore:previous.score,overallRankStatus:"provisional",currentSeason,previousSeason,seasonRanks};
  return {rank:current.rank,score:current.score,overallRank:current.rank,overallScore:current.score,overallRankStatus:"confirmed",currentSeason,previousSeason,seasonRanks};
}

export function calculateOpponentTeamRank(placements=[],options={}){
  if(options.seasonal)return calculateSeasonalTeamRank(placements,options);
  let rank=null,score=0;
  for(const item of placements){
    const candidate=prefectureRankForPlacement(item),candidateScore=rankToScore(candidate);
    if(candidateScore>score){rank=candidate;score=candidateScore}
  }
  return {rank,score:rank?score:null};
}

function placementStage(label=""){
  const text=normalizedPlacementText(label);
  if(/優勝/u.test(text)&&!/準優勝/u.test(text))return "champion";
  if(/準優勝|2位|第2位/u.test(text))return "runnerUp";
  if(/ベスト4|3位|第3位|4位|第4位|準決勝敗退/u.test(text))return "best4";
  if(/ベスト8|5位|第5位|6位|第6位|7位|第7位|8位|第8位|準々決勝敗退/u.test(text))return "best8";
  if(/ベスト16/u.test(text))return "best16";
  if(/ベスト32/u.test(text))return "best32";
  return "participation";
}

export function upperTournamentBonus(item={}){
  const explicit=Number(item.teamPowerBonus??item.upperTournamentBonus);
  if(Number.isFinite(explicit)&&explicit>=0)return explicit;
  const level=normalizeTournamentLevel(item),stage=placementStage(item.placementLabel||item.placement);
  if(level==="block")return BLOCK_POWER_BONUS[stage]??BLOCK_POWER_BONUS.participation;
  if(level==="national")return NATIONAL_POWER_BONUS[stage]??NATIONAL_POWER_BONUS.participation;
  return 0;
}

export function historicalAchievementPoints(item={}){
  const level=normalizeTournamentLevel(item),stage=placementStage(item.placementLabel||item.placement),table=HISTORICAL_ACHIEVEMENT_POINTS[level];
  return table?.[stage]??table?.participation??0;
}

export function calculateHistoricalTeamBonus(placements=[],options={}){
  const currentSeason=options.currentSeason||options.season||currentSeasonLabel(),seasons=previousSeasonLabels(currentSeason,HISTORICAL_TEAM_POWER_WEIGHTS.length);
  const details=seasons.map((season,index)=>{
    let achievementPoints=0,bestLevel=null,bestStage=null;
    for(const item of placements){
      if(placementSeason(item)!==season)continue;
      const points=historicalAchievementPoints(item);
      if(points>achievementPoints){achievementPoints=points;bestLevel=normalizeTournamentLevel(item);bestStage=placementStage(item.placementLabel||item.placement)}
    }
    const weight=HISTORICAL_TEAM_POWER_WEIGHTS[index],weightedPoints=Math.round(achievementPoints*weight*10)/10;
    return {season,weight,achievementPoints,weightedPoints,bestLevel,bestStage};
  });
  const rawBonus=Math.round(details.reduce((sum,item)=>sum+item.weightedPoints,0)*10)/10,bonus=Math.min(HISTORICAL_TEAM_POWER_MAX,Math.max(0,rawBonus));
  return {bonus,rawBonus,maxBonus:HISTORICAL_TEAM_POWER_MAX,details};
}

export function calculateTeamPower(placements=[],options={}){
  const season=options.currentSeason||options.season||currentSeasonLabel(),seasonItems=placements.filter(item=>placementSeason(item)===season);
  const seasonRank=calculateSeasonRanks(seasonItems)[season],rank=options.rank||seasonRank?.rank||null,history=calculateHistoricalTeamBonus(placements,{currentSeason:season});
  if(!rank)return {rank:null,basePower:null,prefectureStrengthBonus:0,prefectureStrengthIndex:null,blockBonus:0,nationalBonus:0,historicalAchievementBonus:history.bonus,historicalAchievementRawBonus:history.rawBonus,historicalAchievementDetails:history.details,power:null};
  const basePower=TEAM_POWER_BASE[rank],prefectureStrengthBonus=Math.max(0,Number(options.prefectureStrengthBonus)||0);
  let blockBonus=0,nationalBonus=0;
  for(const item of seasonItems){
    const level=normalizeTournamentLevel(item),bonus=upperTournamentBonus(item);
    if(level==="block")blockBonus=Math.max(blockBonus,bonus);
    if(level==="national")nationalBonus=Math.max(nationalBonus,bonus);
  }
  const power=Math.round((basePower+prefectureStrengthBonus+blockBonus+nationalBonus+history.bonus)*10)/10;
  return {rank,basePower,prefectureStrengthBonus,prefectureStrengthIndex:100+prefectureStrengthBonus,blockBonus,nationalBonus,historicalAchievementBonus:history.bonus,historicalAchievementRawBonus:history.rawBonus,historicalAchievementDetails:history.details,power};
}

export function calculatePrefectureStrengthBonuses(teams=[],options={}){
  const season=options.currentSeason||options.season||currentSeasonLabel(),groups=new Map();
  for(const team of teams){
    const prefecture=team.prefecture||team.region;
    if(!prefecture)continue;
    const items=(team.tournamentPlacements||[]).filter(item=>placementSeason(item)===season);
    let block=0,national=0;
    for(const item of items){
      const level=normalizeTournamentLevel(item),bonus=upperTournamentBonus(item);
      if(level==="block")block=Math.max(block,bonus);
      if(level==="national")national=Math.max(national,bonus);
    }
    if(!block&&!national)continue;
    const list=groups.get(prefecture)||[];
    list.push(block+national*.5);
    groups.set(prefecture,list);
  }
  const result={};
  for(const [prefecture,values] of groups){
    const average=values.reduce((sum,value)=>sum+value,0)/values.length,bonus=Math.max(0,Math.min(50,Math.round(average*.4)));
    result[prefecture]={bonus,index:100+bonus,representativeCount:values.length,averageUpperScore:average};
  }
  return result;
}

export function sortPlayerNumbers(values=[]){return [...new Set(values.map(value=>String(value).trim()).filter(value=>/^\d+$/.test(value)))].sort((a,b)=>Number(a)-Number(b)||a.localeCompare(b))}
