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

function jumpTo(direction) {
  const target = direction === "bottom"
    ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    : 0;
  window.scrollTo({ top: target, behavior: "smooth" });
  savedScrollY = target;
}

function ensureFixedNavigation() {
  let nav = document.getElementById("gameListFixedNav");
  if (!nav) {
    nav = document.createElement("div");
    nav.id = "gameListFixedNav";
    nav.className = "game-list-fixed-nav";
    nav.setAttribute("aria-label", "試合一覧移動");
    nav.innerHTML = `
      <button type="button" class="game-list-fixed-nav-btn" data-game-list-fixed-jump="top">
        <span aria-hidden="true">↑</span><span>最上部</span>
      </button>
      <span class="game-list-fixed-nav-divider" aria-hidden="true"></span>
      <button type="button" class="game-list-fixed-nav-btn" data-game-list-fixed-jump="bottom">
        <span aria-hidden="true">↓</span><span>最下部</span>
      </button>
    `;
    document.body.appendChild(nav);
    nav.querySelector('[data-game-list-fixed-jump="top"]')?.addEventListener("click", () => jumpTo("top"));
    nav.querySelector('[data-game-list-fixed-jump="bottom"]')?.addEventListener("click", () => jumpTo("bottom"));
  }

  const visible = isGamesTab() && Boolean(document.querySelector("#view .game-sort-item, #view .game-sort-control"));
  nav.classList.toggle("is-visible", visible);
  document.body.classList.toggle("has-game-list-fixed-nav", visible);
  if (visible) restorePosition();
}

const style = document.createElement("style");
style.textContent = `
.game-list-fixed-nav{
  display:none;
  position:fixed;
  left:50%;
  bottom:18px;
  transform:translateX(-50%);
  z-index:80;
  align-items:center;
  min-width:220px;
  padding:6px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:14px;
  background:rgba(0,0,0,.96);
  box-shadow:0 8px 24px rgba(0,0,0,.32);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
}
.game-list-fixed-nav.is-visible{display:flex}
.game-list-fixed-nav-btn{
  appearance:none;
  border:0;
  background:transparent;
  color:#fff;
  flex:1;
  min-height:40px;
  padding:6px 16px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  border-radius:10px;
  font:inherit;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
}
.game-list-fixed-nav-btn:active{background:rgba(255,255,255,.10)}
.game-list-fixed-nav-divider{width:1px;height:24px;background:rgba(255,255,255,.16)}
body.has-game-list-fixed-nav #view{padding-bottom:76px}
@media(max-width:800px){
  .game-list-fixed-nav{
    left:12px;
    right:12px;
    bottom:calc(70px + env(safe-area-inset-bottom));
    transform:none;
    width:auto;
    min-width:0;
    border-radius:13px;
  }
  .game-list-fixed-nav-btn{min-height:42px;padding:6px 12px;font-size:12px}
  body.has-game-list-fixed-nav #view{padding-bottom:132px}
}
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
      ensureFixedNavigation();
    });
  }).observe(view, { childList: true, subtree: true });
}

ensureFixedNavigation();
