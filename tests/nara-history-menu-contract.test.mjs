import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('Nara historical import menu is wired into settings',()=>{
  assert.match(app,/openNaraHistoryImportMenu\(\).*奈良県 2025・2026大会を登録/);
  assert.match(app,/const NARA_HISTORY_IMPORTS=\[/);
  assert.match(app,/TOURNAMENT_2026_NARA_U15_MEN/);
  assert.match(app,/findDuplicateHistoricalTournament\(entry\.tournament,registered\)/);
  assert.match(app,/prepare2025OsakaHistoricalImport\(entry\.tournament,entry\.teams\)/);
});

test('Nara historical imports keep explicit similar-name decisions',()=>{
  assert.match(app,/類似チーム名がある場合は、次の画面で統合するか別チームとして登録するか選択できます/);
  assert.match(app,/data-nara-import/);
});
