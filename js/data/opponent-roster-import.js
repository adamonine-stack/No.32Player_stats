import { runTransaction } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { auth, db, doc, serverTimestamp } from '../core/firebase.js?v=20260901-scoped-reads-v1';
import { opponentPlayers, mergeOpponentPlayers, validateOpponentPlayers } from '../calculations/opponent-roster.js?v=20261029-v1';
let pending;
export function ensurePhotoRosterImport(payload){
 if(!payload||!Array.isArray(payload.teams)||!payload.importId)throw new Error("名簿ファイルの形式が正しくありません");
 for(const entry of payload.teams){if(!entry.teamId||!entry.teamName||!Array.isArray(entry.players))throw new Error("チーム情報を確認してください");const error=validateOpponentPlayers(entry.players);if(error)throw new Error(error);}
 const PHOTO_ROSTERS=payload.teams,PHOTO_ROSTER_IMPORT_ID=String(payload.importId);
 if(!auth.currentUser)return Promise.resolve({updated:0});
 if(pending)return pending;
 pending=(async()=>{let updated=0;for(const entry of PHOTO_ROSTERS){
  const changed=await runTransaction(db,async tx=>{
   const ref=doc(db,'opponentTeams',entry.teamId),snapshot=await tx.get(ref);
   if(!snapshot.exists())throw new Error(`登録先チームがありません: ${entry.teamName}`);
   const team=snapshot.data();if(team.photoRosterImportId===PHOTO_ROSTER_IMPORT_ID)return false;
   if(team.prefecture!=='兵庫県')throw new Error(`登録先の地域を確認してください: ${entry.teamName}`);
   const players=mergeOpponentPlayers(opponentPlayers(team),entry.players);
   // Store original fields for recovery, and touch only roster fields.
   tx.set(ref,{players,playerNumbers:[...new Set(players.map(p=>p.number))],photoRosterImportId:PHOTO_ROSTER_IMPORT_ID,photoRosterSource:'ユーザー提供のチーム紹介冊子（学年・身長は掲載時点）',photoRosterImportedAt:serverTimestamp(),photoRosterBeforeImport:{players:team.players||[],playerNumbers:team.playerNumbers||[]},updatedAt:serverTimestamp()},{merge:true});return true;
  });if(changed)updated++;
 }return {updated};})().finally(()=>{pending=null});return pending;
}
