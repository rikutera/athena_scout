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

// ========== ヘルスチェック ==========
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// ========== 利用履歴記録ミドルウェア ==========
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        const details = {
          path: req.path,
          method: req.method,
          body: req.method === 'POST' ? req.body : undefined
        };
        await pool.query(
          'INSERT INTO activity_logs (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
          [req.user.userId, req.user.username, action, JSON.stringify(details)]
        );
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
    next();
  };
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
    console.log('Comparing password with password_hash');

    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // ログイン履歴を記録
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await pool.query(
      'INSERT INTO login_logs (user_id, username, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, user.username, ipAddress, userAgent]
    );

    console.log('Login successful for user:', username);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        user_role: user.user_role,
        user_status: user.user_status
      }
    });
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
      [req.user.userId]
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
app.put('/api/auth/me', authenticateToken, logActivity('プロフィール更新'), async (req, res) => {
  try {
    const { username, password, user_status, user_role } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }

    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = hashedPassword
      ? `UPDATE users SET username = $1, password_hash = $2, user_status = $3, user_role = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING id, username, user_status, user_role, created_at`
      : `UPDATE users SET username = $1, user_status = $3, user_role = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING id, username, user_status, user_role, created_at`;

    const params = hashedPassword
      ? [username, hashedPassword, user_status, user_role, req.user.userId]
      : [username, null, user_status, user_role, req.user.userId];

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
      [req.user.userId]
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

// ========== 管理者または責任者権限チェックミドルウェア ==========
const requireAdminOrManager = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 ||
      (result.rows[0].user_role !== 'admin' && result.rows[0].user_role !== 'manager')) {
      return res.status(403).json({ error: '管理者または責任者権限が必要です' });
    }

    next();
  } catch (error) {
    console.error('Error checking role:', error);
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
app.post('/api/users', authenticateToken, requireAdmin, logActivity('ユーザー作成'), async (req, res) => {
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
app.put('/api/users/:id', authenticateToken, requireAdmin, logActivity('ユーザー更新'), async (req, res) => {
  try {
    const { username, password, user_status, user_role } = req.body;
    const userId = req.params.id;

    if (!username) {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }

    let hashedPassword = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

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
app.delete('/api/users/:id', authenticateToken, requireAdmin, logActivity('ユーザー削除'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' });
  }
});

// ========== ログイン履歴・利用履歴 API（管理者のみ）==========

// ログイン履歴取得
app.get('/api/admin/login-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, limit = 100 } = req.query;

    let query = 'SELECT * FROM login_logs';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY login_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ error: 'ログイン履歴の取得に失敗しました' });
  }
});

// 利用履歴取得
app.get('/api/admin/activity-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, limit = 100 } = req.query;

    let query = 'SELECT * FROM activity_logs';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: '利用履歴の取得に失敗しました' });
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
app.post('/api/templates', authenticateToken, logActivity('テンプレート作成'), async (req, res) => {
  try {
    const {
      template_name,
      job_type,
      industry,
      company_requirement,
      offer_template,
      output_rule_id,
    } = req.body;

    if (!template_name) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const result = await pool.query(
      'INSERT INTO templates (template_name, job_type, industry, company_requirement, offer_template, output_rule_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [template_name, job_type, industry, company_requirement, offer_template, output_rule_id]
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
app.put('/api/templates/:id', authenticateToken, logActivity('テンプレート更新'), async (req, res) => {
  try {
    const {
      template_name,
      job_type,
      industry,
      company_requirement,
      offer_template,
      output_rule_id,
    } = req.body;

    const result = await pool.query(
      'UPDATE templates SET template_name = $1, job_type = $2, industry = $3, company_requirement = $4, offer_template = $5, output_rule_id = $6, updated_at = NOW() WHERE id = $7 RETURNING id',
      [template_name, job_type, industry, company_requirement, offer_template, output_rule_id, req.params.id]
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
app.delete('/api/templates/:id', authenticateToken, logActivity('テンプレート削除'), async (req, res) => {
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
app.post('/api/job-types', authenticateToken, requireAdminOrManager, logActivity('職業適性作成'), async (req, res) => {
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
app.put('/api/job-types/:id', authenticateToken, requireAdminOrManager, logActivity('職業適性更新'), async (req, res) => {
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
app.delete('/api/job-types/:id', authenticateToken, requireAdminOrManager, logActivity('職業適性削除'), async (req, res) => {
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
app.get('/api/output-rules/:id', authenticateToken, requireAdminOrManager, async (req, res) => {
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
app.post('/api/output-rules', authenticateToken, requireAdminOrManager, logActivity('出力ルール作成'), async (req, res) => {
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
app.put('/api/output-rules/:id', authenticateToken, requireAdminOrManager, logActivity('出力ルール更新'), async (req, res) => {
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
app.delete('/api/output-rules/:id', authenticateToken, requireAdminOrManager, logActivity('出力ルール削除'), async (req, res) => {
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
    const ruleResult = await pool.query(
      'SELECT rule_text FROM output_rules WHERE id = $1',
      [output_rule_id]
    );

    if (ruleResult.rows.length === 0) {
      throw new Error('出力ルールが見つかりません');
    }

    const outputRuleText = ruleResult.rows[0].rule_text;

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

上記の学生のプロフィール情報を基に、指定職種の特性に合致するエピソードを優先的に抽出し、提示した情報を元にテンプレートの*【】内部分のみ*を作成してください。`;

    return { systemPrompt, userMessage };
  } catch (error) {
    console.error('Error building prompt:', error);
    throw error;
  }
}

// コメント生成エンドポイント（履歴保存付き）
app.post('/api/generate', authenticateToken, logActivity('コメント生成'), async (req, res) => {
  try {
    const {
      template_name,
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

    const { systemPrompt, userMessage } = await buildPrompt(
      job_type,
      industry,
      company_requirement,
      offer_template,
      student_profile,
      output_rule_id
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    // ========== API使用量記録（追加部分）==========
    const usage = message.usage;
    const inputTokens = usage.input_tokens;
    const outputTokens = usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    
    // コスト計算（Claude Sonnet 4の料金）
    const inputCost = (inputTokens / 1000000) * 3.00;
    const outputCost = (outputTokens / 1000000) * 15.00;
    const totalCost = inputCost + outputCost;

    await pool.query(
      'INSERT INTO api_usage_logs (input_tokens, output_tokens, total_tokens, total_cost) VALUES ($1, $2, $3, $4)',
      [inputTokens, outputTokens, totalTokens, totalCost]
    );
    // ========== API使用量記録ここまで ==========

    // 生成履歴をデータベースに保存
    await pool.query(
      'INSERT INTO generation_history (user_id, username, template_name, job_type, industry, student_profile, generated_comment) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.userId, req.user.username, template_name, job_type, industry, student_profile, generatedComment]
    );

    res.json({ success: true, comment: generatedComment });
  } catch (error) {
    console.error('Error generating comment:', error);
    res.status(500).json({ error: 'コメント生成に失敗しました' });
  }
});

// ========== API使用量統計 API（管理者のみ）==========

// API使用量統計取得
app.get('/api/admin/usage-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 全期間の合計
    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        SUM(total_cost) as total_cost
      FROM api_usage_logs
    `);

    // 月別の統計
    const monthlyResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens,
        SUM(total_cost) as cost
      FROM api_usage_logs
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `);

    res.json({
      total: totalResult.rows[0],
      monthly: monthlyResult.rows
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: '使用量統計の取得に失敗しました' });
  }
});

// ========== 生成履歴 API ==========

// 自分の生成履歴取得
app.get('/api/my-generation-history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await pool.query(
      'SELECT id, template_name, job_type, industry, student_profile, generated_comment, created_at FROM generation_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching generation history:', error);
    res.status(500).json({ error: '生成履歴の取得に失敗しました' });
  }
});

// 特定の生成履歴削除
app.delete('/api/my-generation-history/:id', authenticateToken, async (req, res) => {
  try {
    const historyId = req.params.id;

    const result = await pool.query(
      'DELETE FROM generation_history WHERE id = $1 AND user_id = $2 RETURNING id',
      [historyId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '履歴が見つかりません' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting generation history:', error);
    res.status(500).json({ error: '履歴の削除に失敗しました' });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// データベース初期化関数
async function initializeDatabase() {
  try {
    // usersテーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_status VARCHAR(50) DEFAULT 'active',
        user_role VARCHAR(50) DEFAULT 'user'
      )
    `);

    // ログイン履歴テーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255),
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);

    // 利用履歴テーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255),
        action VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 生成履歴テーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS generation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255),
        template_name VARCHAR(255),
        job_type VARCHAR(100),
        industry VARCHAR(100),
        student_profile TEXT,
        generated_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created (users, login_logs, activity_logs, generation_history)');

    // 管理者ユーザーを存在しない場合のみ作成（シーケンスを無駄に進めない）
    const adminExists = await pool.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', ['admin']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, user_role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Created default admin user');
    } else {
      console.log('Admin user already exists');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// サーバー起動
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('Using HOST:', HOST);

// データベース初期化してからサーバー起動
initializeDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
  });
});
// 管理者用：特定ユーザーの生成履歴取得
app.get('/api/admin/generation-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, limit = 100 } = req.query;

    let query = 'SELECT id, template_name, job_type, industry, student_profile, generated_comment, created_at FROM generation_history';
    let params = [];

    if (user_id) {
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching generation history:', error);
    res.status(500).json({ error: '生成履歴の取得に失敗しました' });
  }
});
