import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const requiredFirebaseKeys = [
  "VITE_FIREBASE_TARGET",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for the current Vite mode.`);
  }
  return value;
}

function validateFirebaseEnv(mode: string, env: NodeJS.ProcessEnv) {
  for (const key of requiredFirebaseKeys) {
    requireEnv(env, key);
  }

  const target = requireEnv(env, "VITE_FIREBASE_TARGET");
  if (target !== "emulator" && target !== "cloud") {
    throw new Error(
      `VITE_FIREBASE_TARGET must be 'emulator' or 'cloud' for mode '${mode}'.`
    );
  }

  if (mode === "emulator" && target !== "emulator") {
    throw new Error("Emulator mode must set VITE_FIREBASE_TARGET=emulator.");
  }

  if ((mode === "development" || mode === "production") && target !== "cloud") {
    throw new Error(`Mode '${mode}' must set VITE_FIREBASE_TARGET=cloud.`);
  }

  if (target === "emulator") {
    requireEnv(env, "VITE_FIRESTORE_EMULATOR_HOST");
    const emulatorPort = requireEnv(env, "VITE_FIRESTORE_EMULATOR_PORT");
    const port = Number(emulatorPort);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(
        `VITE_FIRESTORE_EMULATOR_PORT must be a positive integer. Received '${emulatorPort}'.`
      );
    }
  }
}

export default defineConfig(({ mode }) => {
  validateFirebaseEnv(mode, process.env);

  return {
    plugins: [react()],
    envDir: "./config/empty-env",
  };
});
