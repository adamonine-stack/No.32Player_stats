import { getGameSortDirection, getLastPlayerId } from "./storage.js";

export const state = {
  user: null,
  tab: "home",
  players: [],
  games: [],
  gameSortDirection: getGameSortDirection(),
  stats: [],
  opponentTeams: [],
  analysisCalendarMonth: "",
  teamCalendarMonth: "",
  lastPlayerId: getLastPlayerId(),
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
