export const LAST_PLAYER_KEY = "r32_last_player";

export function getLastPlayerId() {
  return localStorage.getItem(LAST_PLAYER_KEY) || "";
}

export function setLastPlayerId(playerId) {
  localStorage.setItem(LAST_PLAYER_KEY, playerId || "");
}
