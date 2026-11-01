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

export function officialGameSelection(game = {}) {
  if (game?.isOfficialGame === true) return 'official';
  if (game?.isOfficialGame === false) return 'unofficial';
  return '';
}

export function officialGameStatus(selection) {
  if (selection === 'official') return true;
  if (selection === 'unofficial') return false;
  // Never silently classify older games with no official-match flag.
  return null;
}

export function selectedTournamentName(existingSelection, newName) {
  return String(existingSelection || '').trim() || String(newName || '').trim();
}
