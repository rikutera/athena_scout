import pkg from 'pg';

const { Pool } = pkg;

// データベース接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * スカウトメッセージ用プロンプト生成
 * @param {string} jobType - 職種
 * @param {string} industry - 業種
 * @param {string} companyRequirement - 企業が望むこと
 * @param {string} offerTemplate - オファー文テンプレート
 * @param {string} studentProfile - 学生のプロフィール
 * @param {number} output_rule_id - 出力ルールID
 * @returns {Promise<{systemPrompt: string, userMessage: string}>} プロンプトオブジェクト
 */
export async function buildScoutMessagePrompt(jobType, industry, companyRequirement, offerTemplate, studentProfile, output_rule_id) {
  try {
    // 出力ルール取得
    const ruleResult = await pool.query(
      'SELECT rule_text FROM output_rules WHERE id = $1',
      [output_rule_id]
    );

    if (ruleResult.rows.length === 0) {
      throw new Error('出力ルールが見つかりません');
    }

    const outputRuleText = ruleResult.rows[0].rule_text;

    // 職業適性定義取得
    const result = await pool.query(
      'SELECT name, definition FROM job_types ORDER BY created_at ASC'
    );

    const jobDefinitions = {};
    result.rows.forEach(row => {
      jobDefinitions[row.name] = row.definition;
    });

    const jobDefinition = jobDefinitions[jobType] || '';

    const jobDefinitionsText = result.rows
      .map(row => `${row.name}：${row.definition}`)
      .join('\n');

    // システムプロンプト構築
    const systemPrompt = `あなたは就職活動のための企業からの評価コメント生成アシスタントです。

# 重要な制約事項
1. **出力ルールは絶対に遵守してください** - 以下の【出力ルール】に記載された全ての指示に従うこと
2. **職種特性を最優先** - 指定された職種の定義に合致する要素を重点的に評価すること
3. **業種への適合性** - 指定業種で求められるスキルや経験を考慮すること
4. **企業要求の反映** - 企業が望むことを必ず評価に含めること

【全職種適性の定義】
${jobDefinitionsText}

【今回の指定職種】
${jobType}：${jobDefinition}

【出力ルール（厳守）】
${outputRuleText}

# 評価の優先順位
1. 指定職種（${jobType}）の特性に合致するエピソードを最優先
2. 企業が望むこと（後述）との整合性
3. 業種（後述）で求められる資質との適合性
4. 出力ルールで指定された形式・文字数・構成の厳守`;

    // ユーザーメッセージ構築
    const userMessage = `
# 依頼内容

【職種】${jobType}
※この職種の定義に基づいてエピソードを評価してください

【業種】${industry}
※この業種で求められるスキルや経験を考慮してください

【企業が望むこと】
${companyRequirement}
※この要素を評価コメントに必ず反映させてください

【オファー文テンプレート】
${offerTemplate}
※このテンプレートの【】内部分のみを作成してください

【学生のプロフィール】
${studentProfile}

# 作成手順
1. 学生のプロフィールから、指定職種（${jobType}）の特性に最も合致するエピソードを特定する
2. 企業が望むこと（${companyRequirement}）との整合性を確認する
3. 業種（${industry}）で求められる要素を考慮する
4. 【出力ルール】に記載された文字数・形式・構成を厳密に守る
5. オファー文テンプレートの【】内部分のみを、上記1-4を踏まえて作成する

**注意**: テンプレート全体ではなく、【】内部分のみを出力してください。出力ルールに記載された全ての指示を必ず遵守してください。プロフィールに記載のない情報を想像したり、拡大解釈したりはしないでください。`;

    return { systemPrompt, userMessage };
  } catch (error) {
    console.error('Error building scout message prompt:', error);
    throw error;
  }
}
