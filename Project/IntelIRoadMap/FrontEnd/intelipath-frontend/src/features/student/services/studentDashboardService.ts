import { isAxiosError } from "axios"
import { careerApi, dashboardApi, profileApi, roadmapApi, skillApi } from "@/api"
import { isUuid } from "@/lib/utils"
import type {
  AiHistoryItem,
  CareerRole,
  ChoiceOptions,
  LearningPlan,
  MarketDemand,
  MentorFeedback,
  NodeSelection,
  Recommendation,
  RoadmapProgress,
  SkillItem,
  SkillResponse,
  StudentRoadmap
} from "../types"
import {
  buildRoadmapGraph,
  normalizeCareerRole,
  normalizeRoadmapProgress,
  normalizeSkillResponse,
  normalizeStudentRoadmap,
  unwrapResponse,
  type RawCareerRole
} from "./studentDashboardNormalizers"

export const getSkillErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return "Cannot connect to server."

  const backendMessage = typeof error.response?.data === "object" && error.response?.data
    ? (error.response.data as { message?: string }).message
    : undefined

  switch (error.response?.status) {
    case 400:
      return backendMessage || "Select at least one valid skill."
    case 401:
    case 403:
      return backendMessage || "Your session or role is not authorized to select skills."
    case 404:
      return backendMessage || "One or more selected skills no longer exist."
    default:
      return backendMessage || "Unable to update selected skills."
  }
}

export const studentDashboardService = {
  getStudentProfile: async () => {
    const response = await profileApi.getStudentProfile()
    return unwrapResponse(response.data)
  },

  getStudentLevel: async () => {
    const response = await profileApi.getStudentLevel()
    return response.data || null
  },

  updateUserProfile: (payload: Parameters<typeof profileApi.updateUserProfile>[0]) =>
    profileApi.updateUserProfile(payload),

  updateStudentProfile: (payload: any) => {
    if (payload.careerId && typeof payload.careerId !== "string") {
      throw new Error("Career ID must be a valid string ID.")
    }

    return profileApi.updateStudentProfile({
      universityName: payload.universityName || payload.university || null,
      admissionDate: payload.admissionDate || null,
      major: payload.major || null,
      careerId: payload.careerId || null,
      bio: payload.bio || null,
      yob: payload.yob || null
    })
  },

  getCareerRoles: async (): Promise<CareerRole[]> => {
    const response = await careerApi.getCareerRoles()
    const careers = unwrapResponse<RawCareerRole[]>(response.data)

    return Array.isArray(careers)
      ? careers
          .map(normalizeCareerRole)
          .filter((career): career is CareerRole => Boolean(career))
      : []
  },

  updateTargetCareer: async (careerId: string) => {
    if (!careerId) throw new Error("Career ID must be a valid string ID.")

    const response = await careerApi.updateTargetCareer(careerId)
    return unwrapResponse(response.data)
  },

  getSkills: async (): Promise<SkillResponse> => {
    const response = await skillApi.getSkills()
    return normalizeSkillResponse(response.data)
  },

  getSelectedSkills: async (): Promise<SkillItem[]> => {
    return (await studentDashboardService.getSkills()).selectedSkills
  },

  searchSkills: async (search: string): Promise<SkillItem[]> => {
    const response = await skillApi.searchSkills(search)
    return normalizeSkillResponse(response.data).skills
  },

  selectSkills: async (skillIds: string[]): Promise<SkillItem[]> => {
    const payload = {
      skillIds: [...new Set(skillIds)]
    }

    if (payload.skillIds.some((skillId) => !isUuid(skillId))) {
      throw new Error("Every selected skill ID must be a valid UUID.")
    }

    const response = await skillApi.selectSkills(payload)
    return normalizeSkillResponse(response.data).selectedSkills
  },

  /**
   * The same call, keeping the marked-node receipt the server sends back.
   *
   * <p>Added beside {@link selectSkills} rather than widening its return type:
   * the existing callers only ever wanted the skill list, and the ids are a
   * one-shot event that would mean nothing to them.
   */
  selectSkillsWithMarks: async (
    skillIds: string[]
  ): Promise<{ selectedSkills: SkillItem[]; markedNodeIds: string[] }> => {
    const payload = { skillIds: [...new Set(skillIds)] }

    if (payload.skillIds.some((skillId) => !isUuid(skillId))) {
      throw new Error("Every selected skill ID must be a valid UUID.")
    }

    const response = await skillApi.selectSkills(payload)
    const normalized = normalizeSkillResponse(response.data)
    return { selectedSkills: normalized.selectedSkills, markedNodeIds: normalized.markedNodeIds }
  },

  compareRoadmapSkills: async (): Promise<SkillResponse> => {
    const response = await skillApi.compareRoadmapSkills()
    return normalizeSkillResponse(response.data)
  },

  getStudentRoadmap: async (expand?: string[]): Promise<StudentRoadmap> => {
    const response = await roadmapApi.getStudentRoadmap(expand)
    return normalizeStudentRoadmap(response.data)
  },

  // Shape-tolerant on purpose: a plan whose `steps` failed to arrive should
  // render as "no plan yet", not throw and take the roadmap page down with it.
  getStudentPlan: async (): Promise<LearningPlan> => {
    const response = await roadmapApi.getStudentPlan()
    const data = unwrapResponse(response.data) as Partial<LearningPlan> | null
    return {
      targetCareerRole: data?.targetCareerRole ?? null,
      level: data?.level ?? null,
      summary: data?.summary ?? null,
      requiredSkillCount: data?.requiredSkillCount ?? null,
      coveredSkillCount: data?.coveredSkillCount ?? null,
      steps: Array.isArray(data?.steps) ? data.steps : [],
      alreadyCovered: Array.isArray(data?.alreadyCovered) ? data.alreadyCovered : []
    }
  },

  getStudentSubRoadmap: async (nodeId: string, expand: string[] = []): Promise<StudentRoadmap> => {
    const response = await roadmapApi.getStudentSubRoadmap(nodeId, expand)
    return normalizeStudentRoadmap(response.data)
  },

  updateNodeProgress: async (nodeId: string, status: string, contextRootNodeId?: string | null): Promise<any> => {
    const response = await roadmapApi.updateNodeProgress(nodeId, status, contextRootNodeId);
    return unwrapResponse(response.data);
  },

  getRoadmapProgress: async (): Promise<RoadmapProgress> => {
    const response = await dashboardApi.getRoadmapProgress()
    return normalizeRoadmapProgress(response.data)
  },

  getSkillGaps: async (): Promise<{ career: any[]; market: any[] }> => {
    // REFACTOR: Use skillApi.getSkills() instead of deprecated dashboardApi.getSkillGaps()
    const response = await skillApi.getSkills()
    const data = unwrapResponse(response.data) as any
    return {
      career: Array.isArray(data.careerSkillGaps) ? data.careerSkillGaps : [],
      market: Array.isArray(data.marketSkillGaps) ? data.marketSkillGaps : []
    }
  },

  getNodeDetail: async (nodeId: string): Promise<any> => {
    const response = await roadmapApi.getNodeDetail(nodeId)
    return unwrapResponse(response.data)
  },

  // ─── Choose-one selections ─────────────────────────────────────
  getRoadmapSelections: async (): Promise<NodeSelection[]> => {
    const response = await roadmapApi.getSelections()
    const data = unwrapResponse<any>(response.data)
    return Array.isArray(data) ? data : []
  },

  selectAlternative: async (groupNodeId: string, chosenNodeId: string): Promise<NodeSelection> => {
    const response = await roadmapApi.selectAlternative(groupNodeId, chosenNodeId)
    return unwrapResponse(response.data)
  },

  clearRoadmapSelection: async (groupNodeId: string): Promise<void> => {
    await roadmapApi.clearSelection(groupNodeId)
  },

  /**
   * One group's alternatives, ranked by fit against the student's own skills.
   *
   * `verdict` is the honest part and must survive to the UI: TOO_CLOSE and
   * NO_SIGNAL mean no option may be shown as recommended, so `recommended` is
   * set here — once, from the verdict — rather than left to each caller to
   * re-derive and get wrong.
   */
  getChoiceOptions: async (groupNodeId: string): Promise<ChoiceOptions | null> => {
    const response = await roadmapApi.getChoiceOptions(groupNodeId)
    const data = unwrapResponse<any>(response.data)
    if (!data || !Array.isArray(data.options)) return null
    const decisive = String(data.verdict || '').toUpperCase() === 'DECISIVE'
    return {
      groupNodeId: data.groupNodeId ?? groupNodeId,
      groupName: data.groupName ?? '',
      verdict: data.verdict ?? 'NO_SIGNAL',
      options: data.options.map((option: any, index: number) => ({
        nodeId: option.nodeId,
        name: option.name ?? '',
        fitScore: typeof option.fitScore === 'number' ? option.fitScore : null,
        fitReason: option.fitReason ?? null,
        matchedSkills: Array.isArray(option.matchedSkills) ? option.matchedSkills : [],
        marketFrequency: typeof option.marketFrequency === 'number' ? option.marketFrequency : null,
        marketJobCount: typeof option.marketJobCount === 'number' ? option.marketJobCount : null,
        skillId: option.skillId ? String(option.skillId) : null,
        nodeCount: typeof option.nodeCount === 'number' ? option.nodeCount : null,
        chosen: Boolean(option.chosen),
        autoSelected: Boolean(option.autoSelected),
        recommended: decisive && index === 0,
      })),
    }
  },

  getMentorFeedback: async (): Promise<MentorFeedback[]> => {
    const response = await dashboardApi.getMentorFeedback()
    return unwrapResponse(response.data)
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    const response = await dashboardApi.getRecommendations()
    return unwrapResponse(response.data)
  },

  getMarketDemand: async (): Promise<MarketDemand> => {
    const response = await dashboardApi.getMarketDemand()
    return unwrapResponse(response.data)
  },

  getAiHistory: async (): Promise<AiHistoryItem[]> => {
    const response = await dashboardApi.getAiHistory()
    return unwrapResponse(response.data)
  },

  // Pure transform (no fetch); RoadmapVectorGraph feeds it the payload the page
  // already loaded. Implementation lives in studentDashboardNormalizers.
  buildRoadmapGraph,
}
