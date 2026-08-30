/**
 * The graded assessment, as the client sees it.
 *
 * <p>Note what is absent: there is no `answer` and no `rubric` field anywhere in
 * these types, because the server never sends them. Grading happens against the
 * paper the server loaded from its own classpath, so a client that invented an
 * answer key would be grading nothing. The correct keys arrive only in the
 * result, after the paper has been submitted.
 */

export type AssessmentItemKind = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SHORT_ANSWER' | 'CODE'

export type AssessmentChoice = {
  key: string
  text: string
}

export type GradedAssessmentItem = {
  id: string
  kind: AssessmentItemKind
  /** 1, 2 or 3. Shown rather than hidden — a paper that gets harder should look it. */
  tier: number
  topic: string
  prompt: string
  choices: AssessmentChoice[]
  language: string | null
  starterCode: string | null
  points: number
}

export type GradedAssessmentPaper = {
  careerId: string | null
  careerName: string | null
  /** BACKEND | FRONTEND | FULLSTACK */
  scope: string
  version: number
  items: GradedAssessmentItem[]
}

/** What the student has entered so far, keyed by item id. */
export type GradedAnswerDraft = {
  choiceKeys: string[]
  text: string
}

export type GradedItemResult = {
  id: string
  topic: string
  tier: number
  /** Null for written and code answers, where "correct" is not a yes or no. */
  correct: boolean | null
  awarded: number
  possible: number
  correctKeys: string[]
  explanation: string | null
  /** The grader's one-sentence note on a written or code answer. */
  feedback: string | null
}

export type GradedAssessmentResult = {
  assessmentId: string | null
  level: string
  /** What the multiple choice alone supported, before the written half moved it. */
  objectiveLevel: string | null
  objectiveScore: number | null
  /** Null when the model could not be reached; the level then rests on the objective half. */
  rubricScore: number | null
  tierReach: number
  rationale: string | null
  evidencedSkillCount: number
  appliedNodeCount: number
  /** The nodes behind that count, so the roadmap can show them being ticked. */
  markedNodeIds: string[]
  items: GradedItemResult[]
}
