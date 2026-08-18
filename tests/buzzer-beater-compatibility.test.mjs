import assert from 'node:assert/strict';
import { allowedShotTypes, createShot, SHOT_COURT_SIZE, shotTotals } from '../js/calculations/shot-calculations.js';
import { aggregateShotAnalysis } from '../js/calculations/shot-analysis-calculations.js';

assert.deepEqual(SHOT_COURT_SIZE, { width: 100, height: 108 });
assert.deepEqual(allowedShotTypes('backcourt_3p'), ['jump_shot', 'buzzer_beater']);
const common = { gameId: 'g1', playerId: 'p1', quarter: 4, shotArea: 'backcourt_3p', shotX: 50, shotY: 100, result: 'made' };
const buzzer = createShot({ ...common, id: 'buzzer', shotType: 'buzzer_beater', createdAt: 1 });
const regular = createShot({ ...common, id: 'regular', shotType: 'jump_shot', createdAt: 2 });
assert.equal(buzzer.shotTypeLabel, 'ブザービーター');
assert.deepEqual(shotTotals([buzzer, regular]), { twoPa: 0, twoPm: 0, threePa: 2, threePm: 2 });
assert.equal(aggregateShotAnalysis([buzzer, regular], { distance: 'three' }).attempts, 2);
const excluded = aggregateShotAnalysis([buzzer, regular], { distance: 'three', excludeBuzzerBeaters: true });
assert.equal(excluded.registered, 1);
assert.equal(excluded.attempts, 1);
assert.equal(excluded.made, 1);
console.log('buzzer beater compatibility: ok');
