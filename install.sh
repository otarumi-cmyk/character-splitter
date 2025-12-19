#!/bin/bash
# キャラクター自動分割ツール インストールスクリプト (macOS/Linux)

echo "=========================================="
echo "キャラクター自動分割ツール インストール"
echo "=========================================="
echo ""

# Pythonのバージョンチェック
if ! command -v python3 &> /dev/null; then
    echo "エラー: Python 3 がインストールされていません"
    echo "Python 3.8以上をインストールしてください: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python バージョン: $(python3 --version)"

# 仮想環境の作成
echo ""
echo "仮想環境を作成中..."
python3 -m venv .venv

# 仮想環境をアクティベート
echo "仮想環境をアクティベート中..."
source .venv/bin/activate

# pipのアップグレード
echo ""
echo "pipをアップグレード中..."
python3 -m pip install --upgrade pip

# 依存関係のインストール
echo ""
echo "依存関係をインストール中（数分かかる場合があります）..."
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "インストール完了！"
echo "=========================================="
echo ""
echo "起動方法:"
echo "  ./start.sh"
echo ""
echo "または:"
echo "  source .venv/bin/activate"
echo "  python3 -m uvicorn main:app --port 8000"
echo ""
echo "ブラウザで http://localhost:8000 を開いてください"
echo ""





