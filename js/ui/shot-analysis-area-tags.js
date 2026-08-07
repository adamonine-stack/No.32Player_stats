import { detectShotArea, FIBA_COURT } from '../calculations/shot-calculations.js?v=20260807-analysis-tags-v2';

(() => {
  const DISTANCE_OPTIONS = [
    ['all', '全て'],
    ['paint', 'ゴール下＋インサイド'],
    ['mid', 'ミドル'],
    ['three', '3P'],
    ['mid_three', 'ミドル＋3P']
  ];
  const SIDE_OPTIONS = [
    ['all', '全て'],
    ['left', '左'],
    ['center', '正面'],
    ['right', '右']
  ];

  const DISTANCE_LABELS = Object.fromEntries(DISTANCE_OPTIONS);
  const SIDE_LABELS = Object.fromEntries(SIDE_OPTIONS);

  const SIDE_BY_AREA = Object.freeze({
    left_zero_mid: 'left',
    left_mid: 'left',
    center_mid: 'center',
    right_mid: 'right',
    right_zero_mid: 'right',
    left_corner_3p: 'left',
    left_45_3p: 'left',
    center_3p: 'center',
    right_45_3p: 'right',
    right_corner_3p: 'right'
  });

  const DISTANCE_BY_AREA = Object.freeze({
    under_basket: 'under',
    inside: 'inside',
    left_zero_mid: 'mid',
    left_mid: 'mid',
    center_mid: 'mid',
    right_mid: 'mid',
    right_zero_mid: 'mid',
    left_corner_3p: 'three',
    left_45_3p: 'three',
    center_3p: 'three',
    right_45_3p: 'three',
    right_corner_3p: 'three',
    backcourt_3p: 'three'
  });

  const style = document.createElement('style');
  style.textContent = `
    .shot-analysis-tag-panel{margin:10px 0 12px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(2,6,23,.38)}
    .shot-analysis-tag-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
    .shot-analysis-tag-title{font-size:14px;font-weight:900;color:#fff}
    .shot-analysis-tag-current{font-size:10px;font-weight:800;color:var(--orange,#f97316);text-align:right}
    .shot-analysis-tag-group{margin-top:8px}
    .shot-analysis-tag-label{font-size:11px;font-weight:800;color:var(--muted,#9ca3af);margin-bottom:5px}
    .shot-analysis-tag-buttons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
    .shot-analysis-tag-buttons.side{grid-template-columns:repeat(4,minmax(0,1fr))}
    .shot-analysis-tag-btn{min-width:0;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:rgba(255,255,255,.05);color:#fff;padding:8px 4px;font-size:11px;font-weight:800;line-height:1.15;touch-action:manipulation}
    .shot-analysis-tag-btn.active{background:linear-gradient(135deg,#8a2be2,#6514cb);border-color:transparent}
    .shot-analysis-tag-result{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden}
    .shot-analysis-tag-result>div{text-align:center;padding:9px 5px;border-right:1px solid rgba(255,255,255,.12)}
    .shot-analysis-tag-result>div:last-child{border-right:0}
    .shot-analysis-tag-result span{display:block;color:var(--muted,#9ca3af);font-size:10px;font-weight:800}
    .shot-analysis-tag-result b{display:block;margin-top:4px;color:#fff;font-size:20px;font-weight:900}
    .shot-analysis-tag-result .rate b{color:var(--orange,#f97316)}
    .shot-analysis-tag-note{margin-top:7px;color:var(--muted,#9ca3af);font-size:10px;line-height:1.4}
    .shot-marker.analysis-tag-muted{opacity:.12!important}
    .shot-foul-ring.analysis-tag-muted,.shot-selection-ring.analysis-tag-muted{opacity:.12!important}
    @media(max-width:600px){
      .shot-analysis-tag-panel{padding:9px;margin:8px 0 10px}
      .shot-analysis-tag-head{align-items:flex-start}
      .shot-analysis-tag-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}
      .shot-analysis-tag-buttons.side{grid-template-columns:repeat(4,minmax(0,1fr))}
      .shot-analysis-tag-btn{padding:7px 2px;font-size:10px}
      .shot-analysis-tag-result b{font-size:17px}
      .shot-analysis-tag-result span{font-size:9px}
    }
  `;
  document.head.appendChild(style);

  let activeModal = null;
  let snapshot = [];
  let snapshotSignature = '';
  let distanceFilter = 'all';
  let sideFilter = 'all';
  let renderTimer = 0;

  const key = (x, y) => `${Number(x).toFixed(3)}:${Number(y).toFixed(3)}`;

  function insideSide(x) {
    const width = FIBA_COURT.paintRight - FIBA_COURT.paintLeft;
    const leftBoundary = FIBA_COURT.paintLeft + width / 3;
    const rightBoundary = FIBA_COURT.paintLeft + width * 2 / 3;
    if (x < leftBoundary) return 'left';
    if (x > rightBoundary) return 'right';
    return 'center';
  }

  function tagsForPoint(x, y) {
    const area = detectShotArea(x, y);
    const distance = DISTANCE_BY_AREA[area] || 'other';
    let side = SIDE_BY_AREA[area] || null;
    if (area === 'inside') side = insideSide(Number(x));
    return { area, distance, side };
  }

  function matchesDistance(distance) {
    if (distanceFilter === 'all') return true;
    if (distanceFilter === 'paint') return distance === 'under' || distance === 'inside';
    if (distanceFilter === 'mid') return distance === 'mid';
    if (distanceFilter === 'three') return distance === 'three';
    if (distanceFilter === 'mid_three') return distance === 'mid' || distance === 'three';
    return true;
  }

  function matchesShot(shot) {
    return matchesDistance(shot.distance) && (sideFilter === 'all' || shot.side === sideFilter);
  }

  function capture(modal) {
    const court = modal.querySelector('#analysisShotCourt .shot-court');
    if (!court) return [];
    const foulKeys = new Set([...court.querySelectorAll('.shot-foul-ring')].map(circle => key(circle.getAttribute('cx'), circle.getAttribute('cy'))));
    return [...court.querySelectorAll('.shot-marker')].map(circle => {
      const x = Number(circle.getAttribute('cx'));
      const y = Number(circle.getAttribute('cy'));
      const result = circle.classList.contains('made') ? 'made' : 'missed';
      const wasFouled = foulKeys.has(key(x, y));
      return { x, y, result, wasFouled, ...tagsForPoint(x, y) };
    });
  }

  function signatureFor(shots) {
    return shots.map(shot => `${key(shot.x, shot.y)}:${shot.result}:${shot.wasFouled ? 1 : 0}`).join('|');
  }

  function buttonHtml(options, current, field) {
    return options.map(([value, label]) => `<button type="button" class="shot-analysis-tag-btn ${current === value ? 'active' : ''}" data-analysis-tag-filter="${field}" data-value="${value}" aria-pressed="${current === value}">${label}</button>`).join('');
  }

  function ensurePanel(modal) {
    if (modal.querySelector('.shot-analysis-tag-panel')) return;
    const quick = modal.querySelector('#analysisQuickFilters');
    if (!quick) return;
    const panel = document.createElement('div');
    panel.className = 'shot-analysis-tag-panel';
    panel.innerHTML = `
      <div class="shot-analysis-tag-head"><div class="shot-analysis-tag-title">複合エリア分析</div><div class="shot-analysis-tag-current" data-tag-current></div></div>
      <div class="shot-analysis-tag-group"><div class="shot-analysis-tag-label">距離</div><div class="shot-analysis-tag-buttons" data-tag-distance></div></div>
      <div class="shot-analysis-tag-group"><div class="shot-analysis-tag-label">方向</div><div class="shot-analysis-tag-buttons side" data-tag-side></div></div>
      <div class="shot-analysis-tag-result">
        <div><span>登録</span><b data-tag-registered>0</b></div>
        <div><span>FG試投</span><b data-tag-attempts>0</b></div>
        <div><span>成功</span><b data-tag-made>0</b></div>
        <div class="rate"><span>成功率</span><b data-tag-rate>-</b></div>
      </div>
      <div class="shot-analysis-tag-note">方向指定時、ゴール下は集計対象外です。インサイドの左・正面・右は登録座標をペイント幅で3分割して内部判定します。コート図面・登録エリアには変更ありません。</div>`;
    quick.parentElement?.insertBefore(panel, quick);
    panel.addEventListener('click', event => {
      const button = event.target.closest('[data-analysis-tag-filter]');
      if (!button) return;
      if (button.dataset.analysisTagFilter === 'distance') distanceFilter = button.dataset.value;
      if (button.dataset.analysisTagFilter === 'side') sideFilter = button.dataset.value;
      renderPanel(modal);
    });
  }

  function applyMarkerEmphasis(modal) {
    const court = modal.querySelector('#analysisShotCourt .shot-court');
    if (!court) return;
    const selectedKeys = new Set(snapshot.filter(matchesShot).map(shot => key(shot.x, shot.y)));
    court.querySelectorAll('.shot-marker,.shot-foul-ring,.shot-selection-ring').forEach(circle => {
      const muted = !selectedKeys.has(key(circle.getAttribute('cx'), circle.getAttribute('cy')));
      circle.classList.toggle('analysis-tag-muted', muted);
    });
  }

  function renderPanel(modal) {
    ensurePanel(modal);
    const panel = modal.querySelector('.shot-analysis-tag-panel');
    if (!panel) return;
    panel.querySelector('[data-tag-distance]').innerHTML = buttonHtml(DISTANCE_OPTIONS, distanceFilter, 'distance');
    panel.querySelector('[data-tag-side]').innerHTML = buttonHtml(SIDE_OPTIONS, sideFilter, 'side');
    panel.querySelector('[data-tag-current]').textContent = `${DISTANCE_LABELS[distanceFilter]} × ${SIDE_LABELS[sideFilter]}`;
    const selected = snapshot.filter(matchesShot);
    const registered = selected.length;
    const attempts = selected.filter(shot => shot.result === 'made' || (shot.result === 'missed' && !shot.wasFouled)).length;
    const made = selected.filter(shot => shot.result === 'made').length;
    const rate = attempts ? `${(made / attempts * 100).toFixed(1)}%` : '-';
    panel.querySelector('[data-tag-registered]').textContent = String(registered);
    panel.querySelector('[data-tag-attempts]').textContent = String(attempts);
    panel.querySelector('[data-tag-made]').textContent = String(made);
    panel.querySelector('[data-tag-rate]').textContent = rate;
    applyMarkerEmphasis(modal);
  }

  function initialize(modal) {
    const fresh = activeModal !== modal;
    activeModal = modal;
    if (fresh) {
      distanceFilter = 'all';
      sideFilter = 'all';
      snapshot = [];
      snapshotSignature = '';
    }

    ensurePanel(modal);
    const nextSnapshot = capture(modal);
    const nextSignature = signatureFor(nextSnapshot);
    if (nextSignature !== snapshotSignature) {
      snapshot = nextSnapshot;
      snapshotSignature = nextSignature;
    }
    renderPanel(modal);
  }

  function scan() {
    const modal = document.querySelector('#modalRoot .shot-analysis-modal');
    if (!modal) {
      activeModal = null;
      snapshot = [];
      snapshotSignature = '';
      return;
    }
    clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => initialize(modal), 20);
  }

  const observer = new MutationObserver(records => {
    const meaningful = records.some(record => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (!target) return false;
      if (target.closest('.shot-analysis-tag-panel')) return false;
      return target.closest('#analysisShotCourt, #analysisQuickFilters, #analysisAreaRows, #analysisShotTypeDetail, #modalRoot') !== null;
    });
    if (meaningful) scan();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
  else scan();
})();
