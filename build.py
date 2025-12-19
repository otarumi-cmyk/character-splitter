"""
実行可能ファイルをビルドするスクリプト
"""
import PyInstaller.__main__
import sys
import os

# PyInstallerのオプション
args = [
    'main.py',
    '--name=character-splitter',
    '--onefile',
    '--windowed',  # コンソールウィンドウを表示しない（GUIアプリの場合）
    '--add-data=static:static',  # staticフォルダを含める
    '--hidden-import=uvicorn',
    '--hidden-import=fastapi',
    '--hidden-import=rembg',
    '--hidden-import=onnxruntime',
    '--hidden-import=cv2',
    '--hidden-import=skimage',
    '--hidden-import=scipy',
    '--collect-all=rembg',
    '--collect-all=onnxruntime',
]

if sys.platform == 'darwin':  # macOS
    args.append('--osx-bundle-identifier=com.character-splitter.app')
elif sys.platform == 'win32':  # Windows
    args.append('--icon=NONE')  # アイコンファイルがあれば指定

PyInstaller.__main__.run(args)





