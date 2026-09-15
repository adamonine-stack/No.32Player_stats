import { normalizeTeamBaseNameForMatching, normalizeTeamNameForMatching } from './team-name-matching.js';

function categoryKey(value=''){const text=String(value||'').normalize('NFKC').toUpperCase();const match=text.match(/U[\s-]*1([345])/u);return match?`U1${match[1]}`:text}
function candidateNames(team={}){return [team.teamName,team.normalizedTeamName,...(Array.isArray(team.aliases)?team.aliases:[])].filter(Boolean)}
function importedNames(imported={}){return [imported.teamName,...(Array.isArray(imported.aliases)?imported.aliases:[])].filter(Boolean)}
function loose(name){return normalizeTeamNameForMatching(name).replace(/[^a-z0-9\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu,'')}
function levenshtein(a,b){if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;let previous=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const current=[i];for(let j=1;j<=b.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));previous=current}return previous[b.length]}
export function teamNameSimilarity(a,b,category='U15'){
  const na=normalizeTeamNameForMatching(a),nb=normalizeTeamNameForMatching(b);if(!na||!nb)return 0;if(na===nb)return 1;
  if(normalizeTeamBaseNameForMatching(a,category)===normalizeTeamBaseNameForMatching(b,category))return .98;
  const la=loose(a),lb=loose(b);if(!la||!lb)return 0;if(la===lb)return .97;
  if(Math.min(la.length,lb.length)>=5&&(la.includes(lb)||lb.includes(la)))return .9;
  return 1-levenshtein(la,lb)/Math.max(la.length,lb.length);
}
export function findSimilarHistoricalTeamCandidates(imported={},tournament={},teams=[],options={}){
  const threshold=Number(options.threshold??.82),wantedCategory=categoryKey(tournament.category),prefecture=tournament.prefecture||'';
  return teams.filter(existing=>{
    if(prefecture&&existing.prefecture&&existing.prefecture!==prefecture)return false;
    const existingCategory=categoryKey(existing.category||'');if(wantedCategory&&existingCategory&&wantedCategory!==existingCategory)return false;
    return true;
  }).map(existing=>{
    let score=0;for(const a of importedNames(imported))for(const b of candidateNames(existing))score=Math.max(score,teamNameSimilarity(a,b,tournament.category||'U15'));
    return {team:existing,score};
  }).filter(item=>item.score>=threshold).sort((a,b)=>b.score-a.score||String(a.team.teamName||'').localeCompare(String(b.team.teamName||''),'ja'));
}
function seasonKey(item={}){if(item.season)return String(item.season);const year=Number(item.year);return Number.isFinite(year)&&year>0?`${year}-${String((year+1)%100).padStart(2,'0')}`:''}
function tournamentNameKey(value=''){return normalizeTeamNameForMatching(value).replace(/(?:大阪府|男子|令和7年度|令和7年|2025年度|2025年)/gu,'').replace(/大会/gu,'')}
function compatibleValue(a,b,normalizer=value=>String(value||'')){const left=normalizer(a),right=normalizer(b);return !left||!right||left===right}
export function sameHistoricalTournament(a={},b={}){
  if(a.id&&b.id&&a.id===b.id)return true;
  const sameName=tournamentNameKey(a.name||a.tournamentName)===tournamentNameKey(b.name||b.tournamentName);
  const sameSeason=compatibleValue(seasonKey(a),seasonKey(b));
  const samePrefecture=compatibleValue(a.prefecture,b.prefecture);
  const sameGender=compatibleValue(a.gender,b.gender);
  const sameCategory=compatibleValue(a.category,b.category,categoryKey);
  const sourceA=a.source?.document||a.sourceDocument||'',sourceB=b.source?.document||b.sourceDocument||'',sameSource=sourceA&&sourceB&&tournamentNameKey(sourceA)===tournamentNameKey(sourceB);
  return Boolean((sameName||sameSource)&&sameSeason&&samePrefecture&&sameGender&&sameCategory);
}
export function findDuplicateHistoricalTournament(tournament={},existing=[]){return existing.find(item=>sameHistoricalTournament(tournament,item))||null}

function placementRankKey(item={}){
  const explicit=String(item.rank||item.placementRank||item.rankValue||item.seasonRank||'').toUpperCase();
  if(['S','A+','A'].includes(explicit))return explicit;
  const text=String(item.placementLabel||item.placement||'').normalize('NFKC').replace(/\s+/gu,'');
  if(text==='優勝'||/(^|[^準])優勝/u.test(text))return 'S';
  if(/準優勝|2位|第2位/u.test(text))return 'A+';
  if(/ベスト4|3位|第3位|4位|第4位|準決勝敗退/u.test(text))return 'A';
  return '';
}
function sameImportedTeam(imported={},team={},category='U15'){
  let score=0;
  for(const a of importedNames(imported))for(const b of candidateNames(team))score=Math.max(score,teamNameSimilarity(a,b,category));
  return score>=.95;
}
export function findDuplicateHistoricalResultSet(importedTeams=[],tournament={},teams=[]){
  const expected=importedTeams.filter(item=>['S','A+','A'].includes(placementRankKey(item)));
  if(expected.length<4)return null;
  const groups=new Map();
  for(const team of teams)for(const placement of Array.isArray(team.tournamentPlacements)?team.tournamentPlacements:[]){
    if(placement?.tournamentId===tournament.id)continue;
    if(!compatibleValue(seasonKey(placement),seasonKey(tournament)))continue;
    if(!compatibleValue(placement.prefecture,tournament.prefecture))continue;
    if(!compatibleValue(placement.category,tournament.category,categoryKey))continue;
    if(!compatibleValue(placement.gender,tournament.gender))continue;
    const identity=String(placement.tournamentId||'').trim()||tournamentNameKey(placement.tournamentName||placement.name||'');
    if(!identity)continue;
    const key=[identity,seasonKey(placement),String(placement.prefecture||''),categoryKey(placement.category||''),String(placement.gender||'')].join('|');
    const group=groups.get(key)||{key,tournamentId:placement.tournamentId||'',tournamentName:placement.tournamentName||placement.name||'',entries:[]};
    group.entries.push({team,placement});groups.set(key,group);
  }
  for(const group of groups.values()){
    let matched=0,champion=false,runnerUp=false;
    for(const imported of expected){
      const rank=placementRankKey(imported);
      const found=group.entries.find(entry=>placementRankKey(entry.placement)===rank&&sameImportedTeam(imported,entry.team,tournament.category||'U15'));
      if(found){matched++;if(rank==='S')champion=true;if(rank==='A+')runnerUp=true}
    }
    if(champion&&runnerUp&&matched===expected.length)return {...group,matched,expected:expected.length};
  }
  return null;
}
export function findExistingHistoricalPlacement(placements=[],tournament={}){return placements.find(item=>item?.tournamentId===tournament.id||sameHistoricalTournament({...tournament,name:tournament.name},{...item,name:item.tournamentName||item.name}))||null}
