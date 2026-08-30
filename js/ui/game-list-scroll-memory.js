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

function ensureJumpControls() {
  if (!isGamesTab()) return;
  const view = document.getElementById("view");
  const card = view?.querySelector(".card");
  if (!card || !card.querySelector("h2")?.textContent?.includes("試合一覧")) return;
  if (card.querySelector(".game-list-jump-controls")) {
    restorePosition();
    return;
  }

  const controls = document.createElement("div");
  controls.className = "game-list-jump-controls";
  controls.innerHTML = `
    <button type="button" class="btn small ghost" data-game-list-jump="top" aria-label="試合一覧の最上部へ">↑ 最上部</button>
    <button type="button" class="btn small ghost" data-game-list-jump="bottom" aria-label="試合一覧の最下部へ">↓ 最下部</button>
  `;

  const sortControl = card.querySelector(".game-sort-control");
  if (sortControl) sortControl.insertAdjacentElement("afterend", controls);
  else card.prepend(controls);

  controls.querySelector('[data-game-list-jump="top"]')?.addEventListener("click", () => jumpTo("top"));
  controls.querySelector('[data-game-list-jump="bottom"]')?.addEventListener("click", () => jumpTo("bottom"));
  restorePosition();
}

const style = document.createElement("style");
style.textContent = `
.game-list-jump-controls{display:flex;justify-content:flex-end;gap:8px;margin:8px 0 10px;position:sticky;top:max(8px,env(safe-area-inset-top));z-index:4;pointer-events:none}
.game-list-jump-controls .btn{pointer-events:auto;min-height:36px;padding:6px 10px;background:rgba(7,17,38,.92);backdrop-filter:blur(8px)}
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

const view = document.getElementById("view");
if (view) {
  new MutationObserver(() => ensureJumpControls()).observe(view, { childList: true, subtree: true });
  ensureJumpControls();
}
