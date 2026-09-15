export const OPPONENT_RANKS=["E","D","C","B","A","A+","S"];

const SCORE={E:1,D:2,C:3,B:4,"B+":4,A:5,"A+":6,S:7};
export const TEAM_POWER_BASE={E:100,D:200,C:300,B:400,A:500,"A+":600,S:700};
const BLOCK_POWER_BONUS={champion:150,runnerUp:130,best4:100,best8:70,best16:55,best32:40,participation:40};
const NATIONAL_POWER_BONUS={champion:200,runnerUp:200,best4:180,best8:160,best16:140,best32:120,participation:100};
const HISTORICAL_ACHIEVEMENT_POINTS={champion:100,runnerUp:85,best4:70,best8:55,best16:40,best32:25,participation:10};
export const HISTORICAL_TEAM_POWER_WEIGHTS=[0.6,0.3,0.1];
export const HISTORICAL_TEAM_POWER_MAX=100;
export const TEAM_POWER_MAX=1000;

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

export function isValidTournamentAchievement(item={}){
  if(!item||typeof item!=="object"||item.resultConfirmed===false)return false;
  const label=normalizedPlacementText(item.placementLabel??item.placement??""),
        hasTournamentIdentity=Boolean(String(item.tournamentName||item.name||item.tournamentId||"").trim()),
        hasSeason=Boolean(placementSeason(item));
  if(!hasTournamentIdentity||!hasSeason||!label)return false;
  if(placementLabelToRank(label))return true;
  return /出場|参加|初戦敗退|1回戦敗退|2回戦敗退|予選敗退|リーグ敗退/u.test(label);
}

export function upperTournamentBonus(item={}){
  if(!isValidTournamentAchievement(item))return 0;
  const explicit=Number(item.teamPowerBonus??item.upperTournamentBonus);
  if(Number.isFinite(explicit)&&explicit>=0)return explicit;
  const level=normalizeTournamentLevel(item),stage=placementStage(item.placementLabel||item.placement);
  if(level==="block")return BLOCK_POWER_BONUS[stage]??BLOCK_POWER_BONUS.participation;
  if(level==="national")return NATIONAL_POWER_BONUS[stage]??NATIONAL_POWER_BONUS.participation;
  return 0;
}

export function historicalAchievementPoints(item={}){
  if(!isValidTournamentAchievement(item))return 0;
  const stage=placementStage(item.placementLabel||item.placement);
  return HISTORICAL_ACHIEVEMENT_POINTS[stage]??HISTORICAL_ACHIEVEMENT_POINTS.participation;
}

export function calculateHistoricalTeamBonus(placements=[],options={}){
  const currentSeason=options.currentSeason||options.season||currentSeasonLabel(),seasons=previousSeasonLabels(currentSeason,HISTORICAL_TEAM_POWER_WEIGHTS.length);
  const details=seasons.map((season,index)=>{
    const records=placements.filter(item=>placementSeason(item)===season&&isValidTournamentAchievement(item)).map(item=>({
      level:normalizeTournamentLevel(item),
      stage:placementStage(item.placementLabel||item.placement),
      points:historicalAchievementPoints(item)
    }));
    const achievementPoints=records.length?Math.round((records.reduce((sum,item)=>sum+item.points,0)/records.length)*10)/10:0;
    const weight=HISTORICAL_TEAM_POWER_WEIGHTS[index],weightedPoints=Math.round(achievementPoints*weight*10)/10;
    return {season,weight,achievementPoints,weightedPoints,recordCount:records.length,records};
  });
  const rawBonus=Math.round(details.reduce((sum,item)=>sum+item.weightedPoints,0)*10)/10,bonus=Math.min(HISTORICAL_TEAM_POWER_MAX,Math.max(0,rawBonus));
  return {bonus,rawBonus,maxBonus:HISTORICAL_TEAM_POWER_MAX,details,calculationMethod:"season-average-weighted-60-30-10"};
}

export function calculateTeamPower(placements=[],options={}){
  const season=options.currentSeason||options.season||currentSeasonLabel(),previousSeason=previousSeasonLabel(season),seasonItems=placements.filter(item=>placementSeason(item)===season);
  const validPlacements=placements.filter(isValidTournamentAchievement),seasonRanks=calculateSeasonRanks(validPlacements),currentRank=seasonRanks[season]?.rank||null,previousRank=seasonRanks[previousSeason]?.rank||null,rank=currentRank||previousRank||null;
  const prefecturePowerSource=currentRank?"current":previousRank?"previous":null,prefecturePowerSeason=currentRank?season:previousRank?previousSeason:null,history=calculateHistoricalTeamBonus(placements,{currentSeason:season});
  const basePower=rank?(TEAM_POWER_BASE[rank]||0):0;
  let blockBonus=0,nationalBonus=0;
  for(const item of seasonItems){
    const level=normalizeTournamentLevel(item),bonus=Math.min(200,Math.max(0,upperTournamentBonus(item)));
    if(level==="block")blockBonus=Math.max(blockBonus,bonus);
    if(level==="national")nationalBonus=Math.max(nationalBonus,bonus);
  }
  const upperTournamentPower=Math.min(200,Math.max(blockBonus,nationalBonus));
  const historicalRecordCount=history.details.reduce((sum,item)=>sum+Number(item.recordCount||0),0),hasHistoricalResults=historicalRecordCount>0;
  const total=Math.round((basePower+history.bonus+upperTournamentPower)*10)/10;
  const power=hasHistoricalResults?Math.min(TEAM_POWER_MAX,Math.max(0,total)):0;
  return {rank,currentRank,previousRank,prefecturePowerSource,prefecturePowerSeason,isPrefecturePowerProvisional:prefecturePowerSource==="previous",basePower,prefecturePower:basePower,prefectureStrengthBonus:0,prefectureStrengthIndex:null,blockBonus,nationalBonus,upperTournamentPower,historicalAchievementBonus:history.bonus,historicalAchievementRawBonus:history.rawBonus,historicalAchievementDetails:history.details,historicalRecordCount,hasHistoricalResults,power,maxPower:TEAM_POWER_MAX,calculationMethod:"current-prefecture-or-previous-fallback-700-plus-history-100-plus-upper-200-zero-without-history"};
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
