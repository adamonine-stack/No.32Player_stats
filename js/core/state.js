import { getGameSortDirection, getLastPlayerId, getSelectedSeasonId } from "./storage.js";
import { DEFAULT_SEASON_ID, DEFAULT_SEASONS } from "../calculations/season-calculations.js";

const initialLastPlayerId = getLastPlayerId();

export const state = {
  user: null,
  tab: "home",
  players: [],
  allPlayers: [],
  playerSeasons: [],
  games: [],
  allGames: [],
  seasons: DEFAULT_SEASONS,
  activeSeasonId: DEFAULT_SEASON_ID,
  selectedSeasonId: getSelectedSeasonId() || DEFAULT_SEASON_ID,
  gameSortDirection: getGameSortDirection(),
  stats: [],
  opponentTeams: [],
  selectedOpponentTeamId: "",
  analysisCalendarMonth: "",
  teamCalendarMonth: "",
  _lastPlayerId: initialLastPlayerId,
  statsMode: "game",
  homeStatsMode: "total",
  targetId: "",
  categoryId: "",
  opponentRankId: "",
  opponentRankMin: "",
  opponentRankMax: "",
  analysisPreserveEmptyTarget: false,
  periodStart: "",
  periodEnd: "",
  selectedGameId: "",
  gameListReturnPosition: null,
  analysisReturn: null,
  teamMode: "game",
  teamTargetId: "",
  teamCategoryId: "",
  teamOpponentRankId: "",
  teamOpponentRankMin: "",
  teamOpponentRankMax: "",
  teamPreserveEmptyTarget: false,
  teamPeriodStart: "",
  teamPeriodEnd: "",
  teamReturn: null,
  teamDetail: null
};

Object.defineProperty(state, "lastPlayerId", {
  enumerable: true,
  configurable: false,
  get() {
    return this._lastPlayerId;
  },
  set(playerId) {
    const nextPlayerId = playerId || "";
    // Firestore snapshots can arrive before the players collection. During that
    // temporary empty state, keep the player restored from localStorage so the
    // home screen opens on the last player the user viewed.
    if (!nextPlayerId && this._lastPlayerId) return;
    this._lastPlayerId = nextPlayerId;
  }
});

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(nextState) {
  Object.assign(state, nextState);
  listeners.forEach(listener => listener(state));
}

export function updateState(updater) {
  const nextState = typeof updater === "function" ? updater(state) : updater;
  setState(nextState || {});
}

export function subscribeState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
