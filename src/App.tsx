import { useEffect, useMemo, useState } from "react";
import { AppShell, type ActiveTab } from "./components/AppShell";
import { AgendaTab } from "./components/tabs/AgendaTab";
import { FeatureBoard } from "./components/tabs/FeatureBoard";
import { NorthStarTab } from "./components/tabs/NorthStarTab";
import { RisksTab } from "./components/tabs/RisksTab";
import { SummaryTab } from "./components/tabs/SummaryTab";
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

  lines.push("VLX 2.0 / NYSOFA PILOT - REQUIREMENTS SESSION OUTPUT");
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

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("agenda");
  const [session, setSession] = useState<SessionDoc>({
    personaCareRecipient: "",
    personaFamilyCaregiver: "",
    personaCoordinator: "",
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
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vlx-session-output.txt";
    anchor.click();
    URL.revokeObjectURL(url);
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
          onAddFeature={async (name, domain) => {
            const nextSeedId = features.reduce((max, feature) => Math.max(max, feature.seedId), 0) + 1;
            await addFeature({
              seedId: nextSeedId,
              name,
              domain,
              priority: "med",
              status: "new",
              bucket: "def",
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
        />
      ) : null}
    </AppShell>
  );
}

export default App;
