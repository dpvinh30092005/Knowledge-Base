import type { PortfolioLearningJourney } from '@/features/shared/portfolio/api/portfolioApi';
import type { StudentRoadmap } from '@/features/student/types/studentDashboard.types';

type RawRoadmapNode = {
  stage?: string | null;
  status?: string | null;
  children?: RawRoadmapNode[] | null;
};

const collectNodes = (nodes: RawRoadmapNode[], result: RawRoadmapNode[] = []): RawRoadmapNode[] => {
  for (const node of nodes) {
    result.push(node);
    if (Array.isArray(node.children)) collectNodes(node.children, result);
  }
  return result;
};

/** Adapts the authenticated roadmap endpoint to the portfolio's read-only view model. */
export const toPortfolioLearningJourney = (roadmap: StudentRoadmap): PortfolioLearningJourney | null => {
  if (!roadmap.targetCareerRole) return null;

  const raw = roadmap._rawResponse as { nodes?: RawRoadmapNode[] } | undefined;
  const stageCounts = new Map<string, { totalNodes: number; completedNodes: number; currentNodes: number }>();
  for (const node of collectNodes(Array.isArray(raw?.nodes) ? raw.nodes : [])) {
    const name = node.stage?.trim() || 'Roadmap';
    const counts = stageCounts.get(name) ?? { totalNodes: 0, completedNodes: 0, currentNodes: 0 };
    counts.totalNodes += 1;
    if (node.status?.toLowerCase() === 'completed') counts.completedNodes += 1;
    if (node.status?.toLowerCase() === 'current') counts.currentNodes += 1;
    stageCounts.set(name, counts);
  }

  return {
    targetCareerRole: roadmap.targetCareerRole,
    progress: roadmap.progress ?? 0,
    readiness: roadmap.readiness ?? null,
    readinessVerified: roadmap.readinessVerified ?? null,
    readinessRequiredCount: roadmap.readinessRequiredCount ?? null,
    readinessHeldCount: roadmap.readinessHeldCount ?? null,
    readinessVerifiedCount: roadmap.readinessVerifiedCount ?? null,
    coreSkills: (roadmap.coreSkills ?? []).map(skill => ({
      skillName: skill.skillName,
      importance: skill.importance ?? null,
      proficiency: skill.proficiency ?? null,
      verifiedBy: skill.verifiedBy ?? null,
      marketJobCount: skill.marketDemand?.jobCount ?? null,
    })),
    stages: Array.from(stageCounts, ([name, counts]) => ({ name, ...counts })),
  };
};
