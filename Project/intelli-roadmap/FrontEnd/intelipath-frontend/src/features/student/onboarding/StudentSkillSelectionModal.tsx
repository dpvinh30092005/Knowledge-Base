import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { isUuid } from '@/lib/utils'
import { getSkillErrorMessage, studentDashboardService } from '../services'
import type { SkillItem } from '../types'
import { useChipFlight } from './useChipFlight'
import OnboardingShell from './OnboardingShell'
import { rememberJustMarkedNodes } from '../roadmap/justMarkedNodes'

interface StudentSkillSelectionModalProps {
  isOpen: boolean
  onComplete: () => void
  onBack?: () => void
}

const STEP_LABELS = ['Personal', 'Academic', 'Skills', 'Assessment']
const ALL = 'All'
const UNCATEGORISED = 'Other'

export default function StudentSkillSelectionModal({
  isOpen,
  onComplete,
  onBack,
}: StudentSkillSelectionModalProps) {
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [searchResults, setSearchResults] = useState<SkillItem[]>([])
  const [hasSkillCatalog, setHasSkillCatalog] = useState(false)
  const [selected, setSelected] = useState<SkillItem[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const takeOff = useChipFlight()

  useEffect(() => {
    if (!isOpen) return

    studentDashboardService.getSkills()
      .then(({ selectedSkills, skills: availableSkills }) => {
        setError('')
        setQuery('')
        setSelected(selectedSkills)
        setSkills(availableSkills)
        setHasSkillCatalog(availableSkills.length > 0)
      })
      .catch((requestError) => {
        setSkills([])
        setError(getSkillErrorMessage(requestError))
      })
      .finally(() => setIsLoading(false))
  }, [isOpen])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!isOpen || hasSkillCatalog || !normalizedQuery) return

    let active = true
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await studentDashboardService.searchSkills(normalizedQuery)
        if (!active) return
        setSearchResults(results)
        setError('')
      } catch (requestError) {
        if (!active) return
        setSearchResults([])
        setError(getSkillErrorMessage(requestError))
      } finally {
        if (active) setIsSearching(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [hasSkillCatalog, isOpen, query])

  const source = hasSkillCatalog ? skills : searchResults
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.skillId)), [selected])

  const categories = useMemo(() => {
    const names = new Set<string>()
    source.forEach((skill) => names.add(skill.category?.trim() || UNCATEGORISED))
    return [ALL, ...[...names].sort((a, b) => a.localeCompare(b))]
  }, [source])

  /**
   * Grouped by category rather than one flat wall of chips. The catalog runs to several
   * hundred skills, and a student scanning it for "the React one" has no landmarks in an
   * undifferentiated blob — the career step in this same flow already groups this way.
   *
   * Picked skills are removed from here: they live in the tray on the other side, and a
   * skill shown ticked in one column while also sitting in the other reads as two copies
   * of the same thing.
   */
  const groups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const matching = source.filter((skill) => {
      if (selectedIds.has(skill.skillId)) return false
      const inCategory = category === ALL || (skill.category?.trim() || UNCATEGORISED) === category
      const matchesQuery =
        !normalizedQuery || skill.skillName.toLocaleLowerCase().includes(normalizedQuery)
      return inCategory && matchesQuery
    })

    const byCategory = new Map<string, SkillItem[]>()
    matching.forEach((skill) => {
      const key = skill.category?.trim() || UNCATEGORISED
      byCategory.set(key, [...(byCategory.get(key) ?? []), skill])
    })

    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({
        name,
        items: [...items].sort((a, b) => a.skillName.localeCompare(b.skillName)),
      }))
  }, [category, query, selectedIds, source])

  const matchCount = groups.reduce((total, group) => total + group.items.length, 0)

  const toggleSkill = (skill: SkillItem) =>
    setSelected((current) =>
      current.some((s) => s.skillId === skill.skillId)
        ? current.filter((s) => s.skillId !== skill.skillId)
        : [...current, skill],
    )

  const handleSave = async () => {
    const uniqueSkillIds = [...new Set(selected.map((s) => s.skillId))]
    if (uniqueSkillIds.length === 0) {
      setError('Select at least one skill.')
      return
    }
    if (uniqueSkillIds.some((skillId) => !isUuid(skillId))) {
      setError('One or more selected skills have an invalid ID.')
      return
    }

    setError('')
    setIsSaving(true)
    try {
      const { selectedSkills, markedNodeIds } = await studentDashboardService.selectSkillsWithMarks(uniqueSkillIds)
      setSelected(selectedSkills)
      // What the student just told us they know, the roadmap should stop asking
      // them to learn. Handed to the canvas so it can show those nodes being
      // ticked instead of quietly already being ticked when they arrive.
      rememberJustMarkedNodes(markedNodeIds, 'skills')
      onComplete()
    } catch (requestError) {
      setError(getSkillErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = selectedIds.size
  const busy = isLoading || isSearching

  // The list is what you browse; the search box and the chips you have already picked
  // are what you steer it with. Splitting them means picking a skill near the bottom
  // of a long category never scrolls the search box out of reach.
  const skillList = (
    <div className="flex h-full flex-col py-5">
      {/* No card chrome of its own: this pane is already the tinted, ruled-off half of the
          dialog, and boxing it again would be a border inside a border. */}
      <div className="min-h-52 pr-1">
      {busy ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-2 text-[13px] text-slate-400">
          <Spinner size={24} className="text-slate-900" label="Loading skills" />
          <span>Loading skills…</span>
        </div>
      ) : matchCount === 0 ? (
        <div className="flex min-h-44 items-center justify-center px-4 text-center text-[14px] font-medium text-slate-400">
          {query.trim() ? `No skills found for “${query.trim()}”.` : 'No skills available.'}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.name}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <button
                    key={skill.skillId}
                    type="button"
                    data-chip-id={skill.skillId}
                    onClick={(event) => {
                      takeOff(event.currentTarget, skill.skillId)
                      toggleSkill(skill)
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-slate-900 hover:ring-slate-300"
                  >
                    {skill.skillName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      title="Select your current skills"
      subtitle="Pick what you can already do. Your roadmap starts from there instead of the beginning."
      error={error}
      aside={skillList}
      onBack={onBack}
      onNext={handleSave}
      nextLabel={
        isSaving
          ? 'Saving…'
          : selectedCount > 0
            ? `Save ${selectedCount} skill${selectedCount > 1 ? 's' : ''}`
            : 'Save'
      }
      nextLoading={isSaving}
      nextDisabled={isLoading}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={17}
        />
        <input
          id="skill-search"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            if (!nextQuery.trim()) setIsSearching(false)
          }}
          placeholder="Search skills by name…"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {categories.length > 2 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                category === name
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Below the controls, not above them. The tray is the result of searching, and
          putting it first meant every skill picked pushed the search box further down the
          pane — the thing you steer with kept retreating from the thing you steer. */}
      {selectedCount > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-slate-900">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-[12px] font-semibold text-slate-500 transition-colors hover:text-rose-600"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((skill) => (
              <button
                key={skill.skillId}
                type="button"
                data-chip-id={skill.skillId}
                onClick={(event) => {
                  takeOff(event.currentTarget, skill.skillId)
                  toggleSkill(skill)
                }}
                title={`Remove ${skill.skillName}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 py-1.5 pl-3 pr-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {skill.skillName}
                <X size={12} strokeWidth={3} />
              </button>
            ))}
          </div>
        </div>
      )}
    </OnboardingShell>
  )
}
