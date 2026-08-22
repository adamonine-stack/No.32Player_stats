import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controls = readFileSync(new URL('../js/ui/stats-counter-controls.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(controls, /document\.addEventListener\('click'/);
assert.match(controls, /event\.target\.closest\?\.\('\.stats-form-compact \.stat-counter-button'\)/);
assert.match(controls, /control\.innerHTML = '<button type="button" class="stat-counter-button stat-counter-minus"/);
assert.match(controls, /button\.classList\.contains\('stat-counter-plus'\) \? 1 : -1/);
assert.match(controls, /Math\.max\(0, current \+ delta\)/);
assert.match(controls, /minus\) minus\.disabled = current <= 0/);
assert.match(controls, /is-increased/);
assert.match(controls, /is-decreased/);
assert.match(controls, /pointer-events:auto!important/);
assert.match(controls, /z-index:3/);
assert.doesNotMatch(controls, /minus\.addEventListener/);
assert.doesNotMatch(controls, /plus\.addEventListener/);
assert.doesNotMatch(index, /stats-counter-event-guard\.js/);
assert.match(index, /stats-counter-controls\.js\?v=20260822-game-history-v1/);

console.log('stats counter delegation contract passed');
