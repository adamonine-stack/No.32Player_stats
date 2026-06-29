# R32 Basketball Stats Ver.3.0 Complete

GitHub Pages 用の完全差し替え版です。

## アップロード方法
ZIPを解凍し、中身（index.html / manifest.json / service-worker.js / firestore.rules / assets / icons）をGitHubリポジトリ直下にアップロードしてください。

## Firebase
Firebase設定は `index.html` に組み込み済みです。Firestoreルールは `firestore.rules` をFirebase Consoleに設定してください。

## 主な機能
- Firebase Authentication ログイン保持
- 端末のパスワード保存・自動入力対応
- Firestore 保存
- 選手登録・修正・削除
- 試合登録・修正・削除
- 試合からスタッツ登録、既存データ自動読み込み
- 試合・大会・日・月・年別スタッツ
- STL / REB / TO 内訳をカタカナ表示
- R32背景イメージをスマホ・PCに反映
