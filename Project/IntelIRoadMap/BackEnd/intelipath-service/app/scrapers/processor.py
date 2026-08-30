import logging
from sqlalchemy.orm import Session
from app.config.config import settings
from app.services.llm_service import complete_text
from app.db.models import Company, Recruitment, ProcessedCompany, ProcessedRecruitment

logger = logging.getLogger(__name__)

# System prompt: give the model a clear role and a strict output contract so it
# returns predictable JSON instead of free-form text. Same discipline the leaked
# production prompts use - role, exact format, missing-data handling, no fences.
NORMALIZER_SYSTEM_PROMPT = (
    "You are a data-normalization service for a Vietnamese IT job board. "
    "You receive raw, messy scraped fields and return a single compact JSON object "
    "that matches the schema given in the user message.\n"
    "Rules:\n"
    "- Output ONLY valid minified JSON. No markdown, no code fences, no commentary.\n"
    "- Follow the requested keys exactly - no extra keys, no missing keys.\n"
    "- Keep the input language (Vietnamese stays Vietnamese).\n"
    "- Values must be short and human-readable. Arrays hold plain strings only "
    "(never nested objects or arrays).\n"
    "- If a field has no data, use an empty string \"\" (or empty array [] where an "
    "array is requested). Never invent information."
)


def summarize_text(prompt: str, system_prompt: str = NORMALIZER_SYSTEM_PROMPT) -> str | None:
    # Uses the shared OpenAI-compatible client (app.services.llm_service), the same
    # one the rest of the AI service uses — deterministic (temp 0), JSON-object output.
    if not settings.llm_api_key:
        logger.warning("LLM_API_KEY missing; skipping AI summary.")
        return None
    return complete_text(system_prompt, prompt)


def _jsonify(value) -> str:
    """Store scalars as-is but serialize any nested structure to valid JSON
    (not Python repr) so the frontend can JSON.parse it into chips."""
    import json
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)

def process_unprocessed_data(db: Session):
    logger.info("Starting AI processing for unprocessed data.")
    
    # Process Companies
    unprocessed_companies = db.query(Company).outerjoin(
        ProcessedCompany, Company.company_id == ProcessedCompany.company_id
    ).filter(ProcessedCompany.company_id == None).all()

    for company in unprocessed_companies:
        logger.info(f"Processing company: {company.company_id}")
        signatures = {
            "link": str(company.company_link or ""),
            "logo": str(company.logo or ""),
            "name": str(company.name or "")
        }
        
        infos = {}
        if company.info or company.contact:
            prompt = (
                "Normalize this company data into JSON with EXACTLY these keys:\n"
                '{"info": "<one concise sentence describing the company>", '
                '"contact": "<phone / email / address as one short string>"}\n\n'
                f"Info:\n{company.info}\n\nContact:\n{company.contact}"
            )
            summary_json_str = summarize_text(prompt)
            if summary_json_str:
                try:
                    import json
                    clean_str = summary_json_str.strip().strip('`')
                    if clean_str.lower().startswith('json\n'):
                        clean_str = clean_str[5:]
                    infos = json.loads(clean_str)

                    # Keep strings; serialize any nested value as valid JSON.
                    infos = {k: _jsonify(v) for k, v in infos.items()}
                except Exception as e:
                    logger.error(f"Failed to parse JSON from AI for company {company.company_id}: {e}")
                    infos = {"info": summary_json_str, "contact": ""}
            else:
                infos = {"info": "", "contact": ""}
        
        processed_comp = ProcessedCompany(
            company_id=company.company_id,
            signatures=signatures,
            infos=infos
        )
        db.add(processed_comp)
        db.commit()

    # Process Recruitments
    unprocessed_recruitments = db.query(Recruitment).outerjoin(
        ProcessedRecruitment, Recruitment.recruitment_id == ProcessedRecruitment.recruitment_id
    ).filter(ProcessedRecruitment.recruitment_id == None).all()

    for rec in unprocessed_recruitments:
        logger.info(f"Processing recruitment: {rec.recruitment_id}")
        recruitment_infos = {
            "link": str(rec.recruitment_link or ""),
            "title": str(rec.title or ""),
            "salary": str(rec.salary or ""),
            "location": str(rec.location or ""),
            "experience": str(rec.experience or "")
        }
        
        descriptions = {}
        if rec.tags or rec.descriptions or rec.general_infos or rec.related_tags:
            prompt = (
                "Normalize this job posting into JSON with EXACTLY these keys:\n"
                '{"tags": ["<short skill/role keyword>", ...],  // flat array, max 8, for UI chips\n'
                '"descriptions": "<2-3 sentence plain-text summary of the role and responsibilities>",\n'
                '"general_infos": "<one short line: level, headcount, education, work type>",\n'
                '"related_tags": ["<related skill/field keyword>", ...]}  // flat array, max 8\n'
                "Arrays must contain plain strings only.\n\n"
                f"Tags:\n{rec.tags}\n\nDescriptions:\n{rec.descriptions}\n\n"
                f"General Info:\n{rec.general_infos}\n\nRelated Tags:\n{rec.related_tags}"
            )
            summary_json_str = summarize_text(prompt)
            if summary_json_str:
                try:
                    import json
                    clean_str = summary_json_str.strip().strip('`')
                    if clean_str.lower().startswith('json\n'):
                        clean_str = clean_str[5:]
                    descriptions = json.loads(clean_str)

                    # Keep strings; serialize any nested value as valid JSON.
                    descriptions = {k: _jsonify(v) for k, v in descriptions.items()}
                except Exception as e:
                    logger.error(f"Failed to parse JSON from AI for recruitment {rec.recruitment_id}: {e}")
                    descriptions = {"descriptions": summary_json_str, "tags": "", "general_infos": "", "related_tags": ""}
            else:
                descriptions = {"descriptions": "", "tags": "", "general_infos": "", "related_tags": ""}

        processed_rec = ProcessedRecruitment(
            recruitment_id=rec.recruitment_id,
            recruitment_infos=recruitment_infos,
            descriptions=descriptions,
            posted_date=rec.posted_date,
            application_deadline=rec.application_deadline,
            dedup_key=rec.dedup_key,
        )
        db.add(processed_rec)
        db.commit()
        
    logger.info("AI processing complete.")
