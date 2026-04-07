import { useState } from "react";
import type { SessionItem } from "../../types";

interface RisksTabProps {
  questions: SessionItem[];
  risks: SessionItem[];
  actions: SessionItem[];
  onAddItem: (type: "question" | "risk" | "action", text: string) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

interface ListEditorProps {
  title: string;
  placeholder: string;
  items: SessionItem[];
  onAdd: (value: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ListEditor({ title, placeholder, items, onAdd, onDelete }: ListEditorProps) {
  const [draft, setDraft] = useState("");

  const submit = async () => {
    const cleaned = draft.trim();
    if (!cleaned) return;
    await onAdd(cleaned);
    setDraft("");
  };

  return (
    <div>
      <div className="sub-hdr">{title}</div>
      <div>
        {items.map((item) => (
          <div key={item.id} className="risk-item">
            <span className="risk-text">{item.text}</span>
            <button type="button" className="del" onClick={() => void onDelete(item.id)}>
              remove
            </button>
          </div>
        ))}
      </div>
      <div className="row">
        <input
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
        />
        <button className="btn" type="button" onClick={() => void submit()}>
          Add
        </button>
      </div>
    </div>
  );
}

export function RisksTab({ questions, risks, actions, onAddItem, onDeleteItem }: RisksTabProps) {
  return (
    <div>
      <div className="section-hdr">Open questions & risk register</div>
      <div className="grid-two">
        <ListEditor
          title="Open questions"
          placeholder="Unresolved question or decision needed..."
          items={questions}
          onAdd={(value) => onAddItem("question", value)}
          onDelete={onDeleteItem}
        />
        <ListEditor
          title="Risks"
          placeholder="Risk or concern to flag..."
          items={risks}
          onAdd={(value) => onAddItem("risk", value)}
          onDelete={onDeleteItem}
        />
      </div>
      <div className="top-gap">
        <ListEditor
          title="Action items"
          placeholder="Action item + owner (e.g. Alan: confirm Mia Health BAA timeline)"
          items={actions}
          onAdd={(value) => onAddItem("action", value)}
          onDelete={onDeleteItem}
        />
      </div>
    </div>
  );
}
