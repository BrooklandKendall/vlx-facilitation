import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "vivalynx-tasks";

const FEATURE_SEED = [
  { seedId: 1, name: "Multi-Device App Platform", domain: "Platform", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 2, name: "Administrative Web Console", domain: "Platform", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 3, name: "Onboarding & Setup Flow", domain: "Platform", priority: "high", status: "part", bucket: "mvp", note: "" },
  { seedId: 4, name: "Offline Mode & Low-Bandwidth Support", domain: "Platform", priority: "med", status: "new", bucket: "v2x", note: "" },
  { seedId: 5, name: "Facial Scan Vitals (Mia Health)", domain: "Vitals", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 6, name: "Connected Device Vitals", domain: "Vitals", priority: "high", status: "full", bucket: "v2x", note: "" },
  { seedId: 7, name: "AI Biometric Analytics", domain: "Vitals", priority: "high", status: "full", bucket: "v2x", note: "" },
  { seedId: 8, name: "Role-Based Vitals Reporting", domain: "Vitals", priority: "med", status: "full", bucket: "mvp", note: "" },
  { seedId: 9, name: "Population Health Dashboard", domain: "Vitals", priority: "med", status: "new", bucket: "v2x", note: "" },
  { seedId: 10, name: "Proof-of-Life Check-In", domain: "Safety", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 11, name: "Fall Detection", domain: "Safety", priority: "high", status: "part", bucket: "v2x", note: "" },
  { seedId: 12, name: "Emergency Telemedicine Access", domain: "Safety", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 13, name: "Environmental Sensors Integration", domain: "Safety", priority: "med", status: "part", bucket: "def", note: "" },
  { seedId: 14, name: "911 & Emergency Services Integration", domain: "Safety", priority: "med", status: "new", bucket: "def", note: "" },
  { seedId: 15, name: "Agentic AI Core (Mia Health)", domain: "AI", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 16, name: "Health Risk Identification", domain: "AI", priority: "high", status: "part", bucket: "v2x", note: "" },
  { seedId: 17, name: "Behavioral Nudge Engine", domain: "AI", priority: "med", status: "part", bucket: "v2x", note: "" },
  { seedId: 18, name: "Voice AI Assistant", domain: "AI", priority: "med", status: "new", bucket: "def", note: "" },
  { seedId: 19, name: "Multilingual & Cultural Adaptation", domain: "AI", priority: "low", status: "new", bucket: "def", note: "" },
  { seedId: 20, name: "Proprietary Wellness Score", domain: "Wellness", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 21, name: "Health Education Content Library", domain: "Wellness", priority: "med", status: "full", bucket: "v2x", note: "" },
  { seedId: 22, name: "Stress Detection", domain: "Wellness", priority: "med", status: "part", bucket: "v2x", note: "" },
  { seedId: 23, name: "Medication Tracking & Sharing", domain: "Medication", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 24, name: "Medication Reminders", domain: "Medication", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 25, name: "Video Conferencing", domain: "Communications", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 26, name: "Content Sharing (Photos/Docs/Videos)", domain: "Communications", priority: "med", status: "full", bucket: "v2x", note: "" },
  { seedId: 27, name: "Care Team Messaging", domain: "Communications", priority: "med", status: "part", bucket: "v2x", note: "" },
  { seedId: 28, name: "Shared Calendar", domain: "Care Coordination", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 29, name: "To-Do List & Care Tasks", domain: "Care Coordination", priority: "med", status: "full", bucket: "v2x", note: "" },
  { seedId: 30, name: "Caregiver Activity Logs (EVV)", domain: "Care Coordination", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 31, name: "Secure Document Vault", domain: "Care Coordination", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 32, name: "EHR / Provider Integration", domain: "Care Coordination", priority: "high", status: "new", bucket: "def", note: "" },
  { seedId: 33, name: "Longitudinal Care Timeline", domain: "Care Coordination", priority: "med", status: "part", bucket: "v2x", note: "" },
  { seedId: 34, name: "Family Caregiver App", domain: "Caregiver", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 35, name: "Caregiver Support Resources", domain: "Caregiver", priority: "med", status: "full", bucket: "v2x", note: "" },
  { seedId: 36, name: "Notification & Alert Management", domain: "Caregiver", priority: "med", status: "part", bucket: "mvp", note: "" },
  { seedId: 37, name: "Senior Activity & Learning (GetSetUp)", domain: "Social", priority: "med", status: "full", bucket: "v2x", note: "" },
  { seedId: 38, name: "Daily Routine & ADL Tracking", domain: "Social", priority: "med", status: "part", bucket: "v2x", note: "" },
  { seedId: 39, name: "Senior Social Connection", domain: "Social", priority: "low", status: "new", bucket: "def", note: "" },
  { seedId: 40, name: "Privacy-Forward Video (Consent-Only)", domain: "Privacy", priority: "high", status: "full", bucket: "mvp", note: "" },
  { seedId: 41, name: "HIPAA Compliance Certification", domain: "Privacy", priority: "high", status: "part", bucket: "mvp", note: "" },
  { seedId: 42, name: "Role-Based Access Control + Audit Trail", domain: "Privacy", priority: "high", status: "part", bucket: "mvp", note: "" },
  { seedId: 43, name: "Feature Usage Analytics Dashboard", domain: "Analytics", priority: "high", status: "new", bucket: "mvp", note: "" },
  { seedId: 44, name: "In-App Feedback & NPS System", domain: "Analytics", priority: "high", status: "new", bucket: "v2x", note: "" },
  { seedId: 45, name: "Clinical Trial Cohort Management", domain: "Analytics", priority: "high", status: "new", bucket: "v2x", note: "" },
  { seedId: 46, name: "ER Avoidance & Acute Event Capture", domain: "Analytics", priority: "high", status: "part", bucket: "v2x", note: "" },
  { seedId: 47, name: "System Health Monitoring & Error Telemetry", domain: "Analytics", priority: "high", status: "new", bucket: "mvp", note: "" },
  { seedId: 48, name: "A/B Testing Infrastructure", domain: "Analytics", priority: "med", status: "new", bucket: "def", note: "" },
  { seedId: 49, name: "Research Data Export & Open API", domain: "Analytics", priority: "med", status: "new", bucket: "def", note: "" },
];

const DEFAULT_SESSION = {
  personaCareRecipient: "",
  personaCareRecipientRoles: "",
  personaFamilyCaregiver: "",
  personaFamilyCaregiverRoles: "",
  personaCoordinator: "",
  personaCoordinatorRoles: "",
  successCriteria: "",
};

const ITEM_SEED = [
  { type: "nonNegotiable", text: "HIPAA-compliant handling of workshop data." },
  { type: "nonNegotiable", text: "Simple onboarding for low-tech users and caregivers." },
  { type: "constraint", text: "MVP scope and timeline must fit implementation windows." },
  { type: "constraint", text: "Initial rollout should prioritize lowest operational overhead." },
  { type: "question", text: "Which outcomes are mandatory for MVP success sign-off?" },
  { type: "question", text: "Which integrations are required for day-one reporting?" },
  { type: "risk", text: "Data quality and missing inputs could reduce confidence in MVP analytics." },
  { type: "action", text: "Confirm final success metrics and owners before go-live." },
];

async function main() {
  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  await db.doc("sessions/default").set(DEFAULT_SESSION);
  const batch = db.batch();
  for (const feature of FEATURE_SEED) {
    batch.set(db.collection("sessions/default/features").doc(), feature);
  }
  for (const item of ITEM_SEED) {
    batch.set(db.collection("sessions/default/items").doc(), item);
  }
  await batch.commit();
  console.log(
    `Seed complete for project ${projectId}: ${FEATURE_SEED.length} features, ${ITEM_SEED.length} items.`
  );
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error?.message ?? error);
  console.error("If this is an auth issue, run: gcloud auth application-default login");
  process.exit(1);
});
