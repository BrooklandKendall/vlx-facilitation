# VLx Facilitation App

React + Vite facilitation workspace backed by Firebase Firestore.

## What the app does

- Runs a shared realtime workshop board with five tabs: Agenda, North star, Feature sort, Open questions, and Session output.
- Stores workshop data in Firestore under `sessions/default`.
- Generates a plain-text session summary that can be copied or exported as a text file, a PRD package, a raw DB JSON dump, or a Firestore-nested-format JSON.

## Separation boundary

- App runtime and app package commands live in `facilitation-app/`.
- Operational backup/seed/reset/deploy/setup tooling lives in `../ops/`.
- The app does not invoke ops tooling.
- Ops tooling does not import app runtime code.

## Data model

- `sessions/default`
  - `personas`: array of `{ label, details }` objects.
  - `successCriteria`: free-text success criteria string.
- `sessions/default/features`
  - Feature cards: `seedId`, `name`, `domain`, `bucket` (mvp | v2x | def), `priority` (high | med | low), `status` (full | part | new), `tshirt` (xs | s | m | l | xl), `note`.
- `sessions/default/items`
  - Tagged items by `type`: nonNegotiable, constraint, question, risk, action. Each has a `text` field.

## App commands

Run these from `facilitation-app/`:

```bash
npm install
npm run emulators
npm run dev
npm run dev:local
npm run dev:dev
npm run dev:cloud
npm run build
npm run lint
npm run preview
```

## How app config works

The app is configured with Vite mode-specific `.env` files.

- `npm run dev` and `npm run dev:local` use `.env.local`
- `npm run dev:dev` and `npm run dev:cloud` use `.env.development`
- `npm run build` uses `.env.production`

Copy the matching example file and fill it in:

- `.env.local.example` -> `.env.local`
- `.env.development.example` -> `.env.development`
- `.env.production.example` -> `.env.production`

## Required app environment values

Each mode file must declare:

- `VITE_FIREBASE_TARGET`
  - Must be `emulator` or `cloud`.
  - There is no fallback target.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIRESTORE_EMULATOR_HOST`
  - Required when `VITE_FIREBASE_TARGET=emulator`.
- `VITE_FIRESTORE_EMULATOR_PORT`
  - Required when `VITE_FIREBASE_TARGET=emulator`.

If the wrong file is used, a required value is missing, or a mode/target combination is inconsistent, Vite fails before the app starts or builds.

## Local development

1. Run `npm install` in `facilitation-app/`.
2. Copy `.env.local.example` to `.env.local`.
3. Fill in the Firebase web config values for the project you actually want to use.
4. Start the emulator with `npm run emulators`.
5. Start the app with `npm run dev` or `npm run dev:local`.
6. Run seed/reset/backup flows from `../ops/`, not from this package.

Emulator notes:

- Firestore emulator host and port must be declared explicitly.
- Emulator UI is still configured by `firebase.json`.
- Emulator data persists in `./emulator-data` via import/export flags.

## Cloud usage

If you intentionally want the app to talk to hosted Firestore:

1. Copy `.env.development.example` to `.env.development` for shared dev cloud usage.
2. Copy `.env.production.example` to `.env.production` for production builds.
3. Provide the exact hosted Firebase config values for the intended project in the matching file.
4. Use `npm run dev:dev` or `npm run dev:cloud` for dev cloud.
5. Use `npm run build` for production builds.

The app will not promote itself to cloud mode when variables are missing.

## Ops workflows

All backup, seed, reset, deploy, and setup workflows moved to `../ops/`.

Read `../ops/README.md` before running any operational command. Those commands now require explicit target selection, explicit project confirmation, and explicit destructive confirmation text where applicable.

## Firestore rules

This app currently uses public Firestore access:

```txt
allow read, write: if true;
```

Use it only for non-sensitive workshop data.
