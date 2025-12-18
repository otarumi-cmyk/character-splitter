#!/bin/bash
# 配布用パッケージを作成するスクリプト

PACKAGE_NAME="character-splitter-package"
VERSION=$(date +%Y%m%d)

echo "配布用パッケージを作成中..."

# 一時ディレクトリを作成
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/$PACKAGE_NAME"

mkdir -p "$PACKAGE_DIR"

# 必要なファイルをコピー
echo "ファイルをコピー中..."
cp -r static "$PACKAGE_DIR/"
cp main.py "$PACKAGE_DIR/"
cp requirements.txt "$PACKAGE_DIR/"
cp README.md "$PACKAGE_DIR/"
cp INSTALL.md "$PACKAGE_DIR/"
cp install.sh "$PACKAGE_DIR/"
cp start.sh "$PACKAGE_DIR/"
cp install.bat "$PACKAGE_DIR/"
cp start.bat "$PACKAGE_DIR/"

# 実行権限を付与
chmod +x "$PACKAGE_DIR/install.sh"
chmod +x "$PACKAGE_DIR/start.sh"

# .gitignore に基づいて不要なファイルを除外
# downloads/ は空のディレクトリとして作成
mkdir -p "$PACKAGE_DIR/downloads"
touch "$PACKAGE_DIR/downloads/.gitkeep"

# READMEを追加
cat > "$PACKAGE_DIR/README.txt" << 'EOF'
========================================
キャラクター自動分割ツール
========================================

このツールは、1枚の画像から複数のキャラクターを自動で検出し、
1体ずつ透過PNGに分割します。

【インストール方法】

macOS/Linux:
  1. ターミナルでこのフォルダに移動
  2. ./install.sh を実行
  3. ./start.sh を実行
  4. ブラウザで http://localhost:8000 を開く

Windows:
  1. install.bat をダブルクリック
  2. start.bat をダブルクリック
  3. ブラウザで http://localhost:8000 を開く

詳細は INSTALL.md を参照してください。

【必要な環境】
- Python 3.8以上
- インターネット接続（初回インストール時のみ）

【使い方】
1. ブラウザで http://localhost:8000 を開く
2. キャラクターが複数描かれた画像をアップロード
3. 「キャラクターを自動分割」をクリック
4. 結果をダウンロード

【トラブルシューティング】
詳細は INSTALL.md を参照してください。

========================================
EOF

# ZIPファイルを作成
echo "ZIPファイルを作成中..."
cd "$TEMP_DIR"
zip -r "${PACKAGE_NAME}-${VERSION}.zip" "$PACKAGE_NAME" > /dev/null

# 元のディレクトリに移動
mv "${PACKAGE_NAME}-${VERSION}.zip" "$(pwd)/"

# 一時ディレクトリを削除
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "パッケージ作成完了！"
echo "=========================================="
echo ""
echo "作成されたファイル: ${PACKAGE_NAME}-${VERSION}.zip"
echo ""
echo "このZIPファイルを配布してください。"
echo ""
