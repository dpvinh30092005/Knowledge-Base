import { useRef, useState } from "react"
import {
  BookOpen,
  Check,
  Compass,
  FileText,
  Loader2,
  TrendingUp,
  Upload,
  X
} from "lucide-react"
import { toast } from "@/lib/toast"

interface MentorContextPanelProps {
  transcriptUrl?: string
  onUploadTranscript: (file: File) => Promise<void>
  loading?: boolean
  onClose: () => void
}

const MAX_BYTES = 10 * 1024 * 1024 // matches backend FileValidationUtil.MAX_DOCUMENT_BYTES

/**
 * Right-hand panel listing what the mentor draws on for its answers, and where the student
 * hands it their academic record.
 *
 * Everything here is described at the level the student cares about — "your roadmap
 * progress", "Market Pulse" — never the file, endpoint or tool behind it. The labels match
 * the vocabulary the model is required to cite, so the panel and the per-answer footer
 * always agree.
 */
export default function MentorContextPanel({
  transcriptUrl,
  onUploadTranscript,
  loading,
  onClose
}: MentorContextPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const uploaded = Boolean(transcriptUrl)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Transcript must be a PDF file.")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Transcript is too large. Maximum allowed size is 10 MB.")
      return
    }
    setIsUploading(true)
    try {
      await onUploadTranscript(file)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const alwaysOn = [
    {
      icon: Compass,
      label: "Your roadmap progress",
      hint: "Completed nodes and remaining skill gaps"
    },
    {
      icon: BookOpen,
      label: "FPT curriculum",
      hint: "What each subject teaches, and the nodes it covers"
    },
    {
      icon: TrendingUp,
      label: "Market Pulse",
      hint: "Current salaries, demand and openings"
    }
  ]

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-l border-slate-200/40 bg-transparent p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          What I draw on
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-700"
          title="Hide panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        <div className="rounded-xl border border-white/70 bg-white/60 p-3.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2">
            <FileText size={14} className="shrink-0 text-[#00838f]" />
            <span className="text-[13px] font-bold text-slate-800">
              Your academic record
            </span>
          </div>

          {loading ? (
            <p className="text-[11.5px] text-slate-400">Checking…</p>
          ) : uploaded ? (
            <>
              <p className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600">
                <Check size={12} strokeWidth={3} />
                Added — I'll use it in my answers
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                Replace
              </button>
            </>
          ) : (
            <>
              <p className="mb-2.5 text-[11.5px] leading-relaxed text-slate-500">
                Add your transcript and I can ground advice in the courses you've
                actually taken.
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                Upload PDF
              </button>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>

        <div>
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Always on
          </p>
          <div className="space-y-1.5">
            {alwaysOn.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 rounded-xl border border-white/70 bg-white/40 px-3 py-2.5 backdrop-blur-sm"
              >
                <item.icon size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-slate-700">
                    {item.label}
                  </p>
                  <p className="text-[11px] leading-snug text-slate-400">
                    {item.hint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-slate-400">
        Every answer lists the sources it used underneath.
      </p>
    </aside>
  )
}
