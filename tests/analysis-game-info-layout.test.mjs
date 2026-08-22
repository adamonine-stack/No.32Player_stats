import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/min-display.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.ok(app.includes("function withGameMatchLayout(html)"));
assert.ok(app.includes('class="analysis-match-tournament"'));
assert.ok(app.includes('class="analysis-match-opponent">vs '));
assert.ok(app.includes("withGameMatchLayout(withPlayingTimeHeading(html))"));
assert.match(css, /\.analysis-match-copy\{[^}]*display:flex[^}]*flex-direction:column/);
assert.match(css, /\.basic-stats-title\{[^}]*display:flex[^}]*align-items:baseline[^}]*justify-content:space-between/);
assert.match(css, /\.basic-stats-min\{[^}]*color:var\(--analysis-orange\)/);
assert.match(appCss, /\.analysis-screen\{--analysis-orange:#ff9800\}/);
assert.doesNotMatch(css, /\.basic-stats-title\{[^}]*flex-direction:column/);
assert.match(index, /min-display\.css\?v=20260821-3/);
assert.match(index, /js\/app\.js\?v=20260822-game-history-v1/);

console.log("analysis game info layout contract passed");
