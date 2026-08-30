"""
Salary is free text on ITviec, and the JSON-LD it comes from is inconsistent: sometimes a
bare range needing the `currency` field, sometimes a sentence that already names its own
unit, sometimes a placeholder standing in for a figure that was never published.

Getting it wrong is silent — the record still looks fine, it just carries a unit nobody
meant, which downstream lands the posting in the wrong salary bracket.
"""
from app.scrapers.parsers.itviec_parser import _parse_salary


def salary(amount, currency=""):
    return _parse_salary({"value": amount, "currency": currency})


def test_appends_the_currency_to_a_bare_range():
    assert salary("500 - 1,100", "USD") == "500 - 1,100 USD"


def test_leaves_an_amount_that_already_names_its_currency():
    assert salary("500 - 1,100 USD", "USD") == "500 - 1,100 USD"


def test_does_not_stamp_a_dollar_field_onto_a_dong_amount():
    # Regression: matching only the `currency` value meant "vnd" went unnoticed and the
    # record became "Up to 22 million vnd USD".
    assert salary("Up to 22 million vnd", "USD") == "Up to 22 million vnd"
    assert salary("15.000.000 đồng", "USD") == "15.000.000 đồng"
    assert salary("10 - 20 triệu", "USD") == "10 - 20 triệu"


def test_leaves_an_amount_carrying_only_a_magnitude():
    # Revised after seeing live data: "30M - UP TO 50M" and "50.000.000đ" both arrived
    # with a USD currency field, and appending it priced dong roles in dollars. A figure
    # that names its own magnitude was written in a currency the employer had in mind,
    # so the untrustworthy field is not stamped on top of it.
    assert salary("30M - UP TO 50M", "USD") == "30M - UP TO 50M"
    assert salary("22 million", "USD") == "22 million"
    assert salary("20tr - 30tr", "USD") == "20tr - 30tr"


def test_does_not_stamp_a_currency_onto_a_dong_suffix():
    # "đ" alone is how the amount is usually written; only "đồng" was matched before.
    assert salary("30,000,000 - 50,000,000đ", "USD") == "30,000,000 - 50,000,000đ"
    assert salary("50.000.000 đ", "USD") == "50.000.000 đ"


def test_leaves_placeholders_alone():
    # No digits, so there is nothing for a currency to qualify.
    assert salary("You'll love it", "USD") == "You'll love it"
    assert salary("Very attractive!!!", "USD") == "Very attractive!!!"
    assert salary("Thỏa thuận theo năng lực", "VND") == "Thỏa thuận theo năng lực"


def test_reports_a_missing_figure():
    assert salary(None, "USD") == "N/A"
    assert salary("", "USD") == "N/A"
    assert _parse_salary(None) == "N/A"


def test_reads_the_nested_value_shape():
    assert _parse_salary({"value": {"value": "500 - 1,100"}, "currency": "USD"}) == "500 - 1,100 USD"
