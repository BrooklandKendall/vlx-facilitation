interface SummaryTabProps {
  summaryText: string;
  onGenerate: () => void;
  onCopy: () => void;
  onExport: () => void;
  onExportPrdJson: () => void;
  onExportDbJson: () => void;
}

export function SummaryTab({
  summaryText,
  onGenerate,
  onCopy,
  onExport,
  onExportPrdJson,
  onExportDbJson,
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
        <button className="btn" type="button" onClick={onExportPrdJson}>
          Export PRD package files
        </button>
        <button className="btn" type="button" onClick={onExportDbJson}>
          Export DB JSON
        </button>
      </div>
      <div className="summary-box">{summaryText}</div>
    </div>
  );
}
