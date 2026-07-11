import { getLastPlayerId } from "./storage.js";

export const state = {
  user: null,
  tab: "home",
  players: [],
  games: [],
  stats: [],
  lastPlayerId: getLastPlayerId(),
  statsMode: "game",
  homeStatsMode: "total",
  targetId: "",
  categoryId: "",
  periodStart: "",
  periodEnd: "",
  selectedGameId: "",
  analysisReturn: null,
  teamMode: "game",
  teamTargetId: "",
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
