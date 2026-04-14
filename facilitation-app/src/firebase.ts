import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function requireFirebaseTarget(): "emulator" | "cloud" {
  const target = requireEnv("VITE_FIREBASE_TARGET");
  if (target !== "emulator" && target !== "cloud") {
    throw new Error("VITE_FIREBASE_TARGET must be either 'emulator' or 'cloud'.");
  }
  return target;
}

function requireEmulatorPort(): number {
  const value = requireEnv("VITE_FIRESTORE_EMULATOR_PORT");
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `VITE_FIRESTORE_EMULATOR_PORT must be a positive integer. Received '${value}'.`
    );
  }
  return port;
}

const firebaseTarget = requireFirebaseTarget();
const firebaseConfig = {
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("VITE_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (firebaseTarget === "emulator") {
  connectFirestoreEmulator(
    db,
    requireEnv("VITE_FIRESTORE_EMULATOR_HOST"),
    requireEmulatorPort()
  );
}
