import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "vivalynx-tasks";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = process.env.FIREBASE_BACKUP_DIR || path.join(scriptDir, "_backups");

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

async function main() {
  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();

  await mkdir(backupDir, { recursive: true });

  const rootCollections = await db.listCollections();
  const collections = {};

  for (const collectionRef of rootCollections) {
    collections[collectionRef.id] = await exportCollection(collectionRef);
  }

  const output = {
    exportedAt: new Date().toISOString(),
    projectId,
    formatVersion: 1,
    collections,
  };

  const outFile = path.join(backupDir, `bu-${safeTimestamp()}.json`);
  await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Backup written: ${outFile}`);
  console.log(`Root collections exported: ${rootCollections.length}`);
}

main().catch((error) => {
  console.error("Backup failed.");
  console.error(error?.message ?? error);
  console.error("If this is an auth issue, run: gcloud auth application-default login");
  process.exit(1);
});
