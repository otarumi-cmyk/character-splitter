# GitHub Pages で公開する方法

このツールをGitHub Pages（GitHub.io）で公開する手順です。

## 構成

- **フロントエンド**: GitHub Pages（`gh-pages` フォルダ）
- **バックエンドAPI**: Replit または別のサービス

## 手順

### 1. Replit でバックエンドAPIをデプロイ

1. https://replit.com でリポジトリをインポート
2. 「Run」ボタンで起動
3. 生成されたURL（例: `https://character-splitter.ユーザー名.repl.co`）をコピー

### 2. GitHub Pages用のHTMLを更新

`gh-pages/index.html` の以下の部分を、ReplitのURLに変更：

```html
<script>
  // API URLを設定（ReplitのURLに変更してください）
  window.API_BASE_URL = 'https://your-replit-url.repl.co';
</script>
```

### 3. GitHub Pagesを有効化

1. GitHubリポジトリの「Settings」→「Pages」を開く
2. **Source**: 「GitHub Actions」を選択
3. 保存

### 4. デプロイ

以下のいずれかでデプロイが開始されます：

- `main` ブランチにプッシュしたとき（自動）
- 「Actions」タブから手動で「Deploy to GitHub Pages」を実行

### 5. アクセス

数分後、以下のURLでアクセスできます：

```
https://otarumi-cmyk.github.io/character-splitter/
```

## 注意事項

- **CORS設定**: ReplitのバックエンドでCORSを許可する必要があります（既に設定済み）
- **API URL**: `gh-pages/index.html` の `API_BASE_URL` を正しく設定してください
- **ファイルパス**: 静的ファイル（CSS/JS）のパスは相対パスになっています

## トラブルシューティング

### 画像が表示されない

- ReplitのURLが正しく設定されているか確認
- ブラウザのコンソールでエラーを確認
- CORSエラーが出ていないか確認

### API呼び出しが失敗する

- Replitのサーバーが起動しているか確認
- `API_BASE_URL` が正しく設定されているか確認
