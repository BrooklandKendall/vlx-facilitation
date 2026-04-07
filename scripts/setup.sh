#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="vivalynx-tasks"

echo "==> Setting active GCP project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "==> Enabling required APIs"
gcloud services enable firebase.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebasehosting.googleapis.com

echo "==> Provisioning Firestore (native mode, nam5 multi-region)"
gcloud firestore databases create \
  --location=nam5 \
  --type=firestore-native \
  2>/dev/null || echo "    Firestore database already exists — skipping."

echo "==> Logging into Firebase CLI"
firebase login --no-localhost

echo "==> Setting Firebase project alias"
firebase use "$PROJECT_ID"

echo "==> Deploying Firestore security rules"
firebase deploy --only firestore:rules

echo ""
echo "Setup complete. Next steps:"
echo "  1. Go to Firebase Console > Project settings > Your apps"
echo "     Add a Web app if you haven't, then copy the config values into .env"
echo "  2. Run:  npm run deploy"
echo "  3. Run:  ./scripts/seed.sh"
