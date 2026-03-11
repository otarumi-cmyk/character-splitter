#!/usr/bin/env bash
# Cursor の Simple Browser やブラウザから静的HTMLを見る用
# 使い方: ./serve-local.sh  または  bash serve-local.sh
set -e
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "Serving at http://127.0.0.1:${PORT}/"
echo "  Demo: http://127.0.0.1:${PORT}/salary-agent-recommendation-demo.html"
echo "Stop: Ctrl+C"
echo "Background: nohup python3 -m http.server $PORT >/tmp/http-server-$PORT.log 2>&1 &"
exec python3 -m http.server "$PORT"
