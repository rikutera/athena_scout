# プロンプト管理ディレクトリ

このディレクトリには、Claude APIを利用する各機能のプロンプト生成ロジックが格納されています。

## 現在のプロンプト

### scoutMessagePrompt.js
スカウトメッセージ生成用のプロンプト生成ロジック。

**機能**: 学生のプロフィール情報から、企業のオファー文テンプレートに沿った評価コメントを生成します。

**エクスポート関数**: `buildScoutMessagePrompt(jobType, industry, companyRequirement, offerTemplate, studentProfile, output_rule_id)`

## 新しいプロンプトの追加方法

1. このディレクトリに新しい `.js` ファイルを作成します（例: `newFeaturePrompt.js`）

2. プロンプト生成関数をエクスポートします:

```javascript
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 新機能用プロンプト生成
 * @param {Object} params - パラメータ
 * @returns {Promise<{systemPrompt: string, userMessage: string}>}
 */
export async function buildNewFeaturePrompt(params) {
  try {
    // データベースから必要な情報を取得
    // プロンプトを構築

    const systemPrompt = `...`;
    const userMessage = `...`;

    return { systemPrompt, userMessage };
  } catch (error) {
    console.error('Error building new feature prompt:', error);
    throw error;
  }
}
```

3. `server.js` で新しいプロンプト関数をインポートします:

```javascript
import { buildNewFeaturePrompt } from './prompts/newFeaturePrompt.js';
```

4. APIエンドポイントで使用します:

```javascript
const { systemPrompt, userMessage } = await buildNewFeaturePrompt(params);
```

## 設計ガイドライン

- **単一責任**: 各プロンプトファイルは1つの機能に特化させる
- **データベース接続**: 必要に応じてPoolインスタンスを作成
- **エラーハンドリング**: try-catchでエラーを適切に処理
- **ドキュメント**: JSDocコメントで関数の仕様を明記
- **命名規則**: `build{機能名}Prompt` の形式で関数名を付ける
