# 配布方法

このツールを他の人に配布する方法です。

## 方法1: GitHub Releases で配布（推奨）

### パッケージの作成

```bash
./create-package.sh
```

これで `character-splitter-package-YYYYMMDD.zip` が作成されます。

### GitHub Releases にアップロード

1. https://github.com/otarumi-cmyk/character-splitter/releases にアクセス
2. 「Draft a new release」をクリック
3. **Tag**: `v1.0.0`（バージョン番号）
4. **Title**: `キャラクター自動分割ツール v1.0.0`
5. **Description**: 使い方や変更履歴を記載
6. **Attach binaries**: 作成したZIPファイルをアップロード
7. 「Publish release」をクリック

### 配布URL

リリース後、以下のURLで配布できます：
```
https://github.com/otarumi-cmyk/character-splitter/releases/latest
```

## 方法2: 直接ZIPファイルを配布

1. `./create-package.sh` でパッケージを作成
2. 作成されたZIPファイルを共有（メール、クラウドストレージなど）

## 方法3: GitHubリポジトリをクローンしてもらう

```bash
git clone https://github.com/otarumi-cmyk/character-splitter.git
cd character-splitter
./install.sh  # macOS/Linux
# または install.bat（Windows）
```

## ユーザー向けの説明

配布する際は、以下の情報を伝えてください：

1. **必要な環境**: Python 3.8以上
2. **インストール方法**: `INSTALL.md` を参照
3. **起動方法**: `start.sh` または `start.bat` を実行
4. **アクセス方法**: ブラウザで `http://localhost:8000` を開く

## 注意事項

- 初回インストール時は、依存関係のダウンロードに数分かかります
- インターネット接続が必要です（初回のみ）
- 大きな画像を処理する際は、メモリが多く必要です（推奨: 4GB以上）
