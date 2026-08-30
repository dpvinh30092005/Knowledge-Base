import { useState, useEffect, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import { SharedAppBackground } from "@/components"
import StudentHeader from "@/features/student/common/StudentHeader"
import chatApi, { ChatSession, ChatMessage } from "@/features/student/ai-mentor/api/chatApi"
import { 
  Bot, 
  MessageSquare, 
  Plus, 
  MoreHorizontal, 
  Send, 
  Paperclip, 
  PanelLeftClose, 
  PanelLeftOpen, 
  X,
  FileText,
  Square,
  Edit2,
  Trash2,
  Check,
  ArrowUp,
  Compass,
  BookOpen,
  TrendingUp,
  Copy,
  Lightbulb,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react"
import robotImg from "@/assets/robot/head.png"
import GradeReportUI from "@/features/student/courses/GradeReportUI"
import MentorContextPanel from "@/features/student/ai-mentor/ui/MentorContextPanel"
import { splitSources } from "@/features/student/ai-mentor/lib/sources"
import { useProfileSettings } from "@/features/shared/profile-settings"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { motion, AnimatePresence } from 'framer-motion'

const CodeBlockHeader = ({ lang, codeStr }: { lang: string; codeStr: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between rounded-t-lg border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{lang || "text"}</span>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(codeStr)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
      >
        {copied ? (
          <>
            <Check size={12} /> Copied
          </>
        ) : (
          <>
            <Copy size={12} /> Copy
          </>
        )}
      </button>
    </div>
  )
}

const processMarkdown = (text: string) => {
  // Markdown from the model is data, not source code to repair. Heuristics that
  // insert headings/lists or rebuild tables corrupt valid content such as C#.
  // remark-gfm below is responsible for rendering valid GitHub-flavoured Markdown.
  return text.replace(/\r\n?/g, '\n');
}

export default function AIMentorPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [externalLink, setExternalLink] = useState<string | null>(null)
  const [editingSessionName, setEditingSessionName] = useState("")
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const {
    profileData,
    loading: profileLoading,
    handleTranscriptUpload
  } = useProfileSettings()

  const markdownComponents = useMemo(() => ({
    code({node, inline, className, children, ...props}: any) {
      const match = /language-(\w+)/.exec(className || '')
      if (!inline && match) {
        const lang = match[1];
        const codeStr = String(children).replace(/\n$/, '');
        
        if (lang === 'json') {
          try {
            let jsonStr = codeStr.trim();
            // AI sometimes hallucinates and drops the leading or trailing brace
            if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
              jsonStr = '{' + jsonStr;
            }
            const parsed = JSON.parse(jsonStr);
            if (parsed.ui_type === 'GRADE_REPORT') {
              return <GradeReportUI data={parsed.data} />;
            }
          } catch (e: any) {
            // JSON is likely still streaming and incomplete. Show a sleek loading state.
            if (codeStr.includes('"GRADE_REPORT"')) {
              return (
                <div className="w-full bg-white border border-indigo-100 shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center my-6 overflow-hidden">
                  <div className="flex gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-300"></div>
                  </div>
                  <p className="text-indigo-600 font-medium text-sm animate-pulse">Generating Grade Report UI...</p>
                  {/* DEBUG INFO: Only visible if the stream finishes but JSON is still broken */}
                  <div className="mt-6 p-4 bg-red-50 text-red-600 text-xs rounded-lg w-full text-left overflow-x-auto border border-red-100">
                    <p className="font-bold mb-1">JSON Parse Error (AI output malformed):</p>
                    <p className="mb-3">{e.message}</p>
                    <p className="font-bold mb-1">Raw AI Output:</p>
                    <pre className="whitespace-pre-wrap">{codeStr}</pre>
                  </div>
                </div>
              );
            }
          }
        }
        
        return (
          <div className="my-3 overflow-hidden rounded-lg border border-zinc-800 shadow-sm">
            <CodeBlockHeader lang={lang} codeStr={codeStr} />
            <SyntaxHighlighter
              {...props}
              children={codeStr}
              style={vscDarkPlus}
              language={lang}
              PreTag="div"
              customStyle={{ margin: 0, borderRadius: 0 }}
            />
          </div>
        );
      }
      
      return (
        <code {...props} className={`${className} bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-[13.5px]`}>
          {children}
        </code>
      )
    },
    h2({children}: any) {
      return (
        <h2 className="mt-6 mb-2 flex items-center gap-2 text-[17px] font-bold text-zinc-900 first:mt-0">
          <span className="h-4 w-1 shrink-0 rounded-full bg-[#00838f]" />
          {children}
        </h2>
      )
    },
    h3({children}: any) {
      return <h3 className="mt-5 mb-1.5 text-[15px] font-bold text-zinc-800 first:mt-0">{children}</h3>
    },
    blockquote({children}: any) {
      return (
        <div className="my-4 flex gap-3 rounded-xl border border-[#00838f]/20 bg-[#00838f]/5 px-4 py-3">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#00838f]" />
          <div className="text-[14px] leading-relaxed text-zinc-700 [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
        </div>
      )
    },
    table({children}: any) {
      return (
        <div className="overflow-x-auto my-6 border border-zinc-200 rounded-xl shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            {children}
          </table>
        </div>
      )
    },
    thead({children}: any) {
      return <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-semibold">{children}</thead>
    },
    tr({children}: any) {
      return <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">{children}</tr>
    },
    th({children}: any) {
      return <th className="px-4 py-3 whitespace-nowrap">{children}</th>
    },
    td({children}: any) {
      return <td className="px-4 py-3">{children}</td>
    },
    a({href, children, ...props}: any) {
      return (
        <a 
          href={href} 
          {...props}
          onClick={(e) => {
            if (href && (href.startsWith('http') || href.startsWith('//'))) {
              e.preventDefault();
              setExternalLink(href);
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors cursor-pointer"
        >
          {children}
        </a>
      )
    }
  }), [setExternalLink]);
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const sendInFlightRef = useRef(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const emptyStateRef = useRef<HTMLDivElement>(null)

  // GSAP Elite Animations
  useGSAP(() => {
    // Elegant reveal for empty state if no messages
    if (messages.length === 0 && emptyStateRef.current) {
      gsap.fromTo(".empty-title-word", 
        { y: 40, opacity: 0, rotateX: -45 }, 
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.1, ease: "power4.out", delay: 0.2 }
      )
      gsap.fromTo(".empty-subtitle",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 }
      )
      gsap.fromTo(".empty-robot",
        { scale: 0.8, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 1.5, ease: "elastic.out(1, 0.5)" }
      )
    }
  }, { dependencies: [messages.length], scope: containerRef })

  useGSAP(() => {
    // Subtle float animation for the robot avatar
    gsap.to(".robot-avatar-float", {
      y: -6,
      duration: 2.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    })
  }, { scope: containerRef })

  // Fetch sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      // A send may have just created this session; don't let an async
      // loadMessages([]) clobber the optimistic user + streaming AI messages.
      if (sendInFlightRef.current) return
      loadMessages(activeSessionId)
    } else {
      setMessages([])
    }
  }, [activeSessionId])

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [inputValue])

  const loadSessions = async () => {
    try {
      const res = await chatApi.getSessions()
      const data = res.data || []
      setSessions(data)
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].sessionId)
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await chatApi.getMessages(sessionId)
      setMessages(res.data || [])
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const handleCreateSession = async () => {
    try {
      const res = await chatApi.createSession({ sessionName: "New Chat" })
      const newSession = res.data
      setSessions([newSession, ...sessions])
      setActiveSessionId(newSession.sessionId)
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  const handleUpdateSession = async (sessionId: string) => {
    if (!editingSessionName.trim()) {
      setEditingSessionId(null)
      return
    }
    try {
      await chatApi.updateSession(sessionId, { sessionName: editingSessionName })
      setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, sessionName: editingSessionName } : s))
      setEditingSessionId(null)
    } catch (error) {
      console.error("Failed to update session:", error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId)
      const newSessions = sessions.filter(s => s.sessionId !== sessionId)
      setSessions(newSessions)
      if (activeSessionId === sessionId) {
        setActiveSessionId(newSessions.length > 0 ? newSessions[0].sessionId : null)
      }
      setSessionToDelete(null)
    } catch (error) {
      console.error("Failed to delete session:", error)
      setSessionToDelete(null)
    }
  }

  const handleSendMessage = async (overrideText?: string) => {
    // onClick passes a MouseEvent as the first arg — only honour real strings.
    const message = (typeof overrideText === 'string' ? overrideText : inputValue).trim()
    const fileToUpload = selectedFile

    if ((!message && !fileToUpload) || isSending || isUploading || sendInFlightRef.current) return

    sendInFlightRef.current = true
    setUploadError(null)
    let currentSessionId = activeSessionId
    let fileUrl: string | undefined
    let tempAiMsgId: string | null = null

    try {
      // The file and prompt are snapshotted above, so later UI events cannot
      // change the request that is currently being sent.
      if (fileToUpload) {
        setIsUploading(true)
        const uploadRes = await chatApi.uploadFile(fileToUpload)
        fileUrl = uploadRes.data?.url
        if (!fileUrl) {
          throw new Error('The upload response did not include a file URL.')
        }
        setIsUploading(false)
      }

      // A session is only needed immediately before the stream request.
      if (!currentSessionId) {
        const title = message ? (message.length > 20 ? message.substring(0, 20) + "..." : message) : "Document Analysis"
        const res = await chatApi.createSession({ sessionName: title })
        currentSessionId = res.data.sessionId
        setSessions(prev => [res.data, ...prev])
        setActiveSessionId(currentSessionId)
      }

      const tempUserMsg: ChatMessage = {
        messageId: Date.now().toString(),
        sessionId: currentSessionId,
        role: 'USER',
        content: message,
        attachmentName: fileToUpload?.name,
        createAt: new Date().toISOString()
      }

      tempAiMsgId = (Date.now() + 1).toString()
      const tempAiMsg: ChatMessage = {
        messageId: tempAiMsgId,
        sessionId: currentSessionId,
        role: 'AI',
        content: '',
        createAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, tempUserMsg, tempAiMsg])
      setIsSending(true)

      // Clear the composer right away — the message is now in the thread and the
      // request already snapshotted message + fileToUpload, so the input is free.
      setInputValue("")
      setSelectedFile(current => (current === fileToUpload ? null : current))
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      abortControllerRef.current = new AbortController()

      try {
        await chatApi.streamMessage(currentSessionId, { message, fileUrl }, (fullText) => {
          setMessages(prev => prev.map(msg => {
            if (msg.messageId === tempAiMsgId) {
              return { ...msg, content: fullText }
            }
            return msg
          }))
        }, abortControllerRef.current.signal)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('Stream aborted by user')
        } else {
          console.error("Failed to stream message:", error)
          setMessages(prev => prev.map(msg => {
            if (msg.messageId === tempAiMsgId) {
              return { ...msg, content: msg.content + "\n\n*(Connection interrupted)*" }
            }
            return msg
          }))
        }
      }
    } catch (error) {
      const isUploadError = Boolean(fileToUpload) && !fileUrl
      console.error(isUploadError ? "Failed to upload file:" : "Failed to start chat:", error)
      setUploadError(
        isUploadError
          ? "Couldn't upload the file. Please try again."
          : "Couldn't start the conversation. Please try again."
      )
    } finally {
      setIsUploading(false)
      setIsSending(false)
      abortControllerRef.current = null
      sendInFlightRef.current = false
    }
  }

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
    // Clear the input value so the same file can be selected again
    e.target.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const emptyStateTitle = "How can I help you today?".split(" ")

  // The thread is centred on the viewport, not on the section between the panels, so
  // it does not jump sideways when a panel opens. Only one side needs compensating —
  // with both panels open their widths already cancel out.
  const chatOffsetClass =
    isSidebarOpen && !isContextPanelOpen
      ? "xl:pr-[260px]"
      : !isSidebarOpen && isContextPanelOpen
        ? "xl:pl-[280px]"
        : ""

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden bg-transparent text-slate-900 font-sans relative selection:bg-[#0a0a0a] selection:text-white">
      <SharedAppBackground />

      <StudentHeader user={user} onLogout={handleLogout} onOpenAiMentor={() => {}} />

      <main className="flex-1 flex overflow-hidden relative z-10 h-screen w-full pt-[80px]">
        <div className="flex w-full h-full bg-transparent overflow-hidden">
          {/* LEFT SIDEBAR - Vercel Style */}
          <aside 
          className={`flex-shrink-0 flex flex-col bg-transparent transition-all duration-300 h-full ${
            isSidebarOpen ? "w-[260px] border-r border-slate-200/40" : "w-0 overflow-hidden border-r-0"
          }`}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full w-[260px] p-3">
              
              {/* Vercel Style New Chat Button */}
              <button 
                onClick={handleCreateSession}
                className="group flex items-center justify-between w-full bg-white/50 border border-white/60 hover:bg-white/80 shadow-sm px-3 py-2.5 rounded-xl text-slate-800 font-bold text-[14px] transition-all mb-6"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center p-1 rounded-md border border-zinc-200 bg-white shadow-sm">
                    <Plus size={14} className="text-zinc-600" />
                  </div>
                  <span>New chat</span>
                </div>
              </button>

              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-1">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">History</h3>
                <div className="space-y-1">
                  {sessions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400 font-medium">It's quiet here.</div>
                  ) : (
                    sessions.map((session) => (
                      <div 
                        key={session.sessionId}
                        onClick={() => setActiveSessionId(session.sessionId)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-[14px] group transition-all duration-300 cursor-pointer mb-1 ${
                          activeSessionId === session.sessionId 
                            ? "bg-white shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/80 text-slate-900 font-bold" 
                            : "hover:bg-white/50 text-slate-600 font-medium"
                        }`}
                      >
                        {editingSessionId === session.sessionId ? (
                          <div className="flex-1 flex items-center min-w-0 pr-2" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="text"
                                value={editingSessionName}
                                onChange={e => setEditingSessionName(e.target.value)}
                                onBlur={() => handleUpdateSession(session.sessionId)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateSession(session.sessionId)
                                  if (e.key === 'Escape') setEditingSessionId(null)
                                }}
                                className="w-full bg-white border border-zinc-300 outline-none rounded-md px-2 py-1 text-[13px] font-medium text-zinc-900 shadow-sm"
                              />
                          </div>
                        ) : (
                          <>
                            <span className="truncate pr-2 flex-1">{session.sessionName || "New Chat"}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {sessionToDelete === session.sessionId ? (
                                <>
                                  <span className="text-[11px] font-bold text-red-500 mr-1 animate-pulse">Delete?</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSession(session.sessionId)
                                    }}
                                    className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                                    title="Confirm Delete"
                                  >
                                    <Check size={13} strokeWidth={3} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSessionToDelete(null)
                                    }}
                                    className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={13} strokeWidth={3} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingSessionName(session.sessionName || "New Chat")
                                      setEditingSessionId(session.sessionId)
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-[#00838f] hover:bg-[#00838f]/10 rounded-md transition-colors"
                                    title="Rename"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSessionToDelete(session.sessionId)
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CHAT AREA */}
        <section className="flex-1 flex flex-col min-w-0 relative h-full bg-transparent">
          {/* Floating Sidebar Toggle */}
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/60"
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          </div>

          {/* Floating Context Panel Toggle */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
              className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white/60"
              title={isContextPanelOpen ? "Hide context panel" : "Show context panel"}
            >
              {isContextPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>

          {/* Messages Container */}
          <div className={`flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth w-full relative z-0 transition-all duration-300 ${chatOffsetClass}`}>
            <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col pt-12 pb-48">
              
              {messages.length === 0 ? (
                <div ref={emptyStateRef} className="flex-1 flex flex-col items-center justify-center text-center pb-20 mt-10">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-3 flex gap-2 justify-center flex-wrap">
                    {emptyStateTitle.map((word, i) => (
                      <span key={i} className="empty-title-word inline-block">{word}</span>
                    ))}
                  </h1>
                  <p className="empty-subtitle text-zinc-500 max-w-md text-[15px]">
                    I can assist you with coding, learning, or planning your technical roadmap.
                  </p>

                  {/* Suggested prompts — one click sends the question (or opens the transcript picker) */}
                  <div className="empty-subtitle mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        icon: FileText,
                        label: "Analyze my transcript",
                        hint: "Upload a grade sheet — I'll map it to your roadmap",
                        onClick: () => {
                          setInputValue("Analyze my transcript: assess my strengths, suggest careers, and tell me which roadmap nodes my courses already cover and what to study next.")
                          fileInputRef.current?.click()
                        },
                      },
                      {
                        icon: Compass,
                        label: "What should I learn next?",
                        hint: "Based on your roadmap progress and gaps",
                        onClick: () => handleSendMessage("Based on my current roadmap progress and skill gaps, what should I learn next? Point to the exact roadmap nodes."),
                      },
                      {
                        icon: BookOpen,
                        label: "What does an FPT course teach?",
                        hint: "e.g. PRO192 → skills → roadmap nodes",
                        onClick: () => setInputValue("What skills does PRO192 teach, and which nodes on my roadmap does it cover?"),
                      },
                      {
                        icon: TrendingUp,
                        label: "Salary & demand for my career",
                        hint: "Live job-market data",
                        onClick: () => handleSendMessage("What is the current salary range and hiring demand for my target career in Vietnam right now?"),
                      },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={s.onClick}
                        disabled={isSending || isUploading}
                        className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors group-hover:text-zinc-800">
                          <s.icon size={14} strokeWidth={2} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-zinc-800">{s.label}</span>
                          <span className="block text-[11.5px] text-zinc-400">{s.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8 flex-1">
                  <AnimatePresence>
                    {messages.filter(msg => msg.content.trim() !== '' || msg.attachmentName || (msg.role === 'AI' && msg.content === '' && isSending)).map((msg) => {
                      const isUser = msg.role === 'USER'
                      
                      if (isUser) {
                        // Retain a readable attachment for legacy messages that embedded
                        // a Markdown link, but never expose that URL in the chat bubble.
                        const legacyFileMatch = msg.content.match(/^\[Attached File: (.*?)\]\((.*?)\)(?:\n\n)?([\s\S]*)$/)
                        const attachmentName = msg.attachmentName || legacyFileMatch?.[1]
                        const messageContent = legacyFileMatch ? legacyFileMatch[3] : msg.content
                        
                        return (
                          <motion.div 
                            key={msg.messageId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-end w-full mb-6"
                          >
                            <div className="bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-2xl max-w-[80%] text-[15px] leading-relaxed text-left flex flex-col gap-2">
                              {attachmentName && (
                                <div className="flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                  <FileText size={16} className="text-zinc-500" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Attached</p>
                                    <p className="max-w-[190px] truncate text-[14px] font-medium text-zinc-800">{attachmentName}</p>
                                  </div>
                                </div>
                              )}
                              {messageContent && <div className="whitespace-pre-wrap">{messageContent}</div>}
                            </div>
                          </motion.div>
                        )
                      }

                      // AI Message. The trailing "**Sources:**" footer is peeled off the
                      // markdown and rendered as chips below the answer.
                      const { body, sources } = splitSources(msg.content)

                      return (
                        <motion.div
                          key={msg.messageId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex w-full text-left justify-start mb-6"
                        >
                          <div className="w-full text-[15px] leading-[1.7] text-zinc-900">
                            {msg.content === '' && isSending ? (
                              <div className="flex items-center gap-1.5 h-5">
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"></div>
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-300"></div>
                              </div>
                            ) : (
                              <div className="prose prose-zinc max-w-none text-[15px] prose-headings:font-semibold prose-headings:text-zinc-900 prose-headings:mt-5 prose-headings:mb-2 prose-headings:first:mt-0 prose-h1:text-[19px] prose-h2:text-[17px] prose-h3:text-[15px] prose-p:leading-[1.7] prose-p:my-2.5 prose-strong:text-zinc-900 prose-strong:font-semibold prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1 prose-li:marker:text-zinc-400 prose-hr:my-5 prose-pre:bg-zinc-950 prose-pre:text-zinc-50 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:p-4 prose-code:text-zinc-800 prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-a:text-blue-600 prose-a:font-medium">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={markdownComponents}
                                  >
                                    {processMarkdown(body)}
                                  </ReactMarkdown>
                              </div>
                            )}

                            {sources.length > 0 && (
                              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                                  Sources
                                </span>
                                {sources.map((source) => (
                                  <span
                                    key={source}
                                    className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11.5px] font-medium text-zinc-600"
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Input Area (Vercel Template Style) */}
          <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent pt-10 pb-6 px-4 md:px-0 z-20 transition-all duration-300 ${chatOffsetClass}`}>
            <div className="max-w-3xl w-full mx-auto relative">
              
              {/* Stop Generating Button */}
              <AnimatePresence>
                {isSending && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center w-full z-10"
                  >
                    <button 
                      onClick={handleStopGenerating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 shadow-sm rounded-full text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Square size={12} className="fill-zinc-700" /> Stop generating
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex flex-col bg-white border border-zinc-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-2 transition-all">
                
                {/* File Attachment Preview */}
                {selectedFile && (
                  <div className="mx-3 mt-3 flex items-center gap-2 p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg w-fit">
                    <div className="p-1.5 bg-white rounded-md border border-zinc-200 shrink-0">
                      <FileText size={14} className="text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[13px] font-medium text-zinc-700 truncate max-w-[150px]">{selectedFile.name}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploading || isSending}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors mr-0.5"
                      title="Remove file"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                )}

                <div className="flex items-end w-full p-2 gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSending}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors outline-none shrink-0 disabled:opacity-50 mb-1" 
                    title="Attach file"
                  >
                    <Plus size={20} strokeWidth={2} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <textarea 
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isUploading}
                    placeholder={isUploading ? "Uploading file…" : isSending ? "AI is replying…" : "Send a message..."}
                    className="flex-1 w-full bg-transparent border-0 outline-none resize-none py-2.5 px-1 text-zinc-900 placeholder:text-zinc-500 text-[15px] disabled:opacity-50 min-h-[44px] overflow-y-auto"
                    rows={1}
                    style={{ maxHeight: '200px' }}
                  />
                  <div className="shrink-0 mb-1">
                    <button
                      onClick={() => handleSendMessage()}
                    disabled={(!inputValue.trim() && !selectedFile) || isSending || isUploading}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 transition-colors outline-none disabled:opacity-50 disabled:hover:bg-zinc-900 shadow-sm"
                    aria-label={isUploading ? "Uploading file" : isSending ? "AI is replying" : "Send message"}
                  >
                      {isUploading || isSending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <ArrowUp size={16} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-3 h-4">
                {uploadError ? (
                  <p className="text-[12px] font-medium text-red-500">{uploadError}</p>
                ) : isUploading ? (
                  <p className="text-[12px] font-medium text-zinc-500">Uploading file…</p>
                ) : isSending ? (
                  <p className="text-[12px] font-medium text-zinc-500">AI is replying…</p>
                ) : (
                  <p className="text-[12px] text-zinc-400">AI can make mistakes. Consider verifying important information.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {isContextPanelOpen && (
          <MentorContextPanel
            transcriptUrl={profileData.transcript_url}
            onUploadTranscript={handleTranscriptUpload}
            loading={profileLoading}
            onClose={() => setIsContextPanelOpen(false)}
          />
        )}
        </div>
      </main>

      {/* External Link Warning Modal */}
      <AnimatePresence>
        {externalLink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-zinc-200"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Leave the app?</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                You're about to leave InteliPath to open an external website. Are you sure you want to continue?
              </p>
              <div className="bg-zinc-50 p-3 rounded-lg mb-6 border border-zinc-100">
                <p className="text-xs text-zinc-500 font-mono break-all line-clamp-2">{externalLink}</p>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button 
                  onClick={() => setExternalLink(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    window.open(externalLink, '_blank', 'noopener,noreferrer');
                    setExternalLink(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
