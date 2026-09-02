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
assert.match(css, /\.basic-stats-fouls\{[^}]*justify-content:flex-end[^}]*color:var\(--analysis-orange\)/);
assert.match(app, /basic-stats-fouls[^`]*FOUL[^`]*被FOUL/);
assert.match(appCss, /\.analysis-screen\{--analysis-orange:#ff9800\}/);
assert.doesNotMatch(css, /\.basic-stats-title\{[^}]*flex-direction:column/);
assert.match(index, /min-display\.css\?v=20260901-team-detail-min-v2/);
assert.match(index, /js\/app\.js\?v=20260902-history-order-v1/);
assert.match(app, /function teamStatsHeading\(game\)/);
assert.match(app, /teamStatsHeading\(state\.teamMode==='game'\?g:null\)/);
assert.match(app, /onclick="openGameHistory\('\$\{game\.id\}'\)"/);
assert.match(css, /\.team-stats-heading\{[^}]*justify-content:space-between/);

console.log("analysis game info layout contract passed");
