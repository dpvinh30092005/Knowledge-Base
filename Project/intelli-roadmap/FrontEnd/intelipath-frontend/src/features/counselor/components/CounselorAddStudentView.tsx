import React from "react"
import { NavLink } from "react-router-dom"
import {
  UserPlus,
  Users,
  LayoutDashboard,
  MessageSquare,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  FileSpreadsheet,
  Upload,
  X,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  BookOpen,
  FileText,
  Briefcase
} from "lucide-react"
import {
  UserHeaderActions,
  Logo,
  SharedAppBackground,
  DatePicker
} from "@/components"
import { ROUTES } from "@/shared"
import { useCounselorAddStudent } from "../hooks/useCounselorAddStudent"

// ─── Nav Items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: ROUTES.DASHBOARD_COUNSELOR },

  { label: "View Student", icon: MessageSquare, to: ROUTES.COUNSELOR_FEEDBACK },

  { label: "Add Student", icon: UserPlus, to: ROUTES.COUNSELOR_ADD_STUDENT }
]

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CounselorAddStudentView() {
  const {
    user,
    form,
    errors,
    isSubmitting,
    isImportModalOpen,
    successMsg,
    addedStudents,
    editingDraftId,
    curriculums,
    setIsImportModalOpen,
    handleChange,
    handleSubmit,
    handleLogout,
    handleDeleteDraft,
    handleEditDraft,
    cancelEdit,
    handleFileUpload,
    handleSubmitAllToSystem
  } = useCounselorAddStudent()

  const [curriculumOpen, setCurriculumOpen] = React.useState(false)

  return (
    <div className="relative min-h-screen bg-transparent font-sans pb-16">
      <SharedAppBackground />

      {/* HEADER (Glass Pill Style) */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 md:px-8 pt-6 pointer-events-none">
        <nav className="pointer-events-auto flex w-full max-w-[1400px] items-center justify-between transition-all">
          <div className="flex items-center">
            <Logo iconOnly className="scale-[0.85] origin-left" />
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-1.5 py-1.5 text-[13px] font-bold">
            <NavLink
              to={ROUTES.DASHBOARD_COUNSELOR}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink
              to={ROUTES.COUNSELOR_FEEDBACK}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <MessageSquare size={16} />
              View Student
            </NavLink>
            <NavLink
              to={ROUTES.COUNSELOR_ADD_STUDENT}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <UserPlus size={16} />
              Add Student
            </NavLink>
          </div>

          <div className="flex items-center justify-end">
            <div className="bg-white/80 backdrop-blur-md shadow-sm border border-white/60 rounded-full pr-1 pl-3 py-1 flex items-center gap-2">
              <UserHeaderActions user={user} onLogout={handleLogout} />
            </div>
          </div>
        </nav>
      </div>

      {/* ── Page Body ───────────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 pt-28 space-y-7">
        {/* Page header banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#004d4d] via-[#006060] to-[#00838f] p-8 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-[11px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            <GraduationCap size={13} />
            Counselor Workspace
          </div>
          <h1 className="text-[28px] font-black tracking-tight">
            Add New Student
          </h1>
          <p className="mt-1 text-white/70 text-[15px] max-w-lg">
            Register a new student account and link them to your counseling
            workspace.
          </p>
        </div>

        {/* ── Top card: Add form ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.07)] overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e0f2fe] flex items-center justify-center shrink-0">
              <UserPlus size={18} className="text-[#006064]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">
                Student Registration
              </h2>
              <p className="text-[12px] text-slate-500">
                Fill in the credentials to create a new student account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-7 space-y-5">
            {/* General error */}
            {errors.general && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[13px] text-rose-600 font-medium">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-[13px] text-emerald-700 font-medium">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Email */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="add-student-email"
                    type="email"
                    autoComplete="off"
                    placeholder="e.g. john@example.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-[14px] bg-slate-50/60 outline-none transition-all
                      ${
                        errors.email
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 focus:border-[#00838f] focus:ring-2 focus:ring-[#00838f]/20"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="add-student-fullname"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. John Doe"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-[14px] bg-slate-50/60 outline-none transition-all
                      ${
                        errors.fullName
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "border-slate-200 focus:border-[#00838f] focus:ring-2 focus:ring-[#00838f]/20"
                      }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Admission Date */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Admission Date <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={form.admissionDate}
                  onChange={(val) => handleChange("admissionDate", val)}
                  placeholder="Select admission date"
                />
                {errors.admissionDate && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">
                    {errors.admissionDate}
                  </p>
                )}
              </div>

              {/* Major (Disabled) */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 opacity-80">
                  Major
                </label>
                <div className="relative opacity-80">
                  <BookOpen
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="add-student-major"
                    type="text"
                    disabled
                    value={form.major || "Software Engineer"}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-100/80 text-slate-500 font-medium cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Curriculum */}
              <div className="relative">
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Curriculum <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    id="add-student-curriculum"
                    type="button"
                    onClick={() => setCurriculumOpen((o) => !o)}
                    className={`w-full flex items-center pl-10 pr-10 py-3 rounded-xl border text-[14px] bg-slate-50/60 outline-none transition-all text-left cursor-pointer
                      ${
                        errors.curriculum
                          ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : curriculumOpen
                            ? "border-[#00838f] ring-2 ring-[#00838f]/20"
                            : "border-slate-200 focus:border-[#00838f] focus:ring-2 focus:ring-[#00838f]/20"
                      }`}
                  >
                    <FileText
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <span
                      className={
                        form.curriculum ? "text-slate-800" : "text-slate-400"
                      }
                    >
                      {form.curriculum || "Select Curriculum"}
                    </span>
                    <div
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${curriculumOpen ? "rotate-180" : ""}`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </button>

                  {curriculumOpen && (
                    <>
                      {/* Click-away overlay */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setCurriculumOpen(false)}
                      />
                      <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                        <div
                          className="px-3 py-2 text-[13px] text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => {
                            handleChange("curriculum", "")
                            setCurriculumOpen(false)
                          }}
                        >
                          Select Curriculum
                        </div>
                        {curriculums.map((c) => (
                          <div
                            key={c}
                            onClick={() => {
                              handleChange("curriculum", c)
                              setCurriculumOpen(false)
                            }}
                            className={`px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-colors
                              ${
                                form.curriculum === c
                                  ? "bg-[#00838f] text-white"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {errors.curriculum && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">
                    {errors.curriculum}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!editingDraftId && (
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                  Import Excel
                </button>
              )}

              {editingDraftId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Cancel Edit
                </button>
              )}

              <button
                id="add-student-submit"
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-[#006064] hover:bg-[#004d4d] disabled:opacity-60 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl shadow transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : editingDraftId ? (
                  <CheckCircle size={15} />
                ) : (
                  <UserPlus size={15} />
                )}
                {isSubmitting
                  ? editingDraftId
                    ? "Updating..."
                    : "Creating..."
                  : editingDraftId
                    ? "Update Student"
                    : "Add Student"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Bottom card: Added students list ─────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_rgba(15,23,42,0.07)] overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
                <Users size={18} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  Recently Added Students
                </h2>
                <p className="text-[12px] text-slate-500">
                  Students registering in this session.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {addedStudents.length > 0 && (
                <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {addedStudents.length} draft
                  {addedStudents.length !== 1 && "s"}
                </span>
              )}
            </div>
          </div>

          {addedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Building2 size={26} className="text-slate-300" />
              </div>
              <p className="text-[13px] font-medium">No students added yet.</p>
              <p className="text-[12px]">
                Use the form above to register a new student.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Table header */}
              <div className="grid grid-cols-12 px-7 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <span className="col-span-1">#</span>
                <span className="col-span-3">Student</span>
                <span className="col-span-3">Email</span>
                <span className="col-span-2">Major / Date</span>
                <span className="col-span-2">Curriculum</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              {addedStudents.map((st, idx) => {
                const initials = st.fullName.slice(0, 2).toUpperCase() || "ST"
                return (
                  <div
                    key={st.id}
                    className="grid grid-cols-12 items-center px-7 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="col-span-1 text-[12px] text-slate-400 font-semibold">
                      {idx + 1}
                    </span>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e0f2fe] text-[#006064] flex items-center justify-center text-[11px] font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col truncate pr-2">
                        <span className="text-[13px] font-semibold text-slate-900 truncate">
                          {st.fullName}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5 text-[13px] text-slate-500 truncate pr-4">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{st.email}</span>
                    </div>
                    <div className="col-span-2 flex flex-col truncate pr-4">
                      <span className="text-[12px] font-medium text-slate-700 truncate">
                        {st.major}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Enroll{" "}
                        {st.admissionDate
                          ? st.admissionDate.split("-").length === 3
                            ? `${parseInt(st.admissionDate.split("-")[1])}/${parseInt(st.admissionDate.split("-")[2])}/${st.admissionDate.split("-")[0]}`
                            : st.admissionDate
                          : (st as any).yearOfAdmission || "N/A"}
                      </span>
                    </div>
                    <div className="col-span-2 text-[12px] text-slate-600 font-medium truncate pr-2">
                      {st.curriculum}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditDraft(st.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(st.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Submit All Action */}
          {addedStudents.length > 0 && (
            <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[12px] text-slate-500 font-medium">
                Review the drafts before submitting them to the system.
              </p>
              <button
                type="button"
                onClick={handleSubmitAllToSystem}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-[#00838f] hover:bg-[#006064] disabled:opacity-60 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl shadow transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                {isSubmitting ? "Creating..." : "Create Student(s)"}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* ── Import Excel Modal ───────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet size={16} className="text-emerald-700" />
                </div>
                <h3 className="font-bold text-[15px] text-slate-900">
                  Import Students
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-[#00838f]/50 transition-colors cursor-pointer group relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-50 transition-all pointer-events-none">
                  <Upload
                    size={20}
                    className="text-slate-400 group-hover:text-emerald-600"
                  />
                </div>
                <p className="text-[14px] font-bold text-slate-700 mb-1 pointer-events-none">
                  Click to upload or drag and drop
                </p>
                <p className="text-[12px] text-slate-500 pointer-events-none">
                  .xlsx, .xls or .csv (Max 5MB)
                </p>
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-[#006064] hover:bg-[#004d4d] shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
