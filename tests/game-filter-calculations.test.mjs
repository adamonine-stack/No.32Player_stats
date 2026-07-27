import assert from "node:assert/strict";
import {
  UNSET_FILTER_VALUE,
  normalizeCategoryKey,
  opponentCategoriesMatch,
  resolveOpponentTeam,
  filterByOpponentFilters,
  filterByOpponentRankRange,
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
  { id: "g1", opponentTeamId: "a", opponent: "old", category: "U15", date: "2026-07-01", tournament: "Cup" },
  { id: "g2", opponent: " alpha club ", category: "U14", date: "2026-07-02", tournament: "Cup" },
  { id: "g3", opponentTeamId: "b", opponent: "ベータ", category: "U13", date: "2026-08-01", tournament: "League" },
  { id: "g4", opponent: "Unknown", date: "2025-08-01", tournament: "League" }
];

assert.equal(resolveOpponentTeam(games[0], teams)?.id, "a", "IDを優先して解決する");
assert.equal(resolveOpponentTeam(games[1], teams)?.id, "a", "正規化名とaliasで解決する");
assert.equal(normalizeCategoryKey("U15男子"), "U15", "年齢カテゴリーの補足表記を正規化する");
assert.equal(opponentCategoriesMatch("U15", "U15男子"), true, "同じ年齢カテゴリーを一致と判定する");
assert.equal(opponentCategoriesMatch("U14", "U15男子"), false, "異なるカテゴリーを不一致と判定する");
assert.deepEqual(filterByOpponentFilters(games, "U15", "A", teams).map(game => game.id), ["g1"], "試合登録時のU15だけを抽出する");
assert.deepEqual(filterByOpponentFilters(games, "U14", "A", teams).map(game => game.id), ["g2"], "対戦チームがU15でも試合登録時のU14で抽出する");
assert.deepEqual(filterByOpponentFilters(games, "U13", "B", teams).map(game => game.id), ["g3"], "試合登録時のU13を抽出する");
assert.deepEqual(filterByOpponentFilters(games, UNSET_FILTER_VALUE, UNSET_FILTER_VALUE, teams).map(game => game.id), ["g4"], "未照合試合を未設定として抽出する");
assert.deepEqual(filterByOpponentRankRange(games, "B", "A", teams, ["D", "C", "B", "B+", "A", "A+", "S"]).map(game => game.id), ["g1", "g2", "g3"], "指定ランク範囲を両端を含めて抽出する");
assert.deepEqual(filterByOpponentRankRange(games, "A", "B", teams, ["D", "C", "B", "B+", "A", "A+", "S"]).map(game => game.id), ["g1", "g2", "g3"], "上下限を逆に指定しても同じ範囲を抽出する");
assert.deepEqual(filterByAggregationCondition(games, "month", "2026-07").map(game => game.id), ["g1", "g2"], "月別を抽出する");
assert.deepEqual(filterByAggregationCondition(games, "year", "2026").map(game => game.id), ["g1", "g2", "g3"], "年別を抽出する");
assert.deepEqual(filterByAggregationCondition(games, "period", "", "2026-07-02", "2026-08-01").map(game => game.id), ["g2", "g3"], "期間指定を抽出する");
assert.deepEqual(getOpponentCategoryOptions(games), ["U13", "U14", "U15"]);
assert.deepEqual(getOpponentCategoryOptions([{ category: "U15男子" }, { category: "U15" }]), ["U15"], "試合カテゴリーのU15男子をU15候補へ統合する");
assert.deepEqual(getOpponentRankOptions(teams, ["D", "C", "B", "A", "S"]), ["B", "A"]);

console.log("game filter calculations: ok");
