function same(a,b){return JSON.stringify(a??null)===JSON.stringify(b??null)}
function participationPlayerIds(game={}){
  const ids=new Set();
  for(const quarter of Object.values(game.quarterParticipation||{})){
    for(const id of quarter?.starters||[])if(id)ids.add(id);
    for(const sub of quarter?.substitutions||[]){
      if(sub?.playerOutId)ids.add(sub.playerOutId);
      if(sub?.playerInId)ids.add(sub.playerInId);
    }
  }
  return ids;
}
const SUMMARY_GAME_FIELDS=['date','seasonId','quarters','quarterCount','statsRegistrationType','registrationType','quarterDurationSeconds','quarterDurationMinutes','participationMode'];
export function planHomeSummaryRefresh(previousGames=[],nextGames=[]){
  const previous=new Map(previousGames.map(game=>[game.id,game])),next=new Map(nextGames.map(game=>[game.id,game]));
  const playerIds=new Set();let all=false;
  for(const id of new Set([...previous.keys(),...next.keys()])){
    const before=previous.get(id),after=next.get(id);
    if(!before||!after){all=true;continue}
    if(SUMMARY_GAME_FIELDS.some(field=>!same(before?.[field],after?.[field]))){all=true;continue}
    if(!same(before.quarterParticipation,after.quarterParticipation)){
      for(const playerId of participationPlayerIds(before))playerIds.add(playerId);
      for(const playerId of participationPlayerIds(after))playerIds.add(playerId);
    }
  }
  return {all,playerIds:[...playerIds].sort()};
}
