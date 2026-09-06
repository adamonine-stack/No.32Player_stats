import { state } from '../core/state.js';
import { gameListRegistrationStatus } from '../calculations/game-list-status-calculations.js';

const STYLE_ID = 'game-list-registration-status-style';

function participationStatus(game) {
  const total = Math.max(0, Number(game.quarters || game.quarterCount || 0));
  let registered = 0;
  for (let quarter = 1; quarter <= total; quarter++) {
    const participation = game.quarterParticipation?.[`q${quarter}`];
    if (new Set((participation?.starters || []).filter(Boolean)).size === 5) registered++;
  }
  return { registered, total };
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .game-list-registration-status{display:flex;flex-wrap:wrap;align-items:center;gap:5px 12px;margin-top:6px;font-size:12px;font-weight:700;line-height:1.35;color:var(--muted,#9aa7bd)}
    .game-list-registration-status .shot-point-registered{color:#5ed6a7}
    .game-list-registration-status .playing-time-registered{color:#7dd3fc}
    .game-sort-item .game-line2>span:last-child{white-space:nowrap}
    @media(max-width:800px){
      .game-list-registration-status{font-size:11px;gap:4px 10px;margin-top:5px}
      .game-sort-item .game-line2{align-items:center}
    }
  `;
  document.head.appendChild(style);
}

function statusHtml(game) {
  const status = gameListRegistrationStatus(game, state.stats);
  const participation = participationStatus(game);
  const playingTime = participation.registered
    ? `<span class="playing-time-registered">出場時間 ${participation.registered}/${participation.total}Q</span>`
    : '';
  return `<span>スタッツ ${status.registeredQuarters}/${status.totalQuarters}Q</span>${status.hasShotPoints ? '<span class="shot-point-registered">シュートポイント登録済</span>' : ''}${playingTime}`;
}

function simplifyPrimaryLine(card, game) {
  const summary = card.querySelector('.game-line2 > span:last-child');
  if (!summary) return;
  const quarters = Number(game.quarters || game.quarterCount || 0);
  const scoreText = summary.textContent.match(/[○×△]\s*\d+\s*-\s*\d+\s*$/)?.[0] || '';
  const text = `${quarters}Q${scoreText ? `　${scoreText}` : ''}`;
  if (summary.textContent !== text) summary.textContent = text;
}

function updateGameListStatus() {
  if (state.tab !== 'games') return;
  ensureStyles();
  document.querySelectorAll('#view .game-sort-item[data-game-id]').forEach(card => {
    const game = state.games.find(item => item.id === card.dataset.gameId);
    if (!game) return;
    simplifyPrimaryLine(card, game);
    let status = card.querySelector('.game-list-registration-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'game-list-registration-status';
      const line2 = card.querySelector('.game-line2');
      (line2 || card).insertAdjacentElement('afterend', status);
    }
    const html = statusHtml(game);
    if (status.innerHTML !== html) status.innerHTML = html;
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