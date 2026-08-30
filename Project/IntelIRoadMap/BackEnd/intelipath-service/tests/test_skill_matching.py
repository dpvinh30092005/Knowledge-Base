"""
Boundary rules for matching skill names in a job description.

The case that motivated these: "C" was extracted from 754 of 866 ITviec postings
(87%), while the postings' own tags named C sixteen times. A skill at 87% clears
every demand band, so C would have been printed as REQUIRED — ahead of Java and
Python — on every student's roadmap. Nothing raised an error; the number was just
wrong, which is the harder kind of wrong to notice.
"""

from app.api.endpoints.extraction import _regex_extract


def test_c_plus_plus_is_not_also_counted_as_c():
    found = _regex_extract("Strong C++ background required.")
    assert "C++" in found
    assert "C" not in found


def test_c_sharp_is_not_also_counted_as_c():
    found = _regex_extract("Looking for a C# developer with .NET experience.")
    assert "C#" in found
    assert "C" not in found


def test_real_c_is_still_found():
    """The rule must not silence the language it is protecting."""
    assert "C" in _regex_extract("Embedded work in C and assembly.")


def test_c_in_a_list_of_languages_is_found():
    found = _regex_extract("Languages: C, C++, Python")
    assert "C" in found
    assert "C++" in found
    assert "Python" in found


def test_go_is_not_read_out_of_a_hyphenated_word():
    assert "Go" not in _regex_extract("Go-getter attitude and good communication.")


def test_go_the_language_is_found():
    assert "Go" in _regex_extract("Backend services written in Go and Rust.")


def test_java_is_not_read_out_of_javascript():
    found = _regex_extract("Frontend role: JavaScript and TypeScript.")
    assert "JavaScript" in found
    assert "Java" not in found


def test_node_js_wins_over_bare_node():
    found = _regex_extract("Node.js server experience.")
    assert "Node.js" in found


def test_aliases_report_the_catalog_spelling():
    found = _regex_extract("We use ReactJS, VueJS and Golang.")
    assert "React" in found
    assert "Vue" in found
    assert "Go" in found


def test_an_empty_description_yields_nothing():
    assert _regex_extract("") == []
    assert _regex_extract(None) == []


def test_vietnamese_words_are_not_read_as_the_skill_c():
    """
    Accented letters are letters. The ASCII-only boundary treated every one of
    them as a word break, so "của", "các" and "cần" each matched C — the single
    largest source of the 347/866 figure, and invisible in an English test suite.
    """
    vietnamese = (
        "Hồ sơ của Bạn sẽ được đánh giá nhanh chóng. "
        "Được làm việc với các hệ thống hiện đại, cần cung cấp chi tiết."
    )
    assert "C" not in _regex_extract(vietnamese)


def test_a_vietnamese_posting_still_finds_its_real_skills():
    found = _regex_extract("Yêu cầu: thành thạo Java và Python, có kinh nghiệm Docker.")
    assert "Java" in found
    assert "Python" in found
    assert "Docker" in found
    assert "C" not in found
