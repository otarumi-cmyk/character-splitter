# デプロイ手順（次のステップ）

Gitリポジトリの準備は完了しました。あと少しで公開できます！

## 次のステップ

### 1. GitHub にリポジトリを作成

1. https://github.com にアクセスしてログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例: `character-splitter`）
4. 「Create repository」をクリック

### 2. リモートリポジトリを追加してプッシュ

ターミナルで以下を実行（`YOUR_USERNAME` をあなたのGitHubユーザー名に置き換えてください）:

```bash
cd ~/character-splitter
git remote add origin https://github.com/YOUR_USERNAME/character-splitter.git
git branch -M main
git push -u origin main
```

### 3. Render でデプロイ

1. https://render.com にアクセスしてアカウント作成（GitHubでログイン可能）
2. 「New」→「Web Service」を選択
3. 作成したGitHubリポジトリを選択
4. 設定:
   - **Name**: `character-splitter`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 「Create Web Service」をクリック
6. 数分待つとデプロイ完了！

**完了後**: `https://your-app-name.onrender.com` でアクセス可能になります。

---

## トラブルシューティング

### GitHub へのプッシュで認証エラーが出る場合

```bash
# Personal Access Token を使用する方法
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/character-splitter.git
```

または、SSH キーを設定する方法もあります。

### Render でビルドエラーが出る場合

- `requirements.txt` の依存関係を確認
- ログを確認してエラー内容を確認
- Python バージョンを `runtime.txt` で指定（既に設定済み）
