export interface Company {
  company_id: string;
  company_link: string;
  logo: string;
  name: string;
  introduction: Record<string, any>;
  info: Record<string, any>;
  contact: Record<string, any>;
}

export interface Recruitment {
  recruitment_id: string;
  recruitment_link: string;
  title: string;
  salary: string;
  location: string;
  experience: string;
  seniority?: string;
  application_deadline: string; // ISO Date string
  tags: string[];
  descriptions: Record<string, any>;
  general_infos: Record<string, any>;
  related_tags: string[];
}

export interface RecruitmentPost {
  post_id: string;
  company_id: string;
  recruitment_id: string;
  company?: Company;
  recruitment?: Recruitment;
}

export interface TopCompany {
  topCvCompanyId?: string;
  name: string;
  logo: string;
  companyLink: string;
  recruitmentCount: number;
}

export interface SkillDataPoint {
  date: string;
  jobsNeeded: number;
}

export interface SkillTrend {
  skillName: string;
  dataPoints: SkillDataPoint[];
}

export interface SalaryBracket {
  category: string;
  jobCount: number;
}

/**
 * How current the data behind the charts is.
 *
 * Rendered on the page rather than kept for debugging: every figure here is a
 * claim about the job market, and a claim with no period attached is read as
 * "right now" whether or not the last scrape was a week ago.
 */
export interface Freshness {
  windowDays: number;
  /** Distinct jobs advertised in the window — re-posts counted once. */
  jobsInWindow: number;
  /** Of those, the ones never advertised before. What "new" honestly means. */
  newJobs: number;
  /** Most recent posting on file; the gap to today is how stale the data is. */
  latestPostedDate: string | null;
}
