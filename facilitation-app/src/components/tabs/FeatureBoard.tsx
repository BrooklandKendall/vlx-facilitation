import { useMemo, useState } from "react";

import { FEATURE_DOMAINS, P_LABEL, S_LABEL, type Feature } from "../../types";

const PRIORITIES: Array<Feature["priority"]> = ["high", "med", "low"];
const STATUSES: Array<Feature["status"]> = ["full", "part", "new"];
const TSHIRT_SIZES: Array<Feature["tshirt"]> = ["xs", "s", "m", "l", "xl"];
const BUCKET_OPTIONS: Array<{ value: Feature["bucket"]; label: string }> = [
  { value: "mvp", label: "MVP" },
  { value: "v2x", label: "VLx 2.x" },
  { value: "def", label: "Deferred" },
];

interface FeatureBoardProps {
  features: Feature[];
  filterDomain: string;
  epicOptions: string[];
  onFilterDomain: (domain: string) => void;
  onAddFeature: (name: string, domain: string, bucket: Feature["bucket"]) => Promise<void>;
  onDeleteFeature: (featureId: string) => Promise<void>;
  onUpdateFeature: (
    featureId: string,
    patch: Partial<
      Pick<
        Feature,
        "name" | "bucket" | "priority" | "status" | "domain" | "note" | "tshirt" | "epic"
      >
    >
  ) => Promise<void>;
}

export function FeatureBoard({
  features,
  filterDomain,
  epicOptions,
  onFilterDomain,
  onAddFeature,
  onDeleteFeature,
  onUpdateFeature,
}: FeatureBoardProps) {
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDomain, setNewFeatureDomain] = useState<string>("");
  const [newFeatureBucket, setNewFeatureBucket] = useState<string>("");
  const [selectedEpics, setSelectedEpics] = useState<string[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const allEpicsForFilter = useMemo(
    () =>
      [...new Set([...epicOptions, ...features.flatMap((feature) => feature.epic)])].sort((left, right) =>
        left.localeCompare(right)
      ),
    [epicOptions, features]
  );
  const visible = features.filter((feature) => {
    const domainMatch = filterDomain === "all" || feature.domain === filterDomain;
    const noEpicFilters = selectedEpics.length === 0 && !showUnassigned;
    const epicMatch = noEpicFilters
      || (showUnassigned && feature.epic.length === 0)
      || feature.epic.some((epic) => selectedEpics.includes(epic));
    return domainMatch && epicMatch;
  });
  const sortedByTitle = [...visible].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
  const counts = {
    mvp: features.filter((feature) => feature.bucket === "mvp").length,
    v2x: features.filter((feature) => feature.bucket === "v2x").length,
    def: features.filter((feature) => feature.bucket === "def").length,
  };
  const submitNewFeature = async () => {
    const cleaned = newFeatureName.trim();
    if (!cleaned) {
      window.alert("Feature name is required.");
      return;
    }
    if (!newFeatureDomain.trim()) {
      window.alert("Feature domain is required.");
      return;
    }
    if (!newFeatureBucket.trim()) {
      window.alert("Feature bucket is required.");
      return;
    }
    await onAddFeature(cleaned, newFeatureDomain, newFeatureBucket as Feature["bucket"]);
    setNewFeatureName("");
    setNewFeatureDomain("");
    setNewFeatureBucket("");
  };
  const toggleFeatureEpic = async (feature: Feature, epic: string) => {
    const hasEpic = feature.epic.includes(epic);
    const nextEpics = hasEpic
      ? feature.epic.filter((entry) => entry !== epic)
      : [...feature.epic, epic];
    await onUpdateFeature(feature.id, { epic: nextEpics });
  };
  const toggleEpicFilter = (epic: string) => {
    setSelectedEpics((current) =>
      current.includes(epic) ? current.filter((entry) => entry !== epic) : [...current, epic]
    );
  };

  return (
    <div>
      <div className="ctrl-row">
        <label htmlFor="domain-filter">Filter:</label>
        <select
          id="domain-filter"
          value={filterDomain}
          onChange={(event) => onFilterDomain(event.target.value)}
        >
          <option value="all">All domains</option>
          {FEATURE_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>
      <div className="ctrl-row">
        <span>Filter epics:</span>
        <label>
          <input
            type="checkbox"
            checked={showUnassigned}
            onChange={() => setShowUnassigned((v) => !v)}
          />
          No epic
        </label>
        {allEpicsForFilter.length === 0 ? (
          <span>No epics available</span>
        ) : (
          allEpicsForFilter.map((epic) => (
            <label key={epic}>
              <input
                type="checkbox"
                checked={selectedEpics.includes(epic)}
                onChange={() => toggleEpicFilter(epic)}
              />
              {epic}
            </label>
          ))
        )}
        {selectedEpics.length > 0 || showUnassigned ? (
          <button
            type="button"
            className="btn"
            onClick={() => { setSelectedEpics([]); setShowUnassigned(false); }}
          >
            Clear epic filters
          </button>
        ) : null}
      </div>

      <div className="ctrl-row">
        <span>Add feature:</span>
        <label htmlFor="new-feature-name">Feature name:</label>
        <input
          id="new-feature-name"
          className="input"
          value={newFeatureName}
          onChange={(event) => setNewFeatureName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitNewFeature();
            }
          }}
          placeholder="New feature name..."
        />
        <label htmlFor="new-feature-domain">Domain:</label>
        <select
          id="new-feature-domain"
          value={newFeatureDomain}
          onChange={(event) => setNewFeatureDomain(event.target.value)}
        >
          <option value="">Select Domain</option>
          {FEATURE_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
        <label htmlFor="new-feature-bucket">Bucket:</label>
        <select
          id="new-feature-bucket"
          value={newFeatureBucket}
          onChange={(event) => setNewFeatureBucket(event.target.value)}
        >
          <option value="">Select Bucket</option>
          {BUCKET_OPTIONS.map((bucket) => (
            <option key={bucket.value} value={bucket.value}>
              {bucket.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn"
          onClick={() => void submitNewFeature()}
        >
          Add feature
        </button>
      </div>
      <div className="col-wrap">
        {[
          { key: "mvp", title: "MVP", color: "mvp", count: counts.mvp },
          { key: "v2x", title: "VLx 2.x", color: "v2x", count: counts.v2x },
          { key: "def", title: "Deferred", color: "def", count: counts.def },
        ].map((column) => (
          <div key={column.key} className="col">
            <div className={`col-hdr ${column.color}`}>
              {column.title} <span className="col-count">({column.count})</span>
            </div>
            {sortedByTitle
              .filter((feature) => feature.bucket === column.key)
              .map((feature) => (
                <div key={feature.id} className="feat-card">
                  <div className="feat-card-top">
                    <input
                      className="feat-name-input"
                      defaultValue={feature.name}
                      placeholder="Feature name"
                      onBlur={(event) => {
                        const trimmed = event.target.value.trim();
                        if (!trimmed) {
                          event.target.value = feature.name;
                          return;
                        }
                        if (trimmed !== feature.name) {
                          void onUpdateFeature(feature.id, { name: trimmed });
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="del"
                      onClick={() => {
                        const confirmed = window.confirm(`Remove feature "${feature.name}"?`);
                        if (!confirmed) return;
                        void onDeleteFeature(feature.id);
                      }}
                    >
                      remove
                    </button>
                  </div>
                  <div className="feat-controls">
                    <label className="feat-field">
                      <span>Domain</span>
                      <select
                        className="feat-select"
                        value={feature.domain}
                        onChange={(event) =>
                          void onUpdateFeature(feature.id, {
                            domain: event.target.value,
                          })
                        }
                      >
                        {FEATURE_DOMAINS.map((domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="feat-field">
                      <span>Priority</span>
                      <select
                        className={`feat-select priority-${feature.priority}`}
                        value={feature.priority}
                        onChange={(event) =>
                          void onUpdateFeature(feature.id, {
                            priority: event.target.value as Feature["priority"],
                          })
                        }
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {P_LABEL[priority]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="feat-field">
                      <span>T-shirt</span>
                      <select
                        className="feat-select"
                        value={feature.tshirt}
                        onChange={(event) =>
                          void onUpdateFeature(feature.id, {
                            tshirt: event.target.value as Feature["tshirt"],
                          })
                        }
                      >
                        {TSHIRT_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="feat-field">
                      <span>Status</span>
                      <select
                        className={`feat-select status-${feature.status}`}
                        value={feature.status}
                        onChange={(event) =>
                          void onUpdateFeature(feature.id, {
                            status: event.target.value as Feature["status"],
                          })
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {S_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="feat-note">
                    <textarea
                      className="feat-note-input"
                      rows={2}
                      defaultValue={feature.note}
                      placeholder="Add note..."
                      onBlur={(event) =>
                        void onUpdateFeature(feature.id, {
                          note: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="feat-note">
                    <div className="feat-field">
                      <span>Epics</span>
                    </div>
                    {epicOptions.length === 0 ? (
                      <span>Create epics above to assign them.</span>
                    ) : (
                      <div className="ctrl-row">
                        {[...epicOptions].sort((a, b) => a.localeCompare(b)).map((epic) => (
                          <label key={`${feature.id}-${epic}`}>
                            <input
                              type="checkbox"
                              checked={feature.epic.includes(epic)}
                              onChange={() => void toggleFeatureEpic(feature, epic)}
                            />
                            {epic}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="feat-bucket">
                    <label className="feat-field">
                      <div
                        className="bucket-toggle"
                        role="group"
                        aria-label={`Set bucket for ${feature.name}`}
                      >
                        {BUCKET_OPTIONS.map((bucket) => (
                          <button
                            key={bucket.value}
                            type="button"
                            className={`bucket-btn bucket-${bucket.value} ${
                              feature.bucket === bucket.value ? "active" : ""
                            }`}
                            aria-pressed={feature.bucket === bucket.value}
                            onClick={() =>
                              void onUpdateFeature(feature.id, {
                                bucket: bucket.value,
                              })
                            }
                          >
                            {bucket.label}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
