import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, SignOut } from "@phosphor-icons/react"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import Logo from "./Logo"

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header className="pointer-events-auto border-b border-white/20 bg-white/30 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex min-h-[74px] w-full max-w-[1440px] items-center justify-between gap-5 px-4 md:px-8">
        <Logo iconOnly className="origin-left scale-[0.82] text-slate-950 sm:scale-90" />

        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-slate-500 lg:flex">
          <a href="#product" className="transition-colors hover:text-slate-950">Product</a>
          <a href="#capabilities" className="transition-colors hover:text-slate-950">Capabilities</a>
          <a href="#how-it-works" className="transition-colors hover:text-slate-950">How it works</a>
        </nav>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-600 md:block">
                {user?.fullName || "User"}
              </span>
              <Link
                to={ROUTES.DASHBOARD}
                className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-full bg-cyan-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(8,145,178,0.3)] transition-all hover:scale-[1.03] hover:bg-cyan-500 hover:shadow-[0_6px_20px_rgba(8,145,178,0.4)] active:scale-95"
              >
                <span className="relative z-10">Dashboard</span>
                <ArrowRight size={16} weight="bold" className="relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Logout"
              >
                <SignOut size={17} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="hidden h-10 items-center px-3 text-sm font-bold text-slate-600 transition-colors hover:text-cyan-600 sm:flex"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-full bg-cyan-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(8,145,178,0.3)] transition-all hover:scale-[1.03] hover:bg-cyan-500 hover:shadow-[0_6px_20px_rgba(8,145,178,0.4)] active:scale-95"
              >
                <span className="relative z-10">Get started</span>
                <ArrowRight size={16} weight="bold" className="relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
