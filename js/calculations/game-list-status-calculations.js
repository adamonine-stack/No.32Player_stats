import { buildGameHistory } from './game-event-calculations.js?v=20260908-quarter-session-v2';
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


// Zero is an explicit registration; absent fields are not.
export function foulRegistrationQuarterCount(game = {}, stats = []) {
  if (getGameStatsRegistrationType(game) !== 'quarter') return 0;
  const total = Math.max(0, num(game.quarters || game.quarterCount || 0));
  const registered = new Set();
  for (const stat of stats) {
    if (game.id && stat.gameId !== game.id) continue;
    for (const q of registeredQuarterNumbers(stat)) {
      if (q > total) continue;
      const source = stat.quarters[`q${q}`];
      if (['pf', 'fouled'].every(key => source[key] !== null && source[key] !== undefined && source[key] !== '' && Number.isFinite(Number(source[key])))) registered.add(q);
    }
  }
  return registered.size;
}

// Use the same reconciliation as the history list, including manual order overrides.
export function gameListActionStatus(game = {}, stats = []) {
  const history = buildGameHistory(game, stats);
  const shootingKeys = new Set(['twoPa', 'twoPm', 'threePa', 'threePm']);
  return {
    hasUnorderedNonShotStats: history.some(item => item.sourceKind === 'legacyStat' && !shootingKeys.has(item.statKey) && !item.precise),
    hasFoulRegistration: history.some(item => ['foul', 'foulReceived'].includes(item.type))
  };
}
