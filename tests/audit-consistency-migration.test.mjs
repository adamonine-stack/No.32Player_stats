import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTournamentPlacementRank,
  planSafeStatQuarterCleanup,
  quarterRecordHasMeaningfulData
} from "../js/diagnostics/audit-consistency-migration.js";

test("current placement labels overwrite legacy saved ranks", () => {
  const normalized = normalizeTournamentPlacementRank({
    season: "2026-27",
    tournamentName: "県大会",
    tournamentLevel: "prefecture",
    placementLabel: "ベスト16",
    placementRank: "B",
    seasonRank: "B",
    rankValue: "B"
  });
  assert.equal(normalized.placementRank, "C");
  assert.equal(normalized.seasonRank, "C");
  assert.equal(normalized.rankValue, "C");
});

test("invalid achievements lose stale saved ranks", () => {
  const normalized = normalizeTournamentPlacementRank({
    season: "2025-26",
    tournamentName: "CBG兵庫県予選",
    tournamentLevel: "prefecture",
    placementLabel: "棄権",
    placementRank: "D",
    seasonRank: "D",
    rankValue: "D"
  });
  assert.equal("placementRank" in normalized, false);
  assert.equal("seasonRank" in normalized, false);
  assert.equal("rankValue" in normalized, false);
});

test("safe stat cleanup removes null and empty out-of-range quarters only", () => {
  const result = planSafeStatQuarterCleanup({
    quarters: {
      q1: { registered: true, quarter: 1, ast: 2 },
      q2: null,
      q5: { registered: false, quarter: 5, ast: 0 },
      q6: { registered: true, quarter: 6, ast: 1 }
    }
  }, { quarters: 4 });
  assert.equal(result.changed, true);
  assert.equal(result.removedNullQuarterKeys, 1);
  assert.equal(result.removedEmptyOutOfRangeQuarterKeys, 1);
  assert.equal(result.protectedOutOfRangeQuarterKeys, 1);
  assert.equal("q2" in result.quarters, false);
  assert.equal("q5" in result.quarters, false);
  assert.equal(result.quarters.q6.ast, 1);
});

test("numeric legacy quarters are preserved rather than inventing Q attribution", () => {
  const result = planSafeStatQuarterCleanup({ quarters: 4, ast: 3 }, { quarters: 4 });
  assert.equal(result.changed, false);
  assert.equal(result.legacyNumeric, true);
  assert.equal(result.quarters, 4);
});

test("registered or nonzero quarter records are meaningful", () => {
  assert.equal(quarterRecordHasMeaningfulData({ registered: true }), true);
  assert.equal(quarterRecordHasMeaningfulData({ registered: false, ast: 1 }), true);
  assert.equal(quarterRecordHasMeaningfulData({ registered: false, ast: 0 }), false);
});
