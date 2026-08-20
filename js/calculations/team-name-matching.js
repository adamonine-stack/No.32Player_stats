const CATEGORY_PATTERN=/u[\s\-‐‑‒–—―−ーｰ]*1([345])/giu;

export function normalizeTeamNameForMatching(name){
  return String(name??'').normalize('NFKC').trim().toLowerCase()
    .replace(CATEGORY_PATTERN,(_,digit)=>`u1${digit}`)
    .replace(/[\s\u3000]+/g,'');
}

export function categoryFromTeamName(name){
  const match=normalizeTeamNameForMatching(name).match(/u1([345])/u);
  return match?`U1${match[1]}`:null;
}

export function normalizeTeamBaseNameForMatching(name,category='U15'){
  const normalized=normalizeTeamNameForMatching(name);
  return category?normalized.replace(new RegExp(`${category.toLowerCase()}(?=$|[^0-9])`,'gu'),''):normalized;
}

function teamCategories(team={}){
  return new Set([team.category,...(Array.isArray(team.categories)?team.categories:[]),categoryFromTeamName(team.teamName)].filter(Boolean).map(value=>String(value).toUpperCase()));
}

function isEligibleCategory(team,category){
  const categories=teamCategories(team);
  return !categories.size||categories.has(category);
}

function uniqueCandidates(candidates){
  return [...new Map(candidates.map(team=>[team.id,team])).values()];
}

function candidateNames(team={}){return [team.teamName,team.normalizedTeamName,...(Array.isArray(team.aliases)?team.aliases:[])].filter(Boolean)}

export function findImportedTeamMatch(importedName,category,teams=[]){
  const normalizedName=normalizeTeamNameForMatching(importedName);
  const baseName=normalizeTeamBaseNameForMatching(importedName,category);
  const eligible=teams.filter(team=>isEligibleCategory(team,category));
  const exact=team=>candidateNames(team).some(name=>normalizeTeamNameForMatching(name)===normalizedName);
  const base=team=>candidateNames(team).some(name=>normalizeTeamBaseNameForMatching(name,category)===baseName);
  const exactCategory=eligible.filter(team=>teamCategories(team).has(category)&&exact(team));
  const exactUnspecified=eligible.filter(team=>!teamCategories(team).size&&exact(team));
  const baseCategory=eligible.filter(team=>teamCategories(team).has(category)&&base(team));
  const baseUnspecified=eligible.filter(team=>!teamCategories(team).size&&base(team));
  const levels=[['EXACT_MATCH',exactCategory],['NORMALIZED_MATCH',exactUnspecified],['U15_BASE_NAME_MATCH',baseCategory],['U15_BASE_NAME_MATCH',baseUnspecified]];
  for(const [result,raw] of levels){const candidates=uniqueCandidates(raw);if(candidates.length===1)return {result,team:candidates[0],candidates};if(candidates.length>1)return {result:'AMBIGUOUS',team:null,candidates}}
  return {result:'NEW_TEAM',team:null,candidates:[]};
}

export function normalizeTournamentNameForMatching(name){return normalizeTeamNameForMatching(name)}
