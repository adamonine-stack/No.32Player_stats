import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('sort handles use one input event family',()=>{
  assert.match(source,/const startEvent=\('PointerEvent' in window\)\?'pointerdown':'touchstart'/);
  assert.doesNotMatch(source,/addEventListener\('pointerdown',[\s\S]{0,200}addEventListener\('touchstart'/);
});

test('drag insertion is based on stable midpoints excluding the dragged row',()=>{
  assert.match(source,/filter\(el=>el!==item&&\(!canMove\|\|canMove\(item,el\)\)\)/);
  assert.match(source,/p\.clientY<r\.top\+r\.height\/2/);
  assert.match(source,/parent\.insertBefore\(item,last\.nextSibling\)/);
});
