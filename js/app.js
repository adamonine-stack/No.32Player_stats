import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { getFirestore, collection, addDoc, setDoc, doc, deleteDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDiaAHF0iceYJNlSDKFKtHKnCETeMCW8IA",
  authDomain: "no32-player-stats.firebaseapp.com",
  projectId: "no32-player-stats",
  storageBucket: "no32-player-stats.firebasestorage.app",
  messagingSenderId: "934416639889",
  appId: "1:934416639889:web:cd0e319fa86c1acb3fdc30"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id)=>document.getElementById(id);
const views = {home:$('homeView'), players:$('playersView'), games:$('gamesView'), stats:$('statsView'), settings:$('settingsView')};
let state = {
  user:null,
  players:[],
  games:[],
  currentView:'home',
  editingGameId:null,
  editingPlayerId:null,
  lastPlayerId:localStorage.getItem('r32:lastPlayerId') || '',
  statMode:'game',
  statKey:''
};

const num = (v)=>Number(v||0);
const pct = (m,a)=> num(a) ? `${((num(m)/num(a))*100).toFixed(1)}%` : '0.0%';
const one = (v)=>Number.isFinite(v) ? v.toFixed(1) : '0.0';
const dateKey = (d)=> d || '';
const monthKey = (d)=> d ? d.slice(0,7) : '';
const yearKey = (d)=> d ? d.slice(0,4) : '';
const winMark = (g)=> num(g.teamScore)>num(g.oppScore)?'○':num(g.teamScore)<num(g.oppScore)?'●':'△';
const scoreText = (g)=> `${num(g.teamScore)}-${num(g.oppScore)} ${winMark(g)}`;
const playerName = (id)=> state.players.find(p=>p.id===id)?.name || '選手未選択';
const selectedPlayer = ()=> state.players.find(p=>p.id===state.lastPlayerId) || state.players[0] || null;

function emptyStats(){return {q:4, twoPA:0,twoPM:0,threePA:0,threePM:0,fta:0,ftm:0,ast:0,or:0,dr:0,pk:0,ds:0,blk:0,pm:0,dm:0,cm:0,vio:0,othTo:0, youtube1:'',youtube2:'',youtube3:'',youtube4:''};}
function totals(games){
  const t = emptyStats(); let teamScore=0, oppScore=0;
  games.forEach(g=>{Object.keys(t).forEach(k=>{ if(typeof t[k]==='number') t[k]+=num(g[k]); }); teamScore+=num(g.teamScore); oppScore+=num(g.oppScore);});
  t.fga=t.twoPA+t.threePA; t.fgm=t.twoPM+t.threePM; t.reb=t.or+t.dr; t.stl=t.pk+t.ds; t.to=t.pm+t.dm+t.cm+t.vio+t.othTo; t.teamScore=teamScore; t.oppScore=oppScore; return t;
}
function perGame(t){ const games4 = num(t.q)/4 || 1; const r={}; Object.keys(t).forEach(k=>{r[k]= typeof t[k]==='number' ? t[k]/games4 : t[k];}); return r; }
function playerGames(pid){return state.games.filter(g=>g.playerId===pid).sort((a,b)=>(b.date||'').localeCompare(a.date||''));}

function percentNumber(m,a){ return num(a) ? Math.max(0,Math.min(100,(num(m)/num(a))*100)) : 0; }
function donut(m,a){ const v=percentNumber(m,a).toFixed(1); return `<span class="donut" style="--p:${v}"><em>${v}%</em></span>`; }
function detailStatsGrid(t, title='スタッツ', opts={}){
  const fga=num(t.twoPA)+num(t.threePA), fgm=num(t.twoPM)+num(t.threePM);
  const avgLabel = opts.avgLabel || '';
  return `<div class="card detail-style-card"><div class="section-title">${title}</div>${avgLabel?`<p class="muted">${avgLabel}</p>`:''}
    <div class="detail-stat-grid">
      <div class="detail-stat has-donut"><small>2PA / 2PM / 2P%</small><b>${one(t.twoPA)} / ${one(t.twoPM)} / <span>${pct(t.twoPM,t.twoPA)}</span></b>${donut(t.twoPM,t.twoPA)}</div>
      <div class="detail-stat has-donut"><small>3PA / 3PM / 3P%</small><b>${one(t.threePA)} / ${one(t.threePM)} / <span>${pct(t.threePM,t.threePA)}</span></b>${donut(t.threePM,t.threePA)}</div>
      <div class="detail-stat has-donut"><small>FGA / FGM / FG%</small><b>${one(fga)} / ${one(fgm)} / <span>${pct(fgm,fga)}</span></b>${donut(fgm,fga)}</div>
      <div class="detail-stat has-donut"><small>FTA / FTM / FT%</small><b>${one(t.fta)} / ${one(t.ftm)} / <span>${pct(t.ftm,t.fta)}</span></b>${donut(t.ftm,t.fta)}</div>
      <div class="detail-stat split-stat"><div><small>AST</small><b>${one(t.ast)}</b></div><div><small>REB</small><b>${one(num(t.or)+num(t.dr))}</b></div></div>
    </div>
  </div>`;
}
function statCards(t, title='1試合平均スタッツ'){
  return detailStatsGrid(t,title);
}



function homeAverageList(t){
  const fga = num(t.twoPA) + num(t.threePA);
  const fgm = num(t.twoPM) + num(t.threePM);
  const rows = [
    ['2PA / 2PM / 2P%', `${one(t.twoPA)} / ${one(t.twoPM)} / ${pct(t.twoPM,t.twoPA)}`],
    ['3PA / 3PM / 3P%', `${one(t.threePA)} / ${one(t.threePM)} / ${pct(t.threePM,t.threePA)}`],
    ['FGA / FGM / FG%', `${one(fga)} / ${one(fgm)} / ${pct(fgm,fga)}`],
    ['FTA / FTM / FT%', `${one(t.fta)} / ${one(t.ftm)} / ${pct(t.ftm,t.fta)}`],
    ['AST（アシスト）', one(t.ast)],
    ['REB（リバウンド）', one(num(t.or)+num(t.dr))],
    ['STL（スティール）', one(num(t.pk)+num(t.ds))],
    ['BLK（ブロック）', one(t.blk)],
    ['TO（ターンオーバー）', one(num(t.pm)+num(t.dm)+num(t.cm)+num(t.vio)+num(t.othTo))]
  ];
  return `<div class="card home-stats-card"><div class="section-title">1試合平均（4Q換算）</div>${rows.map(([k,v])=>`<div class="home-stat-row"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
}


function gameDetailCard(g){
  if(!g) return `<div class="card"><p class="muted">対象試合がありません</p></div>`;
  const t = perGame(totals([g]));
  const fga = num(t.twoPA) + num(t.threePA);
  const fgm = num(t.twoPM) + num(t.threePM);
  const result = num(g.teamScore) > num(g.oppScore) ? 'WIN' : num(g.teamScore) < num(g.oppScore) ? 'LOSE' : 'DRAW';
  const resultClass = result === 'WIN' ? 'win' : result === 'LOSE' ? 'lose' : 'draw';
  return `<div class="card game-detail-card">
    <div class="game-detail-head">
      <div>
        <div class="game-date">${g.date || '-'}</div>
        <div class="game-tournament">${g.tournament || '大会未入力'}</div>
        <div class="game-opponent">vs ${g.opponent || '-'}</div>
      </div>
      <button class="ghost-btn mini-edit edit-game-from-detail" data-id="${g.id || ''}">修正</button>
    </div>
    <div class="score-board">
      <div class="score-side"><b>${num(g.teamScore)}</b><span>${playerName(g.playerId)}</span></div>
      <div class="score-mid"><span>-</span><em>${num(g.q)}Q</em></div>
      <div class="score-side away"><b>${num(g.oppScore)}</b><span>${g.opponent || '相手'}</span></div>
      <div class="result-badge ${resultClass}">${result}</div>
    </div>
    <div class="summary-strip three">
      <div><small>総Q数</small><b>${one(num(g.q))}Q</b></div>
      <div><small>試合換算（4Q換算）</small><b>${one(num(g.q)/4)}試合</b></div>
      <div><small>最終更新</small><b>${g.updatedAt ? new Date(g.updatedAt).toLocaleString('ja-JP',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-'}</b></div>
    </div>
    <div class="detail-stat-grid">
      <div class="detail-stat"><small>2PA / 2PM / 2P%</small><b>${one(t.twoPA)} / ${one(t.twoPM)} / <span>${pct(t.twoPM,t.twoPA)}</span></b></div>
      <div class="detail-stat"><small>3PA / 3PM / 3P%</small><b>${one(t.threePA)} / ${one(t.threePM)} / <span>${pct(t.threePM,t.threePA)}</span></b></div>
      <div class="detail-stat"><small>FGA / FGM / FG%</small><b>${one(fga)} / ${one(fgm)} / <span>${pct(fgm,fga)}</span></b></div>
      <div class="detail-stat"><small>FTA / FTM / FT%</small><b>${one(t.fta)} / ${one(t.ftm)} / <span>${pct(t.ftm,t.fta)}</span></b></div>
      <div class="detail-stat split-stat"><div><small>AST</small><b>${one(t.ast)}</b></div><div><small>REB</small><b>${one(num(t.or)+num(t.dr))}</b></div></div>
    </div>
  </div>`;
}

function render(){
  renderHome(); renderPlayers(); renderGames(); renderStats(); renderSettings();
}
function renderHome(){
  const p=selectedPlayer(); const gs=p?playerGames(p.id):[]; const avg=perGame(totals(gs));
  views.home.innerHTML = `<div class="home-app-hero"><img src="icons/icon-512.png" alt="R32 Basketball Stats"><button id="homeLoginBtn" class="ghost-btn home-login-btn">${state.user?'ログアウト':'ログイン'}</button></div><div class="card home-player-card"><div class="home-player-icon">♙</div><div><h2>${p ? `No.${p.number||'-'} ${p.name}` : '選手を登録してください'}</h2><p class="muted">${p?`${p.position||''} ${p.height?`｜${p.height}cm`:''}`:'選手タブから登録できます。'}</p></div></div>
  ${p?homeAverageList(avg):''}
  <button class="primary-btn home-add-game" id="goInput">＋ 試合を登録</button>
  <div class="card"><div class="section-title">最近の試合</div>${gs.slice(0,5).map(gameItem).join('')||'<p class="muted">まだデータがありません</p>'}</div>`;
  $('homeLoginBtn')?.addEventListener('click',()=>{ if(state.user) signOut(auth); else $('loginDialog').showModal(); });
  $('goInput')?.addEventListener('click',()=>openGameForm());
}
function gameItem(g){return `<div class="list-item"><div><b>${g.date||'-'} vs ${g.opponent||'-'}</b><div class="muted">${g.tournament||'大会未入力'} ｜ ${num(g.q)}Q</div></div><div class="score">${scoreText(g)}</div></div>`;}
function renderPlayers(){
  const editing = state.players.find(p=>p.id===state.editingPlayerId) || {};
  const loginNotice = state.user ? '' : '<p class="muted auth-note">選手の登録・修正・削除は管理者ログイン後に行えます。</p>';
  views.players.innerHTML = `<div class="card"><div class="section-title">${state.editingPlayerId?'選手修正':'選手登録'}</div>${loginNotice}<div class="form-grid"><input id="pNo" placeholder="背番号" value="${editing.number||''}" ${state.user?'':'disabled'}><input id="pName" placeholder="選手名" value="${editing.name||''}" ${state.user?'':'disabled'}><input id="pPos" placeholder="ポジション" value="${editing.position||''}" ${state.user?'':'disabled'}><input id="pHeight" placeholder="身長(cm)" type="number" value="${editing.height||''}" ${state.user?'':'disabled'}>${state.editingPlayerId?'<button id="cancelPlayerEdit" class="ghost-btn">キャンセル</button>':''}<button id="addPlayer" class="primary-btn ${state.editingPlayerId?'':'full'}" ${state.user?'':'disabled'}>${state.editingPlayerId?'更新':'選手を追加'}</button></div></div><div class="card"><div class="section-title">選手一覧</div>${state.players.map(p=>`<div class="list-item player-row"><div><b>No.${p.number||'-'} ${p.name}</b><div class="muted">${p.position||''} ${p.height?`｜${p.height}cm`:''}</div></div><div class="row-actions"><button class="ghost-btn select-player" data-id="${p.id}">選択</button><button class="ghost-btn edit-player" data-id="${p.id}" ${state.user?'':'disabled'}>修正</button><button class="danger-btn delete-player" data-id="${p.id}" ${state.user?'':'disabled'}>削除</button></div></div>`).join('')||'<p class="muted">まだ選手がありません</p>'}</div>`;
  $('addPlayer')?.addEventListener('click', savePlayer);
  $('cancelPlayerEdit')?.addEventListener('click',()=>{state.editingPlayerId=null; renderPlayers();});
  document.querySelectorAll('.select-player').forEach(b=>b.addEventListener('click',e=>{setLastPlayer(e.currentTarget.dataset.id); go('home');}));
  document.querySelectorAll('.edit-player').forEach(b=>b.addEventListener('click',e=>{state.editingPlayerId=e.currentTarget.dataset.id; renderPlayers(); window.scrollTo({top:0,behavior:'smooth'});}));
  document.querySelectorAll('.delete-player').forEach(b=>b.addEventListener('click',e=>deletePlayer(e.currentTarget.dataset.id)));
}
async function savePlayer(){
  if(!state.user) return alert('選手登録・修正には管理者ログインが必要です。');
  const data={number:$('pNo').value.trim(),name:$('pName').value.trim(),position:$('pPos').value.trim(),height:$('pHeight').value.trim(),updatedAt:Date.now()};
  if(!data.name) return alert('選手名を入力してください');
  if(state.user){
    if(state.editingPlayerId) await setDoc(doc(db,'players',state.editingPlayerId), data, {merge:true});
    else await addDoc(collection(db,'players'), {...data,createdAt:serverTimestamp()});
  } else {
    if(state.editingPlayerId){ const i=state.players.findIndex(p=>p.id===state.editingPlayerId); if(i>=0) state.players[i]={...state.players[i],...data}; }
    else state.players.push({...data,id:crypto.randomUUID(),createdAt:Date.now()});
    localStorage.setItem('r32:players',JSON.stringify(state.players));
  }
  state.editingPlayerId=null;
  render();
}
async function deletePlayer(id){
  if(!state.user) return alert('選手削除には管理者ログインが必要です。');
  const p=state.players.find(x=>x.id===id);
  if(!confirm(`No.${p?.number||'-'} ${p?.name||''} を削除しますか？
この選手の試合データも削除されます。`)) return;
  const related=state.games.filter(g=>g.playerId===id);
  if(state.user){
    await Promise.all([deleteDoc(doc(db,'players',id)), ...related.map(g=>deleteDoc(doc(db,'games',g.id)))]);
  } else {
    state.players=state.players.filter(p=>p.id!==id);
    state.games=state.games.filter(g=>g.playerId!==id);
    localStorage.setItem('r32:players',JSON.stringify(state.players));
    localStorage.setItem('r32:games',JSON.stringify(state.games));
  }
  if(state.lastPlayerId===id){ const next=state.players.find(p=>p.id!==id); state.lastPlayerId=next?.id||''; localStorage.setItem('r32:lastPlayerId',state.lastPlayerId); }
  state.editingPlayerId=null;
  render();
}
function renderGames(){
  const gs=[...state.games].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  views.games.innerHTML = `<div class="card"><div class="section-title">試合一覧</div><p class="muted">登録済み試合の修正・削除はこちらから行います。新規登録はホームから。</p>${gs.map(g=>`<div class="list-item"><div><b>${g.date||'-'} vs ${g.opponent||'-'}</b><div class="muted">${playerName(g.playerId)} ｜ ${g.tournament||'大会未入力'} ｜ ${num(g.q)}Q</div><div class="score">${scoreText(g)}</div></div><div class="row"><button class="ghost-btn edit-game" data-id="${g.id}">修正</button><button class="danger-btn del-game" data-id="${g.id}">削除</button></div></div>`).join('')||'<p class="muted">まだデータがありません</p>'}</div>`;
  document.querySelectorAll('.edit-game').forEach(b=>b.addEventListener('click',e=>openGameForm(e.currentTarget.dataset.id)));
  document.querySelectorAll('.del-game').forEach(b=>b.addEventListener('click',e=>deleteGame(e.currentTarget.dataset.id)));
}
function openGameForm(id=null){if(!state.user) return alert('試合登録・修正には管理者ログインが必要です。'); state.editingGameId=id; go('home'); views.home.innerHTML = gameForm(id?state.games.find(g=>g.id===id):null); $('saveGame').addEventListener('click',saveGame); $('cancelGame').addEventListener('click',()=>{state.editingGameId=null; renderHome();});}
function gameForm(g={}){g={...emptyStats(),...(g||{})};
 return `<div class="card"><div class="section-title">${state.editingGameId?'試合を修正':'試合を登録'}</div><div class="form-grid">
  <div class="full"><label>選手</label><select id="gPlayer">${state.players.map(p=>`<option value="${p.id}" ${p.id===(g.playerId||state.lastPlayerId)?'selected':''}>No.${p.number||'-'} ${p.name}</option>`).join('')}</select></div>
  <div><label>年月日</label><input id="gDate" type="date" value="${g.date||''}"></div><div><label>Q数</label><input id="gQ" type="number" value="${num(g.q)||4}"></div>
  <div><label>対戦校</label><input id="gOpp" value="${g.opponent||''}"></div><div><label>大会名</label><input id="gTour" value="${g.tournament||''}"></div>
  <div><label>自チーム得点</label><input id="gTeamScore" type="number" value="${num(g.teamScore)}"></div><div><label>相手得点</label><input id="gOppScore" type="number" value="${num(g.oppScore)}"></div>
  ${numInput('2PA','twoPA',g)}${numInput('2PM','twoPM',g)}${numInput('3PA','threePA',g)}${numInput('3PM','threePM',g)}${numInput('FTA','fta',g)}${numInput('FTM','ftm',g)}${numInput('AST','ast',g)}${numInput('BLK','blk',g)}
  ${numInput('PK パスカット','pk',g)}${numInput('DS ドリブルカット','ds',g)}${numInput('OR','or',g)}${numInput('DR','dr',g)}${numInput('PM パスミス','pm',g)}${numInput('DM ドリブルミス','dm',g)}${numInput('CM キャッチミス','cm',g)}${numInput('VIO バイオレーション','vio',g)}${numInput('OTH その他TO','othTo',g)}
  <div class="full"><label>YouTube URL 1</label><input id="youtube1" value="${g.youtube1||''}" placeholder="https://youtube.com/... "></div>
  <div class="full"><label>YouTube URL 2</label><input id="youtube2" value="${g.youtube2||''}"></div>
  <div class="full"><label>YouTube URL 3</label><input id="youtube3" value="${g.youtube3||''}"></div>
  <div class="full"><label>YouTube URL 4</label><input id="youtube4" value="${g.youtube4||''}"></div>
  <button id="cancelGame" class="ghost-btn">戻る</button><button id="saveGame" class="primary-btn">保存</button>
 </div></div>`;}
function numInput(label,key,g){return `<div><label>${label}</label><input id="${key}" type="number" value="${num(g[key])}"></div>`;}
async function saveGame(){
  if(!state.user) return alert('試合保存には管理者ログインが必要です。');
  const playerId=$('gPlayer').value; if(!playerId) return alert('選手を登録・選択してください');
  const data={playerId,date:$('gDate').value,opponent:$('gOpp').value.trim(),tournament:$('gTour').value.trim(),q:num($('gQ').value)||4,teamScore:num($('gTeamScore').value),oppScore:num($('gOppScore').value),updatedAt:Date.now()};
  ['twoPA','twoPM','threePA','threePM','fta','ftm','ast','blk','pk','ds','or','dr','pm','dm','cm','vio','othTo'].forEach(k=>data[k]=num($(k).value));
  ['youtube1','youtube2','youtube3','youtube4'].forEach(k=>data[k]=$(k).value.trim());
  setLastPlayer(playerId,false);
  try{
    if(state.user){
      if(state.editingGameId) await setDoc(doc(db,'games',state.editingGameId), data, {merge:true});
      else await addDoc(collection(db,'games'), {...data,createdAt:serverTimestamp()});
    }else{
      if(state.editingGameId){ const i=state.games.findIndex(g=>g.id===state.editingGameId); state.games[i]={...state.games[i],...data}; }
      else state.games.push({...data,id:crypto.randomUUID()});
      localStorage.setItem('r32:games',JSON.stringify(state.games));
    }
    state.editingGameId=null; alert('保存しました'); go('games'); render();
  }catch(e){console.error(e); alert('保存できませんでした: '+e.message);}
}
async function deleteGame(id){if(!state.user) return alert('試合削除には管理者ログインが必要です。'); if(!confirm('削除しますか？'))return; await deleteDoc(doc(db,'games',id));}

function renderStats(){
  const p=selectedPlayer();
  const gs=p?playerGames(p.id):[];
  const keys={game:[...gs].map(g=>({v:g.id,t:`${g.date} vs ${g.opponent}`})), tournament:[...new Set(gs.map(g=>g.tournament).filter(Boolean))].map(v=>({v,t:v})), day:[...new Set(gs.map(g=>dateKey(g.date)).filter(Boolean))].map(v=>({v,t:v})), month:[...new Set(gs.map(g=>monthKey(g.date)).filter(Boolean))].map(v=>({v,t:v})), year:[...new Set(gs.map(g=>yearKey(g.date)).filter(Boolean))].map(v=>({v,t:v}))};
  if(!state.statKey && keys[state.statMode]?.[0]) state.statKey=keys[state.statMode][0].v;
  const target=filterGames(gs,state.statMode,state.statKey);
  const total=totals(target), avg=perGame(total);
  const title= keys[state.statMode]?.find(x=>x.v===state.statKey)?.t || '対象データなし';
  const modeLabel = ({game:'試合',tournament:'大会',day:'日',month:'月',year:'年'})[state.statMode];
  const targetSummary = `<div class="card target-card"><span class="eyebrow">${modeLabel}</span><h2>${title}</h2><p class="muted">対象試合 ${target.length}試合 ｜ 総Q数 ${one(total.q)}Q ｜ 4Q換算 ${one(total.q/4)}試合</p>${state.statMode!=='year'?matchList(target):''}</div>`;
  views.stats.innerHTML = `<div class="card"><div class="section-title">スタッツ</div><label>選手</label><select id="statPlayer">${state.players.map(pl=>`<option value="${pl.id}" ${pl.id===(p?.id)?'selected':''}>No.${pl.number||'-'} ${pl.name}</option>`).join('')}</select><div class="tabs" id="statTabs">${['game','tournament','day','month','year'].map(m=>`<button data-mode="${m}" class="${state.statMode===m?'active':''}">${({game:'試合',tournament:'大会',day:'日',month:'月',year:'年'})[m]}</button>`).join('')}</div><label>対象選択</label><select id="statKey">${(keys[state.statMode]||[]).map(x=>`<option value="${x.v}" ${x.v===state.statKey?'selected':''}>${x.t}</option>`).join('')}</select></div>
  ${state.statMode==='game' ? gameDetailCard(target[0]) : `${targetSummary}${detailStatsGrid(avg,'4Q換算 1試合平均')}`}${breakdowns(avg)}${state.statMode==='game'?videoButtons(target[0]):''}`;
  $('statPlayer')?.addEventListener('change',e=>{setLastPlayer(e.target.value); state.statKey=''; renderStats(); renderHome();});
  $('statKey')?.addEventListener('change',e=>{state.statKey=e.target.value; renderStats();});
  document.querySelectorAll('#statTabs button').forEach(b=>b.addEventListener('click',e=>{state.statMode=e.currentTarget.dataset.mode; state.statKey=''; renderStats();}));
  document.querySelectorAll('.edit-game-from-detail').forEach(b=>b.addEventListener('click',e=>openGameForm(e.currentTarget.dataset.id)));
}
function filterGames(gs,mode,key){if(!key)return[]; return gs.filter(g=> mode==='game'?g.id===key: mode==='tournament'?g.tournament===key: mode==='day'?dateKey(g.date)===key: mode==='month'?monthKey(g.date)===key: yearKey(g.date)===key);}
function matchList(gs){return `<div class="subcard"><div class="section-title">対象試合</div>${gs.map(g=>`<div class="list-item"><div><b>${g.date} vs ${g.opponent}</b><div class="muted">${g.tournament||''} ｜ ${num(g.q)}Q</div></div><div class="score">${scoreText(g)}</div></div>`).join('')||'<p class="muted">対象試合なし</p>'}</div>`;}
function breakdowns(t){return `<div class="card breakdown"><div class="section-title">STL内訳</div>${bd([['PK',t.pk],['DS',t.ds],['合計',num(t.pk)+num(t.ds)]])}</div><div class="card breakdown"><div class="section-title">REB内訳</div>${bd([['OR',t.or],['DR',t.dr],['合計',num(t.or)+num(t.dr)]])}</div><div class="card breakdown"><div class="section-title">TO内訳</div>${bd([['PM',t.pm],['DM',t.dm],['CM',t.cm],['VIO',t.vio],['OTH',t.othTo],['合計',num(t.pm)+num(t.dm)+num(t.cm)+num(t.vio)+num(t.othTo)]])}</div>`;}
function bd(rows){return rows.map(([k,v])=>`<div class="bd-row"><b>${k}</b><span></span><span></span><b>${one(v)}</b></div>`).join('');}
function videoButtons(g){if(!g)return''; const urls=[g.youtube1,g.youtube2,g.youtube3,g.youtube4].filter(Boolean); return `<div class="card"><div class="section-title">YouTube動画</div>${urls.map((u,i)=>`<a class="video-btn" target="_blank" rel="noopener" href="${u}">動画 ${i+1} を開く</a>`).join('')||'<p class="muted">動画URLは登録されていません</p>'}</div>`;}
function renderVideos(){}
function renderSettings(){views.settings.innerHTML=`<div class="card"><div class="section-title">設定</div><p>ログイン状態：${state.user?state.user.email:'未ログイン'}</p><p class="muted">Firebase接続済みの場合はクラウドに保存されます。未ログイン時はこの端末だけに保存されます。</p><button id="exportBtn" class="ghost-btn">バックアップを書き出し</button></div>`; $('exportBtn')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({players:state.players,games:state.games},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='r32-backup.json'; a.click();});}

function go(view){state.currentView=view; Object.entries(views).forEach(([k,v])=>v.classList.toggle('active',k===view)); document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); if(view!=='home') render();}
document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
function setLastPlayer(id,rerender=true){state.lastPlayerId=id; localStorage.setItem('r32:lastPlayerId',id); if(rerender) render();}

$('loginBtn').addEventListener('click',()=>{ if(state.user) signOut(auth); else $('loginDialog').showModal(); });
$('doLogin').addEventListener('click',async(e)=>{e.preventDefault(); try{await signInWithEmailAndPassword(auth,$('email').value,$('password').value); $('loginDialog').close();}catch(err){alert('ログインできません: '+err.message);}});

onAuthStateChanged(auth,(user)=>{state.user=user; $('loginBtn').textContent=user?'ログアウト':'ログイン'; $('cloudStatus').textContent=user?'クラウド接続済み':'閲覧モード：クラウド読込中'; subscribeCloud();});
function loadLocal(){state.players=JSON.parse(localStorage.getItem('r32:players')||'[]'); state.games=JSON.parse(localStorage.getItem('r32:games')||'[]'); render();}
let unsub=[]; function subscribeCloud(){unsub.forEach(f=>f()); unsub=[]; try{unsub.push(onSnapshot(collection(db,'players'),snap=>{state.players=snap.docs.map(d=>({id:d.id,...d.data()})); if(!state.lastPlayerId && state.players[0]) setLastPlayer(state.players[0].id,false); render();},err=>{$('cloudStatus').textContent='クラウド権限エラー'; console.error(err);})); unsub.push(onSnapshot(collection(db,'games'),snap=>{state.games=snap.docs.map(d=>({id:d.id,...d.data()})); render();},err=>{$('cloudStatus').textContent='クラウド権限エラー'; console.error(err);}));}catch(e){$('cloudStatus').textContent='クラウド接続失敗'; console.error(e);}}

if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }
