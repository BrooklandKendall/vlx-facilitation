#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="vivalynx-tasks"

cd "$(dirname "$0")/.."

echo "==> Selecting Firebase project $PROJECT_ID"
firebase use "$PROJECT_ID"

echo "==> Wiping Firestore database collections"
firebase firestore:delete --all-collections --force

echo "==> Seeding sessions/default and sessions/default/features"
FIREBASE_PROJECT_ID="$PROJECT_ID" npm run seed:data

echo ""
echo "Seed complete. Firestore data has been fully replaced from seed."
