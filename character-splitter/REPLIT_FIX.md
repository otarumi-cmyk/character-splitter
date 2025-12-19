# Replit Publish エラー修正

## 問題
"Your app failed to promote" エラーが発生

## 原因
1. `.replit` ファイルの設定が不適切
2. ポート番号が環境変数 `PORT` を使用していない
3. `reload=True` が本番環境で問題を起こす可能性

## 修正内容

### 1. `.replit` ファイルを作成/更新
```toml
language = "python3"
run = "uvicorn main:app --host 0.0.0.0 --port $PORT"

[deploy]
run = ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
```

### 2. `main.py` の起動部分を修正
```python
import os
port = int(os.environ.get("PORT", 8000))
uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
```

## デプロイ手順

1. 修正したファイルをGitHubにプッシュ
2. Replitで「Pull from GitHub」を実行（または再インポート）
3. 「Run」ボタンで動作確認
4. 正常に動作したら「Publish」を再度実行

## 確認事項

### Workspaceで動作確認
1. ReplitのWorkspaceで「Run」ボタンをクリック
2. エラーが出ないか確認
3. Webviewでページが表示されるか確認

### ログを確認
1. 画面下部の「Console」タブを確認
2. エラーメッセージがないか確認
3. サーバーが正常に起動しているか確認

## トラブルシューティング

### まだエラーが出る場合
1. Replitの「Shell」タブで以下を実行：
   ```bash
   pip install -r requirements.txt
   ```
2. 依存関係が正しくインストールされているか確認
3. `python main.py` を直接実行してエラーを確認

### ポートエラーが出る場合
- Replitは自動的に `$PORT` 環境変数を設定します
- `.replit` ファイルで `$PORT` を使用していることを確認
