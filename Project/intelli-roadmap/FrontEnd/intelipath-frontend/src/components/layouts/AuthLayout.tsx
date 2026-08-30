import { AnimatePresence, motion } from "motion/react"
import type { ReactNode } from "react"
import AbstractIllustration from "@/components/ui/AbstractIllustration"
import { Logo, SharedAppBackground } from "@/components"
import { Link } from "react-router-dom"
import { ArrowLeft } from "@phosphor-icons/react"
import { ROUTES } from "@/shared"

type AuthView = "login" | "register" | "forgot-password"

type AuthLayoutProps = {
  children: ReactNode
  view: AuthView
}

export default function AuthLayout({ children, view }: AuthLayoutProps) {
  return (
    <div 
      className="relative flex min-h-screen flex-col overflow-hidden bg-transparent text-[#0a0a0a] selection:bg-cyan-200"
      style={{ fontFamily: 'var(--font-manrope)' }}
    >
      <SharedAppBackground />

      {/* Floating Navbar matching WelcomePage */}
      <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
        <nav className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full bg-white/95 px-3 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md border border-slate-200/60 transition-all">
          <div className="flex items-center pl-2">
            <Logo />
          </div>
          <div className="flex items-center justify-end">
            <Link to={ROUTES.HOME} className="flex items-center gap-2 bg-[#0a0a0a] !text-white px-5 py-2 rounded-full text-[13px] font-bold hover:bg-slate-800 transition-colors shadow-sm">
              <ArrowLeft size={12} weight="bold" className="text-white" /> <span className="text-white">Back to Home</span>
            </Link>
          </div>
        </nav>
      </div>

      <main className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-24 xl:px-0">
        <div className="relative w-full max-w-[1000px]">
          <div className="absolute inset-0 -z-10 rounded-[24px] bg-cyan-300/10 blur-3xl" />
          <motion.div
            // COMMENTED OUT ORIGINAL FOR TEAM CONTRIBUTION PRESERVATION (Removing slide-up animation and shortening duration):
            // initial={{ opacity: 0, y: 40, scale: 0.95 }}
            // transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            initial={{ opacity: 0, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
    grid min-h-[550px] md:h-[70vh] md:max-h-[700px] w-full grid-cols-1
    overflow-hidden
    rounded-[24px]
    border border-white/60
    bg-white/50
    shadow-[0_30px_60px_rgba(0,0,0,0.08)]
    backdrop-blur-xl
    transition-all duration-500
    md:grid-cols-12
  "
          >
            <section className="hidden md:flex w-full overflow-hidden border-r border-slate-200/60 bg-slate-50/50 md:col-span-5 md:h-auto md:self-stretch items-center justify-center relative">
              <AbstractIllustration view={view} />
            </section>

            <section className="relative flex w-full flex-col justify-center overflow-hidden bg-transparent p-6 sm:p-10 xl:p-14 md:col-span-7">
              <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-100/30 blur-[90px] pointer-events-none" />

              <div className="relative z-10 w-full max-w-[400px] mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
