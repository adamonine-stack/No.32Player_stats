# ホーム用season/player集計document（2026-09-01）

## 目的

ホーム表示のたびに選択シーズンのstats 880件を読む構造を廃止し、選択中のseason/playerに対応する集計document 1件で同じ表示を生成する。

## Collection

`playerSeasonSummaries/{seasonId}__{playerId}`

保存内容:

- `schemaVersion`, `seasonId`, `playerId`
- `stats`: Q数と全STAT_KEYS
- `derived`: PTS、REB、STL、TO、FGA、FGM等
- `enteredGameCount`, `totalQ`
- `periodStart`, `periodEnd`
- `playingTime`: 登録状態、平均秒数、対象試合数
- `sourceGameCount`, `sourceStatCount`
- `updatedAt`

集計生成は`player-season-summary.js`の純粋関数に集約し、既存の`sumStats`、`derived`、`statHasRegisteredData`、`averagePlayerPlayingTime`を再利用する。画面独自の計算式は追加しない。

## 読込フロー

1. seasons、settings、players、playerSeasons、選択シーズンのgamesを取得する。
2. ホームでは選択選手のsummary document 1件だけを購読する。
3. summaryが存在すればstats listenerを解除する。
4. summary未作成時だけ従来のgameId分割queryへfallbackし、表示欠落を防ぐ。
5. 試合・分析・チーム・設定画面を開いた時点で必要なstatsを遅延取得する。

## 更新フロー

- stats listenerの初回snapshotは再集計を発生させない。
- 追加・更新・削除のdocChangesから影響playerIdだけを抽出し、その選手のsummaryを再生成する。
- gameの追加・更新・削除は期間・試合数・出場時間に影響するため、読込済み選手のsummaryを再生成する。
- 管理者設定の「ホーム集計を再構築」は、表示対象の全選手・全世代を原データから作成し、書込後documentを再読込して全フィールドを比較する。

## 移行前監査

- seasons: 2
- players: 20
- games: 101
- stats: 940
- playerSeasonSummaries: 0
- dry-run生成: 40件（2世代×20選手）
- 非空summary: 31件
- 異常: 0件

移行前バックアップ: `C:\Users\takas\AppData\Local\Temp\r32-firestore-pre-home-summary-20260901.json`

## Read見積り

| 状態 | ホーム起動reads |
| --- | ---: |
| 最適化前 | 1,303 |
| gameId scoped化後 | 998 |
| summary作成後 | 119 |

削減は最初の構造から1,184 reads、90.9%。880件のstatsはホームでは0件となり、分析・試合編集等で必要になった時だけ取得する。

## 安全性

- stats、games、履歴、Q、シュート、AST、出場情報は変更しない。
- summaryは派生データであり、削除しても原データから再構築できる。
- summary欠落時は従来queryへfallbackする。
- 原データとsummaryが1項目でも不一致なら管理再構築結果を不一致として扱う。
