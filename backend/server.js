import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(express.json());

// CORS設定
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173'
];

console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== リクエストログ追加 ==========
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  next();
});

// ========== ヘルスチェック（追加） ==========
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ========================================

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ========== 認証ミドルウェア ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'トークンが提供されていません' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効または期限切れです' });
    }
    req.user = user;
    next();
  });
};

// ========== 認証 API ==========

// ユーザー登録（管理者用）
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'ユーザー登録に失敗しました' });
    }
  }
});

// ログイン
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt:', req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('User query result:', result.rows.length > 0 ? 'User found' : 'User not found');

    if (result.rows.length === 0) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });

    console.log('Login successful for user:', username);
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ユーザー情報管理 ==========

// 現在のユーザー情報取得
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, user_status, user_role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// ユーザー情報更新
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { username, password, user_status, user_role } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }

    // パスワード更新がある場合はハッシュ化
    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // パスワードがない場合は既存のパスワードを保持
    const query = hashedPassword
      ? `UPDATE users SET username = $1, password_hash = $2, user_status = $3, user_role = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING id, username, user_status, user_role, created_at`
      : `UPDATE users SET username = $1, user_status = $3, user_role = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING id, username, user_status, user_role, created_at`;

    const params = hashedPassword
      ? [username, hashedPassword, user_status, user_role, req.user.id]
      : [username, null, user_status, user_role, req.user.id];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'ユーザー情報の更新に失敗しました' });
    }
  }
});

// ========== 管理者権限チェックミドルウェア ==========
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || result.rows[0].user_role !== 'admin') {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ error: '権限チェックに失敗しました' });
  }
};

// ========== ユーザー管理 API（管理者のみ）==========

// 全ユーザー一覧取得
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, user_status, user_role, created_at, updated_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
  }
});

// 新規ユーザー作成（管理者用）
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, user_status, user_role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, user_status, user_role) VALUES ($1, $2, $3, $4) RETURNING id, username, user_status, user_role, created_at',
      [username, hashedPassword, user_status || 'active', user_role || 'user']
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'ユーザーの作成に失敗しました' });
    }
  }
});

// 特定ユーザー更新（管理者用）
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, user_status, user_role } = req.body;
    const userId = req.params.id;

    if (!username) {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }

    // パスワード更新がある場合はハッシュ化
    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // パスワードがない場合は既存のパスワードを保持
    const query = hashedPassword
      ? `UPDATE users SET username = $1, password_hash = $2, user_status = $3, user_role = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING id, username, user_status, user_role, created_at, updated_at`
      : `UPDATE users SET username = $1, user_status = $2, user_role = $3, updated_at = NOW() 
         WHERE id = $4 RETURNING id, username, user_status, user_role, created_at, updated_at`;

    const params = hashedPassword
      ? [username, hashedPassword, user_status, user_role, userId]
      : [username, user_status, user_role, userId];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'ユーザーの更新に失敗しました' });
    }
  }
});

// ユーザー削除（管理者用）
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // 自分自身は削除できない
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

// ========== テンプレート管理 ==========

// テンプレート一覧取得
app.get('/api/templates', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'テンプレート一覧の取得に失敗しました' });
  }
});

// テンプレート詳細取得
app.get('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'テンプレートが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'テンプレートの取得に失敗しました' });
  }
});

// テンプレート作成
app.post('/api/templates', authenticateToken, async (req, res) => {
  try {
    const {
      company_id,
      template_name,
      job_type,
      industry,
      company_requirement,
      offer_template,
      output_rule_id,
    } = req.body;

    if (!company_id || !template_name) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const result = await pool.query(
      'INSERT INTO templates (company_id, template_name, job_type, industry, company_requirement, offer_template, output_rule_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [company_id, template_name, job_type, industry, company_requirement, offer_template, output_rule_id]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating template:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このテンプレート名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'テンプレートの作成に失敗しました' });
    }
  }
});

// テンプレート更新
app.put('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    const {
      company_id,
      template_name,
      job_type,
      industry,
      company_requirement,
      offer_template,
      output_rule_id,
    } = req.body;

    const result = await pool.query(
      'UPDATE templates SET company_id = $1, template_name = $2, job_type = $3, industry = $4, company_requirement = $5, offer_template = $6, output_rule_id = $7, updated_at = NOW() WHERE id = $8 RETURNING id',
      [company_id, template_name, job_type, industry, company_requirement, offer_template, output_rule_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'テンプレートが見つかりません' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'このテンプレート名は既に使用されています' });
    } else {
      res.status(500).json({ error: 'テンプレートの更新に失敗しました' });
    }
  }
});

// テンプレート削除
app.delete('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'テンプレートの削除に失敗しました' });
  }
});

// ========== 職業適性管理 ==========

// 職業適性一覧取得
app.get('/api/job-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, definition FROM job_types ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job types:', error);
    res.status(500).json({ error: '職業適性の取得に失敗しました' });
  }
});

// 職業適性作成
app.post('/api/job-types', authenticateToken, async (req, res) => {
  try {
    const { name, definition } = req.body;

    if (!name || !definition) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const result = await pool.query(
      'INSERT INTO job_types (name, definition) VALUES ($1, $2) RETURNING id',
      [name, definition]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating job type:', error);
    res.status(500).json({ error: '職業適性の作成に失敗しました' });
  }
});

// 職業適性更新
app.put('/api/job-types/:id', authenticateToken, async (req, res) => {
  try {
    const { name, definition } = req.body;

    const result = await pool.query(
      'UPDATE job_types SET name = $1, definition = $2, updated_at = NOW() WHERE id = $3 RETURNING id',
      [name, definition, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '職業適性が見つかりません' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating job type:', error);
    res.status(500).json({ error: '職業適性の更新に失敗しました' });
  }
});

// 職業適性削除
app.delete('/api/job-types/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM job_types WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting job type:', error);
    res.status(500).json({ error: '職業適性の削除に失敗しました' });
  }
});

// ========== 出力ルール管理 ==========

// 出力ルール一覧取得
app.get('/api/output-rules', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, rule_name, rule_text, description, is_active FROM output_rules ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching output rules:', error);
    res.status(500).json({ error: '出力ルールの取得に失敗しました' });
  }
});

// 出力ルール詳細取得
app.get('/api/output-rules/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM output_rules WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '出力ルールが見つかりません' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching output rule:', error);
    res.status(500).json({ error: '出力ルールの取得に失敗しました' });
  }
});

// 出力ルール作成
app.post('/api/output-rules', authenticateToken, async (req, res) => {
  try {
    const { rule_name, rule_text, description, is_active } = req.body;

    if (!rule_name || !rule_text) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const result = await pool.query(
      'INSERT INTO output_rules (rule_name, rule_text, description, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
      [rule_name, rule_text, description, is_active !== false]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating output rule:', error);
    res.status(500).json({ error: '出力ルールの作成に失敗しました' });
  }
});

// 出力ルール更新
app.put('/api/output-rules/:id', authenticateToken, async (req, res) => {
  try {
    const { rule_name, rule_text, description, is_active } = req.body;

    const result = await pool.query(
      'UPDATE output_rules SET rule_name = $1, rule_text = $2, description = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING id',
      [rule_name, rule_text, description, is_active !== false, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '出力ルールが見つかりません' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating output rule:', error);
    res.status(500).json({ error: '出力ルールの更新に失敗しました' });
  }
});

// 出力ルール削除
app.delete('/api/output-rules/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM output_rules WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting output rule:', error);
    res.status(500).json({ error: '出力ルールの削除に失敗しました' });
  }
});

// ========== コメント生成 ==========

// プロンプト組立関数（非同期）
async function buildPrompt(jobType, industry, companyRequirement, offerTemplate, studentProfile, output_rule_id) {
  try {
    // DBから出力ルールを取得
    const ruleResult = await pool.query(
      'SELECT rule_text FROM output_rules WHERE id = $1',
      [output_rule_id]
    );

    if (ruleResult.rows.length === 0) {
      throw new Error('出力ルールが見つかりません');
    }

    const outputRuleText = ruleResult.rows[0].rule_text;

    // DBから全職種定義を取得
    const result = await pool.query(
      'SELECT name, definition FROM job_types ORDER BY created_at ASC'
    );

    // 職種定義を辞書形式に変換
    const jobDefinitions = {};
    result.rows.forEach(row => {
      jobDefinitions[row.name] = row.definition;
    });

    const jobDefinition = jobDefinitions[jobType] || '';

    // 職種定義の一覧を文字列で作成
    const jobDefinitionsText = result.rows
      .map(row => `${row.name}：${row.definition}`)
      .join('\n');

    const systemPrompt = `あなたは就職活動のための企業からの評価コメント生成アシスタントです。
以下のルールに厳密に従ってください：

【職種適性の定義】
${jobDefinitionsText}

【指定職種】
${jobType}：${jobDefinition}

【出力ルール】
${outputRuleText}`;

    const userMessage = `
【職種】${jobType}
【業種】${industry}
【企業が望むこと】${companyRequirement}
【オファー文テンプレート】${offerTemplate}

【学生のプロフィール】
${studentProfile}

上記の学生のプロフィール情報を基に、指定職種の特性に合致するエピソードを優先的に抽出し、テンプレートの【】内部分を作成してください。`;

    return { systemPrompt, userMessage };
  } catch (error) {
    console.error('Error building prompt:', error);
    throw error;
  }
}

// コメント生成エンドポイント
app.post('/api/generate', authenticateToken, async (req, res) => {
  try {
    const {
      job_type,
      industry,
      company_requirement,
      offer_template,
      student_profile,
      output_rule_id,
    } = req.body;

    if (!job_type || !industry || !company_requirement || !offer_template || !student_profile || !output_rule_id) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    // プロンプト組立
    const { systemPrompt, userMessage } = await buildPrompt(
      job_type,
      industry,
      company_requirement,
      offer_template,
      student_profile,
      output_rule_id
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
    res.status(500).json({ error: 'コメント生成に失敗しました' });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('Using HOST:', HOST);

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});