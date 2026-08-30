import { Routes, Route, Navigate } from "react-router-dom"
import {
  WelcomePage,
  RegisterPage,
  ResetPasswordPage,
  DashboardPage,
  StudentDashboardPage,
  StudentRoadmapPage,
  AIMentorPage,
  CounselorDashboardPage,
  CounselorFeedbackPage,
  CounselorAddStudentPage,
  MentorDashboardPage,
  AdminDashboardPage,
  OAuthCallbackPage,
  NotFoundPage,
  ProfileSettingsPage,
  MentorProfileSettingsPage,
  CounselorProfileSettingsPage,
  StudentPortfolioPage,
  StudentCoursesPage,
  MentorStudentsPage,
  MentorFeedbackPage,
  MentorPortfolioPage,
  StudentFeedbackPage,
  StudentProfileSettingsPage,
  PublicPortfolioPage,
  StudentMarketPulsePage
} from "@/pages"
import { ProtectedRoute, GuestRoute } from "@/app/router"
import { GithubLinkCallback } from "@/features/shared/portfolio/components/GithubLinkCallback"
import { ROLES, ROUTES } from "@/shared"

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.HOME}
        element={
          <GuestRoute>
            <WelcomePage />
          </GuestRoute>
        }
      />
      <Route path={ROUTES.PUBLIC_PORTFOLIO} element={<PublicPortfolioPage />} />

      {/* Login is a popup on the landing page now (LoginDialog), not a page.
          The path stays as a redirect because logout and other flows still
          navigate(ROUTES.LOGIN) — without it they would land on 404. */}
      {/* <Route path={ROUTES.LOGIN} element={<GuestRoute><LoginPage /></GuestRoute>} /> */}
      <Route
        path={ROUTES.LOGIN}
        element={<Navigate to={ROUTES.HOME} replace />}
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      {/* Forgot password is a view inside the login popup now, not a page.
          The path stays as a redirect so any old link / navigate lands home. */}
      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={<Navigate to={ROUTES.HOME} replace />}
      />
      <Route
        path={ROUTES.RESET_PASSWORD}
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.OAUTH_CALLBACK}
        element={
          <GuestRoute>
            <OAuthCallbackPage />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.GITHUB_LINK_CALLBACK}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <GithubLinkCallback />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_ROADMAP}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentRoadmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_MENTOR}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <AIMentorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_MARKET_PULSE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentMarketPulsePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_COURSES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_PORTFOLIO}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.MENTOR]}>
            <StudentPortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_STUDENT_FEEDBACK}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentFeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_COUNSELOR}
        element={
          <ProtectedRoute allowedRoles={[ROLES.COUNSELOR]}>
            <CounselorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.COUNSELOR_FEEDBACK}
        element={
          <ProtectedRoute allowedRoles={[ROLES.COUNSELOR]}>
            <CounselorFeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.COUNSELOR_ADD_STUDENT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.COUNSELOR]}>
            <CounselorAddStudentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_MENTOR}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_MENTOR_STUDENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_MENTOR_FEEDBACK}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorFeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PORTFOLIO_INTERNAL}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorPortfolioPage />
          </ProtectedRoute>
        }
      />
      {/* Roadmap Editor route intentionally unmounted — hidden from the mentor for now.
          MentorRoadmapEditorPage/View + roadmapEditorApi are kept for a later return. */}
      <Route
        path={ROUTES.DASHBOARD_MENTOR_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DASHBOARD_ADMIN}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.AI_MENTOR}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <AIMentorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <ProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.COUNSELOR_SETTINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.COUNSELOR]}>
            <CounselorProfileSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 — catch all unmatched routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
