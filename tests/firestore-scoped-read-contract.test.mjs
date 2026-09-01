import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
