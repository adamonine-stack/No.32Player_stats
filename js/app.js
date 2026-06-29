import { $, $$, uid, num, pct, fmt, sum, escapeHtml, toDateInput, download, dateKey, monthKey } from './utils.js';
import * as Firebase from './firebase-service.js';

const state = {
  ready:false, cloud:true, user:null, activeView:'home', edit:null, analysis:{type:'game', key:''},
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
  const selected = selectStats(filter);
  const stats = selected.stats;
  const games = selected.games;
  const totalQ = games.reduce((a,g)=>a+num(g.quarters||4),0) || 0;
  const equivGames = totalQ ? totalQ / 4 : 0;
  const rate = totalQ ? 4 / totalQ : 0;
  const fg2a = sum(stats,'fg2a'), fg2m = sum(stats,'fg2m');
  const fg3a = sum(stats,'fg3a'), fg3m = sum(stats,'fg3m');
  const fta = sum(stats,'fta'), ftm = sum(stats,'ftm');
  const fga = fg2a + fg3a, fgm = fg2m + fg3m;
  const pts = fg2m*2 + fg3m*3 + ftm;
  const orb = sum(stats,'orb'), drb = sum(stats,'drb'), reb = orb + drb;
  const pk = sum(stats,'stlPassCut'), ds = sum(stats,'stlDribble'), stealTotal = pk + ds;
  const block = sum(stats,'stlBlock');
  const pm = sum(stats,'toPass'), dm = sum(stats,'toDribble'), cm = sum(stats,'toCatch'), vio = sum(stats,'toViolation'), oth = sum(stats,'toOther');
  const toTotal = pm + dm + cm + vio + oth;
  const ast = sum(stats,'ast');
  const perGame = {
    pts: pts*rate,
    fg2a: fg2a*rate, fg2m: fg2m*rate, fg2Pct:pct(fg2m,fg2a),
    fg3a: fg3a*rate, fg3m: fg3m*rate, fg3Pct:pct(fg3m,fg3a),
    fga: fga*rate, fgm: fgm*rate, fgPct:pct(fgm,fga),
    fta: fta*rate, ftm: ftm*rate, ftPct:pct(ftm,fta),
    ast: ast*rate, orb: orb*rate, drb: drb*rate, reb: reb*rate,
    pk: pk*rate, ds: ds*rate, stl: stealTotal*rate,
    blk: block*rate,
    pm: pm*rate, dm: dm*rate, cm: cm*rate, vio: vio*rate, oth: oth*rate, to: toTotal*rate
  };
  return {stats,games,totalQ,equivGames,gameCount:games.length,pts,ast,reb,orb,drb,fga,fgm,fgPct:pct(fgm,fga),fg3Pct:pct(fg3m,fg3a),ftPct:pct(ftm,fta),toTotal,stealTotal,block,perGame,fourQAvg:{pts:perGame.pts,ast:perGame.ast,reb:perGame.reb,stl:perGame.stl,to:perGame.to},perQ:{pts: totalQ?pts/totalQ:0, ast: totalQ?ast/totalQ:0, reb: totalQ?reb/totalQ:0, stl: totalQ?stealTotal/totalQ:0, to: totalQ?toTotal/totalQ:0}};
}
function selectStats(filter={}){
  let games = [...state.data.games].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const type = filter.type;
  const key = filter.key;
  if(type === 'game' && key) games = games.filter(g=>g.id===key);
  if(type === 'event' && key) games = games.filter(g=>(g.event||'')===key);
  if(type === 'day' && key) games = games.filter(g=>dateKey(g.date)===key);
  if(type === 'month' && key) games = games.filter(g=>monthKey(g.date)===key);
  if(type === 'year' && key) games = games.filter(g=>(g.date||'').slice(0,4)===key);
  const ids = new Set(games.map(g=>g.id));
  let stats = state.data.stats.filter(s=>ids.has(s.gameId));
  if(filter.playerId) stats = stats.filter(s=>s.playerId===filter.playerId);
  return {games, stats};
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
function scoreText(g){ return (g.scoreFor !== undefined && g.scoreFor !== '' && g.scoreAgainst !== undefined && g.scoreAgainst !== '') ? `${num(g.scoreFor)} - ${num(g.scoreAgainst)}` : 'スコア未入力'; }
function gameResult(g){ if(g.result) return g.result; if(g.scoreFor !== undefined && g.scoreFor !== '' && g.scoreAgainst !== undefined && g.scoreAgainst !== '') return num(g.scoreFor)>num(g.scoreAgainst)?'勝ち':num(g.scoreFor)<num(g.scoreAgainst)?'負け':'引分'; return ''; }
function gameItem(g){ const stats = state.data.stats.filter(s=>s.gameId===g.id); const pts = stats.reduce((a,s)=>a+num(s.fg2m)*2+num(s.fg3m)*3+num(s.ftm),0); return `<div class="item"><div><strong>${escapeHtml(g.opponent||'対戦相手未入力')}｜${scoreText(g)}</strong><small>${escapeHtml(g.date||'')}｜${escapeHtml(g.event||'')}｜${num(g.quarters||4)}Q｜選手PTS ${pts}</small></div><div class="chip">${escapeHtml(gameResult(g))}</div></div>`; }

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
  $('#view-games').innerHTML = `<div class="section-head"><div><h2>試合入力</h2><p>基本情報・スコア・詳細スタッツを入力</p></div></div><p class="notice lock-note">閲覧モードです。入力には管理者ログインが必要です。</p>
  <form class="form-card admin-only" id="gameForm"><h3>試合情報</h3><div class="field-3"><label>年月日<input name="date" type="date" value="${toDateInput()}" required></label><label>対戦校<input name="opponent" placeholder="例 サンダース中学校"></label><label>大会名<input name="event" placeholder="例 U15春季大会"></label></div><div class="field-3"><label>会場<input name="place"></label><label>Q数<input name="quarters" type="number" min="1" max="12" value="4"></label><label>自チーム得点<input name="scoreFor" type="number" min="0" placeholder="例 78"></label><label>相手得点<input name="scoreAgainst" type="number" min="0" placeholder="例 65"></label><label>結果<select name="result"><option value="">スコアから自動</option><option>勝ち</option><option>負け</option><option>引分</option></select></label></div><div class="form-actions"><button class="primary-btn">試合を保存</button></div></form>
  <form class="form-card admin-only" id="statForm"><h3>スタッツ入力</h3><div class="inline-fields"><label>試合<select name="gameId" required>${state.data.games.map(g=>`<option value="${g.id}">${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}</option>`).join('')}</select></label><label>選手<select name="playerId" required>${playerOptions}</select></label></div>
  <h4>シュート</h4><div class="field-3"><label>2PA（2P試投）<input name="fg2a" type="number" min="0" value="0"></label><label>2PM（2P成功）<input name="fg2m" type="number" min="0" value="0"></label><label>3PA（3P試投）<input name="fg3a" type="number" min="0" value="0"></label><label>3PM（3P成功）<input name="fg3m" type="number" min="0" value="0"></label><label>FTA（FT試投）<input name="fta" type="number" min="0" value="0"></label><label>FTM（FT成功）<input name="ftm" type="number" min="0" value="0"></label></div>
  <h4>基本スタッツ</h4><div class="field-3"><label>AST（アシスト）<input name="ast" type="number" min="0" value="0"></label><label>OR（オフェンスリバウンド）<input name="orb" type="number" min="0" value="0"></label><label>DR（ディフェンスリバウンド）<input name="drb" type="number" min="0" value="0"></label></div>
  <h4>ボール奪取・ブロック</h4><div class="field-3"><label>PK（パスカット）<input name="stlPassCut" type="number" min="0" value="0"></label><label>DS（ドリブルカット）<input name="stlDribble" type="number" min="0" value="0"></label><label>BLK（ブロック）<input name="stlBlock" type="number" min="0" value="0"></label></div>
  <h4>ターンオーバー分類</h4><div class="field-3"><label>PM（パスミス）<input name="toPass" type="number" min="0" value="0"></label><label>DM（ドリブルミス）<input name="toDribble" type="number" min="0" value="0"></label><label>CM（キャッチミス）<input name="toCatch" type="number" min="0" value="0"></label><label>VIO（バイオレーション）<input name="toViolation" type="number" min="0" value="0"></label><label>OTH（その他）<input name="toOther" type="number" min="0" value="0"></label></div>
  <label>メモ<textarea name="note" placeholder="良かったプレー、課題、動画時間など"></textarea></label><button class="primary-btn">スタッツを保存</button></form>
  <div class="section-head"><div><h2>試合一覧</h2></div></div><div class="list-card"><div class="list">${state.data.games.length ? state.data.games.map(gameItemWithDelete).join('') : empty()}</div></div>`;
  const gf=$('#gameForm'); if(gf) gf.onsubmit=e=>{e.preventDefault(); const obj=Object.fromEntries(new FormData(gf)); obj.quarters = num(obj.quarters||4); obj.scoreFor = obj.scoreFor === '' ? '' : num(obj.scoreFor); obj.scoreAgainst = obj.scoreAgainst === '' ? '' : num(obj.scoreAgainst); if(!obj.result && obj.scoreFor !== '' && obj.scoreAgainst !== ''){ obj.result = obj.scoreFor > obj.scoreAgainst ? '勝ち' : obj.scoreFor < obj.scoreAgainst ? '負け' : '引分'; } save('games', obj); gf.reset(); gf.quarters.value=4; gf.date.value=toDateInput();};
  const sf=$('#statForm'); if(sf) sf.onsubmit=e=>{e.preventDefault(); const obj=Object.fromEntries(new FormData(sf)); Object.keys(obj).forEach(k=>{ if(!['gameId','playerId','note'].includes(k)) obj[k]=num(obj[k]); }); save('stats', obj); sf.reset(); renderGames();};
  $$('.delete-game').forEach(b=>b.onclick=()=>remove('games', b.dataset.id));
}
function gameItemWithDelete(g){ return `<div class="item"><div><strong>${escapeHtml(g.date||'')} VS ${escapeHtml(g.opponent||'')}｜${scoreText(g)}</strong><small>${escapeHtml(g.event||'')}｜${escapeHtml(g.place||'')}｜${num(g.quarters||4)}Q｜${escapeHtml(gameResult(g))}</small></div><div class="item-actions admin-only"><button class="icon-btn delete-game" data-id="${g.id}">削除</button></div></div>`; }

function renderAnalysis(){
  const t = state.analysis.type || 'game';
  const opts = analysisOptions(t);
  if(!state.analysis.key && opts.length) state.analysis.key = opts[0].value;
  const a = aggregate({type:t, key:state.analysis.key});
  const title = selectedTitle(t, state.analysis.key, a.games);
  const listNeeded = t !== 'game' && t !== 'year';
  const game = t==='game' ? a.games[0] : null;
  $('#view-analysis').innerHTML = `<div class="analysis-mobile">
    <div class="analysis-top"><div><h2>📊 分析 <span>ANALYSIS</span></h2></div><button class="pill-btn ghost" id="filterReset">リセット</button></div>
    <div class="analysis-card range-card"><div class="card-title">データの範囲を選択</div><div class="range-tabs">
      ${rangeButton('game','試合','🏆',t)}${rangeButton('event','大会','🏅',t)}${rangeButton('day','日','📅',t)}${rangeButton('month','月','🗓️',t)}${rangeButton('year','年','📆',t)}
    </div>
    <label class="select-label">${rangeLabel(t)}<select id="analysisKey">${opts.map(o=>`<option value="${escapeHtml(o.value)}" ${o.value===state.analysis.key?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}</select></label></div>
    ${analysisHeader(t,title,a,game)}
    ${listNeeded ? matchListCard(a.games) : ''}
    ${overviewCard(a)}
    ${statsGrid(a)}
    <div class="breakdown-grid">${stlBreakdown(a)}${toBreakdown(a)}</div>
    <div class="analysis-card graph-box"><h3>📈 グラフで確認</h3><div class="graph-buttons"><button class="active">得点</button><button>シュート%</button><button>リバウンド</button><button>アシスト</button><button>ターンオーバー</button></div>${barChart(chartRowsFor(t, a.games))}</div>
  </div>`;
  $$('.range-tab').forEach(b=>b.onclick=()=>{ state.analysis.type=b.dataset.type; state.analysis.key=''; renderAnalysis(); });
  const key=$('#analysisKey'); if(key) key.onchange=()=>{ state.analysis.key=key.value; renderAnalysis(); };
  $('#filterReset').onclick=()=>{ state.analysis={type:'game', key:''}; renderAnalysis(); };
}
function rangeButton(type,label,icon,active){ return `<button class="range-tab ${type===active?'active':''}" data-type="${type}"><span>${icon}</span><b>${label}</b></button>`; }
function rangeLabel(t){ return ({game:'試合名',event:'大会名',day:'日付',month:'月',year:'年'}[t]||'選択'); }
function analysisOptions(t){
  const games = [...state.data.games].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(t==='game') return games.map(g=>({value:g.id,label:`${g.date||''} vs ${g.opponent||'対戦校未入力'} ${scoreText(g)}`}));
  if(t==='event') return [...new Set(games.map(g=>g.event).filter(Boolean))].map(v=>({value:v,label:v}));
  if(t==='day') return [...new Set(games.map(g=>dateKey(g.date)).filter(Boolean))].map(v=>({value:v,label:formatDateJP(v)}));
  if(t==='month') return [...new Set(games.map(g=>monthKey(g.date)).filter(Boolean))].map(v=>({value:v,label:formatMonthJP(v)}));
  if(t==='year') return [...new Set(games.map(g=>(g.date||'').slice(0,4)).filter(Boolean))].map(v=>({value:v,label:`${v}年`}));
  return [];
}
function selectedTitle(t,key,games){
  if(t==='game'){ const g=games[0]; return g ? `${g.opponent||'対戦校未入力'} 戦` : '試合を選択'; }
  if(t==='event') return key || '大会を選択';
  if(t==='day') return key ? formatDateJP(key) : '日を選択';
  if(t==='month') return key ? formatMonthJP(key) : '月を選択';
  if(t==='year') return key ? `${key}年` : '年を選択';
  return '分析';
}
function analysisHeader(t,title,a,game){
  if(t==='game' && game){ return `<div class="analysis-card selected-card"><div><div class="small-title">試合名</div><h2>🏀 ${escapeHtml(title)}</h2><div class="meta-row"><span>📅 ${escapeHtml(game.date||'')}</span><span>🏆 ${escapeHtml(game.event||'')}</span><span>📍 ${escapeHtml(game.place||'')}</span><span>${num(game.quarters||4)}Q</span></div></div><div class="score-block"><span>最終スコア</span><b>${scoreText(game)}</b><em>${escapeHtml(gameResult(game)||'')}</em></div></div>`; }
  const sub = t==='event' ? `対象試合 ${a.gameCount}試合` : t==='day' || t==='month' ? `対象試合 ${a.gameCount}試合` : `対象試合 ${a.gameCount}試合`;
  const icon = t==='event' ? '🏆' : t==='day' ? '📅' : t==='month' ? '🗓️' : '📆';
  return `<div class="analysis-card selected-card"><div><div class="small-title">${rangeLabel(t)}</div><h2>${icon} ${escapeHtml(title)}</h2><div class="meta-row"><span>${escapeHtml(sub)}</span>${dateRangeText(a.games) ? `<span>${dateRangeText(a.games)}</span>` : ''}</div></div><div class="score-block compact"><span>対象試合</span><b>${a.gameCount}</b><em>試合</em></div></div>`;
}
function matchListCard(games){ return `<div class="analysis-card match-list"><h3>対象試合の一覧と結果</h3><div class="match-table"><div class="head"><span>日付</span><span>対戦校</span><span>Q数</span><span>結果</span></div>${games.map(g=>`<div class="row"><span>${escapeHtml(g.date||'')}</span><span>vs ${escapeHtml(g.opponent||'')}</span><span>${num(g.quarters||4)}Q</span><span><i class="result-dot ${gameResult(g)==='負け'?'lose':gameResult(g)==='引分'?'draw':''}"></i>${scoreText(g)}</span></div>`).join('')}</div></div>`; }
function overviewCard(a){ return `<div class="analysis-card overview"><div><span>総Q数</span><b>${a.totalQ}</b><em>Q</em></div><div><span>試合換算数</span><b>${fmt(a.equivGames,2)}</b><em>試合</em><small>総Q ÷ 4</small></div><div><span>対象試合</span><b>${a.gameCount}</b><em>試合</em></div></div>`; }
function statsGrid(a){ const p=a.perGame; return `<div class="analysis-card stat-matrix">
  ${metricCell('2PA / 2PM / 2P%', `${fmt(p.fg2a)} / ${fmt(p.fg2m)} / <strong>${fmt(p.fg2Pct)}%</strong>`, '試合換算あたり')}
  ${metricCell('3PA / 3PM / 3P%', `${fmt(p.fg3a)} / ${fmt(p.fg3m)} / <strong>${fmt(p.fg3Pct)}%</strong>`, '試合換算あたり')}
  ${metricCell('FGA / FGM / FG%', `${fmt(p.fga)} / ${fmt(p.fgm)} / <strong>${fmt(p.fgPct)}%</strong>`, '試合換算あたり')}
  ${metricCell('FTA / FTM / FT%', `${fmt(p.fta)} / ${fmt(p.ftm)} / <strong>${fmt(p.ftPct)}%</strong>`, '試合換算あたり')}
  ${metricCell('AST（アシスト）', fmt(p.ast), '試合換算あたり')}
  ${metricCell('REB（OR+DR）', `${fmt(p.reb)}<small>(${fmt(p.orb)} + ${fmt(p.drb)})</small>`, '試合換算あたり')}
  ${metricCell('STL（PK+DS）', `${fmt(p.stl)}<small>(${fmt(p.pk)} + ${fmt(p.ds)})</small>`, '試合換算あたり')}
  ${metricCell('BLK（ブロック）', fmt(p.blk), '試合換算あたり')}
  ${metricCell('TO（ターンオーバー）', fmt(p.to), '試合換算あたり')}
  </div>`; }
function metricCell(label,value,sub=''){ return `<div class="metric-cell"><span>${label}</span><em>${sub}</em><b>${value}</b></div>`; }
function stlBreakdown(a){ const p=a.perGame; return `<div class="analysis-card breakdown"><h3>STL内訳 <small>試合換算あたり</small></h3><div class="break-row"><div><span>PK<br><small>パスカット</small></span><b>${fmt(p.pk)}</b></div><div><span>DS<br><small>ドリブルカット</small></span><b>${fmt(p.ds)}</b></div></div><div class="break-total"><span>合計</span><b>${fmt(p.stl)}</b></div></div>`; }
function toBreakdown(a){ const p=a.perGame; return `<div class="analysis-card breakdown"><h3>TO内訳 <small>試合換算あたり</small></h3><div class="break-row five"><div><span>PM<br><small>パスミス</small></span><b>${fmt(p.pm)}</b></div><div><span>DM<br><small>ドリブルミス</small></span><b>${fmt(p.dm)}</b></div><div><span>CM<br><small>キャッチミス</small></span><b>${fmt(p.cm)}</b></div><div><span>VIO<br><small>バイオレーション</small></span><b>${fmt(p.vio)}</b></div><div><span>OTH<br><small>その他</small></span><b>${fmt(p.oth)}</b></div></div><div class="break-total"><span>合計</span><b>${fmt(p.to)}</b></div></div>`; }
function chartRowsFor(t,games){ return games.slice(-8).map(g=>{ const a=aggregate({type:'game',key:g.id}); return {label:(g.date||'').slice(5), value:a.perGame.pts}; }); }
function monthly(){ const map={}; state.data.stats.forEach(s=>{ const g=gameById(s.gameId); const m=monthKey(g?.date); if(!m) return; map[m]??={month:m,pts:0}; map[m].pts += num(s.fg2m)*2+num(s.fg3m)*3+num(s.ftm); }); return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-8); }
function barChart(rows){ if(!rows.length) return `<div class="small-text">表示できるグラフデータがありません。</div>`; const max=Math.max(...rows.map(r=>r.value),1); return `<div class="chart-card"><div class="bars">${rows.map(r=>`<div class="bar" style="height:${Math.max(8,(r.value/max)*150)}px"><b>${fmt(r.value,0)}</b><span>${escapeHtml(r.label)}</span></div>`).join('')}</div></div>`; }
function breakdownTable(defs, rows){ return `<table class="metric-table"><thead><tr><th>項目</th><th>回数</th></tr></thead><tbody>${defs.map(([label,key])=>`<tr><td>${label}</td><td>${sum(rows,key)}</td></tr>`).join('')}</tbody></table>`; }
function formatDateJP(v){ if(!v) return ''; const [y,m,d]=v.split('-'); return `${y}年${Number(m)}月${Number(d)}日`; }
function formatMonthJP(v){ if(!v) return ''; const [y,m]=v.split('-'); return `${y}年${Number(m)}月`; }
function dateRangeText(games){ const dates=games.map(g=>g.date).filter(Boolean).sort(); if(!dates.length) return ''; return dates[0]===dates[dates.length-1] ? dates[0] : `${dates[0]}〜${dates[dates.length-1]}`; }
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
