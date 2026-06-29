# R32 Basketball Stats Ver.3.0.1

## アップロード方法
1. ZIPを解凍します。
2. `R32BasketballStats_Ver3_0_1_update` フォルダを開きます。
3. 中身（index.html, manifest.json, service-worker.js, firestore.rules, assets, icons）をすべて選択します。
4. GitHubの `No.32Player_stats` リポジトリ直下にアップロードして上書きします。
5. Commit changes を押します。
6. 数分後に https://adamonine-stack.github.io/No.32Player_stats/ を開き、Ctrl+F5で強制更新します。

## 今回の修正
- 試合毎スタッツ対象選択で対戦相手名を先頭表示
- スマホ/PCの背景画像に重なっていた紫縁の細長いマークを削除
- 選手登録を以前のシンプル方式へ戻し
- 試合毎スタッツ上部に日付・大会・対戦相手・勝敗記号・スコア・選手PTSを表示
- 換算試合数を総Q数 ÷ 4 で修正
- ログイン状態維持・パスワード自動入力対応
