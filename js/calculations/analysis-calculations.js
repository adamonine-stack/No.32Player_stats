export function getGamesWithStats(games, stats, playerId = "") {
  const ids = new Set(stats.filter(stat => !playerId || stat.playerId === playerId).map(stat => stat.gameId).filter(Boolean));
  return games.filter(game => ids.has(game.id));
}

export function filterGamesByCategory(games, categoryId = "") {
  return categoryId ? games.filter(game => (game.category || "") === categoryId) : games;
}

export function filterGamesByTournament(games, tournament = "") {
  return tournament ? games.filter(game => game.tournament === tournament) : games;
}

export function filterGamesByDate(games, date = "") {
  return date ? games.filter(game => game.date === date) : games;
}

export function filterGamesByMonth(games, month = "") {
  return month ? games.filter(game => (game.date || "").slice(0, 7) === month) : games;
}

export function filterGamesByYear(games, year = "") {
  return year ? games.filter(game => (game.date || "").slice(0, 4) === year) : games;
}

export function filterGamesByPeriod(games, start = "", end = "") {
  return games.filter(game => (!start || game.date >= start) && (!end || game.date <= end));
}

export function getPlayerStatsForGames(stats, games, playerId) {
  const ids = new Set(games.map(game => game.id));
  return stats.filter(stat => stat.playerId === playerId && ids.has(stat.gameId));
}
