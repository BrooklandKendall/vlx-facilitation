import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  Feature,
  FeatureBucket,
  FeaturePriority,
  FeatureStatus,
  ItemType,
  SessionDoc,
  SessionField,
  SessionItem,
} from "../types";

const SESSION_PATH = doc(db, "sessions", "default");
const FEATURES_PATH = collection(db, "sessions", "default", "features");
const ITEMS_PATH = collection(db, "sessions", "default", "items");

const DEFAULT_SESSION: SessionDoc = {
  personaCareRecipient: "",
  personaCareRecipientRoles: "",
  personaFamilyCaregiver: "",
  personaFamilyCaregiverRoles: "",
  personaCoordinator: "",
  personaCoordinatorRoles: "",
  successCriteria: "",
};

const coercePriority = (value: unknown): FeaturePriority => {
  if (value === "high" || value === "med" || value === "low") return value;
  return "med";
};

const coerceStatus = (value: unknown): FeatureStatus => {
  if (value === "full" || value === "part" || value === "new") return value;
  return "new";
};

const coerceBucket = (value: unknown): FeatureBucket => {
  if (value === "mvp" || value === "v2x" || value === "def") return value;
  return "def";
};

export async function ensureSessionDoc() {
  const snap = await getDoc(SESSION_PATH);
  if (!snap.exists()) {
    await setDoc(SESSION_PATH, DEFAULT_SESSION);
  }
}

export function subscribeSession(onData: (session: SessionDoc) => void) {
  return onSnapshot(SESSION_PATH, (snapshot) => {
    const data = snapshot.data() as Partial<SessionDoc> | undefined;
    onData({
      personaCareRecipient: data?.personaCareRecipient ?? "",
      personaCareRecipientRoles: data?.personaCareRecipientRoles ?? "",
      personaFamilyCaregiver: data?.personaFamilyCaregiver ?? "",
      personaFamilyCaregiverRoles: data?.personaFamilyCaregiverRoles ?? "",
      personaCoordinator: data?.personaCoordinator ?? "",
      personaCoordinatorRoles: data?.personaCoordinatorRoles ?? "",
      successCriteria: data?.successCriteria ?? "",
    });
  });
}

export function subscribeFeatures(onData: (features: Feature[]) => void) {
  return onSnapshot(query(FEATURES_PATH, orderBy("seedId", "asc")), (snapshot) => {
    const rows: Feature[] = snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        seedId: typeof data.seedId === "number" ? data.seedId : 0,
        name: typeof data.name === "string" ? data.name : "Unnamed Feature",
        domain: typeof data.domain === "string" ? data.domain : "Unknown",
        priority: coercePriority(data.priority),
        status: coerceStatus(data.status),
        bucket: coerceBucket(data.bucket),
        note: typeof data.note === "string" ? data.note : "",
      };
    });
    onData(rows);
  });
}

export function subscribeItems(onData: (items: SessionItem[]) => void) {
  return onSnapshot(query(ITEMS_PATH, orderBy("text", "asc")), (snapshot) => {
    const rows: SessionItem[] = snapshot.docs
      .map((entry) => ({
        id: entry.id,
        type: entry.data().type as ItemType,
        text: entry.data().text as string,
      }))
      .filter(
        (item) =>
          typeof item.text === "string" &&
          ["nonNegotiable", "constraint", "question", "risk", "action"].includes(item.type)
      );
    onData(rows);
  });
}

export async function updateSessionField(field: SessionField, value: string) {
  await updateDoc(SESSION_PATH, { [field]: value });
}

export async function addSessionItem(type: ItemType, text: string) {
  await addDoc(ITEMS_PATH, { type, text });
}

export async function updateSessionItem(id: string, text: string) {
  await updateDoc(doc(ITEMS_PATH, id), { text });
}

export async function deleteSessionItem(id: string) {
  await deleteDoc(doc(ITEMS_PATH, id));
}

export async function updateFeature(
  featureId: string,
  patch: Partial<Pick<Feature, "name" | "bucket" | "priority" | "status" | "domain" | "note">>
) {
  await updateDoc(doc(FEATURES_PATH, featureId), patch);
}

export async function addFeature(feature: Omit<Feature, "id">) {
  await addDoc(FEATURES_PATH, feature);
}

export async function deleteFeature(featureId: string) {
  await deleteDoc(doc(FEATURES_PATH, featureId));
}
