import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dedupeSubstitutions,
  duplicateSubstitutionIds,
  sameSubstitution,
  validateQuarterParticipation
} from "../js/calculations/participation-calculations.js";

const duplicated = [
  { id: "s1", remainingSeconds: 149, playerOutId: "p33", playerInId: "p29", sequence: 1 },
  { id: "s2", remainingSeconds: 149, playerOutId: "p33", playerInId: "p29", sequence: 2 },
  { id: "s3", remainingSeconds: 120, playerOutId: "p29", playerInId: "p33", sequence: 3 }
];

assert.equal(sameSubstitution(duplicated[0], duplicated[1]), true);
assert.deepEqual(duplicateSubstitutionIds(duplicated), ["s2"]);
assert.deepEqual(dedupeSubstitutions(duplicated).map(item => item.id), ["s1", "s3"]);

const valid = validateQuarterParticipation({
  starters: ["p33", "b", "c", "d", "e"],
  durationSeconds: 480,
  substitutions: dedupeSubstitutions([
    { id: "s1", remainingSeconds: 149, playerOutId: "p33", playerInId: "p29", sequence: 1 },
    { id: "s2", remainingSeconds: 149, playerOutId: "p33", playerInId: "p29", sequence: 2 }
  ])
});
assert.equal(valid.valid, true);

const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.ok(app.includes("sameSubstitution(existing,nextEvent)"));
assert.ok(app.includes("dataset.saving==='1'"));
assert.ok(app.includes("repairDuplicateSubstitutions"));
assert.ok(app.includes("dedupeSubstitutions(liveQ.substitutions||[])"));
assert.ok(app.includes("const liveGame=state.games.find(item=>item.id===game.id)||game"));

console.log("substitution duplicate guard: ok");
