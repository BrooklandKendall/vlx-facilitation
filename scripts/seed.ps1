$ErrorActionPreference = "Stop"

$PROJECT_ID = "vivalynx-tasks"

Push-Location (Split-Path $PSScriptRoot)

Write-Host "==> Selecting Firebase project $PROJECT_ID"
firebase use $PROJECT_ID

Write-Host "==> Wiping Firestore database collections"
firebase firestore:delete --all-collections --force

Write-Host "==> Seeding sessions/default and sessions/default/features"
$env:FIREBASE_PROJECT_ID = $PROJECT_ID
npm run seed:data

Write-Host ""
Write-Host "Seed complete. Firestore data has been fully replaced from seed."

Pop-Location
