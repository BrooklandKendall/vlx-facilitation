import { FEATURE_DOMAINS, P_LABEL, S_LABEL, type Feature } from "../../types";

const PRIORITIES: Array<Feature["priority"]> = ["high", "med", "low"];
const STATUSES: Array<Feature["status"]> = ["full", "part", "new"];
const BUCKET_OPTIONS: Array<{ value: Feature["bucket"]; label: string }> = [
  { value: "mvp", label: "MVP / Pilot" },
  { value: "v2x", label: "VLx 2.x" },
  { value: "def", label: "Deferred" },
];

interface FeatureBoardProps {
  features: Feature[];
  filterDomain: string;
  onFilterDomain: (domain: string) => void;
  onUpdateFeature: (
    featureId: string,
    patch: Partial<Pick<Feature, "bucket" | "priority" | "status" | "domain" | "note">>
  ) => Promise<void>;
}

export function FeatureBoard({ features, filterDomain, onFilterDomain, onUpdateFeature }: FeatureBoardProps) {
  const visible = filterDomain === "all" ? features : features.filter((feature) => feature.domain === filterDomain);
  const sortedByTitle = [...visible].sort((left, right) => left.name.localeCompare(right.name));
  const counts = {
    mvp: features.filter((feature) => feature.bucket === "mvp").length,
    v2x: features.filter((feature) => feature.bucket === "v2x").length,
    def: features.filter((feature) => feature.bucket === "def").length,
  };

  return (
    <div>
      <div className="ctrl-row">
        <label htmlFor="domain-filter">Filter:</label>
        <select id="domain-filter" value={filterDomain} onChange={(event) => onFilterDomain(event.target.value)}>
          <option value="all">All domains</option>
          {FEATURE_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      <div className="legend">
        <span className="legend-title">Card controls:</span>
        <span className="legend-item">Bucket controls column placement</span>
        <span className="legend-item">
          <span className="badge b-high">High</span>
          <span className="badge b-med">Med</span>
          <span className="badge b-low">Low</span> priority
        </span>
        <span className="legend-item">
          <span className="badge b-full">Built</span>
          <span className="badge b-part">Partial</span>
          <span className="badge b-new">New</span> status
        </span>
      </div>

      <div className="col-wrap">
        {[
          { key: "mvp", title: "MVP / Pilot", color: "mvp", count: counts.mvp },
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
                  <div className="feat-name">{feature.name}</div>
                  <div className="feat-controls">
                    <label className="feat-field">
                      <span>Domain</span>
                      <select
                        className="feat-select"
                        value={feature.domain}
                        onChange={(event) => void onUpdateFeature(feature.id, { domain: event.target.value })}
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
                          void onUpdateFeature(feature.id, { priority: event.target.value as Feature["priority"] })
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
                      <span>Status</span>
                      <select
                        className={`feat-select status-${feature.status}`}
                        value={feature.status}
                        onChange={(event) =>
                          void onUpdateFeature(feature.id, { status: event.target.value as Feature["status"] })
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
                    <input
                      defaultValue={feature.note}
                      placeholder="Add note..."
                      onBlur={(event) => void onUpdateFeature(feature.id, { note: event.target.value })}
                    />
                  </div>
                  <div className="feat-bucket">
                    <label className="feat-field">
                      <div className="bucket-toggle" role="group" aria-label={`Set bucket for ${feature.name}`}>
                        {BUCKET_OPTIONS.map((bucket) => (
                          <button
                            key={bucket.value}
                            type="button"
                            className={`bucket-btn bucket-${bucket.value} ${feature.bucket === bucket.value ? "active" : ""}`}
                            aria-pressed={feature.bucket === bucket.value}
                            onClick={() => void onUpdateFeature(feature.id, { bucket: bucket.value })}
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
