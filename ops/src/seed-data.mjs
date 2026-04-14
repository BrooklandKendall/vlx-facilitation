import { seedFirestore } from "./lib/firestore-ops.mjs";
import {
  createFirestoreAdminContext,
  createRecentBackupPolicy,
} from "./lib/runtime-config.mjs";

async function main() {
  const context = createFirestoreAdminContext({ requireSeedFile: true });
  const requireRecentBackup = context.target === "cloud";

  if (requireRecentBackup) {
    createRecentBackupPolicy();
  }

  const result = await seedFirestore(context, { requireRecentBackup });
  console.log(
    `Seed complete for ${context.target} project ${context.projectId} from ${context.seedFilePath}: ${result.featureCount} features, ${result.itemCount} items.`
  );
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error?.message ?? error);
  if (process.env.FIRESTORE_TARGET === "cloud") {
    console.error("If this is an auth issue, run: gcloud auth application-default login");
  }
  process.exit(1);
});
