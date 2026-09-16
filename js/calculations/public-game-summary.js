import { gameListRegistrationStatus } from './game-list-status-calculations.js';

export const PUBLIC_GAME_SUMMARY_SCHEMA_VERSION = 1;

export function participationRegistrationStatus(game = {}) {
  const totalQuarters = Math.max(0, Number(game.quarters || game.quarterCount || 0));
  let registeredQuarters = 0;
  for (let quarter = 1; quarter <= totalQuarters; quarter++) {
    const participation = game.quarterParticipation?.[`q${quarter}`];
    if (new Set((participation?.starters || []).filter(Boolean)).size === 5) registeredQuarters++;
  }
  return { registeredQuarters, totalQuarters };
}

export function buildPublicGameSummary(game = {}, stats = []) {
  const status = gameListRegistrationStatus(game, stats);
  const participation = participationRegistrationStatus(game);
  return {
    gameId: game.id || '',
    seasonId: game.seasonId || '',
    totalQuarters: status.totalQuarters,
    registeredQuarters: status.registeredQuarters,
    hasShotPoints: Boolean(status.hasShotPoints),
    participationRegisteredQuarters: participation.registeredQuarters,
    participationTotalQuarters: participation.totalQuarters,
    schemaVersion: PUBLIC_GAME_SUMMARY_SCHEMA_VERSION
  };
}

export function hasCompletePublicGameSummaryCoverage(games = [], summaries = []) {
  if (!games.length) return true;
  const byGame = new Map(summaries.map(summary => [summary.gameId || summary.id, summary]));
  return games.every(game => {
    const summary = byGame.get(game.id);
    return Boolean(summary && Number(summary.schemaVersion) >= PUBLIC_GAME_SUMMARY_SCHEMA_VERSION);
  });
}
