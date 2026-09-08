# Q単位のローカル入力セッション

## 保存経路

入力は既存のイベント計算を使い、game / stats / shots / AST関連 / participation の変更を一つの操作として IndexedDB に保存する。登録時の UUID を operationId とし、再試行では再生成しない。入力中は HistoryJournal がサーバー確定文書に未確定操作を投影する。Firestore listener の古い文書はローカル操作を削除しない。

Q確定は対象Qの draft を IndexedDB トランザクションで ready にする。Firestore transaction は `inputOperations/{operationId}` の受領記録と、関係する game / stats を原子的に保存する。同じ受領記録がある再試行は何も加算しない。応答喪失、通信失敗時は操作を保持する。受領成功後も、関係する全文書の listener が historyClock を確認するまで投影を保持する。

既存の文書配列全体を無条件に置き換えず、ID付き行の差分と数値差分を最新サーバー文書へ適用する。他端末の追加行と他Qは保持する。同じ行の競合編集は原子的に拒否し、入力を端末に残してエラーを表示する。既存の通常数値入力は読み込み時・確定時の二重 baseline チェックを維持する。

## 順序と複数端末

IndexedDB の metadata は端末UUID・localSequence・直前の clientCreatedAt を永続化する。端末時計が戻った場合は clientCreatedAt を直前値に固定し、localSequence を進める。新規履歴の順序はこの時刻を既存 sequence 単位へ変換し、同時刻は deviceId / localSequence / operationId / eventId で決定する。同期時刻は順序に使わない。既存の明示的な並べ替え・差し込み sortValue はユーザーの指定として優先する。

同一端末・試合・Qの predecessorId はタブ間でも直列に発行し、後続の確定が未確定の先行入力を追い越すことを防ぐ。端末間の物理時計のずれは自動補正しないため、絶対時刻の精度は各端末の時計に依存する。

## 互換性

既存 Firestore 文書の一括変換は行わない。旧キューは旧保存経路で再試行する。新操作は sessionVersion により識別する。出場時間は既存 participation 計算を再利用する。集計サマリーの送信元は確定済み文書とし、未確定入力を別経路で公開しない。通常入力で既存値を確認できない場合の保存禁止ガードも維持する。

未確定入力はログインユーザー単位で復元する。IndexedDB を消去するブラウザ操作やプライベートブラウズ終了による消去は復元対象外。同一履歴への競合編集は自動上書きしない。サーバー受領記録は冪等性のため保持する。

## 検証

`npm ci && npm test`。既存145件と追加22件、計167件。追加テストは20連続入力、stale listener、IndexedDB再接続、オフライン/再試行、応答喪失、二重確定、A→B/B→Aの同期順、時計逆行、同時刻、SHOT+AST/ポイント修正、FT削除、各カウンター、IN/OUT・出場時間、他Qの非ゼロ値保持、競合編集、通常入力ガード、先行操作受領を検証する。Firestore transaction は原子的なテスト用実装を使用する。

`npm run dev` は架空データ専用のブラウザ検証環境を生成する。Firestore通信だけをテスト実装へ差し替え、実際のアプリとIndexedDBで確認する。公開された `tests/local-history-qa.html` も本番DBへ書き込まない隔離ページ。QAページは本番Service Workerへ登録せず、navigation cacheにも入れない。
