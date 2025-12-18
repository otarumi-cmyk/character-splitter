@echo off
REM キャラクター自動分割ツール インストールスクリプト (Windows)

echo ==========================================
echo キャラクター自動分割ツール インストール
echo ==========================================
echo.

REM Pythonのバージョンチェック
python --version >nul 2>&1
if errorlevel 1 (
    echo エラー: Python 3 がインストールされていません
    echo Python 3.8以上をインストールしてください: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python バージョン:
python --version
echo.

REM 仮想環境の作成
echo 仮想環境を作成中...
python -m venv .venv

REM 仮想環境をアクティベート
echo 仮想環境をアクティベート中...
call .venv\Scripts\activate.bat

REM pipのアップグレード
echo.
echo pipをアップグレード中...
python -m pip install --upgrade pip

REM 依存関係のインストール
echo.
echo 依存関係をインストール中（数分かかる場合があります）...
pip install -r requirements.txt

echo.
echo ==========================================
echo インストール完了！
echo ==========================================
echo.
echo 起動方法:
echo   start.bat をダブルクリック
echo.
echo または:
echo   .venv\Scripts\activate
echo   python -m uvicorn main:app --port 8000
echo.
echo ブラウザで http://localhost:8000 を開いてください
echo.
pause
