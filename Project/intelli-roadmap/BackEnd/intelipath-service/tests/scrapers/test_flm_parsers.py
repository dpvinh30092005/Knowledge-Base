"""
Parser tests built from the real FLM markup (SyllabusDetails sylID=13165 / PRJ301).

These cover the failures that are invisible at runtime: the scraper still returns a
well-formed record, just with the downloads or the CLOs quietly missing.
"""
from bs4 import BeautifulSoup

from app.scrapers.flm import parsers as P

SYLLABUS_URL = "https://flm.fpt.edu.vn/gui/role/student/SyllabusDetails?sylid=13165"

# Trimmed from the live gvSchedule: session 1 carries the download, session 2 doesn't.
# The href is relative and its id (12674) differs from the page's sylID (13165).
SCHEDULE_HTML = """
<table id="gvSchedule">
  <tr><th>Session</th><th>Topic</th><th>Learning-Teaching Type</th><th>LO</th>
      <th>ITU</th><th>Student Materials</th><th>S-Download</th>
      <th>Student's Tasks</th><th>URLs</th></tr>
  <tr><td>1</td><td>Introduction to java web application</td><td>Offline</td><td>LO1</td>
      <td>IT</td><td>Textbook: Chapter 1 &amp; 2</td>
      <td><a href="../../../download/12674/S/1_PRJ301.zip">PRJ301</a></td>
      <td>Read textbook, do exercise</td><td></td></tr>
  <tr><td>2</td><td>Setup Environment</td><td>Offline</td><td>LO1</td>
      <td>TU</td><td>Textbook: Chapter 1 &amp; 2</td><td></td>
      <td>Read textbook, do exercise</td><td></td></tr>
</table>
"""

CLO_HTML = """
<table id="gvLO">
  <tr><th>CLO Name</th><th>CLO Details</th><th>LO Details</th></tr>
  <tr><td>1</td><td>CLO1</td><td>understand the basic web application structure</td></tr>
  <tr><td>2</td><td>CLO2</td><td>work with the basic features of Java web application</td></tr>
</table>
"""

# gvSyllabus list page: two versions of one subject. FLM prints the superseded row
# first, and the searched code (PRO192) is not the code the row shows (PRO192c).
SYLLABUS_LIST_HTML = """
<table>
  <tr><th>Subject Code</th><th>Syllabus Name</th><th>IsActive</th><th>IsApproved</th>
      <th>DecisionNo</th></tr>
  <tr><td>PRO192</td>
      <td><a href="SyllabusDetails.aspx?sylid=9001">Object-Oriented Programming (old)</a></td>
      <td><input type="checkbox" disabled="disabled"></td>
      <td><input type="checkbox" disabled="disabled"></td>
      <td>100/QD-DHFPT dated 01/05/2019</td></tr>
  <tr><td>PRO192c</td>
      <td><a href="SyllabusDetails.aspx?sylid=12288">Object Oriented Programming with Java</a></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td>1363/QD-DHFPT dated 11/22/2023</td></tr>
</table>
"""


# The real DBI202 rows. Both versions are flagged active AND approved — even the one
# FLM itself names "DBI202-OLD" — so the flags cannot separate them and only the
# decision date can. The 2017 version parses to zero CLOs.
DBI202_LIST_HTML = """
<table>
  <tr><th>Subject Code</th><th>Syllabus Name</th><th>IsActive</th><th>IsApproved</th>
      <th>DecisionNo</th></tr>
  <tr><td>DBI202-OLD</td>
      <td><a href="SyllabusDetails.aspx?sylid=871">Database Systems (old)</a></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td>333/QD-DHFPT dated 04/12/2017</td></tr>
  <tr><td>DBI202</td>
      <td><a href="SyllabusDetails.aspx?sylid=12039">Database Systems</a></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td><input type="checkbox" value="True" checked="True" disabled="disabled"></td>
      <td>1286/QD-DHFPT dated 11/22/2024</td></tr>
</table>
"""


def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


class TestParseSessions:
    def test_resolves_relative_download_href(self):
        sessions = P.parse_sessions(_soup(SCHEDULE_HTML), SYLLABUS_URL)

        assert sessions[0]["download"] == "https://flm.fpt.edu.vn/download/12674/S/1_PRJ301.zip"

    def test_keeps_the_id_from_the_href_not_the_page(self):
        # Regression: the download id (12674) is unrelated to the sylID (13165), so a
        # URL built from the sylID would 404. Only the href knows.
        sessions = P.parse_sessions(_soup(SCHEDULE_HTML), SYLLABUS_URL)

        assert "12674" in sessions[0]["download"]
        assert "13165" not in sessions[0]["download"]

    def test_session_without_download_stays_empty(self):
        sessions = P.parse_sessions(_soup(SCHEDULE_HTML), SYLLABUS_URL)

        assert sessions[1]["download"] == ""
        assert sessions[1]["topic"] == "Setup Environment"

    def test_relative_href_is_dropped_without_a_base_url(self, caplog):
        # Half-formed URLs are worse than none; the warning is the only signal.
        sessions = P.parse_sessions(_soup(SCHEDULE_HTML))

        assert sessions[0]["download"] == ""
        assert "base_url" in caplog.text

    def test_parses_every_session_row(self):
        sessions = P.parse_sessions(_soup(SCHEDULE_HTML), SYLLABUS_URL)

        assert len(sessions) == 2
        assert sessions[0]["lo"] == "LO1"


class TestParseClos:
    def test_extracts_code_and_outcome(self):
        clos = P.parse_clos(_soup(CLO_HTML))

        assert len(clos) == 2
        assert clos[0]["code"] == "CLO1"
        assert clos[0]["outcome"] == "understand the basic web application structure"


class TestFindSyllabusLinks:
    def test_current_version_ranks_first(self):
        links = P.find_syllabus_links(_soup(SYLLABUS_LIST_HTML))

        # FLM prints the superseded row first; taking [0] blindly is the bug.
        assert links[0]["sylID"] == "12288"
        assert links[0]["approved"] is True
        assert links[0]["active"] is True

    def test_keeps_superseded_versions_after_the_current_one(self):
        links = P.find_syllabus_links(_soup(SYLLABUS_LIST_HTML))

        assert [x["sylID"] for x in links] == ["12288", "9001"]
        assert links[1]["approved"] is False

    def test_captures_the_rows_own_code(self):
        # The row's code can differ from the searched one (PRO192 -> PRO192c).
        links = P.find_syllabus_links(_soup(SYLLABUS_LIST_HTML))

        assert links[0]["code"] == "PRO192c"

    def test_dbi202_picks_the_2024_version_over_the_active_approved_old_one(self):
        # Regression for the live DBI202 data: both rows are active+approved, FLM prints
        # the 2017 one first, and that one has no CLOs — which wipes out the subject's
        # entire skill signal. The decision date is the only thing that separates them.
        links = P.find_syllabus_links(_soup(DBI202_LIST_HTML))

        assert links[0]["sylID"] == "12039"
        assert links[0]["approved"] is True and links[1]["approved"] is True
        assert links[0]["active"] is True and links[1]["active"] is True

    def test_ranks_by_decision_date_when_flags_tie(self):
        html = SYLLABUS_LIST_HTML.replace(
            '<td>100/QD-DHFPT dated 01/05/2019</td>',
            '<td>999/QD-DHFPT dated 12/31/2026</td>',
        ).replace(
            '<tr><td>PRO192</td>\n      <td><a href="SyllabusDetails.aspx?sylid=9001">'
            'Object-Oriented Programming (old)</a></td>\n'
            '      <td><input type="checkbox" disabled="disabled"></td>\n'
            '      <td><input type="checkbox" disabled="disabled"></td>',
            '<tr><td>PRO192</td>\n      <td><a href="SyllabusDetails.aspx?sylid=9001">'
            'Object-Oriented Programming (old)</a></td>\n'
            '      <td><input type="checkbox" checked="True" disabled="disabled"></td>\n'
            '      <td><input type="checkbox" checked="True" disabled="disabled"></td>',
        )

        links = P.find_syllabus_links(_soup(html))

        assert links[0]["sylID"] == "9001"


# A real DBI/Data-Science row: three references crammed into one href, separated by an
# encoded "; ". Resolved whole it becomes a valid-looking FLM link to an HTML page.
MULTI_LINK_HTML = """
<table id="gvSchedule">
  <tr><th>Session</th><th>Topic</th><th>S-Download</th></tr>
  <tr><td>1</td><td>Data visualization</td>
      <td><a href="~amidi/teaching/data-science-tools/study-guide/data-visualization-with-python%20;%20https:/colab.research.google.com/%20;%20https:/www.kaggle.com/code">links</a></td></tr>
  <tr><td>2</td><td>Real file</td>
      <td><a href="../../../download/12674/S/1_PRJ301.zip">PRJ301</a></td></tr>
  <tr><td>3</td><td>Handler-style file</td>
      <td><a href="/file/download?scheduleId=371144">HSF302</a></td></tr>
</table>
"""


class TestDownloadLinkHygiene:
    def test_page_link_is_not_taken_as_a_file(self):
        sessions = P.parse_sessions(_soup(MULTI_LINK_HTML), SYLLABUS_URL)

        # Would otherwise mirror an HTML page and offer it as course material.
        assert sessions[0]["download"] == ""

    def test_static_file_link_still_resolves(self):
        sessions = P.parse_sessions(_soup(MULTI_LINK_HTML), SYLLABUS_URL)

        assert sessions[1]["download"] == "https://flm.fpt.edu.vn/download/12674/S/1_PRJ301.zip"

    def test_handler_style_link_is_kept(self):
        # FLM's other shape. It currently 500s server-side, but that is FLM's problem to
        # fix — dropping it here would hide the file forever once they do.
        sessions = P.parse_sessions(_soup(MULTI_LINK_HTML), SYLLABUS_URL)

        assert sessions[2]["download"] == "https://flm.fpt.edu.vn/file/download?scheduleId=371144"

    def test_multi_link_href_keeps_only_the_first(self):
        assert P._first_link("a.zip%20;%20b.zip") == "a.zip"
        assert P._first_link("a.zip; b.zip") == "a.zip"
        assert P._first_link("plain.zip") == "plain.zip"
