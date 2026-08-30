import React, { useState, useEffect, useRef } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import mentorApi from '@/features/mentor/api/mentorApi';

export function MentorFeedbackHistoryView() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Set when the request itself failed, so a broken backend is not rendered as
  // an empty history.
  const [loadError, setLoadError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    mentorApi.getFeedbackHistory().then(res => {
      setData(res);
      setIsLoading(false);
    }).catch(() => {
      setData([]);
      setLoadError('Could not load your feedback history. Please refresh or try again shortly.');
      setIsLoading(false);
    });
  }, []);

  useGSAP(() => {
    if (!isLoading && data && data.length > 0) {
      gsap.from(".gsap-feedback-card", {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
    }
  }, { scope: containerRef, dependencies: [isLoading, data] });

  return (
    <div ref={containerRef} className="pb-10">
      {loadError && (
        <div role="alert" className="mx-auto mb-6 max-w-[1680px] rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
          {loadError}
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-slate-900 tracking-tight mb-2">Feedback History</h2>
        <p className="text-[14px] text-slate-500 font-medium">Review your recent feedback to students</p>
      </div>

      <div className="flex flex-col gap-6">
        {isLoading || !data || data.length === 0 ? (
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
               <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div className="space-y-2 flex-1">
                     <div className="h-4 bg-slate-100 w-32 rounded" />
                     <div className="h-3 bg-slate-100 w-16 rounded" />
                  </div>
               </div>
               <div className="h-12 bg-slate-50 rounded-xl" />
            </div>
          ))
        ) : (
          data.map((item: any) => (
            <div key={item.id} className="gsap-feedback-card bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-5 group">
              {/* Left border accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#00838f] to-[#00b4d8] rounded-l-3xl" />
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold ${item.avatarBg} ${item.avatarText}`}>
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900">To: {item.name}</h3>
                    <p className="text-[12px] text-slate-400 font-medium mt-0.5">{item.time}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-md ring-1 ring-slate-200 shadow-sm">
                    {item.tag}
                  </span>
                </div>
              </div>

              <div className="pl-3">
                <p className="text-[14px] text-slate-500 font-medium italic leading-relaxed bg-[#f8fafc] p-4 rounded-2xl ring-1 ring-slate-900/5">
                  {item.content}
                </p>
              </div>

              <div className="pl-3 flex justify-end mt-2">
                <button className="flex items-center gap-2 text-[13px] font-bold text-[#00838f] hover:text-[#006064] transition-colors group/btn">
                  <ArrowSquareOut size={16} weight="bold" /> View full conversation
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
