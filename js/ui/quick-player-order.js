import { state } from "../core/state.js";

function reorderQuickPlayers() {
  const grid = document.querySelector("#modalRoot .quick-player-grid");
  if (!grid) return;

  const buttons = [...grid.querySelectorAll(".quick-player[data-quick-player]")];
  if (buttons.length < 2) return;

  const order = new Map((state.players || []).map((player, index) => [player.id, index]));
  const currentIds = buttons.map(button => button.dataset.quickPlayer || "");
  const sorted = [...buttons].sort((a, b) => {
    const aIndex = order.has(a.dataset.quickPlayer) ? order.get(a.dataset.quickPlayer) : Number.MAX_SAFE_INTEGER;
    const bIndex = order.has(b.dataset.quickPlayer) ? order.get(b.dataset.quickPlayer) : Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex || currentIds.indexOf(a.dataset.quickPlayer) - currentIds.indexOf(b.dataset.quickPlayer);
  });

  if (sorted.every((button, index) => button === buttons[index])) return;
  sorted.forEach(button => grid.appendChild(button));
}

const root = document.getElementById("modalRoot");
if (root) {
  const observer = new MutationObserver(reorderQuickPlayers);
  observer.observe(root, { childList: true, subtree: true });
  reorderQuickPlayers();
}
