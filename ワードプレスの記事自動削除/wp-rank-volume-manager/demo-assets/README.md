# デモ用ロゴ画像

年収診断デモ（`salary-agent-recommendation-demo.html`）で **リクナビNEXT** と **メルセンヌセールス** の見た目を確認するため、ここに画像を置きます。

## ファイル名（固定）

| サービス | ファイル名 | 推奨形式 |
|----------|------------|----------|
| リクナビNEXT | `rikunabi-next.png` | PNG / JPG / WebP（横長） |
| メルセンヌセールス | `mersenne-sales.png` | 同上 |

- 横幅 **220〜320px** 程度・背景透過PNGだとカードに馴染みやすいです。
- 公式のメディアキットやご契約素材からコピーしてください（著作権・利用規約は各自ご確認ください）。

## 確認方法

```bash
cd wp-rank-volume-manager
python3 -m http.server 8080
```

ブラウザで  
`http://127.0.0.1:8080/salary-agent-recommendation-demo.html`  
を開くと、`demo-assets/` 配下の画像がそのまま相対パスで読み込まれます。

画像が無い・パスが違う場合は、自動で従来のグレー枠プレースホルダに戻ります。
