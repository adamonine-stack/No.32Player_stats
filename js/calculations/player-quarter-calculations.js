import { getGameStatsRegistrationType, registeredQuarterNumbers } from "./stats-calculations.js";
import { playerPlayingTime, quarterDurationSeconds, quarterParticipation, validateQuarterParticipation } from './participation-calculations.js';

export function targetQuarterNumbers(game = {}, stats = [], playerId = '', selectedView = 'game') {
  const total = Math.max(0, Number(game.quarters || game.quarterCount || 0));
  const rows = stats.filter(stat => stat.gameId === game.id && (!playerId || stat.playerId === playerId));
  const quarters = new Set();
  if (getGameStatsRegistrationType(game) === 'quarter') {
    rows.forEach(stat => registeredQuarterNumbers(stat).forEach(q => quarters.add(q)));
  } else if (rows.length) {
    for (let q = 1; q <= total; q++) quarters.add(q);
  }
  for (let q = 1; q <= total; q++) {
    if (playerId) {
      if (playerPlayingTime(game, playerId, q).seconds > 0) quarters.add(q);
    } else {
      const result = validateQuarterParticipation({ ...quarterParticipation(game, q), durationSeconds: quarterDurationSeconds(game) });
      if (result.valid && Object.values(result.secondsByPlayer).some(seconds => seconds > 0)) quarters.add(q);
    }
  }
  const selected = /^q(\d+)$/.exec(selectedView);
  return [...quarters].filter(q => q >= 1 && q <= total && (!selected || q === Number(selected[1]))).sort((a, b) => a - b);
}

export function getPlayerTargetQuarterCount(playerId, games = [], stats = [], selectedView = 'game') {
  return games.reduce((total, game) => total + targetQuarterNumbers(game, stats, playerId, selectedView).length, 0);
}

