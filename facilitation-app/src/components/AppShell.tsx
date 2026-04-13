import type { PropsWithChildren } from "react";

export type ActiveTab = "agenda" | "northstar" | "features" | "epics" | "risks" | "summary";

interface AppShellProps extends PropsWithChildren {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "agenda", label: "Agenda" },
  { id: "northstar", label: "North star" },
  { id: "features", label: "Feature sort" },
  { id: "epics", label: "Epics" },
  { id: "risks", label: "Open questions" },
  { id: "summary", label: "Session output" },
];

export function AppShell({ activeTab, onChangeTab, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onChangeTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">{children}</div>
    </div>
  );
}
