import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync(new URL("../js/app.js",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../styles/registration-standardization.css",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const gameForm=app.slice(app.indexOf("function gameForm"),app.indexOf("function shotSourceFor"));
const statsForm=app.slice(app.indexOf("function statsForm"),app.indexOf("async function import2026ShigaMen"));
const analysisList=app.slice(app.indexOf("function analysisGameTable"),app.indexOf("function homeStatsModeControl"));
const teamList=app.slice(app.indexOf("function teamGameList"),app.indexOf("function teamStatsForGames"));

assert.ok(gameForm.includes("const currentType=g.id?getGameStatsRegistrationType(g):'quarter'"));
assert.ok(gameForm.includes("shotRegistrationMode:'detail'"));
assert.ok(!gameForm.includes("data-stats-type"));
assert.ok(!statsForm.includes("data-shooting-mode"));
assert.ok(!analysisList.includes("g.tournament||'大会未登録'"));
assert.ok(!teamList.includes("g.tournament||'大会未登録'"));
assert.match(css,/@media\(max-width:800px\)[\s\S]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
assert.match(css,/input\[type="date"\][\s\S]*max-width:100%/);
assert.match(css,/@media\(max-width:340px\)[\s\S]*grid-template-columns:minmax\(0,1fr\)/);
assert.ok(html.includes("registration-standardization.css?v=20260811-v2"));
console.log("registration standardization contract tests passed");
