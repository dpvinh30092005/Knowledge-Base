import { ENDPOINTS, mainClient } from "@/shared/api"

const roadmapApi = {
  // `expand` names topics to open all the way down. The default payload stops at
  // the direct children of each root, because the roadmap data is now deep enough
  // that sending all of it is a page the browser cannot draw.
  getStudentRoadmap: (expand?: string[]) =>
    mainClient.get(ENDPOINTS.ROADMAP.STUDENT_ROADMAP, {
      params: expand && expand.length ? { expand } : undefined,
      paramsSerializer: {
        // Repeat the key instead of bracket-indexing it: Spring binds
        // ?expand=a&expand=b to List<UUID>, but not ?expand[0]=a.
        indexes: null,
      },
    }),
  getStudentPlan: () => mainClient.get(ENDPOINTS.ROADMAP.STUDENT_PLAN),
  // Same `expand` contract as the career roadmap above: a sub-roadmap is deep
  // enough to need it (C# is 269 nodes), so it stops at the same depth and opens
  // the topics the student has actually asked for.
  getStudentSubRoadmap: (nodeId: string, expand?: string[]) =>
    mainClient.get(ENDPOINTS.ROADMAP.STUDENT_SUB_ROADMAP(nodeId), {
      params: expand && expand.length ? { expand } : undefined,
      paramsSerializer: { indexes: null },
    }),
  updateNodeProgress: (nodeId: string, status: string, contextRootNodeId?: string | null) =>
    mainClient.put(ENDPOINTS.ROADMAP.UPDATE_NODE_PROGRESS, { nodeId, status, contextRootNodeId }),
  getNodeDetail: (nodeId: string) => mainClient.get(ENDPOINTS.ROADMAP.NODE_DETAIL(nodeId)),

  // ─── Choose-one selections ─────────────────────────────────────
  getSelections: () => mainClient.get(ENDPOINTS.ROADMAP.SELECTIONS),
  selectAlternative: (groupNodeId: string, chosenNodeId: string) =>
    mainClient.put(ENDPOINTS.ROADMAP.SELECTIONS, { groupNodeId, chosenNodeId }),
  clearSelection: (groupNodeId: string) =>
    mainClient.delete(ENDPOINTS.ROADMAP.CLEAR_SELECTION(groupNodeId)),
  getChoiceOptions: (groupNodeId: string) =>
    mainClient.get(ENDPOINTS.ROADMAP.CHOICE_OPTIONS(groupNodeId)),

  // ─── FPT curriculum declaration (drives the dynamic roadmap) ───
  getFptSubjects: () => mainClient.get(ENDPOINTS.CURRICULUM.FPT_SUBJECTS),
  declareCurriculumTerm: (completedTerm: number) =>
    mainClient.put(ENDPOINTS.CURRICULUM.CURRICULUM_TERM, { completedTerm }),
  updateFptSubjects: (subjects: { subjectCode: string; passed: boolean }[]) =>
    mainClient.put(ENDPOINTS.CURRICULUM.FPT_SUBJECTS, { subjects }),
  setCurriculum: (curriculumId: string) =>
    mainClient.put(ENDPOINTS.CURRICULUM.SET_CURRICULUM, { curriculumId }),

  // ─── Roadmap Personalization (AI recommendations) ──────────────
  getPendingRecommendations: () =>
    mainClient.get(ENDPOINTS.ROADMAP_RECOMMENDATIONS.PENDING),
  generateRecommendations: () =>
    mainClient.post(ENDPOINTS.ROADMAP_RECOMMENDATIONS.GENERATE),
  acceptRecommendation: (recommendationId: string) =>
    mainClient.post(ENDPOINTS.ROADMAP_RECOMMENDATIONS.ACCEPT(recommendationId)),
  rejectRecommendation: (recommendationId: string) =>
    mainClient.post(ENDPOINTS.ROADMAP_RECOMMENDATIONS.REJECT(recommendationId))
}

export default roadmapApi
