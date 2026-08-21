export const DEFAULT_QUARTER_DURATION_MINUTES = 8;

const integer = value => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
const unique = values => [...new Set((values || []).filter(Boolean))];

export function quarterDurationSeconds(game = {}) {
  if (Number(game.quarterDurationSeconds) > 0) return integer(game.quarterDurationSeconds);
  return Math.max(1, integer(game.quarterDurationMinutes) || DEFAULT_QUARTER_DURATION_MINUTES) * 60;
}

export function participationRequired(game = {}) {
  return game.participationMode === "required";
}

export function quarterParticipation(game = {}, quarter = 1) {
  return game.quarterParticipation?.[`q${integer(quarter)}`] || { starters: [], substitutions: [] };
}

export function sortSubstitutions(substitutions = []) {
  return [...substitutions].sort((a, b) => {
    const time = integer(b.remainingSeconds) - integer(a.remainingSeconds);
    if (time) return time;
    return integer(a.sequence) - integer(b.sequence);
  });
}

export function validateQuarterParticipation({ starters = [], substitutions = [], durationSeconds = 480 } = {}) {
  const initial = unique(starters);
  if (initial.length !== 5) return { valid: false, error: "Q開始メンバーを5人設定してください。", lineups: [], secondsByPlayer: {} };
  const onCourt = new Set(initial), secondsByPlayer = {}, lineups = [];
  let cursor = integer(durationSeconds);
  const events = sortSubstitutions(substitutions);
  const addInterval = next => {
    const elapsed = cursor - next;
    if (elapsed < 0) return false;
    onCourt.forEach(id => secondsByPlayer[id] = (secondsByPlayer[id] || 0) + elapsed);
    cursor = next;
    return true;
  };
  for (const event of events) {
    const remaining = integer(event.remainingSeconds);
    if (remaining < 0 || remaining > durationSeconds) return { valid: false, eventId: event.id, error: `残り時間は0:00～${formatClock(durationSeconds)}で入力してください。`, lineups, secondsByPlayer };
    if (!addInterval(remaining)) return { valid: false, eventId: event.id, error: "交代履歴の時刻が不正です。", lineups, secondsByPlayer };
    if (!onCourt.has(event.playerOutId)) return { valid: false, eventId: event.id, error: `${event.playerOutLabel || event.playerOutId}は${formatClock(remaining)}時点で出場中ではありません。`, lineups, secondsByPlayer };
    if (onCourt.has(event.playerInId)) return { valid: false, eventId: event.id, error: `${event.playerInLabel || event.playerInId}は${formatClock(remaining)}時点ですでに出場中です。`, lineups, secondsByPlayer };
    onCourt.delete(event.playerOutId);
    onCourt.add(event.playerInId);
    lineups.push({ eventId: event.id, remainingSeconds: remaining, players: [...onCourt] });
  }
  addInterval(0);
  return { valid: onCourt.size === 5, error: onCourt.size === 5 ? "" : "出場人数が5人ではありません。", currentPlayers: [...onCourt], endPlayers: [...onCourt], lineups, secondsByPlayer, substitutions: events };
}

export function currentPlayersAt(game = {}, quarter = 1, remainingSeconds = 0) {
  const q = quarterParticipation(game, quarter), durationSeconds = quarterDurationSeconds(game);
  const filtered = sortSubstitutions(q.substitutions).filter(event => integer(event.remainingSeconds) >= integer(remainingSeconds));
  return validateQuarterParticipation({ starters: q.starters, substitutions: filtered, durationSeconds }).currentPlayers || [];
}

export function gamePlayingTime(game = {}) {
  const totals = {};
  const qCount = Math.max(1, integer(game.quarters || game.quarterCount || 4));
  for (let quarter = 1; quarter <= qCount; quarter++) {
    const q = quarterParticipation(game, quarter);
    const result = validateQuarterParticipation({ ...q, durationSeconds: quarterDurationSeconds(game) });
    if (!result.valid) continue;
    Object.entries(result.secondsByPlayer).forEach(([id, seconds]) => totals[id] = (totals[id] || 0) + seconds);
  }
  return totals;
}

export function playerPlayingTime(game = {}, playerId = "", quarter = null) {
  const quarters = quarter == null
    ? Array.from({ length: Math.max(1, integer(game.quarters || game.quarterCount || 4)) }, (_, index) => index + 1)
    : [Math.max(1, integer(quarter))];
  let registered = false, seconds = 0;
  for (const quarterNumber of quarters) {
    const participation = quarterParticipation(game, quarterNumber);
    if (unique(participation.starters).length !== 5) continue;
    const result = validateQuarterParticipation({ ...participation, durationSeconds: quarterDurationSeconds(game) });
    if (!result.valid) continue;
    registered = true;
    seconds += integer(result.secondsByPlayer[playerId]);
  }
  return { registered, seconds };
}

export function averagePlayerPlayingTime(games = [], playerId = "") {
  const registered = games.map(game => playerPlayingTime(game, playerId)).filter(item => item.registered);
  if (!registered.length) return { registered: false, seconds: 0, gameCount: 0 };
  return {
    registered: true,
    seconds: Math.round(registered.reduce((total, item) => total + item.seconds, 0) / registered.length),
    gameCount: registered.length
  };
}

export function formatClock(value) {
  const seconds = Math.max(0, integer(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function parseRemainingTime(minutes, seconds, durationSeconds) {
  const m = integer(minutes), s = integer(seconds);
  if (m < 0 || s < 0 || s >= 60) return { valid: false, error: "秒は0～59で入力してください。" };
  const value = m * 60 + s;
  if (value < 0 || value > durationSeconds) return { valid: false, error: `残り時間は0:00～${formatClock(durationSeconds)}で入力してください。` };
  return { valid: true, remainingSeconds: value };
}

export function createTemporaryPlayer({ id, gameId, number = "", name = "" } = {}) {
  const uniqueId = id || `temp_${gameId || "game"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  return { id: uniqueId, type: "unregistered", gameId: gameId || "", number: String(number || ""), name: String(name || "") };
}
