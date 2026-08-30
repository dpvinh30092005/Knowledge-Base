// API Endpoints Configuration

export const ENDPOINTS = {
  // ─── Authentication & Authorization ──────────────────────────
  // Authentication & Authorization
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH_TOKEN: "/auth/refresh"
  },
  USERS: {
    ME: "/users/me",
    PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/profile/password"
  },
  STUDENT_OLD: {
    PROFILE: "/students/profile",
    TARGET_CAREER: "/students/target-career",
    SKILLS: "/students/skills",
    SELECT_SKILLS: "/students/skills/select",
    ME: "/user/me",
    PROFILE_USER: "/user/profile"
  },
  STUDENT: {
    PROFILE: "/student/profile",
    SKILLS: "/student/skills",
    SELECT_SKILLS: "/student/skills/select",
    PORTFOLIO_ME: "/student/portfolio/me",
    PORTFOLIO_SLUG: "/student/portfolio/slug",
    // OLD CODE: (no old code for UPLOAD_TRANSCRIPT, just adding new endpoint)
    PORTFOLIO_GITHUB_IMPORT: "/student/portfolio/projects/github-import",
    PORTFOLIO_GITHUB_REPOS: "/student/portfolio/projects/github-repos",
    PORTFOLIO_GITHUB_IMPORT_BATCH:
      "/student/portfolio/projects/github-import-batch",
    PORTFOLIO_GITHUB_ANALYSIS_PLAN:
      "/student/portfolio/projects/github-analysis-plan",
    // What the AI read and answered for one imported repository. 404 when the
    // repository was imported before auditing existed.
    PORTFOLIO_GITHUB_AUDIT: "/student/portfolio/projects/github-audit",
    // The skills one repository is currently vouching for. GET asks what deleting the
    // project would cost; DELETE gives them up. Two calls because the student is asked
    // between them.
    PORTFOLIO_GITHUB_EVIDENCE: "/student/portfolio/projects/github-evidence",
    PORTFOLIO_GITHUB_LINK_START: "/student/portfolio/github/link/start",
    PORTFOLIO_GITHUB_LINK: "/student/portfolio/github/link",
    PORTFOLIO_REQUEST_REVIEW: "/student/portfolio/request-review",
    PORTFOLIO_ABOUT_AI_DRAFT: "/student/portfolio/about/ai-draft",
    UPLOAD_TRANSCRIPT: "/student/profile/transcript",
    ASSESSMENT_QUESTIONS: "/student/assessment/questions",
    ASSESSMENT_SUBMIT: "/student/assessment/submit",
    ASSESSMENT_LATEST: "/student/assessment/latest",
    // The graded paper: real questions with right answers, for the careers that
    // have a bank. Answers 204 when there is none, and the client falls back to
    // ASSESSMENT_QUESTIONS above.
    ASSESSMENT_PAPER: "/student/assessment/paper",
    ASSESSMENT_PAPER_SUBMIT: "/student/assessment/paper/submit",
    LEVEL: "/student/level",
    CAREER_AFFINITY: "/student/career-affinity"
  },
  CAREER_ROLES: {
    LIST: "/careers"
  },
  MENTOR_DIRECTORY: {
    // Mentors a student may request a portfolio review from. Separate from MENTOR_DASHBOARD
    // because that group is mentor-only, while this one is read by students.
    LIST: "/mentors"
  },
  CURRICULUM: {
    // FPT subject declaration -> transcript evidence -> dynamic roadmap.
    FPT_SUBJECTS: "/students/me/fpt-subjects",
    FPT_SUBJECT_DETAIL: (code: string) =>
      `/students/me/fpt-subjects/${encodeURIComponent(code)}`,
    FPT_MATERIAL_DOWNLOAD: (id: string) =>
      `/students/me/fpt-materials/${id}/download`,
    CURRICULUM_TERM: "/students/me/curriculum-term",
    SET_CURRICULUM: "/students/me/curriculum"
  },
  ROADMAP: {
    CAREER_ROADMAP: (careerId: string) => `/roadmaps/${careerId}`,
    CAREER_PROGRESS: (careerId: string) => `/roadmaps/${careerId}/progress`,
    STUDENT_ROADMAP: "/roadmaps/student",
    // The inverse of STUDENT_ROADMAP: that one filters the career's catalog down,
    // this one starts from the student's own evidence and derives the work.
    STUDENT_PLAN: "/roadmaps/student/plan",
    // One standalone roadmap under the career (a language, a framework), opened
    // in full rather than folded into the career path.
    STUDENT_SUB_ROADMAP: (nodeId: string) => `/roadmaps/student/sub/${nodeId}`,
    NODE_DETAIL: (nodeId: string) => `/roadmaps/nodes/${nodeId}`,
    UPDATE_NODE_PROGRESS: "/roadmaps/nodes/progress",
    COMPARE_SKILLS: "/roadmap/skills/compare",
    SELECTIONS: "/roadmaps/selections",
    CLEAR_SELECTION: (groupNodeId: string) =>
      `/roadmaps/selections/${groupNodeId}`,
    // Read-only ranking of one group's alternatives. Opening a chooser must
    // never store a selection as a side effect of looking at it.
    CHOICE_OPTIONS: (groupNodeId: string) =>
      `/roadmaps/selections/${groupNodeId}/options`
  },

  ROADMAP_RECOMMENDATIONS: {
    PENDING: "/roadmaps/recommendations",
    GENERATE: "/roadmaps/recommendations/generate",
    ACCEPT: (recommendationId: string) =>
      `/roadmaps/recommendations/${recommendationId}/accept`,
    REJECT: (recommendationId: string) =>
      `/roadmaps/recommendations/${recommendationId}/reject`
  },
  ROADMAP_EDITOR: {
    CAREER_NODES: (careerId: string) =>
      `/roadmaps/editor/careers/${careerId}/nodes`,
    CREATE_NODE: (careerId: string) =>
      `/roadmaps/editor/careers/${careerId}/nodes`,
    UPDATE_NODE: (nodeId: string) => `/roadmaps/editor/nodes/${nodeId}`,
    DELETE_NODE: (nodeId: string) => `/roadmaps/editor/nodes/${nodeId}`,
    SAVE_POSITIONS: "/roadmaps/editor/nodes/positions"
  },
  STUDENT_DASHBOARD: {
    OVERVIEW: "/student/dashboard",
    ROADMAP_PROGRESS: "/student/dashboard/roadmap-progress",
    SKILL_GAPS: "/student/dashboard/skill-gaps",
    MENTOR_FEEDBACK: "/student/dashboard/mentor-feedback",
    // Read state lives on the server (feedback.status NEW/READ/DELETED). Marking read in
    // the browser alone is what made an opened notification come back unread on reload.
    MENTOR_FEEDBACK_READ: (id: string) =>
      `/student/dashboard/mentor-feedback/${id}/read`,
    MENTOR_FEEDBACK_REPLY: (id: string) =>
      `/student/dashboard/mentor-feedback/${id}/reply`,
    MENTOR_FEEDBACK_DISMISS: (id: string) =>
      `/student/dashboard/mentor-feedback/${id}`,
    RECOMMENDATIONS: "/student/dashboard/recommendations",
    MARKET_DEMAND: "/student/dashboard/market-demand",
    AI_HISTORY: "/student/dashboard/ai-history",
    COMPARE_SKILLS: "/roadmap/skills/compare"
  },
  MARKET_TRENDS: {
    BASE: "/market-trends",
    TOP_HIRING: "/market-trends/companies/top-hiring",
    TRENDING_SKILLS: "/market-trends/skills/trending",
    SALARY_OVERVIEW: "/market-trends/salary-overview",
    FRESHNESS: "/market-trends/freshness",
    /** The actual ads behind a skill's count, so the number can be checked at source. */
    SKILL_POSTINGS: (skillId: string) => `/market-trends/skills/${skillId}/postings`
  },
  // UNIVERSITIES: {
  //   LIST: "/universities"
  // },
  RECRUITMENT_POSTS: {
    ALL: "/recruitment-posts/",
    COMPANY: (companyId: string) => `/recruitment-posts/company/${companyId}`,
    RECRUITMENT: (recruitmentId: string) =>
      `/recruitment-posts/recruitment/${recruitmentId}`
  },
  ADMIN_DASHBOARD: {
    METRICS_USERS: "/admin/dashboard/metrics/users",
    METRICS_COURSES: "/admin/dashboard/metrics/courses",
    METRICS_HEALTH: "/admin/dashboard/metrics/health",
    USERS: "/admin/dashboard/users",
    USER: (userId: string) => `/admin/dashboard/users/${userId}`,
    USER_ROLE: (userId: string) => `/admin/dashboard/users/${userId}/role`,
    USER_STATUS: (userId: string) => `/admin/dashboard/users/${userId}/status`,
    TRIGGER_SKILL_EXTRACTION: "/admin/dashboard/trigger-skill-extraction",
    TRIGGER_JOB_SCRAPER: "/admin/dashboard/trigger-job-scraper"
  },
  ADMIN_FLM: {
    SYNC: "/admin/flm/sync",
    SYNC_STATUS: (jobId: string) => `/admin/flm/sync/${jobId}`,
    MIRROR: "/admin/flm/mirror-materials",
    MIRROR_STATUS: (jobId: string) => `/admin/flm/mirror-materials/${jobId}`,
    STATUS: "/admin/flm/status",
    JOBS: "/admin/flm/jobs",
    JOB: (jobId: string) => `/admin/flm/jobs/${jobId}`
  },
  COUNSELOR: {
    PROFILE: "/counselor/me/profile"
  },
  COUNSELOR_DASHBOARD: {
    // METRICS_STUDENTS: "/counselor/dashboard/metrics/students",
    // METRICS_PROGRESS: "/counselor/dashboard/metrics/progress",
    // METRICS_AT_RISK: "/counselor/dashboard/metrics/at-risk",
    // METRICS_ENGAGEMENT: "/counselor/dashboard/metrics/engagement",
    // LEARNING_ACTIVITY: "/counselor/dashboard/learning-activity",
    CAREER_DISTRIBUTION: "/counselor/dashboard",
    CURRICULUMS: "/counselor/curriculums",
    MISSING_SKILLS: "/counselor/dashboard/missing-skills",
    GET_STUDENT_FEEDBACK: "/counselor/dashboard/feedback/me",
    GET_STUDENT_LIST: "/counselor/feedback/students",
    GET_STUDENT_INFO: (studentId: string) =>
      `/counselor/feedback/student/info/${studentId}`,
    HISTORY_FEEDBACK: (studentId: string) =>
      `/counselor/feedback/student/info/${studentId}`,
    CREATE_FEEDBACK: "/counselor/feedback/create",
    MODIFY_FEEDBACK: "/counselor/feedback/modify",
    DELETE_FEEDBACK: (feedbackId: string) =>
      `/counselor/feedback/delete/${feedbackId}`,
    EXPORT_STUDENTS: "/counselor/export-students",
    IMPORT_STUDENTS: "/counselor/import-students",
    CHECK_STUDENT_EMAIL: (email: string) =>
      `/counselor/import-student/${email}`,
    GET_COUNSELOR_PROFILE: "/counselor/me/profile"
  },
  MENTOR_DASHBOARD: {
    WELCOME_ALERT: "/mentor/dashboard/welcome-alert",
    METRICS: "/mentor/dashboard/metrics",
    PENDING_REVIEWS: "/mentor/dashboard/pending-reviews",
    INSIGHT: "/mentor/dashboard/insight",
    CAREER_DISTRIBUTION: "/mentor/dashboard/career-distribution",
    STUDENT_LIST: "/mentor/feedback/students",
    FEEDBACK_HISTORY: "/mentor/feedback/history",
    SUBMIT_FEEDBACK: "/mentor/feedback/submit",
    PROGRESS_REPORTS: "/mentor/dashboard/progress-reports"
  },
  MENTOR: {
    PROFILE: "/mentor/profile",
    PORTFOLIO_AUDIT: "/mentor/portfolio/audit"
  },
  CHAT: {
    SESSIONS: "/chat/sessions",
    SESSION: (sessionId: string) => `/chat/sessions/${sessionId}`,
    MESSAGES: (sessionId: string) => `/chat/sessions/${sessionId}/messages`,
    STREAM: (sessionId: string) => `/chat/sessions/${sessionId}/stream`,
    UPLOAD_FILE: "/chat/files/upload"
  },
  MENTOR_COURSES: {
    LIST: "/mentor/courses",
    CREATE: "/mentor/courses",
    UPDATE: (id: string) => `/mentor/courses/${id}`,
    DELETE: (id: string) => `/mentor/courses/${id}`,
    PUBLISH: (id: string) => `/mentor/courses/${id}/publish`
  },
  COURSES: {
    BROWSE: "/courses",
    DETAIL: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
    PROGRESS: (id: string) => `/courses/${id}/progress`,
    MY_ENROLLMENTS: "/courses/me/enrollments"
  }
} as const
