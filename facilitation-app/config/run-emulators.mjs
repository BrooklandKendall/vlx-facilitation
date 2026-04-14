import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const appRootDir = path.resolve(configDir, "..");

async function loadLocalEnv() {
  const envFilePath = path.join(appRootDir, ".env.local");
  let contents;
  try {
    contents = await readFile(envFilePath, "utf8");
  } catch {
    throw new Error(`Missing required env file: ${envFilePath}`);
  }

  const parsed = dotenv.parse(contents);
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
}

async function main() {
  await loadLocalEnv();

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("VITE_FIREBASE_PROJECT_ID is required in .env.local.");
  }

  await new Promise((resolve, reject) => {
    const child = spawn(
      "firebase",
      [
        "emulators:start",
        "--project",
        projectId,
        "--only",
        "firestore",
        "--import=./emulator-data",
        "--export-on-exit=./emulator-data",
      ],
      {
        cwd: appRootDir,
        env: process.env,
        stdio: "inherit",
        shell: process.platform === "win32",
      }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error("Firebase emulator command failed."));
    });
  });
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exit(1);
});
