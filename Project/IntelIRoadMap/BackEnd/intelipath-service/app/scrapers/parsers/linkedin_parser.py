from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from app.config.config import settings
import logging

logger = logging.getLogger(__name__)

def parse_linkedin_jobs():
    logger.info("Starting LinkedIn Jobs Scraper...")
    
    options = Options()
    options.add_argument("--headless=new")
    driver = None

    try:
        driver = webdriver.Chrome(options=options)
        driver.get(settings.linkedin_target)

        title = driver.title
        logger.info(f"Page title: {title}")

        headings = driver.find_elements(By.TAG_NAME, "h1")
        if headings:
            logger.info(f"Heading: {headings[0].text}")

    except Exception as e:
        logger.error(f"Error parsing LinkedIn jobs: {e}")
    finally:
        if driver:
            driver.quit()
