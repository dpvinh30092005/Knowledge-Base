import React, { useState, useRef } from "react"

import profileApi from "@/api/profileApi"
import { useAuth } from "@/context"
import { Edit3, Loader2 } from "lucide-react"
import gsap from "gsap"

interface AvatarUploadProps {
  initial: string
  tealTheme?: boolean
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  initial,
  tealTheme = false
}) => {
  const { user, updateUser } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user?.id) return

      setUploading(true)
      setError("")

      // 1. Gửi File xuống API (Backend xử lý Supabase)
      const uploadPromise = profileApi.updateAvatar(file) as any

      // Thêm timeout để tránh trường hợp request bị treo quá lâu
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error()), 10000)
      )
      const res = (await Promise.race([uploadPromise, timeoutPromise])) as any

      // Giả sử API trả về { avatarUrl: 'https://...' } hoặc { data: { avatarUrl: ... } }
      let newAvatarUrl =
        res.data?.avatarUrl || res.avatarUrl || URL.createObjectURL(file)

      if (!newAvatarUrl) {
        throw new Error("Server did not return an avatar URL")
      }

      // Thêm query param ?t=... để tránh lỗi cache của trình duyệt khi URL giống y hệt URL cũ
      if (newAvatarUrl.startsWith("http")) {
        const separator = newAvatarUrl.includes("?") ? "&" : "?"
        newAvatarUrl = `${newAvatarUrl}${separator}t=${Date.now()}`
      }

      // 2. Cập nhật lại Context
      updateUser({ avatarUrl: newAvatarUrl })
    } catch (err: any) {
      console.error("Lỗi khi upload avatar:", err)
      setError(err.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="relative">
      <div
        className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden border border-slate-200 ${
          tealTheme
            ? "bg-gradient-to-br from-[#00838f] to-[#005f63] shadow-[#00838f]/30"
            : "bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-500/30"
        }`}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white w-6 h-6" />
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUploadAvatar}
        disabled={uploading}
      />

      <button
        type="button"
        onMouseEnter={(e) =>
          gsap.to(e.currentTarget, {
            scale: 1.15,
            rotation: 15,
            duration: 0.4,
            ease: "back.out(2)"
          })
        }
        onMouseLeave={(e) =>
          gsap.to(e.currentTarget, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: "power2.out"
          })
        }
        onClick={(e) => {
          gsap.fromTo(
            e.currentTarget,
            { scale: 0.8 },
            { scale: 1.15, duration: 0.5, ease: "elastic.out(1, 0.3)" }
          )
          fileInputRef.current?.click()
        }}
        disabled={uploading}
        className={`absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 disabled:opacity-50 cursor-pointer ${
          tealTheme ? "text-[#00838f]" : "text-emerald-600"
        }`}
        aria-label="Edit avatar"
      >
        <Edit3 size={14} />
      </button>

      {error && (
        <div className="absolute top-24 left-0 text-xs text-red-500 font-medium whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-red-100 z-10">
          {error}
        </div>
      )}
    </div>
  )
}
