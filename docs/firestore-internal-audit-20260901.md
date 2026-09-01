# R32 Firestore内部監査（2026-09-01）

## 結論

`Quota exceeded` の主因は、起動時に成長する4コレクション（`playerSeasons`、`games`、`stats`、`opponentTeams`）を無条件で全件 `onSnapshot` していたことです。再読込、再接続、別タブでは同じ購読が再作成され、端末キャッシュを利用できない状態では1回のホーム起動だけで1,303 document reads相当になっていました。

本変更では、`games` と `playerSeasons` を選択シーズンに限定し、旧statsとの互換性を保つため、statsを選択シーズンのgameIdに限定した分割queryへ変更しました。`opponentTeams` は対戦チーム・試合・分析系画面を初めて開くまで購読しません。購読レジストリにより二重登録を防ぎ、シーズン変更時には旧listenerを解除します。既存のIndexedDB永続キャッシュと、利用不可時のメモリfallbackは維持しています。

## 本番バックアップと件数

読み取り専用REST exportを `C:\Users\takas\AppData\Local\Temp\r32-firestore-backup-20260901T1600.json` に保存しました。リポジトリには含めません。

| Collection | Documents | 主な用途 |
| --- | ---: | --- |
| `seasons` | 2 | 世代マスタ |
| `settings` | 1 | `settings/app` のactive season・schema version |
| `players` | 20 | 選手マスタ |
| `playerSeasons` | 2 | 世代別の所属・学年・背番号 |
| `games` | 101 | 試合、Q、スコア、履歴、出場・交代、playEvents |
| `stats` | 940 | game/player別スタッツ、Q別値、シュートポイント |
| `opponentTeams` | 237 | 対戦チーム、別名、ランク、大会実績 |
| `tournaments` | 10 | 大会マスタ |
| `tournamentGames` | 108 | 大会の対戦結果 |

subcollection、collectionGroup queryは使用していません。Firestore rulesは全documentのreadを許可し、writeはFirebase Authentication済みユーザーだけに許可しています。

主要フィールドは次の通りです。

- `games`: `seasonId`, `date`, `opponentTeamId`, `tournament`, `category`, `quarterScores`, `finalScore`, `quarterParticipation`, `playEvents`, `eventSequenceOverrides`, `statsRegistrationType`, `shotRegistrationMode`
- `stats`: `gameId`, `playerId`, `seasonId`, `quarters`, 全STAT_KEYS、Q内の`shots`
- `players` / `playerSeasons`: 選手基本情報と世代別`grade`, `number`, `active`
- `opponentTeams`: 名称、都道府県、カテゴリー、aliases、tournamentPlacements、seasonRanks
- `tournaments` / `tournamentGames`: 大会属性、チームID、勝敗・得点・確認状態

更新・削除は管理者向けフォーム、クイック登録、履歴編集、シュート編集、選手・試合・対戦チーム管理から行われます。`games` と `stats` に履歴関連情報が意図的に分かれて保存され、SHOT/ASTは独立カウンタのまま相互IDで関連付けられます。

## 読込み構造と計測

| 操作 | 変更前 | 変更後 |
| --- | ---: | ---: |
| 初回ホーム（本番件数による見積り） | 1,303 | 998 |
| 初回ホーム削減 | - | 305（23.4%） |
| 対戦チーム非依存画面 | 起動時237 | 0（遅延） |
| 対戦チーム依存画面の初回 | 起動時に読込済み | 237 |
| 同一ページ内の再表示・ページ切替 | 再購読の可能性 | 0（listener registryで再利用） |
| 試合詳細・履歴 | 全件起動監視済み | 選択シーズン内の読込済みデータを再利用、追加0 |
| 2回目起動・再読込 | キャッシュ無効時1,303 | IndexedDB永続キャッシュを優先。再同期は変更分、利用不可時のみ安全にメモリfallback |

変更後998件の内訳は、seasons 2、settings 1、players 20、当該seasonのplayerSeasons 2、games 94、対象gameIdに属するstats 880です。旧statsを欠落させない互換queryのため、未移行565件も含みます。データ量増加に対する次の大幅削減には、player/season summary documentのmaterializeが必要です。

## 旧形式・整合性診断

検出結果（本番書換え前）:

- `stats.seasonId` 欠落: 565件
- 数値型`quarters`: 234件
- 削除Qの`null`: 5件
- statsのQ範囲差異: 5件
- playEventのQ範囲差異: 2件
- orphan stats/game/player/opponent: 0件
- 存在しないシュートへのAST: 0件
- MissへのAST: 0件
- Made > Attempt / 2PM > 2PA / 3PM > 3PA / FTM > FTA: 0件
- 出場時間超過・交代矛盾・不明選手: 0件

`seasonId` 565件はバックアップ後にdry-runし、試合数、Q数、全STAT_KEYS、PTS、REB、STL、TO、シュート数、Made/Miss、出場秒数、AST関連付け数がすべて一致（差分0）しました。再適用時は対象0件になる冪等パッチです。ただし、この実行環境のブラウザに管理者セッションがなく、本番writeを無認証で迂回しない安全ルールを優先して適用はしていません。公開コードはgameId queryにより未移行データも完全に読みます。

数値型`quarters`と削除Qの`null`は既存互換処理が解釈でき、内容を推測して変換すると履歴を変える可能性があります。Q範囲差異も延長戦・過去設定の確認が必要なため、自動変換・削除は行っていません。

## 集計・コード監査

ホーム、分析、チーム、試合詳細、Q別、コート分析、選手・対戦チーム画面は、`stats-calculations.js` の `sumStats` と `derived` を共通経路として使用しています。Q別map、数値型quarters、削除Q nullは同じ正規化経路を通ります。出場時間は`participation-calculations.js`を共通利用しています。

参照0件だった旧repository 3ファイル（games/players/statsの全件listener実装）を削除しました。UI、色、文字、レイアウト、データID、保存形式は変更していません。

## 開発・管理診断

- `scripts/firestore-audit.mjs --output=<absolute path>`: 全collectionのバックアップ、field inventory、件数、read見積り、整合性、移行dry-runを生成
- `window.runR32DataDiagnostics()`: 現在読込済みデータを開発者コンソールで診断
- `window.r32FirestoreReadState()`: listenerと読込件数を確認
- listener registry: key単位で二重購読防止、交換時unsubscribe

## 今後の改善候補

1. 管理者ログイン済み環境で565件の`seasonId`補完を適用し、前後backup・件数・集計差分0を再確認する。
2. `season/player summary`をmaterializeし、ホームを数documentで描画する。更新は既存stats transactionと同一処理で行い、定期rebuildで検算する。
3. `games`の一覧fieldと詳細（playEvents/participation）を別documentへ段階分離し、試合一覧で詳細payloadを読まない構造にする。
4. Q範囲差異7件を各試合の延長戦設定・履歴と照合し、人の判断後にのみ補正する。
