export const ROUTES = {
  HOME: '/',
  WELCOME_DEMO: '/welcome-demo',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OAUTH_CALLBACK: '/auth/callback',
  // Dedicated GitHub "Connect for repo sync" callback (account linking, not login).
  GITHUB_LINK_CALLBACK: '/github/callback',
  // Two addresses for one portfolio, split by who is looking:
  // /portfolio/<slug> is the internal view, for signed-in staff and students.
  // /p/<slug> is the link a student shares with the outside world.
  PUBLIC_PORTFOLIO: '/p/:slug',
  PORTFOLIO_INTERNAL: '/portfolio/:slug',
  DASHBOARD: '/dashboard',
  DASHBOARD_STUDENT: '/dashboard/student',
  DASHBOARD_STUDENT_ROADMAP: '/dashboard/student/roadmap',
  DASHBOARD_STUDENT_MARKET_PULSE: '/dashboard/student/market-pulse',
  AI_MENTOR: '/dashboard/student/ai-mentor',
  DASHBOARD_STUDENT_PORTFOLIO: '/dashboard/student/portfolio',
  DASHBOARD_STUDENT_COURSES: '/dashboard/student/courses',
  DASHBOARD_STUDENT_FEEDBACK: '/dashboard/student/feedback',
  DASHBOARD_STUDENT_SETTINGS: '/dashboard/student/settings',
  DASHBOARD_COUNSELOR: '/dashboard/counselor',
  COUNSELOR_FEEDBACK: "/dashboard/counselor/feedback",
  COUNSELOR_ADD_STUDENT: "/dashboard/counselor/add-student",
  DASHBOARD_MENTOR: '/dashboard/mentor',
  DASHBOARD_MENTOR_STUDENTS: '/dashboard/mentor/students',
  DASHBOARD_MENTOR_FEEDBACK: '/dashboard/mentor/feedback',
  DASHBOARD_MENTOR_ROADMAP_EDITOR: '/dashboard/mentor/roadmap-editor',
  DASHBOARD_MENTOR_SETTINGS: '/dashboard/mentor/settings',
  DASHBOARD_ADMIN: '/dashboard/admin',
  PROFILE_SETTINGS: "/profile-settings",
  MENTOR_SETTINGS: "/dashboard/mentor/settings",
  COUNSELOR_SETTINGS: "/dashboard/counselor/settings"
} as const

export const ROLES = {
  STUDENT: "STUDENT",
  COUNSELOR: "COUNSELOR",
  MENTOR: "MENTOR",
  ADMIN: "ADMIN"
} as const

export type Role = keyof typeof ROLES
