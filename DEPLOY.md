# デプロイ手順

このツールをインターネット上で公開する手順です。

## 前提条件

- GitHub アカウント
- デプロイ先のアカウント（Render / Railway / Heroku など）

## 1. GitHub にリポジトリを作成

```bash
cd character-splitter
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/character-splitter.git
git push -u origin main
```

## 2. Render でデプロイ（推奨・無料プランあり）

1. https://render.com にアクセスしてアカウント作成
2. 「New」→「Web Service」を選択
3. GitHub リポジトリを接続
4. 設定:
   - **Name**: `character-splitter`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 「Create Web Service」をクリック
6. 数分待つとデプロイ完了

**注意**: Render の無料プランでは、15分間アクセスがないとスリープします。初回アクセスが遅くなる場合があります。

## 3. Railway でデプロイ

1. https://railway.app にアクセスしてアカウント作成
2. 「New Project」→「Deploy from GitHub repo」を選択
3. リポジトリを選択
4. Railway が自動で Python を検出してデプロイします

## 4. Heroku でデプロイ

```bash
# Heroku CLI をインストール後
heroku login
heroku create your-app-name
git push heroku main
```

## 5. カスタムドメインの設定（任意）

デプロイ先の設定画面から、カスタムドメインを設定できます。

## トラブルシューティング

### メモリ不足エラー

無料プランではメモリ制限があるため、大きな画像を処理する際にエラーが出る場合があります。
- 画像サイズを小さくする
- 有料プランにアップグレードする

### タイムアウトエラー

処理に時間がかかりすぎる場合:
- 画像サイズを小さくする
- タイムアウト時間を延長する（デプロイ先の設定で）

### ファイルが保存されない

無料プランではファイルシステムが一時的な場合があります。
- 外部ストレージ（S3 など）を使用する
- セッション管理を改善する
