import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const activeQuickShot=app.slice(app.indexOf('function quickShotRegistration('),app.indexOf('\nfunction quickStatsForm(',app.indexOf('function quickShotRegistration(')));
const shotInteractions = fs.readFileSync(new URL('../js/ui/shot-interactions.js', import.meta.url), 'utf8');
const viewport = fs.readFileSync(new URL('../js/ui/mobile-modal-viewport-fit.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(activeQuickShot, /id="quickShotTypeOptions"/);
assert.match(activeQuickShot, /const selectType=id=>/);
assert.match(activeQuickShot, /button\.onclick=\(\)=>selectType\(button\.dataset\.quickShotType\)/);
assert.match(activeQuickShot, /#shotCourtRoot'\)\.innerHTML=shotCourtSvg/);
assert.match(activeQuickShot, /bindCourt\(\);\s*refreshTypeControls\(\)/);
assert.doesNotMatch(activeQuickShot, /button\.onclick=\(\)=>\{typeId=button\.dataset\.quickShotType;draw\(/);

assert.match(shotInteractions, /pointerType: event\.pointerType/);
assert.match(shotInteractions, /if \(event\.pointerType === 'mouse'\) return;\s*\n\s*event\.preventDefault\(\)/);
assert.match(shotInteractions, /if \(current\.pointerType === 'mouse' && !current\.active && !current\.activating\)/);

assert.match(viewport, /if \(!window\.matchMedia\('\(max-width: 600px\)'\)\.matches\) return;/);

assert.match(index, /shot-interactions\.js\?v=20260912-pc-native-click-v1/);
assert.match(index, /mobile-modal-viewport-fit\.js\?v=20260912-mobile-only-v1/);

console.log('PC quick shot flow contract: ok');
