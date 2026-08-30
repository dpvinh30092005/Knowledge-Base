import {
  Book,
  Building2,
  Calendar,
  Edit3,
  Mail,
  User,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Target
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import { SharedAppBackground } from "@/components"
import { MentorHeader } from "@/features/mentor/components/MentorHeader"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { useProfileSettings } from "@/features/shared/profile-settings"
import ChangePasswordCard from "@/features/shared/profile-settings/ui/ChangePasswordCard"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

export default function MentorProfileSettingsPage() {
  const {
    profileData,
    loading,
    saving,
    error,
    handleChange,
    handleSave,
    loadProfile,
    displayInitial
  } = useProfileSettings()

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const sparkleRef = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      // ── Entrance animations ──────────────────────────────────
      gsap.from(".page-header", {
        y: -50,
        opacity: 0,
        duration: 1.0,
        ease: "power4.out",
        delay: 0.05
      })

      gsap.from(".hero-icon", {
        scale: 0,
        rotation: -45,
        opacity: 0,
        duration: 0.9,
        ease: "back.out(2)",
        delay: 0.35
      })

      gsap.from(".section-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.4
      })

      // ── Sparkle twinkle (infinite loop) ─────────────────────
      if (sparkleRef.current) {
        const tl = gsap.timeline({ repeat: -1, delay: 1.2 })
        tl.to(sparkleRef.current, {
          scale: 1.3,
          opacity: 0.4,
          rotate: 20,
          duration: 0.35,
          ease: "power2.in"
        })
          .to(sparkleRef.current, {
            scale: 1.15,
            opacity: 1,
            rotate: -15,
            duration: 0.25,
            ease: "power2.out"
          })
          .to(sparkleRef.current, {
            scale: 1.4,
            opacity: 0.6,
            rotate: 10,
            duration: 0.3,
            ease: "power2.inOut"
          })
          .to(sparkleRef.current, {
            scale: 1,
            opacity: 1,
            rotate: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.5)"
          })
          .to(sparkleRef.current, {
            duration: 2.5
          })
      }
    },
    { scope: containerRef }
  )

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-transparent relative font-sans text-slate-900 overflow-hidden"
      ref={containerRef}
    >
      <SharedAppBackground />
      <MentorHeader
        user={user}
        activeTab=""
        onTabChange={(tab) =>
          navigate(ROUTES.DASHBOARD_MENTOR, { state: { activeTab: tab } })
        }
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-8 pt-[120px] pb-16 space-y-7 relative z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-slate-900 transition-all w-fit group mb-4 hover:-translate-x-1"
        >
          <ChevronLeft
            size={16}
            strokeWidth={2.5}
            className="text-slate-400 group-hover:text-slate-900 transition-colors"
          />
          Back to home
        </button>

        {/* ── Hero Banner ─────────────────────────────────────── */}
        <div className="page-header relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black p-7 md:p-9 shadow-[0_30px_60px_rgba(15,23,42,0.3)]">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-slate-500/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="hero-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-inner">
                <Sparkles
                  ref={sparkleRef}
                  size={28}
                  className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                />
              </div>
              <div>
                <p className="text-white/60 text-[12px] font-semibold uppercase tracking-widest mb-1">
                  Mentor Portal
                </p>
                <h1 className="text-white text-[26px] md:text-[30px] font-bold leading-tight">
                  Profile Settings
                </h1>
                <p className="text-white/70 text-[13px] mt-1">
                  Manage your professional identity and expertise areas
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onMouseEnter={(e) =>
                  gsap.to(e.currentTarget, {
                    scale: 1.05,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    duration: 0.3,
                    ease: "back.out(2)"
                  })
                }
                onMouseLeave={(e) =>
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    boxShadow: "none",
                    duration: 0.3,
                    ease: "power2.out"
                  })
                }
                onClick={(e) => {
                  gsap.fromTo(
                    e.currentTarget,
                    { scale: 0.95 },
                    { scale: 1.05, duration: 0.4, ease: "elastic.out(1, 0.3)" }
                  )
                  void loadProfile()
                }}
                disabled={loading || saving}
                className="flex items-center gap-2 text-[13px] font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-2xl transition-colors"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Reload
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 pb-10">
          <div className="flex-[2] space-y-6">
            {/* Identity Card */}
            <div className="section-card bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,0.04)] hover:border-slate-800/30 transition-colors">
              <div className="flex items-start gap-5 mb-8">
                <AvatarUpload initial={displayInitial} />
                <div className="mt-2">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    Professional Identity
                  </h2>
                  <p className="text-sm text-slate-500">
                    How you appear to students seeking guidance.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 text-center text-sm font-medium text-slate-400 animate-pulse">
                  Loading profile data...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <User size={16} className="text-slate-700" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name || ""}
                        onChange={(e) =>
                          handleChange("full_name", e.target.value)
                        }
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 transition-all hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Calendar size={16} className="text-slate-700" />
                        Year of Birth
                      </label>
                      <input
                        type="date"
                        value={profileData.yob || ""}
                        onChange={(e) => handleChange("yob", e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 transition-all hover:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Building2 size={16} className="text-slate-700" />
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={profileData.company || ""}
                        placeholder="e.g. Google, FPT Software"
                        onChange={(e) =>
                          handleChange("company", e.target.value)
                        }
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 transition-all hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700">
                        <Target size={16} className="text-slate-700" />
                        Industry Focus
                      </label>
                      <input
                        type="text"
                        value={profileData.industry_focus || ""}
                        placeholder="e.g. Software Engineering, Data Science"
                        onChange={(e) =>
                          handleChange("industry_focus", e.target.value)
                        }
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 transition-all hover:bg-white"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700">
                      <Book size={16} className="text-slate-700" />
                      Professional Bio
                    </label>
                    <textarea
                      rows={4}
                      value={profileData.bio || ""}
                      placeholder="Share your experience and how you can help students..."
                      onChange={(e) => handleChange("bio", e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/20 transition-all hover:bg-white resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onMouseEnter={(e) =>
                        gsap.to(e.currentTarget, {
                          scale: 1.05,
                          duration: 0.3,
                          ease: "back.out(2)",
                          backgroundColor: "#f1f5f9"
                        })
                      }
                      onMouseLeave={(e) =>
                        gsap.to(e.currentTarget, {
                          scale: 1,
                          duration: 0.3,
                          ease: "power2.out",
                          backgroundColor: "transparent"
                        })
                      }
                      onClick={(e) => {
                        gsap.fromTo(
                          e.currentTarget,
                          { scale: 0.95 },
                          {
                            scale: 1.05,
                            duration: 0.4,
                            ease: "elastic.out(1, 0.3)"
                          }
                        )
                        void loadProfile()
                      }}
                      disabled={saving}
                      className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-50 px-4 py-2.5 rounded-xl"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="button"
                      onMouseEnter={(e) =>
                        gsap.to(e.currentTarget, {
                          scale: 1.05,
                          y: -2,
                          boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.3)",
                          duration: 0.3,
                          ease: "back.out(2)"
                        })
                      }
                      onMouseLeave={(e) =>
                        gsap.to(e.currentTarget, {
                          scale: 1,
                          y: 0,
                          boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.2)",
                          duration: 0.3,
                          ease: "power2.out"
                        })
                      }
                      onClick={(e) => {
                        gsap.fromTo(
                          e.currentTarget,
                          { scale: 0.9 },
                          {
                            scale: 1.05,
                            duration: 0.5,
                            ease: "elastic.out(1, 0.3)"
                          }
                        )
                        handleSave()
                      }}
                      disabled={saving}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[13px] font-bold shadow-md shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="section-card bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] hover:border-slate-800/30 transition-colors">
              <h3 className="text-[15px] font-bold text-slate-900 mb-5">
                Account Security
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Mail size={13} />
                      Email Address
                    </p>
                    <p className="text-[14px] font-semibold text-slate-900">
                      {profileData.email || "Not set"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onMouseEnter={(e) =>
                      gsap.to(e.currentTarget, {
                        scale: 1.1,
                        y: -2,
                        duration: 0.3,
                        ease: "back.out(2)"
                      })
                    }
                    onMouseLeave={(e) =>
                      gsap.to(e.currentTarget, {
                        scale: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                      })
                    }
                    onClick={(e) =>
                      gsap.fromTo(
                        e.currentTarget,
                        { scale: 0.8 },
                        {
                          scale: 1.1,
                          duration: 0.4,
                          ease: "elastic.out(1, 0.3)"
                        }
                      )
                    }
                    className="text-slate-700 hover:text-slate-900 bg-white p-2 rounded-lg shadow-sm border border-slate-200"
                    aria-label="Edit email"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>

                <ChangePasswordCard />
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
