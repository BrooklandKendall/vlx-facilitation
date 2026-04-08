import { useState } from "react";
import type { SessionDoc, SessionField, SessionItem } from "../../types";

interface NorthStarTabProps {
  session: SessionDoc;
  nonNegotiables: SessionItem[];
  constraints: SessionItem[];
  onSaveSessionField: (field: SessionField, value: string) => Promise<void>;
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
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: NorthStarTabProps) {
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
      <div className="grid-three">
        <div>
          <div className="mini-hdr">Care recipient</div>
          <textarea
            className="textarea"
            defaultValue={session.personaCareRecipient}
            onBlur={(event) => void onSaveSessionField("personaCareRecipient", event.target.value)}
            placeholder="Age range, conditions, tech comfort, connectivity, device type..."
          />
          <div className="mini-hdr top-gap">Roles</div>
          <textarea
            className="textarea"
            defaultValue={session.personaCareRecipientRoles}
            onBlur={(event) => void onSaveSessionField("personaCareRecipientRoles", event.target.value)}
            placeholder="Primary responsibilities, decisions they own, and support they need..."
          />
        </div>
        <div>
          <div className="mini-hdr">Family caregiver</div>
          <textarea
            className="textarea"
            defaultValue={session.personaFamilyCaregiver}
            onBlur={(event) => void onSaveSessionField("personaFamilyCaregiver", event.target.value)}
            placeholder="Relationship, availability, tech literacy, primary concerns..."
          />
          <div className="mini-hdr top-gap">Roles</div>
          <textarea
            className="textarea"
            defaultValue={session.personaFamilyCaregiverRoles}
            onBlur={(event) => void onSaveSessionField("personaFamilyCaregiverRoles", event.target.value)}
            placeholder="Daily responsibilities, coordination tasks, and escalation duties..."
          />
        </div>
        <div>
          <div className="mini-hdr">EverHome coordinator</div>
          <textarea
            className="textarea"
            defaultValue={session.personaCoordinator}
            onBlur={(event) => void onSaveSessionField("personaCoordinator", event.target.value)}
            placeholder="Caseload size, workflow, reporting requirements, escalation triggers..."
          />
          <div className="mini-hdr top-gap">Roles</div>
          <textarea
            className="textarea"
            defaultValue={session.personaCoordinatorRoles}
            onBlur={(event) => void onSaveSessionField("personaCoordinatorRoles", event.target.value)}
            placeholder="Program oversight, reporting ownership, and intervention workflows..."
          />
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
