import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('game information form close action is resilient after editing any field', () => {
  const start = app.indexOf('function gameForm(g={})');
  const end = app.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, 'gameForm should exist');
  const block = app.slice(start, end);

  assert.match(block, /<button type="button" class="btn ghost" id="closeModal">閉じる<\/button>/);
  assert.match(block, /bindGameFormCloseAction\(\$\('#closeModal'\)\)/);
  assert.doesNotMatch(block, /\$\('#closeModal'\)\.onclick=closeModal/);
});

test('game form close helper dismisses input focus and handles touch before click', () => {
  assert.match(app, /function blurModalEditor\(\)/);
  assert.match(app, /active\.closest\?\.\('#modalRoot'\)/);
  assert.match(app, /button\.onpointerdown=event=>\{if\(event\.pointerType!=='touch'&&event\.pointerType!=='pen'\)return;finish\(event\)\}/);
  assert.match(app, /button\.ontouchend=finish/);
  assert.match(app, /blurModalEditor\(\);closeModal\(\)/);
});
