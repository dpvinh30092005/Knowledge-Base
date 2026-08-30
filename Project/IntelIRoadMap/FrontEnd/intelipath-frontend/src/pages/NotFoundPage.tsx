import { useEffect, useRef } from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { Home, ArrowLeft, Compass } from "lucide-react"
import { ROUTES } from "@/shared"

/* ── Floating orbs config (mirrors AuthLayout aesthetic) ── */
const orbs = [
  {
    width: 350,
    height: 350,
    color: "bg-brand-cyan/25",
    left: "10%",
    top: "15%",
    duration: 18,
    delay: 0
  },
  {
    width: 500,
    height: 500,
    color: "bg-brand-indigo/25",
    left: "65%",
    top: "10%",
    duration: 24,
    delay: 1
  },
  {
    width: 420,
    height: 420,
    color: "bg-brand-blue/20",
    left: "40%",
    top: "55%",
    duration: 20,
    delay: 2
  },
  {
    width: 280,
    height: 280,
    color: "bg-brand-cyan/20",
    left: "80%",
    top: "70%",
    duration: 15,
    delay: 1.5
  }
]

/* ── Glitch keyframes injected once via a style tag ── */
const glitchCSS = `
  @keyframes glitch-clip-1 {
    0%,100% { clip-path: inset(0 0 98% 0); transform: translate(-4px, 0); }
    20%      { clip-path: inset(30% 0 50% 0); transform: translate(4px, 0); }
    40%      { clip-path: inset(70% 0 10% 0); transform: translate(-3px, 0); }
    60%      { clip-path: inset(10% 0 80% 0); transform: translate(3px, 0); }
    80%      { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 0); }
  }
  @keyframes glitch-clip-2 {
    0%,100% { clip-path: inset(95% 0 0 0); transform: translate(3px, 0); }
    20%      { clip-path: inset(10% 0 70% 0); transform: translate(-4px, 0); }
    40%      { clip-path: inset(60% 0 20% 0); transform: translate(4px, 0); }
    60%      { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 0); }
    80%      { clip-path: inset(80% 0 5%  0); transform: translate(2px, 0); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes blink-dot {
    0%,49% { opacity: 1; }
    50%,100%{ opacity: 0; }
  }
  .glitch-layer-1 {
    animation: glitch-clip-1 3.5s infinite linear;
    color: #06b6d4;
  }
  .glitch-layer-2 {
    animation: glitch-clip-2 3.5s infinite linear;
    color: #4f46e5;
  }
  .scanline {
    animation: scanline 6s linear infinite;
  }
  .blink { animation: blink-dot 1.1s step-end infinite; }
`

export default function NotFoundPage() {
  const navigate = useNavigate()
  const styleRef = useRef<HTMLStyleElement | null>(null)

  /* Inject glitch CSS once */
  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement("style")
      el.textContent = glitchCSS
      document.head.appendChild(el)
      styleRef.current = el
    }
    return () => {
      styleRef.current?.remove()
      styleRef.current = null
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#1e326b] via-[#172552] to-[#0e1736] font-sans text-slate-100 select-none">
      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 z-0 grid-overlay pointer-events-none opacity-80" />

      {/* ── Floating orbs ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[120px] ${orb.color}`}
            style={{
              width: orb.width,
              height: orb.height,
              left: orb.left,
              top: orb.top
            }}
            animate={{
              x: [0, 50, -40, 0],
              y: [0, -40, 35, 0],
              scale: [1, 1.12, 0.92, 1]
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: orb.delay
            }}
          />
        ))}
      </div>

      {/* ── Scanline effect ── */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div className="scanline absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex flex-col items-center text-center px-6 max-w-xl w-full"
      >
        {/* ── Glitch 404 ── */}
        <div className="relative mb-6 leading-none">
          {/* Base layer */}
          <span
            className="font-display text-[9rem] sm:text-[11rem] font-extrabold tracking-tighter text-white/90 drop-shadow-2xl"
            style={{ textShadow: "0 0 80px rgba(6,182,212,0.35)" }}
          >
            404
          </span>
          {/* Glitch layer 1 */}
          <span
            className="glitch-layer-1 font-display absolute inset-0 text-[9rem] sm:text-[11rem] font-extrabold tracking-tighter"
            aria-hidden="true"
          >
            404
          </span>
          {/* Glitch layer 2 */}
          <span
            className="glitch-layer-2 font-display absolute inset-0 text-[9rem] sm:text-[11rem] font-extrabold tracking-tighter"
            aria-hidden="true"
          >
            404
          </span>
        </div>

        {/* ── Status badge ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-rose-400 blink" />
          <span className="font-mono text-xs font-semibold tracking-widest text-rose-400 uppercase">
            Path Not Found
          </span>
        </motion.div>

        {/* ── Heading ── */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3"
        >
          You've Wandered Off the{" "}
          <span className="bg-linear-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
            Roadmap
          </span>
        </motion.h1>

        {/* ── Description ── */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm text-slate-400 leading-relaxed mb-10 max-w-sm"
        >
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track with your learning journey.
        </motion.p>

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center"
        >
          {/* Primary — Go Home */}
          <button
            onClick={() => navigate("/")}
            className="group relative flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl
              font-semibold text-sm text-white overflow-hidden
              bg-linear-to-r from-brand-electric via-brand-blue to-brand-cyan
              hover:brightness-110 active:brightness-95
              hover:shadow-[0_0_28px_rgba(6,182,212,0.35)]
              transition-all duration-300 shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span>Back to Home</span>
            {/* Shimmer */}
            <div
              className="absolute top-0 -inset-full h-full w-1/2 z-10 transform -skew-x-12
              bg-linear-to-r from-transparent to-white/10 opacity-40
              group-hover:animate-[shimmer_1.2s_ease-in-out_infinite]"
            />
          </button>

          {/* Secondary — Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl
              font-semibold text-sm text-slate-300 hover:text-white
              bg-slate-900/40 border border-slate-800
              hover:border-slate-600 hover:bg-slate-900/70
              transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Go Back</span>
          </button>
        </motion.div>

        {/* ── Divider ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="relative my-10 w-full max-w-xs"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span
              className="px-4 text-xs font-mono text-slate-600 uppercase tracking-widest"
              style={{ background: "transparent" }}
            >
              Or navigate to
            </span>
          </div>
        </motion.div>

        {/* ── Quick links ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            {
              label: "Sign In",
              path: ROUTES.LOGIN,
              icon: <Compass className="w-3.5 h-3.5" />
            }
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg
                text-xs font-semibold text-slate-400 hover:text-brand-cyan
                border border-slate-800/60 hover:border-brand-cyan/40
                bg-slate-900/30 hover:bg-brand-cyan/5
                transition-all duration-200 cursor-pointer"
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </motion.div>

        {/* ── Subtle footer ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-12 font-mono text-[10px] tracking-widest text-slate-700 uppercase"
        >
          InteliPath &nbsp;·&nbsp; Error 404 &nbsp;·&nbsp; Route Unresolved
        </motion.p>
      </motion.div>
    </div>
  )
}
