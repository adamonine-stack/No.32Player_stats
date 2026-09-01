import assert from "node:assert/strict";
import test from "node:test";
import { planSeasonIdMigration, verifySeasonIdMigration } from "../js/diagnostics/season-migration-plan.js";

test("season migration dry-run is idempotent and aggregate-neutral", () => {
  const data = {
    games: [{ id: "g1", date: "2026-08-01", quarters: 4 }],
    stats: [{ id: "g1_p1", gameId: "g1", playerId: "p1", twoPa: 2, twoPm: 1, ast: 1 }]
  };
  const patches = planSeasonIdMigration(data, "season_2026_27");
  assert.deepEqual(patches.map(item => [item.collection, item.id, item.fields.seasonId]), [
    ["games", "g1", "season_2026_27"],
    ["stats", "g1_p1", "season_2026_27"]
  ]);
  const verification = verifySeasonIdMigration(data, patches);
  assert.equal(verification.equal, true);
  assert.deepEqual(planSeasonIdMigration(verification.data, "season_2026_27"), []);
});
