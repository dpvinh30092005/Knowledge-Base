import { useRef, useEffect, type ReactNode } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger)
import {
  ArrowRight,
  MapTrifold,
  Code,
  Terminal,
  GithubLogo,
  ChartLineUp,
  Brain,
  Briefcase,
  GraduationCap,
  Quotes,
  UserCirclePlus,
  Compass,
  RocketLaunch,
  Sparkle
} from "@phosphor-icons/react"
import { LoginDialog } from "@/features/shared/auth"
import { SharedAppBackground, Logo } from "@/components"

const FEATURES = [
  {
    icon: MapTrifold,
    title: "Personalized roadmap",
    description: "A learning path generated for your target career and re-ranked as you progress — no generic checklist.",
  },
  {
    icon: GithubLogo,
    title: "GitHub synchronization",
    description: "Connect your GitHub and let your real commits and repos count as evidence toward roadmap skills.",
  },
  {
    icon: ChartLineUp,
    title: "Live job market data",
    description: "Roles, salaries and skill demand pulled from real postings, matched against your current skill gap.",
  },
  {
    icon: Brain,
    title: "AI Virtual Mentor",
    description: "Ask about your transcript, your next course, or a role — get grounded answers backed by your own data.",
  },
  {
    icon: GraduationCap,
    title: "FPT curriculum mapping",
    description: "Subject codes like PRO192 or DBI202 are mapped straight onto the skills and roadmap nodes they teach.",
  },
  {
    icon: Briefcase,
    title: "Portfolio & evidence",
    description: "Turn transcripts, projects and GitHub activity into a shareable e-portfolio backing your skill claims.",
  },
]

const STEPS = [
  {
    icon: UserCirclePlus,
    step: "01",
    title: "Create your profile",
    description: "Sign in, tell us your major and target career, and optionally link GitHub or upload a transcript.",
  },
  {
    icon: Compass,
    step: "02",
    title: "Get your roadmap",
    description: "InteliPath builds a roadmap from your profile, highlighting what you already cover and what's missing.",
  },
  {
    icon: RocketLaunch,
    step: "03",
    title: "Build, track, get mentored",
    description: "Ship projects, sync commits, and ask the AI Mentor for guidance as your skill gap closes over time.",
  },
]

const TESTIMONIALS = [
  {
    quote: "I finally stopped bouncing between random YouTube tutorials. The roadmap told me exactly what was missing for a Backend role.",
    name: "Minh Anh",
    role: "Software Engineering student",
  },
  {
    quote: "Linking GitHub and seeing my own commits count toward the roadmap made progress feel real instead of just checkboxes.",
    name: "Duc Trong",
    role: "Final-year student",
  },
  {
    quote: "As a counselor, I can finally see where a whole class is stuck on skills instead of guessing from grades alone.",
    name: "Ms. Lan Huong",
    role: "Academic counselor",
  },
]

const Word = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className="inline-block overflow-hidden pb-1">
    <span className={`statement-word inline-block ${className}`}>{children}</span>
  </span>
)

export default function WelcomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1.2 } })
    
    // Navbar entry
    tl.fromTo(".floating-nav", 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    )
    
    // Hero Text Group
    tl.fromTo(".hero-elem", 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 1 },
      "-=0.4"
    )

    // Hero Cards Entry - CLEAN Wrapper Animation (No conflicts with Parallax)
    tl.fromTo(".card-wrapper",
      { 
        y: 100, 
        opacity: 0,
        scale: 0.85
      },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        stagger: 0.15, 
        duration: 1.4,
        ease: "back.out(1.2)"
      },
      "-=0.6"
    )

    // Subtle continuous breathing effect on Wrappers
    gsap.to(".card-wrapper", {
      y: "+=12",
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.2
    })

    // Scroll-triggered section reveals (Features / How it Works / Testimonials)
    gsap.utils.toArray<HTMLElement>(".scroll-section-head").forEach((el) => {
      gsap.fromTo(el,
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
        }
      )
    })

    // Card grids "pop in" with a slight alternating rotation instead of a flat fade.
    // Cards can opt into a permanent resting tilt via data-rest-rotate (e.g. testimonials).
    gsap.utils.toArray<HTMLElement>(".scroll-card-group").forEach((group) => {
      const cards = group.querySelectorAll<HTMLElement>(".scroll-card")
      gsap.fromTo(cards,
        { y: 40, opacity: 0, scale: 0.92, rotate: (i: number) => (i % 2 === 0 ? -3 : 3) },
        {
          y: 0, opacity: 1, scale: 1,
          rotate: (_i: number, target: HTMLElement) => Number(target.dataset.restRotate ?? 0),
          duration: 0.8, stagger: 0.12, ease: "back.out(1.6)",
          scrollTrigger: { trigger: group, start: "top 85%", toggleActions: "play none none none" }
        }
      )
    })

    // Big statement headline — masked word-by-word reveal on scroll
    gsap.fromTo(".statement-word",
      { yPercent: 120, opacity: 0 },
      {
        yPercent: 0, opacity: 1, duration: 1, stagger: 0.045, ease: "power4.out",
        scrollTrigger: { trigger: ".statement-block", start: "top 75%", toggleActions: "play none none none" }
      }
    )

    // Floating decorative chips beside the statement — scale/rotate in, then breathe
    gsap.fromTo(".statement-chip",
      { opacity: 0, scale: 0.7, rotate: (i: number) => (i % 2 === 0 ? -14 : 14) },
      {
        opacity: 1, scale: 1, rotate: (i: number) => (i % 2 === 0 ? -6 : 8),
        duration: 1, stagger: 0.15, ease: "back.out(1.8)",
        scrollTrigger: { trigger: ".statement-block", start: "top 75%", toggleActions: "play none none none" },
        onComplete: () => {
          gsap.to(".statement-chip", {
            y: "+=10", duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.2
          })
        }
      }
    )

  }, { scope: containerRef })

  // 3D Mouse Parallax - Applied to INNER layers for depth!
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 30; // Max 15px shift
      const y = (clientY / window.innerHeight - 0.5) * 30;
      
      const tiltX = y * -0.6; // Inverse mouse Y for natural tilt
      const tiltY = x * 0.6;  // Mouse X tilts Y axis
      
      gsap.to(".parallax-layer-1", { 
        x: x * 0.6, y: y * 0.6, 
        rotateX: tiltX, rotateY: tiltY,
        duration: 0.8, ease: "power2.out" 
      });
      gsap.to(".parallax-layer-2", { 
        x: x * 1.5, y: y * 1.5, 
        rotateX: tiltX * 1.5, rotateY: tiltY * 1.5,
        duration: 0.8, ease: "power2.out" 
      });
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} style={{ fontFamily: 'var(--font-manrope)' }} className="relative w-full min-h-screen bg-transparent text-[#0a0a0a] selection:bg-cyan-200 flex flex-col">
      
      {/* =========================================
          BACKGROUND - Unified App Grid
          ========================================= */}
      <SharedAppBackground />

      {/* =========================================
          FLOATING NAVBAR
          ========================================= */}
      <div className="floating-nav fixed inset-x-0 top-6 z-50 flex justify-center px-4 md:px-8 pointer-events-none opacity-0">
        <nav className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full bg-white/95 px-3 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md border border-slate-200/60 transition-all">
          
          {/* Left: Logo */}
          <div className="flex items-center pl-2">
            <Logo />
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden items-center gap-6 text-[13px] font-bold text-slate-500 lg:flex">
            <a href="#features" className="px-3 py-1.5 rounded-full hover:text-slate-800 transition-colors">Features</a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-full hover:text-slate-800 transition-colors">How it Works</a>
            <a href="#testimonials" className="px-3 py-1.5 rounded-full hover:text-slate-800 transition-colors">Testimonials</a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end">
            <LoginDialog>
              <button type="button" className="flex items-center gap-2 bg-[#0a0a0a] !text-white px-5 py-2 rounded-full text-[13px] font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                <span className="text-white">Log in</span> <ArrowRight size={12} weight="bold" className="text-white" />
              </button>
            </LoginDialog>
          </div>
        </nav>
      </div>

      {/* =========================================
          HERO SECTION (100vh Centered)
          ========================================= */}
      <main className="relative z-10 min-h-screen flex items-center px-6 sm:px-12 pb-10">
        <div className="mx-auto w-full max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
            
          {/* ---------------- LEFT CONTENT ---------------- */}
          <div className="flex flex-col items-start mt-8">

            <h1 className="hero-elem text-[clamp(3.5rem,6vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[#0a0a0a] mb-4 drop-shadow-sm opacity-0">
              InteliPath
            </h1>
            <h2 className="hero-elem text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.2] tracking-[-0.02em] text-[#3f3f46] mb-6 max-w-xl opacity-0">
              The AI-Powered Career Roadmap for Students
            </h2>

            <p className="hero-elem text-[18px] font-medium text-cyan-600 mb-8 opacity-0">
              Less guessing, more building.
            </p>

            <p className="hero-elem text-[16px] leading-[26px] text-[#52525b] mb-10 max-w-md opacity-0">
              Dynamic roadmaps that adapt to your GitHub commits, market trends, and learning pace. Stop wandering, start shipping.
            </p>

            <div className="hero-elem flex flex-wrap items-center gap-4 opacity-0">
              <LoginDialog>
                <button
                  type="button"
                  className="group flex h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-8 text-[15px] font-semibold !text-white transition-all duration-200 hover:bg-slate-800 shadow-[var(--shadow-taste-2)]"
                >
                  <span className="text-white">Start your roadmap</span> <ArrowRight size={14} weight="bold" className="text-white transition-transform group-hover:translate-x-1" />
                </button>
              </LoginDialog>
              <a
                href="#features"
                className="group flex h-[48px] items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-[#0a0a0a] transition-all duration-200 hover:bg-slate-50 shadow-[var(--shadow-taste-1)] border border-slate-200/60"
              >
                Read the docs <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1 text-slate-400" />
              </a>
            </div>
          </div>

          {/* ---------------- RIGHT CONTENT: STRUCTURED CARDS WITH 3D ---------------- */}
          <div className="relative w-full h-[540px] max-w-[640px] mx-auto hidden lg:block" style={{ perspective: "1600px" }}>
            
            {/* WRAPPER 1: Handles Static Positioning, Rotation Z, and Entrance Animation */}
            <div className="card-wrapper absolute top-4 right-0 z-10 opacity-0" style={{ transform: "rotateZ(2deg)" }}>
              {/* INNER LAYER 1: Handles Mouse Parallax (X, Y, RotateX, RotateY) */}
              <div className="parallax-layer-1 w-[520px] h-[340px] bg-[#ffffff]/90 backdrop-blur-xl rounded-[24px] p-2 shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-white" style={{ transformStyle: "preserve-3d" }}>
                <div className="w-full h-full bg-slate-50/50 rounded-[18px] border border-slate-100 overflow-hidden flex flex-col relative">
                  <div className="h-10 border-b border-slate-200/60 flex items-center px-4 justify-between bg-white/60">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="h-4 w-24 bg-slate-200/80 rounded-md" />
                    <div className="w-5 h-5 rounded-full bg-cyan-100" />
                  </div>
                  <div className="flex-1 p-8 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
                    <h3 className="text-[28px] font-medium text-slate-900 tracking-tight leading-none mb-8 relative z-10">
                      Frontend Architecture <br/> <span className="text-cyan-600 font-serif italic text-[32px]">mastery.</span>
                    </h3>
                    
                    {/* Nodes */}
                    <div className="absolute top-[130px] left-10 w-44 h-16 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center px-4 gap-3 z-10">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">01</div>
                      <div className="h-2 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="absolute top-[200px] left-32 w-52 h-16 bg-white border border-cyan-200 rounded-xl shadow-md flex items-center px-4 gap-3 ring-4 ring-cyan-50 z-10">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600"><Terminal size={14} weight="bold"/></div>
                      <div className="h-2.5 w-24 bg-slate-800 rounded-full" />
                    </div>
                    {/* Connecting lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                      <path d="M 120 160 C 120 180, 160 180, 160 210" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* WRAPPER 2 */}
            <div className="card-wrapper absolute bottom-6 left-0 z-20 opacity-0" style={{ transform: "rotateZ(-3deg)" }}>
              {/* INNER LAYER 2 */}
              <div className="parallax-layer-2 w-[420px] bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-[20px] p-1 shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/10" style={{ transformStyle: "preserve-3d" }}>
                <div className="w-full h-full bg-[#18181b]/50 rounded-[16px] overflow-hidden flex flex-col relative">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0a0a]/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-2"><Code size={12}/> RoadmapNode.tsx</span>
                    <div className="w-10" />
                  </div>
                  <div className="p-6 font-mono text-[13px] leading-[22px] text-slate-300">
                    <p><span className="text-pink-500">import</span> {'{'} <span className="text-cyan-300">Card</span> {'}'} <span className="text-pink-500">from</span> <span className="text-green-300">'@/ui/card'</span></p>
                    <p className="mt-5"><span className="text-pink-500">export default function</span> <span className="text-blue-400">Node</span>() {'{'}</p>
                    <p className="ml-4"><span className="text-pink-500">return</span> (</p>
                    <p className="ml-8"><span className="text-slate-400">&lt;</span><span className="text-cyan-400">Card</span> <span className="text-emerald-300">className</span><span className="text-slate-400">=</span><span className="text-green-300">"glass-card"</span><span className="text-slate-400">&gt;</span></p>
                    <p className="ml-12"><span className="text-slate-400">&lt;</span><span className="text-cyan-400">h1</span><span className="text-slate-400">&gt;</span>InteliPath<span className="text-slate-400">&lt;/</span><span className="text-cyan-400">h1</span><span className="text-slate-400">&gt;</span></p>
                    <p className="ml-12"><span className="text-slate-400">&lt;</span><span className="text-cyan-400">p</span><span className="text-slate-400">&gt;</span>Anti-Slop AI roadmaps.<span className="text-slate-400">&lt;/</span><span className="text-cyan-400">p</span><span className="text-slate-400">&gt;</span></p>
                    <p className="ml-8"><span className="text-slate-400">&lt;/</span><span className="text-cyan-400">Card</span><span className="text-slate-400">&gt;</span></p>
                    <p className="ml-4">)</p>
                    <p>{'}'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* =========================================
          STATEMENT SECTION — big masked headline
          ========================================= */}
      <section className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] relative">

          {/* Decorative floating chips */}
          <div className="statement-chip hidden md:flex absolute -top-4 right-[8%] w-40 h-24 rounded-2xl bg-white border border-slate-200/60 shadow-[var(--shadow-taste-3)] items-center justify-center gap-2 opacity-0">
            <GithubLogo size={22} weight="fill" className="text-[#0a0a0a]" />
            <span className="text-[13px] font-mono font-semibold text-[#0a0a0a]">git push</span>
          </div>
          <div className="statement-chip hidden md:flex absolute bottom-2 left-[6%] w-44 h-24 rounded-2xl bg-[#0a0a0a] shadow-[var(--shadow-taste-3)] items-center justify-center gap-2 opacity-0">
            <ChartLineUp size={22} weight="bold" className="text-cyan-400" />
            <span className="text-[13px] font-mono font-semibold text-white">+42% match</span>
          </div>

          <h2 className="statement-block text-[clamp(2.5rem,7vw,5.25rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[#0a0a0a] text-center flex flex-col items-center gap-1">
            <span className="flex flex-wrap justify-center gap-x-4">
              <Word>Stop</Word>
              <Word>guessing</Word>
            </span>
            <span className="flex flex-wrap justify-center items-baseline gap-x-4">
              <Word className="font-serif italic text-cyan-600">your career.</Word>
            </span>
            <span className="flex flex-wrap justify-center items-baseline gap-x-4 mt-2">
              <Word>Start</Word>
              <Word className="font-serif italic text-amber-500">shipping</Word>
              <Word>real skills.</Word>
            </span>
          </h2>

          <p className="statement-word inline-block w-full text-center text-[15px] font-medium text-[#71717a] mt-8">
            <Sparkle size={14} weight="fill" className="inline -mt-1 mr-1.5 text-cyan-500" />
            Powered by your GitHub, your transcript, and live job market data.
          </p>
        </div>
      </section>

      {/* =========================================
          FEATURES SECTION
          ========================================= */}
      <section id="features" className="relative z-10 px-6 sm:px-12 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="scroll-section-head max-w-2xl mb-10 opacity-0">
            <span className="inline-block text-[13px] font-bold text-cyan-600 uppercase tracking-wide mb-3">Features</span>
            <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[#0a0a0a] mb-4">
              Everything you need to plan the next step.
            </h2>
            <p className="text-[16px] leading-[26px] text-[#52525b]">
              Not another static curriculum. InteliPath connects your real activity to a roadmap that keeps pace with you.
            </p>
          </div>

          {/* Bento row 1: hero feature (dark, with mini mockup) + GitHub accent card */}
          <div className="scroll-card-group grid grid-cols-12 gap-5 mb-5">
            <div className="scroll-card col-span-12 md:col-span-7 relative overflow-hidden rounded-[24px] bg-[#0a0a0a] p-8 shadow-[var(--shadow-taste-3)] opacity-0">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-1">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400 mb-5">
                    <MapTrifold size={20} weight="bold" />
                  </div>
                  <h3 className="text-[19px] font-semibold text-white mb-2">{FEATURES[0].title}</h3>
                  <p className="text-[14px] leading-[22px] text-slate-400 max-w-sm">{FEATURES[0].description}</p>
                </div>
                {/* mini roadmap mockup */}
                <div className="hidden sm:flex flex-col gap-2.5 w-full md:w-[220px] shrink-0">
                  {[
                    { label: "Git & GitHub", done: true },
                    { label: "REST APIs", done: true },
                    { label: "Docker", done: false },
                  ].map((n) => (
                    <div key={n.label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${n.done ? "bg-white/5 border-white/10" : "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20"}`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${n.done ? "bg-emerald-400/20 text-emerald-300" : "bg-cyan-400/20 text-cyan-300"}`}>
                        {n.done ? "✓" : "•"}
                      </span>
                      <span className="h-2 flex-1 rounded-full bg-white/15" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="scroll-card col-span-12 md:col-span-5 group relative overflow-hidden rounded-[24px] bg-cyan-50/70 border border-cyan-100 p-8 shadow-[var(--shadow-taste-1)] transition-all duration-300 hover:shadow-[var(--shadow-taste-3)] hover:-translate-y-1 opacity-0">
              <GithubLogo size={120} weight="fill" className="absolute -bottom-6 -right-6 text-cyan-600/10 transition-transform duration-500 group-hover:rotate-12" />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-cyan-600 mb-5 shadow-[var(--shadow-taste-1)]">
                  <GithubLogo size={20} weight="bold" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#0a0a0a] mb-2">{FEATURES[1].title}</h3>
                <p className="text-[14px] leading-[22px] text-[#3f3f46]">{FEATURES[1].description}</p>
              </div>
            </div>
          </div>

          {/* Bento row 2: remaining features, 4 across */}
          <div className="scroll-card-group grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.slice(2).map((feature) => (
              <div
                key={feature.title}
                className="scroll-card group rounded-[20px] bg-white/90 backdrop-blur-xl border border-slate-200/60 p-7 shadow-[var(--shadow-taste-1)] transition-all duration-300 hover:shadow-[var(--shadow-taste-3)] hover:-translate-y-1 opacity-0"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-5 transition-colors group-hover:bg-cyan-100">
                  <feature.icon size={20} weight="bold" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#0a0a0a] mb-2">{feature.title}</h3>
                <p className="text-[14px] leading-[22px] text-[#52525b]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          HOW IT WORKS SECTION
          ========================================= */}
      <section id="how-it-works" className="relative z-10 px-6 sm:px-12 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="scroll-section-head max-w-2xl mb-10 opacity-0">
            <span className="inline-block text-[13px] font-bold text-cyan-600 uppercase tracking-wide mb-3">How it Works</span>
            <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[#0a0a0a] mb-4">
              From sign-up to shipped, in three steps.
            </h2>
          </div>

          <div className="scroll-card-group relative grid md:grid-cols-3 gap-10 md:gap-6">
            {/* connecting dashed line across the row, sits behind the circle nodes */}
            <div className="hidden md:block absolute top-[34px] left-[16.5%] right-[16.5%] border-t-2 border-dashed border-slate-300 -z-10" />

            {STEPS.map((step, i) => {
              const accent = [
                { bg: "bg-[#0a0a0a]", text: "text-white", badge: "bg-[#0a0a0a] text-white" },
                { bg: "bg-cyan-500", text: "text-white", badge: "bg-cyan-500 text-white" },
                { bg: "bg-amber-500", text: "text-white", badge: "bg-amber-500 text-white" },
              ][i]
              return (
                <div key={step.step} className="scroll-card flex flex-col items-center text-center opacity-0">
                  <div className="relative mb-6">
                    <div className={`w-[68px] h-[68px] rounded-full ${accent.bg} ${accent.text} flex items-center justify-center shadow-[var(--shadow-taste-3)] ring-8 ring-[#f8fafc]`}>
                      <step.icon size={26} weight="bold" />
                    </div>
                    <span className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full ${accent.badge} text-[11px] font-mono font-bold flex items-center justify-center ring-2 ring-[#f8fafc]`}>
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#0a0a0a] mb-2">{step.title}</h3>
                  <p className="text-[14px] leading-[22px] text-[#52525b] max-w-[260px]">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================
          TESTIMONIALS SECTION
          ========================================= */}
      <section id="testimonials" className="relative z-10 px-6 sm:px-12 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="scroll-section-head max-w-2xl mb-10 opacity-0">
            <span className="inline-block text-[13px] font-bold text-cyan-600 uppercase tracking-wide mb-3">Testimonials</span>
            <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[#0a0a0a] mb-4">
              Built with students and counselors, not just for them.
            </h2>
          </div>

          <div className="scroll-card-group grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => {
              const dark = i === 1
              const restRotate = i === 0 ? -1.5 : i === 2 ? 1.5 : 0
              return (
                <div
                  key={t.name}
                  data-rest-rotate={restRotate}
                  className={`scroll-card rounded-[20px] p-8 shadow-[var(--shadow-taste-2)] flex flex-col opacity-0 transition-transform duration-300 hover:-translate-y-1 ${
                    dark
                      ? "bg-[#0a0a0a] md:-translate-y-3"
                      : "bg-white/90 backdrop-blur-xl border border-slate-200/60"
                  }`}
                >
                  <Quotes size={28} weight="fill" className={dark ? "text-white/20 mb-4" : "text-cyan-100 mb-4"} />
                  <p className={`text-[15px] leading-[24px] mb-6 flex-1 ${dark ? "text-slate-200" : "text-[#3f3f46]"}`}>"{t.quote}"</p>
                  <div className={`flex items-center gap-3 pt-4 border-t ${dark ? "border-white/10" : "border-slate-100"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] ${dark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-50 text-cyan-600"}`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${dark ? "text-white" : "text-[#0a0a0a]"}`}>{t.name}</p>
                      <p className={`text-[12px] ${dark ? "text-slate-400" : "text-[#71717a]"}`}>{t.role}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================
          FOOTER
          ========================================= */}
      <footer className="relative z-10 px-6 sm:px-12 py-10 border-t border-slate-200/60">
        <div className="mx-auto w-full max-w-[1400px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-[13px] text-[#71717a]">© {new Date().getFullYear()} InteliPath. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
