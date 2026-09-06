import { getGameStatsRegistrationType, num, registeredQuarterNumbers } from './stats-calculations.js';
import { hasShotPointData } from './game-calculations.js';

export function gameListRegistrationStatus(game = {}, stats = []) {
  const totalQuarters = Math.max(0, num(game.quarters || game.quarterCount || 0));
  const gameStats = stats.filter(stat => !game.id || stat.gameId === game.id);
  let registeredQuarters = 0;

  if (getGameStatsRegistrationType(game) === 'quarter') {
    const registered = new Set();
    gameStats.forEach(stat => registeredQuarterNumbers(stat).forEach(q => {
      if (q >= 1 && (!totalQuarters || q <= totalQuarters)) registered.add(q);
    }));
    registeredQuarters = registered.size;
  }

  return {
    totalQuarters,
    registeredQuarters,
    hasShotPoints: hasShotPointData(game, gameStats)
  };
}
