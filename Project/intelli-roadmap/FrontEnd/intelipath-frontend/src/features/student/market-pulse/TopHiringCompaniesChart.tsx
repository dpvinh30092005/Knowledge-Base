import React from 'react';
import { TopCompany } from './marketPulse';
import { motion } from 'framer-motion';

interface Props {
  data: TopCompany[];
}

export default function TopHiringCompaniesChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Find max jobs to calculate progress bar width
  const maxJobs = Math.max(...data.map(d => d.recruitmentCount));

  return (
    <div className="flex flex-col gap-4">
      {data.map((company, index) => (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          key={company.topCvCompanyId || index} 
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => window.open(company.companyLink, '_blank')}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
            <img 
              src={company.logo} 
              alt={company.name} 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/40x40/f8fafc/94a3b8?text=Logo';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-[#00838f] transition-colors line-clamp-2 pr-2">{company.name}</h4>
              <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">{company.recruitmentCount} jobs</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(company.recruitmentCount / maxJobs) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 + index * 0.05, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00838f] to-[#00b4c5] rounded-full"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
