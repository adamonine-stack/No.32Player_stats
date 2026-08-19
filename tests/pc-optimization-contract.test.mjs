import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/pc-optimization.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

assert.match(css, /@media \(min-width: 801px\)/, "desktop rules are isolated from phone layout");
assert.match(css, /\.stats-form-grid\s*\{\s*grid-template-columns:\s*repeat\(7,/, "wide desktop stats form uses one-screen rows");
assert.match(css, /\.card:has\(#saveGame\)/, "game registration has a desktop-sized modal");
assert.match(css, /\.opponent-team-list\s*\{\s*grid-template-columns:\s*repeat\(2,/, "desktop opponent list uses two columns");
assert.ok(html.includes("styles/pc-optimization.css?v=20260819-pc-layout-v1"), "desktop stylesheet is loaded last");

const saveStats = app.slice(app.indexOf("$('#saveStats').onclick"), app.indexOf("$('#closeModal').onclick", app.indexOf("$('#saveStats').onclick")));
assert.ok(saveStats.includes("setDetailStatsView(gameId,`q${selectedQuarter}`)"), "save keeps the selected quarter on desktop and mobile");
assert.ok(saveStats.includes("saveStatsAndReturnToTop"), "save returns the rendered detail screen to the top on desktop and mobile");

console.log("pc optimization contract: ok");
