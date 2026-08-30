import json

nodes = []
edges = []

def fnode(path, name, summary, tags, complexity, notes=None):
    n = {"id": f"file:{path}", "type": "file", "name": name, "filePath": path,
         "summary": summary, "tags": tags, "complexity": complexity}
    if notes:
        n["languageNotes"] = notes
    nodes.append(n)

def funode(path, name, summary, tags, complexity, lr):
    nodes.append({"id": f"function:{path}:{name}", "type": "function", "name": name,
                   "filePath": path, "lineRange": lr, "summary": summary, "tags": tags,
                   "complexity": complexity})

PREFIXES = ("file:", "function:", "class:", "config:", "document:", "service:", "table:", "endpoint:", "pipeline:", "schema:", "resource:")

def norm(ref):
    if ref.startswith(PREFIXES):
        return ref
    return f"file:{ref}"

def edge(src, tgt, typ, w):
    edges.append({"source": norm(src), "target": norm(tgt), "type": typ, "direction": "forward", "weight": w})

UI = "FrontEnd/intelipath-frontend/src/components/ui"
AUTH = "FrontEnd/intelipath-frontend/src/features/auth/components"
SD = "FrontEnd/intelipath-frontend/src/features/student-dashboard"

# --- DatePicker.tsx ---
p = f"{UI}/DatePicker.tsx"
fnode(p, "DatePicker.tsx", "A custom calendar date-picker input component with month/year navigation and a portal-rendered dropdown panel, supporting a past-only date restriction mode.", ["component", "date-picker", "form"], "complex")
funode(p, "DatePicker", "Renders a date input field and popover calendar with day/month/year selection views, positioning the panel via a portal and closing on outside click or Escape.", ["component", "date-picker"], "complex", [29, 346])
edge(p, f"function:{p}:DatePicker", "contains", 1.0)
edge(p, f"function:{p}:DatePicker", "exports", 0.8)

# --- Spinner.tsx ---
p = f"{UI}/Spinner.tsx"
fnode(p, "Spinner.tsx", "Small reusable loading spinner component with configurable size and accessible label.", ["component", "loading-indicator", "utility"], "simple")
funode(p, "Spinner", "Renders an animated SVG/CSS spinner sized and labeled for accessibility.", ["component", "loading-indicator"], "simple", [18, 41])
edge(p, f"function:{p}:Spinner", "contains", 1.0)
edge(p, f"function:{p}:Spinner", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- badge.tsx ---
p = f"{UI}/badge.tsx"
fnode(p, "badge.tsx", "Styled badge/chip component with variant-based class composition via class-variance-authority style helper.", ["component", "badge", "ui-primitive"], "simple")
funode(p, "Badge", "Renders a span styled per variant using the badgeVariants class helper merged with cn().", ["component", "badge"], "simple", [23, 25])
edge(p, f"function:{p}:Badge", "contains", 1.0)
edge(p, f"function:{p}:Badge", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- button.tsx ---
p = f"{UI}/button.tsx"
fnode(p, "button.tsx", "Reusable Button UI primitive supporting variant/size styling and optional Slot-based polymorphic rendering (asChild).", ["component", "button", "ui-primitive"], "simple")
funode(p, "Button", "Renders a button (or Slot child) with class variants for style/size, merged via cn().", ["component", "button"], "simple", [36, 39])
edge(p, f"function:{p}:Button", "contains", 1.0)
edge(p, f"function:{p}:Button", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- card.tsx ---
p = f"{UI}/card.tsx"
fnode(p, "card.tsx", "Composable Card UI primitives (Card, CardHeader, CardTitle, CardDescription, CardContent) used to build consistent panel layouts.", ["component", "card", "ui-primitive"], "simple")
for fn, lr in [("Card",[4,6]),("CardHeader",[8,10]),("CardTitle",[12,14]),("CardDescription",[16,18]),("CardContent",[20,22])]:
    funode(p, fn, f"{fn} sub-component of the Card composition, applying styled div/heading markup via cn().", ["component", "card"], "simple", lr)
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
    edge(p, f"function:{p}:{fn}", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- dialog.tsx ---
p = f"{UI}/dialog.tsx"
fnode(p, "dialog.tsx", "Dialog/modal UI primitives wrapping a base dialog library (Trigger, Close, Content, Header, Title, Description, Footer) with consistent styling.", ["component", "dialog", "modal", "ui-primitive"], "moderate")
for fn, lr in [("DialogContent",[10,27]),("DialogHeader",[29,31]),("DialogTitle",[33,35]),("DialogDescription",[37,39]),("DialogFooter",[41,43])]:
    funode(p, fn, f"{fn} sub-component of the Dialog composition providing styled modal markup.", ["component", "dialog"], "simple", lr)
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
    edge(p, f"function:{p}:{fn}", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- field.tsx ---
p = f"{UI}/field.tsx"
fnode(p, "field.tsx", "Form field layout primitives (FieldGroup, Field, FieldLabel, FieldDescription) for consistent label/description/error styling across forms.", ["component", "form", "ui-primitive"], "simple")
for fn, lr in [("FieldGroup",[4,6]),("Field",[8,10]),("FieldLabel",[12,17]),("FieldDescription",[19,21])]:
    funode(p, fn, f"{fn} sub-component providing styled markup for form field composition.", ["component", "form"], "simple", lr)
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
    edge(p, f"function:{p}:{fn}", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- input.tsx ---
p = f"{UI}/input.tsx"
fnode(p, "input.tsx", "Styled text input UI primitive used across forms in the application.", ["component", "input", "ui-primitive"], "simple")
funode(p, "Input", "Renders a styled <input> element merging passed className via cn().", ["component", "input"], "simple", [4, 12])
edge(p, f"function:{p}:Input", "contains", 1.0)
edge(p, f"function:{p}:Input", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- select.tsx ---
p = f"{UI}/select.tsx"
fnode(p, "select.tsx", "Custom dropdown Select component that collects <option>-like children into a list and renders a styled, keyboard/click-dismissable dropdown.", ["component", "select", "form", "ui-primitive"], "moderate")
funode(p, "collectOptions", "Recursively walks React children to extract option value/label pairs for the custom select.", ["utility", "react-children"], "simple", [8, 25])
funode(p, "Select", "Renders a custom styled select trigger and dropdown list, managing open state and outside-click/escape dismissal.", ["component", "select"], "moderate", [43, 108])
edge(p, f"function:{p}:collectOptions", "contains", 1.0)
edge(p, f"function:{p}:Select", "contains", 1.0)
edge(p, f"function:{p}:Select", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- skeleton.tsx ---
p = f"{UI}/skeleton.tsx"
fnode(p, "skeleton.tsx", "Skeleton loading placeholder UI primitive used to indicate content is loading.", ["component", "skeleton", "loading-indicator"], "simple")
funode(p, "Skeleton", "Renders a pulsing placeholder div styled via cn() for loading states.", ["component", "skeleton"], "simple", [14, 28])
edge(p, f"function:{p}:Skeleton", "contains", 1.0)
edge(p, f"function:{p}:Skeleton", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- LoginDialog.tsx ---
p = f"{AUTH}/LoginDialog.tsx"
fnode(p, "LoginDialog.tsx", "Modal dialog that switches between login and forgot-password views, wrapping LoginForm and ForgotPasswordForm inside the shared Dialog primitive.", ["component", "auth", "dialog"], "simple")
funode(p, "LoginDialog", "Manages which auth view (login vs forgot-password) is shown inside the dialog and renders the corresponding form.", ["component", "auth"], "simple", [25, 60])
edge(p, f"function:{p}:LoginDialog", "contains", 1.0)
edge(p, f"function:{p}:LoginDialog", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/dialog.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/auth/components/ForgotPasswordForm.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/auth/components/LoginForm.tsx", "imports", 0.7)

# --- LoginForm.tsx ---
p = f"{AUTH}/LoginForm.tsx"
fnode(p, "LoginForm.tsx", "Login form component with username/password fields, Google/Github icon buttons, and submit handling via the useLogin hook.", ["component", "auth", "form"], "moderate")
funode(p, "GoogleIcon", "Renders an inline SVG Google logo icon.", ["component", "icon"], "simple", [6, 13])
funode(p, "GithubIcon", "Renders an inline SVG GitHub logo icon.", ["component", "icon"], "simple", [15, 22])
funode(p, "LoginForm", "Renders the credential login form, wiring input state to the useLogin hook and handling submit/forgot-password navigation.", ["component", "auth", "form"], "moderate", [33, 128])
for fn in ["GoogleIcon","GithubIcon","LoginForm"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:LoginForm", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/button.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/field.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/input.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/auth/index.ts", "imports", 0.7)

# --- CustomRoadmapNode.tsx ---
p = f"{SD}/components/CustomRoadmapNode.tsx"
fnode(p, "CustomRoadmapNode.tsx", "Custom React Flow node renderer for roadmap topic nodes, showing stage color, status, and a formatted completion date.", ["component", "roadmap", "react-flow"], "complex")
funode(p, "formatDoneDate", "Formats a raw date value into a locale date string, returning null for invalid input.", ["utility", "date-formatting"], "simple", [7, 12])
funode(p, "CustomRoadmapNode", "Renders an individual roadmap graph node's visual card including stage coloring, selection state, and completion info.", ["component", "roadmap", "react-flow"], "complex", [35, 245])
edge(p, f"function:{p}:formatDoneDate", "contains", 1.0)
edge(p, f"function:{p}:CustomRoadmapNode", "contains", 1.0)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/lib/stageColors.ts", "imports", 0.7)
edge(p, f"function:{p}:CustomRoadmapNode", "calls", 0.8, ) if False else None
edges.append({"source": f"function:{p}:CustomRoadmapNode", "target": f"function:{SD}/lib/stageColors.ts:getStageColor", "type": "calls", "direction": "forward", "weight": 0.8})

# --- OnboardingShell.tsx ---
p = f"{SD}/components/OnboardingShell.tsx"
fnode(p, "OnboardingShell.tsx", "Shared layout shell for multi-step student onboarding flows, rendering a progress indicator, title/subtitle, and back/next navigation buttons.", ["component", "onboarding", "layout"], "moderate")
funode(p, "OnboardingShell", "Renders a step progress bar with labels plus back/next controls wrapping arbitrary step content.", ["component", "onboarding"], "moderate", [26, 112])
edge(p, f"function:{p}:OnboardingShell", "contains", 1.0)
edge(p, f"function:{p}:OnboardingShell", "exports", 0.8)

# --- ResourceViewerModal.tsx ---
p = f"{SD}/components/ResourceViewerModal.tsx"
fnode(p, "ResourceViewerModal.tsx", "Modal that embeds/plays a learning resource (e.g., YouTube video or external link) with host detection and Escape-to-close handling.", ["component", "modal", "resource-viewer"], "moderate")
funode(p, "getYouTubeId", "Extracts a YouTube video ID from various YouTube URL formats.", ["utility", "url-parsing"], "simple", [7, 21])
funode(p, "hostOf", "Returns the normalized hostname of a URL for display purposes.", ["utility", "url-parsing"], "simple", [23, 29])
funode(p, "ResourceViewerModal", "Renders the resource viewer modal, embedding a YouTube player or linking out to the external resource, closing on Escape or backdrop click.", ["component", "modal"], "moderate", [37, 127])
for fn in ["getYouTubeId","hostOf","ResourceViewerModal"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:getYouTubeId", "exports", 0.8)
edge(p, f"function:{p}:ResourceViewerModal", "exports", 0.8)

# --- RoadmapContainers.tsx ---
p = f"{SD}/components/RoadmapContainers.tsx"
fnode(p, "RoadmapContainers.tsx", "React Flow custom node types for visual grouping containers used in the roadmap graph: cluster boxes and stage bands.", ["component", "roadmap", "react-flow"], "simple")
nodes.append({"id": f"class:{p}:ClusterBoxNode" .replace('class:','function:'), })
nodes.pop()
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/lib/stageColors.ts", "imports", 0.7)

# --- RoadmapVectorGraph.tsx ---
p = f"{SD}/components/RoadmapVectorGraph.tsx"
fnode(p, "RoadmapVectorGraph.tsx", "Core React Flow-based roadmap visualization: computes a dynamic layered layout of roadmap nodes/edges by stage, renders zoom controls and a sticky stage header.", ["component", "roadmap", "react-flow", "layout-algorithm"], "complex", "Implements a custom hierarchical layout algorithm (getDynamicLayoutedElements) grouping nodes by learning stage and parent chains rather than using a generic graph layout library.")
funode(p, "ZoomSlider", "Renders a zoom control slider synced with the React Flow viewport zoom level.", ["component", "react-flow"], "simple", [30, 69])
funode(p, "StageStickyHeader", "Renders a sticky header showing the current visible learning stage based on scroll/viewport position.", ["component", "react-flow"], "moderate", [77, 119])
funode(p, "getDynamicLayoutedElements", "Computes node positions and cluster/stage grouping boxes for the roadmap graph using a custom hierarchical column layout algorithm keyed by learning stage.", ["utility", "layout-algorithm", "roadmap"], "complex", [154, 422])
funode(p, "RoadmapVectorGraph", "Top-level React Flow canvas component rendering the laid-out roadmap nodes/edges, handling node click callbacks and optimistic status overrides.", ["component", "roadmap", "react-flow"], "complex", [424, 575])
for fn in ["ZoomSlider","StageStickyHeader","getDynamicLayoutedElements","RoadmapVectorGraph"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:getDynamicLayoutedElements", "exports", 0.8)
edge(p, f"function:{p}:RoadmapVectorGraph", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/CustomRoadmapNode.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/RoadmapContainers.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/lib/stageColors.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edges.append({"source": f"function:{p}:StageStickyHeader", "target": f"function:{SD}/lib/stageColors.ts:getStageColor", "type": "calls", "direction": "forward", "weight": 0.8})
edges.append({"source": f"function:{p}:StageStickyHeader", "target": f"function:{SD}/lib/stageColors.ts:getStageLabel", "type": "calls", "direction": "forward", "weight": 0.8})

# --- StageLegend.tsx ---
p = f"{SD}/components/StageLegend.tsx"
fnode(p, "StageLegend.tsx", "Small legend component listing roadmap learning stages with their associated colors, used alongside the roadmap graph.", ["component", "roadmap", "legend"], "simple")
funode(p, "StageLegend", "Renders a color-coded legend of learning stages sourced from STAGE_LEGEND.", ["component", "legend"], "simple", [7, 45])
edge(p, f"function:{p}:StageLegend", "contains", 1.0)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/lib/stageColors.ts", "imports", 0.7)

# --- StudentProfileSetupModal.tsx ---
p = f"{SD}/components/StudentProfileSetupModal.tsx"
fnode(p, "StudentProfileSetupModal.tsx", "Multi-field onboarding modal collecting student profile details (career interest, date of birth, etc.) inside the OnboardingShell, submitting via the dashboard services.", ["component", "onboarding", "form", "modal"], "complex")
funode(p, "StudentProfileSetupModal", "Manages profile form state and validation, submits student profile data, and renders the onboarding shell with profile fields.", ["component", "onboarding", "form"], "complex", [27, 399])
funode(p, "getCareerCategory", "Derives a display category/grouping label from a career object.", ["utility"], "simple", [404, 415])
funode(p, "Field", "Local labeled field wrapper rendering label, hint/error text, and children input.", ["component", "form"], "simple", [417, 442])
for fn in ["StudentProfileSetupModal","getCareerCategory","Field"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:StudentProfileSetupModal", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/DatePicker.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/context/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/OnboardingShell.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- StudentRoadmapPageView.tsx ---
p = f"{SD}/components/StudentRoadmapPageView.tsx"
fnode(p, "StudentRoadmapPageView.tsx", "Main student roadmap page: orchestrates career selection, the roadmap graph, curriculum panel, recommendations, resource viewer, and skill/profile modals into a single dashboard view.", ["component", "roadmap", "page", "dashboard"], "complex", "Large orchestration component (600+ lines) composing many feature sub-components and normalizing API response shapes with helper functions.")
funode(p, "unwrapProfile", "Unwraps a possibly-nested API response envelope to get the raw student profile object.", ["utility", "data-normalization"], "simple", [62, 66])
funode(p, "getProfileCareerId", "Extracts the selected career ID from a student profile object.", ["utility"], "simple", [68, 75])
funode(p, "getProfileCareerName", "Extracts the selected career display name from a student profile object.", ["utility"], "simple", [77, 82])
funode(p, "CareerSelector", "Renders a searchable dropdown for choosing/changing the student's target career, with save/cancel actions.", ["component", "form"], "complex", [84, 204])
funode(p, "getLinkMeta", "Parses a raw resource link value into metadata used for rendering resource links.", ["utility", "url-parsing"], "simple", [225, 233])
funode(p, "StudentRoadmapPageView", "Top-level page component that loads dashboard data and composes the roadmap graph, panels, and modals for the student roadmap experience.", ["component", "page", "dashboard"], "complex", [235, 884])
for fn in ["unwrapProfile","getProfileCareerId","getProfileCareerName","CareerSelector","getLinkMeta","StudentRoadmapPageView"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:StudentRoadmapPageView", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/modals/ConfirmModal.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/context/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/FptCurriculumPanel.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/ResourceViewerModal.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/RoadmapRecommendationsPanel.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/RoadmapVectorGraph.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/StageLegend.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/StudentHeader.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/StudentProfileSetupModal.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/StudentSkillSelectionModal.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/hooks/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/lib/stageColors.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/shared/index.ts", "imports", 0.7)

# --- StudentSkillSelectionModal.tsx ---
p = f"{SD}/components/StudentSkillSelectionModal.tsx"
fnode(p, "StudentSkillSelectionModal.tsx", "Onboarding modal for selecting the student's known skills, part of the OnboardingShell flow, submitting selections via dashboard services.", ["component", "onboarding", "form", "modal"], "moderate")
funode(p, "StudentSkillSelectionModal", "Manages skill selection state, loads available skills, and submits the chosen skills through the onboarding flow.", ["component", "onboarding"], "moderate", [17, 197])
edge(p, f"function:{p}:StudentSkillSelectionModal", "contains", 1.0)
edge(p, f"function:{p}:StudentSkillSelectionModal", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/components/ui/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/components/OnboardingShell.tsx", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- RoadmapProgressContext.tsx ---
p = f"{SD}/hooks/RoadmapProgressContext.tsx"
fnode(p, "RoadmapProgressContext.tsx", "React context provider and hook exposing shared roadmap progress state (e.g., optimistic node status updates) to descendant components.", ["hook", "context", "state-management"], "moderate")
funode(p, "RoadmapProgressProvider", "Context provider component that holds and exposes roadmap progress state to its subtree.", ["hook", "context"], "moderate", [1, 1])
funode(p, "useRoadmapProgress", "Hook for consuming the RoadmapProgressContext, throwing if used outside the provider.", ["hook", "context"], "simple", [1, 1])
edge(p, f"function:{p}:RoadmapProgressProvider", "contains", 1.0)
edge(p, f"function:{p}:useRoadmapProgress", "contains", 1.0)
edge(p, f"function:{p}:RoadmapProgressProvider", "exports", 0.8)
edge(p, f"function:{p}:useRoadmapProgress", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)

# --- useDashboardData.ts ---
p = f"{SD}/hooks/useDashboardData.ts"
fnode(p, "useDashboardData.ts", "Custom hook for fetching and managing student dashboard data (roadmap/profile) state used by the student dashboard page.", ["hook", "data-fetching"], "simple")
funode(p, "useDashboardData", "Fetches student dashboard data and exposes loading/error/data state to consuming components.", ["hook", "data-fetching"], "simple", [1, 1])
edge(p, f"function:{p}:useDashboardData", "contains", 1.0)
edge(p, f"function:{p}:useDashboardData", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)

# --- useStudentSetup.ts ---
p = f"{SD}/hooks/useStudentSetup.ts"
fnode(p, "useStudentSetup.ts", "Custom hook driving the student onboarding/setup flow (profile + skill selection), coordinating calls to studentDashboardService.", ["hook", "onboarding"], "moderate")
funode(p, "getProfileCareerId", "Extracts the career ID from a profile-like object for setup flow logic.", ["utility"], "simple", [1, 1])
funode(p, "useStudentSetup", "Manages the multi-step student setup/onboarding process state and submission calls.", ["hook", "onboarding"], "moderate", [1, 1])
edge(p, f"function:{p}:getProfileCareerId", "contains", 1.0)
edge(p, f"function:{p}:useStudentSetup", "contains", 1.0)
edge(p, f"function:{p}:useStudentSetup", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/studentDashboardService.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)
edges.append({"source": f"function:{p}:useStudentSetup", "target": "function:FrontEnd/intelipath-frontend/src/features/student-dashboard/services/studentDashboardService.ts:getSkillErrorMessage", "type": "calls", "direction": "forward", "weight": 0.8})

# --- stageColors.ts ---
p = f"{SD}/lib/stageColors.ts"
fnode(p, "stageColors.ts", "Central definitions for roadmap learning-stage ordering, colors, labels, and legend metadata used across roadmap visualization components.", ["utility", "constants", "roadmap"], "moderate")
funode(p, "getStageStyle", "Returns style/class info for a given learning stage.", ["utility"], "simple", [32, 35])
funode(p, "getStageColor", "Returns the color associated with a given learning stage.", ["utility"], "simple", [37, 38])
funode(p, "getStageLabel", "Returns the human-readable label for a given learning stage.", ["utility"], "simple", [40, 41])
for fn in ["getStageStyle","getStageColor","getStageLabel"]:
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
    edge(p, f"function:{p}:{fn}", "exports", 0.8)

# --- services/index.ts ---
p = f"{SD}/services/index.ts"
fnode(p, "index.ts", "Barrel file re-exporting the student-dashboard feature's service modules for simplified imports.", ["barrel", "service"], "simple")

# --- studentDashboardService.ts ---
p = f"{SD}/services/studentDashboardService.ts"
fnode(p, "studentDashboardService.ts", "Service layer for the student dashboard: normalizes API responses (career, skills, roadmap, resources, progress) into consistent frontend shapes and exposes dashboard API calls.", ["service", "api-client", "data-normalization"], "complex")
funcs = ["unwrapResponse","normalizeCareerRole","emptySkillResponse","isValidSkillItem","normalizeSkillResponse","normalizeStatus","parseResourceField","normalizeResource","normalizeNode","normalizeStudentRoadmap","normalizeRoadmapProgress","getSkillErrorMessage"]
lrs = {"unwrapResponse":[68,74],"normalizeCareerRole":[76,88],"emptySkillResponse":[90,95],"isValidSkillItem":[97,100],"normalizeSkillResponse":[102,115],"normalizeStatus":[117,121],"parseResourceField":[123,133],"normalizeResource":[135,150],"normalizeNode":[152,173],"normalizeStudentRoadmap":[175,236],"normalizeRoadmapProgress":[238,249],"getSkillErrorMessage":[251,269]}
descs = {
 "unwrapResponse":"Unwraps a raw API response envelope to get the inner data payload.",
 "normalizeCareerRole":"Normalizes a raw career API object into the frontend CareerRole shape.",
 "emptySkillResponse":"Returns a default empty skill-selection response object.",
 "isValidSkillItem":"Type-guards whether a raw value is a valid skill item.",
 "normalizeSkillResponse":"Normalizes a raw skill API response into the frontend skill response shape.",
 "normalizeStatus":"Normalizes a raw status string into a known roadmap node status value.",
 "parseResourceField":"Parses a raw resource field (string or object) into a consistent structure.",
 "normalizeResource":"Normalizes a raw resource entry into the frontend Resource shape.",
 "normalizeNode":"Normalizes a raw roadmap node API object into the frontend RoadmapNode shape.",
 "normalizeStudentRoadmap":"Normalizes the full raw student roadmap API response (nodes, edges, career) into the frontend shape.",
 "normalizeRoadmapProgress":"Normalizes raw roadmap progress API data into the frontend progress shape.",
 "getSkillErrorMessage":"Maps a caught error to a user-facing skill-selection error message.",
}
for fn in funcs:
    funode(p, fn, descs[fn], ["service", "data-normalization"], "simple", lrs[fn])
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
edge(p, f"function:{p}:getSkillErrorMessage", "exports", 0.8)
edge(p, "file:FrontEnd/intelipath-frontend/src/api/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/features/student-dashboard/types/index.ts", "imports", 0.7)
edge(p, "file:FrontEnd/intelipath-frontend/src/lib/utils.ts", "imports", 0.7)

# --- types/index.ts ---
p = f"{SD}/types/index.ts"
fnode(p, "index.ts", "Barrel file re-exporting the student-dashboard feature's TypeScript type definitions.", ["barrel", "type-definition"], "simple")
edge(p, f"file:{SD}/types/studentDashboard.types.ts", "imports", 0.7)

# --- studentDashboard.types.ts ---
p = f"{SD}/types/studentDashboard.types.ts"
fnode(p, "studentDashboard.types.ts", "TypeScript type/interface definitions for the student dashboard domain: roadmap nodes, progress, career, skills, and resources.", ["type-definition", "data-model"], "moderate")

# --- lib/utils.ts ---
p = "FrontEnd/intelipath-frontend/src/lib/utils.ts"
fnode(p, "utils.ts", "Shared frontend utility functions: class-name merging, validation helpers (email, password, UUID), date formatting, and error-message extraction, used across the whole application.", ["utility", "validation", "shared"], "moderate")
funcs = ["cn","isValidEmail","isValidPassword","isUuid","toIsoDateOnly","getErrorMessage","formatPrerequisite"]
descs2 = {
 "cn":"Merges Tailwind/class-variance-authority class names, resolving conflicts (clsx + tailwind-merge pattern).",
 "isValidEmail":"Validates whether a string is a well-formed email address.",
 "isValidPassword":"Validates whether a string meets the password strength/format requirements.",
 "isUuid":"Validates whether a string is a well-formed UUID.",
 "toIsoDateOnly":"Converts a Date/date-like value to an ISO 8601 date-only string (YYYY-MM-DD).",
 "getErrorMessage":"Extracts a human-readable message from an unknown error/exception value.",
 "formatPrerequisite":"Formats a prerequisite/requirement value into display text.",
}
for fn in funcs:
    funode(p, fn, descs2[fn], ["utility"], "simple", [1,1])
    edge(p, f"function:{p}:{fn}", "contains", 1.0)
    edge(p, f"function:{p}:{fn}", "exports", 0.8)

with open("D:/Project/IntelIRoadMap/.ua/intermediate/batch-7.json", "w", encoding="utf-8") as f:
    json.dump({"nodes": nodes, "edges": edges}, f, indent=2)

print("nodes:", len(nodes), "edges:", len(edges))
