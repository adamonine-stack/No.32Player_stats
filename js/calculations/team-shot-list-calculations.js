import { normalizeShot } from './shot-calculations.js';

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
      quarter: Number(quarter || shot.quarter) || null, teamStatId: stat.id || `${stat.gameId}_${stat.playerId}`
    }));
    return [...append(stat, stat.quarter), ...Object.entries(stat.quarters || {}).flatMap(([key, source]) => append(source, Number(key.replace(/\D/g, ''))))];
  }).map((shot, index) => ({...shot, teamAnalysisKey: String(index)}));
  const clock = shot => shot.remainingSeconds != null && shot.remainingSeconds !== '' && Number.isFinite(Number(shot.remainingSeconds)) && Number(shot.remainingSeconds) >= 0 ? Number(shot.remainingSeconds) : null;
  const sequence = shot => {
    const game = gameById.get(shot.gameId);
    const id = `shot:${shot.teamStatId}:${shot.quarter || 0}:${shot.id}`;
    return Number(game?.eventSequenceOverrides?.[id]) || Number(shot.sequence) || timestamp(shot.createdAt) * 1000;
  };
  return shots.sort((a, b) => {
    const gameDifference = (gameOrder.get(a.gameId) ?? Infinity) - (gameOrder.get(b.gameId) ?? Infinity);
    if (gameDifference) return gameDifference;
    const quarterDifference = (a.quarter || Infinity) - (b.quarter || Infinity);
    if (quarterDifference) return quarterDifference;
    const aClock = clock(a), bClock = clock(b);
    // Earlier play has more time remaining. Unknown clocks follow timed plays.
    if (aClock != null && bClock != null && aClock !== bClock) return bClock - aClock;
    if ((aClock == null) !== (bClock == null)) return aClock == null ? 1 : -1;
    return sequence(a) - sequence(b) || Number(a.teamAnalysisKey) - Number(b.teamAnalysisKey);
  });
}
