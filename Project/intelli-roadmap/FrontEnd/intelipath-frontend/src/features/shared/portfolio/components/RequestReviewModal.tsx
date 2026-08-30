import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@/components/ui';
import { Send, AlertCircle, CheckCircle2, Loader2, Search, Users, Check } from 'lucide-react';
import studentApi, { type MentorDirectoryEntry } from '@/api/studentApi';

interface RequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Pick a mentor to review the portfolio.
 *
 * This used to be a bare email field, which asked the student for the one fact they had no
 * way of knowing — nothing in the product ever showed them a mentor's address. They now
 * choose from the directory and the email is carried along behind the selection, so the
 * request-review contract is unchanged.
 */
export const RequestReviewModal: React.FC<RequestReviewModalProps> = ({ isOpen, onClose }) => {
  const [mentors, setMentors] = useState<MentorDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MentorDirectoryEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadMentors = async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setMentors(await studentApi.getMentorDirectory());
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMentors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Match on company and focus too: a student usually remembers "the one from FPT Software"
  // rather than a name.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((m) =>
      [m.fullName, m.company, m.industryFocus].some((field) => field?.toLowerCase().includes(q)),
    );
  }, [mentors, query]);

  const handleSubmit = async () => {
    if (!selected) return;
    setError('');
    setIsSubmitting(true);
    try {
      await studentApi.requestPortfolioReview(selected.email);
      setSubmitSuccess(true);
      setTimeout(resetAndClose, 2500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not send the request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitSuccess(false);
      setError('');
      setSelected(null);
      setQuery('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 border border-slate-200 shadow-2xl rounded-2xl bg-white overflow-hidden">
        <div className="p-7">
          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h3 className="mb-1.5 text-xl font-bold text-slate-900">Request sent</h3>
              <p className="max-w-xs text-sm text-slate-500">
                {selected?.fullName} has been notified. You'll get an email once they leave feedback.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-5">
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Request feedback
                </DialogTitle>
                <DialogDescription className="pt-1.5 text-[14px] text-slate-500">
                  Choose a mentor to review your portfolio.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Searching an empty or failed list would be a dead control, so it only
                  appears once there is something to search. */}
              {!isLoading && !loadFailed && mentors.length > 0 && (
                <div className="relative mb-3">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, company or focus"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[14px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center gap-2.5 py-14 text-slate-500">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-sm">Loading mentors…</p>
                </div>
              )}

              {!isLoading && loadFailed && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle size={26} className="text-amber-500" />
                  <p className="text-sm text-slate-600">Could not load the mentor list.</p>
                  <Button variant="outline" size="sm" onClick={loadMentors}>
                    Try again
                  </Button>
                </div>
              )}

              {!isLoading && !loadFailed && mentors.length === 0 && (
                <div className="flex flex-col items-center gap-2.5 py-12 text-center text-slate-500">
                  <Users size={26} className="text-slate-300" />
                  <p className="max-w-xs text-sm">
                    No mentors are available to review portfolios right now.
                  </p>
                </div>
              )}

              {!isLoading && !loadFailed && mentors.length > 0 && (
                <div className="-mx-1 max-h-[46vh] space-y-1.5 overflow-y-auto px-1 py-1">
                  {visible.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-400">
                      No mentor matches “{query}”.
                    </p>
                  )}
                  {visible.map((mentor) => {
                    const isChecked = selected?.userId === mentor.userId;
                    return (
                      <button
                        key={mentor.userId}
                        type="button"
                        onClick={() => setSelected(mentor)}
                        className={[
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                          isChecked
                            ? 'border-indigo-400 bg-indigo-50/60'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-500">
                            {initials(mentor.fullName)}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-slate-800">
                            {mentor.fullName}
                          </p>
                          {/* The email is deliberately not shown: it is how the request is
                              addressed, not something the student needs to read. */}
                          {(mentor.company || mentor.industryFocus) && (
                            <p className="truncate text-[12px] text-slate-500">
                              {[mentor.company, mentor.industryFocus].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>

                        <span
                          className={[
                            'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                            isChecked
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white',
                          ].join(' ')}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  onClick={handleSubmit}
                  disabled={!selected || isSubmitting}
                  className="flex-1 gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
                  {isSubmitting ? 'Sending…' : 'Send request'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
