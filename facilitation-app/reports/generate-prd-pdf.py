from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


def load_session(source_path: Path) -> dict[str, Any]:
    data = json.loads(source_path.read_text(encoding="utf-8"))
    sessions = data.get("collections", {}).get("sessions", [])
    if not sessions:
        raise ValueError("No sessions found in source JSON.")

    default = next((s for s in sessions if s.get("id") == "default"), None)
    return default if default is not None else sessions[0]


def title_case_bucket(bucket: str) -> str:
    return {"mvp": "MVP", "v2x": "VLx 2.x", "def": "Deferred"}.get(bucket, bucket)


def status_label(status: str) -> str:
    return {"full": "Full", "part": "Partial", "new": "New"}.get(status, status)


def priority_label(priority: str) -> str:
    return {"high": "High", "med": "Medium", "low": "Low"}.get(priority, priority)


def grouped_features(features: list[dict[str, Any]]) -> dict[str, dict[str, list[dict[str, Any]]]]:
    out: dict[str, dict[str, list[dict[str, Any]]]] = {"mvp": {}, "v2x": {}, "def": {}}
    for f in features:
        bucket = f.get("bucket", "def")
        domain = f.get("domain", "General")
        out.setdefault(bucket, {}).setdefault(domain, []).append(f)

    for bucket in out:
        for domain in out[bucket]:
            out[bucket][domain].sort(key=lambda x: (x.get("priority", "med"), x.get("name", "")))
    return out


def item_texts(items: list[dict[str, Any]], item_type: str) -> list[str]:
    return [i.get("text", "").strip() for i in items if i.get("type") == item_type and i.get("text", "").strip()]


def build_story(session: dict[str, Any], source_path: Path) -> list[Any]:
    styles = getSampleStyleSheet()
    h1 = styles["Heading1"]
    h2 = styles["Heading2"]
    normal = styles["BodyText"]
    bullet = ParagraphStyle(
        "Bullet",
        parent=normal,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4,
        leading=14,
    )

    data = session.get("data", {})
    items = session.get("items", [])
    features = session.get("features", [])
    grouped = grouped_features(features)
    generated_on = dt.datetime.now().strftime("%Y-%m-%d %H:%M")

    nn = item_texts(items, "nonNegotiable")
    constraints = item_texts(items, "constraint")
    questions = item_texts(items, "question")
    risks = item_texts(items, "risk")
    actions = item_texts(items, "action")

    personas = [
        ("Care Recipient", data.get("personaCareRecipient", ""), data.get("personaCareRecipientRoles", "")),
        ("Family Caregiver", data.get("personaFamilyCaregiver", ""), data.get("personaFamilyCaregiverRoles", "")),
        ("Coordinator", data.get("personaCoordinator", ""), data.get("personaCoordinatorRoles", "")),
    ]

    success_criteria = data.get("successCriteria", "").strip()

    story: list[Any] = []
    story.append(Paragraph("VivaLynx Product Requirements Document (PRD)", h1))
    story.append(Paragraph(f"Generated from Firestore export: {source_path}", normal))
    story.append(Paragraph(f"Generated on: {generated_on}", normal))
    story.append(Spacer(1, 0.18 * inch))

    story.append(Paragraph("Executive Summary", h2))
    story.append(Paragraph("This PRD synthesizes workshop data into an implementation-ready plan for VivaLynx.", normal))
    story.append(
        Paragraph(
            "The primary release focus is an MVP baseline spanning platform setup, privacy/security controls, "
            "care coordination, safety monitoring, communication, and medication workflows.",
            normal,
        )
    )
    story.append(
        Paragraph(
            "VLx 2.x expands intelligence, advanced coordination, and analytics depth; deferred items prioritize "
            "ecosystem integrations and longer-horizon capabilities.",
            normal,
        )
    )
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Problem Statement", h2))
    story.append(
        Paragraph(
            "Care recipients, family caregivers, and coordinators need a single, privacy-forward system for daily "
            "coordination, safety interventions, and evidence-backed decision support.",
            normal,
        )
    )
    story.append(
        Paragraph(
            "Current planning data indicates strong product direction but incomplete role definitions and incomplete "
            "success metric definitions, which must be resolved before go-live sign-off.",
            normal,
        )
    )
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Personas and Roles", h2))
    for persona_name, persona_desc, persona_roles in personas:
        if persona_desc or persona_roles:
            text = f"<b>{persona_name}:</b> {persona_desc or '[Persona detail not provided]'}"
            if persona_roles:
                text += f" | Roles: {persona_roles}"
            else:
                text += " | Roles: [Not provided in source data]"
        else:
            text = f"<b>{persona_name}:</b> [Not provided in source data]"
        story.append(Paragraph(f"- {text}", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Success Criteria", h2))
    if success_criteria:
        story.append(Paragraph(f"- {success_criteria}", bullet))
    else:
        story.append(Paragraph("- Source field `successCriteria` is empty; measurable criteria must be finalized.", bullet))
        story.append(
            Paragraph(
                "- Action required: define explicit KPI thresholds and approval owner(s) before MVP sign-off.",
                bullet,
            )
        )
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Non-negotiables and Constraints", h2))
    if nn:
        story.append(Paragraph("<b>Non-negotiables</b>", normal))
        for text in nn:
            story.append(Paragraph(f"- {text}", bullet))
    if constraints:
        story.append(Paragraph("<b>Constraints</b>", normal))
        for text in constraints:
            story.append(Paragraph(f"- {text}", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Feature Scope (MVP, VLx 2.x, Deferred)", h2))
    for bucket in ["mvp", "v2x", "def"]:
        story.append(Paragraph(f"<b>{title_case_bucket(bucket)}</b>", normal))
        by_domain = grouped.get(bucket, {})
        if not by_domain:
            story.append(Paragraph("- No features listed.", bullet))
            continue
        for domain in sorted(by_domain.keys()):
            story.append(Paragraph(f"- <b>{domain}</b>", bullet))
            for feat in sorted(by_domain[domain], key=lambda x: x.get("name", "")):
                name = feat.get("name", "Unnamed Feature")
                pri = priority_label(feat.get("priority", "med"))
                stat = status_label(feat.get("status", "new"))
                story.append(Paragraph(f"  - {name} (Priority: {pri}; Status: {stat})", bullet))
        story.append(Spacer(1, 0.08 * inch))

    story.append(Paragraph("Open Questions", h2))
    if questions:
        for q in questions:
            story.append(Paragraph(f"- {q}", bullet))
    else:
        story.append(Paragraph("- No open questions captured in source data.", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Risks and Mitigations", h2))
    if risks:
        for r in risks:
            story.append(Paragraph(f"- Risk: {r}", bullet))
            story.append(
                Paragraph(
                    "  - Mitigation: enforce required data-entry checks, ownership assignment, and "
                    "pre-release validation on analytics-critical fields.",
                    bullet,
                )
            )
    else:
        story.append(Paragraph("- No explicit risks captured in source data.", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Action Items and Owners", h2))
    if actions:
        for a in actions:
            story.append(Paragraph(f"- Action: {a}", bullet))
            story.append(Paragraph("  - Owner: [To be assigned]", bullet))
    else:
        story.append(Paragraph("- No explicit action items captured in source data.", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Release Readiness Recommendations", h2))
    story.append(Paragraph("- Lock MVP scope to high-priority and full/partial readiness items only.", bullet))
    story.append(Paragraph("- Finalize success metrics and owner accountability before launch decision.", bullet))
    story.append(Paragraph("- Resolve integration requirements for day-one reporting.", bullet))
    story.append(Paragraph("- Conduct HIPAA/privacy validation and onboarding usability checks before go-live.", bullet))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Assumptions", h2))
    story.append(
        Paragraph(
            "- The report prioritizes `sessions/default` as instructed; additional sessions were not used because only one session is present.",
            bullet,
        )
    )
    story.append(
        Paragraph(
            "- Persona role details and formal success criteria are incomplete in source data and are represented as explicit gaps.",
            bullet,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("Appendix: One-Page Implementation Checklist", h1))
    checklist = [
        "Confirm MVP feature freeze and remove deferred scope from launch plan.",
        "Define measurable success criteria and map each metric to an accountable owner.",
        "Validate HIPAA and privacy controls (RBAC, audit trail, consent-only video).",
        "Complete onboarding usability test with low-tech caregiver personas.",
        "Verify core workflows: medication reminders/tracking, shared calendar, alerts, emergency access.",
        "Set reporting baseline and confirm day-one integration requirements.",
        "Run data quality checks for analytics-critical inputs and telemetry coverage.",
        "Establish launch command structure: incident response, support staffing, rollback protocol.",
        "Approve go-live readiness with documented sign-off criteria.",
    ]
    for c in checklist:
        story.append(Paragraph(f"- [ ] {c}", bullet))

    return story


def generate_prd_pdf(source_json: Path, output_pdf: Path) -> None:
    session = load_session(source_json)
    story = build_story(session, source_json)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_pdf),
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="VivaLynx Product Requirements Document",
        author="AI-generated from Firestore source data",
    )
    doc.build(story)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate VivaLynx PRD PDF from Firestore export JSON.")
    parser.add_argument("--source", required=True, help="Path to prd-source-db.json")
    parser.add_argument("--out", required=True, help="Output PDF path")
    args = parser.parse_args()

    source = Path(args.source).expanduser().resolve()
    out = Path(args.out).expanduser().resolve()

    generate_prd_pdf(source, out)
    print(f"Generated PRD PDF: {out}")


if __name__ == "__main__":
    main()
