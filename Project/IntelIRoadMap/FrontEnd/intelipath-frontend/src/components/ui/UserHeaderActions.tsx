import { useState, useRef, useEffect } from 'react'
import { SignOut, CaretDown, GearSix } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared'
import type { User } from '@/features/shared/auth'
import NotificationBell from './NotificationBell'

interface UserHeaderActionsProps {
  user: User | null
  onLogout: () => void
  onSettings?: () => void
  /**
   * Something drawn around the avatar — a ring, a halo, a status dot.
   *
   * <p>A slot rather than a set of colour props: what goes here is role-specific
   * (students get a seniority ring; nobody else has a seniority) and this
   * component is shared by five roles. Keeping the meaning outside means adding a
   * mentor badge later touches the mentor code, not this file.
   *
   * <p>Rendered inside a relatively-positioned wrapper, so the node should place
   * itself absolutely and stay `pointer-events-none` — the whole avatar is a
   * button that opens the menu.
   */
  avatarAccent?: React.ReactNode
}

export default function UserHeaderActions({ user, onLogout, onSettings, avatarAccent }: UserHeaderActionsProps) {
  const navigate = useNavigate()
  const fullName = user?.fullName || 'User'
  const email = user?.email || 'No email'
  const role = String(user?.role || 'USER').toUpperCase()
  const initial = fullName.trim()[0]?.toUpperCase() || 'U'

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSettingsClick = () => {
    setShowDropdown(false)
    if (onSettings) {
      onSettings()
    } else {
      const roleKey = String(user?.role || 'USER').toUpperCase()
      if (roleKey === 'MENTOR') {
        navigate(ROUTES.MENTOR_SETTINGS || '/mentor/settings')
      } else if (roleKey === 'COUNSELOR') {
        navigate(ROUTES.COUNSELOR_SETTINGS || '/counselor/settings')
      } else {
        navigate(ROUTES.PROFILE_SETTINGS || '/profile/settings')
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
      >
        {/* The accent is drawn OUTSIDE the avatar, so it cannot live inside the
            clipped box — `overflow-hidden` there is what keeps a rectangular
            avatar image round. Hence the extra wrapper. */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          {avatarAccent}
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0a0a0a] text-[14px] font-bold text-white shadow-sm">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>
        <CaretDown size={14} weight="bold" className="text-slate-500" />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-50 origin-top-right transition-all duration-200 ${showDropdown ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
      >

        {/* User Info Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-[20px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-bold text-slate-900 truncate">{fullName}</span>
            <span className="text-[12px] font-medium text-slate-500 truncate">{email}</span>
          </div>
          <div className="mt-2 inline-flex px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
            {role}
          </div>
        </div>

        <div className="p-2 flex flex-col gap-1">
          {/* Students only. The one notification this product has is feedback addressed to a
              student, and its endpoint is student-only — for every other role the bell was a
              control that could never show anything. */}
          {role === 'STUDENT' && (
            <NotificationBell onCloseMenu={() => setShowDropdown(false)} />
          )}

          {/* Settings */}
          <button
            onClick={handleSettingsClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left text-slate-700"
          >
            <GearSix size={18} weight="duotone" className="text-slate-500" />
            <span className="text-[14px] font-medium">Settings</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-slate-100 my-1" />

          {/* Logout */}
          <button
            onClick={() => {
              setShowDropdown(false)
              onLogout()
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-left text-rose-600 group"
          >
            <SignOut size={18} weight="duotone" className="text-rose-500 group-hover:text-rose-600" />
            <span className="text-[14px] font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
