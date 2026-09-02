# 履歴順序・AST関連付け 最終安全性確認

## 判定

transaction callback内にUI、toast、summary更新、operation ID生成、sequence採番はなく、副作用はFirestore transactionのstage書込みだけだった。operation IDとsequenceはcallback外で1操作ごとに固定され、再試行・再送時も同一値を使用する。

追加テストにより、REB/FTのcallback再試行、offline失敗、再接続後の同一操作再送、2タブ相当の競合、同値sequence、手動並び替え後追加、途中差し込み後追加、AST相互参照、対象Made削除、cache/listener再接続を確認した。

## 発見した問題と最小修正

Firestore上のデータ破損はなかったが、optimistic操作の待機中に別端末のlistener更新が到着した後で当該操作が失敗すると、従来のrollbackは操作開始前の配列全体を戻し、別端末の確定イベントを画面上から一時的に消す可能性があった。

rollbackを三者比較へ変更した。

- 操作開始前
- 当該操作のoptimistic結果
- rollback時点の最新state

当該operationが追加・変更・削除したevent/statだけを、現在値がoptimistic値と一致する場合に限って戻す。listenerが更新した別event・別stat・同一statの新しい値は維持する。

## 順序と互換性

- 異なる端末でsequenceが同値でも、不変operation IDを第二キーとして毎回同じ順序になる。
- 手動順序は連番整数の `eventSequenceOverrides` で保存する。中間小数は使わず、精度劣化や無限細分化はない。
- 通常追加は手動順序の後ろ、途中差し込みは指定位置へ入り、その後の通常追加・再並び替え・再読込でも維持する。
- 旧履歴は `createdAt`、最後に安定IDを使うためmigration不要。
- ASTは `playId` / `assistEventId` / `shotEventId` で相互参照し、sequence・表示位置・差し込みから独立する。

## Firestore負荷

追加listener・全件query・summary待機はない。transactionの対象は従来どおり対象game 1 documentと対象player stats 1 document。ホームのplayerSeasonSummaries、stats遅延取得、opponentTeams遅延取得を維持する。
