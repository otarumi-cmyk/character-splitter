## 年収診断 × 転職エージェント診断 連携要件

### 1. ゴール

- 年収診断の結果ページ（`salary-diagnosis-result.html`）に、  
  **転職エージェント診断（job-site-diagnosis）と同じロジックで選ばれた転職エージェントを一覧表示**する。
- 「おすすめの求人情報」「おすすめの転職エージェント」のような枠に、  
  複数のエージェント（サービス名＋リンクなど）が **ポンポン出てくる UI** を実現する。

---

### 2. 使用するデータソース

#### 2-1. 年収診断側（ブラウザ / localStorage）

年収診断フローで既に保存されている（または保存予定の）キー:

- `diagnosisGender`  
  - `"male"` / `"female"`
- `diagnosisAgeRange`  
  - `"〜24歳"`, `"25〜29歳"`, `"30〜34歳"`, `"35〜39歳"`, `"40〜49歳"`, `"50歳〜"`
- `diagnosisIncomeCode`  
  - `"income_100"`〜`"income_1000"`
- `diagnosisSalary`  
  - 代表値（円, 文字列）
- `diagnosisCurrentJob` / `diagnosisDesiredJob`  
  - 日本語ラベル（営業 / 販売・サービス / ITエンジニア / 建築・土木 など）
- `diagnosisAreas`  
  - `"全国どこでも"` または都道府県名の配列（例: `["東京都", "大阪府"]`）

#### 2-2. 転職エージェント診断側（WordPress プラグイン / JSON）

- `job-site-diagnosis/data/agents.json`  
  - `agents: [ { name, url, tags, occupations?, genders?, ages?, incomes? }, ... ]`
  - エージェント側の複数条件仕様は `job-site-agent-matching-requirements.md` に準拠。
- `job-site-diagnosis/assets/js/job-site-diagnosis.js`  
  - `matchAgents`, `answersToTags` などのマッチロジックを実装済み。

---

### 3. データマッピング仕様（年収診断 → job-site-diagnosis）

年収診断の localStorage 値を、転職エージェント診断で使う `state.answers` 形式にマッピングする。

#### 3-1. 変換後のターゲット形式

```js
const answers = {
  gender: 'male' | 'female',
  age: 'age_24' | 'age_25_29' | 'age_30_34' | 'age_35_39' | 'age_40_49' | 'age_50',
  income: 'income_100' | ... | 'income_1000',
  occupation: 'sales' | 'it' | 'architecture' | 'retail' | ...,
  locations: ['13', '27', ...] // 都道府県コード
};
```

#### 3-2. 各項目のマッピングルール

- **gender**
  - 入力: `diagnosisGender`（`"male"` / `"female"`）
  - 出力: `answers.gender = diagnosisGender`（そのまま）

- **age**
  - 入力: `diagnosisAgeRange`（日本語レンジ）
  - マップ表（`job-site-integration-flow.md` と同じ）:

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

  - 出力: `answers.age = ageMap[diagnosisAgeRange] || null`

- **income**
  - 入力: `diagnosisIncomeCode`（`"income_100"`〜`"income_1000"`）
  - 出力: `answers.income = diagnosisIncomeCode`（そのまま）

- **occupation**
  - 入力: `diagnosisDesiredJob`（希望職種の日本語ラベル）
  - マップ表を新設（例）:

  ```js
  const occupationMap = {
    '営業': 'sales',
    '販売・サービス': 'retail',
    '企画': 'planning',
    '事務': 'clerical',
    'ITエンジニア': 'it',
    '建築・土木': 'architecture',
    // ... 必要なだけ追加
    'その他': 'other'
  };
  ```

  - 出力: `answers.occupation = occupationMap[diagnosisDesiredJob] || 'other'`
  - 備考: `diagnosisCurrentJob` は将来的な高度化（今の職種とのギャップ評価など）に使用。

- **locations**
  - 入力: `diagnosisAreas`
    - `"全国どこでも"` のみ
    - 都道府県名1つ
    - 都道府県名の配列
  - 都道府県名 → コードのマップ表（例）:

  ```js
  const prefectureCodeMap = {
    '北海道': '01',
    '青森県': '02',
    '岩手県': '03',
    // ...
    '東京都': '13',
    '大阪府': '27',
    // ...
    '沖縄県': '47'
  };
  ```

  - 変換ロジック:
    - `diagnosisAreas` が `"全国どこでも"` の場合:
      - `answers.locations` は **全都道府県コード**（`["01","02",...,"47"]`）または、  
        特別に `['all']` のような疑似値を使い、エージェント側で `nationwide` として扱う、など運用ルールを決める。
    - `diagnosisAreas` が配列の場合:

    ```js
    const codes = [];
    (diagnosisAreas || []).forEach(name => {
      const c = prefectureCodeMap[name];
      if (c) codes.push(c);
    });
    answers.locations = codes;
    ```

---

### 4. マッチングロジックの再利用方針

#### 4-1. 既存ロジックを「そのまま使う」パターン

- 結果ページ（`salary-diagnosis-result.html`）に `job-site-diagnosis.js` を読み込む。
- グローバルな `AGENTS`（`DATA.agents`）と `matchAgents`, `answersToTags` を再利用する。
- 手順:

1. `answers` オブジェクトを 3章の仕様で組み立てる。
2. `state.answers` 相当の構造に一時的に代入するか、軽量なラッパー関数を作る。
3. `answersToTags(answers)` と同等の処理で `userTags`（職種＋area_XX）を生成。
4. `const matched = matchAgents(userTags);` を呼ぶ。

#### 4-2. 軽量版 `recommendAgents` 関数を年収診断側に実装するパターン

- `job-site-agent-matching-requirements.md` の擬似コードをベースに、
  年収診断の結果ページ専用の `recommendAgents(answers, agents)` を用意する。
- この場合は:
  - `agents.json` を `fetch` で読み込んで `agents` 配列を得る。
  - `recommendAgents(answers, agents)` でマッチしたリストを作る。

> どちらを採用しても、最終的な **マッチ条件は job-site-agent-matching-requirements.md と同一**にする。

---

### 5. 結果ページ UI 仕様（概要）

#### 5-1. 表示位置

- `salary-diagnosis-result.html` 内のカード群に、  
  新たに **「おすすめ転職エージェント」カード** を追加する。
- 候補:
  - 年収偏差値カード（棒グラフ）の **下** に 1枚追加。
  - または「AIキャリアアドバイザーのアドバイス」カードの **後ろ**。

#### 5-2. デザイン（方向性だけ）

- 既存カードと同じレイアウト（白いボックス、タイトル、本文テキスト）。
- タイトル例:
  - 「あなたにおすすめの転職エージェント」
- 中身:
  - エージェント名＋簡易説明＋公式サイトリンク
  - 例:

  ```html
  <div class="agent-card">
    <p class="agent-title">あなたにおすすめの転職エージェント</p>
    <ul class="agent-list" id="agentList"></ul>
  </div>
  ```

  - JS で `matched` をループして `<li>` を生成:

  ```js
  matched.forEach(agent => {
    const li = document.createElement('li');
    li.innerHTML =
      '<a href="' +
      escapeHtml(agent.url || '#') +
      '" target="_blank" rel="noopener">' +
      escapeHtml(agent.name || agent.url_key || '') +
      '</a>';
    listEl.appendChild(li);
  });
  ```

---

### 6. 実装ステップ（開発メモ）

1. **マッピング関数の実装**
   - 年収診断側 JS に、`localStorage` → `answers` への変換関数を追加。
   - 年齢 / 職種 / 都道府県のマップテーブルを `job-site-integration-flow.md` と整合させる。

2. **エージェントデータの取得**
   - WordPress 経由で `DATA.agents` を渡すか、
   - もしくは `agents.json` を `fetch` して `agents` 配列を得る。

3. **マッチングロジックの呼び出し**
   - パターンA: `job-site-diagnosis.js` の `matchAgents` / `answersToTags` を再利用。
   - パターンB: `recommendAgents(answers, agents)` を年収診断側に実装。

4. **結果ページへの描画**
   - `salary-diagnosis-result.html` に「おすすめ転職エージェント」用のカードHTML枠を追加。
   - DOM ロード後に JS で `matched` をループして `<li>` / `<a>` を生成する。

5. **テスト**
   - 条件を変えたときに出てくるエージェントが、  
     job-site-diagnosis 単体での診断結果と **一貫していること** を確認する。

