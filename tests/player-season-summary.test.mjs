import assert from "node:assert/strict";
import test from "node:test";
import { buildPlayerSeasonSummary, comparePlayerSeasonSummary, playerSeasonSummaryId } from "../js/calculations/player-season-summary.js";

test("player season summary preserves game, Q, aggregate and playing-time values", () => {
  const games = [
    { id: "g1", seasonId: "s1", date: "2026-04-01", quarters: 4 },
    { id: "g2", seasonId: "s2", date: "2025-04-01", quarters: 4 }
  ];
  const stats = [
    { id: "g1_p1", gameId: "g1", playerId: "p1", twoPa: 3, twoPm: 2, threePa: 1, threePm: 1, ast: 2 },
    { id: "g2_p1", gameId: "g2", playerId: "p1", twoPa: 99, twoPm: 99 }
  ];
  const summary = buildPlayerSeasonSummary({ seasonId: "s1", playerId: "p1", games, stats });
  assert.equal(playerSeasonSummaryId("s1", "p1"), "s1__p1");
  assert.equal(summary.enteredGameCount, 1);
  assert.equal(summary.totalQ, 4);
  assert.equal(summary.stats.twoPm, 2);
  assert.equal(summary.derived.pts, 7);
  assert.equal(summary.periodStart, "2026-04-01");
  assert.equal(comparePlayerSeasonSummary(summary, structuredClone(summary)).equal, true);
  const changed = structuredClone(summary); changed.stats.ast++;
  assert.deepEqual(comparePlayerSeasonSummary(summary, changed).differences[0].key, "stats.ast");
});
