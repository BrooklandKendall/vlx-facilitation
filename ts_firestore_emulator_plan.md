# Local Firestore Emulator Setup

Add local Firestore emulator support so the Vite app and Admin SDK scripts can run entirely offline against a local database.

## Files to change

- `facilitation-app/firebase.json` — add `emulators` config block
- `facilitation-app/src/firebase.ts` — conditionally connect to emulator
- `facilitation-app/.env.example` — document the new env var
- `facilitation-app/package.json` — add convenience npm scripts
- `.gitignore` — exclude emulator data directory

## Prerequisite

Java JDK 11+ must be installed (required by the Firestore emulator runtime). Firebase CLI is already in use by this project.

## Steps

### 1. Add emulators block to `firebase.json`

Add a top-level `"emulators"` key alongside the existing `"hosting"` and `"firestore"` keys:

```json
"emulators": {
  "firestore": { "port": 8080, "host": "127.0.0.1" },
  "ui": { "enabled": true, "port": 4000 }
}
```

This gives a fixed Firestore port (8080) and enables the Emulator Suite UI on port 4000.

### 2. Modify `src/firebase.ts` to connect to emulator

Import `connectFirestoreEmulator` from `firebase/firestore`. After `getFirestore(app)`, add:

```typescript
if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
```

This must run before any other Firestore call, which it will since `db` is exported at module scope.

### 3. Update `.env.example`

Add:

```
VITE_USE_EMULATOR=true
```

Production `.env` omits this or sets it to `false`. Local `.env` (or `.env.local`) sets it to `true`.

### 4. Add npm scripts to `package.json`

Add `cross-env` as a dev dependency so inline env vars work consistently across Windows, macOS, and Linux.

```json
"emulators": "firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data",
"dev:local": "cross-env VITE_USE_EMULATOR=true npm run dev",
"seed:local": "cross-env FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node ./scripts/seed-data.mjs"
```

- `emulators` — starts the Firestore emulator with data persistence across restarts via `--import`/`--export-on-exit`
- `dev:local` — runs the Vite dev server with the emulator flag on
- `seed:local` — seeds the local emulator (Admin SDK auto-detects `FIRESTORE_EMULATOR_HOST`)

### 5. Add `emulator-data/` to `.gitignore`

The exported emulator state directory should not be committed.

### 6. Keep reset semantics unchanged

Reset behavior remains intentionally the same in local and server workflows. Any existing reset command should continue to behave the same way; the emulator workflow only adds an alternate local Firestore target.

### 7. Verify Admin SDK initialization behavior

`backup-firestore.mjs` and `seed-data.mjs` already use the Admin SDK and should route to the emulator when `FIRESTORE_EMULATOR_HOST` is set, but the current scripts also call `applicationDefault()`. Before treating them as no-change files, verify that this initialization path works cleanly against the emulator in local offline use. If not, update emulator-mode initialization to rely on the shared `projectId` without requiring ADC.
