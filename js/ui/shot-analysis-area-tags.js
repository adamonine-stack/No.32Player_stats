import { SHOT_ANALYSIS_DISTANCE_OPTIONS, SHOT_ANALYSIS_SIDE_OPTIONS, aggregateShotAnalysis } from '../calculations/shot-analysis-calculations.js?v=20260807-analysis-core-v2';

(() => {
  const DISTANCE_LABELS = Object.fromEntries(SHOT_ANALYSIS_DISTANCE_OPTIONS);
  const SIDE_LABELS = Object.fromEntries(SHOT_ANALYSIS_SIDE_OPTIONS);

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

  function capture(modal) {
    const court = modal.querySelector('#analysisShotCourt .shot-court');
    if (!court) return [];
    const foulKeys = new Set([...court.querySelectorAll('.shot-foul-ring')].map(circle => key(circle.getAttribute('cx'), circle.getAttribute('cy'))));
    return [...court.querySelectorAll('.shot-marker')].map((circle, index) => {
      const shotX = Number(circle.getAttribute('cx'));
      const shotY = Number(circle.getAttribute('cy'));
      const result = circle.classList.contains('made') ? 'made' : 'missed';
      return {
        id: `analysis_marker_${index}`,
        shotX,
        shotY,
        result,
        wasFouled: foulKeys.has(key(shotX, shotY))
      };
    });
  }

  function signatureFor(shots) {
    return shots.map(shot => `${key(shot.shotX, shot.shotY)}:${shot.result}:${shot.wasFouled ? 1 : 0}`).join('|');
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

  function applyMarkerEmphasis(modal, selectedShots) {
    const court = modal.querySelector('#analysisShotCourt .shot-court');
    if (!court) return;
    const selectedKeys = new Set(selectedShots.map(shot => key(shot.shotX, shot.shotY)));
    court.querySelectorAll('.shot-marker,.shot-foul-ring,.shot-selection-ring').forEach(circle => {
      const muted = !selectedKeys.has(key(circle.getAttribute('cx'), circle.getAttribute('cy')));
      circle.classList.toggle('analysis-tag-muted', muted);
    });
  }

  function renderPanel(modal) {
    ensurePanel(modal);
    const panel = modal.querySelector('.shot-analysis-tag-panel');
    if (!panel) return;
    panel.querySelector('[data-tag-distance]').innerHTML = buttonHtml(SHOT_ANALYSIS_DISTANCE_OPTIONS, distanceFilter, 'distance');
    panel.querySelector('[data-tag-side]').innerHTML = buttonHtml(SHOT_ANALYSIS_SIDE_OPTIONS, sideFilter, 'side');
    panel.querySelector('[data-tag-current]').textContent = `${DISTANCE_LABELS[distanceFilter]} × ${SIDE_LABELS[sideFilter]}`;
    const aggregate = aggregateShotAnalysis(snapshot, { distance: distanceFilter, side: sideFilter });
    panel.querySelector('[data-tag-registered]').textContent = String(aggregate.registered);
    panel.querySelector('[data-tag-attempts]').textContent = String(aggregate.attempts);
    panel.querySelector('[data-tag-made]').textContent = String(aggregate.made);
    panel.querySelector('[data-tag-rate]').textContent = aggregate.rate;
    applyMarkerEmphasis(modal, aggregate.shots);
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
    const modal = document.querySelector('#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal)');
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
