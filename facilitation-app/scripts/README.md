# Scripts

Automation scripts for setup, deploy, and Firestore seed operations.

## Prerequisites

- `node` + `npm`
- `firebase` CLI authenticated to your account
- `gcloud` CLI authenticated for project/API setup and admin seeding

## Script inventory

- `setup.ps1` / `setup.sh`
  - Sets active GCP project (`vivalynx-tasks`)
  - Enables Firebase / Firestore / Hosting APIs
  - Creates Firestore DB (if missing)
  - Selects Firebase project and deploys Firestore rules

- `deploy.ps1` / `deploy.sh`
  - Runs `npm ci`
  - Runs `npm run lint`
  - Runs `npm run build`
  - Runs `firebase deploy`

- `seed.ps1` / `seed.sh`
  - Selects Firebase project
  - Creates a full Firestore JSON backup in `scripts/_backups`
  - Deletes all Firestore collections
  - Runs `npm run seed:data` to repopulate `sessions/default`, `features`, and `items`

- `backup.ps1` / `backup.sh`
  - Selects Firebase project
  - Creates a full Firestore JSON backup in `scripts/_backups`
  - Non-destructive backup flow (no delete/seed)

- `backup-firestore.mjs`
  - Exports all root collections and nested subcollections from Firestore
  - Writes timestamped JSON dump files into `scripts/_backups` as `bu-<date-string>.json`
  - Used automatically by seed scripts before destructive reset

- `seed-data.mjs`
  - Node script called by `npm run seed:data`
  - Writes seed data from `../firestore-dump-20260413_1757.json` into Firestore
  - Optional override with `SEED_DUMP_PATH=/absolute/path/to/dump.json`
  - Uses `FIREBASE_PROJECT_ID` env var (defaults to `vivalynx-tasks`)

## Usage

Run from the app root (`facilitation-app`):

PowerShell:

```powershell
.\scripts\setup.ps1
.\scripts\deploy.ps1
.\scripts\seed.ps1
.\scripts\backup.ps1
```

Bash:

```bash
./scripts/setup.sh
./scripts/deploy.sh
./scripts/seed.sh
./scripts/backup.sh
```

Direct npm targets:

```bash
npm run deploy
npm run deploy:hosting
npm run deploy:rules
npm run backup:data
npm run seed:data
npm run seed:reset
```

## Safety notes

- `seed.ps1`, `seed.sh`, and `npm run seed:reset` are destructive and wipe existing Firestore collections before reseeding.
- `seed.ps1` and `seed.sh` now create a full JSON dump before wiping data.
- `backup.ps1`, `backup.sh`, and `npm run backup:data` are non-destructive backup-only paths.
- Verify the selected Firebase project before running seed commands in shared environments.
