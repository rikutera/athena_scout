# Athena Scout システム構造図

## 1. システムアーキテクチャ概要

### SPA（Single Page Application）について

このアプリケーションは**SPA**です。React Routerの`BrowserRouter`を使用しており、以下の特徴があります：

- **ページ遷移時にフルリロードが発生しない**
  - ブラウザのHistory APIを使用してURLを変更
  - JavaScriptでコンポーネントを動的に切り替え
- **URLが変わるのは正常**
  - `/`, `/job-types`, `/my-page` など、各ページにURLが割り当てられている
  - ブラウザの戻る/進むボタンが正常に動作
  - URLを直接入力してもそのページが表示される（サーバー側のフォールバック設定により）
- **サーバー側の設定**
  - バックエンドで`/api/*`以外のリクエストを`index.html`にリダイレクト
  - これにより、直接URLアクセス時もReact Routerが正しく動作

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー（ブラウザ）                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React + Vite                                           │  │
│  │ - React Router (SPA) - BrowserRouter                  │  │
│  │   → URL変更はHistory APIで実現                          │  │
│  │   → ページ遷移はフルリロードなし                        │  │
│  │ - Context API (認証状態管理)                            │  │
│  │ - Axios (API通信)                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Railway)                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Express.js + Node.js                                  │  │
│  │ - JWT認証                                             │  │
│  │ - CORS設定                                            │  │
│  │ - ロールベースアクセス制御                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Anthropic Claude API                                  │  │
│  │ (AIメッセージ生成)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                      │
│  - users                                                    │
│  - job_types                                                │
│  - output_rules                                             │
│  - templates                                                │
│  - generation_history                                       │
│  - login_logs                                               │
│  - activity_logs                                            │
│  - api_usage_logs                                           │
└─────────────────────────────────────────────────────────────┘
```

## 2. データベーススキーマ

### テーブル一覧とリレーション

```
users (ユーザー)
├─ id (PK)
├─ username (UNIQUE)
├─ password_hash
├─ user_status (active/inactive)
├─ user_role (admin/manager/user)
├─ created_at
└─ updated_at
    │
    ├─▶ login_logs (ログイン履歴)
    │   ├─ id (PK)
    │   ├─ user_id (FK → users.id)
    │   ├─ username
    │   ├─ login_at
    │   ├─ ip_address
    │   └─ user_agent
    │
    ├─▶ activity_logs (利用履歴)
    │   ├─ id (PK)
    │   ├─ user_id (FK → users.id)
    │   ├─ username
    │   ├─ action
    │   ├─ details (JSON)
    │   └─ created_at
    │
    └─▶ generation_history (生成履歴)
        ├─ id (PK)
        ├─ user_id (FK → users.id)
        ├─ username
        ├─ template_name
        ├─ job_type
        ├─ industry
        ├─ student_profile
        ├─ generated_comment
        └─ created_at

job_types (職業適性)
├─ id (PK)
├─ name
├─ definition
├─ created_at
└─ updated_at

output_rules (出力ルール)
├─ id (PK)
├─ rule_name
├─ rule_text
├─ description
├─ is_active (boolean)
├─ created_at
└─ updated_at

templates (テンプレート)
├─ id (PK)
├─ user_id (FK → users.id)
├─ template_name
├─ job_type
├─ industry
├─ company_requirement
├─ offer_template
├─ output_rule_id (FK → output_rules.id)
├─ created_at
└─ updated_at

api_usage_logs (API使用量ログ)
├─ id (PK)
├─ user_id (FK → users.id)
├─ request_type
├─ total_tokens
├─ total_cost
└─ created_at
```

## 3. フロントエンドコンポーネント構成

```
App.jsx (ルートコンポーネント)
│
├─ Navbar (ナビゲーションバー)
│   ├─ ロゴ
│   ├─ メニュー項目（ロール別表示）
│   └─ ユーザー名・ログアウト
│
├─ Routes (ルーティング)
│   ├─ / (RecruitmentToolForm)
│   │   └─ スカウトメッセージ生成フォーム
│   │       ├─ テンプレート選択
│   │       ├─ 職種・業種選択
│   │       ├─ 出力ルール選択
│   │       ├─ 学生プロフィール入力
│   │       └─ 生成結果表示
│   │
│   ├─ /login (LoginPage)
│   │   └─ ログインフォーム
│   │
│   ├─ /my-page (MyPages)
│   │   ├─ ProtectedRoute
│   │   ├─ ユーザー情報表示・編集
│   │   └─ 生成履歴一覧
│   │
│   ├─ /job-types (JobTypesPage)
│   │   ├─ AdminOrManagerRoute
│   │   ├─ 職業適性一覧
│   │   └─ CRUD操作
│   │
│   ├─ /output-rules (OutputRulesPage)
│   │   ├─ AdminOrManagerRoute
│   │   ├─ 出力ルール一覧
│   │   └─ CRUD操作
│   │
│   ├─ /users (UserManagementPage)
│   │   ├─ AdminRoute
│   │   ├─ ユーザー一覧
│   │   └─ CRUD操作
│   │
│   ├─ /admin/usage (AdminUsageDashboard)
│   │   ├─ AdminRoute
│   │   └─ API使用量統計
│   │
│   └─ /howto (HowToPage)
│       ├─ ProtectedRoute
│       └─ 使い方・注意事項
│
└─ SessionTimeoutWarning
    └─ セッションタイムアウト警告モーダル

共通コンポーネント
├─ ProtectedRoute (認証チェック)
├─ AdminRoute (管理者のみ)
├─ AdminOrManagerRoute (管理者・責任者のみ)
└─ UserContext (認証状態管理)
```

## 4. 認証・認可フロー

```
ログイン
│
├─ POST /api/auth/login
│   ├─ ユーザー名・パスワード検証
│   ├─ JWTトークン発行
│   └─ ログイン履歴記録
│
└─ トークン保存 (localStorage)
    │
    ├─ 全APIリクエストに Authorization ヘッダー付与
    │
    ├─ authenticateToken ミドルウェア
    │   └─ トークン検証
    │       │
    │       ├─ requireAdmin (管理者のみ)
    │       │   └─ user_role === 'admin'
    │       │
    │       └─ requireAdminOrManager (管理者・責任者)
    │           └─ user_role === 'admin' || 'manager'
    │
    └─ セッションタイムアウト管理
        └─ 24時間無操作で自動ログアウト
```

## 5. ロール別アクセス権限

| 機能 | user | manager | admin |
|------|------|---------|-------|
| スカウトメッセージ生成 | ✓ | ✓ | ✓ |
| マイページ | ✓ | ✓ | ✓ |
| 職業適性管理（閲覧） | ✓ | ✓ | ✓ |
| 職業適性管理（編集） | ✗ | ✓ | ✓ |
| 出力ルール管理（閲覧） | ✓ | ✓ | ✓ |
| 出力ルール管理（編集） | ✗ | ✓ | ✓ |
| ユーザー管理 | ✗ | ✗ | ✓ |
| API使用量統計 | ✗ | ✗ | ✓ |

## 6. APIエンドポイント一覧

### 認証系
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報取得
- `PUT /api/auth/me` - ユーザー情報更新

### ユーザー管理（管理者のみ）
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除

### 職業適性管理（管理者・責任者）
- `GET /api/job-types` - 職業適性一覧取得（全ユーザー閲覧可）
- `POST /api/job-types` - 職業適性作成
- `PUT /api/job-types/:id` - 職業適性更新
- `DELETE /api/job-types/:id` - 職業適性削除

### 出力ルール管理（管理者・責任者）
- `GET /api/output-rules` - 出力ルール一覧取得（全ユーザー閲覧可）
- `GET /api/output-rules/:id` - 出力ルール詳細取得
- `POST /api/output-rules` - 出力ルール作成
- `PUT /api/output-rules/:id` - 出力ルール更新
- `DELETE /api/output-rules/:id` - 出力ルール削除

### テンプレート管理
- `GET /api/templates` - テンプレート一覧取得
- `GET /api/templates/:id` - テンプレート詳細取得
- `POST /api/templates` - テンプレート作成
- `PUT /api/templates/:id` - テンプレート更新
- `DELETE /api/templates/:id` - テンプレート削除

### メッセージ生成
- `POST /api/generate` - スカウトメッセージ生成
  - Anthropic Claude APIを呼び出し
  - 生成履歴を保存
  - API使用量を記録

### 生成履歴
- `GET /api/my-generation-history` - 自分の生成履歴取得
- `DELETE /api/my-generation-history/:id` - 生成履歴削除
- `GET /api/admin/generation-history` - 管理者用：全ユーザーの生成履歴取得

### 統計・ログ
- `GET /api/admin/usage-stats` - API使用量統計（管理者のみ）

## 7. 主な技術スタック

### Frontend
- React 19.1.1
- React Router 7.9.4
- Vite 7.1.7
- Axios 1.12.2

### Backend
- Node.js
- Express 5.1.0
- PostgreSQL (pg 8.16.3)
- JWT (jsonwebtoken 9.0.2)
- bcryptjs 3.0.2
- Anthropic SDK (@anthropic-ai/sdk 0.20.0)

### デプロイ
- Frontend: Vercel
- Backend: Railway
- Database: PostgreSQL (Railway)

## 8. SPAの動作メカニズム

### クライアント側（React Router）

```javascript
// main.jsx
<BrowserRouter>  // History APIを使用
  <App />
</BrowserRouter>

// App.jsx
<Routes>
  <Route path="/" element={<RecruitmentToolForm />} />
  <Route path="/job-types" element={<JobTypesPage />} />
  <Route path="/my-page" element={<MyPages />} />
  // ...
</Routes>
```

**動作フロー：**
1. ユーザーがリンクをクリック → `Link`コンポーネントが`history.push()`を実行
2. URLが変更される（例: `/` → `/job-types`）
3. React RouterがURLを監視し、対応するコンポーネントをレンダリング
4. **ページ全体のリロードは発生しない**（JavaScriptでDOMを更新）

### サーバー側（SPAフォールバック）

```javascript
// backend/server.js
// 静的ファイル配信
app.use(express.static(frontendDistPath));

// SPAルーティング用フォールバック
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // APIルート以外はindex.htmlを返す
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});
```

**動作フロー：**
1. ユーザーが直接URLを入力（例: `https://example.com/job-types`）
2. サーバーは`/api/*`以外のリクエストに対して`index.html`を返す
3. ブラウザが`index.html`を読み込み、Reactアプリが起動
4. React RouterがURLを読み取り、対応するコンポーネントを表示

### URL構造

| URL | ページ | 説明 |
|-----|--------|------|
| `/` | スカウトメッセージ生成 | メインページ |
| `/login` | ログイン | 未認証時のみ表示 |
| `/my-page` | マイページ | 認証必須 |
| `/job-types` | 職業適性管理 | admin/manager のみ |
| `/output-rules` | 出力ルール管理 | admin/manager のみ |
| `/users` | ユーザー管理 | admin のみ |
| `/admin/usage` | API使用量統計 | admin のみ |
| `/howto` | 使い方・注意事項 | 認証必須 |
| `/terms` | 利用規約 | 認証必須 |

### ブラウザの動作

- **戻る/進むボタン**: React Routerが管理する履歴スタックを使用
- **ブックマーク**: 直接URLを保存可能（サーバー側フォールバックにより動作）
- **リロード**: サーバーから`index.html`を再取得し、React RouterがURLに応じたページを表示

## 9. セキュリティ対策

1. **認証**
   - JWTベースの認証
   - パスワードはbcryptでハッシュ化
   - トークン有効期限: 24時間

2. **認可**
   - ロールベースアクセス制御（RBAC）
   - ミドルウェアによるエンドポイント保護

3. **CORS**
   - 許可されたオリジンのみアクセス可能

4. **セッション管理**
   - 無操作時間による自動ログアウト
   - ログイン履歴の記録

5. **データ保護**
   - SQLインジェクション対策（パラメータ化クエリ）
   - XSS対策（Reactの自動エスケープ）

## 10. データフロー（メッセージ生成）

```
1. ユーザーがフォームに入力
   ↓
2. POST /api/generate
   ├─ 認証チェック
   ├─ 入力データ検証
   ├─ プロンプト構築
   │   ├─ 職業適性定義の取得
   │   ├─ 出力ルールの取得
   │   └─ プロンプト組み立て
   ↓
3. Anthropic Claude API呼び出し
   ├─ API使用量記録
   └─ レスポンス受信
   ↓
4. 生成履歴をDBに保存
   ↓
5. 生成結果をフロントエンドに返却
   ↓
6. フロントエンドで結果表示
```

---

**作成日**: 2025年
**バージョン**: 1.0

