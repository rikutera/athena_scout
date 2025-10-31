
-- generation_historyテーブルにtemplate_nameカラムを追加
ALTER TABLE generation_history ADD COLUMN IF NOT EXISTS template_name VARCHAR(255);
