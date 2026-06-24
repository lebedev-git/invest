#!/bin/bash
# Деплой X7 Invest на сервере: подтянуть код, собрать фронт, обновить статику,
# применить миграции и перезапустить PocketBase.
#
# Использование (на сервере):  cd /root/app && ./deploy.sh
#
# Предполагается структура:
#   /root/app        — git-клон репозитория (этот скрипт)
#   /root/pb         — рабочая папка PocketBase (бинарник, pb_data, pb_public)
set -euo pipefail

APP_DIR=/root/app
PB_DIR=/root/pb

echo "==> 1/5 git pull"
cd "$APP_DIR"
git fetch --all
git reset --hard origin/main   # прод повторяет main 1:1, без локальных правок

echo "==> 2/5 npm install"
npm ci --no-audit --no-fund

echo "==> 3/5 build (VITE_PB_URL берётся из .env.production)"
npm run build

echo "==> 4/5 publish static -> $PB_DIR/pb_public"
rm -rf "$PB_DIR/pb_public"
mkdir -p "$PB_DIR/pb_public"
cp -r dist/* "$PB_DIR/pb_public/"

echo "==> sync migrations -> $PB_DIR/pb_migrations"
mkdir -p "$PB_DIR/pb_migrations"
cp -f pb/pb_migrations/*.js "$PB_DIR/pb_migrations/" 2>/dev/null || true

echo "==> 5/5 restart pocketbase (applies new migrations)"
systemctl restart pocketbase
sleep 3
systemctl is-active pocketbase && echo "✅ deploy done" || (echo "❌ pocketbase not active"; tail -20 "$PB_DIR/std.log"; exit 1)
