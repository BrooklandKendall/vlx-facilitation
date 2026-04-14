import { assertSetupInputs, runCommand } from "./lib/runtime-config.mjs";

async function main() {
  const { firebaseConfigPath, projectId } = await assertSetupInputs();

  console.log(`Setting up Firebase project: ${projectId}`);

  await runCommand("gcloud", ["config", "set", "project", projectId]);
  await runCommand("gcloud", ["services", "enable", "firebase.googleapis.com"]);
  await runCommand("gcloud", ["services", "enable", "firestore.googleapis.com"]);
  await runCommand("gcloud", ["services", "enable", "firebasehosting.googleapis.com"]);

  try {
    await runCommand("gcloud", [
      "firestore",
      "databases",
      "create",
      "--location=nam5",
      "--type=firestore-native",
    ]);
  } catch {
    console.log("Firestore database already exists. Skipping create.");
  }

  await runCommand(
    "firebase",
    ["deploy", "--only", "firestore:rules", "--project", projectId, "--config", firebaseConfigPath]
  );

  console.log("Setup complete.");
}

main().catch((error) => {
  console.error("Setup failed.");
  console.error(error?.message ?? error);
  process.exit(1);
});
