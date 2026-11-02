import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

function functionBody(start, end) {
  const from = app.indexOf(start);
  assert.ok(from >= 0, `Missing function: ${start}`);
  const to = app.indexOf(end, from + start.length);
  assert.ok(to > from, `Missing section end: ${end}`);
  return app.slice(from, to);
}

const analysis = functionBody("function statsViewV2()", "function filterItems(");
const fallbackAnalysis = functionBody("function statsView()", "function aggregationModeButtons(");
const header = functionBody("function statsHead(", "function mobileGameAnalysis(");

// Every analysis filter now displays actual totals, not normalized four-quarter averages.
assert.match(analysis, /const r=sumStats\(items\),per=false,filter=/);
assert.match(fallbackAnalysis, /const per=false;let targetControl/);
assert.match(header, /const basicTitle='基本スタッツ（対象試合合計）'/);
assert.match(header, /\$\{analysisBasic\(r,false\)\}/);
assert.doesNotMatch(header, /基本スタッツ（1試合4Q換算）/);
assert.match(app, /return homeTotalPlayingTime\(gamesWithStats\(targetGames\(\),p\.id\),p\.id\)/);

// Tournament date range and counts have separate layout containers.
assert.match(header, /class="analysis-date summary-meta">\$\{periodLabel\}<div class="summary-counts">/);
assert.match(css, /\.analysis-screen \.analysis-summary-info \.analysis-date\.summary-meta\{[\s\S]*?flex-direction:column!important;/);
assert.match(css, /\.analysis-screen \.analysis-summary-info \.summary-meta \.summary-counts\{[\s\S]*?flex-wrap:wrap!important;/);
assert.match(css, /@media\(max-width:800px\)\{\s*\.analysis-screen \.analysis-summary-info \.summary-meta \.summary-counts\{[\s\S]*?flex-direction:column!important;/);

// Home screen still offers its independent four-quarter average mode.
assert.match(app, /1試合4Q換算平均/);
assert.match(index, /styles\/app\.css\?v=20261102-analysis-total-layout-v1/);
assert.match(index, /js\/app\.js\?v=20261102-analysis-total-layout-v1/);
assert.match(worker, /r32-shell-20261102-analysis-total-layout-v1/);

console.log("analysis raw stats summary and responsive layout contract passed");
