import { useRef, useState } from 'react'
import { ArrowSquareOut, FilePdf } from '@phosphor-icons/react'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui'
import { toast } from '@/lib/toast'

interface TranscriptUploadFieldProps {
  /** The stored transcript URL, if one has already been uploaded. */
  transcriptUrl?: string
  /** Uploads the file and refreshes transcriptUrl on success. */
  onUpload: (file: File) => Promise<void>
  busy?: boolean
}

const MAX_BYTES = 10 * 1024 * 1024 // matches backend FileValidationUtil.MAX_DOCUMENT_BYTES

/**
 * Lets the student upload an academic transcript (PDF) so the AI Virtual Mentor can read it
 * for personalized guidance. Separate from the chat's generic file attachment: this one goes
 * through RAG ingestion and is remembered across sessions.
 */
export default function TranscriptUploadField({
  transcriptUrl,
  onUpload,
  busy
}: TranscriptUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const uploaded = Boolean(transcriptUrl)
  const disabled = busy || isUploading

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Transcript must be a PDF file.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Transcript is too large. Maximum allowed size is 10 MB.')
      return
    }
    setIsUploading(true)
    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 font-medium text-slate-700">
        <FilePdf size={16} className="text-emerald-600" />
        Academic Transcript
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {!uploaded ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-[13.5px] text-slate-500">
            Not uploaded yet. The AI Mentor can use it for personalized advice.
          </p>
          <Button
            variant="brand"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload PDF
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <a
            href={transcriptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 truncate text-[13.5px] font-semibold text-emerald-700 hover:underline"
          >
            View uploaded transcript
            <ArrowSquareOut size={13} className="shrink-0" />
          </a>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Replace
          </Button>
        </div>
      )}
    </div>
  )
}
