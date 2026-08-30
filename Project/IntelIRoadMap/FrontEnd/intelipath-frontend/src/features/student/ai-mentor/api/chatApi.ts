import { ENDPOINTS, getStoredToken, mainClient } from "@/shared/api"
import { API_BASE_URL } from "@/app/config/appConfig"

export interface ChatSession {
  sessionId: string
  userId: string
  sessionName: string
  createAt: string
}

export interface ChatMessage {
  messageId: string
  sessionId: string
  role: 'USER' | 'AI' | 'SYSTEM'
  content: string
  attachmentName?: string
  createAt: string
}

export interface CreateSessionPayload {
  sessionName: string
}

export interface VirtualMentorChatRequest {
  message: string
  fileUrl?: string
}

const chatApi = {
  getSessions: () => mainClient.get<ChatSession[]>(ENDPOINTS.CHAT.SESSIONS),
  createSession: (data: CreateSessionPayload) => mainClient.post<ChatSession>(ENDPOINTS.CHAT.SESSIONS, data),
  updateSession: (sessionId: string, data: { sessionName: string }) => mainClient.put<ChatSession>(ENDPOINTS.CHAT.SESSION(sessionId), data),
  deleteSession: (sessionId: string) => mainClient.delete(ENDPOINTS.CHAT.SESSION(sessionId)),
  getMessages: (sessionId: string) => mainClient.get<ChatMessage[]>(ENDPOINTS.CHAT.MESSAGES(sessionId)),
  
  // Custom fetch function for SSE streaming
  streamMessage: async (
    sessionId: string,
    request: VirtualMentorChatRequest,
    onMessage: (chunk: string) => void,
    signal?: AbortSignal,
    onStarted?: () => void
  ) => {
    const token = getStoredToken()
    const url = `${API_BASE_URL}${ENDPOINTS.CHAT.STREAM(sessionId)}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      // The current backend authenticates this endpoint with the Bearer token.
      // Do not opt into cookie credentials here until its CORS policy supports it.
      body: JSON.stringify(request),
      signal
    })

    if (!response.ok) {
      throw new Error(`Failed to stream message: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Response body is empty')
    }

    onStarted?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false
    let buffer = ""
    let fullText = ""
    const isEventStream = response.headers.get('content-type')?.includes('text/event-stream') ?? false

    const emitSseEvent = (eventStr: string) => {
      const lines = eventStr.split('\n')
      let eventData = ""

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const content = line.substring(5)
          // Spring WebFlux can omit the optional space after `data:`. Keep all
          // payload characters so token spacing is not accidentally removed.
          eventData += eventData === "" ? content : '\n' + content
        } else if (line.startsWith('event:') || line.startsWith('id:') || line.startsWith('retry:')) {
          continue
        } else if (line.trim() === '' && eventData === '') {
          continue
        } else {
          // Some Spring WebFlux chunks contain continuation lines without `data:`.
          eventData += eventData === "" ? line : '\n' + line
        }
      }

      if (eventData !== "") {
        fullText += eventData
        onMessage(fullText)
      } else if (eventStr.includes('data:')) {
        // An empty SSE data block represents a newline token from the LLM.
        fullText += '\n'
        onMessage(fullText)
      }
    }

    const drainSseBuffer = (includeTrailingEvent = false) => {
      let eventEndIndex: number
      while ((eventEndIndex = buffer.indexOf('\n\n')) >= 0) {
        const eventStr = buffer.substring(0, eventEndIndex)
        buffer = buffer.substring(eventEndIndex + 2)
        emitSseEvent(eventStr)
      }

      // Servers occasionally close the stream without the final blank-line
      // delimiter. Treat its remaining payload as the last SSE event.
      if (includeTrailingEvent && buffer.trim() !== '') {
        emitSseEvent(buffer)
        buffer = ""
      }
    }

    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone
      if (value) {
        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
        
        if (isEventStream) {
          drainSseBuffer()
        } else {
          fullText += buffer
          onMessage(fullText)
          buffer = ""
        }
      }
    }

    buffer += decoder.decode().replace(/\r/g, '')
    if (isEventStream) {
      drainSseBuffer(true)
    } else if (buffer) {
      fullText += buffer
      onMessage(fullText)
    }
  },

  // Upload file to Backend (returns the file URL)
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    // Remove Content-Type so Axios/Browser can automatically generate it with the required boundary string
    return mainClient.post<{ url: string }>(ENDPOINTS.CHAT.UPLOAD_FILE, formData, {
      withCredentials: true,
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    })
  }
}

export default chatApi
