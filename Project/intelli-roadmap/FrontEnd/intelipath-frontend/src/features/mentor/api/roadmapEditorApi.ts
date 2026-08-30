import { ENDPOINTS, mainClient } from "@/shared/api"

export type EditorNode = {
  nodeId: string
  nodeName: string
  parentNode: string | null
  previousNode: string | null
  nodeLevel: number | null
  stage: string | null
  completionPolicy: string | null
  weight: number | null
  requiredProficiency: number | null
  positionX: number | null
  positionY: number | null
  description: string | null
  resource: unknown
}

export type UpsertNodePayload = {
  nodeName: string
  description?: string | null
  stage?: string | null
  completionPolicy?: string | null
  weight?: number | null
  requiredProficiency?: number | null
  parentNodeId?: string | null
  previousNodeId?: string | null
  resources?: string[]
  positionX?: number | null
  positionY?: number | null
}

const roadmapEditorApi = {
  getCareerNodes: (careerId: string) =>
    mainClient.get<EditorNode[]>(ENDPOINTS.ROADMAP_EDITOR.CAREER_NODES(careerId)),

  createNode: (careerId: string, payload: UpsertNodePayload) =>
    mainClient.post<EditorNode>(ENDPOINTS.ROADMAP_EDITOR.CREATE_NODE(careerId), payload),

  updateNode: (nodeId: string, payload: UpsertNodePayload) =>
    mainClient.put<EditorNode>(ENDPOINTS.ROADMAP_EDITOR.UPDATE_NODE(nodeId), payload),

  deleteNode: (nodeId: string) =>
    mainClient.delete(ENDPOINTS.ROADMAP_EDITOR.DELETE_NODE(nodeId)),

  savePositions: (positions: { nodeId: string; positionX: number; positionY: number }[]) =>
    mainClient.put(ENDPOINTS.ROADMAP_EDITOR.SAVE_POSITIONS, { positions })
}

export default roadmapEditorApi
