# 年収診断 × 転職エージェント診断（job-site-diagnosis）連携フロー要件

## 1. 対象ファイルと全体フロー

**対象:**

- LP: `salary-diagnosis-construction.html`
- 新規ページ（年収質問用・仮名）: `salary-diagnosis-income.html`
- 既存ステップ:
  - `salary-diagnosis-step.html`（企業規模・役職・年齢）
  - `salary-diagnosis-step2.html`（現在の職種・希望職種）
  - `salary-diagnosis-step3.html`（希望勤務地）
  - `salary-diagnosis-loading.html`
  - `salary-diagnosis-result.html`

**新しいユーザーフロー:**

1. **LP** で「性別（男女）」を選択 → 年収質問ページへ遷移
2. **年収質問ページ** で「現在の年収レンジ（10レンジ）」を選択
3. `salary-diagnosis-step.html` で「企業規模・役職・年齢」
4. `salary-diagnosis-step2.html` で「現在の職種・希望職種」
5. `salary-diagnosis-step3.html` で「希望勤務地エリア」
6. `salary-diagnosis-loading.html` → `salary-diagnosis-result.html`

既存の 3 ステップ構成は維持し、**LP と「年収の質問部分」だけ組み替える**。

---

## 2. データ設計（localStorage キー）

### 2-1. 新しく使うキー

- `diagnosisGender`
  - 値: `"male"` または `"female"`
  - 取得元: LP（性別ボタン）
  - 用途:
    - job-site-diagnosis の Q2 `gender` と 1:1 対応

- `diagnosisIncomeCode`
  - 値: `"income_100"`, `"income_200"`, …, `"income_1000"`
  - 取得元: 年収質問ページ
  - 用途:
    - job-site-diagnosis の Q3 `income` と 1:1 対応

- `diagnosisSalary`
  - 値: 年収計算用の代表値（円, 文字列として保存）
  - 取得元: 年収質問ページ
  - 用途:
    - 年収診断結果ページの「適正年収 = 現年収 + 100万円」
    - 偏差値ロジックなど、金額ベースの計算

### 2-2. 既存キー（参考）

- `diagnosisAgeRange`（`salary-diagnosis-step.html` で年齢レンジを保存）
- `diagnosisCurrentJob`, `diagnosisDesiredJob`（`salary-diagnosis-step2.html`）
- `diagnosisAreas`（`salary-diagnosis-step3.html`）

今後は、LP で `diagnosisSalary` を直接設定していた処理は **年収質問ページ側に役割を移す**。

---

## 3. LP の仕様（`salary-diagnosis-construction.html`）

### 3-1. 現状

- 「現年収を答えて診断スタート」のグリッドで **年収レンジ 6ボタン** を表示:
  - 300万円未満
  - 300〜450万円
  - 450〜600万円
  - 600〜750万円
  - 750〜900万円
  - 900万円以上
- クリック時:
  - `localStorage.setItem('diagnosisSalary', '...')`
  - 遷移先: `salary-diagnosis-step.html`

### 3-2. 変更後（要件）

- LP では **年収ではなく「性別」を聞く** 2ボタンに変更する:
  - 「男性」 → `localStorage.setItem('diagnosisGender', 'male')`
  - 「女性」 → `localStorage.setItem('diagnosisGender', 'female')`
- 各ボタンクリック後の遷移先:
  - 新規ページ `salary-diagnosis-income.html`（年収質問ページ）へ。

UI 的には、既存の「年収レンジの6ボタン」エリアを「性別2ボタン」に置き換えるイメージ。

---

## 4. 年収質問ページ（`salary-diagnosis-income.html`）仕様

### 4-1. 質問内容

- タイトル例:  
  - 「現在の年収を教えてください」
- 選択肢は **job-site-diagnosis の 質問3（Q3） と同じ 10レンジ** を使う:

| 表示ラベル       | `diagnosisIncomeCode` | `diagnosisSalary`（代表値, 円） |
|------------------|------------------------|----------------------------------|
| ~100万円台       | `income_100`          | 1,000,000                        |
| 200万円台        | `income_200`          | 2,500,000                        |
| 300万円台        | `income_300`          | 3,500,000                        |
| 400万円台        | `income_400`          | 4,500,000                        |
| 500万円台        | `income_500`          | 5,500,000                        |
| 600万円台        | `income_600`          | 6,500,000                        |
| 700万円台        | `income_700`          | 7,500,000                        |
| 800万円台        | `income_800`          | 8,500,000                        |
| 900万円台        | `income_900`          | 9,500,000                        |
| 1000万円以上     | `income_1000`         | 10,000,000（または 11,000,000） |

※ 代表値は、内部計算（適正年収・偏差値など）のための概算値。必ずしもユーザーの厳密な年収ではない。

### 4-2. クリック時の挙動

- 各ボタンを選択したときに行う処理:
  - `localStorage.setItem('diagnosisIncomeCode', 'income_xxx');`
  - `localStorage.setItem('diagnosisSalary', '代表値');`
  - その後、`salary-diagnosis-step.html` に遷移。

- 画面デザイン:
  - 既存ステップページ（`salary-diagnosis-step.html` 等）と同じく、
    - 白いカード
    - オレンジ色の「次へ進む」ボタン
    - ステップインジケータの UI も揃えておくと UX 的に自然。
  - 自動遷移でも、「選択後に次へボタン押下でも」どちらでもよいが、既存の操作感に合わせる。

---

## 5. job-site-diagnosis との対応関係

### 5-1. 対応表

- 性別:
  - `diagnosisGender` → `"male"` / `"female"`
  - job-site の Q2 `gender` と完全互換。

- 年収:
  - `diagnosisIncomeCode` → `"income_100"`〜`"income_1000"`
  - job-site の Q3 `income` と完全互換。
  - `diagnosisSalary` は内部計算用の代表値として年収診断で使用。

- 年齢:
  - `salary-diagnosis-step.html` の選択肢（〜24歳 / 25〜29歳 / 30〜34歳 / 35〜39歳 / 40〜49歳 / 50歳〜）は、
    - job-site の Q1 のラベルと区切りが一致している。
  - 統合するときは、例えば以下のようなマッピングテーブルを使えばよい:

  ```js
  const ageMap = {
    '〜24歳': 'age_24',
    '25〜29歳': 'age_25_29',
    '30〜34歳': 'age_30_34',
    '35〜39歳': 'age_35_39',
    '40〜49歳': 'age_40_49',
    '50歳〜': 'age_50'
  };
  ```

- 職種:
  - `diagnosisCurrentJob` / `diagnosisDesiredJob` は日本語ラベル（営業 / 販売・サービス / …）を持っている。
  - job-site の `occupation` コード（`sales`, `retail`, `planning`, …）と対応させるには、別途マッピングテーブルを定義する。

- 勤務地:
  - `diagnosisAreas` は「全国どこでも」または都道府県名の配列。
  - job-site は `"01"`〜`"47"` のコードと `nationwide`／`area_XX` タグを使うため、ここもマッピングレイヤーを噛ませる。

### 5-2. 影響範囲

- 年収診断の結果ページ (`salary-diagnosis-result.html`):
  - `diagnosisSalary` を使うロジック（適正年収 + 偏差値）は仕様変更せずそのまま利用できる。
  - `diagnosisIncomeCode` と `diagnosisGender` は、将来的に「おすすめ転職エージェント」機能を組み込む際に使用する。

- 既存ステップ (`step.html`, `step2.html`, `step3.html`) の UI・処理:
  - 性別・年収に関する部分がもともと無いため、今回の変更の影響は受けない。
  - ただし、将来的に転職エージェント診断のフル連携を行う場合は、年齢・職種・勤務地にもタグコードを紐付ける実装を追加する。

---

## 6. 実装ステップ（開発メモ）

1. `salary-diagnosis-construction.html`:
   - 年収レンジ 6ボタンを削除し、「性別」2ボタンに差し替える。
   - クリック時に `diagnosisGender` を保存し、`salary-diagnosis-income.html` に遷移させる。

2. `salary-diagnosis-income.html`（新規作成）:
   - job-site の Q3 と同じ 10 レンジをボタンで表示。
   - 各ボタンで `diagnosisIncomeCode` および `diagnosisSalary` を保存し、`salary-diagnosis-step.html` に遷移。
   - 画面デザインは既存ステップに合わせる（ヘッダー / バナー / ステップインジケータ / ナビバー）。

3. 既存ファイル:
   - `salary-diagnosis-step.html`, `salary-diagnosis-step2.html`, `salary-diagnosis-step3.html` は基本的にそのまま。
   - 必要に応じて、年齢レンジなどを job-site 用コードにマッピングするヘルパー関数を追加していく。

これにより、**表側の UX は「性別 → 年収 → 3ステップ」のシンプルな年収診断のまま**にしつつ、  
