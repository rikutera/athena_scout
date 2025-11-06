-- ========== Users テーブル ==========
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_status VARCHAR(50) DEFAULT 'active',
  user_role VARCHAR(50) DEFAULT 'user'
);

-- ========== ログイン履歴テーブル ==========
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255),
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- ========== 利用履歴テーブル ==========
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255),
  action VARCHAR(100),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 職業適性テーブル ==========
CREATE TABLE IF NOT EXISTS job_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ========== 出力ルールテーブル ==========
CREATE TABLE IF NOT EXISTS output_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  rule_text TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ========== テンプレートテーブル ==========
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(255),
  industry VARCHAR(255),
  company_requirement TEXT,
  offer_template TEXT,
  output_rule_id INTEGER REFERENCES output_rules(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ========== 生成履歴テーブル ==========
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
);

-- ========== API使用量ログテーブル ==========
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  total_cost NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ========== ユーザー・テンプレート関連付けテーブル（多対多） ==========
CREATE TABLE IF NOT EXISTS user_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- ========== ユーザー・出力ルール関連付けテーブル（多対多） ==========
CREATE TABLE IF NOT EXISTS user_output_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  output_rule_id INTEGER NOT NULL REFERENCES output_rules(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, output_rule_id)
);

-- ========== インデックス作成（パフォーマンス向上） ==========
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_template_id ON user_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_user_output_rules_user_id ON user_output_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_output_rules_output_rule_id ON user_output_rules(output_rule_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);