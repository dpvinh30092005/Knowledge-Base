"""
Curriculum/combo shaping, built from the real BIT_SE_K19D_K20A (curid 2941) pages.

The failure this guards against is quiet and wrong rather than loud: a curriculum that
looks complete but shows a .NET student the Java combo's subjects.
"""
from bs4 import BeautifulSoup

from app.scrapers.flm import parsers as P
from app.scrapers.flm.flm_to_coverage import curriculum_from_soup, is_major_subject

# Trimmed from CurriculumDetails curid=2941: trunk subjects, a non-major mix, and the
# combo placeholders FLM uses to reserve a slot.
CURRICULUM_HTML = """
<table id="gvSubs">
  <tr><th>SubjectCode</th><th>Subject Name</th><th>Semester</th><th>NoCredit</th>
      <th>PreRequisite</th></tr>
  <tr><td>OTP101</td><td>Orientation and General Training Program</td><td>0</td><td>0</td><td>None</td></tr>
  <tr><td>PEN</td><td>Preparation English</td><td>0</td><td>0</td><td></td></tr>
  <tr><td>PHE_COM*1</td><td>Physical Education 1</td><td>0</td><td>2</td><td></td></tr>
  <tr><td>TMI_ELE</td><td>Traditional musical instrument</td><td>0</td><td>3</td><td></td></tr>
  <tr><td>MAE101</td><td>Mathematics for Engineering</td><td>1</td><td>3</td><td></td></tr>
  <tr><td>PRF192</td><td>Programming Fundamentals</td><td>1</td><td>3</td><td></td></tr>
  <tr><td>JPD113</td><td>Elementary Japanese 1- A1.1</td><td>3</td><td>3</td><td></td></tr>
  <tr><td>SE_COM*1</td><td>Subject 1 of Combo*</td><td>5</td><td>3</td><td></td></tr>
  <tr><td>MLN111</td><td>Philosophy of Marxism - Leninism</td><td>8</td><td>3</td><td></td></tr>
  <tr><td>SEP490</td><td>SE Capstone Project</td><td>9</td><td>10</td><td></td></tr>
</table>
"""

# Compo/Detail/2640?curriculumID=2941 — the Intensive Java combo.
COMBO_DETAIL_HTML = """
<table>
  <tr><td>Combo Name</td>
      <td>SE_COM10.2: Topic on Intensive Java_Chủ đề Java chuyên sâu_K19A</td></tr>
  <tr><td>Note</td><td></td></tr>
</table>
<table class="table-infomation">
  <tr><th>ID</th><th>Subject Code</th><th>Subject Name</th><th>Semester</th><th>Note</th></tr>
  <tr><td>7010</td><td>HSF302</td><td>Working with Spring Framework</td><td>5</td><td></td></tr>
  <tr><td>7011</td><td>SBA301</td><td>Integrate single page application with Spring Boot</td><td>7</td><td></td></tr>
  <tr><td>7012</td><td>MSS301</td><td>Microservices with Spring Cloud</td><td>8</td><td></td></tr>
</table>
"""


def _soup(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


class TestIsMajorSubject:
    def test_keeps_engineering_subjects(self):
        assert is_major_subject("PRF192")
        assert is_major_subject("PRO192c")
        assert is_major_subject("HSF302")

    def test_keeps_maths_and_capstone(self):
        # They map to no roadmap skill but are still part of the degree.
        for code in ("MAE101", "MAD101", "MAS291", "SEP490"):
            assert is_major_subject(code), code

    def test_drops_subjects_outside_the_major(self):
        for code in ("OTP101", "PEN", "TRS501", "ENT503", "JPD113", "VOV114",
                     "MLN111", "VNR202", "HCM202", "SSG104", "SSL101c",
                     "EXE101", "ENW493c", "OJT202"):
            assert not is_major_subject(code), code

    def test_drops_combo_and_elective_placeholders(self):
        # Slots, not teachable subjects — the real ones come from the combo pages.
        for code in ("SE_COM*1", "SE_COM*4_ELE", "SE_GRA_ELE", "PHE_COM*1", "TMI_ELE"):
            assert not is_major_subject(code), code


class TestCurriculumFromSoup:
    def test_keeps_only_major_subjects(self):
        curriculum = curriculum_from_soup(_soup(CURRICULUM_HTML))

        assert sorted(curriculum) == ["MAE101", "PRF192", "SEP490"]

    def test_carries_term_and_credits(self):
        curriculum = curriculum_from_soup(_soup(CURRICULUM_HTML))

        assert curriculum["PRF192"]["semester"] == 1
        assert curriculum["PRF192"]["credits"] == 3

    def test_trunk_subjects_have_no_combo(self):
        curriculum = curriculum_from_soup(_soup(CURRICULUM_HTML))

        assert curriculum["PRF192"]["combo_code"] == ""


class TestComboParsing:
    def test_reads_the_combo_label(self):
        label = P.parse_combo_name(_soup(COMBO_DETAIL_HTML))

        assert label.startswith("SE_COM10.2:")

    def test_splits_code_from_name(self):
        code, name = P.split_combo_label(P.parse_combo_name(_soup(COMBO_DETAIL_HTML)))

        assert code == "SE_COM10.2"
        assert name.startswith("Topic on Intensive Java")

    def test_label_without_a_colon_yields_no_code(self):
        code, name = P.split_combo_label("Topic on something")

        assert code == ""
        assert name == "Topic on something"

    def test_reads_the_combo_subjects(self):
        subjects = P.parse_group_subjects(_soup(COMBO_DETAIL_HTML))

        assert [s["code"] for s in subjects] == ["HSF302", "SBA301", "MSS301"]
        assert subjects[0]["semester"] == 5


class TestMergeGroup:
    def test_combo_subjects_keep_their_tag(self):
        from app.scrapers.flm.scraper import _merge_group

        curriculum = curriculum_from_soup(_soup(CURRICULUM_HTML))
        _merge_group(curriculum, P.parse_group_subjects(_soup(COMBO_DETAIL_HTML)),
                     elective=False, combo_code="SE_COM10.2", combo_name="Intensive Java")

        assert curriculum["HSF302"]["combo_code"] == "SE_COM10.2"
        assert curriculum["HSF302"]["semester"] == 5

    def test_trunk_subject_is_not_captured_by_a_combo(self):
        # A shared course listed by CurriculumDetails must stay visible to everyone,
        # even if some combo also lists it.
        from app.scrapers.flm.scraper import _merge_group

        curriculum = curriculum_from_soup(_soup(CURRICULUM_HTML))
        _merge_group(curriculum, [{"code": "PRF192", "name": "Programming Fundamentals",
                                   "semester": 1, "note": ""}],
                     elective=False, combo_code="SE_COM10.2", combo_name="Intensive Java")

        assert curriculum["PRF192"]["combo_code"] == ""
