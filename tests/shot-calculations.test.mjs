import assert from "node:assert/strict";
import { allowedShotTypes, createShot, shotTotals, mergeShotTotals, collectShots, aggregateShots, SHOT_AREA_ORDER, legacyShotSlots, isLegacyShotBreakdownTarget, createLegacyBreakdownShots } from "../js/calculations/shot-calculations.js";

const base = { gameId: "g1", playerId: "p1", quarter: 2 };
const right45Made = createShot({ ...base, shotArea: "right_45_3p", shotType: "jump_shot", result: "made", createdAt: 1 });
assert.equal(right45Made.shotValue, 3);
assert.equal(right45Made.points, 3);
assert.deepEqual(shotTotals([right45Made]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });

const centerMissed = createShot({ ...base, shotArea: "center_mid", shotType: "floater", result: "missed", createdAt: 2 });
assert.deepEqual(shotTotals([centerMissed]), { twoPa: 1, twoPm: 0, threePa: 0, threePm: 0 });

const underMade = createShot({ ...base, shotArea: "under_basket", shotType: "under_basket", result: "made", createdAt: 3 });
assert.deepEqual(shotTotals([underMade]), { twoPa: 1, twoPm: 1, threePa: 0, threePm: 0 });

const longMade = createShot({ ...base, shotArea: "long_range_3p", shotType: "jump_shot", result: "made", createdAt: 4 });
assert.equal(longMade.points, 3);
assert.deepEqual(allowedShotTypes("right_corner_3p"), ["jump_shot"]);
assert.deepEqual(allowedShotTypes("center_mid"), ["jump_shot", "floater"]);
assert.deepEqual(allowedShotTypes("inside"), ["layup", "floater", "under_basket"]);
assert.deepEqual(allowedShotTypes("under_basket"), ["layup", "under_basket"]);

const legacy = { twoPa: 8, twoPm: 4, threePa: 5, threePm: 2 };
const first = [right45Made, centerMissed];
const next = [centerMissed, underMade];
assert.deepEqual(mergeShotTotals(legacy, first, next), { twoPa: 9, twoPm: 5, threePa: 4, threePm: 1 });

const nested = [{ shots: [right45Made], quarters: { q1: { shots: [centerMissed] }, q2: { shots: [underMade] } } }];
assert.equal(collectShots(nested).length, 3);
const areas = aggregateShots(collectShots(nested), "shotArea", SHOT_AREA_ORDER);
assert.deepEqual(areas.under_basket, { made: 1, attempts: 1 });

const legacySource = { twoPa: 3, twoPm: 2, threePa: 2, threePm: 1, ftm: 4 };
assert.equal(isLegacyShotBreakdownTarget(legacySource), true);
assert.deepEqual(legacyShotSlots(legacySource).map(slot => `${slot.shotValue}-${slot.result}`), ["2-made", "2-made", "2-missed", "3-made", "3-missed"]);
const replacement = createLegacyBreakdownShots({
  source: legacySource,
  gameId: "g1",
  playerId: "p1",
  quarter: 1,
  createdAt: 10,
  rows: [
    { shotArea: "under_basket", shotType: "under_basket" },
    { shotArea: "inside", shotType: "layup" },
    { shotArea: "center_mid", shotType: "jump_shot" },
    { shotArea: "right_45_3p", shotType: "jump_shot" },
    { shotArea: "center_3p", shotType: "jump_shot" }
  ]
});
assert.deepEqual(shotTotals(replacement), { twoPa: 3, twoPm: 2, threePa: 2, threePm: 1 });
assert.equal(replacement.every(shot => shot.quarter === 1), true);
assert.throws(() => createLegacyBreakdownShots({ source: legacySource, gameId: "g1", playerId: "p1", rows: [] }), /全シュート内訳/);
console.log("shot calculations: ok");
