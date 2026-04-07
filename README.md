# VLx Facilitation App

React + Vite facilitation workspace backed by Firebase Firestore.

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
- Google Cloud CLI if you plan to use the setup scripts: [cloud.google.com/sdk](https://cloud.google.com/sdk)
- Authenticated local access:
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
4. Start the dev server:
   - `npm run dev`

The app reads these variables from `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

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

Helper scripts:

- PowerShell: `.\scripts\deploy.ps1`
- Bash: `./scripts/deploy.sh`

The deploy scripts run `npm ci`, `npm run lint`, `npm run build`, and `firebase deploy`.

## Seed data

Available seed commands:

- `npm run seed:data`
  - Writes `sessions/default` and the seeded `features` collection.
  - Requires Google application default credentials.
- `npm run seed:reset`
  - Deletes all Firestore collections, then reseeds data.

Helper scripts:

- PowerShell: `.\scripts\seed.ps1`
- Bash: `./scripts/seed.sh`

The seed scripts are destructive. They run:

```txt
firebase firestore:delete --all-collections --force
```

Then they reseed `sessions/default` and `sessions/default/features`.

## Recommended workflow

1. `.\scripts\setup.ps1` or `./scripts/setup.sh`
2. `.\scripts\deploy.ps1` or `./scripts/deploy.sh`
3. `.\scripts\seed.ps1` or `./scripts/seed.sh`

## Firestore rules

This app currently uses public Firestore access:

```txt
allow read, write: if true;
```

Use it only for non-sensitive workshop data.
