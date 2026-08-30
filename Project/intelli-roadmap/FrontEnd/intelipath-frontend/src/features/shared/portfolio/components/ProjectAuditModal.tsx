import React, { useEffect, useState } from 'react';
import { FileText, FileX, Loader2, Sparkles, AlertCircle, Lock, Globe, GitCommitHorizontal, Code2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from '@/components/ui';
import { portfolioApi, type GithubImportAudit } from '@/features/shared/portfolio/api/portfolioApi';

/**
 * How the AI arrived at one imported project.
 *
 * <p>An import is not a read-only action: it spends a model call and then rewrites the
 * student's profile — evidence, proficiency, completed roadmap nodes. Everything that
 * happened in between used to live in a container log, which meant a student whose level
 * moved had no way to ask why, and a student whose level did not move had no way to find
 * out that their README was empty.
 *
 * <p>Deliberately shows the unflattering parts: files that came back empty, skills the
 * evidence layer refused, claims that lost to a stronger one. An explanation that only
 * lists successes is advertising.
 */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
  projectName: string;
  /** Mentor view supplies an authorized reader for the student's stored snapshot. */
  loadAudit?: (repoUrl: string) => Promise<GithubImportAudit | null>;
}

const STATUS_COPY: Record<GithubImportAudit['skills'][number]['status'], { label: string; className: string }> = {
  ACCEPTED: { label: 'Counted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Superseded', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  PENDING: { label: 'Not weighed yet', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  NOT_RECORDED: { label: 'Not in your catalog', className: 'bg-slate-50 text-slate-400 border-slate-200' },
};

const STATUS_EXPLAINER: Record<GithubImportAudit['skills'][number]['status'], string> = {
  ACCEPTED: 'counted towards your profile',
  REJECTED: 'you already had stronger proof of this skill, so this claim was set aside',
  PENDING: 'recorded, but nothing has weighed it yet',
  NOT_RECORDED: 'the AI named a skill that is not in your career\'s skill list, so it was dropped rather than invented',
};

export const ProjectAuditModal: React.FC<Props> = ({ open, onOpenChange, repoUrl, projectName, loadAudit }) => {
  const [audit, setAudit] = useState<GithubImportAudit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Distinguishes "no record exists" from "the request failed" — a missing audit is a
  // real answer about an old import, not an error to retry.
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    setFailed(false);
    const getAudit = loadAudit ?? portfolioApi.getGithubAudit;
    getAudit(repoUrl)
      .then(result => {
        if (cancelled) return;
        setAudit(result);
        setNotFound(result === null);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, repoUrl, loadAudit]);

  const readSources = audit?.sources.filter(source => source.found) ?? [];
  const emptySources = audit?.sources.filter(source => !source.found) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} /> How this write-up was made
          </DialogTitle>
          <DialogDescription>
            Everything the AI read for <span className="font-medium text-slate-700">{projectName}</span>, and what
            your profile did with each skill it found.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500">
            <Loader2 className="animate-spin" size={26} />
            <p className="text-sm">Reading the record…</p>
          </div>
        )}

        {!isLoading && failed && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-500">
            <AlertCircle className="text-amber-500" size={28} />
            <p className="max-w-sm text-sm">Could not load the record for this project. Please try again.</p>
          </div>
        )}

        {!isLoading && notFound && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-500">
            <FileX size={28} className="text-slate-300" />
            <p className="max-w-sm text-sm">
              No record for this project. It was added before InteliPath started keeping one — re-import it from
              GitHub and the next analysis will be recorded.
            </p>
          </div>
        )}

        {!isLoading && audit && (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {/* 0. Whose work is this? Asked first, because every claim below depends on it. */}
            {audit.authorshipVerdict && (
              <section
                className={[
                  'rounded-lg border px-3 py-2.5',
                  audit.authorshipVerdict === 'CONTRIBUTED'
                    ? 'border-emerald-200 bg-emerald-50'
                    : audit.authorshipVerdict === 'NOT_CONTRIBUTED'
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-slate-200 bg-slate-50',
                ].join(' ')}
              >
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {audit.authorshipVerdict === 'CONTRIBUTED' ? (
                    <GitCommitHorizontal size={13} />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  Your work in this repository
                </h4>
                <p className="text-sm text-slate-700">{audit.authorshipReason}</p>
                {audit.totalCommits > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                    <div
                      className={
                        audit.authorCommits > 0 ? 'h-full bg-emerald-500' : 'h-full bg-rose-400'
                      }
                      style={{
                        width: `${Math.max(2, Math.round((audit.authorCommits / audit.totalCommits) * 100))}%`,
                      }}
                    />
                  </div>
                )}
                {audit.evidenceBlocked && (
                  <p className="mt-2 text-xs font-medium text-rose-700">
                    No skills were credited from this project. It stays on your portfolio, but it does not
                    change your level.
                  </p>
                )}
                {audit.authorshipVerdict === 'UNKNOWN' && (
                  /* Said out loud so the absence of a check is never mistaken for a passed one. */
                  <p className="mt-2 text-xs text-slate-500">
                    Authorship could not be checked, so skills were credited as normal rather than held back
                    on a guess.
                  </p>
                )}
              </section>
            )}

            {/* 1. What it read */}
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Files it read</h4>
              <div className="space-y-1.5">
                {readSources.map(source => (
                  <div key={source.path} className="flex items-center gap-2 text-sm">
                    <FileText size={14} className="flex-shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-700">{source.path}</span>
                    <span className="text-xs text-slate-400">{source.chars.toLocaleString()} characters</span>
                  </div>
                ))}
                {readSources.length === 0 && (
                  <p className="text-sm text-amber-700">
                    Nothing was readable in this repository. The AI had only the repository name and its GitHub
                    description to work from, which is why the write-up may be thin.
                  </p>
                )}
                {/* GitHub's own byte count. The check on a config file that declares a
                    framework the repository barely uses. */}
                {audit.languageBytes && Object.keys(audit.languageBytes).length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Code2 size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="text-slate-500">
                      {Object.entries(audit.languageBytes)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([language, bytes]) => {
                          const total = Object.values(audit.languageBytes ?? {}).reduce((s, n) => s + n, 0)
                          return `${language} ${total > 0 ? Math.round((bytes / total) * 100) : 0}%`
                        })
                        .join(' · ')}
                    </span>
                  </div>
                )}
                {emptySources.map(source => (
                  <div key={source.path} className="flex items-center gap-2 text-sm text-slate-400">
                    <FileX size={14} className="flex-shrink-0" />
                    <span>{source.path}</span>
                    <span className="text-xs">not found or empty</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. What it was asked */}
            <section className="rounded-lg bg-slate-50 px-3 py-2.5">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">What it was asked</h4>
              <p className="text-sm text-slate-600">
                Match this project against the{' '}
                <span className="font-semibold text-slate-800">{audit.catalogSize.toLocaleString()} skills</span>
                {audit.careerName ? <> most in demand for <span className="font-semibold text-slate-800">{audit.careerName}</span></> : null}.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                {audit.model && <span>Model: {audit.model}</span>}
                {audit.fetchMode && (
                  <span className="inline-flex items-center gap-1">
                    {audit.fetchMode === 'AUTHENTICATED' ? <Lock size={11} /> : <Globe size={11} />}
                    {audit.fetchMode === 'AUTHENTICATED'
                      ? 'Read with your GitHub account, so private files were visible'
                      : 'Read without your account — private files were invisible'}
                  </span>
                )}
                {audit.analyzedAt && <span>{new Date(audit.analyzedAt).toLocaleString()}</span>}
              </div>
            </section>

            {/* 2b. What this student actually did — as opposed to what the project is. */}
            {audit.commitSubjects && audit.commitSubjects.length > 0 && (
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your commits it read ({audit.commitSubjects.length})
                </h4>
                <ul className="space-y-1">
                  {audit.commitSubjects.slice(0, 8).map((subject, index) => (
                    <li key={`${index}-${subject}`} className="flex items-start gap-2 text-xs text-slate-600">
                      <GitCommitHorizontal size={12} className="mt-0.5 flex-shrink-0 text-slate-300" />
                      <span className="min-w-0 flex-1 truncate">{subject}</span>
                    </li>
                  ))}
                </ul>
                {audit.commitSubjects.length > 8 && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    and {audit.commitSubjects.length - 8} more
                  </p>
                )}
              </section>
            )}

            {/* 3. What came back, and what became of it */}
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Skills it found ({audit.skills.length})
              </h4>
              {audit.skills.length === 0 ? (
                <p className="text-sm text-slate-500">
                  The AI matched no skills here, so this project did not change your profile.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {audit.skills.map(skill => (
                    <div
                      key={skill.skill}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-slate-100 px-2.5 py-1.5"
                    >
                      <span className="font-medium text-slate-800">{skill.skill}</span>
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {Math.round(skill.confidence * 100)}% confident
                      </span>
                      <span
                        className={[
                          'ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium',
                          STATUS_COPY[skill.status].className,
                        ].join(' ')}
                        title={STATUS_EXPLAINER[skill.status]}
                      >
                        {STATUS_COPY[skill.status].label}
                      </span>
                      <p className="w-full text-[11px] text-slate-400">{STATUS_EXPLAINER[skill.status]}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. The write-up itself, last — it is the output, not the evidence. */}
            {audit.summary && (
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  The summary it wrote
                </h4>
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
                  {audit.summary}
                </p>
              </section>
            )}

            {audit.techStack && Object.keys(audit.techStack).length > 0 && (
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tech stack it detected
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(audit.techStack).flatMap(([group, value]) =>
                    (Array.isArray(value) ? value : [value]).map((item, index) => (
                      <Badge key={`${group}-${index}`} variant="default">
                        {String(item)}
                      </Badge>
                    )),
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
