import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioApi, PortfolioData } from '@/features/shared/portfolio/api/portfolioApi';
import { EPortfolioEditor } from '@/features/shared/portfolio/components/EPortfolioEditor';
import { SharedAppBackground } from '@/components/ui';


export const PublicPortfolioPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    portfolioApi.getPublicPortfolio(slug).then((res) => {
      if (!res) {
        setError("Portfolio not found.");
      } else {
        setData(res);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setError("Failed to load portfolio.");
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center relative overflow-hidden">
        <SharedAppBackground />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center relative overflow-hidden">
        <SharedAppBackground />
        <div className="relative flex flex-col items-center justify-center mb-8 z-10 bg-white/80 p-8 rounded-2xl shadow-sm backdrop-blur-sm border border-slate-200">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">
            {error ? error : "Portfolio not found."}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <EPortfolioEditor initialData={data} isPublicView={true} />
    </div>
  );
};
