import { state } from '../core/state.js';
import { statHasRegisteredData, getGameStatsRegistrationType, quarterKey } from '../calculations/stats-calculations.js';
import { OPPONENT_RANKS } from '../calculations/opponent-team-calculations.js';
import { filterByOpponentFilterRange, filterByRegisteredGameCategory, filterByAggregationCondition } from '../calculations/game-filter-calculations.js';
import { SHOT_AREAS, SHOT_AREA_ORDER, SHOT_TYPES, SHOT_TYPE_ORDER, SHOT_COURT_SIZE, aggregateShots, collectShots, countsAsFieldGoalAttempt, detectShotArea, filterShots, normalizedShotType, normalizeShot, shotAreaForRecord } from '../calculations/shot-calculations.js?v=20260810-team-shot-analysis-v2';
import { SHOT_ANALYSIS_DISTANCE_OPTIONS, SHOT_ANALYSIS_SIDE_OPTIONS, aggregateShotAnalysis } from '../calculations/shot-analysis-calculations.js?v=20260807-analysis-core-v1';

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .team-shot-analysis-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .team-shot-analysis-button{flex:0 0 auto}
    .team-shot-analysis-modal .card{max-width:760px}
    .team-shot-analysis-panel{margin:10px 0 12px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(2,6,23,.38)}
    .team-shot-analysis-panel .tag-head{display:flex;justify-content:space-between;gap:8px;align-items:center}
    .team-shot-analysis-panel .tag-title{font-size:14px;font-weight:900;color:#fff}
    .team-shot-analysis-panel .tag-current{font-size:10px;font-weight:800;color:var(--orange,#f97316)}
    .team-shot-analysis-panel .tag-label{margin-top:8px;margin-bottom:5px;font-size:11px;font-weight:800;color:var(--muted,#9ca3af)}
    .team-shot-analysis-panel .tag-buttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
    .team-shot-analysis-panel .tag-buttons.side{grid-template-columns:repeat(4,minmax(0,1fr))}
    .team-shot-analysis-panel .tag-button{min-width:0;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:rgba(255,255,255,.05);color:#fff;padding:8px 4px;font-size:11px;font-weight:800;line-height:1.15;touch-action:manipulation}
    .team-shot-analysis-panel .tag-button.active{background:linear-gradient(135deg,#8a2be2,#6514cb);border-color:transparent}
    .team-shot-analysis-result{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden}
    .team-shot-analysis-result>div{text-align:center;padding:9px 5px;border-right:1px solid rgba(255,255,255,.12)}
    .team-shot-analysis-result>div:last-child{border-right:0}
    .team-shot-analysis-result span{display:block;color:var(--muted,#9ca3af);font-size:10px;font-weight:800}
    .team-shot-analysis-result b{display:block;margin-top:4px;color:#fff;font-size:20px;font-weight:900}
    .team-shot-analysis-result .rate b{color:var(--orange,#f97316)}
    .team-shot-analysis-meta{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
    .team-shot-analysis-meta span{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 8px;font-size:10px;color:var(--muted,#9ca3af)}
    .team-shot-analysis-filter-row{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}
    .team-shot-analysis-filter-row button.active,.team-shot-analysis-filter-row button[aria-pressed="true"]{background:linear-gradient(135deg,#8a2be2,#6514cb)!important;border-color:#c4b5fd!important;color:#fff!important;box-shadow:inset 0 0 0 2px #a78bfa!important}
    .team-shot-analysis-filter-row button:disabled{background:#000!important;border-color:#222!important;color:#555!important;box-shadow:none!important;opacity:1;cursor:not-allowed}
    .team-analysis-area-overlay{pointer-events:none;fill:#8b5cf6;fill-opacity:.27}
    .team-analysis-shot-table-head,.team-analysis-shot-row,.team-analysis-shot-type-row{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,52px) 64px 68px;align-items:center;gap:4px}
    .team-analysis-shot-table-head.type,.team-analysis-shot-type-row.type{grid-template-columns:minmax(0,1fr) repeat(3,58px) 70px}
    .team-analysis-shot-table-head{padding:8px 10px;color:#ff9800;font-size:12px;font-weight:900;border-bottom:1px solid #33436a}
    .team-analysis-shot-table-head span:not(:first-child),.team-analysis-shot-row b,.team-analysis-shot-type-row b{text-align:center}
    .team-analysis-shot-row{min-height:46px;padding:8px 10px;color:#fff;background:#101010;border-bottom:1px solid #33436a}
    .team-analysis-shot-type-detail{margin-top:18px;padding:12px;background:#0b1530;border:1px solid #33436a;border-radius:12px}
    .team-analysis-shot-type-row{width:100%;min-height:42px;padding:7px 10px;border:0;border-bottom:1px solid #33436a;background:transparent;color:#fff;text-align:left}
    .team-analysis-shot-type-row.active{background:#35166b;box-shadow:inset 4px 0 #a78bfa}
    @media(max-width:600px){
      .team-shot-analysis-modal .card{max-width:100%}
      .team-shot-analysis-panel{padding:9px}
      .team-shot-analysis-panel .tag-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}
      .team-shot-analysis-panel .tag-buttons.side{grid-template-columns:repeat(4,minmax(0,1fr))}
      .team-shot-analysis-panel .tag-button{font-size:10px;padding:7px 2px}
      .team-shot-analysis-result b{font-size:17px}
      .team-shot-analysis-result span{font-size:9px}
      .team-analysis-shot-table-head,.team-analysis-shot-row{grid-template-columns:minmax(74px,1fr) repeat(3,38px) 52px 56px;font-size:10px;padding-left:4px;padding-right:4px}
      .team-analysis-shot-table-head.type,.team-analysis-shot-type-row.type{grid-template-columns:minmax(80px,1fr) repeat(3,42px) 54px;font-size:10px}
    }
  `;
  document.head.appendChild(style);

  let scrollY = 0;

  function detailView(game) {
    if (!game || getGameStatsRegistrationType(game) !== 'quarter') return 'game';
    return state.detailStatsViews?.[game.id] || 'game';
  }

  function targetGames() {
    const opponentFiltered = filterByOpponentFilterRange(
      state.games,
      state.teamCategoryId,
      state.teamOpponentRankMin,
      state.teamOpponentRankMax,
      state.opponentTeams,
      OPPONENT_RANKS
    );
    const byCondition = filterByAggregationCondition(
      opponentFiltered,
      state.teamMode,
      state.teamTargetId,
      state.teamPeriodStart,
      state.teamPeriodEnd
    );
    const byCategory = filterByRegisteredGameCategory(byCondition, state.teamCategoryId);
    return byCategory.filter(game => state.stats.some(stat => stat.gameId === game.id && statHasRegisteredData(stat, game)));
  }

  function statsForGames(games) {
    const ids = new Set(games.map(game => game.id));
    const raw = state.stats.filter(stat => ids.has(stat.gameId) && statHasRegisteredData(stat, games.find(game => game.id === stat.gameId)));
    if (state.teamMode !== 'game' || games.length !== 1) return raw;
    const game = games[0];
    const view = detailView(game);
    if (view === 'game' || getGameStatsRegistrationType(game) !== 'quarter') return raw;
    const q = Number(String(view).replace(/\D/g, ''));
    if (!q) return raw;
    const qk = quarterKey(q);
    return raw.map(stat => {
      const source = stat.quarters?.[qk];
      return source && typeof source === 'object' ? { ...source, id: stat.id, gameId: stat.gameId, playerId: stat.playerId } : null;
    }).filter(Boolean);
  }

  function modeLabel() {
    return { game: '試合', tournament: '大会', all: '全期間', day: '日別', month: '月別', year: '年別', period: '期間指定' }[state.teamMode] || state.teamMode || '全期間';
  }

  function targetLabel(games) {
    if (state.teamMode === 'game') {
      const game = games[0];
      return game ? `${game.date || ''} vs ${game.opponent || ''}` : '試合未選択';
    }
    if (state.teamMode === 'period') return `${state.teamPeriodStart || '開始日未指定'} ～ ${state.teamPeriodEnd || '終了日未指定'}`;
    if (state.teamMode === 'all') return '全期間';
    return state.teamTargetId || '未指定';
  }

  function areaOverlaySvg(selectedAreas = []) {
    const selected = new Set(selectedAreas);
    if (!selected.size) return '';
    const cells = [], step = 2;
    for (let y = 0; y < SHOT_COURT_SIZE.height; y += step) for (let x = 0; x < SHOT_COURT_SIZE.width; x += step) {
      if (!selected.has(detectShotArea(x + step / 2, y + step / 2))) continue;
      cells.push(`<rect x="${x}" y="${y}" width="${Math.min(step, SHOT_COURT_SIZE.width - x) + .15}" height="${Math.min(step, SHOT_COURT_SIZE.height - y) + .15}"/>`);
    }
    return `<g class="team-analysis-area-overlay">${cells.join('')}</g>`;
  }

  function shotTypeButtonLabel(id) {
    return id === 'running_shot' ? 'ランニング/<br>ステップイン' : SHOT_TYPES[id];
  }

  function shotCourtSvg(shots = [], selectedAreas = []) {
    const markers = shots.map(normalizeShot).filter(shot => Number.isFinite(Number(shot.shotX)) && Number.isFinite(Number(shot.shotY))).map(shot => ({
      x: Number(shot.shotX), y: Number(shot.shotY), result: shot.result, wasFouled: shot.wasFouled === true
    }));
    return `<svg class="shot-court" viewBox="0 0 100 108" role="img" aria-label="バックコート3P領域付きFIBA規格シュート位置分析コート">
<rect width="100" height="108" class="court-bg"/>
<g class="court-zones"><path d="M6 0V19.934A45 45 0 0 0 94 19.934V0"/><rect x="33.667" y="0" width="32.666" height="38.667"/><path d="M38 38.667A12 12 0 0 0 62 38.667" stroke-dasharray="2 2"/><path d="M41.333 10.5A8.667 8.667 0 0 0 58.667 10.5M41.333 10.5V8M58.667 10.5V8"/></g>
<g class="court-zone-guides"><path d="M0 24H33.667M66.333 24H100M33.667 38.667V93.333M66.333 38.667V93.333"/><path d="M36 10.5A14 14 0 0 0 64 10.5"/></g>
<g class="court-lines"><rect x=".4" y=".4" width="99.2" height="107.2"/><path d="M44 8V4.5H56V8M42.5 7H57.5M50 8v2.5"/><circle cx="50" cy="10.5" r="1.2"/><path d="M38 93.333A12 12 0 0 1 62 93.333M50 90V93.333"/><path d="M.4 93.333H99.6"/></g>
<g class="shot-area-label"><text x="9" y="11">左コーナー3P</text><text x="91" y="11">右コーナー3P</text><text x="17" y="55">左45°3P</text><text x="83" y="55">右45°3P</text><text x="50" y="76">正面3P</text><text x="23" y="15">左0°ミドル</text><text x="77" y="15">右0°ミドル</text><text x="23" y="36">左ミドル</text><text x="77" y="36">右ミドル</text><text x="50" y="47">正面ミドル</text><text x="50" y="30">インサイド</text><text x="50" y="17">ゴール下</text><text x="50" y="102">バックコート3P</text></g>
${areaOverlaySvg(selectedAreas)}<g class="shot-markers">${markers.map(point => `${point.wasFouled ? `<circle class="shot-foul-ring" cx="${point.x.toFixed(3)}" cy="${point.y.toFixed(3)}" r="2.25"/>` : ''}<circle class="shot-marker ${point.result}" cx="${point.x.toFixed(3)}" cy="${point.y.toFixed(3)}" r="1.5"/>`).join('')}</g>
<rect class="court-tap-surface" width="100" height="${SHOT_COURT_SIZE.height}"/></svg>`;
  }

  function openModal() {
    const games = targetGames();
    const items = statsForGames(games);
    const allShots = collectShots(items);
    const selectedAreas = new Set();
    let distance = 'all';
    let side = 'all';
    let selectedType = '';
    let filters = { value: '', result: '', type: '', foul: '' };

    scrollY = window.scrollY || 0;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('modal-open', 'bg-input');
    document.documentElement.classList.add('modal-open');

    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal shot-modal shot-analysis-modal team-shot-analysis-modal"><div class="card">
      <div class="shot-modal-head"><div><h2>チーム シュートポイント分析</h2><div class="team-shot-analysis-meta"><span>${modeLabel()}</span><span>${targetLabel(games)}</span><span>対象試合：${games.length}試合</span><span>対象シュート：${allShots.length}本</span></div></div><button type="button" class="btn ghost shot-close" aria-label="閉じる">×</button></div>
      <div id="teamAnalysisShotCourt"></div>
      <div class="shot-marker-legend"><span><i class="made"></i>成功</span><span><i class="missed"></i>失敗</span><span><i class="fouled"></i>ファウルあり</span></div>
      <div class="team-shot-analysis-panel">
        <div class="tag-head"><div class="tag-title">複合エリア分析</div><div class="tag-current" data-team-tag-current></div></div>
        <div class="tag-label">距離</div><div class="tag-buttons" data-team-distance></div>
        <div class="tag-label">方向</div><div class="tag-buttons side" data-team-side></div>
        <div class="team-shot-analysis-result"><div><span>登録</span><b data-team-registered>0</b></div><div><span>FG試投</span><b data-team-attempts>0</b></div><div><span>成功</span><b data-team-made>0</b></div><div class="rate"><span>成功率</span><b data-team-rate>-</b></div></div>
      </div>
      <div class="team-shot-analysis-filter-row" data-team-primary-filters></div>
      <div class="team-shot-analysis-filter-row" data-team-type-filters></div>
      <div class="team-analysis-shot-table-head"><span>エリア</span><span>登録</span><span>FG試投</span><span>成功</span><span>成功率</span><span>試投割合</span></div>
      <div data-team-area-rows></div>
      <div class="team-analysis-shot-type-detail" data-team-type-detail></div>
    </div></div>`;

    const close = () => {
      root.innerHTML = '';
      document.body.classList.remove('modal-open', 'bg-input');
      document.documentElement.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };

    root.querySelector('.shot-close').onclick = close;

    const filteredBase = () => filterShots(allShots, {
      shotValueFilter: filters.value,
      resultFilter: filters.result,
      shotTypeFilter: filters.type,
      foulFilter: filters.foul
    });

    const hasComposite = () => distance !== 'all' || side !== 'all';
    const areaFiltered = shots => selectedAreas.size
      ? shots.filter(shot => selectedAreas.has(shotAreaForRecord(shot)))
      : (hasComposite() ? aggregateShotAnalysis(shots, { distance, side }).shots : shots);

    const areaRows = (shots, visibleAreaIds = []) => {
      const visible = new Set(visibleAreaIds);
      const totals = aggregateShots(shots, 'shotArea', SHOT_AREA_ORDER);
      const totalAttempts = shots.filter(countsAsFieldGoalAttempt).length;
      return SHOT_AREA_ORDER.filter(id => (!visible.size || visible.has(id)) && totals[id].registered > 0).map(id => {
        const value = totals[id];
        const rate = value.attempts ? `${(value.made / value.attempts * 100).toFixed(1)}%` : '-';
        const share = totalAttempts ? `${(value.attempts / totalAttempts * 100).toFixed(1)}%` : '0.0%';
        return `<div class="team-analysis-shot-row" data-team-analysis-area="${id}"><span>${SHOT_AREAS[id].label}</span><b>${value.registered}</b><b>${value.attempts}</b><b>${value.made}</b><b>${rate}</b><b>${share}</b></div>`;
      }).join('') || '<p class="sub">シュート明細はありません</p>';
    };

    const typeRows = (shots, areaIds = []) => {
      const selected = new Set(areaIds);
      if (!selected.size) return '<p class="sub">コートから確認するエリアを選択してください</p>';
      const areaShots = shots.filter(shot => selected.has(shotAreaForRecord(shot)));
      const totals = aggregateShots(areaShots, 'shotType', SHOT_TYPE_ORDER);
      const title = [...selected].map(id => SHOT_AREAS[id]?.label).filter(Boolean).join('＋');
      const rows = SHOT_TYPE_ORDER.filter(id => totals[id].registered > 0).map(id => {
        const value = totals[id];
        const rate = value.attempts ? `${(value.made / value.attempts * 100).toFixed(1)}%` : '-';
        return `<button type="button" class="team-analysis-shot-type-row type ${selectedType === id ? 'active' : ''}" data-team-analysis-type="${id}"><span>${shotTypeButtonLabel(id)}</span><b>${value.registered}</b><b>${value.attempts}</b><b>${value.made}</b><b>${rate}</b></button>`;
      }).join('') || '<p class="sub">種類別明細はありません</p>';
      return `<div class="section-title">${title}・シュート種類別</div><div class="team-analysis-shot-table-head type"><span>種類</span><span>登録</span><span>FG試投</span><span>成功</span><span>成功率</span></div>${rows}`;
    };

    const buttonSet = (options, current, field) => options.map(([value, label]) => `<button type="button" class="tag-button ${current === value ? 'active' : ''}" data-team-tag-field="${field}" data-value="${value}">${label}</button>`).join('');

    const render = () => {
      const base = filteredBase();
      const modeShots = areaFiltered(base);
      const displayShots = selectedType ? modeShots.filter(shot => normalizedShotType(shot) === selectedType) : modeShots;
      const visibleAreas = selectedAreas.size ? [...selectedAreas] : [];
      const aggregate = aggregateShotAnalysis(base, { distance, side });
      root.querySelector('[data-team-distance]').innerHTML = buttonSet(SHOT_ANALYSIS_DISTANCE_OPTIONS, distance, 'distance');
      root.querySelector('[data-team-side]').innerHTML = buttonSet(SHOT_ANALYSIS_SIDE_OPTIONS, side, 'side');
      const distanceLabel = SHOT_ANALYSIS_DISTANCE_OPTIONS.find(([id]) => id === distance)?.[1] || distance;
      const sideLabel = SHOT_ANALYSIS_SIDE_OPTIONS.find(([id]) => id === side)?.[1] || side;
      root.querySelector('[data-team-tag-current]').textContent = `${distanceLabel} × ${sideLabel}`;
      root.querySelector('[data-team-registered]').textContent = aggregate.registered;
      root.querySelector('[data-team-attempts]').textContent = aggregate.attempts;
      root.querySelector('[data-team-made]').textContent = aggregate.made;
      root.querySelector('[data-team-rate]').textContent = aggregate.rate;
      root.querySelector('#teamAnalysisShotCourt').innerHTML = shotCourtSvg(displayShots, visibleAreas);

      const primary = [['value','2','2P'],['value','3','3P'],['result','made','Made'],['result','missed','Miss'],['foul','yes','ファウル']];
      const canSelect = (field, value) => filters[field] === value || areaFiltered(filterShots(allShots, { shotValueFilter: field === 'value' ? value : filters.value, resultFilter: field === 'result' ? value : filters.result, shotTypeFilter: field === 'type' ? value : filters.type, foulFilter: field === 'foul' ? value : filters.foul })).length > 0;
      root.querySelector('[data-team-primary-filters]').innerHTML = primary.map(([field,value,label]) => `<button type="button" class="btn small ghost ${filters[field] === value ? 'active' : ''}" data-team-filter="${field}" data-value="${value}" aria-pressed="${filters[field] === value}" ${canSelect(field,value) ? '' : 'disabled'}>${label}</button>`).join('');
      root.querySelector('[data-team-type-filters]').innerHTML = SHOT_TYPE_ORDER.map(id => `<button type="button" class="btn small ghost ${filters.type === id ? 'active' : ''}" data-team-filter="type" data-value="${id}" aria-pressed="${filters.type === id}" ${canSelect('type',id) ? '' : 'disabled'}>${shotTypeButtonLabel(id)}</button>`).join('');
      root.querySelector('[data-team-area-rows]').innerHTML = areaRows(modeShots, visibleAreas);
      root.querySelector('[data-team-type-detail]').innerHTML = typeRows(base, visibleAreas);

      root.querySelectorAll('[data-team-tag-field]').forEach(button => button.onclick = () => {
        selectedAreas.clear();
        selectedType = '';
        if (button.dataset.teamTagField === 'distance') distance = button.dataset.value;
        else side = button.dataset.value;
        render();
      });
      root.querySelectorAll('[data-team-filter]').forEach(button => button.onclick = () => {
        if (button.disabled) return;
        const field = button.dataset.teamFilter;
        const value = button.dataset.value;
        filters[field] = filters[field] === value ? '' : value;
        selectedType = '';
        render();
      });
      root.querySelectorAll('[data-team-analysis-type]').forEach(button => button.onclick = () => {
        selectedType = selectedType === button.dataset.teamAnalysisType ? '' : button.dataset.teamAnalysisType;
        render();
      });
      const svg = root.querySelector('#teamAnalysisShotCourt .shot-court');
      if (svg) svg.onclick = event => {
        const rect = svg.getBoundingClientRect();
        const x = Math.max(0, Math.min(SHOT_COURT_SIZE.width, (event.clientX - rect.left) / rect.width * SHOT_COURT_SIZE.width));
        const y = Math.max(0, Math.min(SHOT_COURT_SIZE.height, (event.clientY - rect.top) / rect.height * SHOT_COURT_SIZE.height));
        const areaId = detectShotArea(x, y);
        if (!areaId) return;
        distance = 'all';
        side = 'all';
        selectedType = '';
        if (selectedAreas.has(areaId)) selectedAreas.delete(areaId);
        else selectedAreas.add(areaId);
        render();
      };
    };

    render();
  }

  function injectButton() {
    const screen = document.querySelector('.team-screen:not(.team-stat-detail)');
    if (!screen) return;
    const card = [...screen.querySelectorAll('.analysis-shot-card')].find(el => el.querySelector('.section-title')?.textContent?.includes('シュート内訳'));
    if (!card || card.querySelector('.team-shot-analysis-button')) return;
    const title = card.querySelector('.section-title');
    if (!title) return;
    const heading = document.createElement('div');
    heading.className = 'team-shot-analysis-heading';
    title.parentNode.insertBefore(heading, title);
    heading.appendChild(title);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small ghost team-shot-analysis-button';
    button.textContent = 'コート分析';
    button.onclick = event => { event.stopPropagation(); openModal(); };
    heading.appendChild(button);
  }

  const observer = new MutationObserver(() => requestAnimationFrame(injectButton));
  observer.observe(document.getElementById('view') || document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectButton, { once: true });
  else injectButton();
})();
