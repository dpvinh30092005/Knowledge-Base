from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    
    company_id = Column(String(255), primary_key=True)
    company_link = Column(Text)
    logo = Column(Text)
    name = Column(String(255))
    info = Column(JSONB)
    contact = Column(JSONB)

class ProcessedCompany(Base):
    __tablename__ = "processed_companies"
    
    company_id = Column(String(255), ForeignKey("companies.company_id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    signatures = Column(JSONB)
    infos = Column(JSONB)

class Recruitment(Base):
    __tablename__ = "recruitments"
    
    recruitment_id = Column(String(255), primary_key=True)
    recruitment_link = Column(Text)
    title = Column(String(255))
    salary = Column(String(255))
    location = Column(String(255))
    experience = Column(String(255))
    posted_date = Column(Date)
    application_deadline = Column(Date)
    # Identity of the JOB, not of this posting: a re-post gets a fresh URL slug and
    # therefore a fresh recruitment_id, which would double-count it in every trend.
    dedup_key = Column(String(300), index=True)
    tags = Column(JSONB)
    descriptions = Column(JSONB)
    general_infos = Column(JSONB)
    related_tags = Column(JSONB)

class ProcessedRecruitment(Base):
    __tablename__ = "processed_recruitments"
    
    recruitment_id = Column(String(255), ForeignKey("recruitments.recruitment_id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    recruitment_infos = Column(JSONB)
    descriptions = Column(JSONB)
    posted_date = Column(Date)
    application_deadline = Column(Date)
    # Copied through from the raw row so the backend can collapse re-posts without
    # having to re-derive the key from a jsonb blob.
    dedup_key = Column(String(300), index=True)

class RecruitmentPost(Base):
    __tablename__ = "recruitment_posts"
    
    post_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(String(255), ForeignKey("companies.company_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    recruitment_id = Column(String(255), ForeignKey("recruitments.recruitment_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    expire_at = Column(Date)
