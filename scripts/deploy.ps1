$ErrorActionPreference = "Stop"

Push-Location (Split-Path $PSScriptRoot)

Write-Host "==> Installing dependencies"
npm ci

Write-Host "==> Linting"
npm run lint

Write-Host "==> Building production bundle"
npm run build

Write-Host "==> Deploying to Firebase Hosting + Firestore rules"
firebase deploy

Write-Host ""
Write-Host "Deploy complete."
Write-Host "Live at: https://vivalynx-tasks.web.app"

Pop-Location
