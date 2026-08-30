from app.scrapers.engines.curl_engine import CurlEngine
from app.config.config import settings
import logging
import re
import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import Company, Recruitment, RecruitmentPost
import uuid

logger = logging.getLogger(__name__)


def convert_to_eng(text: str) -> str:
    text = text.lower().strip()
    mapping = {
        "năm thành lập": "year_of_establishment",
        "quy mô": "scale",
        "độ tuổi trung bình": "average_age",
        "lĩnh vực hoạt động": "field_of_activity",
        "lĩnh vực chính": "main_field",
        "khách hàng mục tiêu": "customer_target",
        "thị trường": "active_market",
        "yêu cầu": "requirements",
        "quyền lợi": "benefits",
        "chuyên môn": "specializes",
        "thu nhập": "salary",
        "mô tả": "job_descriptions",
        "địa điểm": "location",
        "thời gian": "work_time",
        "cấp bậc": "rank",
        "học vấn": "education",
        "số lượng": "hiring",
        "hình thức": "form_of_work",
        "nghề liên quan": "related_jobs",
        "kỹ năng cần có": "skills_required",
        "kỹ năng nên có": "should_have_skills",
        "loại hình": "type_of_work",
        "theo khu vực": "find_jobs_by_region",
        "địa giới trước sáp nhập": "find_jobs_by_pre_merger_boundary",
        "địa giới sau sáp nhập": "find_jobs_by_post_merger_boundary",
    }
    for vn, en in mapping.items():
        if vn in text:
            return en
            
    # Fallback to simple snake_case conversion for unmatched text
    import re
    return re.sub(r'[^a-z0-9_]', '', text.replace(' ', '_')).strip('_')


def get_descriptions(items, results=None):
    if results is None:
        results = []

    for item in items:
        if item.name == "br":
            continue

        children = [c for c in item.children if c.name is not None]
        if len(children) > 1 and len(item.find_all("br")) <= 1:
            get_descriptions(children, results)
        else:
            for br in item.find_all("br"):
                br.replace_with("\n")
            text = item.get_text().strip()
            if text:
                results.append(text)
    return results


def scrape_company_detail(company_link: str, company_id: str) -> dict | None:
    doc = CurlEngine.get_document(company_link)
    if not doc:
        return None

    logo_elem = doc.select_one(".company-logo img")
    company_logo = logo_elem["src"] if logo_elem else ""

    name_elem = doc.select_one(".company-name")
    company_name = name_elem.text.strip() if name_elem else ""

    intro_contents = doc.select(".intro-content")
    if not intro_contents:
        intro_contents = doc.select(".company-info .content")
    company_intro = get_descriptions(intro_contents)

    company_info = {}
    for info in doc.select(".box-info-company-general-item__info"):
        title_elem = info.select_one(".box-info-company-general-item__info--title")
        desc_elem = info.select_one(".box-info-company-general-item__info--desc")
        if title_elem and desc_elem:
            raw_title = title_elem.text.lower().strip()
            if raw_title == "mã số thuế":
                continue
            title = convert_to_eng(title_elem.text)
            for br in desc_elem.find_all("br"):
                br.replace_with("\n")
            lines = [line.strip() for line in desc_elem.get_text().split("\n") if line.strip()]
            company_info[title] = lines if len(lines) > 1 else (lines[0] if lines else "")

    contacts = doc.select(".info-line")
    if not contacts:
        contacts = doc.select(".company-info .box-body__address")
    company_contact = get_descriptions(contacts)

    company_info["introduction"] = company_intro

    return {
        "company_id": company_id,
        "company_link": company_link,
        "logo": company_logo,
        "name": company_name,
        "info": company_info,
        "contact": company_contact,
    }


def scrape_recruitment_detail(recruitment_link: str, recruitment_id: str) -> dict | None:
    doc = CurlEngine.get_document(recruitment_link)
    if not doc:
        return None

    job_info = doc.select_one(".job-detail")
    premium = False
    simple = False

    if not job_info:
        job_info = doc.select_one(".premium-job-detail")
        if job_info:
            premium = True
        else:
            job_info = doc.select_one(".section-content-job-detail")
            if job_info:
                simple = True

    if not job_info:
        logger.error(f"Parsing format not implemented for {recruitment_link}")
        return None

    normal_custom = {
        "jobTitle": ".job-detail__info--title",
        "jobBasicInfos": ".job-detail__info--section .job-detail__info--section-content-value",
        "applicationDeadline": ".job-detail__info--deadline-date",
        "jobTags": ".job-tags__group",
        "jobDescription": ".job-description__item",
        "jobGeneralInfo": ".box-general-group",
        "jobRelatedTags": ".box-category",
    }

    premium_custom = {
        "jobTitle": ".premium-job-basic-information__content--title",
        "jobBasicInfos": ".basic-information-item .basic-information-item__data--value",
        "applicationDeadline": ".job-detail__info--deadline-date",
        "jobTags": ".job-tags__group",
        "jobDescription": ".premium-job-description__box",
        "jobGeneralInfo": ".premium-job-general-information__content--row",
        "jobRelatedTags": ".premium-job-related-tags__section",
    }

    simple_custom = {
        "jobHeader": ".box-header",
        "jobTags": ".job-tags__group",
        "jobLocation": ".box-address",
        "jobDescription": ".box-info",
        "jobRelatedTag1": ".box-career",
        "jobRelatedTag2": ".box-category-city",
        "jobGeneralInfo": ".box-general-group",
    }

    job_detail = simple_custom if simple else (premium_custom if premium else normal_custom)

    recruitment_title = ""
    recruitment_salary = ""
    recruitment_location = ""
    recruitment_experience = ""
    recruitment_deadline = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    if simple:
        header = job_info.select_one(job_detail["jobHeader"])
        if header:
            title_elem = header.select_one(".title")
            if title_elem:
                recruitment_title = title_elem.text.strip()

            salary_elem = header.select_one(".salary")
            if salary_elem:
                recruitment_salary = salary_elem.text.strip()

            deadline_elem = header.select_one(".deadline")
            if deadline_elem:
                day_txt = re.sub(r"\D+", "", deadline_elem.text)
                days = int(day_txt) if day_txt else 30
                recruitment_deadline = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    else:
        title_elem = job_info.select_one(job_detail["jobTitle"])
        if title_elem:
            recruitment_title = title_elem.text.strip()

        basic_infos = job_info.select(job_detail["jobBasicInfos"])
        recruitment_salary = basic_infos[0].text.strip() if len(basic_infos) > 0 else "N/A"
        recruitment_location = basic_infos[1].text.strip() if len(basic_infos) > 1 else "N/A"
        recruitment_experience = basic_infos[-1].text.strip() if len(basic_infos) > 2 else "N/A"

        deadline_elem = job_info.select_one(job_detail["applicationDeadline"])
        if deadline_elem and deadline_elem.text.strip():
            try:
                recruitment_deadline = datetime.strptime(deadline_elem.text.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
            except ValueError:
                pass

    recruitment_tag = {}
    for tag in job_info.select(job_detail["jobTags"]):
        children = tag.find_all(recursive=False)
        if len(children) >= 2:
            tag_name = convert_to_eng(children[0].text)
            tag_list = []
            for item in children[1].find_all(recursive=False):
                for br in item.find_all("br"):
                    br.replace_with("\n")
                for t in item.get_text().split("\n"):
                    clean_t = t.strip()
                    if clean_t and clean_t not in tag_list:
                        tag_list.append(clean_t)
            if tag_list:
                recruitment_tag[tag_name] = tag_list

    recruitment_description = {}
    descriptions = job_info.select(job_detail["jobDescription"])
    if simple and len(descriptions) > 0:
        descriptions.pop(0)
        descriptions.extend(job_info.select(job_detail["jobLocation"]))
    elif not simple and len(descriptions) > 0:
        descriptions.pop()

    for desc in descriptions:
        children = desc.find_all(recursive=False)
        if len(children) >= 2:
            desc_name = convert_to_eng(children[0].text)
            desc_lines = get_descriptions(children[1].find_all(recursive=False))
            recruitment_description[desc_name] = desc_lines

    recruitment_general_info = {}
    for info in job_info.select(job_detail["jobGeneralInfo"]):
        children = info.find_all(recursive=False)
        if len(children) >= 2:
            inner_children = children[1].find_all(recursive=False)
            for i in range(0, len(inner_children), 2):
                if i + 1 < len(inner_children):
                    k = convert_to_eng(inner_children[i].text)
                    v = inner_children[i + 1].text.strip()
                    recruitment_general_info[k] = v

    recruitment_related_tag = {}
    related_tags = []
    if simple:
        related_tags.extend(job_info.select(job_detail["jobRelatedTag1"]))
        related_tags.extend(job_info.select(job_detail["jobRelatedTag2"]))
    else:
        related_tags.extend(job_info.select(job_detail["jobRelatedTags"]))

    for related_tag in related_tags:
        children = related_tag.find_all(recursive=False)
        if len(children) >= 2:
            tag_name = convert_to_eng(children[0].text)
            tag_list = [t.text.strip() for t in children[1].find_all(recursive=False)]
            recruitment_related_tag[tag_name] = tag_list

    recruitment_data = {
        "recruitment_id": recruitment_id,
        "recruitment_link": recruitment_link,
        "title": recruitment_title,
        "salary": recruitment_salary,
        "location": recruitment_location,
        "experience": recruitment_experience,
        "application_deadline": recruitment_deadline,
        "tags": recruitment_tag,
        "descriptions": recruitment_description,
        "general_infos": recruitment_general_info,
        "related_tags": recruitment_related_tag,
    }

    return recruitment_data

def parse_topcv_jobs(limiter: int, db: Session) -> None:
    """Scrape TopCV jobs and save raw data to DB."""
    logger.info("Starting TopCv Jobs Scraper")
    limit_on = limiter > 0

    if limit_on:
        logger.info(f"Limiter set at {limiter}")
    else:
        logger.info("Limiter lifted. Scraper will run until no more available jobs")
        logger.info("This may take a loooong time :))")

    companies_dict = {}
    recruitments_dict = {}
    recruitment_posts = []

    total_page = 1
    current_page = 1
    count = 0

    while current_page <= total_page:
        url = f"{settings.topcv_target}?sort=new&page={current_page}"
        logger.info(f"Parsing TopCv Jobs {url}")

        doc = CurlEngine.get_document(url)
        if not doc:
            break

        paginate_text = doc.select_one("#job-listing-paginate-text")
        if not paginate_text:
            logger.warning("Could not find pagination text.")
            break

        m = re.search(r"/\s*(\d+)", paginate_text.text)
        if m:
            total_page = int(m.group(1))

        jobs = doc.select(".job-item-search-result")
        for job in jobs:
            if limit_on and count >= limiter:
                logger.info("Reached Scraping Limiter. Stopping scrape.")
                return {
                    "recruitment_posts": recruitment_posts,
                    "companies": list(companies_dict.values()),
                    "recruitments": list(recruitments_dict.values())
                }

            time.sleep(settings.thread_sleep / 1000.0)
            count += 1
            logger.info(f"Scraping job No. {count}...")

            title_block = job.select_one(".title-block")
            if not title_block:
                continue

            company_elem = title_block.select_one(".company")
            if not company_elem:
                continue
            company_link = company_elem.get("href", "")

            m2 = re.search(r"(?:/|id=)(\d+)(?:\.html|&|$)", company_link)
            if not m2:
                continue
            company_id = f"topcv.co{m2.group(1)}"

            rec_elem = title_block.select_one(".title a")
            if not rec_elem:
                continue
            recruitment_link = rec_elem.get("href", "")

            job_id = job.get("data-job-id")
            if not job_id:
                continue
            recruitment_id = f"topcv.rec{job_id}"

            try:
                # Scrape only if not already scraped in this run
                if company_id not in companies_dict:
                    company = scrape_company_detail(company_link, company_id)
                    if company:
                        companies_dict[company_id] = company
                        # Save to DB
                        db_company = db.query(Company).filter(Company.company_id == company_id).first()
                        if not db_company:
                            db_company = Company(**company)
                            db.add(db_company)
                            db.commit()
                else:
                    company = companies_dict[company_id]

                if recruitment_id not in recruitments_dict:
                    recruitment = scrape_recruitment_detail(recruitment_link, recruitment_id)
                    if recruitment:
                        recruitments_dict[recruitment_id] = recruitment
                        # Save to DB
                        db_recruitment = db.query(Recruitment).filter(Recruitment.recruitment_id == recruitment_id).first()
                        if not db_recruitment:
                            # Convert application_deadline to date object for DB
                            deadline = recruitment["application_deadline"]
                            if isinstance(deadline, str):
                                deadline = datetime.strptime(deadline, "%Y-%m-%d").date()
                            db_recruitment = Recruitment(
                                recruitment_id=recruitment["recruitment_id"],
                                recruitment_link=recruitment["recruitment_link"],
                                title=recruitment["title"],
                                salary=recruitment["salary"],
                                location=recruitment["location"],
                                experience=recruitment["experience"],
                                application_deadline=deadline,
                                tags=recruitment["tags"],
                                descriptions=recruitment["descriptions"],
                                general_infos=recruitment["general_infos"],
                                related_tags=recruitment["related_tags"]
                            )
                            db.add(db_recruitment)
                            db.commit()
                else:
                    recruitment = recruitments_dict[recruitment_id]

                if company and recruitment:
                    post = {
                        "post_id": str(uuid.uuid4()),
                        "company_id": company["company_id"],
                        "recruitment_id": recruitment["recruitment_id"],
                        "expire_at": recruitment["application_deadline"]
                    }
                    recruitment_posts.append(post)
                    # Save to DB
                    db_post = db.query(RecruitmentPost).filter(
                        RecruitmentPost.company_id == company["company_id"],
                        RecruitmentPost.recruitment_id == recruitment["recruitment_id"]
                    ).first()
                    if not db_post:
                        deadline = post["expire_at"]
                        if isinstance(deadline, str):
                            deadline = datetime.strptime(deadline, "%Y-%m-%d").date()
                        db_post = RecruitmentPost(
                            post_id=post["post_id"],
                            company_id=post["company_id"],
                            recruitment_id=post["recruitment_id"],
                            expire_at=deadline
                        )
                        db.add(db_post)
                        db.commit()

            except Exception as e:
                logger.error(f"Error scraping a job: {e}")
                db.rollback()

        current_page += 1

    logger.info(f"Scraping complete. Total jobs scraped: {len(recruitment_posts)}")
    return
