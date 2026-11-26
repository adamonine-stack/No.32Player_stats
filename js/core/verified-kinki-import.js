import { db, collection, doc, getDocs, setDoc, serverTimestamp } from './firebase.js';
import { calculateSeasonalTeamRank, isValidTournamentAchievement } from '../calculations/opponent-team-calculations.js';
import { normalizeTeamNameForMatching } from '../calculations/team-name-matching.js';
import { findSimilarHistoricalTeamCandidates, findDuplicateHistoricalTournament, findExistingHistoricalPlacement } from '../calculations/historical-import-calculations.js';
import { VERIFIED_2026_KINKI_RESULT_EVENTS } from '../data/2026-kinki-jwc-soutai-results-men.js?v=20261126-kyoto-final-v2';
import { JWC_2026_ALL_TEAM_SUPPLEMENTS, HYOGO_2026_JWC_FINAL_ROWS, WAKAYAMA_2026_JWC_FINAL_ROWS } from '../data/2026-kinki-jwc-all-teams-men.js?v=20261126-wakayama-final-v1';
import { TOURNAMENT_2026_CBG_HYOGO_MEN, TEAMS_2026_CBG_HYOGO_MEN } from '../data/2026-cbg-hyogo-men.js';
import { TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN, TEAMS_2026_HYOGO_JHS_SOUTAI_MEN } from '../data/2026-hyogo-history-men.js';
import { TOURNAMENT_2026_KYOTO_JHS_SOUTAI_MEN, TEAMS_2026_KYOTO_JHS_SOUTAI_MEN } from '../data/2025-2026-kyoto-history-men.js';
import { TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN, TEAMS_2026_SHIGA_JHS_SOUTAI_MEN } from '../data/2025-2026-shiga-history-men.js';
import { TOURNAMENT_2026_NARA_JHS_SOUTAI_MEN, TEAMS_2026_NARA_JHS_SOUTAI_MEN } from '../data/2025-2026-nara-history-men.js';
import { TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN, TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN } from '../data/2025-2026-wakayama-history-men.js';

// Never infer unverified results. Kyoto 2026 JWC finished Nov 22; official Term1–3 results cover all 39 men's teams.
export const KINKI_2026_EVENTS=[
  ...VERIFIED_2026_KINKI_RESULT_EVENTS.map(event=>event.tournament.id==='2026-hyogo-jwc-qualifier-men'?{tournament:{...event.tournament,resultScope:'公式最終トーナメント77枠（棄権2枠含む）'},teams:HYOGO_2026_JWC_FINAL_ROWS}:event.tournament.id==='2026-wakayama-jwc-qualifier-men'?{tournament:{...event.tournament,resultScope:'公式最終トーナメント男子17チーム・16試合'},teams:WAKAYAMA_2026_JWC_FINAL_ROWS}:{...event,teams:[...event.teams,...(JWC_2026_ALL_TEAM_SUPPLEMENTS[event.tournament.id]||[])]}),
  {tournament:{...TOURNAMENT_2026_CBG_HYOGO_MEN,isOfficialGame:true},teams:TEAMS_2026_CBG_HYOGO_MEN},
  {tournament:TOURNAMENT_2026_HYOGO_JHS_SOUTAI_MEN,teams:TEAMS_2026_HYOGO_JHS_SOUTAI_MEN},
  {tournament:TOURNAMENT_2026_KYOTO_JHS_SOUTAI_MEN,teams:TEAMS_2026_KYOTO_JHS_SOUTAI_MEN},
  {tournament:TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN,teams:TEAMS_2026_SHIGA_JHS_SOUTAI_MEN},
  {tournament:TOURNAMENT_2026_NARA_JHS_SOUTAI_MEN,teams:TEAMS_2026_NARA_JHS_SOUTAI_MEN},
  {tournament:TOURNAMENT_2026_WAKAYAMA_JHS_SOUTAI_MEN,teams:TEAMS_2026_WAKAYAMA_JHS_SOUTAI_MEN}
];

const category=value=>String(value||'').normalize('NFKC').toUpperCase().replace(/\s/g,'').replace(/男子|女子/g,'').replace(/U-15/,'U15');
function teamPref(row,event){return row.prefecture||event.tournament.prefecture}
function identity(row,team){
  const names=[row.teamName,...(row.aliases||[])].filter(Boolean).map(normalizeTeamNameForMatching);
  const existing=[team.teamName,team.normalizedTeamName,...(Array.isArray(team.aliases)?team.aliases:[])].filter(Boolean).map(normalizeTeamNameForMatching);
  return names.some(name=>existing.includes(name));
}
function eligible(team,row,event){
  if(team.prefecture&&team.prefecture!==teamPref(row,event))return false;
  if(team.gender&&team.gender!=='男子')return false;
  if(/女子/u.test(String(team.category||'')))return false;
  const expectedCategory=String(row.ageGroup||'U15').toUpperCase();
  const existingCategory=category(team.category);
  const declaredAge=String(team.ageGroup||'').toUpperCase();
  // Older records sometimes label a U14 side as category U15 because it entered a U15 competition.
  // Trust a specific ageGroup over that broad competition category.
  if(!declaredAge&&existingCategory&&(/U1[345]/.test(existingCategory))&&!existingCategory.includes(expectedCategory))return false;
  const wanted=String(row.ageGroup||'U15').toUpperCase();
  const existingAge=String(team.ageGroup||'').toUpperCase();
  if(existingAge&&/^U1[345]$/.test(existingAge)&&existingAge!==wanted)return false;
  // U14 or second-string entries must remain independent from the U15 first team.
  const rowName=String(row.teamName||'').normalize('NFKC').toUpperCase();
  const teamName=String(team.teamName||'').normalize('NFKC').toUpperCase();
  if(/U14/.test(rowName)!==/U14/.test(teamName)&&(/U14/.test(rowName)||/U14/.test(teamName)))return false;
  return true;
}
function candidates(row,event,teams){
  const scoped=teams.filter(team=>eligible(team,row,event));
  const compatibleType=team=>!team.teamType||!row.teamType||team.teamType===row.teamType;
  const exact=scoped.filter(team=>identity(row,team)&&compatibleType(team));
  const similar=findSimilarHistoricalTeamCandidates(row,{...event.tournament,prefecture:teamPref(row,event)},scoped).filter(item=>!exact.some(team=>team.id===item.team.id));
  return {exact,similar};
}
function choose(row,event,teams,selection=''){
  if(selection==='__NEW__')return {team:null,ambiguous:false};
  if(selection){const team=teams.find(team=>team.id===selection);if(!team||!eligible(team,row,event))throw Error('選択した既存チームが無効です: '+row.teamName);return {team,ambiguous:false}}
  const found=candidates(row,event,teams);
  if(found.exact.length===1)return {team:found.exact[0],ambiguous:false};
  if(found.exact.length||found.similar.length)return {team:null,ambiguous:true};
  return {team:null,ambiguous:false};
}
export async function planKinki2026Results(events=KINKI_2026_EVENTS){
  const [teamSnapshot,tournamentSnapshot]=await Promise.all([getDocs(collection(db,'opponentTeams')),getDocs(collection(db,'tournaments'))]);
  const teams=teamSnapshot.docs.map(d=>({id:d.id,...d.data()})),registered=tournamentSnapshot.docs.map(d=>({id:d.id,...d.data()}));
  const reviews=[],rows=[],eventSummary=[];
  for(const event of events){
    const registeredTournament=findDuplicateHistoricalTournament(event.tournament,registered);
    let changed=0,already=0;
    for(let index=0;index<event.teams.length;index++){
      const imported=event.teams[index],found=candidates(imported,event,teams);
      const selected=found.exact.length===1?found.exact[0]:null;
      const duplicate=selected&&findExistingHistoricalPlacement(selected.tournamentPlacements||[],registeredTournament||event.tournament);
      const record={key:event.tournament.id+':'+index,eventId:event.tournament.id,index,teamName:imported.teamName,placementLabel:imported.placementLabel,selectedId:selected?.id||'',duplicate:Boolean(duplicate),candidates:[...found.exact,...found.similar.map(item=>item.team)].map(team=>({id:team.id,teamName:team.teamName,prefecture:team.prefecture||''}))};
      rows.push(record);if(!duplicate || duplicate.placementLabel!==imported.placementLabel || duplicate.resultConfirmed!==true || duplicate.bracketSeed!==imported.bracketSeed)changed++;else already++;
      if(!selected&&(record.candidates.length>0||found.exact.length>1))reviews.push(record);
    }
    eventSummary.push({id:event.tournament.id,name:event.tournament.shortName||event.tournament.name,total:event.teams.length,changed,already,registered:Boolean(registeredTournament)});
  }
  return {teams,registered,rows,reviews,eventSummary};
}

export async function applyKinki2026Results(plan,decisions={},progress=()=>{},events=KINKI_2026_EVENTS,{skipAmbiguous=false}={}){
  const workingTeams=[...plan.teams],registered=[...plan.registered],reused=new Set();
  const stats={newTeams:0,updatedTeams:0,newPlacements:0,updatedPlacements:0,unchanged:0,tournaments:0,skipped:[]};
  let done=0;const total=events.reduce((s,event)=>s+event.teams.length,0);
  for(const event of events){
    const tournament=event.tournament;
    if(tournament.resultConfirmed!==true||tournament.resultStatus&&tournament.resultStatus!=='completed')continue;
    const existingTournament=findDuplicateHistoricalTournament(tournament,registered);
    const id=existingTournament?.id||tournament.id;
    if(!existingTournament){
      await setDoc(doc(db,'tournaments',id),{...tournament,seasonId:'season_2026_27',isOfficialGame:true,officialMatchClassification:'official',updatedAt:serverTimestamp(),createdAt:serverTimestamp()});
      registered.push({...tournament,id,isOfficialGame:true});stats.tournaments++;
    }else if(tournament.id==='2026-kyoto-jwc-qualifier-men'&&existingTournament.resultScope!==tournament.resultScope){
      const resultPatch={resultScope:tournament.resultScope,placementMethod:tournament.placementMethod,resultConfirmed:true,resultStatus:'completed',source:tournament.source,isOfficialGame:true,officialMatchClassification:'official',updatedAt:serverTimestamp()};
      await setDoc(doc(db,'tournaments',id),resultPatch,{merge:true});
      Object.assign(existingTournament,resultPatch);
    }else if(existingTournament.isOfficialGame!==true){
      await setDoc(doc(db,'tournaments',id),{isOfficialGame:true,officialMatchClassification:'official',updatedAt:serverTimestamp()},{merge:true});
      existingTournament.isOfficialGame=true;
    }
    const usedTeamIds=new Set();
    for(let index=0;index<event.teams.length;index++){
      const row=event.teams[index],key=tournament.id+':'+index,decision=decisions[key]||'';
      const selection=choose(row,event,workingTeams,decision);
      if(selection.ambiguous || (selection.team && usedTeamIds.has(selection.team.id))){if(skipAmbiguous){stats.skipped.push(row.teamName);done++;progress(done,total);continue;}throw Error('チーム名の照合確認が必要です: '+row.teamName);}
      const selected=selection.team,created=!selected;
      const baseId='2026-kinki-result-'+tournament.id+'-'+encodeURIComponent(normalizeTeamNameForMatching(row.teamName));
      let teamId=selected?.id||baseId;let suffix=1;while(!selected&&workingTeams.some(t=>t.id===teamId))teamId=baseId+'-'+(++suffix);
      usedTeamIds.add(teamId);
      const current=selected?.tournamentPlacements||[];
      const placementTournament={...tournament,id};
      const old=findExistingHistoricalPlacement(current,placementTournament);
      const source=tournament.source||null;
      const finalVerified=row.resultConfirmed!==false&&row.placementConfirmed!==false;
      const rank=finalVerified?(String(row.rank||'').toUpperCase()||null):null;
      const placement={
        id:old?.id||teamId+'-'+id,tournamentId:id,tournamentName:existingTournament?.name||tournament.name,
        year:2026,season:'2026-27',seasonId:'season_2026_27',generation:'2026-27',category:tournament.category,
        prefecture:teamPref(row,event),gender:'男子',tournamentLevel:tournament.tournamentLevel||'prefecture',
        tournamentType:tournament.type,placement:row.placementLabel,placementLabel:row.placementLabel,
        placementRank:rank,seasonRank:rank,rankValue:rank,
        teamPowerEligible:finalVerified&&tournament.teamPowerEligible!==false&&row.teamPowerEligible!==false,
        source,sourceType:row.sourceType||tournament.sourceType||'verifiedResult',
        bracketSeed:row.bracketSeed??null,sourceUrl:row.sourceUrl||null,
        placementConfirmed:finalVerified,resultConfirmed:finalVerified,
        isOfficialGame:true,officialMatchClassification:'official',
        updatedAt:new Date().toISOString(),createdAt:old?.createdAt||new Date().toISOString(),
        sortOrder:old?.sortOrder??current.length
      };
      // A bracket entry without a verified final placement must never overwrite an already confirmed result.
      if(old && !finalVerified && isValidTournamentAchievement(old) && old.placementConfirmed!==false){
        stats.unchanged++;done++;progress(done,total);continue;
      }
      if(old&&old.placementLabel===placement.placementLabel&&old.tournamentId===id&&old.resultConfirmed===finalVerified&&old.bracketSeed===placement.bracketSeed&&old.placementConfirmed===finalVerified&&old.teamPowerEligible===placement.teamPowerEligible&&old.isOfficialGame===true&&String(old.placementRank||old.rankValue||'')===String(rank||'')){stats.unchanged++;done++;progress(done,total);continue}
      const placements=old?current.map(p=>p===old?{...p,...placement}:p):[...current,placement];
      const ranks=calculateSeasonalTeamRank(placements,{currentSeason:'2026-27'});
      const teamName=selected?.teamName||row.teamName;
      const teamData={
        teamName,normalizedTeamName:normalizeTeamNameForMatching(teamName),
        prefecture:teamPref(row,event),region:teamPref(row,event),gender:'男子',
        category:selected?.category||(row.ageGroup==='U14'?'U14男子':'U15男子'),ageGroup:selected?.ageGroup||row.ageGroup||'U15',
        teamType:selected?.teamType||row.teamType||'クラブチーム',
        aliases:[...new Set([...(selected?.aliases||[]),row.teamName,...(row.aliases||[])])],
        tournamentPlacements:placements,seasonRanks:ranks.seasonRanks,
        overallRank:ranks.overallRank,overallRankScore:ranks.overallScore,
        overallRankStatus:ranks.overallRankStatus,calculatedRank:ranks.rank,calculatedRankScore:ranks.score,
        rankCalculatedAt:serverTimestamp(),updatedAt:serverTimestamp()
      };
      if(created){teamData.createdAt=serverTimestamp();stats.newTeams++}else{reused.add(teamId)}
      if(old)stats.updatedPlacements++;else stats.newPlacements++;
      await setDoc(doc(db,'opponentTeams',teamId),teamData,{merge:true});
      const updated={...selected,...teamData,id:teamId};
      const position=workingTeams.findIndex(team=>team.id===teamId);
      if(position<0)workingTeams.push(updated);else workingTeams[position]=updated;
      done++;progress(done,total);
    }
  }
  stats.updatedTeams=reused.size;
  return stats;
}
