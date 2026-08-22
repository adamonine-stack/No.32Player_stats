import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../styles/stats-opponent-mobile-fixes.css',import.meta.url),'utf8'),counter=fs.readFileSync(new URL('../js/ui/stats-counter-controls.js',import.meta.url),'utf8');
assert.doesNotMatch(app,/id="registerFoul"/);assert.match(app,/FOUL\$\{numInput\('pf'/);assert.match(app,/被FOUL\$\{numInput\('fouled'/);assert.match(app,/playEvents:\s*reconciled\.playEvents/);
assert.match(app,/shotFouledCount:shotReceivedFoulCount\(nextShots\)/);assert.match(app,/receivedFoulTotal/);assert.match(app,/basic-stats-fouls/);
assert.match(app,/function gameHistoryForm/);assert.match(app,/data-history-event-id/);assert.match(app,/data-history-edit/);assert.match(app,/data-history-delete/);
assert.match(app,/requestAnimationFrame\(auto\)/);assert.match(app,/bounds\.bottom-70/);assert.match(app,/bounds\.top\+70/);assert.match(app,/eventSequenceOverrides/);
assert.match(counter,/recordPendingStatEvent/);assert.match(css,/participation-card\{width:auto;max-width:none;max-height:none;overflow:visible\}/);assert.match(css,/touch-action:none/);
console.log('game history UI contract: ok');
