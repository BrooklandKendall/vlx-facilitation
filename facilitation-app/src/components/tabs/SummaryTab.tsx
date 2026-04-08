interface SummaryTabProps {
  summaryText: string;
  onGenerate: () => void;
  onCopy: () => void;
  onExport: () => void;
  onExportDbJson: () => void;
  onExportDbFirestore: () => void;
}

export function SummaryTab({
  summaryText,
  onGenerate,
  onCopy,
  onExport,
  onExportDbJson,
  onExportDbFirestore,
}: SummaryTabProps) {
  return (
    <div>
      <div className="ctrl-row">
        <button className="btn btn-primary" type="button" onClick={onGenerate}>
          Generate session output
        </button>
        <button className="btn" type="button" onClick={onCopy}>
          Copy to clipboard
        </button>
        <button className="btn" type="button" onClick={onExport}>
          Export text file
        </button>
        <button className="btn" type="button" onClick={onExportDbJson}>
          Export DB JSON
        </button>
        <button className="btn" type="button" onClick={onExportDbFirestore}>
          Export Firestore format
        </button>
      </div>
      <div className="summary-box">{summaryText}</div>
    </div>
  );
}
