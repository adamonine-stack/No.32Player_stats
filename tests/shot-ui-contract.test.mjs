import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/shot-registration.css", import.meta.url), "utf8");

assert.match(app, /selectedShotId=editingShot\?\.id\|\|''/);
assert.match(app, /data-select-shot=/);
assert.match(app, /shot-selection-ring/);
assert.match(app, /shot-foul-ring/);
assert.match(app, /event\.stopPropagation\(\)/);
assert.match(app, /id="shotWasFouled"/);
assert.match(app, /data-shot-filter="foul"/);
assert.match(app, /表示ポイント：/);
assert.match(app, /FG試投：/);
assert.match(css, /\.shot-list-row\.selected/);
assert.match(css, /\.shot-foul-ring/);
assert.match(css, /\.shot-selection-ring/);
assert.match(css, /prefers-reduced-motion/);

console.log("shot UI contract: ok");
