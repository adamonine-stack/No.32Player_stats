import { loadNormalStats,assertNormalStatsOnline } from './core/normal-stats-store.js?v=20260908-quarter-session-v2';
import { LOAD_ERROR,CONFLICT_ERROR,assertStatsBaseline } from './core/normal-stats-guard.js';
import { createHistoryOverlay, projectLocalHistory, receiveHistoryDocuments, restoreLocalHistory } from './core/local-history.js?v=20260908-quarter-session-v2';
import { assistCandidates, isAssistEvent, isMadeEvent, nearbyMadeShots, planAssistMutation } from './calculations/assist-play-calculations.js?v=20260908-quarter-session-v2';
import { commitAssistMutation } from './core/assist-play-store.js?v=20260908-quarter-session-v2';
import { commitQuickStatMutation, commitQuickFreeThrowMutation } from './core/quick-history-store.js?v=20260908-quarter-session-v2';
import { initializeOfflineSync, installOfflineSyncListeners, submitOfflineCapable, synchronizeOfflineOperations, confirmQuarterSession, confirmAllPendingSessions, quarterSessionStatus } from './core/offline-sync.js?v=20260912-bulk-sync-v1';
import { auth, db, firestorePersistenceReady, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "./core/firebase.js?v=20260901-scoped-reads-v1";
import { createListenerRegistry } from './data/listener-registry.js?v=20260901-scoped-reads-v1';
import { auditR32Data } from './diagnostics/data-integrity.js?v=20260901-scoped-reads-v1';
import { buildPlayerSeasonSummary, comparePlayerSeasonSummary, playerSeasonSummaryId } from './calculations/player-season-summary.js?v=20260901-home-summary-v1';
import { state } from "./core/state.js";
import { setGameSortDirection, setLastPlayerId, setSelectedSeasonId } from "./core/storage.js";
import { num, pct, one, sumStats as sumStatsBase, derived, STAT_KEYS, getGameStatsRegistrationType, quarterKey, registeredQuarterNumbers, statHasRegisteredData } from "./calculations/stats-calculations.js";
import { buildGameHistory, groupGameHistory, historyActionOrderOverrides, createPlayEvent, historyInsertionOverrides, reconcileStatEvents } from "./calculations/game-event-calculations.js?v=20260908-quarter-session-v2";
import { nextHistorySequence, prepareHistoryOperation } from "./calculations/history-order.js?v=20260908-quarter-session-v2";
import { changedOptimisticEventIds, rollbackOptimisticEvents, rollbackOptimisticStats } from "./calculations/optimistic-rollback.js?v=20260902-history-safety-v1";
import { resultMark, resultText, resultWord, resultClass, gameRecord, dateRange, finalScoreFromQuarterScores, quarterScoreKey, hasQuarterScoreData, hasShotPointData, registrationChoiceVisibility } from "./calculations/game-calculations.js";
import { selectedTeamQuarterStatus, teamGamePeriods, teamRegisteredQuarterNumbers, teamStatsForView } from "./calculations/team-game-period-calculations.js";
import { filterGamesByDate, filterGamesByMonth } from "./calculations/analysis-calculations.js";
import { OPPONENT_RANKS, calculateOpponentTeamRank, calculateSeasonalTeamRank, placementSeason, placementLabelToRank, sortPlayerNumbers } from "./calculations/opponent-team-calculations.js";
import { DEFAULT_SEASON_ID, ALL_SEASONS_ID, DEFAULT_SEASONS, effectiveSeasonId, migrationSeasonIdForGame, filterBySeason, normalizeSeason, previousSeasonId, carryPlayerSeason, playerForSeason, rankForGame, seasonIdForLabel, seasonLabelForId } from "./calculations/season-calculations.js";
import { mergeOpponentTeamRecords, opponentReferencePatch } from "./calculations/opponent-team-merge-calculations.js";
import { getGameDateKey, getDatesWithRegisteredGames, calendarMonthFor, moveCalendarMonth, buildCalendarDays } from "./calculations/calendar-calculations.js";
import { getPlayerTargetQuarterCount } from "./calculations/player-quarter-calculations.js";
import { DEFAULT_QUARTER_DURATION_MINUTES, averagePlayerPlayingTime, createTemporaryPlayer, currentPlayersAt, formatClock, formatCompactRemainingTime, gamePlayingTime, parseCompactRemainingTime, participationRequired, playerPlayingTime, quarterDurationSeconds, quarterParticipation, sortSubstitutions, validateQuarterParticipation } from "./calculations/participation-calculations.js?v=20260824-compact-sub-time-v3";
import { ALL_FILTER_VALUE, UNSET_FILTER_VALUE, opponentRankForGame, getOpponentCategoryOptions, getOpponentRankOptions, filterByOpponentFilterRange, filterByRegisteredGameCategory, filterByAggregationCondition } from "./calculations/game-filter-calculations.js";
import { detailStatsActionBar, selectedStatsDeleteTarget, renderDetailAtTop, saveStatsAndReturnToTop } from "./ui/detail-stats-actions.js";
import { SHOT_AREAS, SHOT_TYPES, SHOT_AREA_ORDER, SHOT_TYPE_ORDER, SHOT_COURT_SIZE, allowedShotTypes, createShot, shotTotals, shotReceivedFoulCount, detailedShotTotals, collectShots, filterShots, aggregateShots, legacyShotSlots, isLegacyShotBreakdownTarget, createLegacyBreakdownShots, detectShotArea, shotAreaForRecord, normalizedShotType, normalizeShot, countsAsFieldGoalAttempt, shotSequence } from "./calculations/shot-calculations.js?v=20260822-foul-stats-v2";
import { SHOT_ANALYSIS_AREA_SHORTCUTS, filterShotsBySelections, shotAnalysisAreaIds } from "./calculations/shot-analysis-calculations.js?v=20260830-court-filter-v2";
import { TOURNAMENT_2026_HYOGO_U15_MEN, TEAMS_2026_HYOGO_U15_MEN, normalizeImportedTeamName } from "./data/2026-hyogo-u15-men.js";
import { TOURNAMENT_2026_OSAKA_U15_MEN, TEAMS_2026_OSAKA_U15_MEN, MATCHES_2026_OSAKA_U15_MEN } from "./data/2026-osaka-u15-men.js";
import { TOURNAMENT_2026_OKAYAMA_U15_MEN, TEAMS_2026_OKAYAMA_U15_MEN } from "./data/2026-okayama-u15-men.js";
import { TOURNAMENT_2026_NARA_U15_MEN, TEAMS_2026_NARA_U15_MEN, MATCHES_2026_NARA_U15_MEN } from "./data/2026-nara-u15-men.js";
import { TOURNAMENT_2025_HYOGO_JR_WINTER_MEN, TEAMS_2025_HYOGO_JR_WINTER_MEN, HYOGO_OPPONENT_TEAM_MERGES, HYOGO_IMPORT_CANONICAL_NAMES } from "./data/2025-hyogo-jr-winter-men.js?v=20260819-u14-merge-v1";
import { TOURNAMENT_2025_CBG_HYOGO_MEN, TEAMS_2025_CBG_HYOGO_MEN, MATCHES_2025_CBG_HYOGO_MEN, CBG_CANONICAL_NAMES, normalizeCbgTeamIdentity } from "./data/2025-cbg-hyogo-men.js?v=20260819-v2";
import { TOURNAMENT_2026_WAKAYAMA_U15_MEN, TEAMS_2026_WAKAYAMA_U15_MEN, MATCHES_2026_WAKAYAMA_U15_MEN } from "./data/2026-wakayama-u15-men.js";
import { TOURNAMENT_2026_SHIGA_U15_MEN, TEAMS_2026_SHIGA_U15_MEN, MATCHES_2026_SHIGA_U15_MEN } from "./data/2026-shiga-u15-men.js";
import { TOURNAMENT_2026_KYOTO_U15_MEN, TEAMS_2026_KYOTO_U15_MEN, MATCHES_2026_KYOTO_U15_MEN } from "./data/2026-kyoto-u15-men.js";
import { TOURNAMENT_2025_OSAKA_JR_WINTER_CUP_MEN, TEAMS_2025_OSAKA_JR_WINTER_CUP_MEN, OSAKA_2025_DUPLICATE_TEAM_MERGES } from "./data/2025-osaka-jr-winter-cup-men.js";
import { findImportedTeamMatch, normalizeTeamNameForMatching, normalizeTournamentNameForMatching } from "./calculations/team-name-matching.js";
const quickInputStyles=document.createElement('link');quickInputStyles.rel='stylesheet';quickInputStyles.href='./styles/quick-input.css?v=20260908-quarter-session-v1';document.head.appendChild(quickInputStyles);
if('serviceWorker' in navigator && !location.pathname.includes('/tests/'))navigator.serviceWorker.register('./service-worker.js?v=20260908-quarter-session-v2').catch(error=>console.warn('Service worker registration failed',error));
installOfflineSyncListeners();
const nav=[['home','ホーム'],['players','選手'],['opponentTeams','対戦チーム'],['games','試合'],['stats','分析'],['team','チーム'],['settings','設定']];
const navIcons={home:'home',players:'person',opponentTeams:'shield',games:'edit_note',stats:'bar_chart',team:'groups',settings:'settings'};
const $=s=>document.querySelector(s); const uid=()=>crypto.randomUUID();
const PLAYER_CATEGORIES=['U15','U14','U13','その他'];
const PLAYER_CATEGORY_RANK={U15:1,U14:2,U13:3,'その他':4};
function playerCategory(p={}){const c=p?.category||p?.grade||'その他';return PLAYER_CATEGORIES.includes(c)?c:'その他'}
function playerNumberValue(value){const m=String(value??'').match(/\d+/);return m?Number(m[0]):999999}
function sortPlayersByCategoryAndNumber(players=[]){return [...players].sort((a,b)=>(PLAYER_CATEGORY_RANK[playerCategory(a)]??4)-(PLAYER_CATEGORY_RANK[playerCategory(b)]??4)||playerNumberValue(a.number)-playerNumberValue(b.number)||String(a.name||'').localeCompare(String(b.name||''),'ja'))}
function sortOpponentTeamsForSelect(teams=[]){const alpha=new Intl.Collator('en',{numeric:true,sensitivity:'base'}),japanese=new Intl.Collator('ja',{numeric:true,sensitivity:'base'}),group=name=>/^[A-Za-z0-9]/.test(String(name||'').normalize('NFKC').trim())?0:1;return [...teams].sort((a,b)=>{const aName=String(a.teamName||''),bName=String(b.teamName||''),difference=group(aName)-group(bName);return difference||(group(aName)===0?alpha:japanese).compare(aName,bName)})}
function normalizeGameDate(value=''){const s=String(value||'').trim();const jp=s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);if(jp)return `${jp[1]}-${jp[2].padStart(2,'0')}-${jp[3].padStart(2,'0')}`;const m=s.replaceAll('/','-').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:s}
function sameDateOrderValue(g={}){const same=Number(g.sameDateOrder);if(Number.isFinite(same))return same;const old=Number(g.sortOrder);return Number.isFinite(old)?old:Number.MAX_SAFE_INTEGER}
function createdOrderValue(g={}){if(g.createdAt?.seconds)return Number(g.createdAt.seconds);const t=Date.parse(g.createdAt||g.updatedAt||'');return Number.isFinite(t)?t:0}
function sortGamesByDateAndSameDateOrder(games=[],direction=state.gameSortDirection){const dateDirection=direction==='asc'?1:-1;return [...games].sort((a,b)=>{const da=normalizeGameDate(a.date||a.gameDate),db=normalizeGameDate(b.date||b.gameDate);if(da!==db)return da>db?dateDirection:-dateDirection;const oa=sameDateOrderValue(a),ob=sameDateOrderValue(b);if(oa!==ob)return oa-ob;const ca=createdOrderValue(a),cb=createdOrderValue(b);if(ca!==cb)return ca-cb;return String(a.id||'').localeCompare(String(b.id||''))})}
function selectedSeason(){return state.seasons.find(item=>item.id===state.selectedSeasonId)||state.seasons.find(item=>item.id===state.activeSeasonId)||normalizeSeason(DEFAULT_SEASONS[1])}
function refreshSeasonScope(){state.games=sortGamesByDateAndSameDateOrder(filterBySeason(state.allGames,state.selectedSeasonId,DEFAULT_SEASON_ID));const memberships=new Map(state.playerSeasons.filter(item=>item.seasonId===state.selectedSeasonId).map(item=>[item.playerId,item]));state.players=sortPlayersByCategoryAndNumber(state.allPlayers.map(item=>playerForSeason(item,memberships.get(item.id))).filter(item=>item.active!==false));if(!state.players.some(item=>item.id===state.lastPlayerId))state.lastPlayerId=state.players[0]?.id||''}
function seasonOptions(includeAll=false){const options=[...state.seasons].sort((a,b)=>b.sortOrder-a.sortOrder).map(item=>`<option value="${item.id}" ${item.id===state.selectedSeasonId?'selected':''}>${escapeHtml(item.name)}${item.id===state.activeSeasonId?'　現在':''}</option>`).join('');return `${includeAll?`<option value="${ALL_SEASONS_ID}" ${state.selectedSeasonId===ALL_SEASONS_ID?'selected':''}>全世代</option>`:''}${options}`}
function seasonSwitcher(){const season=selectedSeason(),past=state.selectedSeasonId!==state.activeSeasonId&&state.selectedSeasonId!==ALL_SEASONS_ID;return `<div class="season-switcher ${past?'past':''}"><label><span>世代：</span><select id="globalSeasonSelect">${seasonOptions(true)}</select></label>${past?`<small>過去世代：${escapeHtml(season.name)}</small>`:''}</div>`}
function bindSeasonSwitcher(){const select=$('#globalSeasonSelect');if(select)select.onchange=event=>{state.selectedSeasonId=event.target.value;setSelectedSeasonId(state.selectedSeasonId);state.targetId='';state.teamTargetId='';state.analysisReturn=null;state.teamReturn=null;ensureSeasonSync();refreshSeasonScope();render()}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function activateNavigationTab(tab){if(tab==='opponentTeams'&&state.tab==='opponentTeams'){window.scrollTo({top:0,behavior:'smooth'});return}if(tab==='opponentTeams'){state.selectedOpponentTeamId='';state.opponentTeamListReturnPosition=null}state.tab=tab;if(['opponentTeams','games','stats','team'].includes(tab))ensureOpponentTeamsSync();ensureDataForView();render();if(tab==='opponentTeams')requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}))}
function navRender(){for(const id of ['pcNav','mobileNav']){const n=$('#'+id);n.innerHTML=nav.map(([k,v])=>`<button class="${state.tab===k?'active':''}" data-tab="${k}"><span class="material-symbols-outlined">${navIcons[k]}</span><span>${v}</span></button>`).join('');n.querySelectorAll('button').forEach(b=>b.onclick=()=>activateNavigationTab(b.dataset.tab))}}
const firestoreListeners=createListenerRegistry(),statsSources=new Map(),statsSignatures=new Map(),statsInitialKeys=new Set(),pendingSummaryPlayers=new Set();let serverGames=[];let subscribedSeasonId='',statsSeasonId='',homeSummaryKey='',summaryRefreshTimer=null,gamesSnapshotReady=false;const desiredStatsKeys=new Set();
function scopedCollection(name,seasonId){return seasonId===ALL_SEASONS_ID?collection(db,name):query(collection(db,name),where('seasonId','==',seasonId))}
function statBucket(id){let hash=0;for(const char of String(id))hash=(hash*31+char.charCodeAt(0))>>>0;return hash%16}
function statsReady(){return desiredStatsKeys.size>0&&[...desiredStatsKeys].every(key=>statsSources.has(key))}
function summarySeasons(){return state.selectedSeasonId===ALL_SEASONS_ID?state.seasons.map(season=>season.id):[state.selectedSeasonId||state.activeSeasonId||DEFAULT_SEASON_ID]}
async function writeHomeSummary(playerId,seasonId){const summary=buildPlayerSeasonSummary({seasonId,playerId,games:serverGames,stats:[...new Map([...statsSources.values()].flat().map(item=>[item.id,item])).values()]});await setDoc(doc(db,'playerSeasonSummaries',playerSeasonSummaryId(seasonId,playerId)),{...summary,updatedAt:serverTimestamp()})}
function queueHomeSummaryRefresh(playerIds=state.players.map(player=>player.id)){if(!state.user||!statsReady())return;for(const id of playerIds)if(id)pendingSummaryPlayers.add(id);clearTimeout(summaryRefreshTimer);summaryRefreshTimer=setTimeout(async()=>{const ids=[...pendingSummaryPlayers];pendingSummaryPlayers.clear();try{for(const seasonId of summarySeasons())for(const playerId of ids)await writeHomeSummary(playerId,seasonId)}catch(error){console.error('Home summary refresh failed',error)}},350)}
function rebuildStats(){state.stats=receiveHistoryDocuments('stats',[...new Map([...statsSources.values()].flat().map(item=>[item.id,item])).values()]);refreshSeasonScope();refreshLatestLocalHistory();render()}
function ensureStatsSync(gameIds,seasonId){if(statsSeasonId!==seasonId){for(const key of firestoreListeners.keys().filter(key=>key.startsWith('stats:')))firestoreListeners.remove(key);statsSources.clear();statsSignatures.clear();statsInitialKeys.clear();statsSeasonId=seasonId;state.stats=[]}const groups=new Map();for(const id of gameIds){const bucket=statBucket(id);if(!groups.has(bucket))groups.set(bucket,[]);groups.get(bucket).push(id)}const desired=new Set();for(const [bucket,ids] of groups){ids.sort();for(let offset=0;offset<ids.length;offset+=30){const part=ids.slice(offset,offset+30),key=`stats:${bucket}:${offset/30}`,signature=part.join('|');desired.add(key);if(statsSignatures.get(key)===signature)continue;firestoreListeners.remove(key);statsSources.delete(key);statsInitialKeys.delete(key);statsSignatures.set(key,signature);firestoreListeners.set(key,()=>onSnapshot(query(collection(db,'stats'),where('gameId','in',part)),s=>{const initial=!statsInitialKeys.has(key),changed=initial?[]:s.docChanges().map(change=>change.doc.data().playerId).filter(Boolean);statsInitialKeys.add(key);statsSources.set(key,s.docs.map(d=>({id:d.id,...d.data()})));rebuildStats();if(changed.length)queueHomeSummaryRefresh(changed)}))}}for(const key of firestoreListeners.keys().filter(key=>key.startsWith('stats:')&&!desired.has(key))){firestoreListeners.remove(key);statsSources.delete(key);statsSignatures.delete(key);statsInitialKeys.delete(key)}desiredStatsKeys.clear();for(const key of desired)desiredStatsKeys.add(key);if(!desired.size)rebuildStats()}
function ensureHomeSummarySync(){if(state.tab!=='home'){firestoreListeners.remove('homeSummary');homeSummaryKey='';state.homeSummary=null;return}const seasonId=state.selectedSeasonId||state.activeSeasonId||DEFAULT_SEASON_ID,playerId=state.lastPlayerId;if(!playerId||seasonId===ALL_SEASONS_ID){state.homeSummary=null;ensureStatsSync(state.allGames.map(game=>game.id),seasonId);return}const key=playerSeasonSummaryId(seasonId,playerId);if(homeSummaryKey===key)return;firestoreListeners.remove('homeSummary');homeSummaryKey=key;state.homeSummary=null;firestoreListeners.set('homeSummary',()=>onSnapshot(doc(db,'playerSeasonSummaries',key),snapshot=>{if(snapshot.exists()){state.homeSummary={id:snapshot.id,...snapshot.data()};ensureStatsSync([],seasonId)}else{state.homeSummary=null;ensureStatsSync(state.allGames.map(game=>game.id),seasonId)}render()}))}
function ensureDataForView(){const seasonId=state.selectedSeasonId||state.activeSeasonId||DEFAULT_SEASON_ID;if(state.tab==='home'){ensureHomeSummarySync();return}firestoreListeners.remove('homeSummary');homeSummaryKey='';state.homeSummary=null;if(['games','stats','team','settings'].includes(state.tab))ensureStatsSync(state.allGames.map(game=>game.id),seasonId);else ensureStatsSync([],seasonId)}
function ensureSeasonSync(){const seasonId=state.selectedSeasonId||state.activeSeasonId||DEFAULT_SEASON_ID;if(subscribedSeasonId===seasonId)return;for(const key of ['playerSeasons','games'])firestoreListeners.remove(key);subscribedSeasonId=seasonId;gamesSnapshotReady=false;state.playerSeasons=[];state.allGames=[];ensureStatsSync([],seasonId);firestoreListeners.set('playerSeasons',()=>onSnapshot(scopedCollection('playerSeasons',seasonId),s=>{state.playerSeasons=s.docs.map(d=>({id:d.id,...d.data()}));refreshSeasonScope();ensureDataForView();render()}));firestoreListeners.set('games',()=>onSnapshot(scopedCollection('games',seasonId),s=>{const changed=gamesSnapshotReady&&s.docChanges().length;gamesSnapshotReady=true;serverGames=s.docs.map(d=>({id:d.id,...d.data()}));state.allGames=receiveHistoryDocuments('games',serverGames);refreshSeasonScope();globalThis.dispatchEvent?.(new CustomEvent('r32-games-snapshot-applied'));refreshLatestLocalHistory();ensureDataForView();if(changed)queueHomeSummaryRefresh();render()}))}
function ensureOpponentTeamsSync(){firestoreListeners.set('opponentTeams',()=>onSnapshot(collection(db,'opponentTeams'),s=>{state.opponentTeams=s.docs.map(d=>({id:d.id,...d.data()}));render()}))}
function sync(){firestoreListeners.set('seasons',()=>onSnapshot(collection(db,'seasons'),s=>{if(!s.empty)state.seasons=s.docs.map(d=>normalizeSeason({id:d.id,...d.data()}));render()}));firestoreListeners.set('settings',()=>onSnapshot(doc(db,'settings','app'),s=>{if(s.exists()){state.activeSeasonId=s.data().activeSeasonId||DEFAULT_SEASON_ID;if(!localStorage.getItem('r32_selected_season_id'))state.selectedSeasonId=state.activeSeasonId;ensureSeasonSync();refreshSeasonScope();render()}}));firestoreListeners.set('players',()=>onSnapshot(collection(db,'players'),s=>{state.allPlayers=s.docs.map(d=>({id:d.id,...d.data()}));refreshSeasonScope();render()}));ensureSeasonSync();if(['opponentTeams','games','stats','team'].includes(state.tab))ensureOpponentTeamsSync()}
window.runR32DataDiagnostics=()=>{const report=auditR32Data({games:state.allGames,players:state.allPlayers,stats:state.stats,opponentTeams:state.opponentTeams});console.group('R32 data diagnostics');console.table(report.counts);console.table(report.issues);console.groupEnd();return report};
window.r32FirestoreReadState=()=>({selectedSeasonId:state.selectedSeasonId,listeners:firestoreListeners.keys(),loaded:{seasons:state.seasons.length,players:state.allPlayers.length,playerSeasons:state.playerSeasons.length,games:state.allGames.length,stats:state.stats.length,opponentTeams:state.opponentTeams.length}});
let latestSyncStatus={state:'idle',pending:0,online:true};
function gameBulkSyncHtml(){const pending=Number(latestSyncStatus.pending)||0;if(!state.user||!pending)return '';const stateName=latestSyncStatus.state||'idle',offline=latestSyncStatus.online===false||stateName==='offline',syncing=stateName==='syncing';const label=syncing?`同期中… 残り ${pending}件`:offline?`未同期 ${pending}件（オフライン）`:`未同期 ${pending}件を一括同期`;return `<div class="mobile-list-action game-bulk-sync-action"><button type="button" class="btn ${offline?'ghost':''}" id="bulkSyncPending" ${syncing||offline?'disabled':''}>${label}</button></div>`}
function bindBulkSyncButton(){const button=$('#bulkSyncPending');if(button)button.onclick=bulkSyncPending}
function updateGameBulkSyncAction(){const host=$('#gameBulkSyncAction');if(!host)return;host.innerHTML=gameBulkSyncHtml();bindBulkSyncButton()}
async function bulkSyncPending(){const button=$('#bulkSyncPending');if(button)button.disabled=true;try{const result=await confirmAllPendingSessions();if(result.pending)toast(`一括同期後も未同期が ${result.pending}件残っています`);else toast('未同期データをすべて同期しました')}catch(error){console.error(error);toast(error.message||'一括同期に失敗しました')}finally{updateGameBulkSyncAction()}}
function renderSyncStatus(detail={}){latestSyncStatus={...latestSyncStatus,...detail,pending:Number(detail.pending)||0};const pending=latestSyncStatus.pending,stateName=latestSyncStatus.state||'idle',offline=latestSyncStatus.online===false||stateName==='offline',label=offline?`オフライン${pending?`・未同期 ${pending}件`:''}`:stateName==='syncing'?`同期中・残り ${pending}件`:stateName==='error'?`同期エラー・未同期 ${pending}件`:pending?`未同期 ${pending}件`:'クラウド接続済み';for(const id of ['cloudStatus','syncStatus']){const element=$('#'+id);if(!element)continue;element.textContent=label;element.dataset.syncState=offline?'offline':stateName;element.title=pending?'タップして同期を再試行':'同期済み';}updateGameBulkSyncAction()}
window.addEventListener('r32-sync-status',event=>renderSyncStatus(event.detail));
const GLANZ_20260329_REPAIR_MARKER='repair20260329GlanzQuarterV2';
function normalizeRepairText(value=''){return String(value||'').trim().toLowerCase().replace(/\s+/g,'')}
async function repairGlanz20260329QuarterRegistration(){
  if(!state.user)return {status:'not-authenticated'};
  const gameSnapshot=await getDocs(collection(db,'games'));
  const matches=gameSnapshot.docs.filter(item=>{
    const data=item.data()||{};
    const date=String(data.date||data.gameDate||'').slice(0,10);
    const names=[data.opponentTeamName,data.opponent,data.opponentName,data.teamName].map(normalizeRepairText);
    return date==='2026-03-29'&&names.some(name=>name==='glanz'||name.includes('glanz'));
  });
  if(matches.length!==1){
    console.warn('Glanz 2026-03-29 repair skipped: expected exactly one game, found',matches.length,
      matches.map(item=>({id:item.id,...item.data()})));
    return {status:matches.length?'ambiguous':'not-found',count:matches.length};
  }
  const gameDoc=matches[0],game={id:gameDoc.id,...gameDoc.data()};
  if(game?.[GLANZ_20260329_REPAIR_MARKER]?.completed===true)return {status:'already-repaired',gameId:game.id};

  const statSnapshot=await getDocs(query(collection(db,'stats'),where('gameId','==',game.id)));
  const reserved=new Set([
    'gameId','playerId','seasonId','registrationType','quarters','createdAt','updatedAt',
    'appliedOperationIds','appliedOperations','operationIds','lastOperationId','syncMeta'
  ]);
  let migrated=0;
  for(const statDoc of statSnapshot.docs){
    const current=statDoc.data()||{};
    const topLevel={};
    for(const [key,value] of Object.entries(current)) if(!reserved.has(key)) topLevel[key]=value;

    const quarters=current.quarters&&typeof current.quarters==='object'&&!Array.isArray(current.quarters)
      ? current.quarters : {};
    const existingQ1=quarters.q1&&typeof quarters.q1==='object'&&!Array.isArray(quarters.q1)
      ? quarters.q1 : {};

    // Old game-level data is authoritative for this repair. If the document was already
    // partially converted, preserve any fields that only exist in q1.
    const q1={...existingQ1,...topLevel,registered:true,quarter:1};

    await setDoc(doc(db,'stats',statDoc.id),{
      registrationType:'quarter',
      quarters:{...quarters,q1},
      updatedAt:serverTimestamp()
    },{merge:true});
    migrated++;
  }

  const previousEvents=Array.isArray(game.playEvents)?game.playEvents:[];
  const playEvents=previousEvents
    .filter(item=>Number.isFinite(Number(item?.sequence))&&Number(item.sequence)>0)
    .map(item=>({...item,quarter:1}));

  const keptEventIds=new Set(playEvents.map(item=>item?.id).filter(Boolean));
  const patch={
    statsRegistrationType:'quarter',
    quarters:Math.max(4,Number(game.quarters||game.quarterCount||4)||4),
    quarterCount:Math.max(4,Number(game.quarterCount||game.quarters||4)||4),
    playEvents,
    [GLANZ_20260329_REPAIR_MARKER]:{
      completed:true,
      migratedStatDocuments:migrated,
      removedUnsequencedEvents:previousEvents.length-playEvents.length,
      completedAt:serverTimestamp()
    },
    updatedAt:serverTimestamp()
  };

  if(game.eventSequenceOverrides&&typeof game.eventSequenceOverrides==='object'){
    patch.eventSequenceOverrides=Object.fromEntries(
      Object.entries(game.eventSequenceOverrides).filter(([id])=>keptEventIds.has(id))
    );
  }
  if(game.historyInsertionOverrides&&typeof game.historyInsertionOverrides==='object'){
    patch.historyInsertionOverrides=Object.fromEntries(
      Object.entries(game.historyInsertionOverrides).filter(([id])=>keptEventIds.has(id))
    );
  }

  await setDoc(doc(db,'games',game.id),patch,{merge:true});

  const verifyGame=await getDoc(doc(db,'games',game.id));
  const verifyStats=await getDocs(query(collection(db,'stats'),where('gameId','==',game.id)));
  const verifiedGame=verifyGame.data()||{};
  const q1Count=verifyStats.docs.filter(item=>{
    const value=item.data()?.quarters?.q1;
    return value&&typeof value==='object'&&value.registered!==false;
  }).length;
  const unsequenced=(verifiedGame.playEvents||[]).filter(item=>!Number.isFinite(Number(item?.sequence))||Number(item.sequence)<=0).length;
  const verified=verifiedGame.statsRegistrationType==='quarter'&&q1Count===verifyStats.size&&unsequenced===0;

  console.info('Glanz 2026-03-29 repair result',{
    gameId:game.id,verified,statDocuments:verifyStats.size,q1Count,unsequenced
  });
  return {status:verified?'repaired':'verification-failed',gameId:game.id,statDocuments:verifyStats.size,q1Count,unsequenced};
}

window.addEventListener('r32-sync-status',refreshQuarterSync);
