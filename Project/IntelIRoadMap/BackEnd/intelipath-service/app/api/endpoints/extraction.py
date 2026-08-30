from fastapi import APIRouter, Depends, HTTPException
import requests
from app.api.security import verify_api_key
from app.schemas.extraction import ExtractRequest, SkillExtractRequest, SkillExtractResponse
import re
import asyncio
from typing import List
from app.services.markitdown_service import extract_markdown_from_url
from app.services import llm_service
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.post("/extract")
async def extract_content(request: ExtractRequest):
    logger.info(f"Received extraction request for URL: {request.url}")
    try:
        markdown_text = extract_markdown_from_url(request.url)
        return {"markdown": markdown_text}
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file from URL: {str(e)}")
    except Exception as e:
        logger.error(f"MarkItDown error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

# What a job post might say, mapped to the one name the backend's skill catalog uses.
#
# Every name emitted here is looked up in that catalog, and anything unrecognised is
# inserted as a brand new skill. So a spelling that only exists here does not fail
# loudly — it silently forks the catalog. "ReactJS" and "React", "HTML" and "HTML5",
# "Go" and "Golang" are the same skill to a reader and two unrelated rows to a join,
# which is how the catalog reached 300 entries with 138 of them on no roadmap at all.
#
# Keys are what a posting writes; values are the catalog spelling. Keep the values in
# step with the `skills` table.
SKILL_ALIASES = {
    "ReactJS": "React",
    "React.js": "React",
    "Vue.js": "Vue",
    "VueJS": "Vue",
    "NodeJS": "Node.js",
    "Node": "Node.js",
    "Golang": "Go",
    "HTML": "HTML5",
    "HTML5": "HTML5",
    "CSS": "CSS3",
    "CSS3": "CSS3",
    "REST API": "REST",
    "RESTful": "REST",
    "Postgres": "PostgreSQL",
    "K8s": "Kubernetes",
}

COMMON_SKILLS = [
    "React", "Vue", "Angular", "Node.js", "Spring Boot", "Java", "Python",
    "Django", "Flask", "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails",
    "Go", "Rust", "C++", "C", "TypeScript", "JavaScript",
    "HTML5", "CSS3", "SQL", "MySQL", "PostgreSQL", "MongoDB", "NoSQL",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git",
    "REST", "GraphQL", "Microservices", "Machine Learning", "AI",
    "Data Science", "DevOps", "CI/CD", "Agile", "Scrum",
]

# Search for every spelling, report the canonical one. Sorted longest-first so
# "Node.js" is tried before "Node" and the specific alias wins.
_SEARCH_TERMS = sorted(
    {term: SKILL_ALIASES.get(term, term) for term in COMMON_SKILLS + list(SKILL_ALIASES)}.items(),
    key=lambda item: len(item[0]),
    reverse=True,
)

# A short name is a substring of longer skill names built from punctuation the
# plain alphanumeric boundary treats as a word break: "C" sits inside "C++" and
# "C#", "Go" inside "Go-lang". Measured cost of getting this wrong: "C" was
# reported in 754 of 866 postings (87%) when the postings' own tags named it 16
# times — enough to make C a REQUIRED skill ahead of Java on every roadmap.
SHORT_NAME_LENGTH = 2

# Characters that may not sit next to a short name. Kept to the ones that
# actually form other skill names, so "C, C++" and "(C)" still read as C.
_ADJACENT_TO_SHORT = r"+#._\-/"


def _boundary_pattern(term: str) -> "re.Pattern[str]":
    """
    A word boundary that understands Vietnamese.

    `\\w` rather than `[a-zA-Z0-9]`: Python 3 matches it against Unicode, so an
    accented letter counts as part of a word. The ASCII class did not, which made
    every accented vowel look like a word break — "của", "các", "cần" all matched
    the skill "C", and C was reported in 347 of 866 postings, most of them simply
    written in Vietnamese.
    """
    if len(term) <= SHORT_NAME_LENGTH:
        return re.compile(
            rf"(?<![\w{_ADJACENT_TO_SHORT}]){re.escape(term)}"
            rf"(?![\w{_ADJACENT_TO_SHORT}])",
            re.IGNORECASE,
        )
    return re.compile(rf"(?<!\w){re.escape(term)}(?!\w)", re.IGNORECASE)


_SKILL_PATTERNS = [
    (canonical, _boundary_pattern(term)) for term, canonical in _SEARCH_TERMS
]


def canonical_skill(name: str) -> str:
    """The catalog spelling for a skill name, whoever produced it."""
    if not name:
        return name
    trimmed = name.strip()
    for term, canonical in _SEARCH_TERMS:
        if term.lower() == trimmed.lower():
            return canonical
    return trimmed


def _regex_extract(desc: str) -> List[str]:
    """Fallback: keyword matching when the LLM is off or fails."""
    if not desc:
        return []
    found = []
    # Consume each match so a shorter name cannot re-read text a longer one has
    # already claimed. _SKILL_PATTERNS is sorted longest-first, so "C++" is taken
    # out of the running before "C" is tried at all — without this, every C++
    # posting also counted as a C posting.
    remaining = desc
    for canonical, pattern in _SKILL_PATTERNS:
        if not pattern.search(remaining):
            continue
        if canonical not in found:
            found.append(canonical)
        remaining = pattern.sub(" ", remaining)
    return found


def _extract_one(desc: str) -> List[str]:
    """Prefer the LLM; fall back to keyword matching if AI is off or fails."""
    if not desc:
        return []
    if llm_service.is_enabled():
        ai_skills = llm_service.extract_skills(desc)
        if ai_skills is not None:
            # The LLM writes whatever the posting called it. Canonicalise here too, or
            # turning AI on quietly forks the catalog the same way the old list did.
            seen = []
            for skill in ai_skills:
                canonical = canonical_skill(skill)
                if canonical and canonical not in seen:
                    seen.append(canonical)
            return seen
    return _regex_extract(desc)


# RETIRED — kept only to name what it did, because the reasoning reads sound and
# was not. It used to be 3: "below this many keyword hits the pattern list does not
# know the vocabulary and an LLM call is worth it; above it, the keyword pass already
# found the stack."
#
# The flaw is the word "already". COMMON_SKILLS holds 44 names. Finding 3 of them is
# evidence about those 3 and about nothing else — the list cannot report Redis, JWT,
# OAuth, RabbitMQ or Spring Security because it has never heard of them, so no count
# of its hits is evidence that a description has been read.
#
# It then selected backwards. Measured on 912 postings:
#
#   Java / Spring Boot ads:  159 postings, 12% carried any vocabulary beyond the 44
#                            names, averaging 0.28 extra skills
#   everything else:         753 postings, 50% did, averaging 2.21
#
# A backend ad names Java, SQL and Docker in its first paragraph, clears the
# threshold instantly, and its remaining fifteen technologies are never looked at.
# A non-engineering ad — BPMN, CISSP, Change Management — scores nothing on a list
# of programming languages and gets the model's full attention. The threshold spent
# the AI budget precisely where it was least useful, and skipped every posting whose
# extra vocabulary the roadmap actually needed. Result: 13 of Backend's 27 core
# skills had zero postings, and 4.9 skills extracted per ad that lists 10-20.
#
# So every unique description now goes to the model. Deduplication above already
# collapses reposts and syndicated copies, which is where the real saving was.

# Concurrent LLM calls. Enough to hide per-call latency, low enough not to trip
# provider rate limits on a thousand-posting run.
#
# Raised from 8 alongside the retirement of the escalation threshold: the run now
# reads every unique description rather than a fraction, so the same wall-clock
# budget has to cover roughly 2.3x the calls. 12 puts a 912-posting run near 150s,
# well inside the caller's read timeout, without pushing far into rate-limit
# territory on a small model.
LLM_CONCURRENCY = 12


def _extract_batch(descriptions: List[str]) -> List[List[str]]:
    """
    Extract skills from many descriptions without a serial round-trip each.

      1. **Deduplicate.** Postings repeat heavily — the same company reposts the
         same text, and agencies syndicate one ad to several boards. Identical
         text is extracted once and the answer reused. This is where the saving
         actually comes from, and it costs nothing in recall.
      2. **Keyword pass on everything.** Free, deterministic, and exact where it
         fires — but only across the 44 names in COMMON_SKILLS.
      3. **LLM on every unique description, in parallel**, unioned with the
         keyword hits rather than replacing them.

    Step 3 used to run only on descriptions where step 2 came up thin, which read
    as a sensible economy and was a recall bug — see the note on the retired
    LLM_ESCALATION_THRESHOLD above. Reading everything is the point: a job ad's
    fifth technology is as real as its first, and the keyword list has no way to
    tell us it missed one.
    """
    unique_by_text = {}
    for desc in descriptions:
        unique_by_text.setdefault(desc or "", None)

    keyword_hits = {text: _regex_extract(text) for text in unique_by_text}

    if llm_service.is_enabled():
        needs_llm = [text for text in keyword_hits if text]
        if needs_llm:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=LLM_CONCURRENCY) as pool:
                for text, ai_skills in zip(needs_llm, pool.map(llm_service.extract_skills, needs_llm)):
                    if not ai_skills:
                        continue
                    # Union, not replacement: the keyword pass is exact where it
                    # fires, and dropping its hits for the model's opinion would
                    # lose the one part of this we can be sure about.
                    merged = list(keyword_hits[text])
                    for skill in ai_skills:
                        canonical = canonical_skill(skill)
                        if canonical and canonical not in merged:
                            merged.append(canonical)
                    keyword_hits[text] = merged
        logger.info(
            "Skill extraction: %d descriptions, %d unique, %d read by the LLM",
            len(descriptions), len(unique_by_text), len(needs_llm))
    else:
        logger.info("Skill extraction: %d descriptions, %d unique, keyword mode",
                    len(descriptions), len(unique_by_text))

    return [keyword_hits.get(desc or "", []) for desc in descriptions]


@router.post("/extract-skills", response_model=SkillExtractResponse)
async def extract_skills(request: SkillExtractRequest):
    mode = "AI" if llm_service.is_enabled() else "keyword"
    logger.info(f"Received skill extraction request for {len(request.descriptions)} descriptions ({mode} mode)")

    # Offload the (blocking) work to a thread so the event loop stays free.
    results = await asyncio.to_thread(_extract_batch, request.descriptions)

    logger.info("Skill extraction completed successfully")
    return SkillExtractResponse(skills_per_doc=results)
