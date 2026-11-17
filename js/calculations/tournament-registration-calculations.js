// Helpers for registering tournament master data without creating a game.
export function normalizeStandaloneTournamentName(value = '') {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('ja');
}

export function findDuplicateStandaloneTournament(tournaments = [], name = '', year = 0) {
  const key = normalizeStandaloneTournamentName(name);
  const targetYear = Number(year);
  if (!key || !Number.isInteger(targetYear)) return null;
  return tournaments.find(item =>
    normalizeStandaloneTournamentName(item?.name || item?.tournamentName) === key &&
    Number(item?.year) === targetYear
  ) || null;
}

export function buildStandaloneTournament({ name, year, seasonId, seasonName, prefecture = '', category = '', tournamentLevel = '' } = {}) {
  const displayName = String(name ?? '').trim();
  const parsedYear = Number(year);
  if (!normalizeStandaloneTournamentName(displayName)) throw new Error('大会名を入力してください');
  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) throw new Error('開催年度を正しく入力してください');
  if (!seasonId || seasonId === 'all' || !seasonName) throw new Error('登録先の世代を選択してください');
  if (tournamentLevel && !['prefecture', 'block', 'national'].includes(tournamentLevel)) throw new Error('大会区分が不正です');
  return {
    name: displayName,
    year: parsedYear,
    seasonId,
    season: seasonName,
    generation: seasonName,
    ...(String(prefecture).trim() ? { prefecture: String(prefecture).trim() } : {}),
    ...(String(category).trim() ? { category: String(category).trim() } : {}),
    ...(tournamentLevel ? { tournamentLevel } : {}),
    sourceType: 'manual'
  };
}
