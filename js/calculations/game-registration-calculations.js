// Shared helpers for the game registration/edit form.
export function registeredTournamentNames(games = [], tournaments = [], currentName = '') {
  const names = new Map();
  const add = value => {
    const name = String(value ?? '').trim();
    if (!name) return;
    const key = name.normalize('NFKC').toLocaleLowerCase('ja');
    if (!names.has(key)) names.set(key, name);
  };
  add(currentName);
  for (const game of games) add(game?.tournament);
  for (const tournament of tournaments) add(tournament?.name || tournament?.tournamentName);
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));
}

// Canonical game types. The old non-official flag cannot distinguish the two exchange formats.
export const GAME_TYPES = Object.freeze(['official', 'exchange_tournament', 'exchange_match']);

export function officialGameSelection(game = {}) {
  if (GAME_TYPES.includes(game?.gameType)) return game.gameType;
  if (game?.isOfficialGame === true) return 'official';
  if (game?.isOfficialGame === false) return 'unofficial';
  return '';
}

export function officialGameStatus(selection) {
  if (selection === 'official') return true;
  if (selection === 'exchange_tournament' || selection === 'exchange_match' || selection === 'unofficial') return false;
  // Never silently classify older games with no official-match flag.
  return null;
}

// On an unrelated edit, keep old undefined/ambiguous classifications untouched.
export function gameTypeFields(selection) {
  if (!GAME_TYPES.includes(selection)) return {};
  return { gameType: selection, isOfficialGame: officialGameStatus(selection) };
}

// A targeted migration: never infer a game type from a different tournament name.
export function exchangeMatchTournamentBackfill(game = {}) {
  if (String(game?.tournament ?? '').trim() !== '交流戦') return null;
  if (game?.gameType === 'exchange_match' && game?.isOfficialGame === false) return null;
  return gameTypeFields('exchange_match');
}

export function selectedTournamentName(existingSelection, newName) {
  return String(existingSelection || '').trim() || String(newName || '').trim();
}

/** Clear the generic tournament label only for a confirmed exchange match. */
export function exchangeMatchTournamentCleanup(game = {}) {
  if (String(game?.tournament ?? '').trim() !== '交流戦') return null;
  if (game?.gameType !== 'exchange_match' || game?.isOfficialGame !== false) {
    throw new Error('大会名「交流戦」の試合区分を確認できません。修正を中止します。');
  }
  return { tournament: '', tournamentId: null };
}

/** New games must not recreate 交流戦 as a tournament name. */
export function tournamentNameForGame(gameType, name) {
  const value = String(name ?? '').trim();
  return gameType === 'exchange_match' && value === '交流戦' ? '' : value;
}
