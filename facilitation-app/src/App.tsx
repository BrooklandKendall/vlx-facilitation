import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { AppShell, type ActiveTab } from "./components/AppShell";
import { AgendaTab } from "./components/tabs/AgendaTab";
import { FeatureBoard } from "./components/tabs/FeatureBoard";
import { NorthStarTab } from "./components/tabs/NorthStarTab";
import { RisksTab } from "./components/tabs/RisksTab";
import { SummaryTab } from "./components/tabs/SummaryTab";
import { db } from "./firebase";
import {
  addFeature,
  addSessionItem,
  deleteFeature,
  deleteSessionItem,
  ensureSessionDoc,
  subscribeFeatures,
  subscribeItems,
  subscribeSession,
  updateFeature,
  updateSessionField,
  updateSessionItem,
} from "./data/firestore";
import {
  ITEM_TYPE_LABELS,
  P_LABEL,
  S_LABEL,
  type Feature,
  type ItemType,
  type SessionDoc,
  type SessionItem,
} from "./types";

type ExportSession = {
  id: string;
  data: Record<string, unknown>;
  features: Array<Record<string, unknown> & { id: string }>;
  items: Array<Record<string, unknown> & { id: string }>;
};

function generateSummary(session: SessionDoc, features: Feature[], items: SessionItem[]) {
  const mvp = features.filter((feature) => feature.bucket === "mvp");
  const v2x = features.filter((feature) => feature.bucket === "v2x");
  const deferred = features.filter((feature) => feature.bucket === "def");
  const byType = (type: ItemType) => items.filter((item) => item.type === type);
  const lines: string[] = [];

  const writeFeatureGroup = (title: string, list: Feature[]) => {
    lines.push(`${title} (${list.length} features)`);
    const domains = [...new Set(list.map((feature) => feature.domain))];
    for (const domain of domains) {
      lines.push(`  ${domain}`);
      for (const feature of list.filter((entry) => entry.domain === domain)) {
        const detail = `    - ${feature.name} [${P_LABEL[feature.priority]} / ${S_LABEL[feature.status]}]`;
        lines.push(feature.note ? `${detail} - ${feature.note}` : detail);
      }
    }
    lines.push("");
  };

  lines.push("VLX 2.0 - REQUIREMENTS SESSION OUTPUT");
  lines.push("=".repeat(52));
  lines.push("");
  if (byType("nonNegotiable").length > 0) {
    lines.push("NON-NEGOTIABLES");
    lines.push(...byType("nonNegotiable").map((item) => `  - ${item.text}`));
    lines.push("");
  }
  if (byType("constraint").length > 0) {
    lines.push("CONSTRAINTS");
    lines.push(...byType("constraint").map((item) => `  - ${item.text}`));
    lines.push("");
  }
  if (session.successCriteria.trim()) {
    lines.push("SUCCESS CRITERIA");
    lines.push(`  ${session.successCriteria.trim()}`);
    lines.push("");
  }
  writeFeatureGroup("MVP FEATURE SET", mvp);
  writeFeatureGroup("VLX 2.X ROADMAP", v2x);
  lines.push(`DEFERRED (${deferred.length} features)`);
  lines.push(...deferred.map((feature) => `  - ${feature.name} [${P_LABEL[feature.priority]} / ${S_LABEL[feature.status]}]`));
  lines.push("");

  (["question", "risk", "action"] as ItemType[]).forEach((type) => {
    const list = byType(type);
    if (list.length > 0) {
      lines.push(ITEM_TYPE_LABELS[type].toUpperCase());
      lines.push(...list.map((item, index) => `  ${index + 1}. ${item.text}`));
      lines.push("");
    }
  });

  return lines.join("\n").trimEnd();
}

function downloadTextFile(filename: string, content: string, contentType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fetchSessionsDump(): Promise<ExportSession[]> {
  const sessionsSnap = await getDocs(collection(db, "sessions"));
  const out: ExportSession[] = [];

  for (const sessionDoc of sessionsSnap.docs) {
    const [featuresSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, "sessions", sessionDoc.id, "features")),
      getDocs(collection(db, "sessions", sessionDoc.id, "items")),
    ]);

    out.push({
      id: sessionDoc.id,
      data: sessionDoc.data(),
      features: featuresSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })),
      items: itemsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })),
    });
  }

  return out;
}

function buildPrdAgentInstructions() {
  return {
    objective:
      "Use the included Firestore dump to generate a Product Requirements Document (PRD) and deliver it as a PDF report.",
    output: {
      format: "PDF",
      documentType: "Product Requirements Document",
      language: "English",
      tone: "Concise, implementation-ready, and executive-readable",
    },
    requiredSections: [
      "Executive Summary",
      "Problem Statement",
      "Personas and Roles",
      "Success Criteria",
      "Non-negotiables and Constraints",
      "Feature Scope (MVP, VLx 2.x, Deferred)",
      "Open Questions",
      "Risks and Mitigations",
      "Action Items and Owners",
      "Release Readiness Recommendations",
    ],
    dataMapping: {
      sessions: "Use each sessions entry as a planning context. Prioritize sessions/default when present.",
      personaFields:
        "Use personaCareRecipient, personaCareRecipientRoles, personaFamilyCaregiver, personaFamilyCaregiverRoles, personaCoordinator, and personaCoordinatorRoles in Persona and Role sections.",
      successCriteria: "Use successCriteria as measurable outcomes.",
      items:
        "Use items grouped by type: nonNegotiable, constraint, question, risk, action. Preserve wording and convert to polished report language.",
      features:
        "Group features by bucket (mvp, v2x, def), then domain, and include priority/status signal in scope and roadmap sections.",
    },
    formattingGuidelines: [
      "Use clear section headings and concise bullet points.",
      "Call out assumptions when source data is incomplete.",
      "Do not invent metrics; infer only from provided data.",
      "Include a final one-page implementation checklist in the PDF appendix.",
    ],
  };
}

function buildPrdAgentGuidanceText() {
  const instructions = buildPrdAgentInstructions();

  return [
    "VLX PRD AI GUIDANCE",
    "===================",
    "",
    `Objective: ${instructions.objective}`,
    "",
    "Output Requirements",
    `- Format: ${instructions.output.format}`,
    `- Document Type: ${instructions.output.documentType}`,
    `- Language: ${instructions.output.language}`,
    `- Tone: ${instructions.output.tone}`,
    "",
    "Required Sections",
    ...instructions.requiredSections.map((section) => `- ${section}`),
    "",
    "Source Data Mapping",
    `- Sessions: ${instructions.dataMapping.sessions}`,
    `- Persona Fields: ${instructions.dataMapping.personaFields}`,
    `- Success Criteria: ${instructions.dataMapping.successCriteria}`,
    `- Items: ${instructions.dataMapping.items}`,
    `- Features: ${instructions.dataMapping.features}`,
    "",
    "Formatting Guidance",
    ...instructions.formattingGuidelines.map((guideline) => `- ${guideline}`),
    "",
  ].join("\n");
}

function buildDbExportPayload(sessions: ExportSession[]) {
  return {
    exportedAt: new Date().toISOString(),
    source: "facilitation-app",
    collections: { sessions },
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("agenda");
  const [session, setSession] = useState<SessionDoc>({
    personaCareRecipient: "",
    personaCareRecipientRoles: "",
    personaFamilyCaregiver: "",
    personaFamilyCaregiverRoles: "",
    personaCoordinator: "",
    personaCoordinatorRoles: "",
    successCriteria: "",
  });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [featureDomain, setFeatureDomain] = useState<string>("all");
  const [summaryText, setSummaryText] = useState<string>("Click \"Generate session output\" to compile all captured decisions.");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let stopSession = () => {};
    let stopFeatures = () => {};
    let stopItems = () => {};

    const start = async () => {
      try {
        await ensureSessionDoc();
        stopSession = subscribeSession(setSession);
        stopFeatures = subscribeFeatures(setFeatures);
        stopItems = subscribeItems(setItems);
        setIsReady(true);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to initialize Firebase data.";
        setError(message);
      }
    };

    void start();
    return () => {
      stopSession();
      stopFeatures();
      stopItems();
    };
  }, []);

  const counts = useMemo(
    () => ({
      mvp: features.filter((feature) => feature.bucket === "mvp").length,
      v2x: features.filter((feature) => feature.bucket === "v2x").length,
      def: features.filter((feature) => feature.bucket === "def").length,
    }),
    [features]
  );

  const itemsByType = useMemo(
    () => ({
      nonNegotiable: items.filter((item) => item.type === "nonNegotiable"),
      constraint: items.filter((item) => item.type === "constraint"),
      question: items.filter((item) => item.type === "question"),
      risk: items.filter((item) => item.type === "risk"),
      action: items.filter((item) => item.type === "action"),
    }),
    [items]
  );

  const onExport = () => {
    downloadTextFile("vlx-session-output.txt", summaryText);
  };

  return (
    <AppShell activeTab={activeTab} onChangeTab={setActiveTab}>
      {error ? <div className="error-banner">{error}</div> : null}
      {!isReady && !error ? <div className="loading-banner">Connecting to Firestore...</div> : null}

      {activeTab === "agenda" ? <AgendaTab counts={counts} /> : null}
      {activeTab === "northstar" ? (
        <NorthStarTab
          session={session}
          nonNegotiables={itemsByType.nonNegotiable}
          constraints={itemsByType.constraint}
          onSaveSessionField={updateSessionField}
          onAddTag={addSessionItem}
          onUpdateTag={updateSessionItem}
          onDeleteTag={deleteSessionItem}
        />
      ) : null}
      {activeTab === "features" ? (
        <FeatureBoard
          features={features}
          filterDomain={featureDomain}
          onFilterDomain={setFeatureDomain}
          onAddFeature={async (name, domain, bucket) => {
            const nextSeedId = features.reduce((max, feature) => Math.max(max, feature.seedId), 0) + 1;
            await addFeature({
              seedId: nextSeedId,
              name,
              domain,
              priority: "med",
              status: "new",
              bucket,
              note: "",
            });
          }}
          onDeleteFeature={deleteFeature}
          onUpdateFeature={updateFeature}
        />
      ) : null}
      {activeTab === "risks" ? (
        <RisksTab
          questions={itemsByType.question}
          risks={itemsByType.risk}
          actions={itemsByType.action}
          onAddItem={addSessionItem}
          onUpdateItem={updateSessionItem}
          onDeleteItem={deleteSessionItem}
        />
      ) : null}
      {activeTab === "summary" ? (
        <SummaryTab
          summaryText={summaryText}
          onGenerate={() => setSummaryText(generateSummary(session, features, items))}
          onCopy={async () => {
            try {
              await navigator.clipboard.writeText(summaryText);
            } catch {
              // Clipboard writes can fail in non-secure localhost contexts.
            }
          }}
          onExport={onExport}
          onExportPrdJson={async () => {
            try {
              const sessions = await fetchSessionsDump();
              const payload = buildDbExportPayload(sessions);
              downloadTextFile(
                "prd-source-db.json",
                `${JSON.stringify(payload, null, 2)}\n`,
                "application/json;charset=utf-8"
              );
              downloadTextFile("prd-ai-guidance.txt", buildPrdAgentGuidanceText());
            } catch (caught) {
              const message = caught instanceof Error ? caught.message : "Unknown export error";
              setError(`PRD package export failed: ${message}`);
            }
          }}
          onExportDbJson={async () => {
            try {
              const sessions = await fetchSessionsDump();
              const payload = buildDbExportPayload(sessions);
              downloadTextFile(
                "firestore-dump.json",
                `${JSON.stringify(payload, null, 2)}\n`,
                "application/json;charset=utf-8"
              );
            } catch (caught) {
              const message = caught instanceof Error ? caught.message : "Unknown export error";
              setError(`Database export failed: ${message}`);
            }
          }}
          onExportDbFirestore={async () => {
            try {
              const sessions = await fetchSessionsDump();
              const collectionMap: Record<string, Record<string, Record<string, unknown>>> = {
                sessions: {},
              };

              for (const session of sessions) {
                const featuresMap: Record<string, Record<string, unknown>> = {};
                const itemsMap: Record<string, Record<string, unknown>> = {};
                for (const feature of session.features) {
                  const { id, ...data } = feature;
                  featuresMap[id] = data;
                }
                for (const item of session.items) {
                  const { id, ...data } = item;
                  itemsMap[id] = data;
                }

                collectionMap.sessions[session.id] = {
                  ...session.data,
                  __collections__: {
                    features: featuresMap,
                    items: itemsMap,
                  },
                };
              }

              downloadTextFile(
                "firestore-export-nested.json",
                `${JSON.stringify(collectionMap, null, 2)}\n`,
                "application/json;charset=utf-8"
              );
            } catch (caught) {
              const message = caught instanceof Error ? caught.message : "Unknown export error";
              setError(`Firestore-format export failed: ${message}`);
            }
          }}
        />
      ) : null}
    </AppShell>
  );
}

export default App;
