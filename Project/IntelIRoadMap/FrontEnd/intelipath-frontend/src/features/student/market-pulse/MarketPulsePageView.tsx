import React, { useState, useMemo } from 'react';
import { Select } from "@/components";
import { SharedAppBackground, Skeleton } from '@/components/ui';
import { Search, MapPin, Briefcase, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { RecruitmentPost } from './marketPulse';
import StudentHeader from '@/features/student/common/StudentHeader';
import { useAuth } from '@/context';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared';
import marketPulseApi from '@/features/student/market-pulse/marketPulseApi';
import { normalizeTags } from '@/lib/tags';
import TopHiringCompaniesChart from './TopHiringCompaniesChart';
import TrendingSkillsChart from './TrendingSkillsChart';
import SalaryOverviewChart from './SalaryOverviewChart';
import { TopCompany, SkillTrend, SalaryBracket, Freshness } from './marketPulse';
import { assessmentService } from '../assessment';
import { studentDashboardService } from '../services';


interface MarketPulsePageViewProps {
  hideLayout?: boolean;
}

export default function MarketPulsePageView({ hideLayout = false }: MarketPulsePageViewProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<SkillTrend[]>([]);
  const [salaryOverview, setSalaryOverview] = useState<SalaryBracket[]>([]);
  const [recruitmentPosts, setRecruitmentPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  // How far back every figure on this page looks. A market chart with no period
  // attached gets read as "today", which is the difference between analysis and a
  // screenshot — so the window is explicit, adjustable, and stated on screen.
  const [windowDays, setWindowDays] = useState(30);
  const [freshness, setFreshness] = useState<Freshness | null>(null);
  // The student's assessed level, or null when they skipped the assessment.
  // Null must not become a filter: someone who never told us their level should
  // see the whole market, not be quietly narrowed to FRESHER.
  const [level, setLevel] = useState<string | null>(null);
  // Whether the level filter is actually applied. Defaults on once a level is
  // known, but stays visible and switchable — a page that silently hides most of
  // the market is worse than one that shows too much.
  const [matchLevel, setMatchLevel] = useState(true);
  const [careerId, setCareerId] = useState<string | null>(null);
  const [careerName, setCareerName] = useState<string | null>(null);
  const [levelResolved, setLevelResolved] = useState(false);
  const [careerResolved, setCareerResolved] = useState(false);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!levelResolved || !careerResolved) return;
      try {
        const results = await Promise.allSettled([
          marketPulseApi.getTopHiringCompanies(5, windowDays, careerId, matchLevel ? level : null),
          marketPulseApi.getTrendingSkills(windowDays, careerId, matchLevel ? level : null),
          marketPulseApi.getSalaryOverview(windowDays, careerId, matchLevel ? level : null),
          marketPulseApi.getRecruitmentPosts(matchLevel ? level : null, careerId),
          marketPulseApi.getFreshness(windowDays, careerId, matchLevel ? level : null)
        ]);
        
        const companiesRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
        const skillsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
        const salaryRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
        const postsRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
        const freshnessRes = results[4].status === 'fulfilled' ? results[4].value : null;

        setTopCompanies(companiesRes.data || []);
        setTrendingSkills(skillsRes.data || []);
        setSalaryOverview(salaryRes.data || []);
        setFreshness(freshnessRes?.data ?? null);
        
        // Handle RecruitmentPostResponse (which might have a nested list of posts depending on backend)
        const postsData = postsRes.data?.data || postsRes.data || [];
        // Normalize each post's tags so chips, category grouping and search all
        // work on clean strings instead of raw scraped JSON.
        const normalizedPosts = (Array.isArray(postsData) ? postsData : []).map((post: RecruitmentPost) => ({
          ...post,
          recruitment: post.recruitment
            ? { ...post.recruitment, tags: normalizeTags(post.recruitment.tags) }
            : post.recruitment,
        }));
        setRecruitmentPosts(normalizedPosts);
      } catch (error) {
        console.error("Failed to fetch market pulse data", error);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchDashboardData();
  }, [windowDays, level, matchLevel, careerId, levelResolved, careerResolved]);

  // Resolved once. A 204 (no assessment taken) resolves to null and everything
  // below simply behaves as it did before levels existed.
  React.useEffect(() => {
    let active = true;
    assessmentService
      .getLevel()
      .then((result) => { if (active) setLevel(result?.level ?? null); })
      .catch(() => { if (active) setLevel(null); })
      .finally(() => { if (active) setLevelResolved(true); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    let active = true;
    studentDashboardService.getStudentProfile().then((raw: any) => {
      if (!active) return;
      const profile = raw?.data ?? raw;
      const career = profile?.career;
      setCareerId(profile?.careerId ?? profile?.career_id ?? career?.careerId ?? career?.career_id ?? null);
      setCareerName(profile?.careerName ?? profile?.career_name ?? career?.careerName ?? career?.career_name ?? null);
    }).catch(() => { if (active) { setCareerId(null); setCareerName(null); } })
      .finally(() => { if (active) setCareerResolved(true); });
    return () => { active = false; };
  }, []);

  // The window the trend data actually covers, so the card states its real range instead
  // of the fixed "Last 30 Days / 3 Months" choice that never reached the API.
  const trendingWeeks = useMemo(() => {
    const dates = new Set<string>();
    trendingSkills.forEach((skill) =>
      skill.dataPoints?.forEach((point) => dates.add(point.date))
    );
    return dates.size;
  }, [trendingSkills]);

  const tagGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {
      'Experience': new Set(),
      'Education': new Set(),
      'Perks & Benefits': new Set(),
      'Roles & Skills': new Set(),
    };
    
    recruitmentPosts.forEach(post => {
      post.recruitment?.tags?.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('kinh nghiệm') || lowerTag.includes('năm') || lowerTag.includes('experience') || lowerTag.includes('tháng')) {
          groups['Experience'].add(tag);
        } else if (lowerTag.includes('đại học') || lowerTag.includes('cao đẳng') || lowerTag.includes('thạc sĩ') || lowerTag.includes('cao học') || lowerTag.includes('chuyên môn') || lowerTag.includes('bằng')) {
          groups['Education'].add(tag);
        } else if (lowerTag.includes('bảo hiểm') || lowerTag.includes('hỗ trợ') || lowerTag.includes('thưởng') || lowerTag.includes('chế độ') || lowerTag.includes('trợ cấp') || lowerTag.includes('lương')) {
          groups['Perks & Benefits'].add(tag);
        } else {
          groups['Roles & Skills'].add(tag);
        }
      });
    });
    
    return Object.entries(groups)
      .map(([category, tagsSet]) => ({
        category,
        tags: Array.from(tagsSet).sort()
      }))
      .filter(group => group.tags.length > 0);
  }, [recruitmentPosts]);

  const filteredData = useMemo(() => {
    let result = recruitmentPosts.filter(post => {
      const matchSearch = post.recruitment?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.recruitment?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTag = selectedTag ? post.recruitment?.tags?.includes(selectedTag) : true;
      return matchSearch && matchTag;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.recruitment?.application_deadline || 0).getTime();
      const dateB = new Date(b.recruitment?.application_deadline || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [recruitmentPosts, searchTerm, sortOrder, selectedTag]);

  return (
    <div className={hideLayout ? "w-full" : "flex flex-col min-h-screen w-full relative overflow-hidden bg-transparent pt-24 pb-20"}>
      {!hideLayout && (
        <>
          <SharedAppBackground />
          <StudentHeader
            user={user}
            onLogout={logout}
            onOpenAiMentor={() => navigate(ROUTES.AI_MENTOR)}
          />
        </>
      )}
      
      <div className="max-w-6xl mx-auto w-full px-6 relative z-10 flex flex-col h-full gap-8">
        
        {/* Header — sits on the background, no card chrome */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            {/* Was a "Live job market" badge. It is not live — it is as fresh as the
                last scrape, and saying otherwise is the part a reader would most
                reasonably object to. State the actual date instead. */}
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00838f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00838f]" />
              {freshness?.latestPostedDate
                ? `Job data to ${new Date(freshness.latestPostedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                : 'Job market data'}
            </span>
            <h1 className="text-[36px] font-extrabold leading-none tracking-tight text-slate-900">
              Market Pulse
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-slate-500">
              In-demand skills, salary signals and open roles
              {careerName ? ` for ${careerName}` : ''}{level && matchLevel ? ` at ${level} level` : ''}.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {/* Every figure below is scoped to this window. Exposed as a control
                rather than hard-coded so the number on screen always has a stated
                period behind it. */}
            {/* The level filter states itself and can be switched off. A page that
                narrows the market without saying so reads as "there are only six
                jobs", which is a false impression of the market rather than a
                helpful default. */}
            {level && (
              <button
                type="button"
                onClick={() => setMatchLevel((on) => !on)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  matchLevel
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                {matchLevel ? `${level} roles only` : 'All levels'}
                <span className={matchLevel ? 'text-white/50' : 'text-slate-400'}>
                  {matchLevel ? 'show all' : `show ${level}`}
                </span>
              </button>
            )}

            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWindowDays(days)}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                    windowDays === days
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {!loading && freshness && (
              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="text-3xl font-black tabular-nums text-slate-900">
                    {freshness.jobsInWindow}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-400">
                    jobs in {freshness.windowDays}d
                  </span>
                </div>
                {/* "New" means never advertised before, not "posted recently" — a role
                    re-listed every fortnight would otherwise look new every fortnight. */}
                <p className="text-[12px] font-medium text-slate-400">
                  {freshness.newJobs} never advertised before
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard — sections sit directly on the background, separated by hairlines
            rather than boxed into cards, so the page reads as one surface. */}
        <div className="flex flex-col gap-9">
          <div className="grid grid-cols-1 gap-9 lg:grid-cols-5 lg:gap-12">
            {/* Top Hiring Companies */}
            <section className="lg:col-span-2">
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Top hiring companies
              </h3>
              <p className="mb-5 text-[13px] text-slate-500">Who is posting the most roles.</p>
              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/40" />)}
                </div>
              ) : topCompanies.length === 0 ? (
                <p className="py-10 text-center text-[13px] font-medium text-slate-500">
                  No data available at the moment.
                </p>
              ) : (
                <TopHiringCompaniesChart data={topCompanies} />
              )}
            </section>

            {/* Salary Overview */}
            <section className="lg:col-span-3">
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Salary overview
              </h3>
              <p className="mb-5 text-[13px] text-slate-500">
                How open roles spread across salary ranges.
              </p>
              {loading ? (
                <Skeleton className="h-[300px] w-full rounded-xl bg-white/40" />
              ) : (
                <SalaryOverviewChart data={salaryOverview} />
              )}
            </section>
          </div>

          {/* Trending Skills — full width below, so the rows stay short in two columns */}
          <section className="border-t border-slate-900/[0.06] pt-8">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Trending skills demand
              </h3>
              {!loading && trendingWeeks > 0 && (
                <span className="shrink-0 text-[12px] font-medium text-slate-400">
                  Last {trendingWeeks} {trendingWeeks === 1 ? 'week' : 'weeks'}
                </span>
              )}
            </div>
            <p className="mb-5 text-[13px] text-slate-500">
              Ranked by openings, with the change since the previous reading.
            </p>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-xl bg-white/40" />
            ) : (
              <TrendingSkillsChart data={trendingSkills} />
            )}
          </section>
        </div>

        {/* Open positions — section header + toolbar live directly on the background */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Open positions</h2>
              <span className="rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[12px] font-bold tabular-nums text-slate-500">
                {filteredData.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:flex-none">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search jobs or companies…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-slate-200/70 bg-white/70 py-2 pl-9 pr-4 text-[13px] outline-none backdrop-blur-sm transition-all focus:border-[#00838f] focus:bg-white focus:ring-2 focus:ring-[#00838f]/15"
                />
              </div>
              <Select
                wrapperClassName="w-full sm:w-[200px]"
                className="rounded-full border-slate-200/70 bg-white/70 text-[13px] font-semibold text-slate-700 backdrop-blur-sm"
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
              >
                <option value="">All tags</option>
                {tagGroups.map(group => (
                  <optgroup key={group.category} label={group.category}>
                    {group.tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-[13px] font-semibold text-slate-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900"
              >
                Deadline {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>

          {/* Job list — barely-there surface, hairline-separated rows that light up on hover */}
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-[88px] rounded-xl bg-white/40" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="rounded-2xl bg-white/30 py-16 text-center text-[13px] text-slate-500 ring-1 ring-slate-900/[0.04]">
              No recruitment posts found matching your search.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 overflow-hidden rounded-2xl bg-white/25 ring-1 ring-slate-900/[0.04]">
              {filteredData.map((post) => (
                <div
                  key={post.post_id}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/70 sm:px-5"
                >
                  {/* Logo */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-slate-200/70">
                    <img
                      src={post.company?.logo}
                      alt={post.company?.name}
                      className="h-full w-full rounded-lg object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/40x40/f8fafc/94a3b8?text=Logo';
                      }}
                    />
                  </div>

                  {/* Main */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 title={post.recruitment?.title} className="truncate text-[15px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-[#00838f]">
                      {post.recruitment?.title}
                    </h3>
                    <div className="truncate text-[12.5px] font-medium text-slate-500">
                      <span>{post.company?.name}</span>
                      {post.recruitment?.seniority && (
                        <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white">
                          {post.recruitment.seniority}
                        </span>
                      )}
                    </div>
                    {/* Inline meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                      {post.recruitment?.location && (
                        <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" />{post.recruitment.location}</span>
                      )}
                      {post.recruitment?.salary && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><DollarSign size={13} className="text-slate-400" />{post.recruitment.salary}</span>
                      )}
                      {post.recruitment?.experience && (
                        <span className="inline-flex items-center gap-1.5"><Briefcase size={13} className="text-slate-400" />{post.recruitment.experience}</span>
                      )}
                    </div>
                    {post.recruitment?.tags && post.recruitment.tags.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                        {post.recruitment.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="rounded-md bg-[#00838f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00838f]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex shrink-0 flex-col items-end gap-2.5">
                    {post.recruitment?.application_deadline && (
                      <span className="hidden items-center gap-1.5 text-[12px] font-medium text-slate-500 sm:inline-flex">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(post.recruitment.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <a
                      href={post.recruitment?.recruitment_link || '#'}
                      target={post.recruitment?.recruitment_link ? "_blank" : "_self"}
                      rel="noreferrer"
                      onClick={(e) => {
                        if (!post.recruitment?.recruitment_link || post.recruitment.recruitment_link === '#') {
                          e.preventDefault();
                          if (post.company?.company_link) {
                            window.open(post.company.company_link, '_blank');
                          }
                        }
                      }}
                      className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-slate-900 px-4 py-1.5 text-[12.5px] font-bold !text-white transition-all hover:bg-[#00838f] group-hover:shadow-sm"
                    >
                      View <ChevronRight size={13} strokeWidth={3} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
