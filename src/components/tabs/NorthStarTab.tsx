import { useState } from "react";
import type { SessionDoc, SessionField, SessionItem } from "../../types";

interface NorthStarTabProps {
  session: SessionDoc;
  nonNegotiables: SessionItem[];
  constraints: SessionItem[];
  onSaveSessionField: (field: SessionField, value: string) => Promise<void>;
  onAddTag: (type: "nonNegotiable" | "constraint", text: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
}

export function NorthStarTab({
  session,
  nonNegotiables,
  constraints,
  onSaveSessionField,
  onAddTag,
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
        <div className="mini-hdr">Non-negotiables for MVP pilot</div>
        <div className="constr-tags">
          {nonNegotiables.map((item) => (
            <button key={item.id} className="tag" onClick={() => onDeleteTag(item.id)} type="button">
              {item.text} <span className="tag-remove">x</span>
            </button>
          ))}
        </div>
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
        <div className="constr-tags">
          {constraints.map((item) => (
            <button key={item.id} className="tag" onClick={() => onDeleteTag(item.id)} type="button">
              {item.text} <span className="tag-remove">x</span>
            </button>
          ))}
        </div>
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
        </div>
        <div>
          <div className="mini-hdr">Family caregiver</div>
          <textarea
            className="textarea"
            defaultValue={session.personaFamilyCaregiver}
            onBlur={(event) => void onSaveSessionField("personaFamilyCaregiver", event.target.value)}
            placeholder="Relationship, availability, tech literacy, primary concerns..."
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
        </div>
      </div>

      <div className="top-gap">
        <div className="mini-hdr">Success criteria for the NYSOFA pilot</div>
        <textarea
          className="textarea large"
          defaultValue={session.successCriteria}
          onBlur={(event) => void onSaveSessionField("successCriteria", event.target.value)}
          placeholder="e.g. >=85% scan success rate, >=60% weekly active usage, NYSOFA reporting capability..."
        />
      </div>
    </div>
  );
}
