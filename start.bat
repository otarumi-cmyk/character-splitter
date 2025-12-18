@echo off
REM キャラクター自動分割ツール 起動スクリプト (Windows)

cd /d "%~dp0"

if not exist ".venv" (
    echo 仮想環境が見つかりません。先に install.bat を実行してください
    pause
    exit /b 1
)

call .venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8000
