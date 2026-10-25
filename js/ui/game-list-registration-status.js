import { state } from '../core/state.js?v=20260915-settings-stable-v1';
import { gameListRegistrationStatus, foulRegistrationQuarterCount, gameListActionStatus } from '../calculations/game-list-status-calculations.js?v=20261025-action-status-v3';

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
    .game-list-registration-status{display:flex;flex-wrap:nowrap;white-space:nowrap;overflow-x:auto;align-items:center;gap:6px;margin-top:6px;font-size:12px;font-weight:700;line-height:1.35;color:var(--muted,#9aa7bd)}
    .game-list-registration-status>span{flex:0 0 auto}
.game-list-registration-status .stats-order-incomplete{color:#fb923c}
    .game-list-registration-status .playing-time-registered{color:#7dd3fc}
    .game-sort-item .game-line2>span:last-child{white-space:nowrap}
    @media(max-width:800px){
      .game-list-registration-status{font-size:clamp(9px,2.45vw,11px);gap:4px;margin-top:5px}
      .game-sort-item .game-line2{align-items:center}
    }
  `;
  document.head.appendChild(style);
}

function publicSummaryForGame(game) {
  const summary = (state.publicGameSummaries || []).find(item => (item.gameId || item.id) === game.id);
  return summary && Number(summary.schemaVersion) >= 4 ? summary : null;
}

function statusHtml(game) {
  const summary = publicSummaryForGame(game);
  const status = summary ? {
    registeredQuarters: Number(summary.registeredQuarters) || 0,
    totalQuarters: Number(summary.totalQuarters) || 0,
    hasShotPoints: Boolean(summary.hasShotPoints)
  } : gameListRegistrationStatus(game, state.stats);
  const participation = summary ? {
    registered: Number(summary.participationRegisteredQuarters) || 0,
    total: Number(summary.participationTotalQuarters) || 0
  } : participationStatus(game);
  const playingTime = participation.registered
    ? `<span class="playing-time-registered">出場時間 ${participation.registered}/${participation.total}Q</span>`
    : '';
  const actionStatus = summary || gameListActionStatus(game, state.stats);
  return `<span class="${actionStatus.hasUnorderedNonShotStats ? 'stats-order-incomplete' : ''}" title="${actionStatus.hasUnorderedNonShotStats ? 'シュート以外に順序未登録のスタッツがあります' : ''}">スタッツ ${status.registeredQuarters}/${status.totalQuarters}Q</span>${playingTime}${actionStatus.hasFoulRegistration ? '<span class="foul-registration-status">F 登録済</span>' : ''}`;
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
