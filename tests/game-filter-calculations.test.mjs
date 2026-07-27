import assert from "node:assert/strict";
import {
  UNSET_FILTER_VALUE,
  resolveOpponentTeam,
  filterByOpponentFilters,
  filterByAggregationCondition,
  getOpponentCategoryOptions,
  getOpponentRankOptions
} from "../js/calculations/game-filter-calculations.js";

const teams = [
  { id: "a", teamName: "Alpha", aliases: ["ALPHA CLUB"], category: "U15", calculatedRank: "A" },
  { id: "b", teamName: "ベータ", category: "U14", calculatedRank: "B" },
  { id: "c", teamName: "No Data" }
];
const games = [
  { id: "g1", opponentTeamId: "a", opponent: "old", date: "2026-07-01", tournament: "Cup" },
  { id: "g2", opponent: " alpha club ", date: "2026-07-02", tournament: "Cup" },
  { id: "g3", opponentTeamId: "b", opponent: "ベータ", date: "2026-08-01", tournament: "League" },
  { id: "g4", opponent: "Unknown", date: "2025-08-01", tournament: "League" }
];

assert.equal(resolveOpponentTeam(games[0], teams)?.id, "a", "IDを優先して解決する");
assert.equal(resolveOpponentTeam(games[1], teams)?.id, "a", "正規化名とaliasで解決する");
assert.deepEqual(filterByOpponentFilters(games, "U15", "A", teams).map(game => game.id), ["g1", "g2"], "カテゴリーとランクをAND適用する");
assert.deepEqual(filterByOpponentFilters(games, UNSET_FILTER_VALUE, UNSET_FILTER_VALUE, teams).map(game => game.id), ["g4"], "未照合試合を未設定として抽出する");
assert.deepEqual(filterByAggregationCondition(games, "month", "2026-07").map(game => game.id), ["g1", "g2"], "月別を抽出する");
assert.deepEqual(filterByAggregationCondition(games, "year", "2026").map(game => game.id), ["g1", "g2", "g3"], "年別を抽出する");
assert.deepEqual(filterByAggregationCondition(games, "period", "", "2026-07-02", "2026-08-01").map(game => game.id), ["g2", "g3"], "期間指定を抽出する");
assert.deepEqual(getOpponentCategoryOptions(teams), ["U14", "U15"]);
assert.deepEqual(getOpponentRankOptions(teams, ["D", "C", "B", "A", "S"]), ["B", "A"]);

console.log("game filter calculations: ok");
