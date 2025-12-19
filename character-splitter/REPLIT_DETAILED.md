# Replit デプロイ詳細手順

## ステップ1: Replitアカウント作成・ログイン

1. https://replit.com にアクセス
2. 「Sign up」または「Log in」をクリック
   - GitHubアカウントでログインできます（推奨）

## ステップ2: リポジトリをインポート

1. Replitのダッシュボードで「+ Create Repl」をクリック
2. 左側のメニューから「Import from GitHub」を選択
3. 以下のURLを入力：
   ```
   https://github.com/otarumi-cmyk/character-splitter
   ```
4. 「Import」をクリック

## ステップ3: 環境設定の確認

Replitが自動的に以下を認識します：
- `.replit` ファイル（実行設定）
- `replit.nix` ファイル（パッケージ設定）
- `requirements.txt`（Python依存関係）

## ステップ4: 依存関係のインストール

### Shellタブの見つけ方
1. **画面の下の方**を見てください
2. `[Console] [Shell] [Problems]` のようなタブが並んでいます
3. **「Shell」**タブをクリック
   - 見つからない場合: `Ctrl + J`（Windows）または `Cmd + J`（Mac）を押す

### コマンドを実行
1. Shellタブを開いたら、`$` や `>` という記号の後に以下を入力：
   ```bash
   pip install -r requirements.txt
   ```
2. Enterキーを押す
   ※ 初回は数分かかる場合があります

### 自動インストールの場合
- Replitが自動的に `requirements.txt` を検出してインストールを開始する場合もあります
- その場合は「Run」ボタンをクリックするだけでOK

## ステップ5: サーバーを起動

1. 画面上部の緑色の「Run」ボタンをクリック
2. 数秒待つと、サーバーが起動します
3. 画面右側の「Webview」タブに自動的に表示されます

## ステップ6: 公開URLを取得

1. 画面右上の「Share」ボタンをクリック
2. 「Copy link」をクリックしてURLをコピー
   - 例: `https://character-splitter.otarumi-cmyk.repl.co`
3. または、画面右上に表示されているURLを直接コピー

## ステップ7: 常時起動設定（オプション）

無料プランでは、5分間アクセスがないと停止します。常時起動するには：

1. 画面右上の「Always On」をクリック（有料プランのみ）
2. または、無料の場合は定期的にアクセスする

## ステップ8: GitHub PagesのAPI URLを更新

1. GitHubリポジトリの `gh-pages` ブランチに切り替え
2. `docs/index.html` を編集
3. 以下の部分を変更：
   ```html
   <script>
     window.API_BASE_URL = 'https://character-splitter.あなたのユーザー名.repl.co';
   </script>
   ```
4. コミット＆プッシュ

## トラブルシューティング

### エラー: "Module not found"
- Shellで `pip install -r requirements.txt` を再実行

### エラー: "Port already in use"
- `.replit` ファイルのポート番号を変更（通常は自動）

### サーバーが起動しない
- 「Run」ボタンを再度クリック
- Shellで `python main.py` を直接実行してエラーを確認

### URLが表示されない
- 画面右上の「Share」ボタンからURLを取得
- または、WebviewタブのURLを確認

## 確認方法

1. ReplitのWebviewで `http://localhost:8000` が表示されることを確認
2. ブラウザで `https://あなたのrepl-url.repl.co` にアクセス
3. ページが表示されれば成功
