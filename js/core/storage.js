export const LAST_PLAYER_KEY = "r32_last_player";
export const GAME_SORT_DIRECTION_KEY = "r32_game_sort_direction";

export function getLastPlayerId() {
  return localStorage.getItem(LAST_PLAYER_KEY) || "";
}

export function setLastPlayerId(playerId) {
  localStorage.setItem(LAST_PLAYER_KEY, playerId || "");
}

export function getGameSortDirection() {
  return localStorage.getItem(GAME_SORT_DIRECTION_KEY) === "asc" ? "asc" : "desc";
}

export function setGameSortDirection(direction) {
  localStorage.setItem(GAME_SORT_DIRECTION_KEY, direction === "asc" ? "asc" : "desc");
}
