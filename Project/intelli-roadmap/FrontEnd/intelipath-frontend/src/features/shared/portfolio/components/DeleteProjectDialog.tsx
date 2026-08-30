import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, EyeOff, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@/components/ui';
import { portfolioApi, type RepoEvidence } from '@/features/shared/portfolio/api/portfolioApi';

/**
 * Asks what "delete" means before doing it.
 *
 * <p>A portfolio project and the skill evidence it produced are separate records with
 * separate lifetimes. Deleting the project used to leave the evidence behind, so a
 * student kept a level earned by work no longer shown anywhere; making deletion cascade
 * instead would mean a tidying-up gesture silently lowered their level, with no warning
 * and no undo. Neither answer is right for everyone, so neither is assumed.
 *
 * <p>The question is only worth asking when there is something to lose. A project with
 * no verifying evidence — a manual entry, a repository whose claims all lost to stronger
 * ones — deletes immediately, because a dialog offering a choice between two identical
 * outcomes is just friction.
 */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
  projectName: string;
  /**
   * Removes the project from the portfolio. Called for both answers — the two options
   * differ in what happens to the evidence, not in whether the project goes.
   */
  onConfirm: () => void;
}

export const DeleteProjectDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  repoUrl,
  projectName,
  onConfirm,
}) => {
  const [evidence, setEvidence] = useState<RepoEvidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!open || !repoUrl) return;
    let cancelled = false;
    setLoading(true);
    setEvidence(null);
    portfolioApi
      .getRepoEvidence(repoUrl)
      .then((result) => {
        if (cancelled) return;
        setEvidence(result);
        // Nothing is at stake, so nothing is asked. The dialog closes itself and the
        // deletion goes through as if the student had never been interrupted.
        if (result.verifyingCount === 0) {
          onOpenChange(false);
          onConfirm();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onConfirm/onOpenChange are stable enough for this modal's lifetime; re-running on
    // their identity would re-fetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, repoUrl]);

  const verifying = evidence?.skills.filter((row) => row.status === 'ACCEPTED') ?? [];

  const keepSkills = () => {
    onOpenChange(false);
    onConfirm();
  };

  const dropSkills = async () => {
    setWithdrawing(true);
    try {
      await portfolioApi.withdrawRepoEvidence(repoUrl);
      onOpenChange(false);
      onConfirm();
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Trash2 className="size-5 text-slate-500" />
            Remove {projectName}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            This project is the proof behind {verifying.length}{' '}
            {verifying.length === 1 ? 'skill' : 'skills'} on your profile.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Checking what this project proves…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {verifying.map((row) => (
                <span
                  key={row.skill}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                >
                  {row.skill}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              {/* The recommended answer sits first and reads as the calm one. Taking a
                  project off display is a presentation choice; it is not a statement
                  that the work was never done. */}
              <button
                type="button"
                onClick={keepSkills}
                disabled={withdrawing}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                <EyeOff className="mt-0.5 size-5 shrink-0 text-slate-500" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    Just remove it from my portfolio
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">
                    The skills stay verified. Your level does not change.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={dropSkills}
                disabled={withdrawing}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
              >
                {withdrawing ? (
                  <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-red-500" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-red-500" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    Remove it and give up what it proved
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">
                    These skills go back to being self-declared. Your verified share drops,
                    and your level may drop with it.
                  </span>
                </span>
              </button>
            </div>

            <Button variant="ghost" size="sm" className="w-full" onClick={() => onOpenChange(false)}>
              Keep the project
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProjectDialog;
