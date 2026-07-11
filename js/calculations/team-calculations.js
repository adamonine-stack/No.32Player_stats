import { calculateTotalQuarters, gameRecord } from "./game-calculations.js";

export function getTeamTournamentGames(games, tournament) {
  return games.filter(game => game.tournament === tournament);
}

export function getTeamSingleGame(games, gameId) {
  return games.filter(game => game.id === gameId);
}

export function getTeamStatsForGames(stats, games) {
  const ids = new Set(games.map(game => game.id));
  return stats.filter(stat => ids.has(stat.gameId));
}

export function getTeamSummary(games) {
  return {
    gameCount: games.length,
    totalQ: calculateTotalQuarters(games),
    record: gameRecord(games)
  };
}
