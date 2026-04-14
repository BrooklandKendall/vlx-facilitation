import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  assertRecentBackup,
  createRecentBackupPolicy,
  ensureBackupDirectory,
  runCommand,
} from "./runtime-config.mjs";

function getDb(context) {
  if (getApps().length === 0) {
    if (context.target === "emulator") {
      initializeApp({ projectId: context.projectId });
    } else {
      initializeApp({ credential: applicationDefault(), projectId: context.projectId });
    }
  }

  return getFirestore();
}

function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function exportCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const docs = {};

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const subcollections = await doc.ref.listCollections();

    if (subcollections.length === 0) {
      docs[doc.id] = data;
      continue;
    }

    const nestedCollections = {};
    for (const subcollection of subcollections) {
      nestedCollections[subcollection.id] = await exportCollection(subcollection);
    }

    docs[doc.id] = {
      ...data,
      __collections__: nestedCollections,
    };
  }

  return docs;
}

export async function backupFirestore(context) {
  const db = getDb(context);

  await ensureBackupDirectory(context);

  const rootCollections = await db.listCollections();
  const collections = {};

  for (const collectionRef of rootCollections) {
    collections[collectionRef.id] = await exportCollection(collectionRef);
  }

  const outFile = path.join(context.backupDir, `bu-${safeTimestamp()}.json`);
  const output = {
    exportedAt: new Date().toISOString(),
    projectId: context.projectId,
    target: context.target,
    formatVersion: 1,
    collections,
  };

  await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  if (context.target === "cloud") {
    const marker = {
      projectId: context.projectId,
      completedAt: new Date().toISOString(),
      backupFile: outFile,
    };
    await writeFile(
      context.backupMarkerPath,
      `${JSON.stringify(marker, null, 2)}\n`,
      "utf8"
    );
  }

  return {
    outFile,
    rootCollectionCount: rootCollections.length,
  };
}

async function loadSeedFromDump(seedFilePath) {
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

export async function seedFirestore(context, options = {}) {
  const { requireRecentBackup = false } = options;

  if (context.target === "cloud" && requireRecentBackup) {
    await assertRecentBackup(context, createRecentBackupPolicy());
  }

  const seed = await loadSeedFromDump(context.seedFilePath);
  const db = getDb(context);

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

  return {
    featureCount: seed.features.length,
    itemCount: seed.items.length,
  };
}

export async function deleteFirestoreCollections(context, firebaseConfigPath) {
  const commandEnv = { ...process.env };
  if (context.target === "emulator") {
    commandEnv.FIRESTORE_EMULATOR_HOST = context.emulatorHost;
  } else {
    delete commandEnv.FIRESTORE_EMULATOR_HOST;
  }

  await runCommand(
    "firebase",
    [
      "firestore:delete",
      "--all-collections",
      "--force",
      "--project",
      context.projectId,
      "--config",
      firebaseConfigPath,
    ],
    { env: commandEnv }
  );
}
