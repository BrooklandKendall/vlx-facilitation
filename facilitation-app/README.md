# VLx Facilitation App

React + Vite facilitation workspace backed by Firebase Firestore.

Running at: `https://vivalynx-tasks.web.app`

## What the app does

- Runs a shared realtime workshop board with five tabs: Agenda, North star, Feature sort, Risks/questions, and Session output.
- Stores workshop data in Firestore under `sessions/default`.
- Seeds a canonical feature list plus a default session document.
- Generates a plain-text session summary that can be copied or exported.

## Data model

- `sessions/default`
  - Persona fields and success criteria.
- `sessions/default/features`
  - Seeded feature cards used in the feature sorting workflow.
- `sessions/default/items`
  - Non-negotiables, constraints, questions, risks, and actions.

## Prerequisites

- Node.js and npm
- Firebase CLI: `npm install -g firebase-tools`
- Java JDK 11+ (required for Firestore emulator)
- Google Cloud CLI only if you plan to run cloud Admin SDK scripts: [cloud.google.com/sdk](https://cloud.google.com/sdk)
- Authenticated cloud access (only for cloud operations):
  - `firebase login`
  - `gcloud auth login`
  - `gcloud auth application-default login`

## Local development

1. Install dependencies:
   - `npm install`
2. Copy the sample env file:
   - PowerShell: `Copy-Item .env.example .env`
   - Bash: `cp .env.example .env`
3. Populate `.env` with your Firebase web app config values.
4. Start the Firestore emulator:
   - `npm run emulators`
5. Start the app against the emulator:
   - `npm run dev:local`

The app reads these variables from `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_USE_EMULATOR` (set to `true` for local emulator usage)

Emulator notes:

- Firestore emulator runs at `127.0.0.1:8080`.
- Emulator UI runs at `127.0.0.1:4000`.
- Emulator data persists in `./emulator-data` via import/export flags.

## Firebase project setup

This repo is currently configured around the Firebase project id `vivalynx-tasks` in `.firebaserc` and the helper scripts. If you use a different Firebase project, update `.firebaserc` and the `PROJECT_ID` value in the scripts under `scripts/`.

Run one of the setup scripts to:

- set the active GCP project
- enable Firebase, Firestore, and Firebase Hosting APIs
- create the Firestore database if needed
- deploy Firestore rules

Commands:

- PowerShell: `.\scripts\setup.ps1`
- Bash: `./scripts/setup.sh`

After setup:

1. Open Firebase Console and add a Web app if needed.
2. Copy the Firebase web config values into `.env`.
3. Deploy the app.
4. Seed Firestore data.

## Deploy

Available npm scripts:

- `npm run build` builds the production bundle.
- `npm run lint` runs ESLint.
- `npm run deploy` builds and runs `firebase deploy`.
- `npm run deploy:hosting` builds and deploys Hosting only.
- `npm run deploy:rules` deploys Firestore rules only.
- `npm run emulators` starts Firestore emulator with persisted data.

Helper scripts:

- PowerShell: `.\scripts\deploy.ps1`
- Bash: `./scripts/deploy.sh`

The deploy scripts run `npm ci`, `npm run lint`, `npm run build`, and `firebase deploy`.

## Seed data

Default safety posture:

- Cloud backup/seed/reset is blocked unless explicit guard env vars are set.
- Local emulator commands do not require cloud credentials.

Local commands (recommended):

- `npm run seed:local`
  - Seeds emulator data only (`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`).
- `npm run seed:reset`
  - Emulator-only destructive reset, then local reseed.
- `npm run backup:local`
  - Exports emulator data to `scripts/_backups`.

Cloud commands (explicit opt-in):

- `npm run backup:data`
  - Cloud backup only when both are set:
    - `ALLOW_CLOUD_FIRESTORE_WRITE=true`
    - `CONFIRM_FIRESTORE_PROJECT=vivalynx-tasks` (or matching target project)
- `npm run seed:cloud`
  - Runs backup first, then cloud seed.
  - Also requires `REQUIRE_RECENT_BACKUP=true` (set by the script itself).
- `npm run seed:reset:cloud`
  - Runs backup, deletes all cloud collections, then reseeds.
  - Requires the same cloud guard env vars.

Direct `npm run seed:data`:

- Seeds current Firestore target.
- In cloud mode, it fails unless all safety checks pass:
  - `ALLOW_CLOUD_FIRESTORE_WRITE=true`
  - `CONFIRM_FIRESTORE_PROJECT` matches `FIREBASE_PROJECT_ID`
  - `REQUIRE_RECENT_BACKUP=true`
  - a recent backup marker exists at `scripts/_backups/.last-cloud-backup.json`

Helper scripts:

- PowerShell: `.\scripts\seed.ps1`
- Bash: `./scripts/seed.sh`

These wrappers target cloud workflows and inherit the same environment guard requirements.

## Recommended workflow

Local-first workflow:

1. `npm install`
2. `npm run emulators`
3. `npm run dev:local`
4. `npm run seed:local` (or `npm run seed:reset` for full local reset)

Cloud workflow (intentional only):

1. Export required guards:
   - `ALLOW_CLOUD_FIRESTORE_WRITE=true`
   - `CONFIRM_FIRESTORE_PROJECT=vivalynx-tasks` (or your target project)
2. `npm run backup:data`
3. `npm run seed:cloud` (or `npm run seed:reset:cloud` for destructive reset)

## Firestore rules

This app currently uses public Firestore access:

```txt
allow read, write: if true;
```

Use it only for non-sensitive workshop data.
