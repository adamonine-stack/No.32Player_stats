import { state } from "../core/state.js";

let savedScrollY = 0;
let restoreRequested = false;
let scrollScheduled = false;

function isGamesTab() {
  return state.tab === "games";
}

function rememberPosition() {
  if (!isGamesTab()) return;
  savedScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
}

function requestRestore() {
  restoreRequested = true;
}

function restorePosition() {
  if (!restoreRequested || !isGamesTab()) return;
  restoreRequested = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.scrollTo({ top: savedScrollY, behavior: "auto" });
  }));
}

function jumpTo(top) {
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const target = top === "bottom" ? max : 0;
  window.scrollTo({ top: target, behavior: "smooth" });
  savedScrollY = target;
}

function controlsMarkup() {
  return `
    <button type="button" class="btn small ghost" data-game-list-jump="top" aria-label="試合一覧の最上部へ">↑ 最上部</button>
    <button type="button" class="btn small ghost" data-game-list-jump="bottom" aria-label="試合一覧の最下部へ">↓ 最下部</button>
  `;
}

function bindControls(scope) {
  scope.querySelectorAll('[data-game-list-jump="top"]').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => jumpTo("top"));
  });
  scope.querySelectorAll('[data-game-list-jump="bottom"]').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => jumpTo("bottom"));
  });
}

function ensureJumpControls() {
  if (!isGamesTab()) return;
  const view = document.getElementById("view");
  const card = view?.querySelector(".card");
  if (!card || !card.querySelector("h2")?.textContent?.includes("試合一覧")) return;

  card.querySelectorAll(".game-list-jump-controls").forEach(node => node.remove());

  const gameItems = [...card.querySelectorAll(".game-sort-item")];
  const insertControl = beforeNode => {
    const controls = document.createElement("div");
    controls.className = "game-list-jump-controls";
    controls.innerHTML = controlsMarkup();
    if (beforeNode) card.insertBefore(controls, beforeNode);
    else card.appendChild(controls);
    bindControls(controls);
  };

  const firstItem = gameItems[0];
  if (firstItem) insertControl(firstItem);
  else {
    const sortControl = card.querySelector(".game-sort-control");
    if (sortControl) {
      const controls = document.createElement("div");
      controls.className = "game-list-jump-controls";
      controls.innerHTML = controlsMarkup();
      sortControl.insertAdjacentElement("afterend", controls);
      bindControls(controls);
    }
  }

  const interval = window.matchMedia("(max-width: 800px)").matches ? 6 : 10;
  gameItems.forEach((item, index) => {
    const position = index + 1;
    if (position % interval === 0 && position < gameItems.length) {
      insertControl(item.nextSibling);
    }
  });

  if (gameItems.length) insertControl(null);
  restorePosition();
}

const style = document.createElement("style");
style.textContent = `
.game-list-jump-controls{display:flex;justify-content:flex-end;gap:8px;margin:10px 0;position:static;z-index:auto}
.game-list-jump-controls .btn{min-height:36px;padding:6px 10px}
@media(max-width:800px){.game-list-jump-controls{justify-content:space-between}.game-list-jump-controls .btn{flex:1;max-width:140px;font-size:12px}}
`;
document.head.appendChild(style);

document.addEventListener("click", event => {
  const tabButton = event.target.closest("#mobileNav button[data-tab],#pcNav button[data-tab]");
  if (!tabButton) return;
  if (isGamesTab() && tabButton.dataset.tab !== "games") rememberPosition();
  if (tabButton.dataset.tab === "games" && !isGamesTab()) requestRestore();
}, true);

window.addEventListener("scroll", () => {
  if (!isGamesTab() || scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    rememberPosition();
    scrollScheduled = false;
  });
}, { passive: true });

let refreshScheduled = false;
const view = document.getElementById("view");
if (view) {
  new MutationObserver(() => {
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(() => {
      refreshScheduled = false;
      ensureJumpControls();
    });
  }).observe(view, { childList: true, subtree: true });
  ensureJumpControls();
}
