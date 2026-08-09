import { state } from '../core/state.js';
import { setLastPlayerId } from '../core/storage.js';
import { detectShotArea, SHOT_COURT_SIZE } from '../calculations/shot-calculations.js?v=20260804-shot-types-v19';

(() => {
  const MODAL_SELECTOR = '#modalRoot .shot-analysis-modal:not(.team-shot-analysis-modal)';
  let suppressClickUntil = 0;

  const style = document.createElement('style');
  style.textContent = `
    ${MODAL_SELECTOR} .analysis-player-switcher{
      display:flex;align-items:center;gap:8px;margin:8px 0 4px;
      padding:8px 10px;border:1px solid rgba(255,255,255,.14);
      border-radius:10px;background:#0b1530;
    }
    ${MODAL_SELECTOR} .analysis-player-switcher label{
      flex:0 0 auto;color:#aab5d1;font-size:11px;font-weight:800;
    }
    ${MODAL_SELECTOR} .analysis-player-switcher select{
      flex:1;min-width:0;min-height:40px;padding:8px 10px;
      color:#fff;background:#111b36;border:1px solid #475a86;border-radius:9px;
      font-size:13px;font-weight:800;
    }
  `;
  document.head.appendChild(style);

  function escapeHtml(value='') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function playerLabel(player={}) {
    const number = player.number ? `No.${player.number} ` : '';
    return `${number}${player.name || '名称未登録'}`;
  }

  function ensurePlayerSwitcher(modal) {
    if (!modal || modal.querySelector('.analysis-player-switcher')) return;
    const conditions = modal.querySelector('.shot-analysis-conditions');
    if (!conditions) return;

    const wrap = document.createElement('div');
    wrap.className = 'analysis-player-switcher';
    wrap.innerHTML = `<label for="analysisPlayerSelect">選手変更</label><select id="analysisPlayerSelect" aria-label="分析対象選手を変更">${state.players.map(player => `<option value="${escapeHtml(player.id)}" ${player.id === state.lastPlayerId ? 'selected' : ''}>${escapeHtml(playerLabel(player))}</option>`).join('')}</select>`;
    conditions.insertAdjacentElement('afterend', wrap);

    const select = wrap.querySelector('#analysisPlayerSelect');
    select.onchange = () => {
      const nextId = select.value;
      if (!nextId || nextId === state.lastPlayerId) return;
      state.lastPlayerId = nextId;
      setLastPlayerId(nextId);
      requestAnimationFrame(() => window.openShotAnalysis?.());
    };
  }

  function courtPoint(event, svg) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(SHOT_COURT_SIZE.width, (event.clientX - rect.left) / rect.width * SHOT_COURT_SIZE.width)),
      y: Math.max(0, Math.min(SHOT_COURT_SIZE.height, (event.clientY - rect.top) / rect.height * SHOT_COURT_SIZE.height))
    };
  }

  function selectSingleAreaFromCourt(event) {
    const svg = event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);
    if (!svg) return false;
    const point = courtPoint(event, svg);
    if (!point) return false;
    const areaId = detectShotArea(point.x, point.y);
    if (!areaId) return false;

    const modal = svg.closest(MODAL_SELECTOR);
    const row = modal?.querySelector(`[data-analysis-shot-area="${CSS.escape(areaId)}"]`);
    if (!row) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    suppressClickUntil = performance.now() + 450;
    row.click();
    return true;
  }

  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    selectSingleAreaFromCourt(event);
  }, { capture:true, passive:false });

  document.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      const svg = event.target.closest?.(`${MODAL_SELECTOR} #analysisShotCourt .shot-court`);
      if (svg) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    if (event.detail === 0) return;
    selectSingleAreaFromCourt(event);
  }, true);

  const observer = new MutationObserver(() => {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (modal) ensurePlayerSwitcher(modal);
  });
  observer.observe(document.getElementById('modalRoot') || document.body, { childList:true, subtree:true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ensurePlayerSwitcher(document.querySelector(MODAL_SELECTOR)), { once:true });
  } else {
    ensurePlayerSwitcher(document.querySelector(MODAL_SELECTOR));
  }
})();
