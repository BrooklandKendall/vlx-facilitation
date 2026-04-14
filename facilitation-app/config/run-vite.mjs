import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const appRootDir = path.resolve(configDir, "..");

const [action, mode] = process.argv.slice(2);

const envFileByMode = {
  local: ".env.local",
  development: ".env.development",
  production: ".env.production",
};

const viteModeByMode = {
  local: "emulator",
  development: "development",
  production: "production",
};

async function loadModeEnv(selectedMode) {
  const envFileName = envFileByMode[selectedMode];
  if (!envFileName) {
    throw new Error(
      `Unsupported mode '${selectedMode}'. Use one of: ${Object.keys(envFileByMode).join(", ")}.`
    );
  }

  const envFilePath = path.join(appRootDir, envFileName);
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
  if (action !== "dev" && action !== "build") {
    throw new Error("Unsupported action. Use 'dev' or 'build'.");
  }

  await loadModeEnv(mode);
  const viteMode = viteModeByMode[mode];
  if (!viteMode) {
    throw new Error(
      `Unsupported mode '${mode}'. Use one of: ${Object.keys(envFileByMode).join(", ")}.`
    );
  }

  const commandArgs =
    action === "dev"
      ? ["vite", "--mode", viteMode]
      : ["vite", "build", "--mode", viteMode];

  await new Promise((resolve, reject) => {
    const child = spawn("npx", commandArgs, {
      cwd: appRootDir,
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
      reject(new Error(`Vite command failed for action '${action}' and mode '${mode}'.`));
    });
  });
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exit(1);
});
