#!/bin/bash

echo "=== Railway マイグレーション実行 ==="
echo ""
echo "このスクリプトはRailwayのデータベースにマイグレーションを適用します。"
echo ""

# Railway CLIがインストールされているか確認
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLIがインストールされていません"
    echo "以下のコマンドでインストールしてください："
    echo "  npm install -g @railway/cli"
    exit 1
fi

# ログイン確認
echo "1. Railway CLIの認証状態を確認中..."
if ! railway whoami &> /dev/null; then
    echo "❌ Railway CLIにログインしていません"
    echo "以下のコマンドでログインしてください："
    echo "  railway login"
    exit 1
fi

echo "✓ ログイン済み"
echo ""

# プロジェクトリンク確認
echo "2. プロジェクトのリンクを確認中..."
if ! railway status &> /dev/null; then
    echo "❌ プロジェクトにリンクされていません"
    echo "以下のコマンドでリンクしてください："
    echo "  railway link"
    exit 1
fi

echo "✓ プロジェクトにリンク済み"
echo ""

# マイグレーション実行
echo "3. マイグレーションを実行中..."
railway run bash -c 'psql $DATABASE_URL -f backend/migrations/002_add_teams.sql'

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ マイグレーションが正常に完了しました！"
else
    echo ""
    echo "❌ マイグレーションに失敗しました"
    exit 1
fi
