export const ALL_FILTER_VALUE = "";
export const UNSET_FILTER_VALUE = "__unset__";

export function normalizeOpponentName(value = "") {
  return String(value).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function opponentNames(team = {}) {
  const aliases = [team.aliases, team.alias, team.alternateNames].flat().filter(Boolean);
  return [team.teamName, team.normalizedTeamName, ...aliases].map(normalizeOpponentName).filter(Boolean);
}

export function resolveOpponentTeam(game = {}, opponentTeams = []) {
  if (game.opponentTeamId) {
    const byId = opponentTeams.find(team => team.id === game.opponentTeamId);
    if (byId) return byId;
  }
  const gameName = normalizeOpponentName(game.opponentTeamName || game.opponent || "");
  if (!gameName) return null;
  return opponentTeams.find(team => opponentNames(team).includes(gameName)) || null;
}

export function opponentCategoryForGame(game, opponentTeams = []) {
  return String(game?.category || "").trim();
}

export function opponentRankForGame(game, opponentTeams = []) {
  const team = resolveOpponentTeam(game, opponentTeams);
  const seasonId = game?.seasonId || "season_2026_27";
  const label = seasonId.replace(/^season_/, "").replace("_", "-");
  return String(game?.opponentRankAtGame || team?.teamSeasonData?.[seasonId]?.rank || team?.seasonRanks?.[label]?.rank || team?.calculatedRank || team?.teamRank || team?.rank || "").trim();
}

export function getOpponentCategoryOptions(games = []) {
  return [...new Set(games.map(game => game.category).map(normalizeCategoryKey).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
}

export function getOpponentRankOptions(opponentTeams = [], rankDefinitions = []) {
  const values = opponentTeams.flatMap(team => [team.calculatedRank, team.teamRank, team.rank, ...Object.values(team.teamSeasonData || {}).map(item=>item?.rank), ...Object.values(team.seasonRanks || {}).map(item=>item?.rank)]);
  const available = new Set(values.map(value => String(value || "").trim()).filter(Boolean));
  const defined = rankDefinitions.filter(rank => available.has(rank));
  const extra = [...available].filter(rank => !rankDefinitions.includes(rank)).sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
  return [...defined, ...extra];
}

export function filterByOpponentCategory(games = [], selected = ALL_FILTER_VALUE, opponentTeams = []) {
  return filterByRegisteredGameCategory(games, selected);
}

export function filterByRegisteredGameCategory(games = [], selected = ALL_FILTER_VALUE) {
  if (selected === ALL_FILTER_VALUE) return games;
  return games.filter(game => {
    const category = opponentCategoryForGame(game);
    return selected === UNSET_FILTER_VALUE ? !category : normalizeCategoryKey(category) === normalizeCategoryKey(selected);
  });
}

export function filterByOpponentRank(games = [], selected = ALL_FILTER_VALUE, opponentTeams = []) {
  if (selected === ALL_FILTER_VALUE) return games;
  return games.filter(game => {
    const rank = opponentRankForGame(game, opponentTeams);
    return selected === UNSET_FILTER_VALUE ? !rank : rank === selected;
  });
}

export function normalizeCategoryKey(value = "") {
  const normalized = String(value).normalize("NFKC").trim().toUpperCase();
  const ageCategory = normalized.match(/U(?:13|14|15)/)?.[0];
  return ageCategory || normalized.replace(/\s+/g, "");
}

export function opponentCategoriesMatch(gameCategory = "", opponentCategory = "") {
  const gameKey = normalizeCategoryKey(gameCategory);
  const opponentKey = normalizeCategoryKey(opponentCategory);
  return Boolean(gameKey && opponentKey && gameKey === opponentKey);
}

export function filterByOpponentRankRange(games = [], minimum = ALL_FILTER_VALUE, maximum = ALL_FILTER_VALUE, opponentTeams = [], rankDefinitions = []) {
  if (!minimum && !maximum) return games;
  const order = [...rankDefinitions];
  const minimumIndex = minimum ? order.indexOf(minimum) : 0;
  const maximumIndex = maximum ? order.indexOf(maximum) : order.length - 1;
  const low = Math.min(minimumIndex < 0 ? 0 : minimumIndex, maximumIndex < 0 ? order.length - 1 : maximumIndex);
  const high = Math.max(minimumIndex < 0 ? 0 : minimumIndex, maximumIndex < 0 ? order.length - 1 : maximumIndex);
  return games.filter(game => {
    const rankIndex = order.indexOf(opponentRankForGame(game, opponentTeams));
    return rankIndex >= low && rankIndex <= high;
  });
}

export function filterByOpponentFilters(games = [], category = ALL_FILTER_VALUE, rank = ALL_FILTER_VALUE, opponentTeams = []) {
  return filterByOpponentRank(filterByOpponentCategory(games, category, opponentTeams), rank, opponentTeams);
}

export function filterByOpponentFilterRange(games = [], category = ALL_FILTER_VALUE, minimumRank = ALL_FILTER_VALUE, maximumRank = ALL_FILTER_VALUE, opponentTeams = [], rankDefinitions = []) {
  return filterByOpponentRankRange(filterByOpponentCategory(games, category, opponentTeams), minimumRank, maximumRank, opponentTeams, rankDefinitions);
}

export function filterByAggregationCondition(games = [], mode = "all", target = "", periodStart = "", periodEnd = "") {
  if (mode === "game") return target ? games.filter(game => game.id === target) : [];
  if (mode === "tournament") return target ? games.filter(game => game.tournament === target) : [];
  if (mode === "day") return target ? games.filter(game => game.date === target) : [];
  if (mode === "month") return target ? games.filter(game => (game.date || "").slice(0, 7) === target) : [];
  if (mode === "year") return target ? games.filter(game => (game.date || "").slice(0, 4) === target) : [];
  if (mode === "period") return games.filter(game => (!periodStart || game.date >= periodStart) && (!periodEnd || game.date <= periodEnd));
  return games;
}
