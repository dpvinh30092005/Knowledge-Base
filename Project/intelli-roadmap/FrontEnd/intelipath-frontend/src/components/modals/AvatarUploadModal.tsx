import { useState, useRef } from "react"
import BaseModal from "./BaseModal"
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react"

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  loading: boolean
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  onUpload,
  loading
}: AvatarUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateAndUpload = async (file: File) => {
    setFileError(null)
    if (!file.type.startsWith("image/")) {
      setFileError("Please select an image file.")
      return
    }
    if (file.size > 1048576) {
      setFileError("File size exceeds 1MB limit.")
      return
    }
    await onUpload(file)
    onClose()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (loading) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      await validateAndUpload(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading) return
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      await validateAndUpload(file)
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={loading ? undefined : onClose} className="max-w-md">
      <div className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Update Profile Picture</h2>
          <p className="text-sm text-slate-500">Upload a new avatar to personalize your profile</p>
        </div>

        {fileError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm font-medium text-rose-600 text-center">
            {fileError}
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragging
              ? "border-[#00838f] bg-[#e0f7fa]"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#00838f]/50"
          } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-[#00838f] animate-spin" />
              <p className="text-sm font-medium text-slate-700">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-[#00838f]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <ImageIcon size={12} />
                  SVG, PNG, JPG or GIF (max. 1MB)
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
