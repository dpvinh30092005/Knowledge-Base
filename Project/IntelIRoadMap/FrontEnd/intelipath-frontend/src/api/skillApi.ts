import { ENDPOINTS, mainClient } from '@/shared/api'

export interface SelectSkillsPayload {
  skillIds: string[]
}

const skillApi = {
  getSkills: () => mainClient.get(ENDPOINTS.STUDENT.SKILLS),

  searchSkills: (search: string) =>
    mainClient.get(`${ENDPOINTS.STUDENT.SKILLS}/${encodeURIComponent(search)}`),

  selectSkills: (payload: SelectSkillsPayload) =>
    mainClient.post(ENDPOINTS.STUDENT.SELECT_SKILLS, payload),

  compareRoadmapSkills: () => mainClient.post(ENDPOINTS.ROADMAP.COMPARE_SKILLS),
}

export default skillApi
