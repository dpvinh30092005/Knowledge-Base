import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import mentorApi from '@/features/mentor/api/mentorApi';

export function MentorProgressReportsView() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  // Set when the request itself failed, so a broken backend is not
  // rendered as an empty dashboard.
  const [loadError, setLoadError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mentorApi.getProgressReports().then((res: any) => {
      setData(res);
      setIsLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoadError('Could not load progress reports. Please refresh or try again shortly.');
      setIsLoading(false);
    });
  }, []);

  useGSAP(() => {
    if (!isLoading && data) {
      gsap.from(".gsap-progress-item", {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "all"
      });
      gsap.from(".gsap-bar-fill", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.2
      });
    }
  }, { scope: containerRef, dependencies: [isLoading, data] });

  const metrics = data?.metrics || [];
  const studentsProgress = data?.studentsProgress || [];
  const needsAttention = data?.needsAttention || [];
  const skillGaps = data?.skillGaps || [];

  return (
    <div ref={containerRef} className="pb-10">
      {loadError && (
        <div role="alert" className="mx-auto mb-6 max-w-[1680px] rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
          {loadError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900 tracking-tight mb-2">Progress Reports</h2>
          <p className="text-[14px] text-slate-500 font-medium">Roadmap node completion across your mentees</p>
        </div>
        <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-[13px] rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]">
          Export
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => <div key={i} className="h-28 bg-white border border-slate-200/60 rounded-3xl p-6" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white border border-slate-200/60 rounded-3xl p-6" />
            <div className="space-y-6">
              <div className="h-48 bg-white border border-slate-200/60 rounded-3xl p-6" />
              <div className="h-48 bg-white border border-slate-200/60 rounded-3xl p-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.length > 0 ? (
              metrics.map((m: any, i: number) => (
                <div key={i} className="gsap-progress-item bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">{m.label}</p>
                  <p className={`text-[32px] font-bold leading-none tracking-tight ${m.color}`}>{m.value}</p>
                </div>
              ))
            ) : (
              <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex items-center justify-center text-slate-400 text-sm font-medium">
                No metrics available yet.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Node Completion */}
            <div className="gsap-progress-item lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-8">NODE COMPLETION PER STUDENT</h3>
              
              <div className="space-y-8">
                {studentsProgress.length > 0 ? (
                  studentsProgress.map((student: any, i: number) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f8fafc] ring-1 ring-slate-900/5 flex items-center justify-center text-[13px] font-bold text-slate-700">
                            {student.initials}
                          </div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-bold text-slate-900">{student.name}</h4>
                            <span className="text-[13px] text-slate-400 font-medium">{student.ratio}</span>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-slate-900">{student.percent}%</span>
                      </div>
                      
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`gsap-bar-fill h-full ${student.color} rounded-full`} style={{ width: `${student.percent}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-medium">No progress data available yet.</div>
                )}
              </div>
            </div>

            {/* Right Column: Needs Attention & Skill Gaps */}
            <div className="space-y-6">
              <div className="gsap-progress-item bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-5">NEEDS ATTENTION</h3>
                <div className="space-y-4">
                  {needsAttention.length > 0 ? (
                    needsAttention.map((student: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold ${student.bg} ${student.text}`}>
                            {student.initials}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-900">{student.name}</h4>
                            <p className="text-[12px] text-slate-500 font-medium">{student.desc}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ring-1 ${student.bg} ${student.text} ${student.ring}`}>
                          {student.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-4 text-slate-400 text-sm font-medium">No students currently at risk.</div>
                  )}
                </div>
              </div>

              <div className="gsap-progress-item bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-5">MOST COMMON SKILL GAPS</h3>
                <div className="space-y-4">
                  {skillGaps.length > 0 ? (
                    skillGaps.map((skill: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[14px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00838f]" />
                          <span className="font-bold text-slate-700">{skill.name}</span>
                        </div>
                        <span className="text-slate-500 font-medium">{skill.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-4 text-slate-400 text-sm font-medium">No skill gaps identified yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
