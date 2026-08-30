import { useNavigate, useLocation } from "react-router-dom"
import { UserHeaderActions, Logo, MobileNavMenu } from "@/components"
import { ROUTES } from "@/shared"
import type { User } from "@/features/shared/auth/types"

type MentorHeaderProps = {
  user: User | null
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void | Promise<void>
}

export function MentorHeader({
  user,
  activeTab,
  onTabChange,
  onLogout
}: MentorHeaderProps) {
  const navigate = useNavigate()

  // Every tab here must have a matching branch in MentorDashboardView, or the tab
  // lights up and renders nothing. Portfolios and Progress were commented out while
  // their views stayed live, which left two finished features with no way in.
  // AI Mentor is deliberately absent: there is no branch behind it yet.
  // Roadmap Editor is hidden from the mentor for now — its route is unmounted in
  // AppRoutes too. The view + API are kept in the codebase to bring back later.
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "portfolios", label: "E-Portfolios" },
    { id: "market", label: "Market Pulse" },
  ]

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 md:px-8 pt-6 pointer-events-none">
      <nav className="pointer-events-auto flex w-full max-w-[1400px] items-center justify-between transition-all">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Logo iconOnly className="scale-[0.85] origin-left" />
        </div>

        {/* Center: Navigation Links in a Glass Pill */}
        <div className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-1.5 py-1.5 text-[13px] font-bold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00838f]/40 ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: User Actions + mobile menu */}
        <div className="flex items-center justify-end gap-2">
          <MobileNavMenu
            items={tabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              active: activeTab === tab.id,
              onSelect: () => onTabChange(tab.id)
            }))}
          />
          <div className="bg-white/80 backdrop-blur-md shadow-sm border border-white/60 rounded-full pr-1 pl-3 py-1 flex items-center gap-2">
            <UserHeaderActions
              user={user}
              onLogout={onLogout}
              onSettings={() => navigate(ROUTES.DASHBOARD_MENTOR_SETTINGS)}
            />
          </div>
        </div>
      </nav>
    </div>
  )
}
