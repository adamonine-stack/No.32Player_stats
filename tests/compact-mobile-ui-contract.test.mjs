import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mobileCss = await readFile(new URL('../styles/mobile-modal-viewport-fit.css', import.meta.url), 'utf8');
const opponentCss = await readFile(new URL('../styles/opponent-teams.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(mobileCss, /shot-entry-viewport \.shot-type-grid \{\s*grid-template-columns: repeat\(3/);
assert.doesNotMatch(mobileCss, /shot-entry-viewport \.shot-court/);
assert.match(mobileCss, /shot-entry-viewport \.shot-summary \{\s*display: none/);
assert.match(mobileCss, /shot-entry-viewport \.shot-result \{[\s\S]*min-height: 42px/);
assert.match(mobileCss, /shot-entry-viewport \.shot-foul-check \{[\s\S]*min-height: 34px/);
assert.match(opponentCss, /\.opponent-team-detail>\.card\{margin-bottom:10px;padding:12px\}/);
assert.match(opponentCss, /opponent-detail-summary\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(index, /20260819-season-ranks-v1/);
assert.match(index, /shot-entry-original-court-v3/);
assert.match(index, /20260819-season-ranks-v1/);

console.log('compact mobile UI contract: ok');
