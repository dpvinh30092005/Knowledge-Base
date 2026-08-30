import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { MessageSquare, Code, Users, Compass, Star, CheckCircle2, Save, Send, X, AlertCircle } from 'lucide-react';
import mentorApi from '@/features/mentor/api/mentorApi';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string;
    completionPercent: number;
  };
}

const CATEGORIES = [
  { value: 'GENERAL', label: 'General', icon: <MessageSquare size={18} />, desc: 'Overall portfolio review' },
  { value: 'SKILL', label: 'Skills & Tech', icon: <Code size={18} />, desc: 'Code, tech stack & soft skills' },
  { value: 'CAREER', label: 'Career', icon: <Compass size={18} />, desc: 'Career path guidance' }
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, studentData }) => {
  const [category, setCategory] = useState('SKILL');
  
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const [error, setError] = useState('');

  // Load draft
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem(`draft_feedback_${studentData.id}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        setCategory(parsed.category || 'SKILL');
        setStrengths(parsed.strengths || '');
        setImprovements(parsed.improvements || '');
        setRecommendations(parsed.recommendations || '');
      }
    }
  }, [isOpen, studentData.id]);

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    localStorage.setItem(`draft_feedback_${studentData.id}`, JSON.stringify({
      category, strengths, improvements, recommendations
    }));
    setTimeout(() => setIsSavingDraft(false), 500);
  };

  const handleSubmit = async () => {
    if (!strengths.trim() || !improvements.trim()) {
      setError('Please fill in both Strengths and Areas for Improvement.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    const finalContent = `**Strengths:**\n${strengths}\n\n**Areas for Improvement:**\n${improvements}\n\n**Recommendations:**\n${recommendations || 'None'}`;

    try {
      await mentorApi.submitFeedback(studentData.id, { type: category, content: finalContent });
      localStorage.removeItem(`draft_feedback_${studentData.id}`);
      // No local "notification" is written here: this runs in the mentor's browser, and the
      // student reads theirs in another. The saved feedback is the notification — the
      // student's bell reads it from the server, and an email goes out as well.
      setSubmitSuccess(true);
    } catch (e) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitSuccess(false);
      setError('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 border border-slate-200 shadow-2xl rounded-[16px] gap-0 bg-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-[20px] font-bold text-slate-900 tracking-tight">Provide Feedback</DialogTitle>
              <DialogDescription className="text-slate-500 text-[14px] mt-1.5 font-medium">
                Share your professional insights to help the student improve.
              </DialogDescription>
            </div>
          </div>
        </div>

        {submitSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1 bg-slate-50/50">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-sm">
              <CheckCircle2 size={40} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <h3 className="text-[22px] font-bold text-slate-900 mb-2">Review Submitted!</h3>
            <p className="text-[15px] text-slate-500 max-w-sm mb-8">
              Thank you for your valuable feedback. {studentData.name} has been notified and can now review your insights.
            </p>
            <button 
              onClick={resetAndClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[14px] font-semibold transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* SCROLLABLE CONTENT */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
              {/* STUDENT SUMMARY */}
              <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[12px] mb-8 shadow-sm">
                <img 
                  src={studentData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=e0e7ff&color=4f46e5`} 
                  alt={studentData.name} 
                  className="w-14 h-14 rounded-full object-cover border border-slate-200" 
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=e0e7ff&color=4f46e5`;
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-[16px] font-bold text-slate-900">{studentData.name}</h4>
                  <p className="text-[13px] text-slate-500 font-medium">{studentData.role}</p>
                </div>
              </div>

              {/* REVIEW CATEGORY */}
              <div className="mb-8">
                <label className="block text-[14px] font-bold text-slate-900 mb-3">Review Category</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => (
                    <div 
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-[12px] border cursor-pointer transition-all ${category === cat.value ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${category === cat.value ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.icon}
                      </div>
                      <div className={`text-[13px] font-bold ${category === cat.value ? 'text-indigo-900' : 'text-slate-700'}`}>{cat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEEDBACK FORM */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[14px] font-bold text-slate-900 mb-2">Strengths <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={3}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="What stood out to you? What did they do well?"
                    className="w-full rounded-[12px] border border-slate-200 bg-white p-4 text-[14px] hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-slate-900 mb-2">Areas for Improvement <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={3}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Which parts of the portfolio or code need more work?"
                    className="w-full rounded-[12px] border border-slate-200 bg-white p-4 text-[14px] hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-[14px] font-bold text-slate-900">Recommendations <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <span className="text-[12px] text-slate-400 font-medium">{recommendations.length} chars</span>
                  </div>
                  <textarea 
                    rows={3}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Any specific courses, articles, or next steps you recommend?"
                    className="w-full rounded-[12px] border border-slate-200 bg-white p-4 text-[14px] hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[13px] font-semibold">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-8 py-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
              <button 
                onClick={resetAndClose}
                className="px-5 py-2.5 text-[14px] font-bold text-slate-500 hover:bg-slate-100 rounded-[10px] transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-[14px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-[10px] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSavingDraft ? <><i className="fas fa-spinner fa-spin"></i> Saving</> : <><Save size={16} /> Save Draft</>}
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[10px] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting</> : <><Send size={16} /> Submit Review</>}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
