from pydantic import BaseModel
from typing import List

class ExtractRequest(BaseModel):
    url: str

class SkillExtractRequest(BaseModel):
    descriptions: List[str]

class SkillExtractResponse(BaseModel):
    skills_per_doc: List[List[str]]
