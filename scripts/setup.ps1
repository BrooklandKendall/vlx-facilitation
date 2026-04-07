$ErrorActionPreference = "Stop"

$PROJECT_ID = "vivalynx-tasks"

Write-Host "==> Setting active GCP project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

Write-Host "==> Enabling required APIs"
gcloud services enable firebase.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebasehosting.googleapis.com

Write-Host "==> Provisioning Firestore (native mode, nam5 multi-region)"
try {
    gcloud firestore databases create --location=nam5 --type=firestore-native
} catch {
    Write-Host "    Firestore database already exists - skipping."
}

# If not already logged-in
# Write-Host "==> Logging into Firebase CLI"
# firebase login --no-localhost

Write-Host "==> Setting Firebase project alias"
firebase use $PROJECT_ID

Write-Host "==> Deploying Firestore security rules"
firebase deploy --only firestore:rules

Write-Host ""
Write-Host "Setup complete. Next steps:"
Write-Host "  1. Go to Firebase Console > Project settings > Your apps"
Write-Host "     Add a Web app if you haven't, then copy the config values into .env"
Write-Host "  2. Run:  npm run deploy"
Write-Host "  3. Run:  .\scripts\seed.ps1"
