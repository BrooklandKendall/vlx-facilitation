export type FeatureBucket = "mvp" | "v2x" | "def";
export type FeaturePriority = "high" | "med" | "low";
export type FeatureStatus = "full" | "part" | "new";

export type SessionField =
  | "personaCareRecipient"
  | "personaFamilyCaregiver"
  | "personaCoordinator"
  | "successCriteria";

export type ItemType = "nonNegotiable" | "constraint" | "question" | "risk" | "action";

export interface SessionDoc {
  personaCareRecipient: string;
  personaFamilyCaregiver: string;
  personaCoordinator: string;
  successCriteria: string;
}

export interface FeatureSeed {
  seedId: number;
  name: string;
  domain: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  bucket: FeatureBucket;
  note: string;
}

export interface Feature extends FeatureSeed {
  id: string;
}

export interface SessionItem {
  id: string;
  type: ItemType;
  text: string;
}

export const P_LABEL: Record<FeaturePriority, string> = {
  high: "High",
  med: "Med",
  low: "Low",
};

export const S_LABEL: Record<FeatureStatus, string> = {
  full: "Built",
  part: "Partial",
  new: "New",
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  nonNegotiable: "Non-negotiables",
  constraint: "Constraints",
  question: "Open questions",
  risk: "Risks",
  action: "Action items",
};

export const FEATURE_DOMAINS = [
  "Platform",
  "Vitals",
  "Safety",
  "AI",
  "Wellness",
  "Medication",
  "Communications",
  "Care Coordination",
  "Caregiver",
  "Social",
  "Privacy",
  "Analytics",
] as const;
