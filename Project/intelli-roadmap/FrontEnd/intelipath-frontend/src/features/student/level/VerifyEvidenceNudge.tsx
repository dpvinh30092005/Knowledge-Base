import { useState } from 'react'
// lucide dropped its brand glyphs, so there is no GitHub mark here. GitBranch is
// the same family GithubSyncModal already uses for repository chrome.
import { ShieldCheck, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui'
import { GithubSyncModal } from '@/features/shared/portfolio/components/GithubSyncModal'
import { useGithubLink } from '@/features/shared/portfolio/hooks/useGithubLink'
import { portfolioApi } from '@/features/shared/portfolio/api/portfolioApi'
import type { StudentLevel } from '../types'

type Props = {
  level: StudentLevel | null
  /** Re-fetch the level after an import, so the numbers move while the student watches. */
  onSynced?: () => void
  className?: string
}

/** One persistence path shared by Dashboard/Assessment and Roadmap imports. */
export async function persistImportedGithubProjects(imported: any[]) {
  if (!imported?.length) return
  const portfolio = await portfolioApi.getPortfolio()
  const already = new Set(
    (portfolio.projects ?? []).map((project) => (project.codeLink || '').toLowerCase()),
  )
  const added = imported
    .map((project) => ({
      id: project.projectId ?? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: project.projectName || 'Project',
      tech: project.techStack ? Object.values(project.techStack).flat().join(', ') : '',
      description: project.description || '',
      icon: 'fab fa-github',
      codeLink: project.repoUrl || '#',
      demoLink: project.demoUrl || '#',
    }))
    .filter((project) => !already.has(project.codeLink.toLowerCase()))

  if (added.length) {
    await portfolioApi.updatePortfolio({
      ...portfolio,
      projects: [...(portfolio.projects ?? []), ...added],
    })
  }
}

/**
 * Asks the student to connect GitHub, with the reason stated as their own numbers.
 *
 * The trigger is not "GitHub is not connected" — it is `verifiedCoverage` sitting
 * under the floor that caps the level at JUNIOR. That is the one thing connecting
 * GitHub actually changes, and it is what SeniorityCalculator's own comment says
 * this prompt is for: "that gives the student a concrete reason to connect GitHub
 * or upload a transcript".
 *
 * So it disappears once the ceiling is lifted, and it never appears for a student
 * it would not help. A banner that shows regardless is an advert; this is an
 * explanation of a number they are already looking at.
 */
export default function VerifyEvidenceNudge({ level, onSynced, className = '' }: Props) {
  const [syncOpen, setSyncOpen] = useState(false)
  const { link } = useGithubLink()
  const linked = Boolean(link?.linked)

  /**
   * Writes the imported repositories into the portfolio, then refreshes the level.
   *
   * <p>This callback used to drop its argument on the floor. The import itself
   * still worked — the backend records the skill evidence, which is what this
   * nudge exists to raise — but the projects were never saved anywhere, so they
   * did not appear in the portfolio and the picker offered the very same
   * repositories again the next time it opened, with nothing marked "Added".
   *
   * <p>Saving is best-effort and never blocks the refresh: the evidence is
   * already recorded server-side by the time this runs, and losing the level
   * update because a portfolio write failed would hide the one result the
   * student opened this for.
   */
  const saveImportedProjects = async (imported: any[]) => {
    setSyncOpen(false)
    try {
      await persistImportedGithubProjects(imported)
    } catch (err) {
      console.warn('[VerifyEvidenceNudge] Import counted, but saving it to the portfolio failed:', err)
    } finally {
      onSynced?.()
    }
  }

  // No level means they skipped the assessment; there is no ceiling to explain yet.
  if (!level) return null

  const floor = level.verifiedFloor ?? 0.3
  const verifiedCoverage = level.verifiedCoverage ?? 0
  if (verifiedCoverage >= floor) return null

  const verified = level.verifiedCount
  const required = level.requiredCount
  const hasCounts = typeof verified === 'number' && typeof required === 'number' && required > 0

  // Light-only, stated plainly rather than through `dark:` pairs. This block used to
  // carry them, and on a dark-mode machine `dark:text-amber-100` painted near-white
  // text onto a page that stays white — the heading was invisible. index.css now binds
  // `dark:` to an explicit data-theme so it cannot happen again; the contrast here was
  // worth raising regardless. Measured after the fix, in OS dark mode: heading 14.47:1,
  // body 8.73:1, against an AA floor of 4.5.
  return (
    <div
      className={`rounded-xl border border-amber-300 bg-amber-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">
            {hasCounts
              ? `${verified} of your ${required} required skills have objective evidence.`
              : 'Almost none of your skills have objective evidence yet.'}
          </p>
          {/* Two different situations wore one sentence. A student who has
              already connected GitHub and imported repositories was still told
              to "connect GitHub" — an instruction they had followed, with no
              account of why the count was still zero. Naming the account makes
              the message about the repositories rather than the connection. */}
          <p className="mt-1 text-sm text-amber-900">
            Below {Math.round(floor * 100)}% your level stays capped at Junior, however much you
            claim.{' '}
            {linked
              ? `${link?.githubLogin ? `${link.githubLogin} is connected` : 'GitHub is connected'} — import the repositories that show these skills and they will count.`
              : 'Connecting GitHub lets your own repositories count.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-2"
            onClick={() => setSyncOpen(true)}
          >
            <GitBranch className="size-4" />
            {linked ? 'Import repositories' : 'Connect GitHub'}
          </Button>
        </div>
      </div>

      <GithubSyncModal
        open={syncOpen}
        onOpenChange={setSyncOpen}
        onImported={saveImportedProjects}
      />
    </div>
  )
}
