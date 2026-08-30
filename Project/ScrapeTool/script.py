from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument("--start-maximized")

driver = webdriver.Chrome(options=options)

driver.get("https://itviec.com/it-jobs")

time.sleep(5)

jobs = driver.find_elements(By.TAG_NAME, "h3")

seen = set()
count = 0

for job in jobs:
    title = job.text.strip()

    if title and title not in seen and len(title) > 5:
        seen.add(title)
        count += 1
        print(f"{count}. {title}")

driver.quit()