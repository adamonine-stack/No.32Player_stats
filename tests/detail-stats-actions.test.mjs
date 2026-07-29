import assert from "node:assert/strict";
import { detailStatsActionBar, selectedStatsDeleteTarget, detailStatsScrollOptions, renderDetailAtTop, saveStatsAndReturnToTop } from "../js/ui/detail-stats-actions.js";

const actions = detailStatsActionBar("game-1", "player-1", true);
const labels = ["戻る", "個人スタッツ修正", "個人スタッツ削除", "試合修正"];
let previous = -1;
for (const label of labels) {
  const position = actions.indexOf(`>${label}</button>`);
  assert.ok(position > previous, `${label} is rendered in the required order`);
  previous = position;
}
assert.match(actions, /detail-primary-actions/);
assert.match(actions, /detail-game-edit/);
assert.doesNotMatch(detailStatsActionBar("game-1", "player-1", false), /個人スタッツ修正|個人スタッツ削除|試合修正/);
assert.deepEqual(selectedStatsDeleteTarget("game", "game"), { type: "game" });
assert.deepEqual(selectedStatsDeleteTarget("quarter", "game"), { type: "game" });
assert.deepEqual(selectedStatsDeleteTarget("quarter", "q2"), { type: "quarter", quarter: 2 });
assert.deepEqual(detailStatsScrollOptions, { top: 0, behavior: "smooth" });

const openEvents = [];
renderDetailAtTop({
  render: () => openEvents.push("rendered"),
  schedule: callback => { openEvents.push("scheduled"); callback(); },
  scroll: options => openEvents.push(["scrolled", options])
});
assert.deepEqual(openEvents, ["rendered", "scheduled", ["scrolled", detailStatsScrollOptions]]);

const successEvents = [];
assert.equal(await saveStatsAndReturnToTop({
  save: async () => successEvents.push("saved"),
  onSuccess: () => successEvents.push("rendered"),
  onFailure: () => successEvents.push("failed"),
  schedule: callback => { successEvents.push("scheduled"); callback(); },
  scroll: options => successEvents.push(["scrolled", options])
}), true);
assert.deepEqual(successEvents, ["saved", "rendered", "scheduled", ["scrolled", detailStatsScrollOptions]]);

const failureEvents = [];
assert.equal(await saveStatsAndReturnToTop({
  save: async () => { throw new Error("save failed"); },
  onSuccess: () => failureEvents.push("rendered"),
  onFailure: () => failureEvents.push("failed"),
  schedule: () => failureEvents.push("scheduled"),
  scroll: () => failureEvents.push("scrolled")
}), false);
assert.deepEqual(failureEvents, ["failed"], "failed saves neither render nor scroll");
console.log("detail stats actions: ok");
