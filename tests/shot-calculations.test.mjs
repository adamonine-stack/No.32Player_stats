import assert from "node:assert/strict";
import { allowedShotTypes, createShot, shotTotals, mergeShotTotals, detailedShotTotals, collectShots, filterShots, aggregateShots, SHOT_AREA_ORDER, SHOT_COURT_SIZE, HALF_COURT_HEIGHT, legacyShotSlots, isLegacyShotBreakdownTarget, createLegacyBreakdownShots, detectShotArea, SHOT_AREA_MODEL_VERSION, shotAreaForRecord, normalizedShotArea, normalizedShotType, reclassifyShots, countsAsFieldGoalAttempt, normalizeShot, shotSequence } from "../js/calculations/shot-calculations.js";

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
assert.equal(HALF_COURT_HEIGHT, 93.333);
assert.equal(SHOT_COURT_SIZE.height, 108);
assert.equal(detectShotArea(50, 100), "backcourt_3p");
assert.equal(detectShotArea(50, 109), null);

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
assert.equal(underMade.shotType, "jump_shot");
for (const shotType of ["jump_shot", "running_shot", "layup", "floater", "tap"]) {
  assert.equal(createShot({ ...base, shotArea: "under_basket", shotType, result: "made" }).shotType, shotType);
}
assert.equal(createShot({ ...base, shotArea: "under_basket", shotType: "under_basket", result: "made" }).shotType, "jump_shot", "legacy under-basket type is normalized on save");

const backcourtMade = createShot({ ...base, shotArea: "backcourt_3p", shotX: 50, shotY: 100, shotType: "jump_shot", result: "made", createdAt: 4 });
assert.equal(backcourtMade.points, 3);
assert.equal(backcourtMade.shotArea, "backcourt_3p");
assert.deepEqual(shotTotals([backcourtMade]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });
assert.deepEqual(allowedShotTypes("right_corner_3p"), ["jump_shot", "running_shot"]);
assert.deepEqual(allowedShotTypes("backcourt_3p"), ["jump_shot"]);
assert.deepEqual(allowedShotTypes("center_mid"), ["jump_shot", "running_shot", "floater"]);
assert.deepEqual(allowedShotTypes("inside"), ["jump_shot", "running_shot", "layup", "floater", "tap"]);
assert.deepEqual(allowedShotTypes("under_basket"), ["jump_shot", "running_shot", "layup", "floater", "tap"]);
assert.deepEqual(allowedShotTypes("other_2p"), []);
assert.throws(() => createShot({ ...base, shotArea: "other_2p", shotType: "jump_shot", result: "made" }), /位置を選択/);
assert.throws(() => createShot({ ...base, shotArea: "long_range_3p", shotType: "jump_shot", result: "made" }), /位置を選択/);
const legacyLong = { ...right45Made, shotArea: "long_range_3p", shotX: null, shotY: null, shotAreaLabel: "ロング3P" };
assert.equal(normalizedShotArea(legacyLong), "backcourt_3p");
assert.equal(normalizeShot(legacyLong).shotAreaLabel, "バックコート3P");
assert.deepEqual(shotTotals([legacyLong]), { twoPa: 0, twoPm: 0, threePa: 1, threePm: 1 });
assert.equal(normalizedShotType({ shotArea: "under_basket", shotType: "under_basket" }), "jump_shot");

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
    { shotArea: "under_basket", shotType: "under_basket" },
    { shotArea: "inside", shotType: "layup" },
    { shotArea: "center_mid", shotType: "jump_shot" },
    { shotArea: "right_45_3p", shotType: "jump_shot" },
    { shotArea: "center_3p", shotType: "jump_shot" }
  ]
});
assert.deepEqual(shotTotals(replacement), { twoPa: 3, twoPm: 2, threePa: 2, threePm: 1 });
assert.equal(replacement[0].shotType, "jump_shot");
assert.equal(replacement.every(shot => shot.quarter === 1), true);
assert.throws(() => createLegacyBreakdownShots({ source: legacySource, gameId: "g1", playerId: "p1", rows: [] }), /全シュート内訳/);

const sequenceSource = [
  { id: "q2-late", quarter: 2, createdAt: 40 },
  { id: "q1-late", quarter: 1, createdAt: 30 },
  { id: "q1-early", quarter: 1, createdAt: 10 },
  { id: "q2-no-time", quarter: 2 }
];
assert.deepEqual(shotSequence(sequenceSource, true).map(item => [item.shot.id, item.number]), [["q1-early", 1], ["q1-late", 2], ["q2-late", 1], ["q2-no-time", 2]]);
assert.deepEqual(shotSequence(sequenceSource, false).map(item => item.number), [1, 2, 3, 4]);
assert.deepEqual(shotSequence([{ id: "a" }, { id: "b" }], false).map(item => item.shot.id), ["a", "b"]);

const filterTargets = [right45Made, centerMissed, underMade, backcourtMade, fouledTwoMiss];
assert.equal(filterShots(filterTargets, { shotValueFilter: "2" }).length, 3);
assert.equal(filterShots(filterTargets, { shotValueFilter: "3" }).length, 2);
assert.equal(filterShots(filterTargets, { resultFilter: "made" }).length, 3);
assert.equal(filterShots(filterTargets, { resultFilter: "missed" }).length, 2);
assert.equal(filterShots(filterTargets, { shotTypeFilter: "jump_shot" }).length, 3);
assert.equal(filterShots(filterTargets, { shotTypeFilter: "floater" }).length, 2);
assert.equal(filterShots(filterTargets, { shotTypeFilter: "under_basket" }).length, 0);
assert.equal(filterShots(filterTargets, { foulFilter: "yes" }).length, 1);
assert.equal(filterShots(filterTargets, { shotValueFilter: "2", resultFilter: "missed", shotTypeFilter: "floater", foulFilter: "yes" }).length, 1);
const filteredThrees = filterShots(filterTargets, { shotValueFilter: "3" });
const filteredThreeAreas = aggregateShots(filteredThrees, "shotArea", SHOT_AREA_ORDER);
assert.equal(Object.values(filteredThreeAreas).reduce((sum, value) => sum + value.registered, 0), filteredThrees.length);
console.log("shot calculations: ok");
