import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../js/ui/stats-entry-layout-tuning.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(ui, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
assert.match(ui, /\.shooting-number-grid/);
assert.match(ui, /color:\s*#c084fc/);
assert.match(ui, /grid-template-columns:\s*52px minmax\(42px, 1fr\) 52px/);
assert.match(ui, /min-height:\s*44px/);
assert.match(ui, /Court SVG is intentionally untouched/);
assert.match(index, /stats-entry-layout-tuning\.js\?v=20260806-stats-entry-layout-v1/);
assert.doesNotMatch(ui, /\.shot-court|court-lines|court-zones|shot-area-label/);
