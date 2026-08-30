"""
Low-level HTTP client for FLM (FPT Learning Management, flm.fpt.edu.vn).

FLM is an ASP.NET WebForms app: every search is a form POST that must echo back
the per-page hidden tokens (__VIEWSTATE / __VIEWSTATEGENERATOR / __EVENTVALIDATION).
So a "search" is really: GET the page, scrape those tokens, then POST them plus the
search field. Plain POSTs without the tokens are rejected.

Auth is a browser session cookie (login via FEID first). Put the full `Cookie:`
header from a logged-in request into .env as FLM_COOKIE, or pass cookie=... here.
"""
import logging
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup

from app.config.config import settings

logger = logging.getLogger(__name__)

# ASP.NET WebForms hidden fields to post back on every form submit (from the HAR).
_HIDDEN_FIELDS = (
    "__EVENTTARGET",
    "__EVENTARGUMENT",
    "__VIEWSTATE",
    "__VIEWSTATEGENERATOR",
    "__VIEWSTATEENCRYPTED",
    "__EVENTVALIDATION",
)

# MUST match the browser that obtained cf_clearance — Cloudflare binds the
# clearance cookie to (IP, User-Agent). Override via FlmClient(user_agent=...) or
# the FLM_USER_AGENT env var if your Chrome version differs.
_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
)


class FlmAuthError(RuntimeError):
    """FLM redirected to login — the session cookie is missing or expired."""


class FlmDataError(RuntimeError):
    """FLM returned a 200 whose body wasn't the JSON/shape we expected."""


class FlmClient:
    """A thin, polite, session-based client for FLM's WebForms pages."""

    # WebForms control-id prefix observed in the HAR (ctl00$ContentPlaceHolder1$...).
    CP = "ctl00$ContentPlaceHolder1$"

    def __init__(
        self,
        cookie: Optional[str] = None,
        base_url: Optional[str] = None,
        delay_ms: Optional[int] = None,
        user_agent: Optional[str] = None,
    ):
        self.base_url = (base_url or settings.flm_base_url).rstrip("/")
        self.delay = (delay_ms if delay_ms is not None else settings.flm_delay_ms) / 1000.0
        self.session = requests.Session()
        ua = user_agent or getattr(settings, "flm_user_agent", "") or _UA
        self.session.headers.update(
            {
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
        )
        cookie = cookie or settings.flm_cookie
        if cookie:
            self.session.headers["Cookie"] = cookie.strip()

    # -- internals ----------------------------------------------------------

    def _url(self, path: str) -> str:
        return path if path.startswith("http") else f"{self.base_url}/{path.lstrip('/')}"

    def _check_auth(self, resp: requests.Response) -> None:
        final = resp.url.lower()
        if (
            "loginwithfeid" in final
            or "feid.fpt.edu.vn" in final
            or "/home/login" in final
            or "accounts.google.com" in final
        ):
            raise FlmAuthError(
                "FLM redirected to login — set a valid FLM_COOKIE (session expired?)."
            )
        # Cloudflare serves its challenge as HTTP 200 + HTML at the SAME url (no
        # redirect), so pages "load" but API handlers return that HTML instead of
        # JSON. Detect it early with a clear message rather than a JSON decode error.
        ctype = resp.headers.get("Content-Type", "").lower()
        if "text/html" in ctype or not ctype:
            head = resp.text[:1500].lower()
            if "just a moment" in head or "cf-chl" in head or "challenge-platform" in head:
                raise FlmAuthError(
                    "FLM is behind a Cloudflare challenge — the cookie must include a "
                    "valid cf_clearance obtained with the SAME browser User-Agent."
                )

    def get_soup(self, path: str, params: Optional[dict] = None) -> BeautifulSoup:
        time.sleep(self.delay)
        resp = self.session.get(self._url(path), params=params, timeout=30)
        self._check_auth(resp)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")

    def get_json(self, path: str, params: Optional[dict] = None):
        time.sleep(self.delay)
        resp = self.session.get(
            self._url(path),
            params=params,
            timeout=30,
            headers={
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
            },
        )
        self._check_auth(resp)
        resp.raise_for_status()
        try:
            return resp.json()
        except ValueError as exc:
            # 200 OK but not JSON — typically an HTML error/interstitial page when
            # the session is only partially valid, or the endpoint moved. Turn the
            # cryptic "Expecting value: line 3 column 1" into something actionable.
            snippet = " ".join(resp.text.split())[:160]
            raise FlmDataError(
                f"{path} returned non-JSON (HTTP {resp.status_code}); "
                f"the FLM session may be incomplete. Body starts: {snippet!r}"
            ) from exc

    @staticmethod
    def _hidden_fields(soup: BeautifulSoup) -> dict:
        data = {}
        for name in _HIDDEN_FIELDS:
            el = soup.find("input", {"name": name})
            if el is not None:
                data[name] = el.get("value", "")
        return data

    def search(self, path: str, fields: dict) -> BeautifulSoup:
        """WebForms postback: GET the page for its hidden tokens, then POST the search."""
        page = self.get_soup(path)
        data = self._hidden_fields(page)
        if "__VIEWSTATE" not in data:
            # The page loaded (auth already checked in get_soup) but isn't the WebForms
            # page we expected — usually a moved/renamed endpoint. That's a data problem,
            # not a dead cookie, so callers can skip this one subject instead of aborting.
            raise FlmDataError(
                f"No __VIEWSTATE on {path} — the page moved or isn't available to this role."
            )
        data.update(fields)
        time.sleep(self.delay)
        resp = self.session.post(self._url(path), data=data, timeout=30)
        self._check_auth(resp)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")

    # -- endpoint wrappers (paths + field names taken from the HAR) ----------

    def subject_codes(self, term: str) -> list[str]:
        """Autocomplete handler → subject codes starting with `term`.

        Prefix discovery is best-effort: a single term whose response isn't JSON
        (moved endpoint, transient error) is logged and skipped rather than aborting
        the whole sync — curriculum subjects already found still get processed.
        """
        try:
            data = self.get_json("/api/ListSubjectCodeHandler.ashx", {"term": term})
        except FlmDataError as exc:
            logger.warning("subject_codes(%s) skipped: %s", term, exc)
            return []
        out = []
        for it in data if isinstance(data, list) else []:
            if isinstance(it, str):
                out.append(it)
            elif isinstance(it, dict):
                out.append(it.get("value") or it.get("label") or "")
        return [c for c in out if c]

    def search_syllabus(self, subject_code: str, cur_id=None) -> BeautifulSoup:
        """Student syllabus search — a plain GET that filters by subject code (and, when
        known, curriculum), whose results link to SyllabusDetails. The staff
        SyllabusManagement page needs a WebForms postback and isn't open to students."""
        params = {"subCode": subject_code}
        if cur_id:
            params["curriculumID"] = cur_id
        return self.get_soup("/gui/role/student/Syllabuses", params)

    SYLLABUS_DETAILS_PATH = "/gui/role/student/SyllabusDetails"

    def syllabus_details(self, syl_id) -> BeautifulSoup:
        return self.get_soup(self.SYLLABUS_DETAILS_PATH, {"sylid": syl_id})

    def syllabus_details_url(self, syl_id) -> str:
        """The page's own URL — session download hrefs are relative to it, so the
        parser needs it to resolve them (see parsers._resolve_download)."""
        return f"{self._url(self.SYLLABUS_DETAILS_PATH)}?sylid={syl_id}"

    def search_curriculum(self, keyword: str) -> BeautifulSoup:
        return self.search(
            "/gui/role/student/ListCurriculum",
            {
                self.CP + "ddlSeachOn": "Code",
                self.CP + "txtKeyword": keyword,
                self.CP + "btnSearch": "Search",
            },
        )

    def curriculum_details(self, cur_id) -> BeautifulSoup:
        return self.get_soup("/gui/role/student/CurriculumDetails", {"curid": cur_id})

    # -- combo / elective discovery (the modern per-curriculum flow) ----------
    # A curriculum's subjects live across three surfaces: the CurriculumDetails
    # table, its combos (Compo/ViewComBo -> Compo/Detail), and its elective groups
    # (Elective/ViewElective -> Elective/Detail). Together they replace prefix
    # guessing (and the flaky ListSubjectCodeHandler.ashx autocomplete).

    def combo_list(self, cur_id) -> BeautifulSoup:
        return self.get_soup("/Compo/ViewComBo", {"cur_id": cur_id})

    def combo_detail(self, combo_id, cur_id) -> BeautifulSoup:
        return self.get_soup(f"/Compo/Detail/{combo_id}", {"curriculumID": cur_id})

    def elective_list(self, cur_id) -> BeautifulSoup:
        return self.get_soup("/Elective/ViewElective", {"cur_id": cur_id})

    def elective_detail(self, elective_id, cur_id) -> BeautifulSoup:
        return self.get_soup(f"/Elective/Detail/{elective_id}", {"curriculumID": cur_id})

    def search_prerequisites(self, subject_code: str) -> BeautifulSoup:
        return self.search(
            "/gui/tool/AllPrequisiteSubject",
            {
                self.CP + "txtSubCode": subject_code,
                self.CP + "btnSearch": "Search",
            },
        )
