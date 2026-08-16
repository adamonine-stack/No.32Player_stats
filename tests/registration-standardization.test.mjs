import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync(new URL("../js/app.js",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../styles/registration-standardization.css",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const gameForm=app.slice(app.indexOf("function gameForm"),app.indexOf("function shotSourceFor"));
const statsForm=app.slice(app.indexOf("function statsForm"),app.indexOf("async function import2026ShigaMen"));
const analysisList=app.slice(app.indexOf("function analysisGameTable"),app.indexOf("function homeStatsModeControl"));
const teamList=app.slice(app.indexOf("function teamGameList"),app.indexOf("function teamStatsForGames"));

assert.ok(gameForm.includes("hasQuarterScoreData(g)?'quarter':getGameStatsRegistrationType(g)"));
assert.ok(gameForm.includes("shotRegistrationMode:'detail'"));
assert.ok(gameForm.includes("registrationChoiceVisibility(g,state.stats)"));
assert.ok(gameForm.includes("data-stats-type"));
assert.ok(statsForm.includes("allowShotModeChoice"));
assert.ok(statsForm.includes("data-shooting-mode"));
assert.ok(gameForm.includes("Q毎スコアを1つ以上入力してください"));
assert.ok(statsForm.includes("!allowShotModeChoice||hasDetailedShots"));
assert.ok(!analysisList.includes("g.tournament||'大会未登録'"));
assert.ok(!teamList.includes("g.tournament||'大会未登録'"));
assert.match(css,/@media\(max-width:800px\)[\s\S]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
assert.match(css,/input\[type="date"\][\s\S]*max-width:100%/);
assert.match(css,/@media\(max-width:340px\)[\s\S]*grid-template-columns:minmax\(0,1fr\)/);
assert.ok(html.includes("registration-standardization.css?v=20260811-v2"));
assert.ok(app.includes('data-day-picker="${scope}"'),"day selection uses a tappable calendar control");
assert.ok(app.includes("state[calendarStateKey(scope)]=calendarMonthFor(selected);render()"),"day picker reopens on the selected month");
assert.ok(app.includes("date===selected?'selected':''"),"calendar marks the selected day");

console.log("registration standardization contract tests passed");
