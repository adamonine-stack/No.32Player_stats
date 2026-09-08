import { getDocFromServer,getDocsFromServer } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { db,doc,collection,query,where } from './firebase.js?v=20260901-scoped-reads-v1';
import { listOfflineOperations } from './offline-operation-queue.js?v=20260904-offline-v1';
import { createStatsBaseline,LOAD_ERROR,withStatsLoadTimeout } from './normal-stats-guard.js';

export async function assertNormalStatsOnline(gameId) {
  if(globalThis.navigator?.onLine===false)throw Error(LOAD_ERROR);
  const operations=await listOfflineOperations();
  if(operations.some(op=>op.payload?.gameId===gameId||op.payload?.game?.id===gameId||op.payload?.writes?.some(w=>w.id===gameId||w.data?.gameId===gameId)))throw Error(LOAD_ERROR);
}
export async function loadNormalStats(gameId,playerId,quarter) {
  return withStatsLoadTimeout(async()=>{
    await assertNormalStatsOnline(gameId);
    const [gameSnap,statsSnap]=await Promise.all([
      getDocFromServer(doc(db,'games',gameId)),
      getDocsFromServer(query(collection(db,'stats'),where('gameId','==',gameId),where('playerId','==',playerId)))
    ]);
    if(!gameSnap.exists()||gameSnap.metadata.fromCache||gameSnap.metadata.hasPendingWrites||statsSnap.metadata.fromCache||statsSnap.metadata.hasPendingWrites||statsSnap.docs.length>1||statsSnap.docs.some(s=>s.metadata.hasPendingWrites))throw Error(LOAD_ERROR);
    await assertNormalStatsOnline(gameId);
    const game={...gameSnap.data(),id:gameId},snap=statsSnap.docs[0],stat=snap?{...snap.data(),id:snap.id}:null;
    return {game,stat,baseline:createStatsBaseline(game,stat,playerId,quarter)};
  });
}
