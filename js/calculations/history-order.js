const lastSequenceByGame = new Map();

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function historySequenceValues(game = {}) {
  const events = (game.playEvents || []).map(item => numeric(item.sequence || item.createdAt));
  const substitutions = Object.values(game.quarterParticipation || {}).flatMap(q =>
    (q?.substitutions || []).map(item => numeric(item.sequence))
  );
  return [...events, ...substitutions, ...Object.values(game.eventSequenceOverrides || {}).map(numeric)];
}

// Millisecond time occupies the high digits; the final three digits are a
// monotonic client counter. The result stays below Number.MAX_SAFE_INTEGER.
export function nextHistorySequence(game = {}, now = Date.now()) {
  const key = String(game.id || 'unknown');
  const floor = Math.trunc(numeric(now)) * 1000;
  const existing = Math.max(0, ...historySequenceValues(game));
  const previous = numeric(lastSequenceByGame.get(key));
  const next = Math.max(floor, existing + 1, previous + 1);
  lastSequenceByGame.set(key, next);
  return next;
}

export function prepareHistoryOperation(game = {}, { id, now = Date.now() } = {}) {
  return {operationId: id || crypto.randomUUID(), sequence: nextHistorySequence(game, now), createdAt: now};
}

export function compareHistoryItems(a = {}, b = {}) {
  return numeric(a.sortValue ?? a.sequence ?? a.createdAt) - numeric(b.sortValue ?? b.sequence ?? b.createdAt)
    || String(a.eventId || a.id || '').localeCompare(String(b.eventId || b.id || ''));
}

export function mergeHistoryItems(saved = [], optimistic = []) {
  const merged = new Map(saved.map(item => [item.eventId || item.id, item]));
  for (const item of optimistic) merged.set(item.eventId || item.id, {...merged.get(item.eventId || item.id), ...item});
  return [...merged.values()].sort(compareHistoryItems);
}

export function resetHistorySequenceForTests() { lastSequenceByGame.clear(); }
