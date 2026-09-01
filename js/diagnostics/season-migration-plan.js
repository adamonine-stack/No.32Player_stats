import { compareIntegrityMetrics, integrityMetrics } from "./data-integrity.js";

const yearFor = value => Number(String(value || "").slice(0, 4)) || 0;

export function seasonIdForGame(game, defaultSeasonId = "season_2026_27") {
  if (game?.seasonId) return game.seasonId;
  const year = yearFor(game?.date || game?.gameDate);
  if (!year) return defaultSeasonId;
  const start = Number(String(defaultSeasonId).match(/season_(\d{4})/)?.[1]) || 2026;
  if (year === start || year === start + 1) return defaultSeasonId;
  return `season_${year}_${String(year + 1).slice(-2)}`;
}

export function planSeasonIdMigration({ games = [], stats = [] } = {}, defaultSeasonId) {
  const gameById = new Map(games.map(game => [game.id, game]));
  const patches = [];
  for (const game of games) if (!game.seasonId) patches.push({ collection: "games", id: game.id, fields: { seasonId: seasonIdForGame(game, defaultSeasonId), seasonMigrationVersion: 1 } });
  for (const stat of stats) if (!stat.seasonId) {
    const game = gameById.get(stat.gameId);
    patches.push({ collection: "stats", id: stat.id, fields: { seasonId: seasonIdForGame(game, defaultSeasonId), seasonMigrationVersion: 1 } });
  }
  return patches;
}

export function verifySeasonIdMigration(data = {}, patches = []) {
  const apply = (collection, items = []) => items.map(item => {
    const patch = patches.find(candidate => candidate.collection === collection && candidate.id === item.id);
    return patch ? { ...item, ...patch.fields } : item;
  });
  const before = integrityMetrics(data);
  const afterData = { ...data, games: apply("games", data.games), stats: apply("stats", data.stats) };
  const after = integrityMetrics(afterData);
  return { ...compareIntegrityMetrics(before, after), before, after, data: afterData };
}
