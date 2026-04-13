import { useState } from "react";

import type { Feature } from "../../types";

interface EpicsTabProps {
  epicOptions: string[];
  features: Feature[];
  onSaveEpicOptions: (epics: string[]) => Promise<void>;
  onUpdateFeature: (
    featureId: string,
    patch: Partial<Pick<Feature, "epic">>
  ) => Promise<void>;
}

export function EpicsTab({ epicOptions, features, onSaveEpicOptions, onUpdateFeature }: EpicsTabProps) {
  const [newEpicName, setNewEpicName] = useState("");
  const [editEpicDrafts, setEditEpicDrafts] = useState<Record<string, string>>({});

  const addEpicOption = async () => {
    const cleaned = newEpicName.trim();
    if (!cleaned) {
      window.alert("Epic name is required.");
      return;
    }
    if (epicOptions.some((epic) => epic.toLowerCase() === cleaned.toLowerCase())) {
      window.alert("Epic already exists.");
      return;
    }
    await onSaveEpicOptions([...epicOptions, cleaned]);
    setNewEpicName("");
  };

  const renameEpicOption = async (oldEpic: string) => {
    const draft = (editEpicDrafts[oldEpic] ?? oldEpic).trim();
    if (!draft) {
      window.alert("Epic name is required.");
      return;
    }
    if (
      draft.toLowerCase() !== oldEpic.toLowerCase() &&
      epicOptions.some((epic) => epic.toLowerCase() === draft.toLowerCase())
    ) {
      window.alert("Epic already exists.");
      return;
    }
    if (draft === oldEpic) return;

    await onSaveEpicOptions(epicOptions.map((epic) => (epic === oldEpic ? draft : epic)));

    const impacted = features.filter((feature) => feature.epic.includes(oldEpic));
    await Promise.all(
      impacted.map((feature) =>
        onUpdateFeature(feature.id, {
          epic: feature.epic
            .map((epic) => (epic === oldEpic ? draft : epic))
            .filter((epic, index, list) => list.indexOf(epic) === index),
        })
      )
    );

    setEditEpicDrafts((current) => {
      const rest = { ...current };
      delete rest[oldEpic];
      return rest;
    });
  };

  const removeEpicOption = async (epicToRemove: string) => {
    const confirmed = window.confirm(`Remove epic "${epicToRemove}" from the epic list and all features?`);
    if (!confirmed) return;

    await onSaveEpicOptions(epicOptions.filter((epic) => epic !== epicToRemove));

    const impacted = features.filter((feature) => feature.epic.includes(epicToRemove));
    await Promise.all(
      impacted.map((feature) =>
        onUpdateFeature(feature.id, {
          epic: feature.epic.filter((epic) => epic !== epicToRemove),
        })
      )
    );
  };

  return (
    <div>
      <div className="ctrl-row">
        <span>Manage epics:</span>
        <label htmlFor="new-epic-name">Epic:</label>
        <input
          id="new-epic-name"
          className="input"
          value={newEpicName}
          onChange={(event) => setNewEpicName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addEpicOption();
            }
          }}
          placeholder="Add epic..."
        />
        <button type="button" className="btn" onClick={() => void addEpicOption()}>
          Add epic
        </button>
      </div>

      <div className="ctrl-row">
        {epicOptions.length === 0 ? (
          <span>No epics created yet.</span>
        ) : (
          epicOptions.map((epic) => (
            <div key={epic} className="ctrl-row">
              <input
                className="input"
                value={editEpicDrafts[epic] ?? epic}
                onChange={(event) =>
                  setEditEpicDrafts((current) => ({
                    ...current,
                    [epic]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void renameEpicOption(epic);
                  }
                  if (event.key === "Escape") {
                    setEditEpicDrafts((current) => ({
                      ...current,
                      [epic]: epic,
                    }));
                  }
                }}
              />
              <button type="button" className="btn" onClick={() => void renameEpicOption(epic)}>
                Save
              </button>
              <button type="button" className="del" onClick={() => void removeEpicOption(epic)}>
                remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
