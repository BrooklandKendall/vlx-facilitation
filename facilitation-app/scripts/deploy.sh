#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing dependencies"
npm ci

echo "==> Linting"
npm run lint

echo "==> Building production bundle"
npm run build

echo "==> Deploying to Firebase Hosting + Firestore rules"
firebase deploy

echo ""
echo "Deploy complete."
firebase hosting:channel:list 2>/dev/null || true
echo "Live at: https://vivalynx-tasks.web.app"
