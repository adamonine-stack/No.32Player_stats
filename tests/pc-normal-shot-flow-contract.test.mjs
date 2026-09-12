import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

const start = app.indexOf('function openShotRegistration(');
const end = app.indexOf('\nfunction bindShotListActions', start);
assert.ok(start >= 0 && end > start, 'openShotRegistration block exists');
const shotRegistration = app.slice(start, end);

assert.match(shotRegistration, /SHOT_TYPE_ORDER\.map\(id=>/);
assert.match(shotRegistration, /button\.hidden=!enabled/);
assert.match(shotRegistration, /shotTypeRoot\.onpointerdown=/);
assert.match(shotRegistration, /selectShotType\(button\)/);
assert.match(shotRegistration, /const updateCourtMarkers=/);
assert.match(shotRegistration, /currentMarkers\.replaceWith\(nextMarkers\)/);
assert.doesNotMatch(shotRegistration, /button\.onclick=\(\)=>\{typeId=button\.dataset\.shotType;refresh\(\)\}/);
assert.doesNotMatch(shotRegistration, /\$\('#shotTypeOptions'\)\.innerHTML=allowed\.length/);

assert.match(index, /js\/app\.js\?v=20260912-pc-normal-shot-flow-v2/);
assert.match(serviceWorker, /r32-shell-20260912-pc-normal-shot-flow-v2/);

console.log('PC normal shot flow contract: ok');
