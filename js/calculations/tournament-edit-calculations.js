import { normalizeStandaloneTournamentName, findDuplicateStandaloneTournament } from './tournament-registration-calculations.js';
import { seasonIdForLabel } from './season-calculations.js';

export const TOURNAMENT_EDIT_FIELDS = ['name', 'year', 'seasonId', 'season', 'generation', 'category', 'prefecture', 'tournamentLevel'];
export function tournamentSeasonId(record = {}) {
  return record.seasonId || seasonIdForLabel(record.season || record.generation || `${record.year}-${String(Number(record.year) + 1).slice(-2)}`);
}
export function tournamentEditBaseline(record = {}) {
  return JSON.stringify(TOURNAMENT_EDIT_FIELDS.map(key => record[key] ?? ''));
}
export function tournamentMatchesRecord(record, tournament, nameField = 'tournamentName') {
  if (record.tournamentId) return record.tournamentId === tournament.id;
  if (normalizeStandaloneTournamentName(record[nameField]) !== normalizeStandaloneTournamentName(tournament.name)) return false;
  // Older games store only a name. A calendar year distinguishes repeat events;
  // a known generation must also match. Unscoped records are never guessed.
  const year = Number(record.year || String(record.date || record.gameDate || '').slice(0, 4));
  if (!year || year !== Number(tournament.year)) return false;
  if ((record.seasonId || record.season || record.generation) && tournamentSeasonId(record) !== tournamentSeasonId(tournament)) return false;
  return true;
}
export function tournamentReferencePatch(record, original, patch, kind) {
  if (kind === 'games') {
    return tournamentMatchesRecord(record, original, 'tournament') ? { tournament: patch.name, tournamentId: original.id } : null;
  }
  if (kind === 'tournamentGames') {
    return tournamentMatchesRecord(record, original) ? { tournamentName: patch.name, tournamentId: original.id } : null;
  }
  if (kind !== 'opponentTeams') return null;
  let changed = false;
  const tournamentPlacements = (record.tournamentPlacements || []).map(item => {
    if (!tournamentMatchesRecord(item, original)) return item;
    changed = true;
    return { ...item, tournamentId: original.id, tournamentName: patch.name,
      ...Object.fromEntries(TOURNAMENT_EDIT_FIELDS.filter(key => key !== 'name' && (patch[key] ?? '') !== (original[key] ?? '')).map(key => [key, patch[key]])) };
  });
  return changed ? { tournamentPlacements } : null;
}

// Read the latest linked records inside the transaction, preserving simultaneous
// stat/roster edits. A failed save cannot leave only part of a rename applied.
export async function commitTournamentEdit(store, original, patch) {
  const tournaments = await store.list('tournaments');
  if (findDuplicateStandaloneTournament(tournaments.filter(item => item.id !== original.id), patch.name, patch.year)) {
    throw new Error('同じ開催年度・大会名の大会が登録されています');
  }
  const candidates = [];
  for (const kind of ['games', 'tournamentGames', 'opponentTeams']) {
    for (const row of await store.list(kind)) {
      if (tournamentReferencePatch(row, original, patch, kind)) candidates.push({ kind, id: row.id });
    }
  }
  if (candidates.length > 450) throw new Error('関連データが多いため保存できません。管理者にお問い合わせください');
  return store.transaction(async transaction => {
    const current = await transaction.read('tournaments', original.id);
    if (!current) throw new Error('この大会は削除されています。一覧を更新してください');
    if (tournamentEditBaseline(current) !== tournamentEditBaseline(original)) throw new Error('別の端末で大会が変更されました。一覧を更新してから修正してください');
    const rows = [];
    for (const candidate of candidates) rows.push({ ...candidate, data: await transaction.read(candidate.kind, candidate.id) });
    for (const { kind, id, data } of rows) {
      if (!data) continue;
      let referencePatch = tournamentReferencePatch(data, original, patch, kind);
      if (!referencePatch) continue;
      if (kind === 'opponentTeams') referencePatch = { ...referencePatch, ...store.calculateTeam({ ...data, ...referencePatch }) };
      transaction.write(kind, id, { ...referencePatch, updatedAt: store.timestamp() });
    }
    transaction.write('tournaments', original.id, { ...patch, updatedAt: store.timestamp() });
    return { ...current, ...patch, id: original.id };
  });
}
