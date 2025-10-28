import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(express.json());

// ================= CORS 設定 =================
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Preflight対応
app.options('*', cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// ============================================

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ========== 認証ミドルウェア ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'トークンが提供されていません' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効または期限切れです' });
    }
    req.user = user;
    next();
  });
};

// 以下、既存の認証 API、ユーザー管理、テンプレート管理、コメント生成などのルートはそのまま保持
// ... （省略）

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
