# GitHub Pages セットアップ手順

## 完了したこと

✅ `gh-pages` ブランチを作成
✅ `docs` フォルダに静的ファイルを配置
✅ GitHubにプッシュ完了

## 次のステップ

### 1. GitHub Pagesを有効化

1. https://github.com/otarumi-cmyk/character-splitter にアクセス
2. 「Settings」→「Pages」を開く
3. **Source**: 「Deploy from a branch」を選択
4. **Branch**: `gh-pages` / `/ (root)` を選択
5. 「Save」をクリック

### 2. ReplitでバックエンドAPIをデプロイ

1. https://replit.com でリポジトリをインポート
2. 「Run」ボタンで起動
3. 生成されたURL（例: `https://character-splitter.ユーザー名.repl.co`）をコピー

### 3. GitHub PagesのHTMLを更新

`docs/index.html` の以下の部分を、ReplitのURLに変更：

```html
<script>
  // API URLを設定（ReplitのURLに変更してください）
  window.API_BASE_URL = 'https://your-replit-url.repl.co';
</script>
```

変更後、コミット＆プッシュ：

```bash
cd ~/character-splitter
git checkout gh-pages
# docs/index.html を編集
git add docs/index.html
git commit -m "Update API URL"
git push
```

### 4. アクセス

数分後、以下のURLでアクセスできます：

```
https://otarumi-cmyk.github.io/character-splitter/
```

## 注意事項

- **CORS設定**: ReplitのバックエンドでCORSを許可する必要があります（既に設定済み）
- **API URL**: `docs/index.html` の `API_BASE_URL` を正しく設定してください
- **ファイルパス**: 静的ファイル（CSS/JS）のパスは相対パスになっています
