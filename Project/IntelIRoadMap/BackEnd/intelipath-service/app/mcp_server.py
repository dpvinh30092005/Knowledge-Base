from fastmcp import FastMCP

from app.services.markitdown_service import extract_markdown_from_url, validate_public_document_url

MAX_DOCUMENT_CHARACTERS = 80_000

mcp = FastMCP("Intelipath Document Tools")


@mcp.tool(
    name="extract_document",
    description=(
        "Read a publicly accessible PDF, DOCX, XLSX, PPTX, image, or other supported document URL "
        "and return its Markdown text. Use this only when full-document detail is required or the "
        "retrieved RAG context is insufficient."
    ),
)
def extract_document(url: str) -> dict:
    """Extract a bounded Markdown representation of a public document URL."""
    validate_public_document_url(url)
    markdown = extract_markdown_from_url(url)
    truncated = len(markdown) > MAX_DOCUMENT_CHARACTERS
    returned_markdown = markdown[:MAX_DOCUMENT_CHARACTERS]

    return {
        "markdown": returned_markdown,
        "character_count": len(markdown),
        "truncated": truncated,
        "next_action": (
            "The document exceeds the safe tool output limit; use the available text and state that "
            "the complete document could not fit in context."
            if truncated
            else ""
        ),
    }
