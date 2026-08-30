import React, { useEffect, useState } from 'react';
import { Lock, Star, GitFork, Loader2, AlertCircle, RefreshCw, Check, ChevronDown, Sparkles, FileCode2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Badge } from '@/components/ui';
import { portfolioApi, GithubRankedRepo, type GithubImportAudit, type RepoSourcePlan } from '@/features/shared/portfolio/api/portfolioApi';
import { useGithubLink } from '@/features/shared/portfolio/hooks/useGithubLink';
import { toast } from '@/lib/toast';

// lucide-react dropped brand marks, so we ship our own GitHub glyph (same path as the
// login screen's) and reuse it across the portfolio Sync-GitHub UI.
export const GithubIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
    <path
      d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99a2.6 2.6 0 0 1 .76-1.6c-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z"
      fill="currentColor"
    />
  </svg>
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Repo URLs already in the portfolio — shown as "Added" and not re-importable.
   *
   * <p>Omit it and the modal reads the saved portfolio itself. Pass it only when
   * the caller holds a better answer than the server does — the portfolio editor
   * does, because it knows about projects added in the current unsaved edit.
   *
   * <p>The distinction matters: this used to default to `[]`, and a caller that
   * simply forgot got "nothing has been imported" rather than "I don't know".
   * The evidence nudge forgot, so every repository the student had already
   * imported was offered again as if it were new.
   */
  existingRepoUrls?: string[];
  /** Receives the raw backend project entries (PortfolioProjectResponse[]) to append. */
  onImported: (projects: any[]) => void;
}

const TIER_VARIANT: Record<GithubRankedRepo['qualityTier'], 'success' | 'info' | 'default'> = {
  HIGH: 'success',
  MEDIUM: 'info',
  LOW: 'default',
};

const TIER_LABEL: Record<GithubRankedRepo['qualityTier'], string> = {
  HIGH: 'Top pick',
  MEDIUM: 'Good',
  LOW: 'Basic',
};

const normalizeUrl = (url: string) => url.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const GithubSyncModal: React.FC<Props> = ({ open, onOpenChange, existingRepoUrls, onImported }) => {
  const [repos, setRepos] = useState<GithubRankedRepo[]>([]);
  /** Fallback for callers that did not supply `existingRepoUrls`. */
  const [savedRepoUrls, setSavedRepoUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Repos whose score breakdown is open, by fullName. Independent of selection. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sourcePlans, setSourcePlans] = useState<RepoSourcePlan[]>([]);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'mapping' | 'analyzing'>('idle');
  const [analysisResults, setAnalysisResults] = useState<Array<{ project: any; audit: GithubImportAudit | null }>>([]);
  // needsReconnect => GitHub isn't linked / token expired; offer the OAuth reconnect button.
  const [error, setError] = useState<{ message: string; needsReconnect: boolean } | null>(null);
  // Link state and its actions are shared with the profile settings page, so the two
  // cannot drift into different ideas of what "connected" means.
  const { link, isBusy: isUnlinking, refresh: loadStatus, connect: reconnect,
          disconnect, changeAccount } = useGithubLink();
  // Disconnecting logs the student out of GitHub here, so it asks first rather than
  // firing on a stray click next to "Import".
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const existing = new Set((existingRepoUrls ?? savedRepoUrls).map(normalizeUrl));

  const loadRepos = async () => {
    setIsLoading(true);
    setError(null);
    setSelected(new Set());
    setExpanded(new Set());
    setConfirmingDisconnect(false);
    setAnalysisResults([]);
    try {
      // Only when the caller stayed silent. Failing here must not block the
      // picker — worst case the student is offered a repository they already
      // have, which is where this started and is still better than no list.
      if (existingRepoUrls === undefined) {
        try {
          const portfolio = await portfolioApi.getPortfolio();
          setSavedRepoUrls(
            (portfolio.projects ?? [])
              .map((project) => project.codeLink)
              .filter((url): url is string => Boolean(url) && url !== '#'),
          );
        } catch (err) {
          console.warn('[GithubSync] Could not read the saved portfolio; "Added" marks may be missing:', err);
        }
      }
      const data = await portfolioApi.listGithubRepos();
      setRepos(data);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message as string | undefined;
      if (status === 400) {
        setError({
          message: serverMsg || 'Connect your GitHub account to sync repositories.',
          needsReconnect: true,
        });
      } else if (status === 503) {
        setError({ message: serverMsg || 'GitHub sync is not available right now.', needsReconnect: false });
      } else {
        setError({ message: 'Could not load your repositories. Please try again.', needsReconnect: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadStatus();
      loadRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleExpanded = (fullName: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const toggle = (repoUrl: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(repoUrl)) next.delete(repoUrl);
      else next.add(repoUrl);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setIsImporting(true);
    setSourcePlans([]);
    setAnalysisPhase('mapping');
    try {
      const repoUrls = Array.from(selected);
      const plans = await portfolioApi.planGithubAnalysis(repoUrls);
      setSourcePlans(plans);
      setAnalysisPhase('analyzing');
      const projects = await portfolioApi.importGithubBatch(repoUrls);
      if (!projects || projects.length === 0) {
        toast.error('None of the selected repositories could be analyzed. Please try again.');
        return;
      }
      const audits = await Promise.all(
        projects.map((project: any) => portfolioApi.getGithubAudit(project.repoUrl).catch(() => null)),
      );
      setAnalysisResults(projects.map((project: any, index: number) => ({ project, audit: audits[index] })));
    } catch (err: any) {
      toast.error(err?.response?.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Import failed. The AI service may be busy — please try again.');
    } finally {
      setIsImporting(false);
      setAnalysisPhase('idle');
      setSourcePlans([]);
    }
  };

  const handleApplyResults = async () => {
    const projects = analysisResults.map(result => result.project);
    await Promise.resolve(onImported(projects));
    toast.success(`Added ${projects.length} project${projects.length > 1 ? 's' : ''} to your portfolio.`);
    onOpenChange(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    // Radix can emit a dismiss while the dialog is reflowing after the long-running
    // request. Analysis and review are protected states: only explicit actions below
    // may leave them, so a completed result can never disappear on arrival.
    if (!nextOpen && (isImporting || analysisResults.length > 0)) return;
    onOpenChange(nextOpen);
  };

  // Unlinking leaves this modal showing a repo list the student can no longer use, so it
  // also clears the picker and drops back to the "Connect GitHub" invite.
  const handleDisconnect = async () => {
    if (!(await disconnect())) return;
    setRepos([]);
    setSelected(new Set());
    setConfirmingDisconnect(false);
    setError({ message: 'Connect your GitHub account to sync repositories.', needsReconnect: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GithubIcon size={20} /> Sync from GitHub
          </DialogTitle>
          <DialogDescription>
            We ranked your repositories by portfolio quality. Pick the ones you want and InteliPath AI
            will write up each project for you.
          </DialogDescription>
        </DialogHeader>

        {/* Connected account strip — also the only place to disconnect or switch accounts. */}
        {link?.linked && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            {confirmingDisconnect ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  Disconnect{link.githubLogin ? ` @${link.githubLogin}` : ''}? Projects you already
                  imported stay in your portfolio.
                </p>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUnlinking}
                    onClick={() => setConfirmingDisconnect(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" disabled={isUnlinking} onClick={handleDisconnect} className="gap-1.5">
                    {isUnlinking && <Loader2 className="animate-spin" size={13} />}
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <GithubIcon size={16} className="flex-shrink-0 text-slate-700" />
                  <span className="truncate text-xs text-slate-600">
                    Connected as{' '}
                    <span className="font-semibold text-slate-800">
                      {link.githubLogin ? `@${link.githubLogin}` : 'your GitHub account'}
                    </span>
                  </span>
                  {link.repoAccess && (
                    <Badge variant="info">
                      <Lock size={10} className="mr-1" /> Private repos
                    </Badge>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUnlinking}
                    onClick={changeAccount}
                    className="gap-1.5"
                  >
                    {isUnlinking ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
                    Change account
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUnlinking}
                    onClick={() => setConfirmingDisconnect(true)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm">Reading your repositories…</p>
          </div>
        )}

        {/* Needs connect (friendly invite) / real error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            {error.needsReconnect ? (
              <GithubIcon size={32} className="text-slate-700" />
            ) : (
              <AlertCircle className="text-amber-500" size={32} />
            )}
            <p className="max-w-sm text-sm text-slate-600">
              {error.needsReconnect
                ? 'Connect your GitHub account to browse and import your repositories.'
                : error.message}
            </p>
            {error.needsReconnect ? (
              <Button onClick={reconnect} className="gap-2">
                <GithubIcon size={16} /> Connect GitHub
              </Button>
            ) : (
              <Button variant="outline" onClick={loadRepos} className="gap-2">
                <RefreshCw size={16} /> Try again
              </Button>
            )}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-500">
            <GithubIcon size={32} className="text-slate-300" />
            <p className="text-sm">No repositories found on your GitHub account.</p>
          </div>
        )}

        {/* Repo list */}
        {!isLoading && !error && repos.length > 0 && analysisResults.length === 0 && (
          <>
            <div className="-mx-1 max-h-[52vh] space-y-2 overflow-y-auto px-1 py-1">
              {repos.map(repo => {
                const isAdded = existing.has(normalizeUrl(repo.repoUrl));
                const isChecked = selected.has(repo.repoUrl);
                const isOpen = expanded.has(repo.fullName);
                return (
                  <div
                    key={repo.fullName}
                    className={[
                      'rounded-lg border transition-colors',
                      isAdded
                        ? 'border-slate-100 bg-slate-50 opacity-70'
                        : isChecked
                          ? 'border-indigo-400 bg-indigo-50/60'
                          : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    {/* Selecting and inspecting are separate controls: reading why a repo
                        scored what it did should never tick a box by accident. */}
                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => !isAdded && toggle(repo.repoUrl)}
                      className={[
                        'flex w-full items-start gap-3 p-3 text-left',
                        isAdded ? 'cursor-not-allowed' : 'hover:bg-slate-50/70',
                      ].join(' ')}
                    >
                      {/* Checkbox */}
                      <span
                        className={[
                          'mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border',
                          isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white',
                        ].join(' ')}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-slate-800">{repo.name}</span>
                          {repo.isPrivate && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                              <Lock size={11} /> Private
                            </span>
                          )}
                          <Badge variant={TIER_VARIANT[repo.qualityTier]}>{TIER_LABEL[repo.qualityTier]}</Badge>
                          {isAdded && <Badge variant="default">Added</Badge>}
                        </div>

                        {/* The full owner/name, because two repositories can share a name —
                            which is exactly the case for a fork of your own team's repo. */}
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">{repo.fullName}</p>

                        {repo.description ? (
                          <p className={['mt-1 text-xs text-slate-600', isOpen ? '' : 'line-clamp-2'].join(' ')}>
                            {repo.description}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic text-slate-400">
                            No description on GitHub — the AI will have less to read.
                          </p>
                        )}

                        {/* The ranker's own reasons. They were computed all along and never shown. */}
                        {repo.highlights?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {repo.highlights.map(highlight => (
                              <span
                                key={highlight}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          {repo.language && <span className="font-medium text-slate-500">{repo.language}</span>}
                          <span className="inline-flex items-center gap-1"><Star size={11} /> {repo.stars}</span>
                          <span className="inline-flex items-center gap-1"><GitFork size={11} /> {repo.forks}</span>
                          {repo.lastPushedAt && <span>pushed {formatDate(repo.lastPushedAt)}</span>}
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(repo.fullName)}
                        className="flex w-full items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700"
                      >
                        <ChevronDown
                          size={13}
                          className={['transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
                        />
                        Why score {repo.qualityScore}/100?
                      </button>

                      {isOpen && (
                        <div className="mt-2 space-y-1.5 pb-1">
                          {/* Said plainly, because a number beside a repository invites the
                              reading that an AI judged the project. Nothing here is AI. */}
                          <p className="text-[11px] text-slate-400">
                            Computed from GitHub metadata only — no AI has read this repository yet.
                          </p>
                          {repo.scoreBreakdown?.map(line => (
                            <div key={line.label} className="flex items-baseline gap-2 text-[11px]">
                              <span
                                className={[
                                  'w-12 flex-shrink-0 text-right font-semibold tabular-nums',
                                  line.points > 0 ? 'text-slate-700' : 'text-slate-300',
                                ].join(' ')}
                              >
                                {line.points}/{line.max}
                              </span>
                              <span className="font-medium text-slate-600">{line.label}</span>
                              <span className="min-w-0 flex-1 text-slate-400">{line.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isImporting && (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-3" role="status" aria-live="polite">
                <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500" />
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-200">
                    <Sparkles size={16} className="animate-pulse" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">InteliPath AI · live source context</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {analysisPhase === 'mapping' ? 'Mapping the repository source tree…' : 'Reading real implementation files…'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                        {sourcePlans.reduce((total, plan) => total + plan.sourcePaths.length, 0)} source files selected
                      </span>
                    </div>
                    {sourcePlans.length > 0 && (
                      <div className="mt-2 max-h-32 space-y-2 overflow-y-auto pr-1">
                        {sourcePlans.map(plan => (
                          <div key={plan.repoUrl}>
                            <p className="mb-1 truncate text-[11px] font-semibold text-slate-600">{plan.repoFullName}</p>
                            <div className="grid gap-1 sm:grid-cols-2">
                              {plan.sourcePaths.map(path => (
                                <div key={path} title={path} className="flex min-w-0 items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-600 ring-1 ring-slate-100">
                                  <FileCode2 size={11} className="flex-shrink-0 text-cyan-600" />
                                  <span className="truncate font-mono">{path}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-slate-400">
                      Exact files sent as source evidence — this list is returned by the backend, not simulated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">
                {selected.size > 0 ? `${selected.size} selected` : 'Select repositories to import'}
              </span>
              <div className="flex min-w-0 items-center justify-end gap-3">
              <Button
                variant="brand"
                disabled={selected.size === 0 || isImporting}
                onClick={handleImport}
                className="flex-shrink-0 gap-2"
              >
                {isImporting ? <Loader2 className="animate-spin" size={16} /> : <GithubIcon size={16} />}
                {isImporting ? 'Analyzing…' : `Import ${selected.size > 0 ? selected.size : ''}`.trim()}
              </Button>
              </div>
            </div>
          </>
        )}

        {analysisResults.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Analysis complete</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Review what InteliPath AI found before adding it.</p>
              <p className="mt-0.5 text-xs text-slate-600">Summaries and verified skill candidates below came from the source files shown during analysis.</p>
            </div>

            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {analysisResults.map(({ project, audit }) => {
                const stack = Object.keys(project.techStack ?? {});
                return (
                  <article key={project.repoUrl} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-900">{project.projectName}</p>
                        <p className="truncate text-[11px] text-slate-400">{project.repoUrl}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                        {audit?.sources.filter(source => source.found).length ?? 0} files read
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">AI project summary</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {project.description || 'The repository was analyzed, but the model did not return a usable summary.'}
                      </p>
                    </div>

                    {stack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {stack.map(name => <Badge key={name} variant="info">{name}</Badge>)}
                      </div>
                    )}

                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Skill evidence</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(audit?.skills ?? []).map(skill => (
                          <span key={skill.skill} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                            {skill.skill} · {Math.round(skill.confidence * 100)}%
                          </span>
                        ))}
                        {(audit?.skills?.length ?? 0) === 0 && (
                          <span className="text-xs text-amber-700">No career skill had strong enough source evidence.</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white py-3">
              <Button variant="outline" onClick={() => setAnalysisResults([])}>Back to repositories</Button>
              <Button variant="brand" onClick={handleApplyResults} className="gap-2">
                <Check size={15} /> Add {analysisResults.length} to portfolio
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
