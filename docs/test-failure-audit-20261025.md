# 全体テスト33件の失敗の調査・修正

対象: main `74e6b6f`。変更前は314件中281件成功・33件失敗。
修正後は316件中316件成功・失敗0件（キャッシュの検証を2件追加）。
実行: `npm ci --ignore-scripts --no-audit --no-fund` → `npm test`。

## 原因と対応

| No. | 失敗したテスト | 原因 | 対応 |
|---:|---|---|---|
| 1 | 2026-kinki-u15-men | テスト用実績に大会名・年度がなく評価対象外。期待ポイントも旧仕様 | 本番登録と同じ大会情報を付与し、近畿優勝150・出場40の既存仕様を検証 |
| 2 | 2026-kyoto-u15-men | ランクだけの不完全な実績を評価させていた | 大会情報と成績を付け、現行の入力条件で順位判定・最高成績採用を検証 |
| 3 | 2026-shiga-u15-men | 同上 | 大会情報を付けて全チームの順位判定を検証 |
| 4 | analysis-game-info-layout | app.jsの古い公開番号を固定要求 | レイアウト検証を維持し、公開URLは共通の資産整合性テストで検証 |
| 5 | audit-consistency-app-contract | 古いapp・SW・キャッシュ番号を固定要求 | 移行処理検証を維持し、公開番号の固定要求を共通検証に置換 |
| 6 | compact-mobile-ui-contract | 古い公開番号を固定要求 | モバイルCSS検証を維持し、番号固定を除去 |
| 7 | settings view does not start or tear down stats subscriptions | 非ログインSummary化前の関数全体文字列を要求 | 実際の画面別データ取得関数を実行し、設定で購読を開始・解除しないことを検証 |
| 8 | home reads one player-season summary and defers stats | Summary schema検証とpublic Summary解除の追加に未追従 | 実関数のホーム遷移とschema検証を確認 |
| 9 | Kyoto historical import menu is wired into settings | 意図して削除した登録ボタンを要求 | ボタンを復活させず、互換用インポート関数が残ることを検証 |
| 10 | Kyoto: ignore qualifier-only achievements | 条件式の完全一致検査が妥当性チェック追加で失敗 | 予選優勝データを渡しランクなし・Power 0となる動作を検証 |
| 11 | actual stats listener rebuild never removes a local SHOT | テストにマイクロタスク処理と再構築フラグがない | 実際の再構築関数をテスト環境に渡し、マイクロタスク完了後に履歴保持を検証 |
| 12 | Nara historical import menu is wired into settings | 削除済み登録ボタンを要求 | 互換用インポート関数を検証 |
| 13 | normal form: uninitialized zero save | テストに選手並べ替え関数がない | DOMテスト環境に関数を追加し、読み込み前の保存拒否を検証 |
| 14 | normal form: explicit zero and reload | 同上 | 既存値読み込み・意図した0保存・保存後再読込を検証 |
| 15 | normal form: read failure | 同上 | 読み込み失敗時に保存されないことを検証 |
| 16 | normal form: out-of-order responses | 同上 | 古い非同期応答で保存可能にならないことを検証 |
| 17 | participation save writes games only | テストのstateにallGamesがない | 画面用・全試合用の状態を用意し、全Qスタッツと履歴が保存で変わらないことを検証 |
| 18 | opponent-team-edit-rank-contract | 古い公開番号を固定要求 | 保存・閉じる・最新ランクの検証を維持、番号検証を共通化 |
| 19 | opponent-team-power-ranking | 同上 | 順位・対象外判定を維持、番号検証を共通化 |
| 20 | opponent-team-power-sort | 同上 | Power 0が昇降順とも末尾となる検証を維持、番号検証を共通化 |
| 21 | opponent-team-type-filter-contract | 古いapp・CSS公開番号を固定要求 | 種別タブ検証を維持し、CSSはバージョン付き参照を検証 |
| 22 | official Osaka 2025 tournament datasets | 予選段階を明記する前のラベルを要求 | 2次予選敗退・1次予選敗退の既存データ表記に合わせる |
| 23 | participation-ui-contract | 交代一覧処理変更と古い公開番号に未追従 | 現行のQ別交代一覧を検証、番号固定を共通化 |
| 24 | pc-normal-shot-flow-contract | 古い公開番号を固定要求 | PC選択・マーカー差し替え等の検証を維持、番号固定を共通化 |
| 25 | pc-quick-shot-flow-contract | 未使用の旧関数まで対象として禁止文字列を検索 | 現在呼び出すquickShotRegistrationに限定してPC操作を検証 |
| 26 | period-calendar-contract | 古いapp公開番号を固定要求 | カレンダー選択の検証を維持、番号固定を共通化 |
| 27 | quarter-session-cache | 全依存が9月8日の番号であることを要求。実装にもURL不一致 | ファイルごとに参照URLが統一される検査へ置換。状態・セッション依存の参照を統一、正確な事前キャッシュと旧キャッシュ削除を追加検証 |
| 28 | same-event concurrent edits | シュート保存先ではないgames.playEventsの件数を検査 | stats.quarters.shotsの件数と表示履歴を検証。後で確定した座標が残る検証も維持 |
| 29 | Shiga historical import menu is wired into settings | 削除済み登録ボタンを要求 | 互換用インポート関数を検証 |
| 30 | Shiga: ignore qualifier-only achievements | No.10と同じ条件式完全一致問題 | 予選除外の実際の計算結果を検証 |
| 31 | shot-ui-contract | コート分析改修前の絞り込み・選手切替・描画構造を要求 | 全解除で全ポイント、レンジ・アングル・種類・結果の現行条件、マーカーだけの更新等を検証。既存の操作テストも併せて通過 |
| 32 | startup-import-contract | 出場時間計算モジュールの古い公開番号を固定要求 | バージョン付きインポートを検証し、現行依存URLに統一 |
| 33 | team-power-history-refresh-contract | 古い公開番号を固定要求 | 最新ランク・暫定評価等の検証を維持、番号固定を共通化 |

## 実装側の修正

- `state.js`をクエリなし／ありの異なるURLで読み込んでいた箇所を統一。同一画面で状態オブジェクトが分かれる経路を除去。
- 履歴・オフラインキュー・出場時間・シュート計算の参照URLを現行版に統一。
- Service Workerの事前キャッシュをindex.htmlの実際の読込URLに合わせ、アプリ本体も追加。
- `r32-shell-*`だけでなく旧形式の`r32-20*`キャッシュも更新時に削除。他アプリのキャッシュは保持。
- QA生成処理は本番キューのバージョンを直接参照し、専用のQA IndexedDBへ確実に切り替える。

大会ランク・Powerの計算ロジックや本番の登録データは変更していない。
未解消テストなし。利用者からの追加情報が必要な項目なし。
