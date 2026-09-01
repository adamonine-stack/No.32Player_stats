import { STAT_KEYS, derived, statHasRegisteredData, sumStats } from "./stats-calculations.js";
import { averagePlayerPlayingTime } from "./participation-calculations.js";

export const PLAYER_SEASON_SUMMARY_SCHEMA_VERSION = 1;

export function playerSeasonSummaryId(seasonId, playerId) {
  return `${seasonId}__${playerId}`;
}

export function buildPlayerSeasonSummary({ seasonId, playerId, games = [], stats = [] } = {}) {
  const seasonGames = games.filter(game => seasonId === "all" || game.seasonId === seasonId);
  const gameById = new Map(seasonGames.map(game => [game.id, game]));
  const playerStats = stats.filter(stat => stat.playerId === playerId && gameById.has(stat.gameId) && statHasRegisteredData(stat, gameById.get(stat.gameId)));
  const enteredIds = new Set(playerStats.map(stat => stat.gameId));
  const enteredGames = seasonGames.filter(game => enteredIds.has(game.id));
  const aggregate = sumStats(playerStats, seasonGames);
  const dates = enteredGames.map(game => String(game.date || "")).filter(Boolean).sort();
  const playingTime = averagePlayerPlayingTime(enteredGames, playerId);
  return {
    schemaVersion: PLAYER_SEASON_SUMMARY_SCHEMA_VERSION,
    seasonId,
    playerId,
    stats: aggregate,
    derived: derived(aggregate),
    enteredGameCount: enteredGames.length,
    totalQ: aggregate.q,
    periodStart: dates[0] || "",
    periodEnd: dates.at(-1) || "",
    playingTime,
    sourceGameCount: seasonGames.length,
    sourceStatCount: playerStats.length
  };
}

export function comparePlayerSeasonSummary(expected, actual) {
  const fields = ["seasonId", "playerId", "enteredGameCount", "totalQ", "periodStart", "periodEnd", "sourceGameCount", "sourceStatCount"];
  const differences = fields.filter(key => expected?.[key] !== actual?.[key]).map(key => ({ key, expected: expected?.[key], actual: actual?.[key] }));
  for (const key of ["q", ...STAT_KEYS]) if (expected?.stats?.[key] !== actual?.stats?.[key]) differences.push({ key: `stats.${key}`, expected: expected?.stats?.[key], actual: actual?.stats?.[key] });
  for (const key of ["registered", "seconds", "gameCount"]) if (expected?.playingTime?.[key] !== actual?.playingTime?.[key]) differences.push({ key: `playingTime.${key}`, expected: expected?.playingTime?.[key], actual: actual?.playingTime?.[key] });
  return { equal: differences.length === 0, differences };
}
