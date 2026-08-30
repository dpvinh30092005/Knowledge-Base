from markitdown import MarkItDown
import ipaddress
import requests
import socket
import tempfile
import os
import urllib.parse
import logging

logger = logging.getLogger(__name__)

# Initialize once to reuse the instance
md = MarkItDown()

REQUEST_TIMEOUT_SECONDS = 15


def validate_public_document_url(url: str) -> None:
    """Reject local/private destinations before the extractor makes an HTTP request."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Only absolute HTTP(S) document URLs are supported.")

    if parsed.username or parsed.password:
        raise ValueError("Document URLs must not contain credentials.")

    try:
        addresses = {entry[4][0] for entry in socket.getaddrinfo(parsed.hostname, None)}
    except socket.gaierror as exception:
        raise ValueError("The document host could not be resolved.") from exception

    for address in addresses:
        if not ipaddress.ip_address(address).is_global:
            raise ValueError("Private or local network document URLs are not allowed.")


def extract_markdown_from_url(url: str) -> str:
    validate_public_document_url(url)
    logger.info(f"Downloading file from URL: {url}")

    # Download the file from the URL with a User-Agent to avoid 403
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    
    # Get filename and extension from URL
    parsed_url = urllib.parse.urlparse(url)
    filename = os.path.basename(parsed_url.path)
    if not filename or '.' not in filename:
        filename = "temp.file"
        
    # Create a temporary file to save the downloaded content
    with tempfile.NamedTemporaryFile(delete=False, suffix="_" + filename) as temp_file:
        temp_file.write(response.content)
        temp_file_path = temp_file.name

    try:
        logger.info(f"File downloaded successfully: {filename}. Starting MarkItDown conversion...")
        # Convert using MarkItDown
        result = md.convert(temp_file_path)
        logger.info(f"Extraction successful: {len(result.text_content)} characters extracted.")
        return result.text_content
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
