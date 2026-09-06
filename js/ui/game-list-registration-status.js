import { state } from '../core/state.js';
import { gameListRegistrationStatus } from '../calculations/game-list-status-calculations.js';

const STYLE_ID = 'game-list-registration-status-style';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .game-list-registration-status{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:5px;font-size:12px;font-weight:700;line-height:1.35;color:var(--muted,#9aa7bd)}
    .game-list-registration-status .shot-point-registered{color:#5ed6a7}
    @media(max-width:800px){.game-list-registration-status{font-size:11px;gap:4px 8px}}
  `;
  document.head.appendChild(style);
}

function statusHtml(game) {
  const status = gameListRegistrationStatus(game, state.stats);
  return `<span>スタッツ ${status.registeredQuarters}/${status.totalQuarters}Q</span>${status.hasShotPoints ? '<span class="shot-point-registered">シュートポイント登録済</span>' : ''}`;
}

function updateGameListStatus() {
  if (state.tab !== 'games') return;
  ensureStyles();
  document.querySelectorAll('#view .game-sort-item[data-game-id]').forEach(card => {
    const game = state.games.find(item => item.id === card.dataset.gameId);
    if (!game) return;
    let status = card.querySelector('.game-list-registration-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'game-list-registration-status';
      const line2 = card.querySelector('.game-line2');
      (line2 || card).insertAdjacentElement('afterend', status);
    }
    status.innerHTML = statusHtml(game);
  });
}

let scheduled = false;
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    updateGameListStatus();
  });
}

new MutationObserver(scheduleUpdate).observe(document.getElementById('view'), { childList: true, subtree: true });
window.addEventListener('load', scheduleUpdate);
scheduleUpdate();
