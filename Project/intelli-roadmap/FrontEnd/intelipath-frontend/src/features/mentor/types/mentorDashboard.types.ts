export type MentorAlert = {
  alertCount: number;
  alertText: string;
};

export type MentorMetric = {
  value: string | number;
};

export type PendingReview = {
  id: string;
  name: string;
  time: string;
};

export type MentorInsightData = {
  insightText: string;
};

export type CareerDistributionData = {
  career: string;
  students: number;
};

export type StudentPortfolio = {
  id: string;
  fullName: string;
  email: string;
  university: string;
  major?: string;
  bio: string;
  github_profile?: string;
  portfolio_url?: string;
  projects: any[];
  skills: any[];
};

export type FeedbackPayload = {
  type: string;
  content: string;
};

export type DashboardLoadStatus = "loading" | "success" | "error";
