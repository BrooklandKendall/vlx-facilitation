#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="vivalynx-tasks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/_backups"

cd "$SCRIPT_DIR/.."

echo "==> Selecting Firebase project $PROJECT_ID"
firebase use "$PROJECT_ID"

echo "==> Backing up Firestore to $BACKUP_DIR"
FIREBASE_PROJECT_ID="$PROJECT_ID" FIREBASE_BACKUP_DIR="$BACKUP_DIR" node ./scripts/backup-firestore.mjs

echo ""
echo "Backup complete."
