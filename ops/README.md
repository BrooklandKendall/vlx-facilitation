# VLx Ops

Operational tooling for backup, seed, reset, setup, and deploy.

## How it works

- Commands load their own mode-specific ops env file.
- You do not need to manually export env vars for normal usage.
- Local commands use `.env.local`.
- Dev cloud commands use `.env.development`.
- Prod cloud commands use `.env.production`.

## Setup

Run once from `ops/`:

```bash
npm install
```

## Main commands

This is a command catalog, not an execution sequence.

- Run `npm install` once.
- After that, run only the single command you need, unless a workflow below explicitly says to run more than one command.

### Local emulator

```bash
npm run backup:local
npm run seed:local
npm run reset:local -- DELETE_FIRESTORE_DATA_IN_vivalynx-tasks
```

### Dev cloud

```bash
npm run backup:dev
npm run seed:dev
npm run reset:dev -- DELETE_FIRESTORE_DATA_IN_vivalynx-tasks
npm run setup:dev
npm run deploy:dev
```

`deploy:dev` uses the existing app install. It does not run `npm ci`.

### Prod cloud

```bash
npm run backup:prod
npm run seed:prod
npm run reset:prod -- DELETE_FIRESTORE_DATA_IN_vivalynx-tasks
npm run setup:prod
npm run deploy:prod
```

`deploy:prod` uses the existing app install. It does not run `npm ci`.

## Common flows

### Local seed

```bash
npm run seed:local
```

### Local backup

```bash
npm run backup:local
```

### Local destructive reset

```bash
npm run reset:local -- DELETE_FIRESTORE_DATA_IN_vivalynx-tasks
```

### Dev cloud seed

```bash
npm run seed:dev
```

### Prod deploy

```bash
npm run deploy:prod
```

## Required ops files

Create or update these files if your project ids or paths change:

- `.env.local`
- `.env.development`
- `.env.production`

Reference templates:

- `.env.local.example`
- `.env.development.example`
- `.env.production.example`

## Safety rules

- No command defaults to a project when config is missing.
- Cloud commands confirm the target project internally before running.
- Cloud seed commands create a backup first, then require that fresh backup for the seed step.
- Reset commands always require explicit confirmation text on the command line.
