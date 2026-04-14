import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const opsRootDir = path.resolve(configDir, "..");

const [action, mode, confirmationToken] = process.argv.slice(2);

const envFileByMode = {
  local: ".env.local",
  development: ".env.development",
  production: ".env.production",
};

const scriptByAction = {
  backup: "backup-firestore.mjs",
  seed: "seed-data.mjs",
  reset: "reset-firestore.mjs",
  deploy: "deploy-app.mjs",
  setup: "setup-project.mjs",
};

function expectedResetConfirmation(projectId) {
  return `DELETE_FIRESTORE_DATA_IN_${projectId}`;
}

async function loadModeEnv(selectedMode) {
  const envFileName = envFileByMode[selectedMode];
  if (!envFileName) {
    throw new Error(
      `Unsupported mode '${selectedMode}'. Use one of: ${Object.keys(envFileByMode).join(", ")}.`
    );
  }

  const envFilePath = path.join(opsRootDir, envFileName);
  let contents;
  try {
    contents = await readFile(envFilePath, "utf8");
  } catch {
    throw new Error(`Missing required ops env file: ${envFilePath}`);
  }

  const parsed = dotenv.parse(contents);
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
}

function applyActionGuards(selectedAction, selectedMode, token) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required in the selected ops env file.");
  }

  if (selectedMode === "development" || selectedMode === "production") {
    process.env.ALLOW_FIRESTORE_CLOUD_OPERATION = "true";
    process.env.CONFIRM_FIRESTORE_PROJECT = projectId;
  }

  if (selectedAction === "seed" && (selectedMode === "development" || selectedMode === "production")) {
    process.env.REQUIRE_RECENT_BACKUP = "true";
  }

  if (selectedAction === "reset") {
    const expected = expectedResetConfirmation(projectId);
    if (!token) {
      throw new Error(
        `Reset requires confirmation text. Re-run with: npm run reset:${selectedMode === "local" ? "local" : selectedMode === "development" ? "dev" : "prod"} -- ${expected}`
      );
    }
    process.env.ALLOW_DESTRUCTIVE_FIRESTORE_RESET = "true";
    process.env.RESET_FIRESTORE_CONFIRMATION = token;
  }

  if (selectedAction === "deploy") {
    process.env.APP_BUILD_SCRIPT =
      selectedMode === "development" ? "build:dev" : "build";
  }
}

async function runInternalScript(selectedAction) {
  const scriptName = scriptByAction[selectedAction];
  if (!scriptName) {
    throw new Error(
      `Unsupported action '${selectedAction}'. Use one of: ${Object.keys(scriptByAction).join(", ")}.`
    );
  }

  await new Promise((resolve, reject) => {
    const child = spawn("node", [path.join("src", scriptName)], {
      cwd: opsRootDir,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${selectedAction} failed for mode '${mode}'.`));
    });
  });
}

async function main() {
  await loadModeEnv(mode);
  applyActionGuards(action, mode, confirmationToken);

  if (action === "seed" && process.env.FIRESTORE_TARGET === "cloud") {
    await runInternalScript("backup");
  }

  await runInternalScript(action);
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exit(1);
});
