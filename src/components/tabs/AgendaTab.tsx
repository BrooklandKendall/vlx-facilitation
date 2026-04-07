interface AgendaTabProps {
  counts: {
    mvp: number;
    v2x: number;
    def: number;
  };
}

export function AgendaTab({ counts }: AgendaTabProps) {
  return (
    <div>
      <div className="metric-row">
        <div className="metric">
          <div className="metric-n">{counts.mvp}</div>
          <div className="metric-l">MVP features</div>
        </div>
        <div className="metric">
          <div className="metric-n">{counts.v2x}</div>
          <div className="metric-l">VLx 2.x features</div>
        </div>
        <div className="metric">
          <div className="metric-n">{counts.def}</div>
          <div className="metric-l">Deferred</div>
        </div>
      </div>

      <div className="section-hdr">3-hour session flow</div>
      <div className="stack-m">
        <div className="agenda-item">
          <span className="time">0:00 - 0:25</span>
          <span>
            <strong>North star</strong> - Non-negotiables, constraints, budget envelope
          </span>
        </div>
        <div className="agenda-item">
          <span className="time">0:25 - 0:50</span>
          <span>
            <strong>Personas</strong> - Care recipient, family caregiver, EverHome coordinator
          </span>
        </div>
        <div className="agenda-item">
          <span className="time">0:50 - 1:50</span>
          <span>
            <strong>Feature sort</strong> - MVP vs VLx 2.x vs Deferred, effort sizing
          </span>
        </div>
        <div className="agenda-item">
          <span className="time">1:50 - 2:20</span>
          <span>
            <strong>Onboarding flow</strong> - Accessibility, subscription, caregiver setup
          </span>
        </div>
        <div className="agenda-item">
          <span className="time">2:20 - 2:50</span>
          <span>
            <strong>Open questions & risks</strong> - What could go wrong, action items
          </span>
        </div>
        <div className="agenda-item">
          <span className="time">2:50 - 3:00</span>
          <span>
            <strong>Wrap & next steps</strong> - Confirm outputs, assign owners
          </span>
        </div>
      </div>

      <div className="section-hdr">Session outputs</div>
      <div className="static-list">
        <div>- Confirmed MVP feature set for NYSOFA pilot</div>
        <div>- VLx 2.x roadmap feature list</div>
        <div>- Documented constraints, budget ceiling, and non-negotiables</div>
        <div>- Persona definitions (3 primary roles)</div>
        <div>- Prioritized open questions and risk register</div>
        <div className="secondary">{"->"} Feeds into: PRD, user stories, architecture plan</div>
      </div>
    </div>
  );
}
