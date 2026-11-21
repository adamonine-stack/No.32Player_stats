import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles/mobile-bottom-nav.css', import.meta.url), 'utf8');
const picker = readFileSync(new URL('../js/ui/aggregation-target-picker.js', import.meta.url), 'utf8');

test('mobile bottom navigation stays viewport fixed without changing desktop styling', () => {
  assert.match(index, /styles\/mobile-bottom-nav\.css\?v=20261121-iphone-fixed-nav-v1/);
  assert.match(css, /@media screen and \(max-width: 800px\)/);
  assert.match(css, /overflow-x: clip !important/);
  assert.match(css, /body > #mobileNav\.tabbar\s*\{[\s\S]*position: fixed !important/);
  assert.match(css, /bottom: 0 !important/);
  assert.match(css, /translate3d\(0, 0, 0\)/);
});

test('tournament picker dismisses the iOS keyboard before removing search input', () => {
  assert.match(picker, /if \(page\.contains\(document\.activeElement\)\) document\.activeElement\.blur\(\);[\s\S]*page\.remove\(\)/);
});
