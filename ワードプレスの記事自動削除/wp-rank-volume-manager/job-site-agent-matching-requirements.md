## 転職エージェント側マッチング要件定義（複数条件対応版）

### 1. ゴール

- エージェントごとに、**年収・職種・年齢・性別を「複数条件」で持てる**ようにする。
- ユーザー回答（年齢・性別・年収・職種・勤務地）に対して、
  - 「20代男性」「年収300〜500万」「営業」「関東」など、
  - 実運用に近いセグメントで **おすすめエージェントをマッチング** できるようにする。

---

### 2. 前提：ユーザー側の回答仕様

job-site-diagnosis / 年収診断側から渡される回答データは、以下を前提とする。

- `gender`: `"male"` / `"female"`
- `age`: `"age_24"`, `"age_25_29"`, `"age_30_34"`, `"age_35_39"`, `"age_40_49"`, `"age_50"`
- `income`: `"income_100"`〜`"income_1000"`
- `occupation`: `"sales"`, `"retail"`, `"it"`, `"architecture"` など職種コード
- `locations`: 都道府県コード文字列の配列（例: `["13", "27"]`）
  - マッチング用には `area_13`, `area_27` のような **エリアタグ配列** に変換して利用する。

---

### 3. エージェント定義データ構造（新仕様）

#### 3-1. 基本構造

エージェント1件あたり、JSON 形式で以下のプロパティを持つ。

- **必須**
  - `name`: サービス名（文字列）
  - `url_key`: サービス固有キー（スラッグ、文字列）
  - `url`: 遷移先URL（文字列）
  - `tags`: **職種・エリアなどのタグ配列**
    - 例: `["sales", "retail", "area_13", "area_27", "nationwide"]`

- **任意（すべて「複数値 or any」想定）**
  - `occupations`: 対応可能な職種コードの配列
    - 例: `["sales", "retail", "planning", "clerical"]`
    - 省略時: 職種では絞り込まない（= どの職種でもマッチ可能）運用も可
  - `genders`: 対応可能な性別コードの配列
    - 例: `["male", "female"]`, `["male"]`
    - `"any"` を使う場合は `["any"]` またはプロパティ自体を省略
  - `ages`: 対応可能な年齢コードの配列
    - 例: `["age_24", "age_25_29", "age_30_34"]`
  - `incomes`: 対応可能な年収レンジコードの配列
    - 例: `["income_300", "income_400", "income_500"]`

#### 3-2. サンプル定義

```json
{
  "name": "リクナビNEXT",
  "url_key": "rikunabi",
  "url": "https://example.com",
  "tags": ["nationwide", "area_13", "area_27"],
  "occupations": ["sales", "retail", "planning", "clerical"],
  "genders": ["male", "female"],
  "ages": ["age_24", "age_25_29", "age_30_34", "age_35_39"],
  "incomes": ["income_300", "income_400", "income_500", "income_600"]
}
```

---

### 4. マッチングロジック仕様

#### 4-1. ユーザー回答のタグ展開

```js
// ユーザー回答（例）
const answers = {
  gender: 'male',
  age: 'age_25_29',
  income: 'income_400',
  occupation: 'sales',
  locations: ['13', '27'] // 東京・大阪
};

// ロケーション用タグ配列に変換
const areaTags = (answers.locations || []).map(code => {
  return 'area_' + String(code).padStart(2, '0'); // "13" → "area_13"
});
```

#### 4-2. エージェント1件あたりの判定条件

エージェント `agent` が「おすすめ候補」になるための条件は以下の通り。

1. **職種マッチ（OR）**
   - `agent.occupations` を持っている場合  
     → `answers.occupation` が `agent.occupations` に **含まれている** こと。
   - `agent.occupations` 未定義または空配列の場合  
     → 職種では絞り込まない（常にOK）という運用も可。

2. **地域マッチ（OR）**
   - エージェントの `tags` に `"nationwide"` が含まれている  
     **または**
   - ユーザーの `areaTags` と、エージェントの `tags` に含まれる `area_XX` が
     **1つ以上重なっている**。

3. **性別マッチ（OR）**
   - `agent.genders` が未定義または `["any"]` の場合  
     → 性別では絞り込まない（常にOK）。
   - それ以外の場合  
     → `answers.gender` が `agent.genders` に **含まれている** こと。

4. **年齢マッチ（OR）**
   - `agent.ages` が未定義または `["any"]` の場合  
     → 年齢では絞り込まない（常にOK）。
   - それ以外の場合  
     → `answers.age` が `agent.ages` に **含まれている** こと。

5. **年収マッチ（OR）**
   - `agent.incomes` が未定義または `["any"]` の場合  
     → 年収では絞り込まない（常にOK）。
   - それ以外の場合  
     → `answers.income` が `agent.incomes` に **含まれている** こと。

#### 4-3. 最終マッチ条件（AND 結合）

- 上記 1〜5 のすべてを満たしたエージェントのみを、
  **「おすすめ転職エージェント」リストとして採用**する。
- 論理式イメージ:

```text
match(agent, answers) =
  職種マッチ(agent, answers.occupation)
  AND 地域マッチ(agent, answers.locations)
  AND 性別マッチ(agent, answers.gender)
  AND 年齢マッチ(agent, answers.age)
  AND 年収マッチ(agent, answers.income)
```

---

### 5. 擬似コード例

実装イメージを JS 風の擬似コードでまとめる。

```js
function isMatch(agent, answers) {
  const areaTags = (answers.locations || []).map(code => {
    return 'area_' + String(code).padStart(2, '0');
  });

  // 1. 職種マッチ
  let occupationOk = true;
  if (Array.isArray(agent.occupations) && agent.occupations.length > 0) {
    occupationOk = agent.occupations.includes(answers.occupation);
  }

  // 2. 地域マッチ
  const tags = agent.tags || [];
  const hasNationwide = tags.includes('nationwide');
  const hasMatchingArea = areaTags.some(t => tags.includes(t));
  const regionOk = hasNationwide || hasMatchingArea;

  // 3. 性別マッチ
  let genderOk = true;
  if (Array.isArray(agent.genders) && agent.genders.length > 0 && !agent.genders.includes('any')) {
    genderOk = agent.genders.includes(answers.gender);
  }

  // 4. 年齢マッチ
  let ageOk = true;
  if (Array.isArray(agent.ages) && agent.ages.length > 0 && !agent.ages.includes('any')) {
    ageOk = agent.ages.includes(answers.age);
  }

  // 5. 年収マッチ
  let incomeOk = true;
  if (Array.isArray(agent.incomes) && agent.incomes.length > 0 && !agent.incomes.includes('any')) {
    incomeOk = agent.incomes.includes(answers.income);
  }

  return occupationOk && regionOk && genderOk && ageOk && incomeOk;
}

function recommendAgents(answers, agents) {
  return agents.filter(agent => isMatch(agent, answers));
}
```

---

### 6. 既存データからの移行方針（メモ）

- 旧仕様で単一値だったフィールドがある場合:
  - `gender: "male"` → `genders: ["male"]`
  - `age: "age_25_29"` → `ages: ["age_25_29"]`
  - `income: "income_300"` → `incomes: ["income_300"]`
- `"any"` / 未設定だった場合:
  - `genders` / `ages` / `incomes` を省略、または `["any"]` を入れる運用。
- マッチングロジックは **配列ベース（複数指定）を前提** とし、
  旧フィールドが残っている間は、移行のための変換レイヤーで吸収する。

