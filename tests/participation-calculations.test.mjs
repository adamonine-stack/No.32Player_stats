import assert from "node:assert/strict";
import { averagePlayerPlayingTime, createTemporaryPlayer, formatClock, gamePlayingTime, parseRemainingTime, playerPlayingTime, quarterDurationSeconds, sortSubstitutions, validateQuarterParticipation } from "../js/calculations/participation-calculations.js";

const starters = ["p1", "p2", "t1", "t2", "t3"];
const substitutions = [
  { id: "later", remainingSeconds: 190, playerOutId: "p2", playerInId: "p1b", sequence: 2 },
  { id: "backfill", remainingSeconds: 342, playerOutId: "p2", playerInId: "p2b", sequence: 1 },
  { id: "return", remainingSeconds: 250, playerOutId: "p2b", playerInId: "p2", sequence: 1 }
];
const result = validateQuarterParticipation({ starters, substitutions, durationSeconds: 480 });
assert.equal(result.valid, true);
assert.deepEqual(result.substitutions.map(item => item.id), ["backfill", "return", "later"]);
assert.deepEqual(new Set(result.currentPlayers), new Set(["p1", "t1", "t2", "t3", "p1b"]));
assert.equal(result.secondsByPlayer.p2, 198);
assert.equal(result.secondsByPlayer.p2b, 92);
assert.equal(formatClock(result.secondsByPlayer.p2), "3:18");

const sameTime = validateQuarterParticipation({ starters: ["a", "b", "c", "d", "e"], durationSeconds: 480, substitutions: [
  { id: "s1", remainingSeconds: 342, playerOutId: "a", playerInId: "f", sequence: 1 },
  { id: "s2", remainingSeconds: 342, playerOutId: "b", playerInId: "g", sequence: 2 }
] });
assert.equal(sameTime.valid, true);
assert.deepEqual(new Set(sameTime.currentPlayers), new Set(["c", "d", "e", "f", "g"]));

const unregistered = Array.from({ length: 6 }, (_, index) => createTemporaryPlayer({ gameId: "g1", number: index + 1 }));
assert.equal(new Set(unregistered.map(player => player.id)).size, 6);
assert.equal(validateQuarterParticipation({ starters: ["p1", "p2", ...unregistered.slice(0, 3).map(p => p.id)], durationSeconds: 480, substitutions: [
  { remainingSeconds: 330, playerOutId: unregistered[0].id, playerInId: unregistered[3].id },
  { remainingSeconds: 250, playerOutId: unregistered[3].id, playerInId: unregistered[4].id },
  { remainingSeconds: 160, playerOutId: unregistered[4].id, playerInId: unregistered[5].id },
  { remainingSeconds: 80, playerOutId: unregistered[5].id, playerInId: unregistered[0].id }
] }).valid, true);

assert.equal(parseRemainingTime(5, 78, 480).valid, false);
assert.equal(parseRemainingTime(8, 31, 480).valid, false);
assert.equal(parseRemainingTime(5, 42, 480).remainingSeconds, 342);
assert.equal(quarterDurationSeconds({}), 480);
assert.equal(quarterDurationSeconds({ quarterDurationMinutes: 6 }), 360);
assert.equal(quarterDurationSeconds({ quarterDurationSeconds: 600 }), 600);

const totals = gamePlayingTime({ quarters: 1, quarterDurationMinutes: 8, quarterParticipation: { q1: { starters: ["a", "b", "c", "d", "e"], substitutions: [
  { remainingSeconds: 342, playerOutId: "a", playerInId: "f" },
  { remainingSeconds: 130, playerOutId: "f", playerInId: "a" }
] } } });
assert.equal(totals.a, 268);
assert.equal(totals.f, 212);

const timedGame = { quarters: 2, quarterDurationMinutes: 8, quarterParticipation: {
  q1: { starters: ["target", "b", "c", "d", "e"], substitutions: [{ remainingSeconds: 372, playerOutId: "target", playerInId: "f" }] },
  q2: { starters: ["target", "b", "c", "d", "e"], substitutions: [{ remainingSeconds: 333, playerOutId: "target", playerInId: "f" }] }
} };
assert.deepEqual(playerPlayingTime(timedGame, "target", 1), { registered: true, seconds: 108 });
assert.deepEqual(playerPlayingTime(timedGame, "target", 2), { registered: true, seconds: 147 });
assert.deepEqual(playerPlayingTime(timedGame, "target"), { registered: true, seconds: 255 });
assert.deepEqual(playerPlayingTime({}, "target"), { registered: false, seconds: 0 });
assert.deepEqual(playerPlayingTime(timedGame, "bench"), { registered: true, seconds: 0 });
const average = averagePlayerPlayingTime([timedGame, {}, { ...timedGame, quarterParticipation: { q1: { starters: ["target", "b", "c", "d", "e"], substitutions: [{ remainingSeconds: 225, playerOutId: "target", playerInId: "f" }] } } }], "target");
assert.deepEqual(average, { registered: true, seconds: 255, gameCount: 2 });
assert.deepEqual(averagePlayerPlayingTime([{}], "target"), { registered: false, seconds: 0, gameCount: 0 });
assert.equal(formatClock(3912), "65:12");

const invalid = validateQuarterParticipation({ starters: ["a", "b", "c", "d", "e"], durationSeconds: 480, substitutions: [{ id: "bad", remainingSeconds: 300, playerOutId: "x", playerInId: "f" }] });
assert.equal(invalid.valid, false);
assert.equal(invalid.eventId, "bad");
console.log("participation calculations: ok");
