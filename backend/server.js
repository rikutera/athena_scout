import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ========== Health Check ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ========== テンプレート管理 ==========

// テンプレート一覧取得
app.get('/api/templates', async (req, res) => {
  try {
    const companyId = req.query.company_id;
    const result = await pool.query(
      'SELECT id, template_name, job_type, industry FROM templates WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// テンプレート詳細取得
app.get('/api/templates/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// テンプレート保存
app.post('/api/templates', async (req, res) => {
  try {
    const {
      company_id,
      template_name,
      job_type,
      industry,
      company_requirement,
      offer_template,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO templates 
       (company_id, template_name, job_type, industry, company_requirement, offer_template)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (company_id, template_name) DO UPDATE 
       SET job_type = $3, industry = $4, company_requirement = $5, offer_template = $6, updated_at = NOW()
       RETURNING id`,
      [company_id, template_name, job_type, industry, company_requirement, offer_template]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// テンプレート更新
app.put('/api/templates/:id', async (req, res) => {
  try {
    const {
      job_type,
      industry,
      company_requirement,
      offer_template,
    } = req.body;

    const result = await pool.query(
      `UPDATE templates 
       SET job_type = $1, industry = $2, company_requirement = $3, offer_template = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id`,
      [job_type, industry, company_requirement, offer_template, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// テンプレート削除
app.delete('/api/templates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ========== コメント生成 ==========

// プロンプト組立関数
function buildPrompt(jobType, industry, companyRequirement, offerTemplate, studentProfile) {
  const jobDefinitions = {
    '営業職': '相手の懐に臆さず飛び込み、多くの人との関係の輪を広げていく',
    'サービス職': 'その場の状況や相手に応じて臨機応変に対応し、相手の期待に応えていく',
    '企画職': '自ら現場に問いを投げ、何が求められているのかを考え抜き、必要な施策を起案する',
    '事務職': '物事を曖昧なままにすることなく、細かなことも素早く着実に推進する',
    '技術職': '物事を極める集中力に長け、向上心を持って新たなスキルや知識を磨き続ける',
    '研究職': '一つの物事を継続的に考え抜くと共に、様々な角度から見つめられる視野の広さを持つ',
  };

  const jobDefinition = jobDefinitions[jobType] || '';

  const systemPrompt = `あなたは就職活動のための企業からの評価コメント生成アシスタントです。
以下のルールに厳密に従ってください：

【職種適性の定義】
営業職：相手の懐に臆さず飛び込み、多くの人との関係の輪を広げていく
サービス職：その場の状況や相手に応じて臨機応変に対応し、相手の期待に応えていく
企画職：自ら現場に問いを投げ、何が求められているのかを考え抜き、必要な施策を起案する
事務職：物事を曖昧なままにすることなく、細かなことも素早く着実に推進する
技術職：物事を極める集中力に長け、向上心を持って新たなスキルや知識を磨き続ける
研究職：一つの物事を継続的に考え抜くと共に、様々な角度から見つめられる視野の広さを持つ

【指定職種】
${jobType}：${jobDefinition}

【出力ルール】
- 【】内の文章のみを出力する（【】記号や句点は含めない）
- 200-300文字程度の適度なボリュームを持たせる
- エピソードから発揮された能力を2-3個抽出し、対比・関連付けながら組み合わせる
- 出力例の通り、「〇〇での××経験と△△での□□経験を通じて発揮された●●力と▲▲力、■■における◆◆力と◇◇力」という構成を意識する
- 基本的に2つのエピソードを盛り込む
- エピソードが1つのみの場合は「※一つのエピソードで作成」と明記する
- プロフィールに具体的なエピソードがない場合は、学部・志望職種・志望業種・資格・スキルから思考特性や学習意欲を抽出する`;

  const userMessage = `
【職種】${jobType}
【業種】${industry}
【企業が望むこと】${companyRequirement}
【オファー文テンプレート】${offerTemplate}

【学生のプロフィール】
${studentProfile}

上記の学生のプロフィール情報を基に、指定職種の特性に合致するエピソードを優先的に抽出し、テンプレートの【】内部分を作成してください。`;

  return { systemPrompt, userMessage };
}

// コメント生成エンドポイント
app.post('/api/generate', async (req, res) => {
  try {
    const {
      job_type,
      industry,
      company_requirement,
      offer_template,
      student_profile,
    } = req.body;

    if (!job_type || !industry || !company_requirement || !offer_template || !student_profile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // プロンプト組立
    const { systemPrompt, userMessage } = buildPrompt(
      job_type,
      industry,
      company_requirement,
      offer_template,
      student_profile
    );

    // Claude API呼び出し
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const generatedComment = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    res.json({ success: true, comment: generatedComment });
  } catch (error) {
    console.error('Error generating comment:', error);
    res.status(500).json({ error: 'Failed to generate comment' });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});