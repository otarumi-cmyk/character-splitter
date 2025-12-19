#!/bin/bash
# キャラクター自動分割ツール 起動スクリプト

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    echo "仮想環境が見つかりません。先に ./install.sh を実行してください"
    exit 1
fi

source .venv/bin/activate
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000





