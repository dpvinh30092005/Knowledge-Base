from pydantic_settings import BaseSettings, SettingsConfigDict

# Default values if Environment Variable cannot be found
class Settings(BaseSettings):
    thread_sleep: int = 500
    topcv_target: str = "https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257"
    itviec_target: str = "https://itviec.com/it-jobs"
    # Query fragment appended to every listing page to ask ITviec for newest-first,
    # e.g. "sort=newest". Left empty on purpose: ITviec's default order mixes
    # promoted and relevance-ranked jobs, so without this the scraper collects
    # "whatever ITviec wants to show" rather than the most recent postings — set it
    # to the real parameter (copy it from the site's own sort control) and the
    # scraper will verify the ordering it actually got.
    itviec_sort_query: str = ""
    linkedin_target: str = "https://vn.linkedin.com/jobs"
    service_api_key: str = ""
    # Ceiling for a single scrape request. The backend's SCRAPER_LIMIT must stay at or
    # below this: a larger value is rejected outright with a 400, so the scrape fails
    # completely rather than quietly stopping at the cap. Raise both together.
    max_scrape_limit: int = 1200

    # LLM config (OpenAI-compatible). Leave llm_api_key empty to disable AI and
    # fall back to keyword matching. base_url lets you point at OpenAI, Gemini's
    # OpenAI-compatible endpoint, OpenRouter, a local model, etc.
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str = "https://api.openai.com/v1"

    database_url: str = "postgresql://postgres:12345@localhost/Scraper"

    # FLM (FPT Learning Management) scraper. Auth is the browser session cookie
    # (login via FEID first, then copy the full Cookie header). Be polite: keep a
    # delay between requests.
    flm_base_url: str = "https://flm.fpt.edu.vn"
    flm_cookie: str = ""
    flm_delay_ms: int = 800
    flm_user_agent: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
