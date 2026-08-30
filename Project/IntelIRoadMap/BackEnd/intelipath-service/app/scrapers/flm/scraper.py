"""
FLM scraper — pulls the data that anchors IntelIPath's roadmap to a real FPT
curriculum: subjects, syllabus CLOs (= skills), and prerequisites (= roadmap edges).

Setup:
    1. Log in to flm.fpt.edu.vn (via FEID) in a browser.
    2. DevTools -> Network -> click any flm request -> copy the whole `Cookie:` header.
    3. Put it in intelipath-service/.env as:  FLM_COOKIE=<that cookie string>

Usage (run from the intelipath-service/ directory):
    python -m app.scrapers.flm.scraper codes      --term SE
    python -m app.scrapers.flm.scraper syllabus   --code SWE201c
    python -m app.scrapers.flm.scraper curriculum --curid 2507
    python -m app.scrapers.flm.scraper prereq     --code SWE201c
    python -m app.scrapers.flm.scraper crawl      --prefixes SE,SWE,PRN,DBI --out flm_data.json

Add `--dump ./debug` to any command to save the raw HTML for selector tuning.
"""
import argparse
import json
import logging
import pathlib
import sys

from app.scrapers.flm import parsers as P
from app.scrapers.flm.client import FlmAuthError, FlmClient, FlmDataError

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("flm")

_DUMP_DIR = None


def _dump(name: str, soup) -> None:
    if _DUMP_DIR:
        d = pathlib.Path(_DUMP_DIR)
        d.mkdir(parents=True, exist_ok=True)
        (d / f"{name}.html").write_text(str(soup), encoding="utf-8")


def _print(obj) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2))


def scrape_syllabus(client: FlmClient, code: str, cur_id=None) -> list[dict]:
    """Search a subject code, then pull each matching syllabus (meta + CLOs).

    find_syllabus_links returns the current version first, and downstream consumers
    read [0], so this list's order is meaningful — don't re-sort it.
    """
    results = client.search_syllabus(code, cur_id)
    _dump(f"syl_search_{code}", results)
    out = []
    for link in P.find_syllabus_links(results):
        page = client.syllabus_details(link["sylID"])
        _dump(f"syl_{link['sylID']}", page)
        out.append(
            {
                "sylID": link["sylID"],
                "approved": link.get("approved", False),
                "active": link.get("active", False),
                "decision": link.get("decision", ""),
                "meta": P.parse_syllabus_meta(page),
                "clos": P.parse_clos(page),
                "materials": P.parse_materials(page),
                "sessions": P.parse_sessions(page, client.syllabus_details_url(link["sylID"])),
            }
        )
    return out


def _merge_group(curriculum: dict, subjects: list[dict], *, elective: bool,
                 combo_code: str = "", combo_name: str = "") -> None:
    """Fold combo/elective subject rows into the {CODE -> {...}} curriculum dict.

    The CurriculumDetails table is richer (credits/prerequisite), so it wins; combos
    and electives only add codes it didn't list and backfill a missing semester.
    Elective options are flagged so downstream can treat them as choose-one.

    Combo subjects keep their combo tag. Without it every combo's subjects collapse
    into one flat list, and a .NET student is shown the Java combo's courses: the
    curriculum only reserves slots (SE_COM*1..*3) and the real subjects — HSF302 /
    SBA301 / MSS301 for Intensive Java — live behind whichever combo was crawled.
    """
    for s in subjects:
        code = (s.get("code") or "").upper()
        if not code:
            continue
        existing = curriculum.get(code)
        if existing:
            if existing.get("semester") is None and s.get("semester") is not None:
                existing["semester"] = s["semester"]
            existing.setdefault("name", s.get("name", ""))
            # A trunk subject listed by CurriculumDetails stays trunk (combo_code
            # ""), so a combo can never narrow who is shown a shared course.
            existing.setdefault("combo_code", combo_code)
            existing.setdefault("combo_name", combo_name)
        else:
            curriculum[code] = {
                "name": s.get("name", ""),
                "semester": s.get("semester"),
                "credits": None,
                "prerequisite": "",
                "elective": elective,
                "combo_code": combo_code,
                "combo_name": combo_name,
            }


def discover_curriculum(client: FlmClient, curid) -> dict[str, dict]:
    """Every subject in a curriculum via the combo/elective flow — no prefix guessing.

    Unions the CurriculumDetails subjects with all combo (Compo/Detail) and elective
    (Elective/Detail) subjects. A single unreachable group is logged and skipped, not
    fatal. Returns {CODE_UPPER -> {name, semester, credits, prerequisite, [elective]}}.
    """
    from app.scrapers.flm.flm_to_coverage import curriculum_from_soup

    curriculum = curriculum_from_soup(client.curriculum_details(curid))

    def _collect(list_page, find_links, fetch_detail, label, elective):
        try:
            ids = find_links(list_page())
        except FlmAuthError:
            raise  # a dead cookie is fatal — don't mask it as an empty group
        except Exception as exc:  # noqa: BLE001 - a missing/renamed list page isn't fatal
            log.warning("%s list failed: %s", label, exc)
            return
        for gid in ids:
            try:
                page = fetch_detail(gid)
                subjects = P.parse_group_subjects(page)
                # Electives are choose-one options, not a named specialisation, so
                # only combos carry a code a student's record can pin to.
                code, name = ("", "") if elective else P.split_combo_label(P.parse_combo_name(page))
            except FlmAuthError:
                raise
            except Exception as exc:  # noqa: BLE001 - one bad group shouldn't abort
                log.warning("  %s %s failed: %s", label, gid, exc)
                continue
            if not elective and not code:
                log.warning("  combo %s has no parsable code; its subjects stay untagged", gid)
            _merge_group(curriculum, subjects, elective=elective,
                         combo_code=code, combo_name=name)

    _collect(lambda: client.combo_list(curid), P.find_combo_links,
             lambda gid: client.combo_detail(gid, curid), "combo", False)
    _collect(lambda: client.elective_list(curid), P.find_elective_links,
             lambda gid: client.elective_detail(gid, curid), "elective", True)
    return curriculum


def cmd_codes(client: FlmClient, args) -> None:
    codes: list[str] = []
    for term in args.term.split(","):
        codes += client.subject_codes(term.strip())
    _print(sorted(set(codes)))


def cmd_syllabus(client: FlmClient, args) -> None:
    _print({"code": args.code, "syllabus": scrape_syllabus(client, args.code)})


def cmd_curricula(client: FlmClient, args) -> None:
    """Search curricula by keyword -> list of {curid, text} so you can find one."""
    results = client.search_curriculum(args.keyword)
    _dump(f"cur_search_{args.keyword}", results)
    _print({"keyword": args.keyword, "curricula": P.find_curriculum_links(results)})


def cmd_curriculum(client: FlmClient, args) -> None:
    page = client.curriculum_details(args.curid)
    _dump(f"cur_{args.curid}", page)
    _print({"curid": args.curid, "subjects": P.parse_curriculum_subjects(page)})


def cmd_prereq(client: FlmClient, args) -> None:
    results = client.search_prerequisites(args.code)
    _dump(f"prereq_{args.code}", results)
    _print({"code": args.code, "prerequisites": P.parse_prerequisites(results)})


def cmd_crawl(client: FlmClient, args) -> None:
    if args.codes:
        codes = sorted({c.strip() for c in args.codes.split(",") if c.strip()})
        log.info("Crawling %d explicit subject codes", len(codes))
    elif args.curid:
        curriculum = discover_curriculum(client, args.curid)
        codes = sorted(curriculum)
        log.info("Discovered %d subjects from curriculum %s (combos + electives)",
                 len(codes), args.curid)
    elif args.prefixes:
        prefixes = [p.strip() for p in args.prefixes.split(",") if p.strip()]
        codes = sorted({c for p in prefixes for c in client.subject_codes(p)})
        log.info("Discovered %d subject codes from prefixes %s", len(codes), prefixes)
    else:
        log.error("Pass --codes, --curid or --prefixes")
        return

    data = {"subjects": []}
    for code in codes:
        try:
            entry = {
                "code": code,
                "syllabus": scrape_syllabus(client, code, args.curid),
                "prerequisites": P.parse_prerequisites(client.search_prerequisites(code)),
            }
            data["subjects"].append(entry)
            log.info(
                "  %-12s %d syllabus, %d prereq rows",
                code,
                len(entry["syllabus"]),
                len(entry["prerequisites"]),
            )
        except FlmAuthError:
            raise
        except Exception as exc:  # noqa: BLE001 - keep crawling other subjects
            log.warning("  %-12s failed: %s", code, exc)

    out = pathlib.Path(args.out)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Wrote %s (%d subjects)", out, len(data["subjects"]))


def main() -> None:
    global _DUMP_DIR
    # Shared flags, accepted AFTER the subcommand (e.g. `syllabus --code X --dump d`).
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--cookie", help="override FLM_COOKIE from .env")
    common.add_argument("--dump", help="directory to save raw HTML for selector tuning")

    ap = argparse.ArgumentParser(description="FLM (FPT Learning Management) scraper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("codes", parents=[common], help="list subject codes for a search term")
    p.add_argument("--term", required=True, help="prefix(es), comma-separated (e.g. SE,SWE)")
    p = sub.add_parser("syllabus", parents=[common], help="syllabus meta + CLOs for a subject code")
    p.add_argument("--code", required=True)
    p = sub.add_parser("curricula", parents=[common], help="search curricula by keyword -> curid")
    p.add_argument("--keyword", required=True, help="curriculum code/name (e.g. SE, BIT_SE)")
    p = sub.add_parser("curriculum", parents=[common], help="subjects in a curriculum by curid")
    p.add_argument("--curid", required=True)
    p = sub.add_parser("prereq", parents=[common], help="prerequisites for a subject code")
    p.add_argument("--code", required=True)
    p = sub.add_parser("crawl", parents=[common], help="crawl syllabi + prerequisites for many subjects")
    p.add_argument("--codes", help="explicit subject codes, comma-separated (e.g. PRO192,CSD201,PRJ301)")
    p.add_argument("--curid", help="OR discover every subject in a curriculum (combos + electives)")
    p.add_argument("--prefixes", help="OR discover by prefix via autocomplete (legacy fallback)")
    p.add_argument("--out", default="flm_data.json")

    args = ap.parse_args()
    _DUMP_DIR = args.dump
    client = FlmClient(cookie=args.cookie)

    handlers = {
        "codes": cmd_codes,
        "syllabus": cmd_syllabus,
        "curriculum": cmd_curriculum,
        "prereq": cmd_prereq,
        "crawl": cmd_crawl,
    }
    try:
        handlers[args.cmd](client, args)
    except FlmAuthError as exc:
        log.error("AUTH: %s", exc)
        sys.exit(2)


if __name__ == "__main__":
    main()
