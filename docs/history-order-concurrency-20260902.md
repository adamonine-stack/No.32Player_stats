# 履歴順序・即時反映・AST競合 調査記録

## 原因

- 履歴表示は `eventSequenceOverrides`、イベント `sequence`、シュート `createdAt` の順で決定されていた。
- SHOT/ASTはFirestore transactionだったが、REB/STL/TO/BLK/FOUL/FTは端末が保持する `playEvents` 全配列を `setDoc` していた。複数タブ・再接続・保存の重なりでは、遅く完了した古い配列が新しい配列を上書きし得た。
- 新規順序は `Date.now()` が中心で、同一ミリ秒の入力はID文字列がtie-breakerになっていた。
- `playerSeasonSummaries` の更新はstats listenerから非同期に行われ、履歴保存処理からawaitされていない。summary導入前後で履歴・ASTコードの意味変更もなく、直接原因ではない。
- ASTとMadeは既に `playId` / `assistEventId` / `shotEventId` で相互参照しており、位置index依存ではなかった。

## 修正

- 入力確定時に `Date.now() * 1000 + client counter` 相当の安全整数sequenceと不変operation IDを確保する。
- SHOT、REB等のstat event、FT、交代を共通採番へ統一し、シュート履歴は新規 `sequence`、旧データは従来の `createdAt` をfallbackにする。
- REB等とFTをFirestore transactionへ変更。transaction再試行・再接続・同一operation再送時は不変IDで重複を検出する。
- SHOT/AST、REB等、FTは履歴へoptimistic反映し、成功時は同じIDで確定、失敗時は対象操作だけrollbackする。
- 手動並び替え `eventSequenceOverrides`、途中差し込み、AST相互ID、旧履歴fallbackは維持する。

## データ安全性とread

- 本番データの一括更新・migration・削除は行わない。
- 書込み対象は従来と同じ対象試合・対象選手statsのみ。transactionで各1 documentを読み、全stats監視や全opponent監視は追加しない。
- ホームの `playerSeasonSummaries` 1 document読込、stats遅延取得、opponentTeams遅延取得を維持する。
