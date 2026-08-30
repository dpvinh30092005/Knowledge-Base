// Stage palette for the roadmap graph.
// The five stages form a "heat" journey (cool cyan at the start, warm pink at
// job-ready) so a student can read their progression at a glance. Colours are
// vivid enough to keep the node's black text readable.

export type RoadmapStage =
  | "FOUNDATION" | "CORE" | "PRACTICAL" | "ADVANCED" | "JOB_READY";

export interface StageStyle {
  /** Canonical stage key. */
  key: RoadmapStage;
  /** Human label for legends/badges. */
  label: string;
  /** Vivid fill for spine nodes and accent stripes. */
  color: string;
}

export const STAGE_ORDER: RoadmapStage[] = [
  "FOUNDATION", "CORE", "PRACTICAL", "ADVANCED", "JOB_READY",
];

const STAGE_STYLES: Record<RoadmapStage, StageStyle> = {
  FOUNDATION: { key: "FOUNDATION", label: "Foundation", color: "#67e8f9" }, // cyan-300
  CORE:       { key: "CORE",       label: "Core",       color: "#34d399" }, // emerald-400
  PRACTICAL:  { key: "PRACTICAL",  label: "Practical",  color: "#fde047" }, // yellow-300
  ADVANCED:   { key: "ADVANCED",   label: "Advanced",   color: "#fb923c" }, // orange-400
  JOB_READY:  { key: "JOB_READY",  label: "Job Ready",  color: "#f472b6" }, // pink-400
};

const FALLBACK_COLOR = "#e2e8f0"; // slate-200, for nodes with no stage

export const getStageStyle = (stage?: string | null): StageStyle | null => {
  if (!stage) return null;
  return STAGE_STYLES[stage.toUpperCase() as RoadmapStage] ?? null;
};

export const getStageColor = (stage?: string | null): string =>
  getStageStyle(stage)?.color ?? FALLBACK_COLOR;

export const getStageLabel = (stage?: string | null): string =>
  getStageStyle(stage)?.label ?? "General";

/** Ordered list for rendering a legend. */
export const STAGE_LEGEND: StageStyle[] = STAGE_ORDER.map((key) => STAGE_STYLES[key]);
