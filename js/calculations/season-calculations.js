export const DEFAULT_SEASON_ID = "season_2026_27";
export const ALL_SEASONS_ID = "all";
export const DEFAULT_SEASONS = [
  { id: "season_2025_26", name: "2025-26", startYear: 2025, endYear: 2026, sortOrder: 202526, status: "past" },
  { id: DEFAULT_SEASON_ID, name: "2026-27", startYear: 2026, endYear: 2027, sortOrder: 202627, status: "current" }
];

export const seasonRankWeightConfig = Object.freeze({
  0: { current: 0, previous: 1 },
  1: { current: .5, previous: .5 },
  2: { current: .7, previous: .3 },
  default: { current: .8, previous: .2 }
});

export function normalizeSeason(season = {}) {
  const startYear = Number(season.startYear);
  const endYear = Number(season.endYear);
  const name = season.name || (startYear && endYear ? `${startYear}-${String(endYear).slice(-2)}` : "");
  return { ...season, id: season.id || `season_${name.replace("-", "_")}`, name, startYear, endYear, sortOrder: Number(season.sortOrder || `${startYear}${String(endYear).slice(-2)}`) };
}

export function seasonIdForLabel(label = "") { return `season_${String(label).replace("-", "_")}`; }
export function seasonLabelForId(id = "") { const match = String(id).match(/^season_(\d{4})_(\d{2,4})$/); return match ? `${match[1]}-${match[2].slice(-2)}` : id; }
export function effectiveSeasonId(record = {}, fallback = DEFAULT_SEASON_ID) { return record.seasonId || fallback; }
export function migrationSeasonIdForGame(game = {}) { const date=String(game.date||game.gameDate||""); return /^2025-/.test(date)||/^2026-0[1-3]-/.test(date)?"season_2025_26":DEFAULT_SEASON_ID; }
export function filterBySeason(records = [], seasonId = DEFAULT_SEASON_ID, fallback = DEFAULT_SEASON_ID) { return seasonId === ALL_SEASONS_ID ? records : records.filter(record => effectiveSeasonId(record, fallback) === seasonId); }
export function previousSeasonId(seasons = [], seasonId = DEFAULT_SEASON_ID) { const ordered = seasons.map(normalizeSeason).sort((a,b) => a.sortOrder-b.sortOrder), index = ordered.findIndex(item => item.id === seasonId); return index > 0 ? ordered[index-1].id : ""; }
export function getSeasonRankWeight(_seasonId, tournamentCount = 0) { return seasonRankWeightConfig[tournamentCount] || seasonRankWeightConfig.default; }
export function advanceGrade(grade = "") { return grade === "U13" ? "U14" : grade === "U14" ? "U15" : grade === "U15" ? null : grade; }
export function carryPlayerSeason(source = {}) { const grade = advanceGrade(source.grade || source.category); return { grade: grade || source.grade || source.category || "その他", number: source.number || "", active: grade !== null, rolloverCandidate: grade === null }; }
export function playerForSeason(player = {}, membership = null) { if (!membership) return { ...player, grade: player.grade || player.category, category: player.category || player.grade, active: true }; return { ...player, ...membership, category: membership.grade || membership.category || player.category, seasonMembership: membership }; }
export function rankForGame(game = {}, team = {}, fallback = DEFAULT_SEASON_ID) { const seasonId = effectiveSeasonId(game, fallback), label = seasonLabelForId(seasonId), value = team.teamSeasonData?.[seasonId] || team.seasonRanks?.[label]; return game.opponentRankAtGame || value?.rank || null; }
