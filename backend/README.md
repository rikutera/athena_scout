# Backend - セットアップガイド

## 目次
- [概要](#概要)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [環境変数の設定](#環境変数の設定)
- [セットアップ手順](#セットアップ手順)
- [APIエンドポイント](#apiエンドポイント)
- [認証とセキュリティ](#認証とセキュリティ)
- [データベース操作](#データベース操作)
- [開発時のTips](#開発時のtips)

---

## 概要

Athena Scoutのバックエンドは、Express.jsで構築されたRESTful APIサーバーです。
JWT認証、PostgreSQLデータベース、Claude APIとの連携を提供します。

### 主な機能
- ユーザー認証・認可（JWT）
- ロールベースアクセス制御（admin, manager, user）
- Claude APIを使用したメッセージ生成
- テンプレート・出力ルール・職業適性の管理
- チーム管理機能
- 利用履歴・ログイン履歴の記録
- API使用量の追跡

---

## 技術スタック

| 技術 | バージョン | 用途 |
|-----|----------|------|
| Node.js | v18+ | ランタイム環境 |
| Express.js | v5.1.0 | Webフレームワーク |
| PostgreSQL | v14+ | データベース |
| pg | v8.16.3 | PostgreSQLクライアント |
| bcryptjs | v3.0.2 | パスワードハッシュ化 |
| jsonwebtoken | v9.0.2 | JWT認証 |
| @anthropic-ai/sdk | v0.20.0 | Claude API SDK |
| cors | v2.8.5 | CORS設定 |
| dotenv | v17.2.3 | 環境変数管理 |
| nodemon | v3.1.10 | 開発時の自動再起動 |

---

## ディレクトリ構成

```
backend/
├── server.js              # メインサーバーファイル
├── schema.sql             # 完全なデータベーススキーマ
├── migrations/            # データベースマイグレーション
│   ├── .gitkeep
│   ├── 002_add_teams.sql
│   └── 003_add_team_assignments.sql
├── package.json           # 依存関係とスクリプト
├── package-lock.json      # ロックファイル
├── .env                   # 環境変数（Git管理外）
├── .env.example           # 環境変数のサンプル
└── README.md             # このファイル
```

---

## 環境変数の設定

### .envファイルの作成

```bash
cd backend
touch .env
```

### 必須環境変数

`.env`ファイルに以下を記述:

```env
# データベース接続URL
DATABASE_URL=postgresql://athena_user:your_password@localhost:5432/athena_scout

# JWT秘密鍵（64文字以上のランダム文字列推奨）
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production

# Claude API キー
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5173

# サーバーポート
PORT=3001

# Node環境
NODE_ENV=development
```

### 環境変数の説明

| 変数名 | 説明 | 例 |
|-------|------|---|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | JWTトークン署名用の秘密鍵 | ランダムな長い文字列 |
| `CLAUDE_API_KEY` | Anthropic Claude APIキー | `sk-ant-api03-...` |
| `FRONTEND_URL` | フロントエンドのURL（CORS用） | `http://localhost:5173` |
| `PORT` | サーバーのポート番号 | `3001` |
| `NODE_ENV` | 実行環境 | `development` / `production` |

### セキュリティ上の注意

- `.env`ファイルは**絶対にGitにコミットしない**
- `JWT_SECRET`は本番環境では必ず変更する
- `CLAUDE_API_KEY`は外部に漏らさない
- 本番環境では強力なパスワードを使用

---

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd backend
npm install
```

### 2. データベースのセットアップ

#### データベースとユーザーの作成

```bash
# PostgreSQLに接続
psql postgres

# データベース作成
CREATE DATABASE athena_scout;

# ユーザー作成
CREATE USER athena_user WITH PASSWORD 'your_secure_password';

# 権限付与
GRANT ALL PRIVILEGES ON DATABASE athena_scout TO athena_user;

# データベースに接続
\c athena_scout

# スキーマ権限付与
GRANT ALL ON SCHEMA public TO athena_user;

\q
```

#### スキーマの適用

```bash
# メインスキーマを適用
psql -d athena_scout -f schema.sql

# マイグレーションを順番に実行
psql -d athena_scout -f migrations/002_add_teams.sql
psql -d athena_scout -f migrations/003_add_team_assignments.sql
```

#### テーブルの確認

```bash
psql -d athena_scout -c "\dt"
```

期待される出力:
```
              List of relations
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | activity_logs      | table | postgres
 public | api_usage_logs     | table | postgres
 public | generation_history | table | postgres
 public | job_types          | table | postgres
 public | login_logs         | table | postgres
 public | output_rules       | table | postgres
 public | team_members       | table | postgres
 public | team_output_rules  | table | postgres
 public | team_templates     | table | postgres
 public | teams              | table | postgres
 public | templates          | table | postgres
 public | user_output_rules  | table | postgres
 public | user_templates     | table | postgres
 public | users              | table | postgres
```

### 3. 初期データの投入（オプション）

#### 管理者ユーザーの作成

サーバー起動後、以下のAPIリクエストで管理者を作成:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

その後、データベースで権限を更新:

```bash
psql -d athena_scout -c "UPDATE users SET user_role = 'admin' WHERE username = 'admin';"
```

### 4. サーバーの起動

#### 開発モード（自動再起動）

```bash
npm run dev
```

期待される出力:
```
[nodemon] starting `node server.js`
FRONTEND_URL: http://localhost:5173
Allowed origins: [ 'http://localhost:5173', 'http://localhost:5173' ]
Server is running on port 3001
```

#### 本番モード

```bash
npm start
```

### 5. ヘルスチェック

```bash
curl http://localhost:3001/health
```

期待されるレスポンス:
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T12:34:56.789Z"
}
```

---

## APIエンドポイント

### 認証API

#### POST `/api/auth/register`
新規ユーザー登録（管理者のみ実行可能）

**リクエスト:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

#### POST `/api/auth/login`
ログイン

**リクエスト:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "user_role": "user",
    "user_status": "active"
  }
}
```

#### GET `/api/auth/me`
現在のユーザー情報取得（要認証）

**ヘッダー:**
```
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "id": 1,
  "username": "testuser",
  "user_role": "user",
  "user_status": "active"
}
```

### ユーザー管理API

#### GET `/api/users`
全ユーザー取得（admin/manager）

#### PUT `/api/users/:id`
ユーザー更新（admin/manager）

#### DELETE `/api/users/:id`
ユーザー削除（admin）

### テンプレート管理API

#### GET `/api/templates`
全テンプレート取得

#### POST `/api/templates`
テンプレート作成（admin/manager）

#### PUT `/api/templates/:id`
テンプレート更新（admin/manager）

#### DELETE `/api/templates/:id`
テンプレート削除（admin/manager）

### 出力ルール管理API

#### GET `/api/output-rules`
全出力ルール取得

#### POST `/api/output-rules`
出力ルール作成（admin/manager）

### 職業適性API

#### GET `/api/job-types`
全職業適性取得

#### POST `/api/job-types`
職業適性作成（admin/manager）

### メッセージ生成API

#### POST `/api/generate-message`
Claude APIを使用してメッセージ生成（要認証）

**リクエスト:**
```json
{
  "jobType": "エンジニア",
  "industry": "IT",
  "studentProfile": "プログラミング経験あり、Python得意",
  "companyRequirement": "バックエンド開発経験者歓迎",
  "offerTemplate": "当社の開発チームに参加しませんか？",
  "outputRuleId": 1,
  "templateName": "エンジニア向けテンプレート"
}
```

### チーム管理API

#### GET `/api/teams`
全チーム取得（admin/manager）

#### POST `/api/teams`
チーム作成（admin/manager）

### 使用状況API

#### GET `/api/admin/usage-summary`
使用状況サマリー（admin）

---

## 認証とセキュリティ

### 認証ミドルウェア

#### `authenticateToken`
JWTトークンを検証し、リクエストに`req.user`を追加

**使用例:**
```javascript
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

### ロールベースアクセス制御

#### ユーザーロール
- **admin**: 全機能アクセス可能
- **manager**: チーム管理、テンプレート管理可能
- **user**: 基本機能のみ

#### 実装例
```javascript
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '管理者権限が必要です' });
  }
  // 削除処理
});
```

### セキュリティ対策

1. **パスワードのハッシュ化**: bcryptで10ラウンドのソルト
2. **JWT有効期限**: 24時間
3. **CORS設定**: 許可されたオリジンのみ
4. **SQL インジェクション対策**: パラメータ化クエリ使用

---

## データベース操作

### 接続プール

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### クエリ実行例

```javascript
// SELECT
const result = await pool.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);

// INSERT
const result = await pool.query(
  'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
  [username, hashedPassword]
);

// UPDATE
await pool.query(
  'UPDATE users SET user_role = $1 WHERE id = $2',
  [role, userId]
);

// DELETE
await pool.query(
  'DELETE FROM users WHERE id = $1',
  [userId]
);
```

### マイグレーションの追加

新しいマイグレーションを作成する場合:

```bash
# ファイル作成
touch migrations/004_your_migration_name.sql

# SQLを記述
cat > migrations/004_your_migration_name.sql << 'EOF'
-- 新しいカラムを追加
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- インデックスを追加
CREATE INDEX idx_users_email ON users(email);
EOF

# 実行
psql -d athena_scout -f migrations/004_your_migration_name.sql
```

---

## 開発時のTips

### デバッグログの追加

```javascript
console.log('Debug:', { userId: req.user.userId, action: 'create_template' });
```

### エラーハンドリング

```javascript
app.post('/api/resource', async (req, res) => {
  try {
    // 処理
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '内部サーバーエラー' });
  }
});
```

### Postmanでのテスト

1. **環境変数の設定**:
   - `base_url`: `http://localhost:3001`
   - `token`: ログインレスポンスから取得

2. **ヘッダーの設定**:
   ```
   Content-Type: application/json
   Authorization: Bearer {{token}}
   ```

### ホットリロード

nodemonを使用しているため、ファイル変更時に自動で再起動されます。

### ログの確認

```bash
# サーバーログをリアルタイムで確認
npm run dev

# 特定のログをフィルタ
npm run dev | grep "Login"
```

### データベースのリセット

```bash
# データベースを削除して再作成
psql postgres -c "DROP DATABASE athena_scout;"
psql postgres -c "CREATE DATABASE athena_scout;"
psql -d athena_scout -f schema.sql
psql -d athena_scout -f migrations/002_add_teams.sql
psql -d athena_scout -f migrations/003_add_team_assignments.sql
```

---

## トラブルシューティング

### サーバーが起動しない

```bash
# ポートの使用状況を確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>
```

### データベース接続エラー

```bash
# PostgreSQLの起動確認
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# 接続テスト
psql $DATABASE_URL
```

### JWT検証エラー

- `JWT_SECRET`が正しいか確認
- トークンの有効期限を確認（24時間）
- ログアウトして再ログイン

---

## 本番環境への注意事項

### 環境変数の変更

- `NODE_ENV=production`
- 強力な`JWT_SECRET`を生成
- `DATABASE_URL`を本番用に変更

### セキュリティ強化

- HTTPSを使用
- レート制限の実装
- ログの監視

### パフォーマンス

- データベース接続プールの最適化
- インデックスの追加
- キャッシュの実装

---

## 参考資料

- [Express.js公式ドキュメント](https://expressjs.com/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [JWT公式サイト](https://jwt.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)
