-- チーム単位でのテンプレート・出力ルール割り当て機能の追加

-- team_templatesテーブル作成（チーム用テンプレート割り当て）
CREATE TABLE IF NOT EXISTS team_templates (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, template_id)
);

-- team_output_rulesテーブル作成（チーム用出力ルール割り当て）
CREATE TABLE IF NOT EXISTS team_output_rules (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  output_rule_id INTEGER NOT NULL REFERENCES output_rules(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, output_rule_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_team_templates_team_id ON team_templates(team_id);
CREATE INDEX IF NOT EXISTS idx_team_templates_template_id ON team_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_team_output_rules_team_id ON team_output_rules(team_id);
CREATE INDEX IF NOT EXISTS idx_team_output_rules_output_rule_id ON team_output_rules(output_rule_id);

-- Permissions
ALTER TABLE team_templates OWNER TO postgres;
GRANT ALL ON TABLE team_templates TO postgres;
GRANT ALL ON SEQUENCE team_templates_id_seq TO postgres;

ALTER TABLE team_output_rules OWNER TO postgres;
GRANT ALL ON TABLE team_output_rules TO postgres;
GRANT ALL ON SEQUENCE team_output_rules_id_seq TO postgres;
