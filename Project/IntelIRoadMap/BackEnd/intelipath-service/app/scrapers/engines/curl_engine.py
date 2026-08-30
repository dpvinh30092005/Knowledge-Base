import os
import time
import random
import logging
from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests

logger = logging.getLogger(__name__)


class BlockedIpException(Exception):
    """Raised when CloudFlare blocks the request."""
    pass


class CurlEngine:
    """
    Fetches pages with curl_cffi while impersonating a real Chrome browser's
    TLS/JA3 and HTTP2 fingerprint.

    Cloudflare fingerprints the TLS handshake itself (JA3), not just the IP or
    the User-Agent header, so a plain `curl` / stock Python client gets flagged
    even with a browser UA. Impersonation is what actually clears the bot check.

    When the datacenter IP itself is blacklisted, set HTTPS_PROXY / ALL_PROXY
    (e.g. a residential proxy) and the request is routed through it - no code
    change needed, this engine picks the proxy up from the environment.
    """

    # curl_cffi alias that tracks the latest supported Chrome fingerprint.
    IMPERSONATE = "chrome"

    @staticmethod
    def _proxies() -> dict | None:
        proxy = (
            os.environ.get("HTTPS_PROXY")
            or os.environ.get("https_proxy")
            or os.environ.get("ALL_PROXY")
            or os.environ.get("all_proxy")
        )
        if not proxy:
            return None
        return {"http": proxy, "https": proxy}

    @staticmethod
    def get_document(url: str, retries: int = 3) -> BeautifulSoup | None:
        if not url or not url.strip():
            return None

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        for attempt in range(retries):
            try:
                # Randomized delay to simulate human timing (same as before).
                time.sleep(1.0 + random.random() * 2.0)

                response = cffi_requests.get(
                    url,
                    headers=headers,
                    impersonate=CurlEngine.IMPERSONATE,
                    proxies=CurlEngine._proxies(),
                    timeout=30,
                )

                page_source = response.text

                # Detect a CloudFlare block (interstitial page or challenge).
                blocked_body = (
                    ("Access denied" in page_source and "Cloudflare" in page_source)
                    or "Just a moment..." in page_source
                )
                if response.status_code in (403, 429) or blocked_body:
                    logger.warning(f"Blocked by Cloudflare for URL: {url}")
                    raise BlockedIpException(f"Blocked by Cloudflare for URL: {url}")

                if response.status_code >= 400:
                    logger.error(f"HTTP {response.status_code} for {url}")
                    if attempt < retries - 1:
                        time.sleep(2)
                    continue

                return BeautifulSoup(page_source, "html.parser")

            except BlockedIpException:
                raise  # Bubble up CloudFlare blocks immediately.
            except Exception as e:
                if attempt == retries - 1:
                    logger.error(f"Failed to connect after {retries} retries: {url} - {e}")
                else:
                    logger.warning(f"Error '{e}' on attempt {attempt + 1} for {url}. Retrying in 2s...")
                    time.sleep(2)

        return None
