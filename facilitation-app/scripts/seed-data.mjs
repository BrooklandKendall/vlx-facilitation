import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "vivalynx-tasks";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const cloudWritesAllowed = process.env.ALLOW_CLOUD_FIRESTORE_WRITE === "true";
const confirmFirestoreProject = process.env.CONFIRM_FIRESTORE_PROJECT;
const requireRecentBackup = process.env.REQUIRE_RECENT_BACKUP === "true";
const backupMaxAgeMs = Number(process.env.BACKUP_MAX_AGE_MS || 15 * 60 * 1000);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = process.env.FIREBASE_BACKUP_DIR || path.join(scriptDir, "_backups");
const backupMarkerPath = path.join(backupDir, ".last-cloud-backup.json");
const seedFilePath = process.env.SEED_DUMP_PATH || path.resolve(scriptDir, "../../firestore-dump-20260413_1757.json");

async function assertCloudSeedAllowed() {
  if (emulatorHost) {
    return;
  }

  if (!cloudWritesAllowed) {
    throw new Error(
      "Cloud seed is blocked. Set ALLOW_CLOUD_FIRESTORE_WRITE=true or use FIRESTORE_EMULATOR_HOST for local seeding."
    );
  }

  if (confirmFirestoreProject !== projectId) {
    throw new Error(
      `Cloud seed blocked. CONFIRM_FIRESTORE_PROJECT must equal '${projectId}'.`
    );
  }

  if (!requireRecentBackup) {
    throw new Error(
      "Cloud seed blocked. Set REQUIRE_RECENT_BACKUP=true and run the backup-then-seed cloud wrapper command."
    );
  }

  let marker;
  try {
    marker = JSON.parse(await readFile(backupMarkerPath, "utf8"));
  } catch {
    throw new Error(
      `Cloud seed blocked. Missing backup marker at ${backupMarkerPath}. Run cloud backup first.`
    );
  }

  if (marker?.projectId !== projectId) {
    throw new Error(
      `Cloud seed blocked. Latest backup marker is for '${marker?.projectId ?? "unknown"}', expected '${projectId}'.`
    );
  }

  const backedUpAtMs = Date.parse(marker?.completedAt ?? "");
  if (!Number.isFinite(backedUpAtMs)) {
    throw new Error("Cloud seed blocked. Backup marker timestamp is invalid.");
  }

  const backupAgeMs = Date.now() - backedUpAtMs;
  if (backupAgeMs > backupMaxAgeMs) {
    throw new Error(
      `Cloud seed blocked. Latest backup is too old (${Math.round(
        backupAgeMs / 1000
      )}s > ${Math.round(backupMaxAgeMs / 1000)}s).`
    );
  }
}

async function loadSeedFromDump() {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(seedFilePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read seed dump at ${seedFilePath}: ${error?.message ?? error}`
    );
  }

  const sessions = parsed?.collections?.sessions;
  if (!Array.isArray(sessions)) {
    throw new Error("Seed dump is invalid: collections.sessions must be an array.");
  }

  const defaultSession = sessions.find((entry) => entry?.id === "default");
  if (!defaultSession?.data) {
    throw new Error("Seed dump is invalid: missing sessions/default data.");
  }

  if (!Array.isArray(defaultSession.features)) {
    throw new Error("Seed dump is invalid: sessions/default/features must be an array.");
  }

  if (!Array.isArray(defaultSession.items)) {
    throw new Error("Seed dump is invalid: sessions/default/items must be an array.");
  }

  return {
    sessionData: defaultSession.data,
    features: defaultSession.features,
    items: defaultSession.items,
  };
}

async function main() {
  await assertCloudSeedAllowed();
  const seed = await loadSeedFromDump();

  if (emulatorHost) {
    initializeApp({ projectId });
  } else {
    initializeApp({ credential: applicationDefault(), projectId });
  }
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  await db.doc("sessions/default").set(seed.sessionData);
  const batch = db.batch();
  for (const feature of seed.features) {
    const { id, ...featureData } = feature;
    const docRef = id
      ? db.collection("sessions/default/features").doc(id)
      : db.collection("sessions/default/features").doc();
    batch.set(docRef, featureData);
  }
  for (const item of seed.items) {
    const { id, ...itemData } = item;
    const docRef = id
      ? db.collection("sessions/default/items").doc(id)
      : db.collection("sessions/default/items").doc();
    batch.set(docRef, itemData);
  }
  await batch.commit();
  console.log(
    `Seed complete for project ${projectId} from ${seedFilePath}: ${seed.features.length} features, ${seed.items.length} items.`
  );
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error?.message ?? error);
  if (!emulatorHost) {
    console.error("If this is an auth issue, run: gcloud auth application-default login");
  }
  process.exit(1);
});
