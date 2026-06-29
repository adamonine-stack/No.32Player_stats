import { $, $$, uid, num, pct, fmt, sum, escapeHtml, toDateInput, download, dateKey, monthKey } from './utils.js';
import * as Firebase from './firebase-service.js';

const state = {
  ready:false, cloud:true, user:null, activeView:'home', edit:null,
  data:{players:[], games:[], stats:[], videos:[], settings:[]},
  localKey:'r32-basketball-stats-v1'
};

const defaultPlayer = {name:'No.32', number:'32', position:'PG/SG', grade:'', height:'', dominantHand:'右', photo:''};

function localLoad(){
  try { return JSON.parse(localStorage.getItem(state.localKey)) || state.data; } catch { return state.data; }
}
function localSave(){ localStorage.setItem(state.localKey, JSON.stringify(state.data)); }
function setStatus(text, good=true){ $('#connectionStatus').textContent = text; $('#connectionStatus').style.color = good ? '#9aa7c7' : '#ffd166'; }

function init(){
  state.data = {...state.data, ...localLoad()};
  setupNav(); setupAuth(); setupFirebase(); render();
}

function setupFirebase(){
  Firebase.onAuth(user => { state.user = user; document.body.classList.toggle('is-admin', !!user); document.body.classList.toggle('not-admin', !user); $('#authButton').textContent = user ? 'ログアウト' : 'ログイン'; render(); });
  let loaded = 0;
  ['players','games','stats','videos','settings'].forEach(name => {
    Firebase.listenCollection(name, rows => {
      state.data[name] = rows; loaded++; state.cloud = true; localSave(); setStatus(state.user ? '管理者モード｜クラウド同期中' : '閲覧モード｜クラウド同期中'); render();
    }, err => {
      state.cloud = false; setStatus('クラウド未接続｜ローカル表示中', false); render();
    });
  });
  setTimeout(()=>{ if(!loaded) setStatus('クラウド接続待機中...', false); }, 2500);
}

function setupNav(){
  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    state.activeView = btn.dataset.view;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b===btn));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${state.activeView}`));
    render();
  }));
}

function setupAuth(){
  $('#authButton').addEventListener('click', async () => {
    if (state.user){ await Firebase.logout(); return; }
    $('#authDialog').showModal();
  });
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#authMessage').textContent = 'ログイン中...';
    try { await Firebase.login($('#loginEmail').value, $('#loginPassword').value); $('#authDialog').close(); $('#authForm').reset(); $('#authMessage').textContent=''; }
    catch(err){ $('#authMessage').textContent = 'ログインできません。メールとパスワードを確認してください。'; }
  });
}

async function save(collectionName, item){
  if(!state.user){ alert('入力・編集には管理者ログインが必要です。'); return; }
  try { await Firebase.saveItem(collectionName, item); }
  catch(err){
    console.error(err); alert('クラウド保存に失敗しました。Firestoreルールやログイン状態を確認してください。ローカルには保存します。');
    if(!item.id) item.id = uid();
    const arr = state.data[collectionName]; const idx = arr.findIndex(x=>x.id===item.id); if(idx>=0) arr[idx]=item; else arr.unshift(item); localSave(); render();
  }
}
async function remove(collectionName, id){
  if(!state.user){ alert('削除には管理者ログインが必要です。'); return; }
  if(!confirm('削除しますか？')) return;
  try { await Firebase.removeItem(collectionName, id); }
  catch{ state.data[collectionName] = state.data[collectionName].filter(x=>x.id!==id); localSave(); render(); }
}

function aggregate(filter={}){
  let stats = state.data.stats;
  if(filter.playerId) stats = stats.filter(s=>s.playerId===filter.playerId);
  if(filter.period === 'month' && filter.key) stats = stats.filter(s=>monthKey(gameById(s.gameId)?.date)===filter.key);
  const games = [...new Set(stats.map(s=>s.gameId))].map(id=>gameById(id)).filter(Boolean);
  const totalQ = games.reduce((a,g)=>a+num(g.quarters||4),0) || 0;
  const fga = sum(stats,'fg2a')+sum(stats,'fg3a'), fgm=sum(stats,'fg2m')+sum(stats,'fg3m');
  const pts = sum(stats,'fg2m')*2 + sum(stats,'fg3m')*3 + sum(stats,'ftm');
  const toTotal = sum(stats,'toPass')+sum(stats,'toDribble')+sum(stats,'toViolation')+sum(stats,'toOffensiveFoul')+sum(stats,'toCatch')+sum(stats,'toOther');
  const stealTotal = sum(stats,'stlDribble')+sum(stats,'stlPassCut')+sum(stats,'stlBlock')+sum(stats,'stlLoose')+sum(stats,'stlCharge')+sum(stats,'stlOther');
  const reb = sum(stats,'orb')+sum(stats,'drb');
  const fourQ = totalQ ? 4/totalQ : 0;
  return {stats,games,totalQ,gameCount:games.length,pts,ast:sum(stats,'ast'),reb,orb:sum(stats,'orb'),drb:sum(stats,'drb'),fga,fgm,fgPct:pct(fgm,fga),fg3Pct:pct(sum(stats,'fg3m'),sum(stats,'fg3a')),ftPct:pct(sum(stats,'ftm'),sum(stats,'fta')),toTotal,stealTotal,block:sum(stats,'stlBlock'),fourQAvg:{pts:pts*fourQ,ast:sum(stats,'ast')*fourQ,reb:reb*fourQ,stl:stealTotal*fourQ,to:toTotal*fourQ}, perQ:{pts: totalQ?pts/totalQ:0, ast: totalQ?sum(stats,'ast')/totalQ:0, reb: totalQ?reb/totalQ:0, stl: totalQ?stealTotal/totalQ:0, to: totalQ?toTotal/totalQ:0}};
}
function gameById(id){ return state.data.games.find(g=>g.id===id); }
function playerById(id){ return state.data.players.find(p=>p.id===id); }

function render(){
  if(!document.body.classList.contains('is-admin')) document.body.classList.add('not-admin');
  renderHome(); renderPlayers(); renderGames(); renderAnalysis(); renderVideos(); renderSettings();
}
function miniCards(a){
  return `<div class="summary-grid">
    ${card('試合数', a.gameCount, '登録済み')}${card('総Q', a.totalQ, '出場/対象Q')}${card('4Q換算PTS', fmt(a.fourQAvg.pts), '1試合平均')}${card('FG%', fmt(a.fgPct)+'%', `${a.fgm}/${a.fga}`)}
  </div>`;
}
function card(label,value,delta=''){ return `<div class="stat-card"><div class="label">${label}</div><div class="value">${value}</div><div class="delta">${delta}</div></div>`; }

function renderHome(){
  const a = aggregate(); const recent = state.data.games.slice(0,5);
  $('#view-home').innerHTML = `<div class="hero">
    <div class="hero-card"><div class="hero-content"><div class="eyebrow">R32 Player Performance</div><h1>試合を記録し、成長を見える化。</h1><p>選手・試合・Q数・詳細スタッツ・動画リンクをクラウドで管理。閲覧者は同じURLから最新データを確認できます。</p><div class="quick-actions"><button class="primary-btn admin-only" data-go="games">試合を入力</button><button class="secondary-btn" data-go="analysis">分析を見る</button></div></div></div>
    <div>${miniCards(a)}</div>
  </div>
  <div class="section-head"><div><h2>最近の試合</h2><p>直近の入力内容</p></div></div>
  <div class="list-card"><div class="list">${recent.length ? recent.map(gameItem).join('') : empty()}</div></div>`;
  $$('[data-go]', $('#view-home')).forEach(b=>b.onclick=()=>go(b.dataset.go));
}
function go(view){ state.activeView=view; $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.view===view)); $$('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${view}`)); render(); }
function empty(){ return $('#emptyTemplate').innerHTML; }
function gameItem(g){ const stats = state.data.stats.filter(s=>s.gameId===g.id); const pts = stats.reduce((a,s)=>a+num(s.fg2m)*2+num(s.fg3m)*3+num(s.ftm),0); return `<div class="item"><div><strong>${escapeHtml(g.opponent||'対戦相手未入力')}</strong><small>${escapeHtml(g.date||'')}｜${escapeHtml(g.event||'')}｜${num(g.quarters||4)}Q｜${pts} PTS</small></div><div class="chip">${escapeHtml(g.result||'')}</div></div>`; }

function renderPlayers(){
  const players = state.data.players;
  $('#view-players').innerHTML = `<div class="section-head"><div><h2>選手管理</h2><p>背番号・ポジション・学年などを管理</p></div></div>
  <p class="notice lock-note">閲覧モードです。登録・編集には管理者ログインが必要です。</p>
  <div class="grid-2"><form class="form-card admin-only" id="playerForm"><h3>選手登録</h3><div class="inline-fields"><label>名前<input name="name" value="${defaultPlayer.name}" required></label><label>背番号<input name="number" value="${defaultPlayer.number}"></label></div><div class="inline-fields"><label>ポジション<input name="position" value="${defaultPlayer.position}"></label><label>学年<input name="grade"></label></div><div class="inline-fields"><label>身長<input name="height" placeholder="例 160cm"></label><label>利き手<select name="dominantHand"><option>右</option><option>左</option><option>両方</option></select></label></div><button class="primary-btn">保存</button></form>
  <div class="list-card"><h3>選手一覧</h3><div class="list">${players.length ? players.map(playerItem).join('') : empty()}</div></div></div>`;
  const form=$('#playerForm'); if(form) form.onsubmit=e=>{e.preventDefault(); save('players', Object.fromEntries(new FormData(form))); form.reset();};
  $$('.delete-player').forEach(b=>b.onclick=()=>remove('players', b.dataset.id));
}
function playerItem(p){ return `<div class="item"><div><strong>#${escapeHtml(p.number||'')} ${escapeHtml(p.name||'')}</strong><small>${escapeHtml(p.position||'')}｜${escapeHtml(p.grade||'')}｜${escapeHtml(p.height||'')}</small></div><div class="item-actions admin-only"><button class="icon-btn delete-player" data-id="${p.id}">削除</button></div></div>`; }

function renderGames(){
  const playerOptions = state.data.players.map(p=>`<option value="${p.id}">#${escapeHtml(p.number||'')} ${escapeHtml(p.name||'')}</option>`).join('');
  $('#view-games').innerHTML = `<div class="section-head"><div><h2>試合入力</h2><p>Q数・シュート・TO分類・奪取分類を入力</p></div></div><p class="notice lock-note">閲覧モードです。入力には管理者ログインが必要です。</p>
  <form class="form-card admin-only" id="gameForm"><h3>試合情報</h3><div class="field-3"><label>日付<input name="date" type="date" value="${toDateInput()}" required></label><label>対戦相手<input name="opponent" placeholder="VS ○○"></label><label>大会名<input name="event" placeholder="大会・練習試合"></label></div><div class="field-3"><label>会場<input name="place"></label><label>Q数<input name="quarters" type="number" min="1" max="12" value="4"></label><label>結果<select name="result"><option value="">未入力</option><option>勝ち</option><option>負け</option><option>引分</option></select></label></div><div class="form-actions"><button class="primary-btn">試合を保存</button></div></form>
  <form class="form-card admin-only" id="statForm"><h3>スタッツ入力</h3><div class="inline-fields"><label>試合<select name="gameId" required>${state.data.games.map(g=>`<option value="${g.id}">${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}</option>`).join('')}</select></label><label>選手<select name="playerId" required>${playerOptions}</select></label></div>
  <h4>シュート</h4><div class="field-3"><label>2P成功<input name="fg2m" type="number" min="0" value="0"></label><label>2P試投<input name="fg2a" type="number" min="0" value="0"></label><label>3P成功<input name="fg3m" type="number" min="0" value="0"></label><label>3P試投<input name="fg3a" type="number" min="0" value="0"></label><label>FT成功<input name="ftm" type="number" min="0" value="0"></label><label>FT試投<input name="fta" type="number" min="0" value="0"></label></div>
  <h4>基本スタッツ</h4><div class="field-3"><label>OR<input name="orb" type="number" min="0" value="0"></label><label>DR<input name="drb" type="number" min="0" value="0"></label><label>AST<input name="ast" type="number" min="0" value="0"></label></div>
  <h4>ターンオーバー分類</h4><div class="field-3"><label>パスミス<input name="toPass" type="number" min="0" value="0"></label><label>ドリブルミス<input name="toDribble" type="number" min="0" value="0"></label><label>バイオレーション<input name="toViolation" type="number" min="0" value="0"></label><label>OF<input name="toOffensiveFoul" type="number" min="0" value="0"></label><label>キャッチミス<input name="toCatch" type="number" min="0" value="0"></label><label>その他<input name="toOther" type="number" min="0" value="0"></label></div>
  <h4>ボール奪取分類</h4><div class="field-3"><label>ドリブルスティール<input name="stlDribble" type="number" min="0" value="0"></label><label>パスカット<input name="stlPassCut" type="number" min="0" value="0"></label><label>ブロック<input name="stlBlock" type="number" min="0" value="0"></label><label>ルーズボール<input name="stlLoose" type="number" min="0" value="0"></label><label>チャージ誘発<input name="stlCharge" type="number" min="0" value="0"></label><label>その他<input name="stlOther" type="number" min="0" value="0"></label></div>
  <label>メモ<textarea name="note" placeholder="良かったプレー、課題、動画時間など"></textarea></label><button class="primary-btn">スタッツを保存</button></form>
  <div class="section-head"><div><h2>試合一覧</h2></div></div><div class="list-card"><div class="list">${state.data.games.length ? state.data.games.map(gameItemWithDelete).join('') : empty()}</div></div>`;
  const gf=$('#gameForm'); if(gf) gf.onsubmit=e=>{e.preventDefault(); save('games', Object.fromEntries(new FormData(gf))); gf.reset(); gf.quarters.value=4; gf.date.value=toDateInput();};
  const sf=$('#statForm'); if(sf) sf.onsubmit=e=>{e.preventDefault(); const obj=Object.fromEntries(new FormData(sf)); Object.keys(obj).forEach(k=>{ if(!['gameId','playerId','note'].includes(k)) obj[k]=num(obj[k]); }); save('stats', obj); sf.reset(); renderGames();};
  $$('.delete-game').forEach(b=>b.onclick=()=>remove('games', b.dataset.id));
}
function gameItemWithDelete(g){ return `<div class="item"><div><strong>${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}</strong><small>${escapeHtml(g.event||'')}｜${escapeHtml(g.place||'')}｜${num(g.quarters||4)}Q｜${escapeHtml(g.result||'')}</small></div><div class="item-actions admin-only"><button class="icon-btn delete-game" data-id="${g.id}">削除</button></div></div>`; }

function renderAnalysis(){
  const a=aggregate(); const byMonth = monthly();
  $('#view-analysis').innerHTML = `<div class="section-head"><div><h2>分析</h2><p>合計・1Q平均・4Q換算平均</p></div></div>${miniCards(a)}
  <div class="grid-3" style="margin-top:14px">${card('1Q平均PTS',fmt(a.perQ.pts),'Q毎')}${card('4Q換算AST',fmt(a.fourQAvg.ast),'1試合平均')}${card('TO合計',a.toTotal,'分類別で確認')}</div>
  <div class="grid-2" style="margin-top:16px"><div class="glass-card"><h3>月別PTS</h3>${barChart(byMonth.map(x=>({label:x.month.slice(5),value:x.pts})))}</div><div class="glass-card"><h3>成功率</h3><table class="metric-table"><tbody><tr><td>FG%</td><td>${fmt(a.fgPct)}%</td></tr><tr><td>3P%</td><td>${fmt(a.fg3Pct)}%</td></tr><tr><td>FT%</td><td>${fmt(a.ftPct)}%</td></tr></tbody></table></div></div>
  <div class="grid-2" style="margin-top:16px"><div class="glass-card"><h3>TO内訳</h3>${breakdownTable([['パスミス','toPass'],['ドリブルミス','toDribble'],['バイオレーション','toViolation'],['OF','toOffensiveFoul'],['キャッチミス','toCatch'],['その他','toOther']], a.stats)}</div><div class="glass-card"><h3>奪取内訳</h3>${breakdownTable([['ドリブルSTL','stlDribble'],['パスカット','stlPassCut'],['ブロック','stlBlock'],['ルーズボール','stlLoose'],['チャージ誘発','stlCharge'],['その他','stlOther']], a.stats)}</div></div>`;
}
function monthly(){ const map={}; state.data.stats.forEach(s=>{ const g=gameById(s.gameId); const m=monthKey(g?.date); if(!m) return; map[m]??={month:m,pts:0}; map[m].pts += num(s.fg2m)*2+num(s.fg3m)*3+num(s.ftm); }); return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-8); }
function barChart(rows){ if(!rows.length) return empty(); const max=Math.max(...rows.map(r=>r.value),1); return `<div class="chart-card"><div class="bars">${rows.map(r=>`<div class="bar" style="height:${Math.max(8,(r.value/max)*150)}px"><b>${fmt(r.value,0)}</b><span>${escapeHtml(r.label)}</span></div>`).join('')}</div></div>`; }
function breakdownTable(defs, rows){ return `<table class="metric-table"><thead><tr><th>項目</th><th>回数</th></tr></thead><tbody>${defs.map(([label,key])=>`<tr><td>${label}</td><td>${sum(rows,key)}</td></tr>`).join('')}</tbody></table>`; }

function renderVideos(){
  $('#view-videos').innerHTML = `<div class="section-head"><div><h2>動画</h2><p>YouTubeリンクを試合ごとに管理</p></div></div><p class="notice lock-note">閲覧モードです。登録には管理者ログインが必要です。</p>
  <form class="form-card admin-only" id="videoForm"><div class="inline-fields"><label>試合<select name="gameId">${state.data.games.map(g=>`<option value="${g.id}">${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}</option>`).join('')}</select></label><label>タイトル<input name="title" placeholder="ハイライト / フル動画"></label></div><label>YouTube URL<input name="url" type="url" placeholder="https://youtube.com/..."></label><button class="primary-btn">動画を保存</button></form>
  <div class="list-card" style="margin-top:16px"><div class="list">${state.data.videos.length ? state.data.videos.map(videoItem).join('') : empty()}</div></div>`;
  const vf=$('#videoForm'); if(vf) vf.onsubmit=e=>{e.preventDefault(); save('videos', Object.fromEntries(new FormData(vf))); vf.reset();};
  $$('.delete-video').forEach(b=>b.onclick=()=>remove('videos', b.dataset.id));
}
function videoItem(v){ const g=gameById(v.gameId); return `<div class="item"><div><strong><a class="video-link" href="${escapeHtml(v.url||'#')}" target="_blank" rel="noopener">${escapeHtml(v.title||'動画')}</a></strong><small>${g ? `${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}` : ''}</small></div><div class="item-actions admin-only"><button class="icon-btn delete-video" data-id="${v.id}">削除</button></div></div>`; }

function renderSettings(){
  const data = JSON.stringify(state.data,null,2);
  $('#view-settings').innerHTML = `<div class="section-head"><div><h2>設定</h2><p>バックアップ・運用確認</p></div></div><div class="grid-2"><div class="glass-card"><h3>クラウド状態</h3><p class="small-text">${state.cloud ? 'Firebaseに接続しています。' : 'クラウド接続が確認できません。ローカルデータを表示しています。'}</p><p class="small-text">${state.user ? `管理者ログイン中：${escapeHtml(state.user.email||'')}` : '閲覧モード：ログインなし'}</p><button class="primary-btn" id="backupBtn">バックアップを書き出し</button></div><div class="glass-card"><h3>Firestoreルール</h3><p class="small-text">閲覧者は読み取りのみ、ログイン済み管理者は書き込み可能にします。ZIP内の <b>firestore.rules</b> をFirebaseに貼り付けてください。</p></div></div><div class="footer-space"></div>`;
  $('#backupBtn').onclick=()=>download(`r32-backup-${toDateInput()}.json`, data);
}

init();
