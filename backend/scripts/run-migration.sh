#!/bin/bash

# データベースマイグレーション実行スクリプト

echo "チーム管理機能のマイグレーションを実行します..."

# マイグレーションファイルの存在確認
MIGRATION_FILE="backend/migrations/002_add_teams.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "エラー: マイグレーションファイルが見つかりません: $MIGRATION_FILE"
  exit 1
fi

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
  echo "エラー: DATABASE_URL 環境変数が設定されていません"
  echo "以下のコマンドで設定してください:"
  echo "  export DATABASE_URL='your_database_url'"
  exit 1
fi

# PostgreSQLに接続してマイグレーション実行
echo "マイグレーションを実行中..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "✓ マイグレーションが正常に完了しました"
else
  echo "✗ マイグレーションに失敗しました"
  exit 1
fi
