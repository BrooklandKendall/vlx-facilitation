import {
  backupFirestore,
  deleteFirestoreCollections,
  seedFirestore,
} from "./lib/firestore-ops.mjs";
import {
  assertResetConfirmation,
  createFirestoreAdminContext,
  getFirebaseConfigPath,
} from "./lib/runtime-config.mjs";

async function main() {
  const context = createFirestoreAdminContext({ requireSeedFile: true });
  const firebaseConfigPath = getFirebaseConfigPath();

  assertResetConfirmation(context.projectId);

  const backupResult = await backupFirestore(context);
  console.log(`Backup written: ${backupResult.outFile}`);

  await deleteFirestoreCollections(context, firebaseConfigPath);
  console.log(
    `Deleted all Firestore collections for ${context.target} project ${context.projectId}.`
  );

  const seedResult = await seedFirestore(context, { requireRecentBackup: false });
  console.log(
    `Reset complete for ${context.target} project ${context.projectId}: ${seedResult.featureCount} features, ${seedResult.itemCount} items.`
  );
}

main().catch((error) => {
  console.error("Reset failed.");
  console.error(error?.message ?? error);
  if (process.env.FIRESTORE_TARGET === "cloud") {
    console.error("If this is an auth issue, run: gcloud auth application-default login");
  }
  process.exit(1);
});
