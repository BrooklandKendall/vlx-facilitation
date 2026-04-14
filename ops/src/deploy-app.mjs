import { assertAppDeployInputs, runCommand } from "./lib/runtime-config.mjs";

async function main() {
  const { appRootDir, firebaseConfigPath, projectId } = await assertAppDeployInputs();
  const appBuildScript = process.env.APP_BUILD_SCRIPT?.trim() || "build";

  console.log(`Using app directory: ${appRootDir}`);
  console.log(`Deploying to Firebase project: ${projectId}`);
  console.log("Using existing local dependencies.");

  await runCommand("npm", ["run", "lint"], { cwd: appRootDir });
  await runCommand("npm", ["run", appBuildScript], { cwd: appRootDir });
  await runCommand(
    "firebase",
    ["deploy", "--project", projectId, "--config", firebaseConfigPath],
    { cwd: appRootDir }
  );

  console.log("Deploy complete.");
}

main().catch((error) => {
  console.error("Deploy failed.");
  console.error(error?.message ?? error);
  process.exit(1);
});
