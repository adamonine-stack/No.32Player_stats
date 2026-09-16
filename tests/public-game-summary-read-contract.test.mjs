import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../js/ui/game-list-registration-status.js',import.meta.url),'utf8');

test('anonymous game list uses summaries only after complete coverage',()=>{
 assert.match(app,/if\(state\.tab==='games'\)\{if\(state\.user\)/);
 assert.match(app,/if\(publicGameSummaryCoverageReady\(\)\)ensureStatsSync\(\[\],seasonId\);else ensureStatsSync\(state\.allGames\.map\(game=>game\.id\),seasonId\)/);
});

test('anonymous game detail scopes raw stats to one game',()=>{
 assert.match(app,/if\(state\.tab==='gameDetail'\)\{if\(!state\.user&&state\.selectedGameId\)ensureStatsSync\(\[state\.selectedGameId\],seasonId\)/);
});

test('game list status prefers public summary with raw stats fallback',()=>{
 assert.match(ui,/function publicSummaryForGame\(game\)/);
 assert.match(ui,/summary \? \{/);
 assert.match(ui,/: gameListRegistrationStatus\(game, state\.stats\)/);
});

test('settings exposes public summary rebuild',()=>{
 assert.match(app,/rebuildPublicGameSummaries\(\)/);
 assert.match(app,/公開試合Summaryを再構築/);
});


test('game cards render registration status directly and keep quarter details off the score line',()=>{
 assert.match(app,/function gameListRegistrationHtml\(game\)/);
 assert.match(app,/スタッツ \$\{status\.registeredQuarters\}\/\$\{status\.totalQuarters\}Q/);
 assert.match(app,/const gameListCard=String\(cls\).*right=gameListCard\?/s);
 assert.match(app,/gameListCard\?gameListRegistrationHtml\(g\):''/);
});
