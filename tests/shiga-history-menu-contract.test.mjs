import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const power=fs.readFileSync(new URL('../js/calculations/opponent-team-calculations.js',import.meta.url),'utf8');

test('Shiga historical import menu is wired into settings',()=>{
  assert.match(app,/openShigaHistoryImportMenu\(\).*滋賀県 2025・2026大会を登録/);
  assert.match(app,/const SHIGA_HISTORY_IMPORTS=\[/);
  assert.match(app,/TOURNAMENT_2026_SHIGA_U15_MEN/);
  assert.match(app,/TOURNAMENT_2026_SHIGA_JHS_SOUTAI_MEN/);
  assert.match(app,/findDuplicateHistoricalTournament\(entry\.tournament,registered\)/);
  assert.match(app,/prepare2025OsakaHistoricalImport\(entry\.tournament,entry\.teams\)/);
});

test('Shiga imports preserve explicit similar-name decisions and qualifier separation',()=>{
  assert.match(app,/類似チーム名がある場合は、次の画面で統合するか別チームとして登録するか選択できます/);
  assert.match(app,/ゾーン・ブロック予選は履歴には残しますが、ランク・Team Powerには加算しません/);
  assert.match(app,/data-shiga-import/);
  assert.match(app,/teamPowerEligible:tournament\.teamPowerEligible!==false&&imported\.teamPowerEligible!==false/);
});

test('team power calculations ignore qualifier-only achievements',()=>{
  assert.match(power,/item\.teamPowerEligible===false\)return null/);
  assert.match(power,/item\?\.teamPowerEligible!==false&&isValidTournamentAchievement\(item\)/);
});
