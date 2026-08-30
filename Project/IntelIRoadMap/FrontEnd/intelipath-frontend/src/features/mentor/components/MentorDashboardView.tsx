import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { UserHeaderActions, Logo, SharedAppBackground } from '@/components/ui';
import { useAuth } from '@/context';
import { ROUTES } from '@/shared';
import { MentorHeader } from './MentorHeader';

// Sections
import {
  WelcomeBanner,
  MetricStrip,
  PendingReviewsWidget
} from './MentorDashboardWidgets';
import mentorApi from '@/features/mentor/api/mentorApi';
import { Users, Layers, Timer } from 'lucide-react';
import { ChatTeardropText } from '@phosphor-icons/react';
import { MentorEPortfoliosView } from './MentorEPortfoliosView';
import { MentorCoursesView } from './MentorCoursesView';
import MarketPulsePageView from '@/features/student/market-pulse/MarketPulsePageView';

export function MentorDashboardView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<any>(null);
  // Set when the request itself failed, so a broken backend is not
  // rendered as an empty dashboard.
  const [loadError, setLoadError] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    mentorApi.getMetrics().then(res => {
      setMetrics(res);
      setMetricsLoading(false);
    }).catch(() => {
      setLoadError('Could not load your dashboard metrics. Please refresh or try again shortly.');
      setMetricsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clean up the state so refreshing doesn't get stuck
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  useGSAP(() => {
    gsap.from(".gsap-fade-section", {
      y: 40,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      clearProps: "all"
    });
  }, { scope: containerRef, dependencies: [activeTab] });

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div ref={containerRef} className="relative min-h-[100dvh] overflow-x-hidden bg-transparent pb-32 pt-[120px] font-sans text-slate-900 selection:bg-black/10">
      <SharedAppBackground />
      {loadError && (
        <div role="alert" className="mx-auto mb-6 max-w-[1680px] rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
          {loadError}
        </div>
      )}
      
      <MentorHeader
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
      />

      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <section className="gsap-fade-section">
              <WelcomeBanner user={user} />
              {/*
                Every label here now says what the field actually holds. Three of the four
                used to lie: "TOTAL MENTEES" counts students who sent a review request —
                there is no roster and no assignment anywhere in the schema; "FEEDBACK SENT"
                only counts the last seven days; and "AVG. PROGRESS" was rendering
                responseTime, a duration, under a label about progress. The DTO has no
                progress field at all.
              */}
              <div className="mt-6">
                <MetricStrip
                  isLoading={metricsLoading}
                  items={[
                    { title: 'WAITING ON YOU', icon: Layers, data: metrics?.pendingReviews },
                    { title: 'STUDENTS WHO ASKED', icon: Users, data: metrics?.mentees },
                    { title: 'FEEDBACK SENT · 7 DAYS', icon: ChatTeardropText, data: metrics?.feedbacks },
                    { title: 'AVG. RESPONSE', icon: Timer, data: metrics?.responseTime },
                  ]}
                />
              </div>
            </section>

            {/*
              The queue leads. A mentor's only tie to a student in this system is a
              portfolio review request, so the page is an inbox, not a roster.
            */}
            <section className="gsap-fade-section">
              <PendingReviewsWidget />
            </section>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="gsap-fade-section">
            <MentorCoursesView />
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div className="gsap-fade-section">
            <MentorEPortfoliosView />
          </div>
        )}

        {activeTab === 'market' && (
          <div className="gsap-fade-section pt-10">
            <MarketPulsePageView hideLayout={true} />
          </div>
        )}
      </div>
    </div>
  );
}
