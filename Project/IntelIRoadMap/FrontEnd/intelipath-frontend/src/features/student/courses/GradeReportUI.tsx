import React from 'react';
// Original: import { motion } from 'framer-motion';
import { motion, Variants } from 'framer-motion';
import { Award, TrendingUp, AlertCircle, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';

export interface GradeReportData {
  summary: {
    totalCredits: number;
    gpa: number;
    rank: string;
  };
  highlights: {
    courseCode: string;
    courseName: string;
    grade: number;
    advice: string;
  }[];
  improvements: {
    courseCode: string;
    courseName: string;
    grade: number;
    advice: string;
  }[];
}

interface GradeReportUIProps {
  data: GradeReportData;
}

/* Original containerVariants:
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
*/
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

/* Original itemVariants:
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
*/
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function GradeReportUI({ data }: GradeReportUIProps) {
  if (!data || !data.summary) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden my-6 font-sans"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100/50 rounded-xl">
            <GraduationCap size={22} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-zinc-800 m-0 leading-tight">Grade Analysis Report</h3>
            <p className="text-zinc-500 text-[13px] m-0 mt-0.5">AI-Powered Transcript Evaluation</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div variants={itemVariants} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-slate-500 text-[13px] font-semibold uppercase tracking-wider mb-1">Total Credits</span>
            <span className="text-3xl font-black text-slate-800">{data.summary.totalCredits}</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-indigo-600 text-[13px] font-semibold uppercase tracking-wider mb-1">Cumulative GPA</span>
            <span className="text-3xl font-black text-indigo-700">{data.summary.gpa}</span>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <Award size={64} className="absolute -right-4 -bottom-4 text-emerald-200/50" />
            <span className="text-emerald-600 text-[13px] font-semibold uppercase tracking-wider mb-1 relative z-10">Academic Rank</span>
            <span className="text-xl font-bold text-emerald-700 relative z-10 mt-1">{data.summary.rank}</span>
          </motion.div>
        </div>

        {/* Highlights Section */}
        {data.highlights && data.highlights.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp size={16} strokeWidth={2.5} />
              </div>
              <h4 className="text-base font-bold text-slate-800 m-0">Top Performing Courses</h4>
            </div>
            
            <div className="space-y-3">
              {data.highlights.map((course, idx) => (
                <div key={idx} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-zinc-100 bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 rounded-lg border border-emerald-100 shrink-0">
                      <span className="text-emerald-700 font-bold text-lg leading-none">{course.grade}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">{course.courseCode}</span>
                      </div>
                      <h5 className="font-semibold text-slate-800 text-[14px] mt-1 leading-tight">{course.courseName}</h5>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-10 bg-slate-100 shrink-0 mx-2"></div>
                  
                  <div className="flex-1 flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <BookOpen size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="m-0 leading-relaxed text-[13.5px]">{course.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Needs Improvement Section */}
        {data.improvements && data.improvements.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
              <h4 className="text-base font-bold text-slate-800 m-0">Areas for Improvement</h4>
            </div>
            
            <div className="space-y-3">
              {data.improvements.map((course, idx) => (
                <div key={idx} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-zinc-100 bg-white shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-amber-50 rounded-lg border border-amber-100 shrink-0">
                      <span className="text-amber-700 font-bold text-lg leading-none">{course.grade}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">{course.courseCode}</span>
                      </div>
                      <h5 className="font-semibold text-slate-800 text-[14px] mt-1 leading-tight">{course.courseName}</h5>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-10 bg-slate-100 shrink-0 mx-2"></div>
                  
                  <div className="flex-1 flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <ChevronRight size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="m-0 leading-relaxed text-[13.5px]">{course.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
