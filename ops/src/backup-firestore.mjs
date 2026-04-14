import { backupFirestore } from "./lib/firestore-ops.mjs";
import { createFirestoreAdminContext } from "./lib/runtime-config.mjs";

async function main() {
  const context = createFirestoreAdminContext();
  const result = await backupFirestore(context);

  console.log(`Backup written: ${result.outFile}`);
  console.log(`Root collections exported: ${result.rootCollectionCount}`);
}

main().catch((error) => {
  console.error("Backup failed.");
  console.error(error?.message ?? error);
  if (process.env.FIRESTORE_TARGET === "cloud") {
    console.error("If this is an auth issue, run: gcloud auth application-default login");
  }
  process.exit(1);
});
