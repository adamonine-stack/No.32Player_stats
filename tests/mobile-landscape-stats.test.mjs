import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles/mobile-landscape-stats.css', import.meta.url), 'utf8');

test('landscape-specific stylesheet does not change portrait or desktop', () => {
  const gate = '@media screen and (orientation: landscape) and (pointer: coarse) and (max-height: 650px) and (max-width: 1100px) {';
  const opening = css.indexOf(gate);
  assert.ok(opening >= 0, 'all layout rules are gated by landscape, touch and viewport size');
  assert.equal(css.slice(0, opening).replace(/\/\*[\s\S]*?\*\//g, '').trim(), '');
  assert.match(index, /styles\/mobile-landscape-stats\.css\?v=20261120-v1/);
  assert.ok(!css.includes('@media (orientation: portrait)'));
});

test('starting five and substitutions use scoped compact landscape targets', () => {
  assert.ok(app.includes("classList.add('participation-modal')"));
  assert.ok(app.includes("classList.add('participation-substitution-modal')"));
  assert.ok(css.includes('grid-area: starters'));
  assert.ok(css.includes('.participation-card:has(#saveStarters)'));
  assert.ok(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'));
  assert.ok(css.includes('overflow-y: auto !important'));
  assert.ok(app.includes("if((options.newGameEntry||options.statsEntry)&&validation.valid){statsEntryForm(gameId,quarter,options.preferredMode||'');return}"));
});

test('landscape touch phones get quick-entry layout and unchanged save behavior', () => {
  const media = '(orientation: landscape) and (pointer: coarse) and (max-height: 650px) and (max-width: 1100px)';
  assert.ok(app.includes(media));
  assert.ok(app.includes("quickModalClass('quick-stats-home')"));
  assert.ok(css.includes('.quick-stats-home .quick-latest-history'));
  assert.ok(css.includes('.quick-stats-home .quick-footer'));
  assert.ok(css.includes('.quick-shot-modal #shotCourtRoot .shot-court'));
  assert.ok(css.includes('grid-template-columns: repeat(5, minmax(0, 1fr))'));
  assert.ok(app.includes("quickActionSheet(game,quarter,players.find(item=>item.id===button.dataset.quickPlayer),value)"));
});
