"""
Parse FLM HTML pages into structured records.

Written against real pages (SyllabusDetails sylID=13165 / PRJ301), but still keyed off
stable signals — `sylID` / `curid` links and header-text matching — rather than FLM's
generated ids, which differ per page type. A SyllabusDetails page carries five tables:

    table-detail   subject meta (code, credits, prerequisite, tools, description)
    gvMaterial     textbook/reference list — bibliographic, NOT downloadable files
    gvLO           CLOs (4-13 per subject)
    gvSchedule     sessions; the S-Download column is the only source of real files
    gvAssessment   assessment scheme (not parsed yet)

Downloads are sparse: across a 28-subject curriculum only ~33 files exist and 7
subjects have none, so "no material" is a normal state, not a parse failure.

Run the scraper with `--dump <dir>` to save raw HTML when tuning selectors.
"""
import logging
import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

log = logging.getLogger(__name__)

_SYL_RE = re.compile(r"SyllabusDetails(?:\.aspx)?\?sylID=(\d+)", re.I)
_CUR_RE = re.compile(r"CurriculumDetails(?:\.aspx)?\?curid=(\d+)", re.I)
_COMBO_RE = re.compile(r"/Compo/Detail/(\d+)", re.I)
_ELECTIVE_RE = re.compile(r"/Elective/Detail/(\d+)", re.I)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def table_records(table: Tag) -> list[dict]:
    """Turn one <table> into a list of {header: cell} dicts (+ *_href for links)."""
    rows = table.find_all("tr")
    if not rows:
        return []
    header_cells = rows[0].find_all(["th", "td"])
    headers = [_clean(c.get_text()) or f"col{i}" for i, c in enumerate(header_cells)]
    out = []
    for r in rows[1:]:
        cells = r.find_all(["td", "th"])
        if not cells:
            continue
        rec = {}
        for i, c in enumerate(cells):
            key = headers[i] if i < len(headers) else f"col{i}"
            rec[key] = _clean(c.get_text())
            link = c.find("a", href=True)
            if link:
                rec[key + "_href"] = link["href"]
        out.append(rec)
    return out


def all_tables(soup: BeautifulSoup) -> list[list[dict]]:
    return [recs for t in soup.find_all("table") if (recs := table_records(t))]


_DECISION_DATE_RE = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})")

    
def _header_index(table: Tag) -> dict:
    """{header text (lowercased) -> column index} for a table's first row."""
    rows = table.find_all("tr")
    if not rows:
        return {}
    cells = rows[0].find_all(["th", "td"])
    return {_clean(c.get_text()).lower(): i for i, c in enumerate(cells)}


def _cell(row: Tag, headers: dict, name: str):
    idx = headers.get(name)
    if idx is None:
        return None
    cells = row.find_all(["td", "th"])
    return cells[idx] if idx < len(cells) else None


def _decision_sort_key(text: str) -> tuple:
    """(year, month, day) from 'DecisionNo dated MM/DD/YYYY'; zeros when absent."""
    m = _DECISION_DATE_RE.search(text or "")
    if not m:
        return (0, 0, 0)
    month, day, year = (int(g) for g in m.groups())
    return (year, month, day)


def find_syllabus_links(soup: BeautifulSoup) -> list[dict]:
    """
    Discover sylID links on a syllabus search-results page, current version first.

    One subject often carries several syllabus versions (PRO192 and DBI202 each have
    two, and the row's code may differ from the searched one — PRO192 lists PRO192c).
    FLM does not print them newest-first, so callers that take [0] blindly can land on
    a superseded version: DBI202's first row parses to zero CLOs, which silently
    removes the subject's whole skill signal. Rank approved+active, then by decision
    date, so [0] is the version actually being taught.
    """
    seen = {}
    for a in soup.find_all("a", href=_SYL_RE):
        sid = _SYL_RE.search(a["href"]).group(1)
        if sid in seen:
            continue
        row = a.find_parent("tr")
        table = a.find_parent("table")
        headers = _header_index(table) if table else {}
        approved = active = False
        decision = ""
        code = ""
        if row is not None:
            for key, flag in (("isapproved", "approved"), ("isactive", "active")):
                cell = _cell(row, headers, key)
                checked = cell.find("input", checked=True) is not None if cell else False
                if flag == "approved":
                    approved = checked
                else:
                    active = checked
            dec_cell = _cell(row, headers, "decisionno")
            decision = _clean(dec_cell.get_text()) if dec_cell else ""
            code_cell = _cell(row, headers, "subject code")
            code = _clean(code_cell.get_text()) if code_cell else ""
        seen[sid] = {
            "sylID": sid,
            "text": _clean(a.get_text()),
            "code": code,
            "approved": approved,
            "active": active,
            "decision": decision,
        }
    return sorted(
        seen.values(),
        key=lambda s: (s["approved"], s["active"], _decision_sort_key(s["decision"])),
        reverse=True,
    )


def find_curriculum_links(soup: BeautifulSoup) -> list[dict]:
    seen = {}
    for a in soup.find_all("a", href=_CUR_RE):
        cid = _CUR_RE.search(a["href"]).group(1)
        seen.setdefault(cid, {"curid": cid, "text": _clean(a.get_text())})
    return list(seen.values())


def _content(soup: BeautifulSoup) -> Tag:
    """The main content region, so link scans skip the (id-heavy) sidebar nav."""
    return soup.find(id="content") or soup


def _detail_ids(soup: BeautifulSoup, pattern: re.Pattern) -> list[str]:
    seen: list[str] = []
    for a in _content(soup).find_all("a", href=True):
        m = pattern.search(a["href"])
        if m and m.group(1) not in seen:
            seen.append(m.group(1))
    return seen


def find_combo_links(soup: BeautifulSoup) -> list[str]:
    """Combo ids from a Compo/ViewComBo list page -> /Compo/Detail/{id}."""
    return _detail_ids(soup, _COMBO_RE)


def find_elective_links(soup: BeautifulSoup) -> list[str]:
    """Elective-group ids from an Elective/ViewElective list page -> /Elective/Detail/{id}."""
    return _detail_ids(soup, _ELECTIVE_RE)


def parse_combo_name(soup: BeautifulSoup) -> str:
    """
    The 'Combo Name' header on a Compo/Detail page, e.g.
    "SE_COM10.2: Topic on Intensive Java_Chủ đề Java chuyên sâu_K19A".
    """
    for row in soup.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) >= 2 and _clean(cells[0].get_text()).lower().startswith("combo name"):
            return _clean(cells[1].get_text())
    return ""


def split_combo_label(label: str) -> tuple[str, str]:
    """
    Split "SE_COM10.2: Topic on Intensive Java_..." into ("SE_COM10.2", "Topic on ...").

    The code is what a student's record pins to; the name is only ever displayed. A
    label without the colon has no code we can trust, so it stays unkeyed rather than
    inventing one.
    """
    label = _clean(label)
    if ":" not in label:
        return "", label
    code, name = label.split(":", 1)
    return _clean(code), _clean(name)


def parse_group_subjects(soup: BeautifulSoup) -> list[dict]:
    """Subjects listed on a Compo/Detail or Elective/Detail page.

    Both render a `table-infomation` table with a `Subject Code` column (combos also
    carry `Semester`; electives don't). Returns [{code, name, semester, note}].
    """
    def _int(v: str):
        v = (v or "").strip()
        return int(v) if v.isdigit() else None

    for t in soup.find_all("table"):
        recs = table_records(t)
        if not recs:
            continue
        keys = " ".join(recs[0].keys()).lower()
        if "subject code" not in keys:
            continue
        out = []
        for r in recs:
            code = (r.get("Subject Code") or "").strip().upper()
            if not code:
                continue
            out.append(
                {
                    "code": code,
                    "name": (r.get("Subject Name") or "").strip(),
                    "semester": _int(r.get("Semester", "")),
                    "note": (r.get("Note") or "").strip(),
                }
            )
        if out:
            return out
    return []


def _pick_table(soup: BeautifulSoup, keywords: tuple[str, ...]) -> list[dict]:
    """Pick the table whose columns best match `keywords`, biggest wins ties."""
    tables = all_tables(soup)
    if not tables:
        return []

    def score(recs: list[dict]) -> int:
        keys = " ".join(recs[0].keys()).lower()
        return sum(k in keys for k in keywords) * 1000 + len(recs)

    return max(tables, key=score)


def parse_curriculum_subjects(soup: BeautifulSoup) -> list[dict]:
    """Subjects on a CurriculumDetails page (code, name, credits, semester...)."""
    return _pick_table(soup, ("code", "subject", "name", "credit", "semester"))


_CLO_CODE = re.compile(r"CLO\s*\d+", re.I)


def parse_clos(soup: BeautifulSoup) -> list[dict]:
    """
    Course Learning Outcomes from a SyllabusDetails page — the skill signal.

    Normalised to [{"code": "CLO1", "outcome": "<learning outcome text>"}]. FLM's
    CLO table columns vary in label ("CLO Details" / "LO Details" / ...), so we
    detect the column holding CLO codes and pair it with the longest-text column.
    """
    for t in soup.find_all("table"):
        recs = table_records(t)
        if not recs:
            continue
        cols = [c for c in recs[0].keys() if not c.endswith("_href")]
        # the code column has cells like "CLO1"
        code_col = next(
            (c for c in cols if any(_CLO_CODE.fullmatch(r.get(c, "")) for r in recs)),
            None,
        )
        if code_col is None:
            continue
        # the outcome column is the wordiest non-code column
        text_cols = [c for c in cols if c != code_col]
        outcome_col = max(
            text_cols,
            key=lambda c: sum(len(r.get(c, "")) for r in recs),
            default=None,
        )
        out = []
        for r in recs:
            code = re.sub(r"\s+", "", r.get(code_col, "")).upper()
            if _CLO_CODE.fullmatch(code):
                out.append({"code": code, "outcome": r.get(outcome_col, "") if outcome_col else ""})
        if out:
            return out
    return []


_META_LABELS = re.compile(
    r"(Subject Code|Subject Name|English Name|No\.? of credits?|Credits?|"
    r"Degree Level|Time Allocation|Pre-?requisite|Description)\s*[:：]?$",
    re.I,
)


def parse_syllabus_meta(soup: BeautifulSoup) -> dict:
    """Labelled header fields (Subject Code / Name / Credits / ...) on a syllabus page."""
    meta = {}
    for lbl in soup.find_all(["td", "span", "label", "th"]):
        m = _META_LABELS.match(_clean(lbl.get_text()))
        if not m:
            continue
        nxt = lbl.find_next(["td", "span"])
        if nxt:
            meta[m.group(1).strip()] = _clean(nxt.get_text())
    return meta


_HTTP_RE = re.compile(r"https?://[^\s'\"<>]+", re.I)


def _first_url_in_row(r: dict, prefer: tuple[str, ...] = ()) -> str:
    """Lift the first URL in a record: prefer named columns, then any link, then any
    http-looking cell text. FLM stores online-material links (Coursera, YouTube, …)
    in the *Note* column, not as a proper <a>, so a text scan is required."""
    for col in prefer:
        href = r.get(col + "_href", "").strip()
        if href:
            return href
        m = _HTTP_RE.search(r.get(col, ""))
        if m:
            return m.group(0)
    for k, v in r.items():
        if k.endswith("_href") and v.strip():
            return v.strip()
    for k, v in r.items():
        if k.endswith("_href"):
            continue
        m = _HTTP_RE.search(v or "")
        if m:
            return m.group(0)
    return ""


def parse_materials(soup: BeautifulSoup) -> list[dict]:
    """
    Learning materials (textbooks / online references) from a SyllabusDetails page.

    The materials table is identified by its columns (MaterialDescription + Author).
    Online materials (Coursera specializations, YouTube, …) carry their link in the
    *Note* column as plain text, so we scan the whole row for a URL and expose it as
    `url` for the frontend to open directly.
    """
    for t in soup.find_all("table"):
        recs = table_records(t)
        if not recs:
            continue
        keys = " ".join(recs[0].keys()).lower()
        if "material" not in keys or "author" not in keys:
            continue
        out = []
        for r in recs:
            desc = r.get("MaterialDescription", "").strip()
            url = _first_url_in_row(r, prefer=("MaterialDescription", "Note"))
            if not (desc or url):
                continue
            online = (
                bool(url)
                or r.get("IsOnline", "").strip().lower() in ("true", "1", "yes", "x")
            )
            out.append(
                {
                    "description": desc,
                    "author": r.get("Author", ""),
                    "publisher": r.get("Publisher", ""),
                    "isbn": r.get("ISBN", ""),
                    "url": url,
                    "note": r.get("Note", ""),
                    "online": online,
                    "main": r.get("IsMainMaterial", "").strip().lower() in ("true", "1", "yes", "x"),
                }
            )
        return out
    return []


def _first_link(href: str) -> str:
    """
    The first URL out of an href, which is not always just one.

    Some syllabi paste several references into a single anchor separated by "; " (usually
    already percent-encoded as %20;%20). Left whole, the lot gets resolved into one
    nonsense URL — `~amidi/teaching/...%20;%20https:/colab...` became a valid-looking
    flm.fpt.edu.vn link that serves an HTML page.
    """
    for sep in ("%20;%20", "%20;", "; ", ";", " "):
        if sep in href:
            href = href.split(sep, 1)[0]
    return href.strip()


def _looks_like_download(url: str) -> bool:
    """
    Whether a resolved URL actually addresses a file.

    FLM serves materials two ways — a static path (`/download/12674/S/1_PRJ301.zip`) and
    a handler (`/file/download?scheduleId=371144`) — and both say "download". A syllabus
    link that resolves to a page instead is a reference, not this session's file; storing
    it would have us mirror HTML and offer it as course material.
    """
    return "download" in urlparse(url).path.lower()


def _resolve_download(r: dict, base_url: str) -> str:
    """
    Absolute URL for a session's S-Download link, or "".

    FLM writes these hrefs *relative to the syllabus page*
    (`../../../download/12674/S/1_PRJ301.zip`), so they must be resolved against the
    page URL. Three traps live here:
      - The id in the path (12674) is NOT the sylID of the page (13165). The href is
        the only source of it, so it can never be reconstructed from the sylID.
      - Requiring the href to start with "http" drops every real link, silently
        leaving the overlay with zero downloadable material.
      - An href may hold several links, or point at a page rather than a file.
    """
    raw = (r.get("S-Download_href") or "").strip()
    if not raw:
        m = _HTTP_RE.search(r.get("S-Download", "") or "")
        raw = m.group(0) if m else ""
    if not raw:
        return ""

    href = _first_link(raw)
    if href.lower().startswith("http"):
        resolved = href
    elif base_url:
        resolved = urljoin(base_url, href)
    else:
        log.warning("Dropping relative S-Download href %r: parse_sessions got no base_url", href)
        return ""

    if not _looks_like_download(resolved):
        log.warning("Ignoring S-Download %r: resolves to a page, not a file", resolved[:120])
        return ""
    return resolved


def parse_sessions(soup: BeautifulSoup, base_url: str = "") -> list[dict]:
    """
    Session-by-session schedule from a SyllabusDetails page — the concrete lessons.

    Identified by a table that has both a Session and a Topic column. Each row keeps
    the topic, the LO it maps to, student materials and any download link.

    `base_url` is the URL of the syllabus page itself; download links are relative to
    it and are dropped without it.
    """
    for t in soup.find_all("table"):
        recs = table_records(t)
        if not recs:
            continue
        keys = [k.lower() for k in recs[0].keys()]
        if not (any(k == "session" for k in keys) and any("topic" in k for k in keys)):
            continue
        out = []
        for r in recs:
            download = _resolve_download(r, base_url)
            out.append(
                {
                    "session": r.get("Session", ""),
                    "topic": r.get("Topic", ""),
                    "lo": r.get("LO", ""),
                    "materials": r.get("Student Materials", ""),
                    "download": download,
                    "url": _first_url_in_row(r, prefer=("URLs", "URL")),
                    "tasks": r.get("Student's Tasks", ""),
                }
            )
        return out
    return []


def parse_prerequisites(soup: BeautifulSoup) -> list[dict]:
    """
    Prerequisite rows from AllPrequisiteSubject — roadmap edges.
    The data table has a 'All subjects need to learn before' column holding the
    (transitive) prerequisite chain; key off that so we don't grab the search form.
    """
    return _pick_table(soup, ("learn before", "syllabus id", "syllabus name", "prerequisite"))
