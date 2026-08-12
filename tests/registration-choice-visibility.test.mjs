import assert from "node:assert/strict";
import {
  hasQuarterScoreData,
  hasShotPointData,
  registrationChoiceVisibility
} from "../js/calculations/game-calculations.js";

const legacy = { id: "legacy", ownScore: 62, oppScore: 58 };
const quarterMigrated = {
  ...legacy,
  quarterScores: { q1: { team: 12, opponent: 15 } }
};
const newGame = { id: "new", registrationDefaultsVersion: 2 };
const detailedStats = [{
  gameId: "legacy",
  quarters: { q2: { shots: [{ id: "shot-1", shotX: 10, shotY: 20 }] } }
}];

assert.equal(hasQuarterScoreData(legacy), false);
assert.equal(hasQuarterScoreData(quarterMigrated), true);
assert.equal(hasQuarterScoreData({ quarterScores: { q1: { myScore: 0 } } }), true);
assert.equal(hasShotPointData(legacy, []), false);
assert.equal(hasShotPointData(legacy, detailedStats), true);
assert.deepEqual(registrationChoiceVisibility({}, []), { score: false, shot: false });
assert.deepEqual(registrationChoiceVisibility(newGame, []), { score: false, shot: false });
assert.deepEqual(registrationChoiceVisibility(legacy, []), { score: true, shot: true });
assert.deepEqual(registrationChoiceVisibility(quarterMigrated, []), { score: false, shot: true });
assert.deepEqual(registrationChoiceVisibility(legacy, detailedStats), { score: true, shot: false });

console.log("registration choice visibility: ok");
