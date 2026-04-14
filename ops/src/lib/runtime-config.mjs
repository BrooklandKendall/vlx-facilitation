import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const libDir = path.dirname(fileURLToPath(import.meta.url));
export const opsRoot = path.resolve(libDir, "../..");
export const defaultBackupDir = path.join(opsRoot, "data-backup");
export const defaultSeedDumpPath = path.join(
  opsRoot,
  "data-snapshots",
  "task-snapshot.json"
);

function requireNonEmptyEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function requireBooleanFlag(name) {
  if (process.env[name] !== "true") {
    throw new Error(`${name}=true is required.`);
  }
}

function requirePositiveIntegerEnv(name) {
  const rawValue = requireNonEmptyEnv(name);
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer. Received '${rawValue}'.`);
  }
  return value;
}

function resolveOptionalPath(value) {
  if (!value?.trim()) {
    return null;
  }
  const normalized = value.trim();
  if (path.isAbsolute(normalized)) {
    return normalized;
  }
  return path.resolve(opsRoot, normalized);
}

function requirePathEnv(name) {
  return resolveOptionalPath(requireNonEmptyEnv(name));
}

async function ensurePathExists(targetPath, label) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`${label} does not exist: ${targetPath}`);
  }
}

export function getExpectedResetConfirmation(projectId) {
  return `DELETE_FIRESTORE_DATA_IN_${projectId}`;
}

export function createFirestoreAdminContext({ requireSeedFile = false } = {}) {
  const target = requireNonEmptyEnv("FIRESTORE_TARGET");
  if (target !== "emulator" && target !== "cloud") {
    throw new Error("FIRESTORE_TARGET must be either 'emulator' or 'cloud'.");
  }

  const projectId = requireNonEmptyEnv("FIREBASE_PROJECT_ID");
  const backupDir =
    resolveOptionalPath(process.env.FIREBASE_BACKUP_DIR) ??
    defaultBackupDir;

  const context = {
    target,
    projectId,
    backupDir,
    backupMarkerPath: path.join(backupDir, ".last-cloud-backup.json"),
    emulatorHost: null,
    seedFilePath: null,
  };

  if (requireSeedFile) {
    context.seedFilePath =
      resolveOptionalPath(process.env.SEED_DUMP_PATH) ?? defaultSeedDumpPath;
  }

  if (target === "emulator") {
    context.emulatorHost = requireNonEmptyEnv("FIRESTORE_EMULATOR_HOST");
    return context;
  }

  requireBooleanFlag("ALLOW_FIRESTORE_CLOUD_OPERATION");
  if (requireNonEmptyEnv("CONFIRM_FIRESTORE_PROJECT") !== projectId) {
    throw new Error(
      `CONFIRM_FIRESTORE_PROJECT must exactly match FIREBASE_PROJECT_ID ('${projectId}').`
    );
  }

  return context;
}

export function createRecentBackupPolicy() {
  requireBooleanFlag("REQUIRE_RECENT_BACKUP");
  return {
    maxAgeMs: requirePositiveIntegerEnv("BACKUP_MAX_AGE_MS"),
  };
}

export async function assertRecentBackup(context, policy) {
  let marker;
  try {
    marker = JSON.parse(await readFile(context.backupMarkerPath, "utf8"));
  } catch {
    throw new Error(
      `Missing backup marker at ${context.backupMarkerPath}. Run a cloud backup first.`
    );
  }

  if (marker?.projectId !== context.projectId) {
    throw new Error(
      `Backup marker project mismatch. Found '${marker?.projectId ?? "unknown"}', expected '${context.projectId}'.`
    );
  }

  const completedAtMs = Date.parse(marker?.completedAt ?? "");
  if (!Number.isFinite(completedAtMs)) {
    throw new Error("Backup marker timestamp is invalid.");
  }

  const backupAgeMs = Date.now() - completedAtMs;
  if (backupAgeMs > policy.maxAgeMs) {
    throw new Error(
      `Latest backup is too old (${Math.round(backupAgeMs / 1000)}s > ${Math.round(
        policy.maxAgeMs / 1000
      )}s).`
    );
  }
}

export function assertResetConfirmation(projectId) {
  requireBooleanFlag("ALLOW_DESTRUCTIVE_FIRESTORE_RESET");
  const provided = requireNonEmptyEnv("RESET_FIRESTORE_CONFIRMATION");
  const expected = getExpectedResetConfirmation(projectId);
  if (provided !== expected) {
    throw new Error(
      `RESET_FIRESTORE_CONFIRMATION must exactly equal '${expected}'.`
    );
  }
}

export function getFirebaseConfigPath() {
  return requirePathEnv("FIREBASE_CONFIG_PATH");
}

export function getAppRootDir() {
  return requirePathEnv("APP_ROOT_DIR");
}

export async function assertAppDeployInputs() {
  const appRootDir = getAppRootDir();
  const firebaseConfigPath = getFirebaseConfigPath();
  const projectId = requireNonEmptyEnv("FIREBASE_PROJECT_ID");

  await ensurePathExists(appRootDir, "APP_ROOT_DIR");
  await ensurePathExists(path.join(appRootDir, "package.json"), "App package.json");
  await ensurePathExists(firebaseConfigPath, "FIREBASE_CONFIG_PATH");

  return { appRootDir, firebaseConfigPath, projectId };
}

export async function assertSetupInputs() {
  const firebaseConfigPath = getFirebaseConfigPath();
  const projectId = requireNonEmptyEnv("FIREBASE_PROJECT_ID");

  await ensurePathExists(firebaseConfigPath, "FIREBASE_CONFIG_PATH");

  return { firebaseConfigPath, projectId };
}

export async function ensureBackupDirectory(context) {
  await mkdir(context.backupDir, { recursive: true });
}

export async function runCommand(command, args, options = {}) {
  const { cwd = opsRoot, env = process.env } = options;

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(" ")}`));
    });
  });
}
