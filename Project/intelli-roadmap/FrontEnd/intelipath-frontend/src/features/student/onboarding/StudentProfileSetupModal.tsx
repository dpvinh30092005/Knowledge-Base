import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Info, Search } from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'
import { useAuth } from '@/context'
import { getErrorMessage, isUuid, formatPrerequisite } from '@/lib/utils'
import { studentDashboardService } from '../services'
import type { CareerRole } from '../types'
import { useHorizontalWheelScroll } from '@/hooks/useHorizontalWheelScroll'
import OnboardingShell from './OnboardingShell'

interface StudentProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

interface FormErrors {
  fullName?: string
  yob?: string
  university?: string
  admissionDate?: string
  major?: string
  careerId?: string
  general?: string
}

const STEP_LABELS = ['Personal', 'Academic', 'Skills', 'Assessment']

export default function StudentProfileSetupModal({
  isOpen,
  onComplete,
}: StudentProfileSetupModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [yob, setYob] = useState('')
  const [bio, setBio] = useState('')
  const [university, setUniversity] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')
  const [major, setMajor] = useState('Software Engineering')
  const [careers, setCareers] = useState<CareerRole[]>([])
  const [careerId, setCareerId] = useState('')
  const [careerSearch, setCareerSearch] = useState('')
  const [careerCategory, setCareerCategory] = useState('All')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoadingCareers, setIsLoadingCareers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const careerCategoryRef = useHorizontalWheelScroll()

  const careerGroups = useMemo(() => {
    const groups = new Map<string, CareerRole[]>()
    careers.forEach((career) => {
      const category = getCareerCategory(career)
      groups.set(category, [...(groups.get(category) ?? []), career])
    })

    return [...groups.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([category, items]) => ({ category, items }))
  }, [careers])

  const careerCategories = useMemo(
    () => ['All', ...careerGroups.map((group) => group.category)],
    [careerGroups],
  )

  const filteredCareerGroups = useMemo(() => {
    const query = careerSearch.trim().toLowerCase()

    return careerGroups
      .filter((group) => careerCategory === 'All' || group.category === careerCategory)
      .map((group) => ({
        ...group,
        items: group.items.filter((career) => {
          const searchable = [
            career.careerName,
            career.prerequisite,
            career.description,
            group.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return !query || searchable.includes(query)
        }),
      }))
      .filter((group) => group.items.length > 0)
  }, [careerCategory, careerGroups, careerSearch])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    setIsLoadingCareers(true)
    studentDashboardService.getCareerRoles()
      .then((nextCareers) => {
        if (!active) return
        setCareers(nextCareers)
        setErrors((current) => ({ ...current, general: undefined }))
      })
      .catch((requestError) => {
        if (!active) return
        setCareers([])
        setErrors((current) => ({
          ...current,
          general: getErrorMessage(requestError)
        }))
      })
      .finally(() => {
        if (active) setIsLoadingCareers(false)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  const goToAcademicStep = () => {
    const nextErrors: FormErrors = {}

    if (!fullName.trim()) {
      nextErrors.fullName = 'Enter your full name to continue.'
    }

    if (!yob) {
      nextErrors.yob = 'Select your date of birth.'
    } else {
      const birthDate = new Date(yob)
      const today = new Date()
      if (birthDate >= today) {
        nextErrors.yob = 'Date of birth cannot be in the future.'
      } else if (today.getFullYear() - birthDate.getFullYear() < 10) {
        nextErrors.yob = 'You must be at least 10 years old.'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setStep(2)
  }

  const goToProfileStep = () => {
    setErrors({})
    setStep(1)
  }

  const handleSave = async () => {
    const nextErrors: FormErrors = {}
    if (!university.trim()) {
      nextErrors.university = 'Enter your university.'
    }
    if (!admissionDate) {
      nextErrors.admissionDate = 'Select your admission date.'
    } else if (yob) {
      const birthDate = new Date(yob)
      const parsed = new Date(admissionDate)
      if (parsed > new Date()) {
        nextErrors.admissionDate = 'Admission date cannot be in the future.'
      } else if (parsed <= birthDate) {
        nextErrors.admissionDate = 'Admission date must be after your date of birth.'
      } else if (parsed.getFullYear() - birthDate.getFullYear() < 10) {
        nextErrors.admissionDate = 'Admission date seems too early based on your age.'
      }
    }

    if (!major.trim()) nextErrors.major = 'Enter your major.'
    if (!isUuid(careerId)) nextErrors.careerId = 'Select a valid target career from the list.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    try {
      await Promise.all([
        studentDashboardService.updateUserProfile({
          fullName: fullName.trim(),
          yob,
          bio: bio.trim(),
        }),
        studentDashboardService.updateStudentProfile({
          university: university.trim(),
          admissionDate,
          major: major.trim(),
          careerId,
        })
      ])
      onComplete()
    } catch (requestError) {
      setErrors({ general: getErrorMessage(requestError) })
    } finally {
      setIsSaving(false)
    }
  }

  // The career list is long and is browsed, not typed into. Kept beside the short
  // academic fields rather than under them, so choosing a career never pushes the
  // university and major fields off the top of the card.
  const careerPane = (
    <div className="flex h-full flex-col md:py-5">
          <Field label="Target career" required error={errors.careerId}>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={careerSearch}
                disabled={isLoadingCareers}
                onChange={(event) => setCareerSearch(event.target.value)}
                placeholder={isLoadingCareers ? 'Loading careers…' : 'Search by role or keyword'}
                className={`${inputClass} pl-11`}
              />
            </div>

            {/* One row, scrolled sideways with the wheel. Wrapping instead would push the
                career list down every time a category is added. */}
            <div
              ref={careerCategoryRef}
              className="mb-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
            >
              {careerCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCareerCategory(category)}
                  className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    careerCategory === category
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-4 pr-1">
              {filteredCareerGroups.length > 0 ? (
                filteredCareerGroups.map((group) => (
                  <div key={group.category}>
                    <p className="mb-2 pl-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {group.category}
                    </p>
                    <div className="grid gap-2.5">
                      {group.items.map((career) => {
                        const isSelected = careerId === career.careerId

                        return (
                          <button
                            key={career.careerId}
                            type="button"
                            onClick={() => {
                              setCareerId(career.careerId)
                              setErrors((current) => ({ ...current, careerId: undefined }))
                            }}
                            className={`rounded-2xl p-4 text-left transition-all duration-200 ring-1 ${
                              isSelected
                                ? 'bg-slate-950 ring-slate-950'
                                : 'bg-white ring-slate-200 hover:ring-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className={`text-[14.5px] font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {career.careerName}
                              </span>
                              {isSelected && (
                                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                                  Selected
                                </span>
                              )}
                            </div>
                            <span className={`line-clamp-2 block text-[12.5px] leading-relaxed ${isSelected ? 'text-white/75' : 'text-slate-500'}`}>
                              {formatPrerequisite(career.prerequisite) || career.description || 'Career roadmap from backend data.'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-[14px] font-medium text-slate-400">
                  {isLoadingCareers ? 'Loading careers…' : 'No careers match your filters.'}
                </div>
              )}
            </div>
          </Field>
    </div>
  )

  if (!isOpen) return null

  const isPersonal = step === 1

  return (
    <OnboardingShell
      step={step}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      title={isPersonal ? 'Tell us about yourself' : 'Add your academic details'}
      subtitle={
        isPersonal
          ? 'We use this information to personalize your roadmap.'
          : 'This helps us recommend relevant skills and milestones.'
      }
      error={errors.general}
      aside={isPersonal ? undefined : careerPane}
      onBack={isPersonal ? undefined : goToProfileStep}
      onNext={isPersonal ? goToAcademicStep : handleSave}
      nextLabel={isSaving ? 'Saving…' : isPersonal ? 'Continue' : 'Save & continue'}
      nextLoading={isSaving}
    >
      {isPersonal ? (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Field label="Full name" required error={errors.fullName}>
              <input
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value)
                  setErrors((current) => ({ ...current, fullName: undefined }))
                }}
                placeholder="Enter your full name"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Email" hint="From your account">
            <input
              value={user?.email || ''}
              disabled
              className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`}
            />
          </Field>

          <Field label="Date of birth" required error={errors.yob}>
            <DatePicker
              value={yob}
              onChange={(val) => {
                setYob(val)
                setErrors((current) => ({ ...current, yob: undefined }))
              }}
              pastOnly
              placeholder="Select date of birth"
            />
          </Field>

          <div>
            <Field label="Bio" hint={`${bio.length}/300 · Optional`}>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value.slice(0, 300))}
                rows={3}
                placeholder="Share your interests, goals, or learning experience."
                className={`${inputClass} h-auto resize-none py-3 leading-relaxed`}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Field label="University" required error={errors.university}>
              <input
                type="text"
                value={university}
                placeholder="e.g. FPT University"
                onChange={(event) => {
                  setUniversity(event.target.value)
                  setErrors((current) => ({ ...current, university: undefined }))
                }}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Admission date" required error={errors.admissionDate}>
            <DatePicker
              value={admissionDate}
              onChange={(value) => {
                setAdmissionDate(value)
                setErrors((current) => ({ ...current, admissionDate: undefined }))
              }}
            />
          </Field>

          <Field label="Major" required error={errors.major}>
            <input
              value={major}
              onChange={(event) => {
                setMajor(event.target.value)
                setErrors((current) => ({ ...current, major: undefined }))
              }}
              placeholder="Enter your major"
              className={inputClass}
            />
          </Field>


          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
            <Info className="mt-0.5 shrink-0 text-slate-700" size={16} />
            You can update these details later from your profile settings.
          </div>
        </div>
      )}
    </OnboardingShell>
  )
}

const inputClass =
  'w-full h-12 px-4 bg-white rounded-xl border border-slate-200 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed'

function getCareerCategory(career: CareerRole) {
  const text = `${career.careerName} ${career.prerequisite ?? ''} ${career.description ?? ''}`.toLowerCase()

  if (/(ai|machine learning|data|analyst|analytics|scientist)/.test(text)) return 'Data & AI'
  if (/(security|cyber|devops|cloud|network|system)/.test(text)) return 'Infrastructure'
  if (/(ui|ux|design|product|business|manager|marketing)/.test(text)) return 'Product & Design'
  if (/(mobile|android|ios|flutter|react native)/.test(text)) return 'Mobile'
  if (/(backend|java|spring|node|api|database)/.test(text)) return 'Backend'
  if (/(frontend|front-end|react|css|html|javascript|typescript|web)/.test(text)) return 'Frontend'

  return 'General'
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-[13px] font-semibold text-slate-800">
        <span>
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[11.5px] font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12px] font-medium text-rose-600">{error}</span>}
    </label>
  )
}
