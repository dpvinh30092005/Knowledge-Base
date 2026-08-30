/* Hallmark · macrostructure: Workbench · tone: utilitarian · anchor hue: teal #00838f
 * pre-emit critique: P5 H5 E4 S5 R5 V4
 * Depth system, not widgets. Over the slate-50 blueprint grid (SharedAppBackground),
 * content sits in ONE recessed well per group — the well's slate body shows through 1px
 * gaps as hairline dividers, so cells read as carved into a single surface, not as a
 * scatter of floating glass cards. Only the primary action, and a row on hover, RISE
 * (opaque white = grid hidden = lifted off the plane). Greeting is bare type on the grid.
 */
import { useState, useEffect, useRef } from 'react';
import { Users, Briefcase } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import mentorApi from '@/features/mentor/api/mentorApi';
import { ROUTES } from '@/shared';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/** Chìm — a recessed instrument panel. Its slate body shows through the gap-px between
 *  children as hairline dividers; a light inset top edge carves it into the page. */
const WELL =
  'overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]';
/** A cell resting inside a well: translucent so the grid reads through it (still on the plane). */
const CELL = 'bg-white/45';

export const WelcomeBanner = ({ user }: { user: any }) => {
  return (
    // Bare type on the grid — the greeting belongs to the background, it does not float above it.
    <div>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
        Good morning, {user?.name || user?.fullName || 'Mentor'}
      </h1>
      <p className="mt-1.5 text-[14px] font-medium text-slate-500">
        Here is what is waiting on you, and the feedback you have sent recently.
      </p>
    </div>
  );
};

/** The four readouts share ONE carved bar, split by hairline gaps — not four cards. */
export const MetricStrip = ({
  items,
  isLoading,
}: {
  items: { title: string; icon: any; data: any }[];
  isLoading: boolean;
}) => {
  return (
    <div className={`${WELL} grid grid-cols-2 gap-px lg:grid-cols-4`}>
      {items.map(({ title, icon: Icon, data }) => (
        <div key={title} className={`${CELL} group p-4`}>
          <div className="mb-2 flex items-center gap-2">
            <Icon
              size={15}
              weight="regular"
              className="text-slate-400 transition-colors group-hover:text-[#00838f]"
            />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </p>
          </div>
          {isLoading || data == null ? (
            <div className="h-7 w-14 animate-pulse rounded bg-slate-200/70" />
          ) : (
            <h2 className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
              {typeof data === 'object'
                ? (data.value ?? data.count ?? data.score ?? data.hours ?? '0')
                : data}
            </h2>
          )}
        </div>
      ))}
    </div>
  );
};

/** Back-compat: the old single-tile export, now one cell of the strip's vocabulary. */
export const MetricWidget = ({
  title,
  icon,
  data,
  isLoading,
}: {
  title: string;
  icon: any;
  data: any;
  isLoading: boolean;
}) => <MetricStrip items={[{ title, icon, data }]} isLoading={isLoading} />;

export const PendingReviewsWidget = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    mentorApi
      .getPendingReviews()
      .then(res => {
        setData(res);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, []);

  useGSAP(
    () => {
      if (!isLoading && data && data.length > 0) {
        gsap.from('.gsap-review-row', {
          y: 10,
          autoAlpha: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'all',
        });
      }
    },
    { scope: containerRef, dependencies: [isLoading, data] }
  );

  return (
    <div ref={containerRef} className="mt-10">
      {/* "Mentee" implies a roster. There isn't one: the only mentor-student tie in the
          schema is a portfolio review request, so this list is a queue. */}
      <h3 className="mb-4 text-[18px] font-semibold tracking-tight text-slate-900">
        Waiting on your review
      </h3>

      {isLoading ? (
        <div className={`${WELL} flex flex-col gap-px`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${CELL} flex items-center gap-4 p-5`}>
              <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200/70" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-200/70" />
                <div className="h-3 w-56 animate-pulse rounded bg-slate-200/70" />
              </div>
              <div className="hidden h-9 w-28 animate-pulse rounded-xl bg-slate-200/70 sm:block" />
            </div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className={`${WELL} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Users size={20} weight="regular" />
          </span>
          <p className="text-[15px] font-semibold text-slate-800">Nothing waiting on you</p>
          <p className="max-w-sm text-[13px] font-medium text-slate-500">
            A student appears here once they find you in the mentor directory and send a review
            request from their portfolio.
          </p>
        </div>
      ) : (
        <div className={`${WELL} flex flex-col gap-px`}>
          {data.map((item: any) => {
            const status = item.status || 'Pending review';
            const reviewed = status === 'Reviewed';
            return (
              <div
                key={item.id}
                className={`gsap-review-row ${CELL} flex items-center gap-4 p-5 transition-colors hover:bg-white`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-semibold ${
                    reviewed ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-[#ccfbf1] text-[#0f766e]'
                  }`}
                >
                  {item.initials || item.studentName?.charAt(0) || 'S'}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2.5">
                    <h4 className="truncate text-[15px] font-semibold text-slate-900">
                      {item.studentName || item.name}
                    </h4>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                        reviewed
                          ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/20'
                          : 'bg-amber-50 text-amber-600 ring-amber-500/20'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 truncate text-[12.5px] font-medium text-slate-500">
                    {item.university || item.major}
                    <span className="text-slate-300">·</span>
                    {item.yob ? new Date(item.yob).getFullYear() : item.year}
                    <span className="text-slate-300">·</span>
                    {item.targetCareer || item.role}
                  </p>
                </div>

                {/* Nổi — the one element that lifts off the plane. */}
                <button
                  onClick={() =>
                    navigate(ROUTES.PORTFOLIO_INTERNAL.replace(':slug', item.portfolioSlug))
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 transition-all hover:-translate-y-px hover:text-slate-900 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00838f]/40 active:translate-y-0 active:shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
                >
                  <Briefcase size={15} weight="bold" /> Portfolio
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Kept for compatibility if they are still imported somewhere, though they might be removed later
export const QuickActionsWidget = () => <div />;
export const MentorInsightWidget = () => <div />;
export const CareerDistributionWidget = () => <div />;
