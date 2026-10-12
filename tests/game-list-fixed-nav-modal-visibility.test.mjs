import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../js/ui/game-list-scroll-memory.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('game-list jump bar is hidden for every modal, including shot selection', () => {
  assert.match(code, /function isModalOpen\(\)/);
  assert.match(code, /querySelector\("#modalRoot > \.modal"\)/);
  assert.match(code, /&& !isModalOpen\(\)/);
  assert.doesNotMatch(code, /gameRegistrationOpen/);
  assert.match(code, /body:has\(#modalRoot > \.modal\) #gameListFixedNav\{display:none!important\}/);
});

test('game-list jump bar stays scoped to game list and refreshes on modal changes', () => {
  assert.match(code, /const visible = isGamesTab\(\)/);
  assert.match(code, /new MutationObserver\(scheduleRefresh\)\.observe\(modalRoot, \{ childList: true, subtree: true \}\)/);
  assert.match(code, /nav\.classList\.toggle\("is-visible", visible\)/);
  assert.match(html, /game-list-scroll-memory\.js\?v=20261013-modal-only-nav-v1/);
});
