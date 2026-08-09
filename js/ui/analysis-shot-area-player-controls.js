import { state } from '../core/state.js';
import { setLastPlayerId } from '../core/storage.js';
import { detectShotArea, SHOT_COURT_SIZE, SHOT_AREAS } from '../calculations/shot-calculations.js?v=20260804-shot-types-v19';

(() => {
  const MODAL_SELECTOR = '#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal)';
  const selectedAreas = new Set();
  let suppressClickUntil = 0;

  const style = document.createElement('style');
  style.textContent = `
    ${MODAL_SELECTOR} .analysis-player-switcher{display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#0b1530;position:relative;z-index:30}
    ${MODAL_SELECTOR} .analysis-player-switcher label{flex:0 0 auto;color:#aab5d1;font-size:11px;font-weight:800}
    ${MODAL_SELECTOR} .analysis-player-switcher select{flex:1;min-width:0;min-height:42px;padding:8px 10px;color:#fff;background:#111b36;border:1px solid #475a86;border-radius:9px;font-size:13px;font-weight:800;pointer-events:auto!important;touch-action:manipulation!important}
    ${MODAL_SELECTOR} .analysis-area-selection-status{margin:6px 0 8px;padding:7px 9px;border-radius:9px;background:rgba(138,43,226,.12);border:1px solid rgba(167,139,250,.35);font-size:10px;font-weight:800;color:#ddd6fe}
    ${MODAL_SELECTOR} [data-analysis-shot-area].analysis-multi-selected{background:linear-gradient(135deg,#8a2be2,#6514cb)!important;border-color:#c4b5fd!important;color:#fff!important;box-shadow:inset 0 0 0 2px #a78bfa!important}
    ${MODAL_SELECTOR} .shot-marker.analysis-area-muted,${MODAL_SELECTOR} .shot-foul-ring.analysis-area-muted,${MODAL_SELECTOR} .shot-selection-ring.analysis-area-muted{opacity:.12!important}
  `;
  document.head.appendChild(style);

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const playerLabel = p => `${p?.number ? `No.${p.number} ` : ''}${p?.name || '名称未登録'}`;
  const areaLabel = id => SHOT_AREAS?.[id]?.label || SHOT_AREAS?.[id]?.name || id;
  const pointKey = (x,y) => `${Number(x).toFixed(3)}:${Number(y).toFixed(3)}`;

  function ensurePlayerSwitcher(modal) {
    if (!modal) return;
    let wrap = modal.querySelector('.analysis-player-switcher');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'analysis-player-switcher';
      const anchor = modal.querySelector('.shot-analysis-head') || modal.firstElementChild;
      if (anchor?.parentElement) anchor.insertAdjacentElement('afterend', wrap); else modal.prepend(wrap);
    }
    wrap.innerHTML = `<label for="analysisPlayerSelect">選手変更</label><select id="analysisPlayerSelect" aria-label="分析対象選手を変更">${state.players.map(p => `<option value="${esc(p.id)}" ${p.id===state.lastPlayerId?'selected':''}>${esc(playerLabel(p))}</option>`).join('')}</select>`;
    const select = wrap.querySelector('select');
    select.onchange = () => {
      const nextId = select.value;
      if (!nextId || nextId === state.lastPlayerId) return;
      selectedAreas.clear();
      state.lastPlayerId = nextId;
      setLastPlayerId(nextId);
      document.dispatchEvent(new CustomEvent('analysis-player-change-requested',{detail:{playerId:nextId}}));
      const close = modal.querySelector('[data-shot-analysis-close]');
      close?.click();
      setTimeout(() => {
        const trigger = document.querySelector('[data-open-shot-analysis],#openShotAnalysis');
        if (trigger) trigger.click();
        else window.openShotAnalysis?.();
      }, 60);
    };
  }

  function ensureStatus(modal) {
    let status = modal.querySelector('.analysis-area-selection-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'analysis-area-selection-status';
      const court = modal.querySelector('#analysisShotCourt');
      court?.insertAdjacentElement('beforebegin', status);
    }
    if (status) status.textContent = selectedAreas.size ? `選択エリア：${[...selectedAreas].map(areaLabel).join(' / ')}（再タップで解除）` : 'コートのエリアをタップすると単一・複数エリアを選択できます';
  }

  function courtPoint(event, svg) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {x:Math.max(0,Math.min(SHOT_COURT_SIZE.width,(event.clientX-rect.left)/rect.width*SHOT_COURT_SIZE.width)),y:Math.max(0,Math.min(SHOT_COURT_SIZE.height,(event.clientY-rect.top)/rect.height*SHOT_COURT_SIZE.height))};
  }

  function syncAreaRows(modal) {
    modal.querySelectorAll('[data-analysis-shot-area]').forEach(row => row.classList.toggle('analysis-multi-selected', selectedAreas.has(row.dataset.analysisShotArea)));
  }

  function syncMarkers(modal) {
    const court = modal.querySelector('#analysisShotCourt .shot-court');
    if (!court) return;
    if (!selectedAreas.size) {
      court.querySelectorAll('.analysis-area-muted').forEach(el => el.classList.remove('analysis-area-muted'));
      return;
    }
    const selectedKeys = new Set();
    court.querySelectorAll('.shot-marker').forEach(marker => {
      const x = Number(marker.getAttribute('cx')), y = Number(marker.getAttribute('cy'));
      const selected = selectedAreas.has(detectShotArea(x,y));
      marker.classList.toggle('analysis-area-muted', !selected);
      if (selected) selectedKeys.add(pointKey(x,y));
    });
    court.querySelectorAll('.shot-foul-ring,.shot-selection-ring').forEach(el => el.classList.toggle('analysis-area-muted', !selectedKeys.has(pointKey(el.getAttribute('cx'),el.getAttribute('cy')))));
  }

  function applySelection(modal) {
    ensureStatus(modal);
    syncAreaRows(modal);
    syncMarkers(modal);
    document.dispatchEvent(new CustomEvent('analysis-single-areas-changed',{detail:{areas:[...selectedAreas]}}));
  }

  function toggleArea(modal, areaId) {
    if (!areaId) return;
    document.dispatchEvent(new CustomEvent('analysis-composite-reset-requested'));
    if (selectedAreas.has(areaId)) selectedAreas.delete(areaId); else selectedAreas.add(areaId);
    applySelection(modal);
  }

  function selectFromCourt(event) {
    const svg = event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);
    if (!svg) return false;
    if (event.target.closest?.('.shot-marker,.shot-foul-ring,.shot-selection-ring')) return false;
    const point = courtPoint(event, svg); if (!point) return false;
    const areaId = detectShotArea(point.x,point.y); if (!areaId) return false;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
    suppressClickUntil = performance.now()+450;
    toggleArea(svg.closest(MODAL_SELECTOR), areaId);
    return true;
  }

  document.addEventListener('analysis-composite-activated', () => {
    if (!selectedAreas.size) return;
    selectedAreas.clear();
    const modal = document.querySelector(MODAL_SELECTOR); if (modal) applySelection(modal);
  });

  document.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') selectFromCourt(event); }, {capture:true,passive:false});
  document.addEventListener('click', event => {
    const svg = event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);
    if (svg && performance.now()<suppressClickUntil) {event.preventDefault();event.stopImmediatePropagation();return;}
    if (event.detail!==0) selectFromCourt(event);
  }, true);

  const observer = new MutationObserver(() => {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (!modal) return;
    ensurePlayerSwitcher(modal); ensureStatus(modal); syncAreaRows(modal); syncMarkers(modal);
  });
  observer.observe(document.getElementById('modalRoot')||document.body,{childList:true,subtree:true});

  const init=()=>{const modal=document.querySelector(MODAL_SELECTOR);if(modal){ensurePlayerSwitcher(modal);ensureStatus(modal);applySelection(modal)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
