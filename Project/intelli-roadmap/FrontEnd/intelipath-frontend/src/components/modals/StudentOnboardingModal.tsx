import BaseModal from "./BaseModal"
import { DatePicker, Select } from "@/components"
import {
  User,
  Mail,
  Calendar,
  Book,
  Building2,
  GraduationCap,
  ArrowRight,
} from "lucide-react"
import { useStudentOnboarding } from "@/hooks/useStudentOnboarding"

interface StudentOnboardingModalProps {
  isOpen: boolean
  onClose?: () => void
}

export default function StudentOnboardingModal({
  isOpen,
  onClose
}: StudentOnboardingModalProps) {
  const {
    user,
    fullName,
    setFullName,
    yob,
    setyob,
    bio,
    setBio,
    university,
    setUniversity,
    admissionDate,
    setAdmissionDate,
    major,
    isSaving,
    errors,
    step,
    setStep,
    handleNext,
    handleSave,
    handleClose
  } = useStudentOnboarding(isOpen, onClose)

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} hideCloseButton={true}>
      <div className="p-8 sm:p-10 text-slate-900 w-full max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 mb-8">
          <div className="mb-2 flex items-center select-none">
            <span className="font-display text-3xl font-bold tracking-tight text-slate-900">
              Inteli
              <span className="bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
                Path
              </span>
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              {step === 1
                ? "Complete Personal Information"
                : "Academic Details"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {step === 1
                ? "Lock-in credentials to personalize your cockpit"
                : "Help us tailor your learning experience"}
            </p>
          </div>
        </div>

        {errors.general && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {errors.general}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <User className="w-3.5 h-3.5 text-brand-blue" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder-slate-400 shadow-sm"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <span className="text-rose-400 text-xs font-medium pl-1 leading-none">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-brand-blue" />
                  Auth Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                Year of Birth
              </label>
              <DatePicker
                value={yob ?? ''}
                onChange={(val) => setyob(val)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Book className="w-3.5 h-3.5 text-brand-blue" />
                Bio / About Yourself
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder-slate-400 resize-none shadow-sm"
                placeholder="Tell us a little bit about yourself..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder-slate-400 shadow-sm"
                placeholder="Enter your university name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                  Admission Date
                </label>
                <DatePicker
                  value={admissionDate ?? ''}
                  onChange={(val) => setAdmissionDate(val)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-blue" />
                  Major <span className="text-rose-500">*</span>
                </label>
                <Select value={major} disabled className="rounded-xl">
                  <option value="Software Engineering">Software Engineering</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center gap-4">
          <div className="flex gap-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-brand-cyan" : "w-2 bg-slate-200"}`}
            ></div>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-brand-cyan" : "w-2 bg-slate-200"}`}
            ></div>
          </div>

          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}

            {step === 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-electric to-brand-cyan hover:brightness-110 shadow-lg shadow-brand-cyan/20 transition-all flex items-center gap-2 group"
              >
                Next Step
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-electric to-brand-cyan hover:brightness-110 shadow-lg shadow-brand-cyan/20 transition-all flex items-center gap-2 group"
              >
                {isSaving ? "Saving..." : "Saving Information"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  )
}
