import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles/persistent-action-bars.css', import.meta.url), 'utf8');

function gameFormBlock() {
  const start = app.indexOf('function gameForm(g={})');
  const end = app.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, 'gameForm should exist');
  return app.slice(start, end);
}

test('game information close control is a real button and marked for delegated close', () => {
  const block = gameFormBlock();
  assert.match(block, /<button type="button" class="btn ghost" id="closeModal" data-game-form-close="1">閉じる<\/button>/);
  assert.match(block, /bindGameFormCloseAction\(\$\('#closeModal'\)\)/);
  assert.doesNotMatch(block, /\$\('#closeModal'\)\.onclick=closeModal/);
});

test('game actions are moved outside the scrolling card', () => {
  const block = gameFormBlock();
  assert.match(block, /gameModal\.classList\.add\('game-form-modal'\)/);
  assert.match(block, /gameModal\.append\(gameActions\)/);
  assert.match(css, /#modalRoot > \.modal\.game-form-modal > \.game-form-actions/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /pointer-events:\s*auto/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test('document capture closes by target or close-button coordinates', () => {
  assert.match(app, /function gameFormCloseButtonFromEvent\(event,root\)/);
  assert.match(app, /event\.changedTouches\?\.\[0\]\|\|event\.touches\?\.\[0\]\|\|event/);
  assert.match(app, /button\.getBoundingClientRect\(\)/);
  assert.match(app, /document\.addEventListener\('touchend',handleGameFormCloseEvent,\{capture:true,passive:false\}\)/);
  assert.match(app, /document\.addEventListener\('pointerup',handleGameFormCloseEvent,true\)/);
  assert.match(app, /document\.addEventListener\('click',handleGameFormCloseEvent,true\)/);
  assert.match(app, /blurModalEditor\(\);closeModal\(\)/);
});
