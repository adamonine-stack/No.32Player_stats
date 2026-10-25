import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {viewDataHarness} from "./helpers/view-data-harness.mjs";

const app=readFileSync(new URL("../js/app.js",import.meta.url),"utf8");
test("startup scopes growing collections and defers opponent teams",()=>{
  for(const name of ["playerSeasons","games"])assert.match(app,new RegExp(`scopedCollection\\('${name}',seasonId\\)`),name);
  assert.match(app,/where\('gameId','in',part\)/);
  assert.match(app,/function statBucket\(id\)/);
  assert.match(app,/where\('seasonId','==',seasonId\)/);
  assert.doesNotMatch(app,/onSnapshot\(collection\(db,'(?:playerSeasons|games|stats)'\)/);
  assert.match(app,/function ensureOpponentTeamsSync\(\)/);
  assert.match(app,/\['opponentTeams','games','stats','team'\]\.includes\(tab\)\)ensureOpponentTeamsSync\(\)/);
  assert.match(app,/for\(const key of \['playerSeasons','games'\]\)firestoreListeners\.remove\(key\)/);
});

test("home reads one player-season summary and defers stats",()=>{
  assert.match(app,/doc\(db,'playerSeasonSummaries',key\)/);
  const calls=viewDataHarness({tab:'home',selectedSeasonId:'season',allGames:[{id:'g'}]});
  assert.deepEqual(calls,[['releasePublic'],['homeSummary']]);
  assert.match(app,/snapshot\.exists\(\)&&snapshot\.data\(\)\.schemaVersion===PLAYER_SEASON_SUMMARY_SCHEMA_VERSION\)\{state\.homeSummary=.*ensureStatsSync\(\[\],seasonId\)/);
  assert.match(app,/window\.rebuildHomeSummaries=async/);
  assert.match(app,/queueHomeSummaryRefresh\(changed\)/);
});
