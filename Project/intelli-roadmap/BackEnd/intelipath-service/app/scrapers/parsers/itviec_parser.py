"""ITviec job scraper.

ITviec is server-rendered (Rails) and embeds schema.org JSON-LD on every page:
- each listing page (`/it-jobs?page=N`) carries an `ItemList` with the 20 job URLs,
- each detail page carries a full `JobPosting` (title, skills, salary, dates,
  hiringOrganization, jobLocation, description).

Parsing the JSON-LD instead of CSS classes makes this resilient to ITviec's
frequent markup churn. The scraped rows land in the SAME raw tables as the TopCV
scraper (companies / recruitments / recruitment_posts) with `itviec.*` ids, so the
downstream AI processor and API response are source-agnostic.
"""

from app.scrapers.engines.curl_engine import CurlEngine
from app.config.config import settings
import json
import logging
import re
import time
import uuid
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.db.models import Company, Recruitment, RecruitmentPost

logger = logging.getLogger(__name__)


def _json_ld(doc: BeautifulSoup, want_type: str) -> dict | None:
    """Return the first JSON-LD block whose @type matches, or None."""
    for tag in doc.select('script[type="application/ld+json"]'):
        raw = tag.string or tag.get_text() or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            continue
        for block in data if isinstance(data, list) else [data]:
            if isinstance(block, dict) and block.get("@type") == want_type:
                return block
    return None


def _slug(text: str) -> str:
    """Lowercase alphanumeric slug used to build a stable company id from a name."""
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


def _html_to_lines(html: str) -> list[str]:
    """Flatten a JobPosting HTML description into clean text lines."""
    soup = BeautifulSoup(html or "", "html.parser")
    for br in soup.find_all("br"):
        br.replace_with("\n")
    text = soup.get_text("\n")
    return [ln.strip() for ln in text.split("\n") if ln.strip()]


def _job_url_list(doc: BeautifulSoup) -> list[str]:
    """Extract the job detail URLs from a listing page's ItemList JSON-LD."""
    item_list = _json_ld(doc, "ItemList")
    if not item_list:
        return []
    urls = []
    for el in item_list.get("itemListElement", []):
        url = el.get("url") if isinstance(el, dict) else None
        if url:
            urls.append(url.split("?")[0])
    return urls


def _listing_url(page: int) -> str:
    """Listing URL for one page, including the newest-first sort when configured."""
    url = f"{settings.itviec_target}?page={page}"
    sort = (settings.itviec_sort_query or "").strip().lstrip("&?")
    return f"{url}&{sort}" if sort else url


def dedup_key(company_name: str, title: str, location: str) -> str:
    """Identity of a *job*, as opposed to a job posting.

    A company that takes a listing down and re-posts it gets a fresh ITviec slug,
    so the URL-based `recruitment_id` sees two unrelated rows and every count that
    follows is inflated by the repost.

    The company is part of the key and must stay that way: real postings share
    generic titles across employers - "Test Automation Engineer" appears at both
    TMA Solutions and Simpson Strong-Tie on the same day - and keying on the title
    alone would merge two genuinely different jobs into one.
    """
    return "|".join([_slug(company_name), _slug(title), _slug(location)])


def _check_newest_first(posted_dates: list, sort_configured: bool) -> None:
    """Warn when the first page did not come back newest-first.

    Silence here would be the dangerous outcome: the scraper would keep running,
    keep filling the database, and every "last 30 days" figure downstream would be
    computed over whatever ITviec felt like promoting that day.
    """
    known = [d for d in posted_dates if d]
    if len(known) < 2:
        logger.warning(
            "ITviec: only %d of %d jobs on page 1 carried a posted date; cannot verify ordering.",
            len(known), len(posted_dates),
        )
        return

    if all(known[i] >= known[i + 1] for i in range(len(known) - 1)):
        logger.info("ITviec: page 1 is newest-first (%s -> %s).", known[0], known[-1])
        return

    if sort_configured:
        logger.warning(
            "ITviec: ITVIEC_SORT_QUERY is set but page 1 came back out of order "
            "(%s ... %s). The sort parameter is probably wrong - check it against "
            "the site's own sort control before trusting any recency figure.",
            known[0], known[-1],
        )
    else:
        logger.warning(
            "ITviec: page 1 is not newest-first (%s ... %s) and no sort parameter is "
            "configured, so this scrape collected ITviec's default promoted order "
            "rather than the newest jobs. Set ITVIEC_SORT_QUERY to fix it.",
            known[0], known[-1],
        )


def _max_page(doc: BeautifulSoup) -> int:
    """Largest page number found in the pagination controls (defaults to 1)."""
    nums = [
        int(a.get_text(strip=True))
        for a in doc.select(".pagination a, nav a")
        if a.get_text(strip=True).isdigit()
    ]
    return max(nums) if nums else 1


# A unit spelled out, or a magnitude suffix stuck to a digit ("50.000.000đ", "30M",
# "20tr"). Either means the employer wrote the figure in a currency they had in mind.
_UNIT_WORDS = ("usd", "$", "vnd", "vnđ", "đồng", "triệu", "million")
_DIGIT_UNIT = re.compile(r"\d\s*(đ|tr|m)\b", re.IGNORECASE)


def _parse_salary(base_salary: dict | None) -> str:
    if not isinstance(base_salary, dict):
        return "N/A"
    value = base_salary.get("value")
    amount = value.get("value") if isinstance(value, dict) else value
    currency = base_salary.get("currency", "")
    if amount in (None, ""):
        return "N/A"
    amount = str(amount).strip()
    # ITviec hides salary from anonymous viewers, returning placeholder text like
    # "You'll love it" / "Thỏa thuận theo năng lực", so a currency only ever qualifies
    # an amount that actually has digits.
    #
    # Beyond that the rule is deliberately narrow: append only to a figure that carries
    # no unit and no magnitude of its own. The `currency` field is not trustworthy on its
    # own — it has been seen reading USD next to amounts written "50.000.000đ" and
    # "30M - UP TO 50M", both plainly dong. Stamping those produced records that
    # contradict themselves and, read back, priced a 30-50 million role in dollars.
    # Where the two disagree the amount is what a human typed, so it wins; the currency
    # is added only where there is otherwise no unit at all, e.g. a bare "500 - 1,100".
    has_number = any(ch.isdigit() for ch in amount)
    lowered = amount.lower()
    self_describing = any(word in lowered for word in _UNIT_WORDS) or bool(_DIGIT_UNIT.search(lowered))
    if currency and has_number and not self_describing:
        return f"{amount} {currency}".strip()
    return amount


def _parse_experience(exp) -> str:
    """schema.org experienceRequirements is usually an OccupationalExperienceRequirements
    object ({monthsOfExperience: N}); flatten it to a readable string."""
    if isinstance(exp, dict):
        months = exp.get("monthsOfExperience")
        if months in (None, ""):
            return "N/A"
        try:
            m = int(months)
        except (ValueError, TypeError):
            return str(months)
        if m < 12:
            return f"{m} month{'s' if m != 1 else ''}"
        years = m / 12
        # Whole years read cleanly; otherwise one decimal ("3.1 years").
        return f"{int(years)} years" if m % 12 == 0 else f"{round(years, 1)} years"
    if exp in (None, ""):
        return "N/A"
    return str(exp)


def _parse_location(job_location) -> str:
    locs = job_location if isinstance(job_location, list) else [job_location]
    parts = []
    for loc in locs:
        if not isinstance(loc, dict):
            continue
        addr = loc.get("address", {})
        if isinstance(addr, dict):
            city = addr.get("addressRegion") or addr.get("addressLocality")
            if city and city not in parts:
                parts.append(city)
    return ", ".join(parts) if parts else "N/A"


def scrape_itviec_detail(job_url: str, recruitment_id: str, company_id: str) -> tuple[dict, dict] | None:
    """Fetch a job detail page and build (company, recruitment) dicts from its JSON-LD."""
    doc = CurlEngine.get_document(job_url)
    if not doc:
        return None

    jp = _json_ld(doc, "JobPosting")
    if not jp:
        logger.error(f"No JobPosting JSON-LD on {job_url}")
        return None

    org = jp.get("hiringOrganization") or {}
    org_name = org.get("name", "") if isinstance(org, dict) else ""
    org_logo = org.get("logo", "") if isinstance(org, dict) else ""
    org_desc = org.get("description", "") if isinstance(org, dict) else ""

    # Deadline: prefer validThrough, else 30 days out.
    deadline = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    vt = jp.get("validThrough")
    if vt:
        try:
            deadline = datetime.fromisoformat(vt.split("T")[0]).strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            pass

    # Posted date drives the demand-over-time trend (deadlines cluster and don't).
    posted = None
    dp = jp.get("datePosted")
    if dp:
        try:
            posted = datetime.fromisoformat(dp.split("T")[0]).strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            posted = None

    skills = [s.strip() for s in (jp.get("skills") or "").split(",") if s.strip()]
    benefits = [b.strip() for b in (jp.get("jobBenefits") or "").split(",") if b.strip()]

    company = {
        "company_id": company_id,
        "company_link": job_url,
        "logo": org_logo,
        "name": org_name,
        "info": {
            "introduction": [org_desc] if org_desc else [],
            "field_of_activity": jp.get("industry", ""),
        },
        "contact": [_parse_location(jp.get("jobLocation"))],
    }

    recruitment = {
        "recruitment_id": recruitment_id,
        "recruitment_link": job_url,
        "title": jp.get("title", "").strip(),
        "salary": _parse_salary(jp.get("baseSalary")),
        "location": _parse_location(jp.get("jobLocation")),
        "experience": _parse_experience(jp.get("experienceRequirements")),
        "posted_date": posted,
        "application_deadline": deadline,
        "tags": {"skills_required": skills} if skills else {},
        "descriptions": {"job_descriptions": _html_to_lines(jp.get("description", ""))},
        "general_infos": {
            "form_of_work": jp.get("employmentType", ""),
            "field_of_activity": jp.get("industry", ""),
        },
        "related_tags": {"benefits": benefits} if benefits else {},
    }
    return company, recruitment


def parse_itviec_jobs(limiter: int, db: Session) -> None:
    """Scrape ITviec jobs and save raw data to DB.

    Mirrors `parse_topcv_jobs`: same limiter semantics, same tables, and it lets
    a Cloudflare block bubble up as BlockedIpException so the route can turn it
    into a clear 502.
    """
    logger.info("Starting ITviec Jobs Scraper")
    limit_on = limiter > 0
    if limit_on:
        logger.info(f"Limiter set at {limiter}")
    else:
        logger.info("Limiter lifted. Scraper will run until no more available jobs")

    companies_dict = {}
    recruitments_dict = {}
    recruitment_posts = []

    total_page = 1
    current_page = 1
    count = 0
    # Posted dates seen on page 1, used to verify we really got newest-first.
    first_page_dates: list = []
    # Only a newest-first feed lets us stop as soon as a page holds nothing new.
    sort_configured = bool((settings.itviec_sort_query or "").strip())

    while current_page <= total_page:
        url = _listing_url(current_page)
        logger.info(f"Parsing ITviec Jobs {url}")

        doc = CurlEngine.get_document(url)
        if not doc:
            break

        if current_page == 1:
            total_page = _max_page(doc)
            logger.info(f"ITviec reports {total_page} page(s) of jobs")

        job_urls = _job_url_list(doc)
        if not job_urls:
            logger.warning(f"No jobs found on page {current_page}; stopping.")
            break

        # Jobs on this page that the database has never seen. Used for the
        # early stop below.
        page_new_count = 0

        for job_url in job_urls:
            if limit_on and count >= limiter:
                logger.info("Reached Scraping Limiter. Stopping scrape.")
                return {
                    "recruitment_posts": recruitment_posts,
                    "companies": list(companies_dict.values()),
                    "recruitments": list(recruitments_dict.values()),
                }

            time.sleep(settings.thread_sleep / 1000.0)
            count += 1
            logger.info(f"Scraping job No. {count}...")

            slug = job_url.rstrip("/").split("/")[-1]
            recruitment_id = f"itviec.rec-{slug}"[:255]

            try:
                # We need the detail page to know the company; parse it first, then
                # derive a stable company id from the org name so repeat companies dedup.
                if recruitment_id in recruitments_dict:
                    continue

                detail = scrape_itviec_detail(job_url, recruitment_id, company_id="")
                if not detail:
                    continue
                company, recruitment = detail

                company_id = f"itviec.co-{_slug(company['name']) or uuid.uuid4().hex[:12]}"[:255]
                company["company_id"] = company_id

                if company_id not in companies_dict:
                    companies_dict[company_id] = company
                    db_company = db.query(Company).filter(Company.company_id == company_id).first()
                    if not db_company:
                        db.add(Company(**company))
                        db.commit()

                recruitments_dict[recruitment_id] = recruitment
                posted = (
                    datetime.strptime(recruitment["posted_date"], "%Y-%m-%d").date()
                    if recruitment.get("posted_date") else None
                )
                if current_page == 1:
                    first_page_dates.append(posted)

                db_recruitment = db.query(Recruitment).filter(Recruitment.recruitment_id == recruitment_id).first()
                if not db_recruitment:
                    deadline = datetime.strptime(recruitment["application_deadline"], "%Y-%m-%d").date()
                    db.add(Recruitment(
                        recruitment_id=recruitment["recruitment_id"],
                        recruitment_link=recruitment["recruitment_link"],
                        title=recruitment["title"],
                        salary=recruitment["salary"],
                        location=recruitment["location"],
                        experience=recruitment["experience"],
                        posted_date=posted,
                        application_deadline=deadline,
                        dedup_key=dedup_key(company["name"], recruitment["title"], recruitment["location"]),
                        tags=recruitment["tags"],
                        descriptions=recruitment["descriptions"],
                        general_infos=recruitment["general_infos"],
                        related_tags=recruitment["related_tags"],
                    ))
                    db.commit()
                    page_new_count += 1

                post = {
                    "post_id": str(uuid.uuid4()),
                    "company_id": company_id,
                    "recruitment_id": recruitment_id,
                    "expire_at": recruitment["application_deadline"],
                }
                recruitment_posts.append(post)
                db_post = db.query(RecruitmentPost).filter(
                    RecruitmentPost.company_id == company_id,
                    RecruitmentPost.recruitment_id == recruitment_id,
                ).first()
                if not db_post:
                    db.add(RecruitmentPost(
                        post_id=post["post_id"],
                        company_id=company_id,
                        recruitment_id=recruitment_id,
                        expire_at=datetime.strptime(post["expire_at"], "%Y-%m-%d").date(),
                    ))
                    db.commit()

            except Exception as e:
                logger.error(f"Error scraping ITviec job {job_url}: {e}")
                db.rollback()

        # Checked once, on the page whose order we actually control. If this is not
        # newest-first then "jobs from the last 30 days" downstream is measuring the
        # wrong population, and that is worth saying loudly rather than discovering
        # from a chart that looks subtly wrong.
        if current_page == 1:
            _check_newest_first(first_page_dates, bool((settings.itviec_sort_query or "").strip()))

        # Incremental stop: with newest-first ordering, a page where every job is
        # already stored means everything beyond it is older and also stored, so
        # there is nothing left to find. This is what turns a daily run from
        # "re-fetch the same N detail pages" into "pick up what appeared since
        # yesterday" - typically one or two pages instead of fifty.
        #
        # Gated on the sort being configured, because without newest-first the
        # ordering is arbitrary and a page of known jobs says nothing about the
        # pages after it; stopping there would silently skip real listings.
        if sort_configured and page_new_count == 0:
            logger.info(
                "ITviec: page %d contained no new jobs and the feed is newest-first; "
                "stopping early. %d job(s) examined this run.",
                current_page, count,
            )
            break

        current_page += 1

    logger.info(f"ITviec scraping complete. Total jobs scraped: {len(recruitment_posts)}")
    return
