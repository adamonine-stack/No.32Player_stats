import { compareHistoryItems } from './history-order.js?v=20260908-quarter-session-v2';
import { normalizeShot } from './shot-calculations.js?v=20260822-foul-stats-v2';

function timestamp(value) {
  if (value && typeof value === 'object' && Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000 + (Number(value.nanoseconds) || 0) / 1e6;
  if (value == null || value === '') return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Date.parse(value) || 0;
}

export function collectTeamAnalysisShots(stats = [], games = []) {
  const gameById = new Map(games.map(game => [game.id, game]));
  const orderedGames = games.map((game, index) => ({game, index})).sort((a, b) =>
    String(a.game.date || '').localeCompare(String(b.game.date || ''))
    || timestamp(a.game.createdAt) - timestamp(b.game.createdAt) || a.index - b.index);
  const gameOrder = new Map(orderedGames.map(({game}, index) => [game.id, index]));
  const shots = stats.flatMap(stat => {
    const append = (source, quarter = null) => (Array.isArray(source?.shots) ? source.shots : []).map(shot => normalizeShot({
      ...shot, gameId: stat.gameId || shot.gameId, playerId: stat.playerId || shot.playerId,
      quarter: Number(quarter || shot.quarter) || null, teamStatId: stat.id || `${stat.gameId}_${stat.playerId}`, teamHistoryQuarter: Number(quarter) || 0
    }));
    return [...append(stat, stat.quarter), ...Object.entries(stat.quarters || {}).flatMap(([key, source]) => append(source, Number(key.replace(/\D/g, ''))))];
  }).map((shot, index) => ({...shot, teamAnalysisKey: String(index)}));
  const historyItem = shot => {
    const game = gameById.get(shot.gameId);
    const eventId = `shot:${shot.teamStatId}:${shot.teamHistoryQuarter}:${shot.id}`;
    const override = game?.eventSequenceOverrides?.[eventId];
    // Use the same value and units as buildGameHistory, including legacy records.
    const sortValue = Number.isFinite(Number(override)) ? Number(override) : Number(shot.sequence) || timestamp(shot.createdAt);
    return {...shot, eventId, sortValue};
  };
  return shots.sort((a, b) => {
    const gameDifference = (gameOrder.get(a.gameId) ?? Infinity) - (gameOrder.get(b.gameId) ?? Infinity);
    if (gameDifference) return gameDifference;
    const quarterDifference = (a.quarter || Infinity) - (b.quarter || Infinity);
    if (quarterDifference) return quarterDifference;
    return compareHistoryItems(historyItem(a), historyItem(b)) || Number(a.teamAnalysisKey) - Number(b.teamAnalysisKey);
  });
}
