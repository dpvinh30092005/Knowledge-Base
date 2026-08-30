"""
Overlay FLM curriculum coverage onto the roadmap.sh skill catalog.

roadmap.sh (SkillDataTemplate.csv) stays the source of truth for what a career
requires. This tool only answers, per skill:
  - which FLM course(s) teach it        -> coverage
  - which required skills NO course teaches -> the self-study GAP
  - which concrete skills FLM teaches that aren't in the catalog -> candidates to add

Skills are pulled from each course's CLOs and mapped to the fixed catalog vocabulary
via the shared LLM (app.services.llm_service). With no LLM key it falls back to a
plain keyword match so the pipeline still runs.

Usage (from intelipath-service/):
    python -m app.scrapers.flm.flm_to_coverage \
        --flm flm_se.json \
        --catalog ../intelipath-backend/data/SkillDataTemplate.csv \
        --career Backend \
        --out flm_coverage.json
"""
import argparse
import csv
import json
import logging
import re

from bs4 import BeautifulSoup

from app.scrapers.flm import parsers as P
from app.services.llm_service import complete_json, is_enabled

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("flm.coverage")

_SYS = (
    "You map university course learning outcomes (CLOs) to a FIXED catalog of "
    "professional IT skills. Given a course's CLOs and the allowed skill list, "
    "return ONLY the catalog skills the course genuinely teaches, using the exact "
    "names from the list. For `extra`, list AT MOST 5 concrete, widely-recognised "
    "technologies or tools the course clearly teaches that are NOT in the catalog "
    "(e.g. a named language, framework or protocol) — never generic topics, never "
    "soft/administrative skills, and never invent catalog names.\n"
    'Respond ONLY as JSON: {"matched": ["Skill A", ...], "extra": ["X", ...]}.'
)


def load_catalog(path: str) -> list[dict]:
    """Read SkillDataTemplate.csv -> [{name, category, careers, importance}]."""
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    out = []
    for r in rows[1:]:  # skip header
        if len(r) < 3 or not r[2].strip():
            continue
        out.append(
            {
                "name": r[2].strip(),
                "category": r[0].strip() if r else "",
                "careers": [c.strip() for c in (r[1] or "").split(",") if c.strip()],
                "importance": r[3].strip() if len(r) > 3 else "",
            }
        )
    return out


def _match_llm(clo_text: str, catalog_names: list[str]) -> tuple[list[str], list[str]] | None:
    user = "Allowed catalog skills:\n" + ", ".join(catalog_names) + "\n\nCourse CLOs:\n" + clo_text
    res = complete_json(_SYS, user)
    if not res:
        return None
    allowed = {n.lower(): n for n in catalog_names}
    matched = [allowed[s.lower()] for s in (res.get("matched") or []) if isinstance(s, str) and s.lower() in allowed]
    extra = [s.strip() for s in (res.get("extra") or []) if isinstance(s, str) and s.strip()]
    # de-dup preserving order
    matched = list(dict.fromkeys(matched))
    extra = list(dict.fromkeys(extra))
    return matched, extra


def _match_keyword(clo_text: str, catalog_names: list[str]) -> tuple[list[str], list[str]]:
    low = clo_text.lower()
    matched = [n for n in catalog_names if n.lower() in low]
    return matched, []


def _clo_text(subject: dict) -> str:
    clos = [
        c.get("outcome", "")
        for syl in (subject.get("syllabus") or [])
        for c in (syl.get("clos") or [])
    ]
    return "\n".join(f"- {c}" for c in clos if c)


# Subjects outside the major, keyed by the leading letters of the code. An FLM
# curriculum mixes the degree's engineering courses with language, PE, ideology and
# soft-skill requirements; this app is a technical roadmap, so they are dropped from the
# subject set entirely rather than listed with nothing useful behind them.
#
# Maths (MAE/MAD/MAS) and the capstone (SEP) deliberately stay. They belong to the major
# even though they map to no roadmap.sh skill — "has no skill link" is not the same as
# "not part of the degree", and conflating the two would also throw out PRF192.
_NON_MAJOR_PREFIXES = (
    "PEN", "TRS", "ENT",                # English
    "JIS", "JIT", "JPD", "JLP", "JPN",  # Japanese
    "PHE", "VOV",                       # physical education (Vovinam is a PHE combo)
    "TMI",                              # traditional musical instrument
    "MLN", "VNR", "HCM",                # politics
    "OTP", "SSL", "SSG",                # orientation / soft skills
    "EXE",                              # entrepreneurship
    "ENW",                              # academic writing
    "OJT",                              # on-the-job training
    "GDQP", "MIL",                      # national defence
    "VIE",                              # Vietnamese
)

_ALPHA_PREFIX = re.compile(r"[A-Za-z]+")


def is_major_subject(code: str) -> bool:
    """
    True for a real subject of the major that should appear in the app.

    False for two different kinds of row:
      - grouping placeholders (SE_COM*1, SE_COM*4_ELE): the curriculum reserves a slot,
        the teachable subject lives behind the combo. Real FPT codes are alphanumeric.
      - subjects outside the major (_NON_MAJOR_PREFIXES).
    """
    c = (code or "").strip()
    if not c or "*" in c or "_" in c:
        return False
    m = _ALPHA_PREFIX.match(c)
    if not m:
        return False
    return m.group(0).upper() not in _NON_MAJOR_PREFIXES


def _is_technical(code: str) -> bool:
    """Whether a subject's CLOs may map onto engineering skills.

    Same predicate as membership: a Japanese course's CLOs were landing on the "Java"
    node, and anything we exclude from the major has no business emitting skill links
    either. Kept as a named call so the two intents stay readable at the call sites.
    """
    return is_major_subject(code)


def build_coverage(flm: dict, catalog: list[dict], career: str | None) -> dict:
    names = [c["name"] for c in catalog]
    use_llm = is_enabled()
    log.info("Skill matching: %s", "LLM" if use_llm else "keyword fallback (no LLM key)")

    subject_coverage: list[dict] = []
    covers: dict[str, list[str]] = {}
    extra_all: dict[str, list[str]] = {}
    prerequisites: list[dict] = []

    for s in flm.get("subjects", []):
        code = s.get("code", "")
        clo_text = _clo_text(s)
        if not _is_technical(code):
            matched, extra = [], []  # language/PE/ideology → no skill links
        elif not clo_text:
            matched, extra = [], []
        else:
            matched = extra = None
            if use_llm:
                r = _match_llm(clo_text, names)
                if r is not None:
                    matched, extra = r
            if matched is None:
                matched, extra = _match_keyword(clo_text, names)

        subject_coverage.append({"code": code, "matched": matched, "extra": extra})
        for m in matched:
            covers.setdefault(m, []).append(code)
        for e in extra:
            extra_all.setdefault(e, []).append(code)
        for p in (s.get("prerequisites") or []):
            prerequisites.append(p)

    # Gap = catalog skills (optionally for one career) that no course covers.
    scoped = [c for c in catalog if not career or career in c["careers"]]
    covered = [c["name"] for c in scoped if c["name"] in covers]
    gap = [
        {"name": c["name"], "category": c["category"], "importance": c["importance"]}
        for c in scoped
        if c["name"] not in covers
    ]

    return {
        "career_filter": career or "ALL",
        "summary": {
            "catalog_skills": len(scoped),
            "covered": len(covered),
            "gap": len(gap),
            "extra_not_in_catalog": len(extra_all),
        },
        "skill_coverage": {k: covers[k] for k in covered},
        "gap": gap,
        "extra_skills": extra_all,
        "subject_coverage": subject_coverage,
        "prerequisites": prerequisites,
    }


def curriculum_from_soup(soup) -> dict[str, dict]:
    """
    Parse a CurriculumDetails page (already fetched) into {CODE -> {name, semester,
    credits, prerequisite}}. This is what lets a student say "I've finished term N"
    and have us infer the subjects behind it. Shared by the offline file loader and
    the admin live-sync job.

    Non-major rows (English, Vovinam, Japanese, politics, soft skills…) and the combo
    placeholders are filtered out here, so every downstream consumer sees the same
    subject set instead of each re-deriving one.
    """
    def _int(value: str):
        value = (value or "").strip()
        return int(value) if value.isdigit() else None

    out: dict[str, dict] = {}
    skipped = 0
    for r in P.parse_curriculum_subjects(soup):
        code = (r.get("SubjectCode") or r.get("Subject Code") or "").strip()
        if not code:
            continue
        if not is_major_subject(code):
            skipped += 1
            continue
        out[code.upper()] = {
            "name": (r.get("Subject Name") or r.get("SubjectName") or "").strip(),
            "semester": _int(r.get("Semester", "")),
            "credits": _int(r.get("NoCredit") or r.get("Credits") or ""),
            "prerequisite": (r.get("PreRequisite") or r.get("Pre-Requisite") or "").strip(),
            "combo_code": "",
            "combo_name": "",
        }
    if skipped:
        log.info("Curriculum: kept %d major subjects, skipped %d (non-major or combo slots)",
                 len(out), skipped)
    return out


def load_curriculum(path: str) -> dict[str, dict]:
    """Offline variant of curriculum_from_soup: reads a dumped CurriculumDetails HTML file."""
    with open(path, encoding="utf-8") as f:
        return curriculum_from_soup(BeautifulSoup(f.read(), "html.parser"))


def build_overlay(flm: dict, coverage: dict, curriculum: dict[str, dict]) -> dict:
    """
    Merge coverage (skill<->course) with the curriculum (semester/name/credits) and the
    scraped syllabus (CLOs/materials/sessions) into a single per-subject overlay the
    backend seeds directly. The subject set is the *crawled* subjects (the ones we
    actually have syllabi/skills for); the curriculum only enriches semester/name/credits
    where the code matches, so a mismatched curriculum (e.g. a different track) never
    injects noise.

    syllabus[0] is the current version, not merely the first row FLM printed — see
    parsers.find_syllabus_links, which does the ranking.
    """
    matched_by_code = {s["code"]: s.get("matched", []) for s in coverage.get("subject_coverage", [])}
    flm_by_code = {s.get("code", ""): s for s in flm.get("subjects", []) if s.get("code")}
    all_codes = {c for c in flm_by_code} | {c for c in matched_by_code if c}
    # A crawl driven by --prefixes (or an older flm_data.json) can still carry non-major
    # codes; the overlay is the seed the backend trusts, so filter here too.
    all_codes = {c for c in all_codes if is_major_subject(c)}

    subjects = []
    for code in sorted(all_codes):
        cur = curriculum.get(code.upper(), {})
        flm_s = flm_by_code.get(code, {})
        syl = (flm_s.get("syllabus") or [{}])[0]
        meta = syl.get("meta", {})
        skills = matched_by_code.get(code, [])
        subjects.append(
            {
                "code": code,
                "name": cur.get("name") or meta.get("Subject Name") or code,
                "semester": cur.get("semester"),
                "credits": cur.get("credits"),
                "prerequisite": cur.get("prerequisite", ""),
                "description": meta.get("Description", ""),
                # "" = trunk subject (every student on this curriculum); a code means the
                # subject only belongs to that specialisation combo.
                "combo_code": cur.get("combo_code", ""),
                "combo_name": cur.get("combo_name", ""),
                "skills": skills,
                # CLOs are what the subject page actually shows a student; they were
                # being computed for skill matching and then thrown away here.
                "clos": syl.get("clos", []),
                "materials": syl.get("materials", []),
                "sessions": syl.get("sessions", []),
            }
        )

    return {
        "career_filter": coverage.get("career_filter", "ALL"),
        "summary": {**coverage.get("summary", {}), "subjects": len(subjects)},
        "skill_coverage": coverage.get("skill_coverage", {}),
        "gap": coverage.get("gap", []),
        "subjects": subjects,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Map FLM course CLOs onto the roadmap.sh skill catalog")
    ap.add_argument("--flm", default="flm_se.json", help="crawl output from the FLM scraper")
    ap.add_argument("--catalog", required=True, help="path to SkillDataTemplate.csv (roadmap.sh skills)")
    ap.add_argument("--career", help="restrict the gap report to one career (e.g. Backend, Frontend)")
    ap.add_argument("--curriculum-html", help="dumped CurriculumDetails HTML for semester/credits (offline)")
    ap.add_argument("--out", default="flm_coverage.json")
    ap.add_argument("--overlay", help="also write the merged subject overlay (e.g. flm_overlay.json)")
    args = ap.parse_args()

    with open(args.flm, encoding="utf-8") as f:
        flm = json.load(f)
    catalog = load_catalog(args.catalog)
    log.info("Catalog: %d skills | FLM subjects: %d", len(catalog), len(flm.get("subjects", [])))

    result = build_coverage(flm, catalog, args.career)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    su = result["summary"]
    log.info(
        "career=%s catalog=%d covered=%d gap=%d extra=%d -> %s",
        result["career_filter"], su["catalog_skills"], su["covered"], su["gap"],
        su["extra_not_in_catalog"], args.out,
    )

    if args.overlay:
        curriculum = load_curriculum(args.curriculum_html) if args.curriculum_html else {}
        overlay = build_overlay(flm, result, curriculum)
        with open(args.overlay, "w", encoding="utf-8") as f:
            json.dump(overlay, f, ensure_ascii=False, indent=2)
        log.info(
            "overlay: %d subjects (%d from curriculum) -> %s",
            len(overlay["subjects"]), len(curriculum), args.overlay,
        )


if __name__ == "__main__":
    main()
