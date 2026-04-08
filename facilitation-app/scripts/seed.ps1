$ErrorActionPreference = "Stop"

$PROJECT_ID = "vivalynx-tasks"
$BACKUP_DIR = Join-Path $PSScriptRoot "_backups"

Push-Location (Split-Path $PSScriptRoot)

Write-Host "==> Selecting Firebase project $PROJECT_ID"
firebase use $PROJECT_ID

Write-Host "==> Backing up Firestore to $BACKUP_DIR"
$env:FIREBASE_PROJECT_ID = $PROJECT_ID
$env:FIREBASE_BACKUP_DIR = $BACKUP_DIR
node (Join-Path $PSScriptRoot "backup-firestore.mjs")

Write-Host "==> Wiping Firestore database collections"
firebase firestore:delete --all-collections --force

Write-Host "==> Seeding sessions/default and sessions/default/features"
npm run seed:data

Write-Host ""
Write-Host "Seed complete. Firestore data has been fully replaced from seed."

Pop-Location
