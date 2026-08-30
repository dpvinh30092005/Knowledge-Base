    from datetime import date, datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
import uuid

class RecruitmentPostDetail(BaseModel):
    # Basic company info
    company_id: Optional[str] = None
    logo: Optional[str] = None
    company_name: Optional[str] = None

    # Basic recruitment info
    recruitment_id: Optional[str] = None
    title: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    application_deadline: Optional[date] = None

class RecruitmentPostResponse(BaseModel):
    post_details: Dict[uuid.UUID, List[Any]]

    model_config = ConfigDict(from_attributes=True)

class ScrapeStartResponse(BaseModel):
    status: str
    message: str

class CompanyResponse(BaseModel):
    companyId: Optional[str] = None
    companyLink: Optional[str] = None
    name: Optional[str] = None
    logo: Optional[str] = None
    introductions: Optional[List[str]] = None
    infos: Optional[Dict[str, str]] = None
    contacts: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class RecruitmentResponse(BaseModel):
    topCvRecruitmentId: Optional[str] = None
    recruitmentLink: Optional[str] = None
    title: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    applicationDeadline: Optional[date] = None
    tags: Optional[Dict[str, List[str]]] = None
    descriptions: Optional[Dict[str, List[str]]] = None
    generalInfos: Optional[Dict[str, str]] = None
    relatedTags: Optional[Dict[str, List[str]]] = None

    model_config = ConfigDict(from_attributes=True)
