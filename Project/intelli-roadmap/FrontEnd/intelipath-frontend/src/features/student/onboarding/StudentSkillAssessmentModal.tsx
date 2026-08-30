import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, Check, ScanSearch, Sparkles, TrendingUp } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { assessmentService, getAssessmentErrorMessage } from '../assessment'
import type {
  GradedAnswerDraft,
  GradedAssessmentPaper,
  GradedAssessmentResult,
} from '../assessment'
import GradedAssessmentForm, { emptyDraft } from './GradedAssessmentForm'
import type {
  AssessmentQuestion,
  AssessmentResult,
  ProficiencyChoice,
  SeniorityLevel,
} from '../types'
import OnboardingShell from './OnboardingShell'
import { rememberJustMarkedNodes } from '../roadmap/justMarkedNodes'
import { VerifyEvidenceNudge, useStudentLevel } from '../level'

interface StudentSkillAssessmentModalProps {
  isOpen: boolean
  /** Called when the student finishes — or chooses to skip. */
  onComplete: () => void | Promise<void>
  onBack?: () => void
}

const STEP_LABELS = ['Personal', 'Academic', 'Skills', 'Assessment']

/**
 * The answer scale, worded as things the student either did or did not do.
 *
 * A bare 1-5 invites everyone to pick 4. "Shipped it to users" is a claim a
 * student can check themselves against, and one the grading can weigh a written
 * note against afterwards.
 */
const CHOICES: { value: ProficiencyChoice; label: string; hint: string }[] = [
  { value: 'NONE', label: 'Not yet', hint: "I haven't used it" },
  { value: 'AWARE', label: 'Heard of it', hint: 'Read about it, never wrote any' },
  { value: 'PRACTICED', label: 'Tutorial', hint: 'Followed a guide and got it working' },
  { value: 'APPLIED', label: 'Own project', hint: 'Used it in something I designed' },
  { value: 'PROFESSIONAL', label: 'Real users', hint: 'Shipped it to users or a team' },
]

const MIN_NOTE_LENGTH = 30

const claimsExperience = (level: ProficiencyChoice) =>
  level === 'APPLIED' || level === 'PROFESSIONAL'

/**
 * Typed against every rung, not Record<string, string>. The loose type is why a
 * missing BEGINNER key was not a compile error — it rendered an empty subtitle
 * under a heading that named a level the student had never seen.
 *
 * BEGINNER is worded as a statement about coverage, not about the student. One
 * assessment can grade at most 15 skills while a role's core set runs to 181, so
 * a capable person lands here on their first pass; saying "you are a beginner"
 * would be both discouraging and untrue.
 */
const LEVEL_BLURB: Record<SeniorityLevel, string> = {
  BEGINNER: 'Only part of this role is evidenced so far — one assessment covers a slice of it.',
  FRESHER: 'Starting out — your roadmap begins with the foundations.',
  JUNIOR: 'You have real ground covered. Your roadmap starts past the basics.',
  MID: 'Strong coverage of this role. Your roadmap focuses on what is left.',
  SENIOR: 'Senior coverage of this role.',
  EXPERT: 'You cover nearly all of this role, with evidence behind it.',
}

export default function StudentSkillAssessmentModal({
  isOpen,
  onComplete,
  onBack,
}: StudentSkillAssessmentModalProps) {
  const { level: studentLevel, reload: reloadLevel } = useStudentLevel()
  const [phase, setPhase] = useState<'intro' | 'questions' | 'result'>('intro')
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [careerName, setCareerName] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, ProficiencyChoice>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  // The graded paper, when this career has one. Null means the career has no bank
  // yet and the self-report form above is what the student sees — the two never
  // run at once, which is why they share a phase rather than a route.
  const [paper, setPaper] = useState<GradedAssessmentPaper | null>(null)
  const [gradedDrafts, setGradedDrafts] = useState<Record<string, GradedAnswerDraft>>({})
  const [gradedResult, setGradedResult] = useState<GradedAssessmentResult | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [gradingStage, setGradingStage] = useState(0)
  const isRelease = import.meta.env.PROD

  useEffect(() => {
    if (!isSaving || !paper) {
      setGradingStage(0)
      return
    }
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      // The client knows the objective pass happens before the model call, but
      // the synchronous endpoint does not stream server progress. Never pretend
      // the roadmap update finished on a timer; the result response is that proof.
      setGradingStage(elapsed >= 1200 ? 1 : 0)
    }, 400)
    return () => window.clearInterval(timer)
  }, [isSaving, paper])

  // The graded paper is asked for first and the self-report set is the fallback.
  // Asking in that order means adding a career's question bank is a file on the
  // server, with no client release: a career that starts answering with a paper
  // simply starts getting one.
  useEffect(() => {
    if (!isOpen || phase !== 'questions' || questions.length > 0 || paper) return

    setIsLoading(true)
    assessmentService
      .getPaper()
      .then(async (loadedPaper) => {
        if (loadedPaper) {
          setPaper(loadedPaper)
          setCareerName(loadedPaper.careerName)
          setGradedDrafts(
            Object.fromEntries(loadedPaper.items.map((item) => [item.id, emptyDraft()])),
          )
          setError('')
          return
        }
        const set = await assessmentService.getQuestions()
        setQuestions(set.questions)
        setNotice(set.notice ?? null)
        setCareerName(set.careerName ?? null)
        setError('')
      })
      .catch((requestError) => setError(getAssessmentErrorMessage(requestError)))
      .finally(() => setIsLoading(false))
  }, [isOpen, phase, questions.length, paper])

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.skillId] && answers[q.skillId] !== 'NONE').length,
    [answers, questions],
  )

  /** The first required note still missing, so the error can name the skill. */
  const missingNote = useMemo(() => {
    for (const question of questions) {
      const level = answers[question.skillId]
      if (!question.noteRequired || !level || !claimsExperience(level)) continue
      if ((notes[question.skillId]?.trim().length ?? 0) < MIN_NOTE_LENGTH) return question
    }
    return null
  }, [answers, notes, questions])

  const handleSubmitPaper = async () => {
    setError('')
    setIsSaving(true)
    try {
      const graded = await assessmentService.submitPaper(gradedDrafts)
      setGradedResult(graded)
      setPhase('result')
      // Hand the marked nodes to the roadmap. This modal unmounts before the
      // canvas refetches, so without the handoff the ticks are already sitting
      // there when the student arrives, and a paper that moved fourteen nodes
      // looks like it did nothing at all.
      rememberJustMarkedNodes(graded?.markedNodeIds ?? [], 'assessment')
      void reloadLevel()
    } catch (requestError) {
      setError(getAssessmentErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    const payload = questions
      .filter((q) => answers[q.skillId])
      .map((q) => ({
        skillId: q.skillId,
        level: answers[q.skillId],
        note: notes[q.skillId],
      }))

    if (payload.length === 0) {
      setError('Answer at least one question, or skip the assessment for now.')
      return
    }
    if (missingNote) {
      setError(
        `Add a sentence about what you built with ${missingNote.skillName} ` +
          `(at least ${MIN_NOTE_LENGTH} characters).`,
      )
      return
    }

    setError('')
    setIsSaving(true)
    try {
      const graded = await assessmentService.submit(payload)
      setResult(graded)
      setPhase('result')
      // The submit response carries the level but not the verified share behind
      // it, and that is what decides whether the result screen should explain the
      // Junior ceiling. Fetched separately rather than widened into the submit
      // payload, so a failure here costs a prompt and not the grade.
      void reloadLevel()
    } catch (requestError) {
      setError(getAssessmentErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenRoadmap = async () => {
    // Finish the level request before changing pages. Each page owns its own
    // level hook, so fire-and-forget used to race navigation and leave the old
    // badge visible until a full browser refresh.
    await reloadLevel()
    await onComplete()
  }

  if (!isOpen) return null

  // ── Intro. Taking this is a choice, so skipping is as prominent as starting.
  if (phase === 'intro') {
    return (
      <OnboardingShell
        step={4}
        totalSteps={4}
        stepLabels={STEP_LABELS}
        title="Want us to find your starting point?"
        subtitle="A few questions about what you have actually built. Optional — you can skip and start from the beginning instead."
        error={error}
        onBack={isRelease ? undefined : onBack}
        onNext={() => setPhase('questions')}
        nextLabel="Take the assessment"
      >
        <div className="space-y-3">
          {[
            {
              icon: Sparkles,
              title: 'Your roadmap starts where you do',
              body: 'Anything you can already demonstrate is marked as covered, so you are not asked to re-learn it.',
            },
            {
              icon: TrendingUp,
              title: 'Jobs and advice at your level',
              body: 'Market Pulse leads with roles that match, and the AI mentor stops explaining what you already know.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{body}</p>
              </div>
            </div>
          ))}

          {!isRelease && <button
            type="button"
            onClick={onComplete}
            className="w-full rounded-xl py-2.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Skip for now — start from the beginning
          </button>}
          {!isRelease && <p className="text-center text-[11.5px] text-slate-400">
            You can take it any time from your dashboard.
          </p>}
        </div>
      </OnboardingShell>
    )
  }

  // ── Result of a graded paper. Separate from the self-report result below
  // rather than a set of conditionals inside it: the two say different things —
  // one reports a score against an answer key, the other reports what the model
  // made of a set of claims — and merging them would make every line conditional.
  if (phase === 'result' && paper && gradedResult) {
    const level = gradedResult.level as SeniorityLevel
    return (
      <OnboardingShell
        wide
        step={4}
        totalSteps={4}
        stepLabels={STEP_LABELS}
        title={`You are at ${level} level`}
        subtitle={LEVEL_BLURB[level] ?? 'Your answers were graded.'}
        error={error}
        onBack={isRelease ? undefined : () => setPhase('questions')}
        backLabel="Back to my answers"
        onNext={handleOpenRoadmap}
        nextLabel="Open my roadmap"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <ScoreTile
              label="Multiple choice"
              value={
                gradedResult.objectiveScore === null
                  ? '—'
                  : `${Math.round(gradedResult.objectiveScore * 100)}%`
              }
            />
            <ScoreTile
              label="Written and code"
              value={
                gradedResult.rubricScore === null
                  ? 'not graded'
                  : `${Math.round(gradedResult.rubricScore * 100)}%`
              }
            />
          </div>

          <VerifyEvidenceNudge level={studentLevel} onSynced={reloadLevel} />

          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 ring-1 ring-emerald-100">
            <Check size={16} className="shrink-0 text-emerald-600" />
            <p className="text-[13px] font-medium text-emerald-900">
              {gradedResult.evidencedSkillCount > 0
                ? `${gradedResult.evidencedSkillCount} skill${
                    gradedResult.evidencedSkillCount > 1 ? 's' : ''
                  } evidenced by what you answered correctly.`
                : 'Nothing was marked as covered — your answers need more behind them yet.'}
            </p>
          </div>

          <GradedAssessmentForm
            paper={paper}
            drafts={gradedDrafts}
            onChange={() => {}}
            result={gradedResult}
          />
        </div>
      </OnboardingShell>
    )
  }

  // ── Result
  if (phase === 'result') {
    const level = result?.level ?? null
    const applied = result?.appliedNodeCount ?? 0
    const regraded = (result?.assessedSkills ?? []).filter(
      (s) => s.declaredLevel && s.assessedLevel && s.declaredLevel !== s.assessedLevel,
    )

    return (
      <OnboardingShell
        wide
        step={4}
        totalSteps={4}
        stepLabels={STEP_LABELS}
        title={level ? `You are at ${level} level` : 'Assessment complete'}
        subtitle={level ? LEVEL_BLURB[level] ?? '' : 'Your answers were recorded.'}
        error={error}
        // The result is where a student first learns what their answers were
        // worth, and it was the one phase with no way back — so the reaction it
        // most reliably provokes ("I under-sold that, let me say what I actually
        // built") had nowhere to go. Returning to the questions keeps the answers
        // already typed; submitting again grades a new assessment rather than
        // editing this one, which is the honest record of both attempts.
        onBack={isRelease ? undefined : () => setPhase('questions')}
        backLabel="Back to my answers"
        onNext={handleOpenRoadmap}
        nextLabel="Open my roadmap"
      >
        <div className="space-y-3">
          {result?.rationale && (
            <p className="rounded-xl bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-600">
              {result.rationale}
            </p>
          )}

          {/* Right where the ceiling is felt: the student has just been told a
              level and this says what is holding it there. */}
          <VerifyEvidenceNudge level={studentLevel} onSynced={reloadLevel} />

          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 ring-1 ring-emerald-100">
            <Check size={16} className="shrink-0 text-emerald-600" />
            <p className="text-[13px] font-medium text-emerald-900">
              {applied > 0
                ? `${applied} roadmap step${applied > 1 ? 's' : ''} marked as already covered.`
                : 'Nothing was skipped — your answers need more backing before steps can be marked done.'}
            </p>
          </div>

          {/* Shown deliberately. A downgrade the student cannot see reads as the
              app losing their answer, and the reason is the useful part anyway. */}
          {regraded.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Graded differently to your answer
              </p>
              <ul className="space-y-2">
                {regraded.slice(0, 4).map((skill) => (
                  <li key={skill.skillId} className="text-[12.5px] leading-snug text-slate-600">
                    <span className="font-semibold text-slate-900">{skill.skillName}</span>{' '}
                    <span className="text-slate-400">
                      {skill.declaredLevel} → {skill.assessedLevel}
                    </span>
                    {skill.justification && (
                      <span className="block text-slate-500">{skill.justification}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </OnboardingShell>
    )
  }

  // ── Questions: the graded paper, when this career has one.
  if (paper) {
    return (
      <OnboardingShell
        wide
        step={4}
        totalSteps={4}
        stepLabels={STEP_LABELS}
        title={careerName ? `${careerName} assessment` : 'Assessment'}
        subtitle="Answer what you can. An unanswered question scores zero rather than counting against you, so there is nothing to gain by guessing."
        error={error}
        onBack={isRelease ? undefined : () => setPhase('intro')}
        onNext={handleSubmitPaper}
        nextLabel={isSaving ? 'Grading…' : 'Submit answers'}
        nextLoading={isSaving}
        nextDisabled={isSaving}
      >
        {isSaving ? (
          <AssessmentGradingProgress stage={gradingStage} />
        ) : (
          <GradedAssessmentForm
            paper={paper}
            drafts={gradedDrafts}
            onChange={(itemId, draft) =>
              setGradedDrafts((current) => ({ ...current, [itemId]: draft }))
            }
            result={null}
          />
        )}
      </OnboardingShell>
    )
  }

  // ── Questions
  const questionList = (
    <div className="flex h-full flex-col py-5">
      {isLoading ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-2 text-[13px] text-slate-400">
          <Spinner size={24} className="text-slate-900" label="Loading questions" />
          <span>Building your questions…</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex min-h-44 items-center justify-center px-4 text-center text-[14px] font-medium text-slate-400">
          {notice ?? 'No questions available for this career yet.'}
        </div>
      ) : (
        <div className="space-y-5 pr-1">
          {questions.map((question) => {
            const level = answers[question.skillId]
            const needsNote = question.noteRequired && level && claimsExperience(level)
            return (
              <div key={question.skillId}>
                <div className="mb-2 flex items-baseline gap-2">
                  <p className="text-[13.5px] font-bold text-slate-900">{question.skillName}</p>
                  {question.importance === 'HIGH' && (
                    <span className="rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider text-rose-600 ring-1 ring-rose-200">
                      Core
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CHOICES.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      title={choice.hint}
                      onClick={() =>
                        setAnswers((current) => ({ ...current, [question.skillId]: choice.value }))
                      }
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        level === choice.value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>

                {needsNote && (
                  <textarea
                    value={notes[question.skillId] ?? ''}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [question.skillId]: event.target.value }))
                    }
                    rows={2}
                    maxLength={500}
                    placeholder={`What did you build with ${question.skillName}, and what was the hardest part?`}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      title="What have you actually built?"
      subtitle={
        careerName
          ? `The skills a ${careerName} gets hired for. Answer honestly — over-claiming just puts the wrong steps on your roadmap.`
          : 'Answer honestly — over-claiming just puts the wrong steps on your roadmap.'
      }
      error={error}
      aside={questionList}
      onBack={() => setPhase('intro')}
      backLabel="Back"
      onNext={handleSubmit}
      nextLabel={isSaving ? 'Grading…' : 'Submit answers'}
      nextLoading={isSaving}
      nextDisabled={isLoading || questions.length === 0}
    >
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50 p-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Answered
            </span>
            <span className="text-[13px] font-black tabular-nums text-slate-900">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-[width] duration-300"
              style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-slate-500">
          Skills marked <span className="font-semibold text-slate-700">Core</span> need a sentence
          about what you built if you pick <span className="font-semibold">Own project</span> or{' '}
          <span className="font-semibold">Real users</span>. That sentence is what the grading
          actually reads.
        </p>

        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl py-2 text-[12.5px] font-semibold text-slate-400 transition-colors hover:text-slate-700"
        >
          Skip for now
        </button>
      </div>
    </OnboardingShell>
  )
}

const GRADING_STEPS = [
  {
    title: 'Checking objective answers',
    detail: 'The answer key scores multiple-choice questions deterministically.',
  },
  {
    title: 'AI is reading your reasoning',
    detail: 'Written and code answers are compared criterion-by-criterion with the fixed rubric.',
  },
  {
    title: 'Updating your learning path',
    detail: 'Verified skills are mapped to roadmap capability and prerequisite gates.',
  },
]

function AssessmentGradingProgress({ stage }: { stage: number }) {
  return (
    <div className="mx-auto flex min-h-[440px] w-full max-w-2xl flex-col justify-center py-8">
      {/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */}
      <div className="mb-7 flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
          <BrainCircuit size={23} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Assessment engine
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Building an evidence-based result</h2>
        </div>
      </div>

      <div className="space-y-2">
        {GRADING_STEPS.map((step, index) => {
          const complete = index < stage
          const active = index === stage
          return (
            <div
              key={step.title}
              className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
                active
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : complete
                    ? 'border-emerald-200 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                  active ? 'bg-white text-slate-950' : complete ? 'bg-emerald-600 text-white' : 'bg-slate-100'
                }`}
              >
                {complete ? <Check size={14} strokeWidth={3} /> : <ScanSearch size={14} />}
              </span>
              <div>
                <p className="text-[13.5px] font-bold">{step.title}</p>
                <p className={`mt-1 text-[12.5px] leading-relaxed ${active ? 'text-slate-300' : ''}`}>
                  {step.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-5 text-center text-[12px] text-slate-400" role="status" aria-live="polite">
        Keep this window open. Your answers are saved with this attempt.
      </p>
    </div>
  )
}

/** One headline number from the graded paper. */
function ScoreTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-[18px] font-black tabular-nums text-slate-900">{value}</p>
    </div>
  )
}
