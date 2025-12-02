# Frontend - セットアップガイド

## 目次
- [概要](#概要)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [環境変数の設定](#環境変数の設定)
- [セットアップ手順](#セットアップ手順)
- [開発ガイド](#開発ガイド)
- [コンポーネント設計](#コンポーネント設計)
- [ルーティング](#ルーティング)
- [状態管理](#状態管理)
- [スタイリング](#スタイリング)
- [開発時のTips](#開発時のtips)

---

## 概要

Athena Scoutのフロントエンドは、React 19とViteを使用したモダンなSPA（Single Page Application）です。
React RouterによるクライアントサイドルーティングとContext APIによる状態管理を採用しています。

### 主な機能
- JWT認証ベースのログイン機能
- セッション管理とタイムアウト警告
- ロールベースのUI表示制御
- レスポンシブデザイン
- リアルタイムフォームバリデーション

---

## 技術スタック

| 技術 | バージョン | 用途 |
|-----|----------|------|
| React | v19.1.1 | UIライブラリ |
| Vite | v7.1.7 | ビルドツール |
| React Router | v7.9.4 | クライアントサイドルーティング |
| Axios | v1.12.2 | HTTP通信 |
| CSS3 | - | スタイリング |

---

## ディレクトリ構成

```
frontend/
├── src/
│   ├── main.jsx                    # エントリーポイント
│   ├── App.jsx                     # ルートコンポーネント
│   │
│   ├── components/                 # 再利用可能なコンポーネント
│   │   ├── RecruitmentToolForm.jsx # メッセージ生成フォーム
│   │   ├── ProtectedRoute.jsx      # 認証済みユーザー用ルート
│   │   ├── AdminRoute.jsx          # 管理者専用ルート
│   │   ├── AdminOrManagerRoute.jsx # 管理者・責任者専用ルート
│   │   └── SessionTimeoutWarning.jsx # セッションタイムアウト警告
│   │
│   ├── pages/                      # ページコンポーネント
│   │   ├── LoginPage.jsx           # ログインページ
│   │   ├── MyPages.jsx             # マイページ
│   │   ├── JobTypesPage.jsx        # 職業適性管理
│   │   ├── TemplatesPage.jsx       # テンプレート管理
│   │   ├── OutputRulesPage.jsx     # 出力ルール管理
│   │   ├── TeamsPage.jsx           # チーム管理
│   │   ├── UserManagementPage.jsx  # ユーザー管理
│   │   ├── AdminUsageDashboard.jsx # 使用状況ダッシュボード
│   │   ├── HowToPage.jsx           # 利用方法・注意事項
│   │   └── TermsPage.jsx           # 利用規約
│   │
│   ├── contexts/                   # Reactコンテキスト
│   │   └── UserContext.jsx         # ユーザー認証状態管理
│   │
│   ├── hooks/                      # カスタムフック
│   │   └── useSessionTimeout.js    # セッションタイムアウト管理
│   │
│   ├── utils/                      # ユーティリティ
│   │   └── apiClient.js            # Axios設定とインターセプター
│   │
│   ├── styles/                     # CSSファイル
│   │   └── LoginPage.css           # 各ページのスタイル
│   │
│   ├── App.css                     # グローバルスタイル
│   └── index.css                   # ベーススタイル
│
├── public/                         # 静的ファイル
│   └── logo.png                    # ロゴ画像
│
├── index.html                      # HTMLテンプレート
├── vite.config.js                  # Vite設定
├── package.json                    # 依存関係とスクリプト
├── .env                            # 環境変数（Git管理外）
└── README.md                       # このファイル
```

---

## 環境変数の設定

### .envファイルの作成

```bash
cd frontend
touch .env
```

### 必須環境変数

`.env`ファイルに以下を記述:

```env
# バックエンドAPIのベースURL
VITE_API_URL=http://localhost:3001
```

### 環境変数の説明

| 変数名 | 説明 | 開発環境 | 本番環境 |
|-------|------|---------|---------|
| `VITE_API_URL` | バックエンドAPIのURL | `http://localhost:3001` | `https://api.example.com` |

**注意**: Viteでは環境変数名に`VITE_`プレフィックスが必要です。

---

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

期待される出力:
```
VITE v7.1.7  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**注意**: `vite.config.js`では`server.port: 3000`と設定されていますが、実際にはViteのデフォルトポート5173が使用されます。

### 3. ビルド

```bash
npm run build
```

ビルド成果物は`dist/`ディレクトリに出力されます。

### 4. プレビュー

ビルドした本番版をローカルで確認:

```bash
npm run preview
```

---

## 開発ガイド

### コンポーネントの追加

新しいページコンポーネントを追加する場合:

1. **コンポーネントファイルを作成**
```bash
touch src/pages/NewPage.jsx
```

2. **コンポーネントを実装**
```jsx
import React from 'react';

export default function NewPage() {
  return (
    <div>
      <h1>新しいページ</h1>
    </div>
  );
}
```

3. **App.jsxにルートを追加**
```jsx
import NewPage from './pages/NewPage';

// Routesの中に追加
<Route path="/new-page" element={<NewPage />} />
```

4. **ナビゲーションに追加**
```jsx
<li className="nav-item">
  <Link to="/new-page" className="nav-link">
    新しいページ
  </Link>
</li>
```

### API通信の実装

`apiClient.js`を使用してAPI通信を行います。

**GET リクエスト:**
```javascript
import apiClient from '../utils/apiClient';

const fetchData = async () => {
  try {
    const response = await apiClient.get('/api/templates');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**POST リクエスト:**
```javascript
const createData = async () => {
  try {
    const response = await apiClient.post('/api/templates', {
      template_name: 'テンプレート名',
      job_type: '職種'
    });
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**自動的に行われること:**
- JWTトークンが自動的にヘッダーに付与
- 最終アクティビティ時刻が更新
- 401/403エラー時に自動的にログアウト

---

## コンポーネント設計

### 制御されたコンポーネント（Controlled Components）

フォーム入力は常にReactのstateで管理します。

```jsx
const [username, setUsername] = useState('');

<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

### プロテクトルート

認証が必要なページには`ProtectedRoute`を使用:

```jsx
<Route
  path="/protected"
  element={<ProtectedRoute element={<MyPage />} isAuthenticated={isAuthenticated} />}
/>
```

権限が必要なページには`AdminRoute`または`AdminOrManagerRoute`:

```jsx
<Route
  path="/admin"
  element={<AdminRoute element={<AdminPage />} />}
/>
```

### カスタムフック

`useSessionTimeout`フックでセッション管理:

```jsx
const { showWarning, timeLeft, extendSession, logout } = useSessionTimeout(onLogout);
```

---

## ルーティング

### ルート一覧

| パス | コンポーネント | 権限 | 説明 |
|------|--------------|------|------|
| `/login` | LoginPage | 公開 | ログインページ |
| `/` | RecruitmentToolForm | 認証済み | メッセージ生成 |
| `/my-page` | MyPages | 認証済み | マイページ |
| `/howto` | HowToPage | 認証済み | 利用方法 |
| `/terms` | TermsPage | 認証済み | 利用規約 |
| `/job-types` | JobTypesPage | admin/manager | 職業適性管理 |
| `/templates` | TemplatesPage | admin/manager | テンプレート管理 |
| `/output-rules` | OutputRulesPage | admin/manager | 出力ルール管理 |
| `/teams` | TeamsPage | admin/manager | チーム管理 |
| `/users` | UserManagementPage | admin/manager | ユーザー管理 |
| `/admin/usage` | AdminUsageDashboard | admin | 使用状況 |

### ナビゲーション

プログラムでページ遷移する場合:

```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/my-page');
```

---

## 状態管理

### UserContext

ユーザー認証状態はContext APIで管理されています。

**プロバイダー:**
```jsx
// main.jsx
<UserProvider>
  <App />
</UserProvider>
```

**コンシューマー:**
```jsx
import { useUser } from './contexts/UserContext';

const { user, isAuthenticated, login, logout, updateUser } = useUser();
```

**提供される値:**
- `user`: ユーザー情報オブジェクト
- `isAuthenticated`: 認証状態（boolean）
- `login(userData)`: ログイン処理
- `logout()`: ログアウト処理
- `updateUser(userData)`: ユーザー情報更新

### LocalStorage

以下の情報がlocalStorageに保存されます:

| キー | 内容 |
|-----|------|
| `authToken` | JWTトークン |
| `user` | ユーザー情報（JSON） |
| `loginTime` | ログイン時刻（timestamp） |
| `lastActivity` | 最終アクティビティ時刻（timestamp） |

---

## スタイリング

### CSS構成

- **index.css**: リセットCSS、ベーススタイル
- **App.css**: グローバルスタイル、ナビゲーション、フッター
- **各ページ.css**: ページ固有のスタイル

### クラス命名規則

BEM（Block Element Modifier）風の命名:

```css
.block {}
.block__element {}
.block--modifier {}
```

**例:**
```css
.login-page {}
.login-page__container {}
.login-page__form {}
.btn--primary {}
.btn--disabled {}
```

### レスポンシブデザイン

メディアクエリを使用してレスポンシブ対応:

```css
/* デスクトップ */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
}

/* タブレット */
@media (max-width: 768px) {
  .nav-menu {
    flex-direction: column;
  }
}

/* モバイル */
@media (max-width: 480px) {
  .card {
    padding: 1rem;
  }
}
```

---

## 開発時のTips

### Hot Module Replacement (HMR)

Viteは自動的にHMRを有効にします。ファイルを保存すると即座にブラウザに反映されます。

### React DevTools

ブラウザ拡張機能をインストールしてコンポーネントツリーを確認:
- [Chrome版](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox版](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### デバッグ

#### コンソールログ
```jsx
console.log('User:', user);
console.log('State:', { username, password });
```

#### React DevToolsでのステート確認
1. ブラウザのReact DevToolsを開く
2. コンポーネントツリーから対象コンポーネントを選択
3. 右パネルでstate/propsを確認

### エラーハンドリング

```jsx
const [error, setError] = useState('');

try {
  await apiClient.post('/api/login', { username, password });
} catch (err) {
  setError(err.response?.data?.error || 'エラーが発生しました');
}

// 表示
{error && <div className="error-message">{error}</div>}
```

### ローディング状態

```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await apiClient.post('/api/resource', data);
  } finally {
    setLoading(false);
  }
};

// 表示
<button disabled={loading}>
  {loading ? '送信中...' : '送信'}
</button>
```

### 環境変数の確認

```jsx
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Mode:', import.meta.env.MODE);
```

---

## ビルドとデプロイ

### ローカルビルド

```bash
npm run build
```

成果物は`dist/`ディレクトリに出力されます。

### ビルド確認

```bash
npm run preview
```

### Vercelへのデプロイ

プロジェクトは自動的にVercelにデプロイされます。

**環境変数の設定（Vercel）:**
1. Vercelダッシュボードを開く
2. Settings > Environment Variables
3. `VITE_API_URL`を本番用URLに設定

---

## トラブルシューティング

### ポート3000/5173が使用中

```bash
# 使用中のプロセスを確認
lsof -i :5173

# プロセスを終了
kill -9 <PID>
```

### API通信エラー

1. バックエンドが起動しているか確認
2. `VITE_API_URL`が正しいか確認
3. CORSエラーの場合、バックエンドの`FRONTEND_URL`を確認

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf node_modules dist
npm install
npm run build
```

### 認証エラー

1. localStorageをクリア（開発者ツール > Application > Local Storage）
2. ログアウトして再ログイン
3. バックエンドのJWT_SECRETが変更されていないか確認

---

## パフォーマンス最適化

### コード分割

React Routerの`lazy`を使用して動的インポート:

```jsx
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./pages/AdminPage'));

<Route
  path="/admin"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPage />
    </Suspense>
  }
/>
```

### メモ化

頻繁に再レンダリングされるコンポーネントには`React.memo`:

```jsx
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### useMemo / useCallback

```jsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

---

## コーディング規約

### ファイル命名
- コンポーネント: PascalCase（例: `UserProfile.jsx`）
- ユーティリティ: camelCase（例: `apiClient.js`）
- スタイル: kebab-case（例: `user-profile.css`）

### コンポーネント構造
```jsx
// 1. import文
import React, { useState, useEffect } from 'react';

// 2. コンポーネント定義
export default function ComponentName({ prop1, prop2 }) {
  // 3. state定義
  const [state, setState] = useState(initial);

  // 4. 副作用
  useEffect(() => {
    // 処理
  }, []);

  // 5. ハンドラー関数
  const handleClick = () => {
    // 処理
  };

  // 6. JSX
  return (
    <div>
      {/* コンテンツ */}
    </div>
  );
}
```

---

## 参考資料

### 公式ドキュメント
- [React公式ドキュメント](https://react.dev/)
- [Vite公式ドキュメント](https://vite.dev/)
- [React Router公式ドキュメント](https://reactrouter.com/)
- [Axios公式ドキュメント](https://axios-http.com/)

### プロジェクト内ドキュメント
- [プロジェクトルートのREADME](../README.md)
- [バックエンドのREADME](../backend/README.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)

### 推奨学習リソース
- [React チュートリアル](https://react.dev/learn)
- [JavaScript.info](https://javascript.info/)
- [MDN Web Docs](https://developer.mozilla.org/)
