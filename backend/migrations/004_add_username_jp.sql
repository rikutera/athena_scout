-- usersテーブルにusername_jpカラムを追加
-- 日本語名用のカラムを追加

ALTER TABLE users
ADD COLUMN username_jp VARCHAR(100);

-- 既存データに対して、usernameと同じ値を初期値として設定（必要に応じて後で更新）
UPDATE users SET username_jp = username WHERE username_jp IS NULL;
