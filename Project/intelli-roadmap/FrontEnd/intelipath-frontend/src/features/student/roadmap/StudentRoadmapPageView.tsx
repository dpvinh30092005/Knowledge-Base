import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ReactFlowProvider } from '@xyflow/react'
import { consumeJustMarkedNodes } from './justMarkedNodes'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  CaretDown,
  GitFork,
  GithubLogo,
  ShieldCheck,
  GraduationCap,
  LinkSimple,
  ListChecks,
  LockKey,
  MapTrifold,
  MagnifyingGlass,
  Palette,
  PencilSimple,
  Target,
  TreeStructure,
  X,
  YoutubeLogo
} from "@phosphor-icons/react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, SharedAppBackground, Input, RouteProgressBar } from "@/components/ui"
import { useAuth } from "@/context"
import { isUuid, formatPrerequisite } from "@/lib/utils"
import { ROUTES } from "@/shared"
import { useStudentSetup } from "../hooks"
import { useStudentLevel } from "../level"
import { CareerAffinityHint, useCareerAffinity } from "../career-affinity"
import { studentDashboardService } from "../services"
import type { CareerRole, ChoiceOptions, NodeSelection, StudentRoadmap } from "../types"
import ConfirmModal from "@/components/modals/ConfirmModal"
import StudentProfileSetupModal from "@/features/student/onboarding/StudentProfileSetupModal"
import StudentSkillSelectionModal from "@/features/student/onboarding/StudentSkillSelectionModal"
import StudentSkillAssessmentModal from "@/features/student/onboarding/StudentSkillAssessmentModal"
import StudentHeader from "@/features/student/common/StudentHeader"
import { RoadmapVectorGraph } from "./RoadmapVectorGraph"
import RoadmapRecommendationsPanel from "./RoadmapRecommendationsPanel"
import LearningPlanPanel from "./LearningPlanPanel"
import RoadmapBreadcrumb from "./RoadmapBreadcrumb"
import MarketChoiceRail from "./MarketChoiceRail"
import SkillPostingsPanel from "./SkillPostingsPanel"
import { MIN_OPTIONS, buildChoiceGroups } from "./marketChoiceData"
import FptCurriculumPanel from "@/features/student/courses/FptCurriculumPanel"
import StageLegend from "./StageLegend"
import ResourceViewerModal, { getYouTubeId, type ViewerResource } from "./ResourceViewerModal"
import { getStageStyle } from "../lib/stageColors"
import { GithubSyncModal } from "@/features/shared/portfolio/components/GithubSyncModal"
import { persistImportedGithubProjects } from "../level/VerifyEvidenceNudge"

gsap.registerPlugin(useGSAP)

type StudentProfileResponse = {
  careerId?: string
  career_id?: string
  careerName?: string
  career_name?: string
  career?: {
    careerId?: string
    career_id?: string
    id?: string
    careerName?: string
    career_name?: string
    name?: string
  }
}

const unwrapProfile = (responseData: unknown): StudentProfileResponse | null => {
  if (!responseData || typeof responseData !== "object") return null
  if ("data" in responseData) return unwrapProfile((responseData as { data: unknown }).data)
  return responseData as StudentProfileResponse
}

const getProfileCareerId = (profile: StudentProfileResponse | null) =>
  [
    profile?.careerId,
    profile?.career_id,
    profile?.career?.careerId,
    profile?.career?.career_id,
    profile?.career?.id
  ].find((careerId): careerId is string => Boolean(careerId && isUuid(careerId))) || null

const getProfileCareerName = (profile: StudentProfileResponse | null) =>
  profile?.careerName ||
  profile?.career_name ||
  profile?.career?.careerName ||
  profile?.career?.career_name ||
  profile?.career?.name

const CareerSelector = ({
  careers,
  selectedCareerId,
  currentCareerId,
  searchValue,
  isSaving,
  errorMessage,
  onSearchChange,
  onSelectCareer,
  onSave,
  onCancel
}: {
  careers: CareerRole[]
  selectedCareerId: string
  currentCareerId: string | null
  searchValue: string
  isSaving: boolean
  errorMessage?: string
  onSearchChange: (value: string) => void
  onSelectCareer: (careerId: string) => void
  onSave: () => void
  onCancel?: () => void
}) => {
  const filteredCareers = careers.filter((career) =>
    career.careerName.toLowerCase().includes(searchValue.trim().toLowerCase())
  )

  return (
    <div className="roadmap-gsap-panel w-full max-w-3xl mx-auto bg-white rounded-[2rem] p-1.5 ring-1 ring-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] relative z-50 flex flex-col max-h-[75vh]">
      <div className="bg-[#FCFCFC] rounded-[calc(2rem-0.375rem)] flex flex-col overflow-hidden border border-black/[0.04] flex-1 min-h-0">
        
        {/* Header section */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-black/[0.04] text-center w-full shrink-0 bg-white">
           <h1 className="text-[24px] md:text-[28px] font-bold tracking-tight text-slate-900">
             Change Career Path
           </h1>
        </div>

        <div className="p-6 md:p-8 flex-1 min-h-0 flex flex-col">
          {/* Search bar */}
          <div className="relative mb-6 shrink-0">
            <MagnifyingGlass size={20} weight="light" className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search available career roles..."
              className="w-full h-14 pl-14 pr-6 bg-white rounded-full border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {errorMessage && (
            <div className="mb-6 max-w-xl mx-auto rounded-xl border border-rose-100 bg-rose-50/50 px-5 py-4 text-[14px] font-medium text-rose-600 text-center">
              {errorMessage}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-2 pb-2">
            {filteredCareers.map(career => {
               const isSelected = selectedCareerId === career.careerId;
               const isCurrent = currentCareerId === career.careerId;
               return (
                 <button
                   key={career.careerId}
                   type="button"
                   onClick={() => onSelectCareer(career.careerId)}
                   className={`text-left p-1 rounded-2xl transition-all duration-300
                     ${isSelected ? 'bg-black shadow-[0_8px_20px_rgba(0,0,0,0.12)] scale-[1.01] ring-1 ring-black' : 'bg-transparent hover:bg-black/5'}
                   `}
                 >
                   <div className={`w-full h-full min-h-[100px] rounded-[calc(1rem-0.25rem)] p-4 flex flex-col transition-colors duration-300
                     ${isSelected ? 'bg-[#111]' : 'bg-white shadow-sm ring-1 ring-black/[0.04]'}
                   `}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                         <h3 className={`text-[14px] font-bold tracking-tight transition-colors
                           ${isSelected ? 'text-white' : 'text-slate-900'}
                         `}>{career.careerName}</h3>
                         {isCurrent && (
                           <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded flex-shrink-0
                             ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}
                           `}>Current</span>
                         )}
                      </div>
                      <p className={`text-[12px] leading-relaxed line-clamp-2 mt-auto transition-colors
                        ${isSelected ? 'text-white/60' : 'text-slate-500'}
                      `}>
                        {career.description || formatPrerequisite(career.prerequisite) || 'Select to view roadmap.'}
                      </p>
                   </div>
                 </button>
               )
            })}
            
            {!filteredCareers.length && (
              <div className="col-span-full min-h-[160px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <p className="text-[14px] font-medium text-slate-500">No career roles found.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-black/[0.04]">
             {onCancel && (
               <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
             )}
             <button
               type="button"
               disabled={!selectedCareerId || isSaving}
               onClick={onSave}
               className={`group flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl transition-all active:scale-[0.98] ${!selectedCareerId ? 'opacity-40 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
             >
               <span className="text-[13px] font-semibold">
                 {isSaving ? "Saving..." : "Confirm"}
               </span>
               {!isSaving && <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Friendly source names for common resource domains; falls back to the hostname.
const KNOWN_SOURCES: Record<string, string> = {
  "roadmap.sh": "roadmap.sh",
  "developer.mozilla.org": "MDN Web Docs",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "github.com": "GitHub",
  "freecodecamp.org": "freeCodeCamp",
  "cloudflare.com": "Cloudflare",
  "w3schools.com": "W3Schools",
  "aws.amazon.com": "AWS Docs",
  "learn.microsoft.com": "Microsoft Learn",
  "postgresql.org": "PostgreSQL Docs",
  "redis.io": "Redis Docs",
  "docs.docker.com": "Docker Docs",
  "kubernetes.io": "Kubernetes Docs",
}

// Derive a readable label + short path from a raw resource URL.
const getLinkMeta = (raw: string): { label: string; path: string } => {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, "")
    return { label: KNOWN_SOURCES[host] || host, path: (host + u.pathname).replace(/\/$/, "") }
  } catch {
    return { label: raw, path: raw }
  }
}

export default function StudentRoadmapPageView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)
  // Phone only: the tools stack starts folded so the canvas is what you land on.
  // Above `sm` the CSS shows the stack regardless and this never comes into play.
  // Which tool panel is open beside the canvas, or null for none. One at a time
  // and closed by default: the roadmap is what the page is for, and three stacked
  // widgets used to cover a third of it before the student had read anything.
  const [activeTool, setActiveTool] = useState<null | 'career' | 'plan' | 'choices' | 'ai' | 'legend'>(null)
  const [githubImportOpen, setGithubImportOpen] = useState(false)
  const [careers, setCareers] = useState<CareerRole[]>([])
  const [careerSearch, setCareerSearch] = useState("")
  const [selectedCareerId, setSelectedCareerId] = useState("")
  const [currentCareerId, setCurrentCareerId] = useState<string | null>(null)
  const [currentCareerName, setCurrentCareerName] = useState<string | undefined>()
  const [isChangingCareer, setIsChangingCareer] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false)
  const [isSavingCareer, setIsSavingCareer] = useState(false)
  const [themeColor, setThemeColor] = useState('cyan')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [roadmapData, setRoadmapData] = useState<StudentRoadmap | null>(null)
  // Which standalone roadmap is open, or null for the career's own path.
  const [subRoadmapId, setSubRoadmapId] = useState<string | null>(null)
  // Bumped after an FPT-subject save so the recommendations panel reloads.
  const [recsRefresh, setRecsRefresh] = useState(0)
  // Right-docked FPT curriculum panel (blends into background like node detail).
  const [showFptPanel, setShowFptPanel] = useState(false)
  // Only FPT accounts are offered the FPT curriculum and its material. The backend
  // enforces this too (null fptCoverage, 403 on the curriculum endpoints); this flag
  // just keeps the UI from advertising what it would refuse.
  const [isFptAccount, setIsFptAccount] = useState(false)
  
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null)
  // Topics the student has opened. The server sends only the top two levels by
  // default — Backend alone holds 1.678 nodes — so going deeper is an explicit
  // request, and it is kept here so every later refetch keeps them open.
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([])
  // Resource currently open in the smart viewer modal.
  const [activeResource, setActiveResource] = useState<ViewerResource | null>(null)
  const [isUpdatingNode, setIsUpdatingNode] = useState(false);
  const [optimisticStatusMap, setOptimisticStatusMap] = useState<Record<string, string>>({});

  // Choose-one selections (which alternative is picked in each CHOOSE_ONE group).
  const [selections, setSelections] = useState<NodeSelection[]>([]);
  const [pendingChoice, setPendingChoice] = useState<any | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  // Node awaiting a "mark as completed" confirmation.
  const [pendingComplete, setPendingComplete] = useState<any | null>(null);

  /**
   * The marking wave, held only while it plays.
   *
   * <p>A student who declares their skills or sits the paper has the server mark
   * every node that evidence covers. Before this the canvas simply refetched and
   * a different set of ticks was silently already there, which reads as nothing
   * having happened — so the work the assessment did was invisible to the person
   * who did it. These ids drive the animation, and are cleared once it ends
   * because "just marked" is an event, not a property of the node.
   */
  const [justMarked, setJustMarked] = useState<{ ids: string[]; source: 'assessment' | 'skills' } | null>(null);
  const markWaveConsumed = useRef(false);

  /**
   * The skill whose job ads are open.
   *
   * <p>Every market figure the canvas shows is an aggregate, and an aggregate
   * nobody can open is a number taken on trust — a poor basis for choosing the
   * language your whole roadmap hangs off. This is the way in to what the count
   * is made of.
   */
  const [postingsFor, setPostingsFor] = useState<{ skillId: string; skillName: string } | null>(null);
  const chosenNodeIds = useMemo(
    () => new Set(selections.map(s => s.chosenNodeId)),
    [selections]
  );
  const roadmapProgress = Math.max(0, Math.min(100, Math.round(roadmapData?.progress ?? 0)));

  // The same pure builder the canvas uses, off the payload the page already
  // fetched — no second request, and the rail can never disagree with the graph
  // about which options a group holds.
  const graphNodes = useMemo(() => {
    if (!roadmapData?._rawResponse) return [];
    try {
      return studentDashboardService.buildRoadmapGraph(roadmapData._rawResponse).nodes;
    } catch {
      // The rail is commentary; losing it must not take down the roadmap.
      return [];
    }
  }, [roadmapData]);

  // Ranked alternatives per CHOOSE_ONE group, for the option clusters on the
  // canvas. Fetched off the graph the page already built, so a group that is not
  // on screen costs no request.
  const [choiceGroups, setChoiceGroups] = useState<ChoiceOptions[]>([])
  // The clusters only need the option arrays; the rail needs group names too, so
  // the full objects are kept and this is derived rather than fetched twice.
  const choiceOptionsByGroup = useMemo(
    () => Object.fromEntries(choiceGroups.map(g => [g.groupNodeId, g.options])),
    [choiceGroups]
  )

  // Whether the ranked-choices panel has anything to say. Asked of both sources
  // the rail itself reads, in the same order, so the button can never open onto
  // an empty panel — and never hide a ranking the rail would have drawn.
  const hasChoices = useMemo(() => {
    if (choiceGroups.some(group => group.options.length >= MIN_OPTIONS)) return true
    return buildChoiceGroups(graphNodes as never, selections).length > 0
  }, [choiceGroups, graphNodes, selections])

  /**
   * The icon rail, in the order it is drawn.
   *
   * <p>Built here rather than inline in the JSX because one entry is
   * conditional, and a conditional spread inside an `as const` array stops
   * TypeScript from narrowing `id` to the union {@link activeTool} is typed
   * against — which would let a typo compile.
   */
  const tools: { id: NonNullable<typeof activeTool>; icon: typeof Target; label: string }[] = [
    { id: 'career', icon: Target, label: 'Target career & progress' },
    // Sits directly under 'career' because it answers the question that follows
    // picking one: not "what exists" but "what now".
    { id: 'plan', icon: ListChecks, label: 'What to learn next' },
    // The choices behind this particular roadmap, ranked by the job market.
    //
    // It used to float on its own at `left-16 top-16`, which is the exact
    // rectangle this dock's panel opens into — so opening any tool stacked a
    // second panel on top of the ranking instead of replacing it. A tool rail
    // whose panels do not exclude each other is not a tool rail. Offered only
    // when there is a fork to explain: on a roadmap with no CHOOSE_ONE group the
    // panel would open empty, and a button that does nothing costs more trust
    // than it saves.
    ...(hasChoices
      ? [{ id: 'choices' as const, icon: GitFork, label: 'Your choices, ranked by the market' }]
      : []),
    { id: 'ai', icon: TreeStructure, label: 'AI suggestions' },
    { id: 'legend', icon: Palette, label: 'Stage legend' },
  ]

  useEffect(() => {
    const groupIds = graphNodes
      .filter((node: any) => String(node?.data?.selection || '').toUpperCase() === 'CHOOSE_ONE')
      .map((node: any) => node.id)
    if (groupIds.length === 0) {
      setChoiceGroups([])
      return
    }
    let cancelled = false
    void Promise.all(
      groupIds.map((id: string) =>
        studentDashboardService.getChoiceOptions(id).catch(() => null)
      )
    ).then(results => {
      if (cancelled) return
      // The clusters draw without this — names, ticks and the chosen chip all
      // come from the roadmap payload. Losing the ranking costs the recommended
      // highlight and drops the rail back to relevance-filtered demand, which is
      // the right order to lose things in.
      setChoiceGroups(results.filter((r): r is ChoiceOptions => r != null))
    })
    return () => { cancelled = true }
  }, [graphNodes])

  // Commit straight from a chip: a click on an alternative is already an
  // unambiguous statement of intent, and a confirm step here would be a modal
  // between the student and a decision they can reverse by clicking another chip.
  const selectFromCluster = async (groupNodeId: string, optionNodeId: string) => {
    if (isSelecting) return
    setIsSelecting(true)
    try {
      await studentDashboardService.selectAlternative(groupNodeId, optionNodeId)
      await loadRoadmap()
      setOptimisticStatusMap({})
    } catch (error) {
      console.error("[Student Roadmap] Failed to select alternative:", error)
    } finally {
      setIsSelecting(false)
    }
  }

  const { activeSetupStep, openSkillSelection, openAssessment, goBackToProfile, goBackToSkills, completeSetup } = useStudentSetup(user?.id)
  const { level: studentLevel, reload: reloadStudentLevel } = useStudentLevel()

  const handleAssessmentComplete = async () => {
    completeSetup()
    await reloadStudentLevel()
    await loadRoadmap()
  }
  // Suggestion only: this list never sets the career, it just orders the options
  // and shows the count behind each one.
  const { affinities } = useCareerAffinity(3)

  const loadSelections = async () => {
    try {
      setSelections(await studentDashboardService.getRoadmapSelections())
    } catch (error) {
      console.error("[Student Roadmap] Failed to load selections:", error)
      setSelections([])
    }
  }

  /**
   * Refetch whatever the student is currently looking at.
   *
   * <p>The single place that decides between the career roadmap and an open
   * sub-roadmap. It used to be decided three times — here, in `expandNode` and in
   * the background sync after a status update — and the last two always asked for
   * the career view. So marking a node complete inside C#'s 269-node roadmap
   * silently swapped the canvas back out to the career path, which read as the
   * click having broken something.
   *
   * <p>`expanded` is passed rather than read off state so a caller that has just
   * computed the next set does not have to wait a render for it.
   */
  const fetchCurrentView = (expanded: string[] = expandedNodeIds) =>
    subRoadmapId
      ? studentDashboardService.getStudentSubRoadmap(subRoadmapId, expanded)
      : studentDashboardService.getStudentRoadmap(expanded)

  const loadRoadmap = async () => {
    setIsRoadmapLoading(true)
    setErrorMessage(undefined)
    try {
      const [nextRoadmap] = await Promise.all([fetchCurrentView(), loadSelections()])
      setRoadmapData(nextRoadmap)
    } catch (error) {
      console.error("[Student Roadmap] Failed to load roadmap:", error)
      setRoadmapData(null)
      setErrorMessage("Roadmap data is not available yet.")
    } finally {
      setIsRoadmapLoading(false)
    }
  }

  const handleGithubImported = async (projects: any[]) => {
    setGithubImportOpen(false)
    try {
      await persistImportedGithubProjects(projects)
    } catch (error) {
      // Evidence and roadmap refresh already happened server-side. Portfolio
      // persistence is useful, but it must not hide the learning-path update.
      console.warn('[Roadmap] Import counted, but portfolio persistence failed:', error)
    }
    await Promise.all([reloadStudentLevel(), loadRoadmap()])
  }

  // Entering or leaving a standalone roadmap swaps the whole view, so it refetches
  // rather than filtering what is already loaded: the career payload never held
  // the sub-roadmap's nodes in the first place.
  const openSubRoadmap = (nodeId: string | null) => {
    setSelectedNodeData(null)
    setActiveTool(null)
    // Expansions belong to the view they were made in. Carrying them across
    // would send the career roadmap's opened topics to the sub-roadmap endpoint,
    // which knows none of those ids, and grow the list without bound as the
    // student walks in and out of tracks.
    setExpandedNodeIds([])
    setSubRoadmapId(nodeId)
  }

  useEffect(() => {
    if (currentCareerId) void loadRoadmap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subRoadmapId])

  // Commit a choice: pick this alternative within its CHOOSE_ONE group, then
  // refetch (statuses, progress and greyed alternatives all move server-side).
  const confirmChoice = async () => {
    if (!pendingChoice || isSelecting) return;
    const groupNodeId = pendingChoice.parentNodeId;
    if (!groupNodeId) { setPendingChoice(null); return; }
    setIsSelecting(true);
    try {
      await studentDashboardService.selectAlternative(groupNodeId, pendingChoice.id);
      await loadRoadmap();
      setOptimisticStatusMap({});
      // Reflect the pick immediately in the open detail panel.
      setSelectedNodeData((prev: any) => prev ? { ...prev, isChosen: true } : prev);
      setPendingChoice(null);
    } catch (error) {
      console.error("[Student Roadmap] Failed to select alternative:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleUpdateNodeStatus = async (newStatus: string) => {
    if (!selectedNodeData || isUpdatingNode) return;
    const prevStatus = selectedNodeData.status; // Added to prevent ReferenceError
    setIsUpdatingNode(true);
    try {
      // 1. Gửi request lên Backend (nếu lỗi sẽ văng xuống catch)
      await studentDashboardService.updateNodeProgress(selectedNodeData.id, newStatus, subRoadmapId);
      
      // 2. Cập nhật lạc quan (Optimistic Update)
      setSelectedNodeData({ ...selectedNodeData, status: newStatus });
      if (roadmapData && roadmapData.nodes) {
        const updatedNodes = roadmapData.nodes.map(node => 
          node.id === selectedNodeData.id ? { ...node, status: newStatus as any } : node
        );
        setRoadmapData({ ...roadmapData, nodes: updatedNodes });
      }
      setOptimisticStatusMap(prev => ({ ...prev, [selectedNodeData.id]: newStatus }));

      // 3. Gọi ngầm Backend để lấy cây Roadmap mới nhất (đã được tính toán Auto-Unlock)
      fetchCurrentView().then(freshData => {
        if (freshData) {
          setRoadmapData(freshData);
          // Xóa map lạc quan vì data thật đã về
          setOptimisticStatusMap({});
        }
      }).catch(err => console.error("Background sync failed", err));

    } catch (error) {
      console.error("Failed to update node status", error);
      setSelectedNodeData(prev => prev ? { ...prev, status: prevStatus } : null);
      setOptimisticStatusMap(prev => {
        const newMap = { ...prev };
        delete newMap[selectedNodeData.id];
        return newMap;
      });
    } finally {
      setIsUpdatingNode(false);
    }
  };

  /**
   * Set any node's status, without it having to be the one in the drawer.
   *
   * <p>{@link handleUpdateNodeStatus} was the only way to move a node, and it
   * reads `selectedNodeData` — so changing a status cost a click to open the
   * drawer, a read of a panel the student did not ask for, and a click to close
   * it. On a board of a hundred nodes that is the whole interaction budget spent
   * on bookkeeping. This is the same write, addressable by id, so the card can
   * offer it directly.
   *
   * <p>Optimistic, with the same rollback: the map is the canvas's source of
   * truth until the refetch lands, and a failed write removes its own entry
   * rather than leaving a tick the server never accepted.
   */
  const setNodeStatus = useCallback(async (nodeId: string, newStatus: string) => {
    if (!nodeId) return
    const previous = optimisticStatusMap[nodeId]
    setOptimisticStatusMap(prev => ({ ...prev, [nodeId]: newStatus }))
    // Keep the drawer honest if it happens to be showing this node.
    setSelectedNodeData((prev: any) => prev?.id === nodeId ? { ...prev, status: newStatus } : prev)
    try {
      await studentDashboardService.updateNodeProgress(nodeId, newStatus, subRoadmapId)
      const freshData = await fetchCurrentView()
      if (freshData) {
        setRoadmapData(freshData)
        setOptimisticStatusMap({})
      }
    } catch (error) {
      console.error("[Student Roadmap] Failed to set node status:", error)
      setOptimisticStatusMap(prev => {
        const next = { ...prev }
        if (previous === undefined) delete next[nodeId]
        else next[nodeId] = previous
        return next
      })
    }
  }, [optimisticStatusMap, expandedNodeIds, subRoadmapId])

  /**
   * Collect the marking wave, once the canvas has nodes to draw it on.
   *
   * <p>Waits for `roadmapData` deliberately: the ids arrive before the fetch
   * that renders them, and starting the animation against an empty canvas would
   * spend the whole wave on nothing. The handoff clears itself on read, and the
   * ref stops a second collection, so a refetch cannot replay it.
   */
  useEffect(() => {
    if (markWaveConsumed.current) return
    if (!roadmapData?.nodes?.length) return
    const handoff = consumeJustMarkedNodes()
    markWaveConsumed.current = true
    if (!handoff) return
    // Only what is actually on screen. The visibility filter caps depth, so some
    // marked nodes live inside topics the student has not opened; announcing
    // twelve while drawing three would be a worse claim than announcing three.
    const onCanvas = new Set(roadmapData.nodes.map((node: any) => String(node.id)))
    const visible = handoff.ids.filter(id => onCanvas.has(id))
    if (!visible.length) return
    setJustMarked({ ids: visible, source: handoff.source })
  }, [roadmapData])

  /**
   * Re-read the level once the setup flow closes.
   *
   * <p>`useStudentLevel` fetches on mount, and the assessment modal holds its
   * own instance of the hook — so the modal's `reload()` refreshed a copy this
   * page never sees. The header therefore kept the value it read while the
   * student was still mid-onboarding, which is null, and stayed null until a
   * full page reload. It looked level-specific because a session that happened
   * to have been reloaded showed its level fine.
   *
   * <p>Keyed on the step leaving a modal state rather than on `completeSetup`,
   * so backing out of the flow refreshes too — the level can have moved by then
   * either way.
   */
  const previousSetupStep = useRef(activeSetupStep)
  useEffect(() => {
    const wasInSetup = previousSetupStep.current != null
    previousSetupStep.current = activeSetupStep
    if (wasInSetup && activeSetupStep == null) {
      reloadStudentLevel()
    }
  }, [activeSetupStep, reloadStudentLevel])

  // The wave is an event, so it ends. Long enough for the last tick to land and
  // be read, short enough that it is gone before the student wonders whether the
  // emerald ring is a permanent state they now have to understand.
  useEffect(() => {
    if (!justMarked) return
    const timer = setTimeout(() => setJustMarked(null), 6000)
    return () => clearTimeout(timer)
  }, [justMarked])

  useEffect(() => {
    let active = true

    const loadInitialData = async () => {
      setIsInitialLoading(true)
      setErrorMessage(undefined)

      try {
        const [profileResult, careersResult] = await Promise.allSettled([
          studentDashboardService.getStudentProfile(),
          studentDashboardService.getCareerRoles()
        ])

        if (!active) return

        const nextCareers = careersResult.status === "fulfilled" ? careersResult.value : []
        setCareers(nextCareers)

        const profile = profileResult.status === "fulfilled"
          ? unwrapProfile(profileResult.value)
          : null
        const profileCareerId = getProfileCareerId(profile)
        const profileCareerName = getProfileCareerName(profile)
        setIsFptAccount((profile as any)?.accountType === "FPT")

        if (profileCareerId) {
          setCurrentCareerId(profileCareerId)
          setSelectedCareerId(profileCareerId)
          setCurrentCareerName(
            profileCareerName ||
            nextCareers.find((career) => career.careerId === profileCareerId)?.careerName
          )
          await loadRoadmap()
        } else {
          setCurrentCareerId(null)
          setSelectedCareerId("")
          setRoadmapData(null)
        }
      } catch (error) {
        if (!active) return
        console.error("[Student Roadmap] Failed to load initial data:", error)
        setErrorMessage("Cannot load career roles right now.")
      } finally {
        if (active) setIsInitialLoading(false)
      }
    }

    loadInitialData()

    return () => {
      active = false
    }
  }, [])

  const handleSaveCareer = async () => {
    const career = careers.find((item) => item.careerId === selectedCareerId)
    if (!career) {
      setErrorMessage("Select a target career role first.")
      return
    }
    if (!isUuid(career.careerId)) {
      setErrorMessage("Selected career has an invalid backend ID.")
      return
    }

    setIsSavingCareer(true)
    setErrorMessage(undefined)
    try {
      await studentDashboardService.updateTargetCareer(career.careerId)
      setCurrentCareerId(career.careerId)
      setCurrentCareerName(career.careerName)
      setIsChangingCareer(false)
      await loadRoadmap()
    } catch (error) {
      console.error("[Student Roadmap] Failed to update target career:", error)
      setErrorMessage("Cannot update target career right now.")
    } finally {
      setIsSavingCareer(false)
    }
  }

  const closePopover = () => {
    setSelectedNodeData(null)
  }

  /**
   * Pull in everything beneath a topic.
   *
   * Optimistic on purpose: the id goes into state first so the "+13" badge
   * disappears immediately, and the refetch fills the nodes in behind it.
   */
  const expandNode = async (nodeId: string) => {
    if (!nodeId || expandedNodeIds.includes(nodeId)) return
    const next = [...expandedNodeIds, nodeId]
    setExpandedNodeIds(next)
    try {
      const fresh = await fetchCurrentView(next)
      if (fresh) setRoadmapData(fresh)
    } catch (error) {
      console.error("[Student Roadmap] Failed to expand node:", error)
      // Roll back so the badge comes back rather than silently doing nothing.
      setExpandedNodeIds(expandedNodeIds)
    }
  }

  const handleNodeClick = async (nodeData: any) => {
    // A decided choice group is a doorway to the track it names. Opening the
    // group itself would land the student back on the nine alternatives they
    // just chose between — the chosen one is what "open Pick a Language" means
    // once the choice exists.
    if (nodeData?.choiceChosenId) {
      openSubRoadmap(nodeData.choiceChosenId)
      return
    }
    // A node carrying a curriculum inside it — Java's 71, Python's 122 — opens as
    // its own roadmap. Expanding it in place is what buried the rest of the path
    // under a list nobody could scan.
    if (nodeData?.entersRoadmap) {
      openSubRoadmap(nodeData.id)
      return
    }
    // A topic with held-back depth: opening it is what the click means.
    if ((nodeData?.hiddenChildren ?? 0) > 0) {
      void expandNode(nodeData.id)
    }
    setShowFptPanel(false)
    setSelectedNodeData(nodeData)
    if (nodeData && (!nodeData.links || nodeData.links.length === 0)) {
      try {
        const detail = await studentDashboardService.getNodeDetail(nodeData.id)
        if (detail) {
          let resources: {title: string, url: string}[] = [];

          // resource comes from a JSONB column: usually a JSON array of URL strings
          // (or objects), but tolerate a JSON string too.
          let rawResources: any = detail.resource;
          if (typeof rawResources === 'string') {
            try { rawResources = JSON.parse(rawResources); } catch { rawResources = []; }
          }
          if (Array.isArray(rawResources)) {
            resources = rawResources
              .map((item: any, idx: number) => {
                const url = typeof item === 'string' ? item : (item?.url || item?.link || '');
                const title = (item && typeof item === 'object' && item.title) ? item.title : `Learning Resource ${idx + 1}`;
                return url ? { title, url } : null;
              })
              .filter(Boolean) as {title: string, url: string}[];
          }

          if (resources.length === 0) {
            if (detail.links && Array.isArray(detail.links)) {
              resources.push(...detail.links);
            } else {
              if (detail.Link1 || detail.link1) resources.push({ title: detail.Title1 || 'Resource 1', url: detail.Link1 || detail.link1 });
              if (detail.Link2 || detail.link2) resources.push({ title: detail.Title2 || 'Resource 2', url: detail.Link2 || detail.link2 });
              if (detail.Link3 || detail.link3) resources.push({ title: detail.Title3 || 'Resource 3', url: detail.Link3 || detail.link3 });
            }
          }

          if (resources.length > 0) {
            setSelectedNodeData(prev => prev ? { ...prev, links: resources } : prev)
          }
        }
      } catch (error) {
        console.error("[Student Roadmap] Failed to fetch node resources:", error)
      }
    }
  }

  const showCareerSelector = !currentCareerId || isChangingCareer

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  useGSAP(() => {
    gsap.from(".roadmap-gsap-panel", {
      y: 20,
      autoAlpha: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: "power3.out"
    })
  }, { scope: pageRef, dependencies: [showCareerSelector], revertOnUpdate: true })

  // dvh, not vh: on mobile Safari and Chrome the URL bar makes 100vh taller than what is
  // actually on screen, which pushed the canvas and its zoom controls off the bottom.
  return (
    <div ref={pageRef} className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-transparent font-sans text-slate-900">
      <SharedAppBackground />

      <StudentHeader
        user={user}
        onLogout={handleLogout}
        onOpenAiMentor={() => navigate(ROUTES.AI_MENTOR)}
        level={studentLevel}
        careerName={currentCareerName}
        onTakeAssessment={openAssessment}
      />

      {/* The wave needs a sentence, not just motion. A tick that appears on its
          own is something the student has to explain to themselves — and the
          explanation they reach for is usually "did I click that?". This says who
          did it and on what grounds, and it leaves when the wave does. */}
      {justMarked && (
        <div className="pointer-events-none fixed left-1/2 top-[88px] z-40 -translate-x-1/2">
          <div className="node-mark-stamp flex items-center gap-2.5 rounded-full bg-slate-900 py-2 pl-3 pr-4 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.6)]">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500">
              <Check size={12} weight="bold" className="text-white" />
            </span>
            <p className="text-[12.5px] font-semibold text-white">
              {justMarked.ids.length} {justMarked.ids.length === 1 ? 'node' : 'nodes'} marked from{' '}
              {justMarked.source === 'assessment' ? 'your assessment' : 'the skills you declared'}
            </p>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <main className="relative z-10 mt-[72px] flex w-full flex-1 overflow-hidden p-2 sm:p-4">

        {/* Vector Graph Area — now full width; details live in a slide-in drawer. */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-transparent rounded-2xl">
            <div className="absolute inset-0 z-10 bg-transparent">
              {/* React Flow Provider must wrap the Canvas */}
              <ReactFlowProvider>
                <RoadmapVectorGraph
                  onNodeClick={handleNodeClick}
                  themeColor={themeColor}
                  justMarkedNodeIds={justMarked?.ids}
                  onSetNodeStatus={setNodeStatus}
                  roadmapData={roadmapData}
                  optimisticStatusMap={optimisticStatusMap}
                  chosenNodeIds={chosenNodeIds}
                  choiceOptionsByGroup={choiceOptionsByGroup}
                  onSelectOption={selectFromCluster}
                />
              </ReactFlowProvider>
            </div>

            {/* Where you are, and the way back. Sits above the tool rail because a
                student who has drilled two levels down needs the exit before they
                need any of the tools. */}
            {roadmapData?.breadcrumb && roadmapData.breadcrumb.length > 1 && (
              <div className="pointer-events-none absolute left-2 top-2 z-30 sm:left-4 sm:top-4">
                <RoadmapBreadcrumb trail={roadmapData.breadcrumb} onNavigate={openSubRoadmap} />
              </div>
            )}

            {/* Standalone roadmaps under this career: languages, frameworks, DB
                tracks. Offered as somewhere to go, at the foot of the canvas, so
                they never compete with the career path itself for attention. */}
            {!subRoadmapId && roadmapData?.subRoadmaps && roadmapData.subRoadmaps.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
                <div className="pointer-events-auto flex max-w-[min(760px,calc(100vw-1.5rem))] items-center gap-1.5 overflow-x-auto rounded-2xl bg-white/85 p-1.5 shadow-[0_6px_28px_rgb(15,23,42,0.1)] ring-1 ring-white/60 backdrop-blur-md">
                  <span className="shrink-0 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Go deeper
                  </span>
                  {roadmapData.subRoadmaps.map((sub) => (
                    <button
                      key={sub.nodeId}
                      type="button"
                      onClick={() => openSubRoadmap(sub.nodeId)}
                      style={{
                        background: `linear-gradient(90deg, rgba(52,211,153,.28) 0%, rgba(52,211,153,.28) ${Math.max(0, Math.min(100, sub.nodeCount ? (sub.completedCount / sub.nodeCount) * 100 : 0))}%, rgba(241,245,249,.72) ${Math.max(0, Math.min(100, sub.nodeCount ? (sub.completedCount / sub.nodeCount) * 100 : 0))}%, rgba(241,245,249,.72) 100%)`,
                      }}
                      className="group flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100"
                    >
                      <span className="max-w-[150px] truncate text-[11.5px] font-semibold text-slate-800">
                        {sub.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-slate-500 group-hover:bg-white">
                        {sub.completedCount ? `${sub.completedCount}/${sub.nodeCount}` : sub.nodeCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The level used to float here, top-right, in its own bar. It now
                rides the avatar in the header — a ring for the coverage, the band
                name and Reassess beside it — because it says something about the
                student rather than about the roadmap, and the canvas was paying
                for it. See StudentLevelRing.

                The evidence prompt deliberately stays off this canvas too: it is
                a three-line panel, and the left side already stacks a breadcrumb
                over a tool rail. It sits on the dashboard and on the assessment
                result instead — places where the student is reading rather than
                navigating. */}

            {/* Tools: an icon rail on the left, each opening one panel beside it.
                Everything that used to float over the canvas as a permanent stack
                now lives behind these buttons, so the roadmap owns the space
                until the student asks for a tool. */}
            {roadmapData && roadmapData.nodes && roadmapData.nodes.length > 0 && (
              <div className={`absolute left-2 z-20 flex items-start gap-2 sm:left-4 ${
                roadmapData?.breadcrumb && roadmapData.breadcrumb.length > 1
                  ? 'top-14 sm:top-16'
                  : 'top-2 sm:top-4'
              }`}>
                <div className="flex flex-col gap-1 rounded-2xl bg-white/80 p-1.5 shadow-[0_4px_24px_rgb(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-md">
                  {tools.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={activeTool === id}
                      onClick={() => setActiveTool((cur) => (cur === id ? null : id))}
                      className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                        activeTool === id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={17} weight="bold" />
                    </button>
                  ))}

                  <button
                    type="button"
                    title="Import projects from GitHub"
                    aria-label="Import projects from GitHub"
                    onClick={() => setGithubImportOpen(true)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:bg-slate-200"
                  >
                    <GithubLogo size={17} weight="fill" />
                  </button>

                  {currentCareerId && isFptAccount && (
                    <button
                      type="button"
                      title="FPT courses taken"
                      aria-label="FPT courses taken"
                      onClick={() => { setSelectedNodeData(null); setActiveTool(null); setShowFptPanel(true) }}
                      className="grid h-9 w-9 place-items-center rounded-xl text-orange-500 transition-colors hover:bg-orange-50"
                    >
                      <GraduationCap size={17} weight="bold" />
                    </button>
                  )}
                </div>

                {activeTool && (
                  <div className="max-h-[calc(100vh-8rem)] w-[264px] max-w-[calc(100vw-5rem)] overflow-y-auto rounded-2xl bg-white/85 p-3.5 shadow-[0_8px_32px_rgb(15,23,42,0.1)] ring-1 ring-white/60 backdrop-blur-md">
                    {activeTool === 'career' && (
                      <>
                        <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          <Target size={12} weight="bold" />
                          Target Career
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <h1 className="flex-1 truncate text-[15px] font-bold tracking-tight text-slate-900">
                            {roadmapData?.targetCareerRole || currentCareerName || "Target Career"}
                          </h1>
                          <button
                            className="group flex shrink-0 items-center gap-1 rounded-md bg-slate-100/70 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-all hover:bg-slate-100 active:scale-[0.98]"
                            onClick={() => {
                              setSelectedCareerId(currentCareerId || "")
                              setCareerSearch("")
                              setIsChangingCareer(true)
                            }}
                          >
                            <PencilSimple size={10} weight="bold" className="transition-colors group-hover:text-slate-900" /> Change
                          </button>
                        </div>

                        <div className="mt-3 border-t border-black/[0.06] pt-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
                            <span className="text-[12px] font-black tabular-nums text-slate-900">{roadmapProgress}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500 ease-out"
                              style={{ width: `${roadmapProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Sits under Change, because that is the decision it
                            informs. Opens the picker with the career preselected
                            rather than switching outright — a suggestion the
                            student can still walk away from. */}
                        <CareerAffinityHint
                          className="mt-3 border-t border-black/[0.06] pt-3"
                          affinities={affinities}
                          onChoose={(careerId) => {
                            setSelectedCareerId(careerId)
                            setCareerSearch("")
                            setIsChangingCareer(true)
                          }}
                        />
                      </>
                    )}

                    {activeTool === 'plan' && (
                      <LearningPlanPanel
                        hasCareer={Boolean(currentCareerId)}
                        refreshSignal={recsRefresh}
                        // The very nodes the canvas is drawing, so the priority
                        // list beside it cannot rank the same roadmap differently.
                        roadmap={roadmapData}
                        selections={selections}
                        onOpenNode={(node) => {
                          // The plan may point at a node the graph is currently
                          // hiding, so this opens the detail directly rather than
                          // trying to select something that is not on screen.
                          setShowFptPanel(false)
                          setSelectedNodeData({
                            id: node.nodeId,
                            label: node.nodeName,
                            description: node.description,
                            status: node.status,
                            links: (node.resources || []).map(url => ({ title: url, url }))
                          })
                        }}
                      />
                    )}

                    {activeTool === 'choices' && (
                      <>
                        <p className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          <GitFork size={12} weight="bold" />
                          Your choices
                        </p>
                        {/* No `onFocusGroup`: nothing here can move the canvas
                            yet, and a heading that turns into a button and then
                            does not go anywhere is worse than plain text. */}
                        <MarketChoiceRail
                          rawNodes={graphNodes}
                          selections={selections}
                          rankedGroups={choiceGroups}
                          onOpenPostings={(skillId, name) => setPostingsFor({ skillId, skillName: name })}
                          onOpenNode={openSubRoadmap}
                        />
                      </>
                    )}

                    {activeTool === 'ai' && (
                      <RoadmapRecommendationsPanel
                        hasCareer={Boolean(currentCareerId)}
                        onApplied={loadRoadmap}
                        refreshSignal={recsRefresh}
                      />
                    )}

                    {activeTool === 'legend' && <StageLegend />}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* FPT curriculum — right-docked panel that fades into the background. */}
        <FptCurriculumPanel
          open={showFptPanel && isFptAccount}
          onClose={() => setShowFptPanel(false)}
          onApplied={() => { loadRoadmap(); setRecsRefresh(n => n + 1) }}
        />

        {/* Node detail — a right-docked panel that fades into the background
            (no card / shadow / widget chrome), not a floating popup.
            Full width on a phone: at 375px the old 380px panel was the whole screen anyway,
            but faded to transparent on its left edge, so it read as a broken overlay rather
            than a sheet. Below `sm` it becomes opaque and owns the viewport. */}
        {selectedNodeData && !showFptPanel && (
        <div className="roadmap-node-panel pointer-events-none absolute inset-y-0 right-0 z-30 flex w-full flex-col justify-start border-l border-slate-200/90 bg-slate-50/95 px-4 pt-4 shadow-[-18px_0_48px_-28px_rgba(15,23,42,0.48)] backdrop-blur-xl sm:w-[380px] sm:max-w-[calc(100%-1rem)] sm:px-5 sm:pt-6">
          <style>{`@keyframes rmPanelIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}.roadmap-node-panel{animation:rmPanelIn .2s ease-out}`}</style>
          <div className="pointer-events-auto flex max-h-full flex-col rounded-2xl border border-white/90 bg-white/75 shadow-sm ring-1 ring-slate-200/55">
          {/* Compact header: stage dot + node name + close. */}
          <div className="flex items-start gap-2 px-4 pt-3.5 pb-2 shrink-0">
            {getStageStyle(selectedNodeData.stage) && (
              <span
                className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-black/20"
                style={{ backgroundColor: getStageStyle(selectedNodeData.stage)!.color }}
              />
            )}
            <h2 className="flex-1 text-[15px] font-bold leading-snug tracking-tight text-slate-950">
              {selectedNodeData.label}
            </h2>
            <button
              aria-label="Close detail"
              onClick={closePopover}
              className="-mr-1 -mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-5">
            {/* One tight status line: state + completion date. */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
              <span className={`rounded-full px-2 py-0.5 ${
                selectedNodeData.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                selectedNodeData.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                selectedNodeData.status === 'current' ? 'bg-indigo-50 text-indigo-600' :
                selectedNodeData.status === 'alternative' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {selectedNodeData.status === 'completed' ? 'Completed' : selectedNodeData.status === 'in_progress' ? 'In progress' : selectedNodeData.status === 'current' ? 'Available' : selectedNodeData.status === 'alternative' ? 'Alternative' : 'Locked'}
              </span>
              {selectedNodeData.status === 'completed' && selectedNodeData.completedAt && (
                <span className="text-slate-400">
                  · {new Date(selectedNodeData.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {/* Above the student's level. Said in words here, not just as the chip
                on the card: the chip fits two syllables and this is the panel the
                student opened to find out what the node actually is.

                Deliberately not a block: the completion button below stays live.
                A tier is a statement about timing, not permission, and the
                student's learning path carries no approval gate. */}
            {selectedNodeData.tierLocked && (
              <div className="flex items-start gap-2 rounded-xl bg-slate-900/[0.04] px-2.5 py-2 ring-1 ring-slate-900/[0.06]">
                <LockKey size={13} weight="bold" className="mt-px shrink-0 text-slate-500" />
                <p className="text-[11.5px] leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {selectedNodeData.tier === 3 ? 'Advanced' : 'Later on'}
                  </span>{' '}
                  — this usually comes after the earlier parts of the track. You can
                  still learn it now; it just is not what your level suggests next.
                </p>
              </div>
            )}

            {/* Short description — clamped, no scroll box. */}
            {selectedNodeData.description && (
              <p className="text-[12.5px] leading-relaxed text-slate-600 line-clamp-4">
                {selectedNodeData.description}
              </p>
            )}

            {/* Evidence is part of the node contract, not a hidden recommendation log.
                A reviewer can now see both the proof and the exact bar it failed. */}
            {(selectedNodeData.evidenceDecision || (selectedNodeData.evidence || []).length > 0) && (
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} weight="fill" className="text-indigo-600" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Completion evidence</p>
                  </div>
                  {typeof selectedNodeData.evidenceRequiredConfidence === 'number' && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold text-slate-600 ring-1 ring-slate-200">
                      Needs {Math.round(selectedNodeData.evidenceRequiredConfidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-700">{selectedNodeData.evidenceDecision}</p>
                {(selectedNodeData.evidence || []).map((item: any) => (
                  <div key={item.evidenceId} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-200/80">
                    <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-slate-700">
                      {item.skillName || 'Matched evidence'} · {(item.sourceType || 'unknown').replaceAll('_', ' ')}
                    </span>
                    {typeof item.confidence === 'number' && (
                      <span className={`text-[10.5px] font-black tabular-nums ${item.confidence >= (selectedNodeData.evidenceRequiredConfidence ?? 0) ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    )}
                    {item.sourceUrl && (
                      <button type="button" onClick={() => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')} aria-label="Open evidence source">
                        <ArrowUpRight size={12} weight="bold" className="text-slate-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FLM overlay — which FPT subjects teach this skill, and their lesson resources.
                The backend already omits this for non-FPT accounts; the flag is a belt-and-braces guard. */}
            {isFptAccount && selectedNodeData.fptCoverage?.covered && (
              <div className="flex flex-col gap-1.5 rounded-xl border border-orange-200/70 bg-orange-50/60 p-2.5">
                <div className="flex items-center gap-1.5">
                  <GraduationCap size={13} weight="fill" className="text-orange-600" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-orange-700">Learn at FPT</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(selectedNodeData.fptCoverage.subjects || []).map((s: any) => (
                    <span
                      key={s.code}
                      title={(s.name || '').split('_')[0].trim() || s.name}
                      className="inline-flex items-center gap-1 rounded-md border border-orange-300/70 bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-orange-800"
                    >
                      {s.code}
                      {typeof s.semester === 'number' && (
                        <span className="text-[9px] font-semibold text-orange-500">· term {s.semester}</span>
                      )}
                    </span>
                  ))}
                </div>
                {(selectedNodeData.fptResources || []).length > 0 && (
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    {(selectedNodeData.fptResources || []).map((r: any, idx: number) => {
                      const href = (r?.url || '').trim();
                      const label = r?.title || r?.topic || `${r?.subjectCode} resource`;
                      const isYt = !!href && !!getYouTubeId(href);
                      const clickable = !!href;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!clickable}
                          onClick={() => {
                            if (!clickable) return;
                            if (isYt) setActiveResource({ title: label, url: href })
                            else window.open(href, '_blank', 'noopener,noreferrer')
                          }}
                          className={`group flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-all ${clickable ? 'hover:bg-white' : 'cursor-default opacity-80'}`}
                        >
                          <span className={`grid h-4 w-4 shrink-0 place-items-center rounded ${r?.kind === 'SESSION' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-700'}`}>
                            {r?.kind === 'SESSION' ? <BookOpen size={9} weight="fill" /> : <LinkSimple size={9} weight="bold" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{label}</span>
                          {clickable && <ArrowUpRight size={11} weight="bold" className="shrink-0 text-orange-300 group-hover:text-orange-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {isFptAccount && selectedNodeData.fptCoverage?.selfStudy && !selectedNodeData.fptCoverage?.covered && (
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1.5">
                <BookOpen size={12} weight="bold" className="text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-500">Self-study — not taught in the FPT curriculum</span>
              </div>
            )}

            {/* Resources as compact one-line chips. */}
            {selectedNodeData.links && selectedNodeData.links.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Resources</p>
                {selectedNodeData.links.map((link: any, idx: number) => {
                  const rawUrl = typeof link === 'string' ? link : (link && typeof link.url === 'string' ? link.url : '');
                  const href = rawUrl.trim();
                  if (!href) return null;
                  const meta = getLinkMeta(href);
                  const title = typeof link === 'object' && link?.title ? link.title : meta.label;
                  const isYt = !!getYouTubeId(href);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isYt) setActiveResource({ title, url: href })
                        else window.open(href, '_blank', 'noopener,noreferrer')
                      }}
                      className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all duration-200 hover:-translate-y-px hover:bg-slate-50"
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${isYt ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'} group-hover:scale-105 transition-transform`}>
                        {isYt ? <YoutubeLogo size={11} weight="fill" /> : <LinkSimple size={11} weight="bold" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700 group-hover:text-black">{meta.label}</span>
                      <ArrowUpRight size={13} weight="bold" className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-900" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Action — compact. */}
            {selectedNodeData.nodeKind === 'ALTERNATIVE' && !chosenNodeIds.has(selectedNodeData.id) ? (
              <button
                onClick={() => setPendingChoice(selectedNodeData)}
                disabled={isSelecting}
                className="mt-0.5 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <GitFork size={13} weight="bold" /> Choose this option
              </button>
            ) : selectedNodeData.parentTopic ? (
              selectedNodeData.status === 'locked' ? (
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11.5px] font-semibold text-slate-400">
                  <LockKey size={13} weight="bold" /> Finish the previous topic first
                </div>
              ) : (() => {
                const total = selectedNodeData.childTotal || 0;
                const done = selectedNodeData.childCompleted || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const complete = selectedNodeData.status === 'completed';
                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>{complete ? 'Topic complete' : 'Auto-completes from sub-skills'}</span>
                      <span className="tabular-nums">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-slate-900'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()
            ) : selectedNodeData.completionPolicy === 'NEVER_COMPLETE' ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] font-medium text-slate-500">
                <TreeStructure size={13} weight="bold" /> Completes via its sub-skills
              </div>
            ) : selectedNodeData.status === 'completed' ? (
              <button
                onClick={() => handleUpdateNodeStatus('in_progress')}
                disabled={isUpdatingNode}
                className="mt-0.5 w-full rounded-lg bg-white px-4 py-2 text-[12px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isUpdatingNode ? 'Updating...' : 'Re-learn (mark in progress)'}
              </button>
            ) : selectedNodeData.status === 'locked' ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11.5px] font-semibold text-slate-400">
                <LockKey size={13} weight="bold" /> Complete prerequisites first
              </div>
            ) : (
              <button
                onClick={() => setPendingComplete(selectedNodeData)}
                disabled={isUpdatingNode}
                className="mt-0.5 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <Check size={14} weight="bold" /> {isUpdatingNode ? 'Marking...' : 'Mark as completed'}
              </button>
            )}
          </div>
          </div>
        </div>
        )}

        {/* Career Selector Overlay */}
        {!isInitialLoading && showCareerSelector && (
          <div className="absolute inset-0 z-50 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
            <CareerSelector
              careers={careers}
              selectedCareerId={selectedCareerId}
              currentCareerId={currentCareerId}
              searchValue={careerSearch}
              isSaving={isSavingCareer}
              errorMessage={errorMessage}
              onSearchChange={setCareerSearch}
              onSelectCareer={setSelectedCareerId}
              onSave={handleSaveCareer}
              onCancel={currentCareerId ? () => {
                setSelectedCareerId(currentCareerId)
                setIsChangingCareer(false)
                setErrorMessage(undefined)
              } : undefined}
            />
          </div>
        )}
      </main>

      <SkillPostingsPanel
        skillId={postingsFor?.skillId ?? null}
        skillName={postingsFor?.skillName ?? null}
        onClose={() => setPostingsFor(null)}
      />

      <GithubSyncModal
        open={githubImportOpen}
        onOpenChange={setGithubImportOpen}
        onImported={handleGithubImported}
      />

      <StudentProfileSetupModal isOpen={activeSetupStep === "profile"} onComplete={openSkillSelection} />
      {activeSetupStep === "assessment" && (
        <StudentSkillAssessmentModal isOpen onComplete={handleAssessmentComplete} onBack={goBackToSkills} />
      )}
      {activeSetupStep === "skills" && (
        <StudentSkillSelectionModal isOpen onComplete={openAssessment} onBack={goBackToProfile} />
      )}

      <ConfirmModal
        isOpen={!!pendingChoice}
        variant="primary"
        title={pendingChoice ? `Choose ${pendingChoice.label}?` : 'Choose this option?'}
        message="This becomes the active option in its pick-one group and counts toward your progress. The other options stay available as alternatives — you can switch anytime."
        confirmLabel="Choose it"
        cancelLabel="Cancel"
        loading={isSelecting}
        onConfirm={confirmChoice}
        onCancel={() => setPendingChoice(null)}
      />

      <ConfirmModal
        isOpen={!!pendingComplete}
        variant="primary"
        title={pendingComplete ? `Mark "${pendingComplete.label}" as completed?` : 'Mark as completed?'}
        message="This marks the skill as done, records today's date, and updates your roadmap progress. You can switch it back to in-progress later if needed."
        confirmLabel="Mark completed"
        cancelLabel="Cancel"
        loading={isUpdatingNode}
        onConfirm={async () => {
          await handleUpdateNodeStatus('completed');
          setPendingComplete(null);
        }}
        onCancel={() => setPendingComplete(null)}
      />

      <ResourceViewerModal resource={activeResource} onClose={() => setActiveResource(null)} />
    </div>
  )
}
