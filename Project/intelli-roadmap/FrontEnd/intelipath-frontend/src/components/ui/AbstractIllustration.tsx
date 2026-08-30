import { AnimatePresence, motion } from "motion/react"
import {
  CheckCircle2,
  Compass,
  Cpu,
  GraduationCap,
  Sparkles,
  Terminal
} from "lucide-react"
import { useState } from "react"

type AuthView = "login" | "register" | "forgot-password"

type AbstractIllustrationProps = {
  view: AuthView
}

const nodes = [
  {
    id: 1,
    cx: 40,
    cy: 195,
    label: "JS/TS Core",
    level: "Fundamental",
    tools: "ESNext, npm",
    status: "completed"
  },
  {
    id: 2,
    cx: 125,
    cy: 120,
    label: "Framework Stack",
    level: "Intermediate",
    tools: "React, Vite, Tailwind",
    status: "completed"
  },
  {
    id: 3,
    cx: 210,
    cy: 155,
    label: "Backend Systems",
    level: "Intermediate",
    tools: "Node, Express, DBs",
    status: "active"
  },
  {
    id: 4,
    cx: 300,
    cy: 90,
    label: "Model Engineering",
    level: "Advanced",
    tools: "PyTorch, Gemini API",
    status: "locked"
  },
  {
    id: 5,
    cx: 385,
    cy: 140,
    label: "DevOps & Pipeline",
    level: "Expert",
    tools: "Docker, CI/CD, AWS",
    status: "locked"
  }
]

const lines = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 }
]

export default function AbstractIllustration({
  view
}: AbstractIllustrationProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)

  return (
    <div className="relative flex h-full w-full select-none flex-col overflow-hidden bg-transparent p-5 lg:p-8 xl:p-10">
      <div className="absolute inset-0 z-0 grid-overlay pointer-events-none opacity-60" />
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-indigo/15 blur-[100px] animate-glow-pulse pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-brand-cyan/20 blur-[120px] animate-glow-pulse pointer-events-none [animation-delay:2s]" />
      <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-brand-blue/10 blur-[80px] animate-glow-pulse pointer-events-none [animation-delay:1s]" />

      <div className="z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono text-brand-blue/60">
          <Compass className="h-3.5 w-3.5" />
          <span>v2.4.0</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-2 min-h-0">
        <div className="absolute h-62.5 w-112.5 rounded-[40px] border border-brand-blue/10 bg-brand-blue/5 blur-3xl pointer-events-none" />

        <div className="relative aspect-[440/260] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[440px] overflow-visible select-none lg:p-2">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible pointer-events-none"
            viewBox="0 0 440 260"
          >
            {lines.map((line, index) => {
              const start = nodes.find((node) => node.id === line.from)
              const end = nodes.find((node) => node.id === line.to)
              if (!start || !end) return null

              const isCompleted =
                start.status === "completed" && end.status === "completed"
              const isActive =
                (start.status === "completed" && end.status === "active") ||
                start.status === "active"
              const strokeColor = isCompleted
                ? "url(#cyan-blue-gradient)"
                : isActive
                  ? "#06b6d4"
                  : "rgba(59, 130, 246, 0.4)"

              return (
                <g key={index}>
                  <line
                    x1={start.cx}
                    y1={start.cy}
                    x2={end.cx}
                    y2={end.cy}
                    stroke="rgba(37, 99, 235, 0.15)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {(isCompleted || isActive) && (
                    <line
                      x1={start.cx}
                      y1={start.cy}
                      x2={end.cx}
                      y2={end.cy}
                      stroke={isActive ? "#06b6d4" : "#3b82f6"}
                      strokeWidth={isActive ? "3" : "2"}
                      strokeLinecap="round"
                      opacity="0.3"
                      className="blur-md"
                    />
                  )}
                  <line
                    x1={start.cx}
                    y1={start.cy}
                    x2={end.cx}
                    y2={end.cy}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={isActive ? "6 4" : ""}
                    className={isActive ? "glowing-node-line" : ""}
                  />
                </g>
              )
            })}
            <defs>
              <linearGradient
                id="cyan-blue-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {nodes.map((node) => {
            const isCompleted = node.status === "completed"
            const isActive = node.status === "active"
            const isHovered = hoveredNode === node.id

            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${(node.cx / 440) * 100}%`,
                  top: `${(node.cy / 260) * 100}%`,
                  zIndex: isHovered ? 40 : 20
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className={`absolute -inset-4 rounded-full transition-all duration-300 pointer-events-none ${
                    isActive
                      ? "bg-brand-cyan/20 blur-md border border-brand-cyan/25 scale-110 animate-pulse"
                      : isCompleted
                        ? "bg-brand-indigo/10 blur-sm group-hover:bg-brand-blue/20 group-hover:blur-md"
                        : "bg-transparent group-hover:bg-brand-indigo/5 group-hover:blur-sm"
                  }`}
                />
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-md transition-all duration-300 ${
                    isCompleted
                      ? "bg-brand-indigo text-white border-brand-cyan/30 shadow-brand-indigo/10"
                      : isActive
                        ? "bg-brand-cyan text-white border-brand-cyan shadow-brand-cyan/25 scale-110"
                        : "bg-white text-slate-400 border-slate-300"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  ) : isActive ? (
                    <Cpu className="h-4 w-4 animate-spin [animation-duration:6s]" />
                  ) : (
                    <Terminal className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={`absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-medium tracking-wide shadow-sm transition-all duration-200 ${
                    isHovered
                      ? "opacity-100 translate-x-1 bg-white border-brand-cyan/40 text-brand-blue font-semibold"
                      : "pointer-events-none opacity-0 translate-x-0 bg-slate-50 border-slate-300 text-slate-500"
                  }`}
                >
                  {node.label}
                </span>
              </div>
            )
          })}

          <AnimatePresence>
            {hoveredNode !== null && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute -bottom-4.5 left-[15%] right-[15%] z-50 flex flex-col gap-1 rounded-xl border border-brand-cyan/25 p-3 shadow-2xl bg-white/90 backdrop-blur-md pointer-events-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    {nodes.find((node) => node.id === hoveredNode)?.label}
                  </span>
                  <span className="rounded border border-brand-cyan/20 bg-brand-cyan/10 px-1.5 py-0.5 text-[8px] font-mono tracking-widest text-brand-cyan uppercase">
                    {nodes.find((node) => node.id === hoveredNode)?.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    Level:{" "}
                    <b className="text-slate-800">
                      {nodes.find((node) => node.id === hoveredNode)?.level}
                    </b>
                  </span>
                  <span>
                    Stack:{" "}
                    <b className="text-[9px] font-mono text-brand-cyan/90">
                      {nodes.find((node) => node.id === hoveredNode)?.tools}
                    </b>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>

      <div className="z-10 shrink-0">
        {/*
       
        */}
        <div className="relative">
          <div
            className="invisible pointer-events-none flex flex-col gap-0 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm text-slate-900"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-brand-indigo" />
              <span className="text-xs font-mono font-semibold tracking-widest text-brand-cyan uppercase">
                Adaptive Learning
              </span>
            </div>
            <h1 className="font-display text-2xl lg:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
              Build Your Future <br />
              With InteliPath
            </h1>
            <p className="max-w-md text-sm font-light leading-relaxed text-slate-600">
              Discover your ideal software engineering development track,
              benchmark your skills, map milestones, and reach premium standard
              career outcomes.
            </p>
          </div>

          {/* ── Animated text overlay ── */}
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-3"
              >
                {/* Spacer = accent label height → aligns h1 & p with register view */}
                <div className="h-4 pointer-events-none" aria-hidden="true" />
                <h1 className="font-display text-2xl lg:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                  Shape Your Software Engineering{" "}
                  <span className="bg-linear-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
                    Journey
                  </span>
                </h1>
                <p className="max-w-md text-sm font-light leading-relaxed text-slate-600">
                  Personalized career guidance and adaptive learning roadmaps
                  powered by AI. Navigate the complex software ecosystem with
                  crystal-clear direction.
                </p>
              </motion.div>
            )}
            
            {view === "register" && (
              <motion.div
                key="register-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-4 bg-brand-indigo" />
                  <span className="text-xs font-mono font-semibold tracking-widest text-brand-cyan uppercase">
                    Adaptive Learning
                  </span>
                </div>
                <h1 className="font-display text-2xl lg:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                  Build Your Future <br />
                  With{" "}
                  <span className="bg-linear-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
                    InteliPath
                  </span>
                </h1>
                <p className="max-w-md text-sm font-light leading-relaxed text-slate-600">
                  Discover your ideal software engineering development track,
                  benchmark your skills, map milestones, and reach premium
                  standard career outcomes.
                </p>
              </motion.div>
            )}

            {view === "forgot-password" && (
              <motion.div
                key="forgot-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-x-0 top-0 flex flex-col gap-3"
              >
                <div className="h-4 pointer-events-none" aria-hidden="true" />
                <h1 className="font-display text-2xl lg:text-[2rem] font-extrabold tracking-tight text-slate-900 leading-tight">
                  Recover Your Account{" "}
                  <span className="bg-linear-to-r from-brand-blue to-brand-indigo bg-clip-text text-transparent">
                    Securely
                  </span>
                </h1>
                <p className="max-w-md text-sm font-light leading-relaxed text-slate-600">
                  Don't let a forgotten password stop you. Verify your identity and get back to your learning path in just a few steps.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dots — always below ghost, always fully visible */}
        <div className="mt-4 flex gap-2">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${view === "login" ? "w-8 bg-brand-cyan" : "w-2 bg-slate-300"}`}
          />
          <div
            className={`h-1 rounded-full transition-all duration-300 ${view === "register" ? "w-8 bg-brand-indigo" : "w-2 bg-slate-300"}`}
          />
          <div
            className={`h-1 rounded-full transition-all duration-300 ${view === "forgot-password" ? "w-8 bg-brand-blue" : "w-2 bg-slate-300"}`}
          />
        </div>
      </div>
    </div>
  )
}
