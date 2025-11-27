-- チーム管理機能の追加

-- teamsテーブル作成
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- team_membersテーブル作成（多対多の中間テーブル）
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_manager BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_manager ON team_members(is_manager);

-- Permissions
ALTER TABLE teams OWNER TO postgres;
GRANT ALL ON TABLE teams TO postgres;

ALTER TABLE team_members OWNER TO postgres;
GRANT ALL ON TABLE team_members TO postgres;

GRANT ALL ON SEQUENCE teams_id_seq TO postgres;
GRANT ALL ON SEQUENCE team_members_id_seq TO postgres;
