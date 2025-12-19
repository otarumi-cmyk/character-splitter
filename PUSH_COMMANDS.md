# GitHub へのプッシュ手順

## ステップ1: GitHub でリポジトリを作成

1. https://github.com にアクセスしてログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名: `character-splitter`（または任意の名前）
4. **Public** または **Private** を選択
5. 「Initialize this repository with a README」は**チェックしない**（既にファイルがあるため）
6. 「Create repository」をクリック

## ステップ2: リモートを追加してプッシュ

**重要**: `YOUR_USERNAME` をあなたの実際のGitHubユーザー名に置き換えてください！

```bash
cd ~/character-splitter

# リモートを追加（YOUR_USERNAME を実際のユーザー名に置き換える）
git remote add origin https://github.com/YOUR_USERNAME/character-splitter.git

# プッシュ
git push -u origin main
```

## 例

もしあなたのGitHubユーザー名が `tarumiototada` の場合:

```bash
git remote add origin https://github.com/tarumiototada/character-splitter.git
git push -u origin main
```

## 認証エラーが出る場合

GitHub は Personal Access Token が必要です:

1. https://github.com/settings/tokens にアクセス
2. 「Generate new token (classic)」をクリック
3. スコープで `repo` にチェック
4. トークンを生成してコピー
5. プッシュ時にパスワードの代わりにトークンを入力

または、SSH キーを使用:

```bash
git remote set-url origin git@github.com:YOUR_USERNAME/character-splitter.git
git push -u origin main
```





