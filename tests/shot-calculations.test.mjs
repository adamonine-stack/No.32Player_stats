import assert from "node:assert/strict";
import { allowedShotTypes, createShot, shotTotals, mergeShotTotals, detailedShotTotals, collectShots, aggregateShots, SHOT_AREA_ORDER, legacyShotSlots, isLegacyShotBreakdownTarget, createLegacyBreakdownShots, detectShotArea, SHOT_AREA_MODEL_VERSION, shotAreaForRecord, reclassifyShots, countsAsFieldGoalAttempt, normalizeShot } from "../js/calculations/shot-calculations.js";

assert.equal(detectShotArea(3, 10), "left_corner_3p");
assert.equal(detectShotArea(25, 10), "left_zero_mid");
assert.equal(detectShotArea(25, 32), "left_mid");
assert.equal(detectShotArea(50, 12), "under_basket");
assert.equal(detectShotArea(50, 24), "under_basket");
assert.equal(detectShotArea(50, 25), "inside");
assert.equal(detectShotArea(36, 10.5), "under_basket");
assert.equal(detectShotArea(50, 27), "inside");
assert.equal(detectShotArea(50, 47), "center_mid");
assert.equal(detectShotArea(20, 50), "left_45_3p");
assert.equal(detectShotArea(50, 60), "center_3p");
assert.equal(detectShotArea(80, 50), "right_45_3p");

const base = { gameId: "g1", playerId: "p1", quarter: 2 };
const right45Made = createShot({ ...base, shotArea: "right_45_3p", shotX: 80, shotY: 50, shotType: "jump_shot", result: "made", createdAt: 1 });
assert.equal(right45Made.shotValue, 3);
assert.equal(right45Made.points, 3);
assert.equal(right45Made.shotX, 80);
assert.equal(right45Made.shotAreaModelVersion, SHOT_AREA_MODEL_VERSION);
assert.deepEqual(shotTotals([right45Made]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });

const centerMissed = createShot({ ...base, shotArea: "center_mid", shotType: "floater", result: "missed", createdAt: 2 });
assert.deepEqual(shotTotals([centerMissed]), { twoPa: 1, twoPm: 0, threePa: 0, threePm: 0 });
assert.equal(centerMissed.wasFouled, false);
const fouledTwoMiss = createShot({ ...base, shotArea: "center_mid", shotType: "floater", result: "missed", wasFouled: true, createdAt: 21 });
const fouledThreeMiss = createShot({ ...base, shotArea: "center_3p", shotType: "jump_shot", result: "missed", wasFouled: true, createdAt: 22 });
const fouledMade = createShot({ ...base, shotArea: "right_45_3p", shotType: "jump_shot", result: "made", wasFouled: true, createdAt: 23 });
assert.equal(countsAsFieldGoalAttempt(fouledTwoMiss), false);
assert.equal(countsAsFieldGoalAttempt(fouledThreeMiss), false);
assert.equal(countsAsFieldGoalAttempt(fouledMade), true);
assert.equal(countsAsFieldGoalAttempt(centerMissed), true);
assert.deepEqual(shotTotals([fouledTwoMiss, fouledThreeMiss, fouledMade]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });
assert.equal(normalizeShot({ result: "missed" }).wasFouled, false);

const underMade = createShot({ ...base, shotArea: "under_basket", shotType: "jump_shot", result: "made", createdAt: 3 });
assert.deepEqual(shotTotals([underMade]), { twoPa: 1, twoPm: 1, threePa: 0, threePm: 0 });

const longMade = createShot({ ...base, shotArea: "long_range_3p", shotType: "jump_shot", result: "made", createdAt: 4 });
assert.equal(longMade.points, 3);
assert.deepEqual(allowedShotTypes("right_corner_3p"), ["jump_shot"]);
assert.deepEqual(allowedShotTypes("center_mid"), ["jump_shot", "floater"]);
assert.deepEqual(allowedShotTypes("inside"), ["layup", "floater", "jump_shot"]);
assert.deepEqual(allowedShotTypes("under_basket"), ["layup", "jump_shot", "floater", "tap"]);

const legacy = { twoPa: 8, twoPm: 4, threePa: 5, threePm: 2 };
const first = [right45Made, centerMissed];
const next = [centerMissed, underMade];
assert.deepEqual(mergeShotTotals(legacy, first, next), { twoPa: 9, twoPm: 5, threePa: 4, threePm: 1 });
assert.deepEqual(detailedShotTotals(legacy, [], [right45Made]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });
assert.deepEqual(detailedShotTotals({ ...legacy, shots: first }, first, next), { twoPa: 9, twoPm: 5, threePa: 4, threePm: 1 });
const madeSummary = shotTotals([underMade, right45Made]);
assert.equal(madeSummary.twoPm + madeSummary.threePm, 2, "FGM reflects all made field goals");
assert.equal(madeSummary.threePm, 1, "3PGM reflects made 3-point shots");

const nested = [{ shots: [right45Made], quarters: { q1: { shots: [centerMissed] }, q2: { shots: [underMade] } } }];
assert.equal(collectShots(nested).length, 3);
const areas = aggregateShots(collectShots(nested), "shotArea", SHOT_AREA_ORDER);
assert.deepEqual(areas.under_basket, { made: 1, attempts: 1, registered: 1 });
const types = aggregateShots([right45Made, centerMissed, underMade], "shotType", ["jump_shot", "floater"]);
assert.deepEqual(types.jump_shot, { made: 2, attempts: 2, registered: 2 });
assert.deepEqual(types.floater, { made: 0, attempts: 1, registered: 1 });
const foulAreas = aggregateShots([fouledTwoMiss, fouledMade], "shotArea", SHOT_AREA_ORDER);
assert.deepEqual(foulAreas.center_mid, { made: 0, attempts: 0, registered: 1 });

const staleAreaShot = { ...right45Made, shotArea: "center_mid", shotAreaLabel: "正面ミドル", shotValue: 2, points: 2 };
assert.equal(shotAreaForRecord(staleAreaShot), "right_45_3p");
assert.deepEqual(shotTotals([staleAreaShot]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });
const refreshedAreas = aggregateShots([staleAreaShot], "shotArea", SHOT_AREA_ORDER);
assert.deepEqual(refreshedAreas.right_45_3p, { made: 1, attempts: 1, registered: 1 });
const futureBoundary = reclassifyShots([staleAreaShot], () => "center_3p", "future-boundary-v2")[0];
assert.equal(futureBoundary.shotArea, "center_3p");
assert.equal(futureBoundary.shotAreaModelVersion, "future-boundary-v2");
assert.equal(futureBoundary.points, 3);

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
    { shotArea: "under_basket", shotType: "jump_shot" },
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
