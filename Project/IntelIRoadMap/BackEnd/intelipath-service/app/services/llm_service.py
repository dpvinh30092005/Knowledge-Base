"""
Thin, provider-agnostic LLM wrapper for the Intelipath AI service.

Uses the OpenAI Python SDK, which speaks the OpenAI-compatible protocol shared by
OpenAI, Google Gemini (compat endpoint), OpenRouter, Groq, local servers, etc.
Point it wherever you want via llm_base_url / llm_model / llm_api_key in .env.

Everything here is synchronous; call it from async endpoints with
`asyncio.to_thread(...)` so the event loop is not blocked. The client is created
lazily so importing this module never fails when no key is configured.

`complete_json()` is a generic helper other AI text tasks can reuse.
"""

import json
import logging
from typing import List, Optional

from app.config.config import settings

logger = logging.getLogger(__name__)

_client = None


def is_enabled() -> bool:
    """True when an API key is configured, i.e. AI features should be used."""
    return bool(settings.llm_api_key)


def _get_client():
    """Lazily build (and cache) the OpenAI client. Returns None if disabled."""
    global _client
    if not is_enabled():
        return None
    if _client is None:
        # Imported here so the dependency is only required when AI is enabled.
        from openai import OpenAI

        _client = OpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url)
        logger.info("LLM client initialised (model=%s, base_url=%s)", settings.llm_model, settings.llm_base_url)
    return _client


def complete_text(system_prompt: str, user_prompt: str) -> Optional[str]:
    """
    Run a chat completion and return the raw response text (a JSON string when the
    prompt asks for JSON). Returns None if AI is disabled or the call fails. Use
    this when the caller wants the raw content; use complete_json to get it parsed.
    """
    client = _get_client()
    if client is None:
        return None
    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as exc:  # noqa: BLE001 - callers fall back to regex
        logger.error("LLM completion failed: %s", exc)
        return None


def complete_json(system_prompt: str, user_prompt: str) -> Optional[dict]:
    """
    Run a chat completion that must return a single JSON object. Returns the
    parsed dict, or None if AI is disabled or the call/parse fails.
    """
    content = complete_text(system_prompt, user_prompt)
    if not content:
        return None
    try:
        return json.loads(content)
    except (ValueError, TypeError) as exc:
        logger.error("LLM JSON parse failed: %s", exc)
        return None


# What the model gets told a skill IS, rather than four examples of one.
#
# The previous prompt asked for "canonical, well-known skill names" and gave four
# positive examples. Measured over 913 postings that produced abstraction, not skills:
# the model added `Cloud` to 58 postings, `API` to 49, `Oracle` to 31, `Database` to 13,
# `Software Development` to 15 and `OOP` to 16 — while adding nothing at all to Python,
# Java or Docker, which the keyword pass had already found. It was answering "what area
# is this job in", which is not the question.
#
# The difference matters downstream and not only in the abstract. A posting that says
# "AWS" is evidence about AWS; recording it as "Cloud" throws away the only part a
# student can go and learn, and `Cloud` then competes with real skills for a place in
# the career's HIGH set — which is the readiness denominator.
#
# So the prompt now states the definition, shows the failures as negatives, and pins the
# spelling rules that were forking the catalog (`Micro-service` beside `Microservices`,
# `Fast API` beside `FastAPI`). The backend canonicalises again on arrival — see
# SkillNameCanonicalizer — because a prompt is guidance and a catalog needs a guarantee.
#
# Deliberately NOT done: sending the catalog as an allowed vocabulary. Measured
# elsewhere in this system (RepoSkillCandidateSelector), handing a model 1,466 skill
# names returned zero matches — too much hay, no needle. Matching against the catalog is
# the backend's job, where it cannot drown.
_SKILL_SYSTEM_PROMPT = (
    "You extract the skills an IT job description requires.\n"
    "\n"
    "A skill is something a person can name, learn and be assessed on: a language, "
    "framework, library, tool, platform, protocol, database, cloud service, or a named "
    "practice (e.g. 'TDD', 'Code Review', 'Pair Programming').\n"
    "\n"
    "Do NOT return:\n"
    "- Category words. 'Cloud', 'API', 'Database', 'Software Development', "
    "'Automation', 'Programming', 'Architecture', 'Security', 'Testing' name a whole "
    "field, not a skill. If the posting says AWS, return 'AWS' — never 'Cloud'. If it "
    "says PostgreSQL, return 'PostgreSQL' — never 'Database'.\n"
    "- Combined names. Split them: 'Cloud Computing & AWS' -> 'AWS'; "
    "'Java / Kotlin' -> 'Java', 'Kotlin'; 'Git and Version Control' -> 'Git'.\n"
    "- Section headings. Anything ending in Fundamentals, Basics, Techniques, "
    "Methodologies, Tools, Strategies, Patterns, Styles or Principles.\n"
    "- Job titles, seniority, soft skills, languages spoken, perks, or company benefits.\n"
    "- Anything the text does not actually require. Do not guess a stack from the "
    "industry or the company name.\n"
    "\n"
    "The ban is on the CATEGORY, never on a product inside it. A named technology is "
    "always returned, whichever banned word describes its field: Redis and PostgreSQL "
    "are databases and both are returned; Kafka and RabbitMQ are messaging and both are "
    "returned; OAuth and JWT are security and both are returned; Cypress and JUnit are "
    "testing and both are returned. Reject 'Database', keep 'Redis'.\n"
    "\n"
    "Spelling — use the official form, singular, with no duplicated acronym:\n"
    "  'Micro-service', 'Microservices Architecture' -> 'Microservices'\n"
    "  'Fast API' -> 'FastAPI'      'React.js', 'ReactJS' -> 'React'\n"
    "  'RESTful', 'REST API'  -> 'REST'\n"
    "  'Google Cloud Platform (GCP)' -> 'GCP'\n"
    "  'Elastic Search' -> 'Elasticsearch'\n"
    "Keep a version only when the version is the name: 'HTML5', '.NET', 'Vue 3'.\n"
    "\n"
    "The description may be in Vietnamese; the skill names are still written in their "
    "usual English form.\n"
    "\n"
    "Example — 'Tuyển Backend Developer: thành thạo Java, Spring Boot, làm việc với "
    "PostgreSQL và Redis, triển khai trên AWS, hiểu về microservices và bảo mật API. "
    "Ưu tiên biết Docker. Lương thoả thuận, thưởng tháng 13.'\n"
    '{"skills": ["Java", "Spring Boot", "PostgreSQL", "Redis", "AWS", '
    '"Microservices", "Docker"]}\n'
    "Note what is absent: 'bảo mật API' became neither 'Security' nor 'API', because "
    "neither is a thing to learn; the salary and bonus are not skills.\n"
    "\n"
    'Respond ONLY as JSON: {"skills": ["Skill A", "Skill B"]}.'
)


def extract_skills(description: str) -> Optional[List[str]]:
    """
    Extract a list of skills from one job description using the LLM.
    Returns None when AI is disabled or the call fails, so the caller can fall
    back to keyword matching.
    """
    if not description or not description.strip():
        return []
    result = complete_json(_SKILL_SYSTEM_PROMPT, description)
    if result is None:
        return None
    skills = result.get("skills", [])
    if not isinstance(skills, list):
        return None
    # Keep only non-empty strings, trimmed and de-duplicated (case-insensitive).
    seen = set()
    cleaned: List[str] = []
    for skill in skills:
        if not isinstance(skill, str):
            continue
        name = skill.strip()
        if name and name.lower() not in seen:
            seen.add(name.lower())
            cleaned.append(name)
    return cleaned
