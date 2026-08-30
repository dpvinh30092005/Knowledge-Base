import { useEffect, useMemo, useState } from "react"
import { Check, GraduationCap, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui"
import roadmapApi from "@/api/roadmapApi"
import { toast } from "@/lib/toast"

/** FLM subject names are "English_Tiếng Việt"; show only the English half. */
const enName = (name: string) => (name || "").split("_")[0].trim() || name

/** One FPT subject as returned by GET /students/me/fpt-subjects. */
interface FptSubject {
  code: string
  name: string
  semester: number | null
  credits: number | null
  prerequisite?: string | null
  skills: string[]
  status: string | null
  source: string | null
}

/** One selectable curriculum version (cohort/program). */
interface CurriculumOption {
  id: string
  code: string
  program: string | null
  cohort: number | null
  batch: string | null
}

interface FptCurriculumPanelProps {
  open: boolean
  onClose: () => void
  /** Fired after subjects are saved so the parent can reload the graph + recommendations. */
  onApplied?: () => void
}

type FilterMode = "all" | "skills"

/**
 * Right-docked panel (fades into the background like the node-detail panel) that lets a
 * student declare which FPT subjects they've completed. Saving seeds transcript evidence
 * on the backend, which regenerates roadmap recommendations and lights up "learn at FPT"
 * coverage on the affected nodes.
 */
const FptCurriculumPanel = ({ open, onClose, onApplied }: FptCurriculumPanelProps) => {
  const [subjects, setSubjects] = useState<FptSubject[]>([])
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [initialPassed, setInitialPassed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")
  const [curriculumLabel, setCurriculumLabel] = useState<string | null>(null)
  const [curriculumId, setCurriculumId] = useState<string | null>(null)
  const [curricula, setCurricula] = useState<CurriculumOption[]>([])
  const [switching, setSwitching] = useState(false)

  const applyResponse = (data: {
    subjects?: FptSubject[]
    curriculumId?: string | null
    curriculumLabel?: string | null
    availableCurricula?: CurriculumOption[]
  }) => {
    const list: FptSubject[] = Array.isArray(data?.subjects) ? data.subjects : []
    setSubjects(list)
    const declared = new Set(list.filter(s => s.status === "PASSED").map(s => s.code))
    setPassed(new Set(declared))
    setInitialPassed(new Set(declared))
    setCurriculumId(data?.curriculumId ?? null)
    setCurriculumLabel(data?.curriculumLabel ?? null)
    setCurricula(Array.isArray(data?.availableCurricula) ? data.availableCurricula : [])
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await roadmapApi.getFptSubjects()
      applyResponse(res.data)
    } catch (error) {
      console.error("[FPT Curriculum] Failed to load subjects:", error)
      toast.error("Couldn't load your FPT subjects.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && subjects.length === 0) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const hasSemesters = useMemo(() => subjects.some(s => typeof s.semester === "number"), [subjects])
  const maxTerm = useMemo(
    () => subjects.reduce((m, s) => (typeof s.semester === "number" && s.semester > m ? s.semester : m), 0),
    [subjects],
  )
  const dirtyCount = useMemo(() => {
    let n = 0
    subjects.forEach(s => { if (passed.has(s.code) !== initialPassed.has(s.code)) n++ })
    return n
  }, [subjects, passed, initialPassed])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subjects.filter(s => {
      if (filter === "skills" && s.skills.length === 0) return false
      if (!q) return true
      return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    })
  }, [subjects, search, filter])

  const skillsTotal = useMemo(() => subjects.filter(s => s.skills.length > 0).length, [subjects])

  const toggle = (code: string) => {
    setPassed(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const selectAllVisible = () => setPassed(prev => {
    const next = new Set(prev)
    visible.forEach(s => next.add(s.code))
    return next
  })

  const clearVisible = () => setPassed(prev => {
    const next = new Set(prev)
    visible.forEach(s => next.delete(s.code))
    return next
  })

  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)

  const applyTerm = (term: number) => {
    setSelectedTerm(term)
    setPassed(prev => {
      const next = new Set(prev)
      subjects.forEach(s => { if (typeof s.semester === "number" && s.semester <= term) next.add(s.code) })
      return next
    })
  }

  const save = async () => {
    if (saving || dirtyCount === 0) return
    setSaving(true)
    try {
      const changes = subjects
        .filter(s => passed.has(s.code) !== initialPassed.has(s.code))
        .map(s => ({ subjectCode: s.code, passed: passed.has(s.code) }))
      const res = await roadmapApi.updateFptSubjects(changes)
      applyResponse(res.data)
      const recs = Array.isArray(res.data?.recommendations) ? res.data.recommendations.length : 0
      toast.success(recs > 0
        ? `Saved — ${recs} node${recs > 1 ? "s" : ""} can be completed from your courses.`
        : "Saved your completed courses.")
      onApplied?.()
    } catch (error) {
      console.error("[FPT Curriculum] Failed to save subjects:", error)
      toast.error("Couldn't save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const changeCurriculum = async (id: string) => {
    if (!id || id === curriculumId || switching) return
    setSwitching(true)
    try {
      const res = await roadmapApi.setCurriculum(id)
      applyResponse(res.data)
      toast.success("Curriculum updated.")
      onApplied?.()
    } catch (error) {
      console.error("[FPT Curriculum] Failed to switch curriculum:", error)
      toast.error("Couldn't switch curriculum.")
    } finally {
      setSwitching(false)
    }
  }

  const optionLabel = (c: CurriculumOption) => {
    const cohort = c.cohort != null ? `K${c.cohort}${c.batch ?? ""}` : ""
    return [c.program, cohort].filter(Boolean).join(" • ") || c.code
  }

  if (!open) return null

  const passedCount = passed.size

  return (
    <div className="fpt-panel pointer-events-none absolute inset-y-0 right-0 z-40 flex w-[380px] max-w-[calc(100%-1rem)] flex-col bg-gradient-to-l from-slate-50 via-slate-50/85 to-transparent pl-14 pr-4 pt-5">
      <style>{`@keyframes fptIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}.fpt-panel{animation:fptIn .2s ease-out}`}</style>
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col">

        {/* Header */}
        <div className="flex items-start gap-2.5 pb-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
            <GraduationCap size={18} weight="fill" />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold tracking-tight text-slate-900">Courses taken at FPT</p>
            <p className="text-[11px] text-slate-500">Tick what you've passed — we credit the skills you already have.</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="-mr-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-800"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Curriculum (cohort/program) selector */}
        {curricula.length > 0 && (
          <div className="pb-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Your curriculum</p>
            <div className="relative">
              <select
                value={curriculumId ?? ""}
                onChange={e => changeCurriculum(e.target.value)}
                disabled={switching}
                className="w-full appearance-none rounded-xl border border-slate-200/80 bg-white/80 py-2 pl-3 pr-8 text-[13px] font-semibold text-slate-800 outline-none transition-colors focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              >
                {curricula.map(c => (
                  <option key={c.id} value={c.id}>{optionLabel(c)} — {c.code}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
            </div>
            {curriculumLabel && (
              <p className="mt-1 text-[11px] text-slate-500">Auto-matched from your admission year — change it if your cohort differs.</p>
            )}
          </div>
        )}

        {/* Term quick-select */}
        {hasSemesters && (
          <div className="pb-3">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Completed through term</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: maxTerm }, (_, i) => i + 1).map(term => {
                const isSelected = selectedTerm === term
                const isIncluded = selectedTerm !== null && term < selectedTerm
                return (
                  <button
                    key={term}
                    onClick={() => applyTerm(term)}
                    className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors ${
                      isSelected
                        ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                        : isIncluded
                          ? "border-orange-200 bg-orange-50 text-orange-700"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    Term {term}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-2 pb-2.5">
          <div className="relative">
            <MagnifyingGlass size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or name…"
              className="w-full rounded-xl border border-slate-200/80 bg-white/80 py-2 pl-9 pr-3 text-[13px] text-slate-800 outline-none backdrop-blur-sm transition-colors focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-0.5 rounded-lg bg-slate-200/60 p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${filter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                All {subjects.length}
              </button>
              <button
                onClick={() => setFilter("skills")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${filter === "skills" ? "bg-white text-orange-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Sparkle size={10} weight="fill" /> Skills {skillsTotal}
              </button>
            </div>
            <div className="flex items-center text-[11px] font-semibold">
              <button onClick={selectAllVisible} className="rounded-md px-1.5 py-1 text-orange-600 hover:bg-orange-50">Select all</button>
              <span className="text-slate-300">·</span>
              <button onClick={clearVisible} className="rounded-md px-1.5 py-1 text-slate-500 hover:bg-slate-200/60">Clear</button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="-mr-1 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col gap-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-[12.5px] text-slate-400">No subjects match.</p>
          ) : (
            <div className="flex flex-col">
              {visible.map(s => {
                const isOn = passed.has(s.code)
                return (
                  <button
                    key={s.code}
                    onClick={() => toggle(s.code)}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-200/40"
                  >
                    <span className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border-2 transition-colors ${isOn ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300"}`}>
                      {isOn && <Check size={11} weight="bold" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={`text-[13px] font-bold ${isOn ? "text-orange-700" : "text-slate-800"}`}>{s.code}</span>
                        {s.credits != null && <span className="text-[10px] font-semibold text-slate-400">{s.credits} cr</span>}
                      </span>
                      <span className="block truncate text-[11.5px] text-slate-500">{enName(s.name)}</span>
                      {s.skills.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {s.skills.map(sk => (
                            <span key={sk} className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">{sk}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 pb-4">
          <span className="text-[12px] text-slate-500">
            <span className="text-[15px] font-extrabold text-slate-900">{passedCount}</span> selected
            {dirtyCount > 0 && <span className="ml-1.5 text-orange-600">· {dirtyCount} change{dirtyCount > 1 ? "s" : ""}</span>}
          </span>
          <button
            onClick={save}
            disabled={saving || dirtyCount === 0}
            className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 px-6 py-2.5 text-[13.5px] font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FptCurriculumPanel
