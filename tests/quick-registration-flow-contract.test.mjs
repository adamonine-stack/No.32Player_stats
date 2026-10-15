import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

test('new game starters return to quick stats top', () => {
  assert.ok(app.includes("if((options.newGameEntry||options.statsEntry)&&validation.valid){statsEntryForm(gameId,quarter,options.preferredMode||'');return}"));
  assert.match(app, /function quickReturnToTop\(game,quarter,patch=\{\}\)/);
  assert.match(app, /resetQuickEntryScrollTop\(\)/);
});

test('latest history edit opens action selection with player selected', () => {
  assert.match(app, /function editLatestHistoryItem\(game,item,quarter\).*quickActionSheet\(game,targetQuarter,player,editTime,item\)/s);
  assert.match(app, /履歴修正｜/);
  assert.match(app, /historyQuickAction\(historyItem\)/);
});

test('history edit restores live clock after save', () => {
  assert.match(app, /resumeRemainingSeconds:session\.remainingSeconds/);
  assert.match(app, /remainingSeconds:resume/);
});

test('substitution save returns to quick stats and carries clock', () => {
  assert.match(app, /quickSetSession\(game,quarter,\{remainingSeconds:event\.remainingSeconds\}\)/);
  assert.match(app, /quickAfterSave\(game,quarter,\{force:true\}\)/);
});

test('changed history action is replaced only after new save', () => {
  assert.match(app, /prepareHistoryReplacement\(game,quarter,historyItem\)/);
  assert.match(app, /await removeHistoryItemForReplacement\(game,replacement\)/);
  assert.match(app, /replacementHistoryItem:null/);
});


test('participation save is immediately visible before quarter sync', () => {
  assert.match(app, /function saveParticipationGame[\s\S]*?Object\.assign\(game,after\)[\s\S]*?submitOfflineCapable/);
  assert.match(app, /catch\(error\)[\s\S]*?Object\.assign\(game,before\)/);
});

test('active lineup remains category and number sorted after substitution', () => {
  assert.match(app, /function participationPlayers\(game=\{\}\)\{return sortPlayersByCategoryAndNumber/);
  assert.match(app, /currentAtTime=sortParticipationPlayerIds\(game,currentPlayersAt/);
  assert.match(app, /function quickPlayers[\s\S]*?sortPlayersByCategoryAndNumber\(ids\.map/);
});


test('assist candidates use the same category and jersey-number order', () => {
  assert.match(app, /const players=sortPlayersByCategoryAndNumber\(assistCandidates\(game,quarter,shot,participationPlayers\(game\),state\.stats\)\)/);
});


test('quarter stats close opens score entry for the same game and quarter', () => {
  assert.ok(app.includes('button.onclick=()=>finishQuarterStats(gameId,quarter)'));
  assert.ok(app.includes('delete window.recordPendingStatEvent;finishQuarterStats(gameId,selectedQuarter)'));
  assert.ok(app.includes("heading.textContent='ゲームスコア入力'"));
  assert.ok(app.includes('const row=$(`#qTeam${quarter}`)'));
});

test('both input modes resume the requested quarter after lineup save', () => {
  assert.ok(app.includes("{statsEntry:true,preferredMode:'quick'}"));
  assert.ok(app.includes("{statsEntry:true,preferredMode:'normal'}"));
  assert.ok(app.includes("statsEntryForm(gameId,quarter,options.preferredMode||'')"));
});

test('opponent search filters by name and prefecture while preserving selection', () => {
  assert.ok(app.includes('id="gOpponentSearch"'));
  assert.ok(app.includes("${team.teamName||''} ${team.prefecture||''} ${team.normalizedTeamName||''}"));
  assert.ok(app.includes('option.value===selected||matches.has(option.value)'));
  assert.ok(app.includes('opponentSelect.value=selected'));
});
