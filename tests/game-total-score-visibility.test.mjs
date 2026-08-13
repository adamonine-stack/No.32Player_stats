import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const gameForm = app.slice(app.indexOf('function gameForm'), app.indexOf('function shotSourceFor'));

assert.ok(gameForm.includes("const totalScoreFields=g.id&&!hasQuarterScoreData(g)?`<label>自チーム得点"));
assert.ok(gameForm.includes('${totalScoreFields}</div><div class="card"><div class="section-title">Q別スコア（累積）'));
assert.ok(gameForm.includes("$('#gOwn')?.value??g.ownScore"));

console.log('GAME_TOTAL_SCORE_VISIBILITY_OK');
