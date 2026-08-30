import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Bell, X, Loader2, Check, CheckCheck, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import dashboardApi from "../../api/dashboardApi"

/**
 * One notification. Every field comes from the server — including `read`, which is the
 * whole point: it used to be hardcoded false on every fetch, so an item the student had
 * already opened came back unread as soon as the component remounted.
 */
export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

/** Backend MentorFeedbackItemResponse. */
interface FeedbackItem {
  id: string
  name?: string
  time?: string
  text?: string
  read?: boolean
}

// Feedback is written in markdown (**Strengths:** ...). Previews are one line of plain
// text; the detail view renders it properly.
function stripMarkdown(md: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

const markdownComponents = {
  p: (props: any) => <p className="mb-2.5 text-[14px] leading-6 text-slate-600" {...props} />,
  strong: (props: any) => <strong className="font-bold text-slate-900" {...props} />,
  ul: (props: any) => <ul className="mb-2.5 list-disc space-y-1 pl-5 text-[14px] text-slate-600" {...props} />,
  ol: (props: any) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 text-[14px] text-slate-600" {...props} />,
  li: (props: any) => <li className="leading-6" {...props} />,
  h1: (props: any) => <h3 className="mb-1.5 mt-3 text-[15px] font-bold text-slate-900" {...props} />,
  h2: (props: any) => <h3 className="mb-1.5 mt-3 text-[15px] font-bold text-slate-900" {...props} />,
  h3: (props: any) => <h3 className="mb-1.5 mt-3 text-[14px] font-bold text-slate-900" {...props} />,
  a: (props: any) => (
    <a className="font-medium text-indigo-600 underline" target="_blank" rel="noreferrer" {...props} />
  ),
}

function NotificationDetail({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold leading-snug text-slate-900">{notif.title}</h2>
            {notif.time && <p className="mt-0.5 text-[12px] font-medium text-slate-400">{notif.time}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
            {notif.message}
          </ReactMarkdown>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * The notifications entry in the user menu, for students only.
 *
 * Read and dismiss are both persisted before the list is trusted, so the state survives a
 * reload. Counselors, mentors and admins never render this: the only notification the
 * product has is feedback addressed to a student, and its endpoint is student-only.
 */
export default function NotificationBell({ onCloseMenu }: { onCloseMenu?: () => void } = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [detail, setDetail] = useState<Notification | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await dashboardApi.getMentorFeedback()
      const data: FeedbackItem[] = res.data?.data || res.data || []
      setNotifications(
        (Array.isArray(data) ? data : []).map((fb) => ({
          id: String(fb.id),
          title: fb.name ? `New feedback from ${fb.name}` : "New feedback",
          message: fb.text?.trim() || "Open to read the full feedback.",
          time: fb.time || "",
          read: Boolean(fb.read),
        })),
      )
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setRead = (id: string, read: boolean) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))

  const persistRead = async (id: string) => {
    setRead(id, true)
    try {
      await dashboardApi.markMentorFeedbackRead(id)
    } catch {
      // Roll the badge back rather than leave the student looking at a count the server
      // disagrees with — that mismatch is what made the old badge feel broken.
      setRead(id, false)
    }
  }

  const open = (notif: Notification) => {
    setDetail(notif)
    setIsOpen(false)
    onCloseMenu?.()
    if (!notif.read) persistRead(notif.id)
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    const results = await Promise.allSettled(
      unread.map((n) => dashboardApi.markMentorFeedbackRead(n.id)),
    )
    // Restore only what actually failed; one bad request must not undo the rest.
    results.forEach((result, i) => {
      if (result.status === "rejected") setRead(unread[i].id, false)
    })
  }

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await dashboardApi.dismissMentorFeedback(id)
    } catch {
      // Reload rather than re-insert: the row's place in the list is the server's to decide.
      load()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((v) => !v)
        }}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-slate-500" />
          <span className="text-[14px] font-medium text-slate-700">Notifications</span>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-full top-0 mr-2 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ zIndex: 9998 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-[14px] font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:underline"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[340px] divide-y divide-slate-100 overflow-y-auto">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                <Loader2 className="animate-spin" size={20} />
                <p className="text-[13px]">Loading…</p>
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-[14px] font-semibold text-slate-700">You're all caught up</p>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Feedback from your counselor or mentor will appear here.
                </p>
              </div>
            )}

            {!isLoading &&
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative flex items-start gap-2 px-4 py-3 transition-colors hover:bg-slate-50 ${
                    notif.read ? "bg-white" : "bg-indigo-50/40"
                  }`}
                >
                  {!notif.read && <span className="absolute left-0 top-0 h-full w-[3px] bg-indigo-600" />}

                  <button type="button" onClick={() => open(notif)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`truncate text-[13.5px] ${
                          notif.read ? "font-medium text-slate-600" : "font-bold text-slate-900"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {notif.time && (
                        <span className="shrink-0 text-[11.5px] font-medium text-slate-400">
                          {notif.time}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-slate-500">
                      {stripMarkdown(notif.message)}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    {!notif.read && (
                      <button
                        type="button"
                        title="Mark as read"
                        onClick={() => persistRead(notif.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Dismiss"
                      onClick={() => dismiss(notif.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {detail && <NotificationDetail notif={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
