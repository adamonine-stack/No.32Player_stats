const values=(...items)=>[...new Set(items.flat().filter(value=>value!==undefined&&value!==null&&value!==''))];
const placementKey=item=>item.tournamentId||`${item.season||item.year||''}:${item.competitionName||item.tournamentName||''}`;

export function mergeOpponentTeamRecords(target,source){
  const placements=[],seen=new Set();
  for(const item of [...(target.tournamentPlacements||[]),...(source.tournamentPlacements||[])]){const key=placementKey(item);if(!seen.has(key)){seen.add(key);placements.push(item)}}
  return {...target,playerNumbers:values(target.playerNumbers||[],source.playerNumbers||[]),aliases:values(target.aliases||[],source.aliases||[],source.teamName),categories:values(target.categories||[],source.categories||[],target.category,source.category),years:values(target.years||[],source.years||[],target.year,source.year),tournamentPlacements:placements};
}

export function opponentReferencePatch(record,source,target){
  const patch={};
  for(const field of ['opponentTeamId','teamAId','teamBId','winnerTeamId','loserTeamId'])if(record[field]===source.id)patch[field]=target.id;
  const names=[source.teamName,...(source.aliases||[])].map(value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase('ja'));
  for(const field of ['opponent','opponentTeamName','teamA','teamB','winner','loser'])if(names.includes(String(record[field]||'').normalize('NFKC').trim().toLocaleLowerCase('ja')))patch[field]=target.teamName;
  return patch;
}
