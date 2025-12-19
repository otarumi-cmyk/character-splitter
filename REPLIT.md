# Replit でデプロイする方法

## 手順

### 1. Replit にアカウント作成

1. https://replit.com にアクセス
2. 「Sign up」でアカウント作成（GitHubでログイン可能）

### 2. 新しい Repl を作成

1. 「Create Repl」をクリック
2. 「Import from GitHub」を選択
3. リポジトリURLを入力: `https://github.com/otarumi-cmyk/character-splitter`
4. 「Import」をクリック

### 3. 依存関係のインストール

Replitが自動で `requirements.txt` を検出してインストールを開始します。
完了まで数分かかります。

### 4. 起動

1. 「Run」ボタンをクリック
2. 数秒待つと、Webview が表示されます
3. または、生成されたURL（例: `https://character-splitter.ユーザー名.repl.co`）にアクセス

### 5. 公開設定（オプション）

1. 左側の「Tools」→「Deploy」をクリック
2. 「Deploy」をクリック
3. 公開URLが生成されます

## 注意事項

- **無料プラン**: 一定時間アクセスがないとスリープします
- **メモリ制限**: 無料プランではメモリ制限があります（大きな画像処理は制限される可能性）
- **ファイル保存**: Replitのファイルシステムは永続的ですが、定期的にバックアップを取ることを推奨

## トラブルシューティング

### 依存関係のインストールが失敗する

- Replitのコンソールで `pip install -r requirements.txt` を手動実行
- エラーメッセージを確認

### メモリ不足エラー

- 画像サイズを小さくする
- Replitの有料プランにアップグレード

### 起動しない

- コンソールのエラーメッセージを確認
- `.replit` ファイルの設定を確認
