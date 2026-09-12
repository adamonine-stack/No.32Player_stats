import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const shotInteractions = fs.readFileSync(new URL('../js/ui/shot-interactions.js', import.meta.url), 'utf8');
const viewport = fs.readFileSync(new URL('../js/ui/mobile-modal-viewport-fit.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(app, /id="quickShotTypeOptions"/);
assert.match(app, /const selectType=id=>/);
assert.match(app, /button\.onclick=\(\)=>selectType\(button\.dataset\.quickShotType\)/);
assert.match(app, /#shotCourtRoot'\)\.innerHTML=shotCourtSvg/);
assert.match(app, /bindCourt\(\);\s*refreshTypeControls\(\)/);
assert.doesNotMatch(app, /button\.onclick=\(\)=>\{typeId=button\.dataset\.quickShotType;draw\(/);

assert.match(shotInteractions, /pointerType: event\.pointerType/);
assert.match(shotInteractions, /if \(event\.pointerType === 'mouse'\) return;\s*\n\s*event\.preventDefault\(\)/);
assert.match(shotInteractions, /if \(current\.pointerType === 'mouse' && !current\.active && !current\.activating\)/);

assert.match(viewport, /if \(!window\.matchMedia\('\(max-width: 600px\)'\)\.matches\) return;/);

assert.match(index, /shot-interactions\.js\?v=20260912-pc-native-click-v1/);
assert.match(index, /mobile-modal-viewport-fit\.js\?v=20260912-mobile-only-v1/);
assert.match(index, /js\/app\.js\?v=20260912-pc-quick-shot-flow-v3/);
assert.match(serviceWorker, /r32-shell-20260912-pc-quick-shot-flow-v3/);

console.log('PC quick shot flow contract: ok');
