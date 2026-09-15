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
export function findExistingHistoricalPlacement(placements=[],tournament={}){return placements.find(item=>item?.tournamentId===tournament.id||sameHistoricalTournament({...tournament,name:tournament.name},{...item,name:item.tournamentName||item.name}))||null}
