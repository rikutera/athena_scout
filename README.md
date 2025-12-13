# Athena Scout - 開発環境セットアップガイド

## 目次
- [プロジェクト概要](#プロジェクト概要)
- [前提条件](#前提条件)
- [環境構築手順](#環境構築手順)
- [ローカル開発サーバーの起動](#ローカル開発サーバーの起動)
- [プロジェクト構成](#プロジェクト構成)
- [開発ワークフロー](#開発ワークフロー)
- [トラブルシューティング](#トラブルシューティング)
- [参考資料](#参考資料)

---

## プロジェクト概要

**Athena Scout**は、リクルーティング業務を支援するAI駆動のメッセージ生成ツールです。

### 主な機能
- AI（Claude API）を活用したパーソナライズメッセージ生成
- 職業適性・テンプレート・出力ルールの管理
- チーム管理とユーザー権限制御
- 使用状況ダッシュボード
- セッション管理とタイムアウト機能

### 技術スタック
- **フロントエンド**: React 19 + Vite + React Router
- **バックエンド**: Node.js + Express.js
- **データベース**: PostgreSQL
- **認証**: JWT (JSON Web Token)
- **AI API**: Anthropic Claude API
- **デプロイ**: Vercel (Frontend) + Railway (Backend)

---

## 前提条件

開発を開始する前に、以下のソフトウェアをインストールしてください。

### 必須ソフトウェア

| ソフトウェア | 推奨バージョン | 確認コマンド |
|------------|--------------|------------|
| **Node.js** | v18.0.0 以上 | `node --version` |
| **npm** | v8.0.0 以上 | `npm --version` |
| **PostgreSQL** | v14.0 以上 | `psql --version` |
| **Git** | 最新版 | `git --version` |

### インストール手順

#### macOS (Homebrew使用)
```bash
# Homebrewのインストール（未インストールの場合）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.jsとnpmのインストール
brew install node

# PostgreSQLのインストール
brew install postgresql@14

# PostgreSQLの起動
brew services start postgresql@14
```

#### Windows
1. [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロード・インストール
2. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード・インストール

#### Linux (Ubuntu/Debian)
```bash
# Node.jsとnpmのインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQLのインストール
sudo apt-get install postgresql-14 postgresql-contrib
sudo systemctl start postgresql
```

---

## 環境構築手順

### 1. リポジトリのクローン

```bash
# リポジトリをクローン
git clone <repository-url>
cd storks-webtool

# ブランチ確認
git branch
git status
```

### 2. データベースのセットアップ

#### 2.1 PostgreSQLの起動確認
```bash
# PostgreSQLが起動しているか確認
psql --version

# macOSの場合
brew services list

# Linux/WSLの場合
sudo systemctl status postgresql
```

#### 2.2 データベースとユーザーの作成
```bash
# PostgreSQLに接続
psql postgres

# 以下をpsqlプロンプトで実行
CREATE DATABASE athena_scout;
CREATE USER athena_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE athena_scout TO athena_user;

# データベースに接続
\c athena_scout

# スキーマ権限付与
GRANT ALL ON SCHEMA public TO athena_user;

# 終了
\q
```

#### 2.3 スキーマとテーブルの作成
```bash
# プロジェクトルートで実行
psql -d athena_scout -f backend/schema.sql

# マイグレーションの実行
psql -d athena_scout -f backend/migrations/002_add_teams.sql
psql -d athena_scout -f backend/migrations/003_add_team_assignments.sql
```

#### 2.4 初期管理者ユーザーの作成
```bash
# PostgreSQLに接続
psql -d athena_scout

# 管理者ユーザーを作成（パスワードは後でbcryptでハッシュ化されます）
# まず、backend サーバーを起動後に、/api/auth/register エンドポイントを使用するか、
# 直接SQLでハッシュ化したパスワードを挿入します

# ここでは一時的な方法として、次のSQLを実行（実際は登録APIを使用推奨）
INSERT INTO users (username, password_hash, user_role, user_status)
VALUES ('admin', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'admin', 'active');
# 注意: 上記のpassword_hashは例です。実際はbcryptでハッシュ化したパスワードを使用してください

\q
```

**推奨**: サーバー起動後、Postmanなどで `/api/auth/register` エンドポイントを使用して管理者を作成してください。

### 3. バックエンドの環境設定

#### 3.1 環境変数ファイルの作成
```bash
cd backend

# .envファイルを作成
touch .env
```

#### 3.2 .envファイルの編集
`backend/.env` に以下を記述:

```env
# データベース接続URL
DATABASE_URL=postgresql://athena_user:your_secure_password@localhost:5432/athena_scout

# JWT秘密鍵（ランダムな文字列を設定）
JWT_SECRET=your-very-secure-random-secret-key-here-change-this-in-production

# Claude API キー（Anthropicから取得）
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5173

# サーバーポート（デフォルト: 3001）
PORT=3001

# Node環境
NODE_ENV=development
```

**重要**:
- `JWT_SECRET`は必ず変更してください（本番環境では長く複雑な文字列を使用）
- `CLAUDE_API_KEY`はAnthropic公式サイトから取得してください: https://console.anthropic.com/

#### 3.3 依存関係のインストール
```bash
# backendディレクトリで実行
npm install
```

### 4. フロントエンドの環境設定

#### 4.1 環境変数ファイルの作成
```bash
cd ../frontend

# .envファイルを作成
touch .env
```

#### 4.2 .envファイルの編集
`frontend/.env` に以下を記述:

```env
# バックエンドAPIのURL
VITE_API_URL=http://localhost:3001
```

#### 4.3 依存関係のインストール
```bash
# frontendディレクトリで実行
npm install
```

---

## ローカル開発サーバーの起動

### 方法1: 2つのターミナルで起動（推奨）

#### ターミナル1: バックエンドサーバー
```bash
cd backend
npm run dev
```

**期待される出力:**
```
[nodemon] starting `node server.js`
FRONTEND_URL: http://localhost:5173
Allowed origins: [ 'http://localhost:5173', 'http://localhost:5173' ]
Server is running on port 3001
```

#### ターミナル2: フロントエンドサーバー
```bash
cd frontend
npm run dev
```

**期待される出力:**
```
VITE v7.1.7  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 方法2: 本番モードでの起動

#### バックエンド（本番モード）
```bash
cd backend
npm start
```

#### フロントエンド（プレビュー）
```bash
cd frontend
npm run build
npm run preview
```

### アクセス方法

ブラウザで以下にアクセス:
- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

---

## プロジェクト構成

```
storks-webtool/
├── backend/                      # バックエンドアプリケーション
│   ├── server.js                 # Expressサーバーのエントリーポイント
│   ├── schema.sql                # データベーススキーマ定義
│   ├── migrations/               # データベースマイグレーション
│   │   ├── 002_add_teams.sql
│   │   └── 003_add_team_assignments.sql
│   ├── package.json              # バックエンドの依存関係
│   └── .env                      # 環境変数（Git管理外）
│
├── frontend/                     # フロントエンドアプリケーション
│   ├── src/
│   │   ├── App.jsx               # メインアプリケーションコンポーネント
│   │   ├── main.jsx              # エントリーポイント
│   │   ├── components/           # 再利用可能なコンポーネント
│   │   │   ├── RecruitmentToolForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   └── SessionTimeoutWarning.jsx
│   │   ├── pages/                # ページコンポーネント
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MyPages.jsx
│   │   │   ├── JobTypesPage.jsx
│   │   │   ├── TemplatesPage.jsx
│   │   │   ├── OutputRulesPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── UserManagementPage.jsx
│   │   │   ├── AdminUsageDashboard.jsx
│   │   │   ├── HowToPage.jsx
│   │   │   └── TermsPage.jsx
│   │   ├── contexts/             # Reactコンテキスト
│   │   │   └── UserContext.jsx   # ユーザー認証状態管理
│   │   ├── hooks/                # カスタムフック
│   │   │   └── useSessionTimeout.js
│   │   ├── utils/                # ユーティリティ
│   │   │   └── apiClient.js      # Axios設定
│   │   └── styles/               # CSSファイル
│   ├── package.json              # フロントエンドの依存関係
│   ├── vite.config.js            # Vite設定
│   └── .env                      # 環境変数（Git管理外）
│
├── ARCHITECTURE.md               # システムアーキテクチャドキュメント
├── database-schema.json          # データベーススキーマのJSON形式
└── README.md                     # このファイル
```

### 主要なディレクトリの説明

- **backend/**: Express.jsベースのRESTful APIサーバー
- **frontend/**: React + Viteで構築されたSPAフロントエンド
- **backend/migrations/**: データベーススキーマの変更履歴

---

## 開発ワークフロー

### 1. ブランチ戦略

```bash
# 最新のmainブランチを取得
git checkout main
git pull origin main

# 新しい機能ブランチを作成
git checkout -b feature/your-feature-name

# 作業後、変更をコミット
git add .
git commit -m "feat: add new feature description"

# リモートにプッシュ
git push origin feature/your-feature-name
```

### 2. コミットメッセージ規約

推奨されるコミットメッセージのプレフィックス:
- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメントのみの変更
- `style:` - コードの動作に影響しない変更（フォーマット等）
- `refactor:` - リファクタリング
- `test:` - テストの追加・修正
- `chore:` - ビルドプロセスやツールの変更

### 3. コードレビュープロセス

1. Pull Requestを作成
2. レビュアーを指定
3. レビューのフィードバックに対応
4. 承認後、mainブランチにマージ

### 4. データベース変更の手順

新しいテーブルやカラムを追加する場合:

```bash
# 1. マイグレーションファイルを作成
cd backend/migrations
touch 004_your_migration_name.sql

# 2. SQLを記述
# 3. ローカルで実行してテスト
psql -d athena_scout -f backend/migrations/004_your_migration_name.sql

# 4. 本番環境では慎重に実行（リリース時）
```

### 5. APIエンドポイントの追加

新しいエンドポイントを追加する場合:

1. `backend/server.js` に新しいルートを追加
2. 認証が必要な場合は `authenticateToken` ミドルウェアを使用
3. ロギングが必要な場合は `logActivity()` ミドルウェアを追加
4. フロントエンドで対応するAPIクライアント関数を作成

---

## トラブルシューティング

### 1. ポートが既に使用されている

**エラー**: `Error: listen EADDRINUSE: address already in use :::3001`

**解決策**:
```bash
# 使用中のプロセスを確認
lsof -i :3001  # バックエンド
lsof -i :5173  # フロントエンド

# プロセスを終了
kill -9 <PID>

# または、.envファイルでポートを変更
PORT=3002
```

### 2. データベース接続エラー

**エラー**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**解決策**:
```bash
# PostgreSQLが起動しているか確認
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# PostgreSQLを起動
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux

# 接続URLが正しいか確認
psql postgresql://athena_user:your_secure_password@localhost:5432/athena_scout
```

### 3. CORSエラー

**エラー**: `Access to XMLHttpRequest at 'http://localhost:3001/api/...' has been blocked by CORS policy`

**解決策**:
1. `backend/.env` の `FRONTEND_URL` が正しいか確認
2. バックエンドサーバーを再起動
3. ブラウザのキャッシュをクリア

### 4. 依存関係のエラー

**エラー**: `Cannot find module '...'`

**解決策**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# または、npmキャッシュをクリア
npm cache clean --force
npm install
```

### 5. 認証エラー

**エラー**: `トークンが無効または期限切れです`

**解決策**:
1. ブラウザのlocalStorageをクリア（開発者ツール > Application > Local Storage）
2. ログアウトして再ログイン
3. JWTの有効期限を確認（`backend/server.js` の `expiresIn: '24h'`）

### 6. Claude APIエラー

**エラー**: `Error: Invalid API key`

**解決策**:
1. `backend/.env` の `CLAUDE_API_KEY` が正しいか確認
2. Anthropic Consoleでキーが有効か確認: https://console.anthropic.com/
3. バックエンドサーバーを再起動

### 7. マイグレーションエラー

**エラー**: テーブルやカラムが存在しない

**解決策**:
```bash
# すべてのマイグレーションを順番に実行
psql -d athena_scout -f backend/schema.sql
psql -d athena_scout -f backend/migrations/002_add_teams.sql
psql -d athena_scout -f backend/migrations/003_add_team_assignments.sql

# テーブルが存在するか確認
psql -d athena_scout -c "\dt"
```

---

## 参考資料

### 公式ドキュメント
- [React公式ドキュメント](https://react.dev/)
- [Vite公式ドキュメント](https://vite.dev/)
- [Express.js公式ドキュメント](https://expressjs.com/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Anthropic Claude API](https://docs.anthropic.com/)

### プロジェクト内ドキュメント
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システムアーキテクチャの詳細
- [database-schema.json](./database-schema.json) - データベーススキーマの全体像

### 開発ツール
- [VS Code](https://code.visualstudio.com/) - 推奨エディタ
- [Postman](https://www.postman.com/) - APIテストツール
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUIツール

### 推奨VS Code拡張機能
- ESLint
- Prettier - Code formatter
- PostgreSQL
- GitLens
- Thunder Client（Postmanの代替）

---

## よくある質問（FAQ）

### Q1: 初回ログインのユーザー名とパスワードは？
A: データベースセットアップ時に作成した管理者ユーザー、またはPostmanなどで `/api/auth/register` エンドポイントを使用して作成してください。

### Q2: セッションタイムアウトの設定を変更したい
A: `frontend/src/hooks/useSessionTimeout.js` の以下の定数を変更:
```javascript
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30分（ミリ秒）
const WARNING_DURATION = 5 * 60 * 1000; // 5分前に警告
const ABSOLUTE_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間
```

### Q3: 本番環境へのデプロイ方法は？
A:
- **フロントエンド**: Vercelにデプロイ（自動CI/CD）
- **バックエンド**: Railwayにデプロイ
- 詳細は `ARCHITECTURE.md` を参照

### Q4: データベースのバックアップ方法は？
A:
```bash
# ダンプを作成
pg_dump -U athena_user -d athena_scout > backup_$(date +%Y%m%d).sql

# リストア
psql -U athena_user -d athena_scout < backup_20250101.sql
```

---

## サポート

問題が発生した場合は、以下に連絡してください:
- **担当者**: 情報システム部
- **Issueトラッカー**: GitHubリポジトリのIssuesセクション

---

## ライセンス

© 2025 株式会社リクテラ - 社内専用ツール
