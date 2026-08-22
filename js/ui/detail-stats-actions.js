export function detailStatsActionBar(gameId, playerId, canEdit) {
  const editActions = canEdit
    ? `<button class="btn" onclick="openDetailStatsForm('${gameId}')">個人スタッツ修正</button><button class="btn danger" onclick="deletePlayerStats('${gameId}', '${playerId}')">個人スタッツ削除</button>`
    : "";
  const gameEdit = canEdit
    ? `<button class="btn small detail-game-edit" onclick="openGameForm('${gameId}')">試合情報修正</button>`
    : "";
  return `<div id="detailStatsActions" class="analysis-back-row detail-stats-actions"><div class="detail-primary-actions"><button class="btn ghost" onclick="goBackGames()">戻る</button><button class="btn ghost" onclick="openGameHistory('${gameId}')">履歴</button>${editActions}</div>${gameEdit}</div>`;
}

export function selectedStatsDeleteTarget(registrationType, selectedView) {
  if (registrationType === "quarter" && /^q[1-9]\d*$/.test(selectedView)) {
    return { type: "quarter", quarter: Number(selectedView.slice(1)) };
  }
  return { type: "game" };
}

export const detailStatsScrollOptions = Object.freeze({ top: 0, behavior: "smooth" });

export function renderDetailAtTop({ render, schedule, scroll }) {
  render();
  schedule(() => scroll(detailStatsScrollOptions));
}

function showSavedToast() {
  if (typeof document === "undefined") return;
  const element = document.querySelector("#toast");
  if (!element) return;
  element.textContent = "保存しました";
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 1800);
}

export async function saveStatsAndReturnToTop({ save, onSuccess, onFailure, schedule, scroll }) {
  try {
    await save();
    const keepStatsFormOpen = typeof document !== "undefined"
      && Boolean(document.querySelector(".stats-form-actions"));

    if (keepStatsFormOpen) {
      document.querySelectorAll(".stat-dirty").forEach(element => element.classList.remove("stat-dirty"));
      showSavedToast();
    } else {
      onSuccess();
      schedule(() => scroll(detailStatsScrollOptions));
    }
    return true;
  } catch (error) {
    onFailure(error);
    return false;
  }
}
