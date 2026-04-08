import { useState } from "react";
import type { Persona, SessionDoc, SessionField, SessionItem } from "../../types";

interface NorthStarTabProps {
  session: SessionDoc;
  nonNegotiables: SessionItem[];
  constraints: SessionItem[];
  onSaveSessionField: (field: SessionField, value: string) => Promise<void>;
  onSavePersonas: (personas: Persona[]) => Promise<void>;
  onAddTag: (type: "nonNegotiable" | "constraint", text: string) => Promise<void>;
  onUpdateTag: (id: string, text: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
}

interface EditableTagListProps {
  items: SessionItem[];
  onUpdate: (id: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function EditableTagList({ items, onUpdate, onDelete }: EditableTagListProps) {
  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="risk-item">
          <input
            className="input"
            defaultValue={item.text}
            onBlur={(event) => {
              const cleaned = event.target.value.trim();
              if (!cleaned) {
                event.target.value = item.text;
                return;
              }
              if (cleaned !== item.text) {
                void onUpdate(item.id, cleaned);
              }
            }}
          />
          <button
            type="button"
            className="del"
            onClick={() => {
              const confirmed = window.confirm(`Remove item "${item.text}"?`);
              if (!confirmed) return;
              void onDelete(item.id);
            }}
          >
            remove
          </button>
        </div>
      ))}
    </div>
  );
}

export function NorthStarTab({
  session,
  nonNegotiables,
  constraints,
  onSaveSessionField,
  onSavePersonas,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: NorthStarTabProps) {
  const CORE_LABELS = ["Care recipient", "Family caregiver", "EverHome coordinator"] as const;
  const [nnInput, setNnInput] = useState("");
  const [conInput, setConInput] = useState("");

  const submitTag = async (type: "nonNegotiable" | "constraint") => {
    const source = type === "nonNegotiable" ? nnInput : conInput;
    const cleaned = source.trim();
    if (!cleaned) return;
    await onAddTag(type, cleaned);
    if (type === "nonNegotiable") setNnInput("");
    else setConInput("");
  };

  const personas =
    session.personas.length >= CORE_LABELS.length
      ? session.personas.map((persona, index) =>
          index < CORE_LABELS.length ? { ...persona, label: CORE_LABELS[index] } : persona
        )
      : [
          ...CORE_LABELS.map((label, index) => ({
            label,
            details: session.personas[index]?.details ?? "",
          })),
          ...session.personas.slice(CORE_LABELS.length),
        ];

  const savePersonaDetails = async (index: number, details: string) => {
    const next = [...personas];
    next[index] = { ...next[index], details };
    await onSavePersonas(next);
  };

  const savePersonaLabel = async (index: number, label: string) => {
    if (index < CORE_LABELS.length) return;
    const next = [...personas];
    next[index] = { ...next[index], label: label.trim() };
    await onSavePersonas(next);
  };

  const addPersona = async () => {
    await onSavePersonas([...personas, { label: "", details: "" }]);
  };

  const removePersona = async (index: number) => {
    if (index < CORE_LABELS.length) return;
    const confirmed = window.confirm("Remove this persona?");
    if (!confirmed) return;
    await onSavePersonas(personas.filter((_, current) => current !== index));
  };

  return (
    <div>
      <div className="section-hdr">North star & constraints</div>

      <div className="star-box">
        <div className="mini-hdr">Non-negotiables for MVP</div>
        <EditableTagList items={nonNegotiables} onUpdate={onUpdateTag} onDelete={onDeleteTag} />
        <div className="row">
          <input
            className="input"
            value={nnInput}
            onChange={(event) => setNnInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitTag("nonNegotiable");
              }
            }}
            placeholder="Type a non-negotiable and press enter"
          />
          <button className="btn" type="button" onClick={() => void submitTag("nonNegotiable")}>
            Add
          </button>
        </div>
      </div>

      <div className="star-box">
        <div className="mini-hdr">Constraints</div>
        <EditableTagList items={constraints} onUpdate={onUpdateTag} onDelete={onDeleteTag} />
        <div className="row">
          <input
            className="input"
            value={conInput}
            onChange={(event) => setConInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitTag("constraint");
              }
            }}
            placeholder="e.g. $140K budget ceiling, 90-day timeline"
          />
          <button className="btn" type="button" onClick={() => void submitTag("constraint")}>
            Add
          </button>
        </div>
      </div>

      <div className="section-hdr top-gap">Personas</div>
      <div className="star-box">
        {personas.map((persona, index) => (
          <div key={`persona-${index}`} className="top-gap">
            <div className="row">
              <div className="mini-hdr">
                {index < CORE_LABELS.length ? CORE_LABELS[index] : `Persona ${index + 1}`}
              </div>
              <button
                type="button"
                className="del"
                onClick={() => void removePersona(index)}
                disabled={index < CORE_LABELS.length}
              >
                remove
              </button>
            </div>
            {index >= CORE_LABELS.length ? (
              <input
                className="input"
                defaultValue={persona.label}
                onBlur={(event) => void savePersonaLabel(index, event.target.value)}
                placeholder="Persona label (required)"
              />
            ) : null}
            <textarea
              className="textarea"
              defaultValue={persona.details}
              onBlur={(event) => void savePersonaDetails(index, event.target.value)}
              placeholder="Describe persona, goals, constraints, and context..."
            />
          </div>
        ))}
        <div className="top-gap">
          <button className="btn" type="button" onClick={() => void addPersona()}>
            Add persona
          </button>
        </div>
      </div>

      <div className="top-gap">
        <div className="mini-hdr">Success criteria for MVP</div>
        <textarea
          className="textarea large"
          defaultValue={session.successCriteria}
          onBlur={(event) => void onSaveSessionField("successCriteria", event.target.value)}
          placeholder="e.g. >=85% scan success rate, >=60% weekly active usage, required reporting capability..."
        />
      </div>
    </div>
  );
}
