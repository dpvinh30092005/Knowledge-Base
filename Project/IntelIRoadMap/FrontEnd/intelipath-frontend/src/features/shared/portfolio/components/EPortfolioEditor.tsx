import React, { useState, useEffect, useRef } from 'react';
import { portfolioApi, PortfolioData, type GithubImportAudit } from '@/features/shared/portfolio/api/portfolioApi';
import { useDebounce } from '@/hooks/useDebounce';
import { EditableText } from './EditableText';
import { ThemeEditor } from './ThemeEditor';
import { IconPicker } from './IconPicker';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import '@/features/shared/portfolio/styles.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import mentorApi from '@/features/mentor/api/mentorApi';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, Input, Button } from '@/components/ui';
import { ROUTES } from '@/shared';
import { Check, Send, Sparkles, X } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { RequestReviewModal } from './RequestReviewModal';
import { GithubSyncModal, GithubIcon } from './GithubSyncModal';
import { ProjectAuditModal } from './ProjectAuditModal';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { PortfolioLearningJourney } from './PortfolioLearningJourney';
import { PortfolioSkillsShowcase } from './PortfolioSkillsShowcase';
import { toast } from '@/lib/toast';
import profileApi from '@/api/profileApi';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  initialData: PortfolioData;
  isPublicView?: boolean;
}

export const EPortfolioEditor: React.FC<Props> = ({ initialData, isPublicView = false }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isMentor = user?.role === 'MENTOR';

  const [data, setData] = useState<PortfolioData>(initialData);
  const [publicEvidence, setPublicEvidence] = useState<Record<string, GithubImportAudit | null>>({});
  const studentLevel = data.studentLevel?.level;
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!isMentor && !isPublicView);
  const [iconPickerProjectIdx, setIconPickerProjectIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slug Customization State
  const [slug, setSlug] = useState(data.slug || '');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isMentor || isPublicView) {
      setIsEditMode(false);
    }
  }, [isMentor, isPublicView]);

  useEffect(() => {
    if (!isPublicView) return;
    const githubProjects = data.projects.filter(project =>
      project.codeLink?.toLowerCase().includes('github.com'));
    if (githubProjects.length === 0) return;
    let cancelled = false;
    void Promise.all(githubProjects.map(async project => {
      const audit = isMentor && data.studentId
        ? await mentorApi.getStudentGithubAudit(data.studentId, project.codeLink).catch(() => null)
        : data.slug
          ? await portfolioApi.getPublicGithubEvidence(data.slug, project.codeLink).catch(() => null)
          : null;
      return [project.codeLink, audit] as const;
    })).then(entries => {
      if (!cancelled) setPublicEvidence(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [isPublicView, isMentor, data.studentId, data.slug, data.projects]);

  // Mentor Feedback State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRequestReviewOpen, setIsRequestReviewOpen] = useState(false);
  const [isGeneratingAbout, setIsGeneratingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState<Awaited<ReturnType<typeof portfolioApi.generateAboutDraft>> | null>(null);

  const generateAboutDraft = async () => {
    setIsGeneratingAbout(true);
    try {
      setAboutDraft(await portfolioApi.generateAboutDraft());
    } catch (error: any) {
      toast.error(error?.response?.status === 429
        ? 'AI usage limit reached. Please try again later.'
        : 'AI could not create a draft right now.');
    } finally {
      setIsGeneratingAbout(false);
    }
  };

  const applyAboutDraft = () => {
    if (!aboutDraft) return;
    setData(current => ({
      ...current,
      hero: { ...current.hero, role: aboutDraft.role, description: aboutDraft.description, objective: aboutDraft.objective },
    }));
    setAboutDraft(null);
  };

  // GitHub Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  // Sync-GitHub picker (list all repos, multi-select, batch import)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  /** Which project's AI audit is open, or null. Keyed by repo URL — that is the audit's key. */
  const [auditProject, setAuditProject] = useState<{ repoUrl: string; name: string } | null>(null);
  const [linkEditor, setLinkEditor] = useState<{
    projectIndex: number;
    kind: 'code' | 'demo';
    value: string;
  } | null>(null);
  /**
   * Which project is being deleted, while the student decides what deletion means.
   *
   * <p>Only imported projects get the question: a hand-typed entry has no evidence
   * behind it, so there is nothing to ask about and the row is dropped directly.
   */
  const [deletingProject, setDeletingProject] = useState<{ id: string; repoUrl: string; name: string } | null>(null);

  /** Drops one project from the portfolio. The autosave below persists it. */
  const removeProject = (projectId: string) => {
    setData((current) => ({ ...current, projects: current.projects.filter(p => p.id !== projectId) }));
  };

  // Returning from the GitHub "Connect" flow: reopen the picker (now that a token exists)
  // or report failure, then strip the flag from the URL so a refresh doesn't retrigger it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('github');
    if (!flag) return;
    if (flag === 'connected') {
      toast.success('GitHub connected. Choose repositories to import.');
      setIsSyncModalOpen(true);
    } else if (flag === 'error') {
      toast.error('Could not connect GitHub. Please try again.');
    }
    params.delete('github');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  // Avatar upload state (real file upload, not a URL prompt)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Delegate to the app-wide toast so notifications look/behave the same
  // everywhere (bottom-center glass card), instead of a portfolio-only one.
  const showToast = (text: string, type: 'error' | 'success') => {
    if (type === 'error') toast.error(text);
    else toast.success(text);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is too large. Please choose a file under 5MB.', 'error');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }
    setIsUploadingAvatar(true);
    try {
      // Reuse the account avatar endpoint (uploads to Supabase, returns a hosted URL).
      const res: any = await profileApi.updateAvatar(file);
      let newAvatarUrl = res.data?.avatarUrl || res.avatarUrl;
      if (!newAvatarUrl) throw new Error('Server did not return an avatar URL');
      // Cache-bust so the same URL refreshes in the browser.
      if (newAvatarUrl.startsWith('http')) {
        newAvatarUrl += (newAvatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      }
      updateHero('avatarUrl', newAvatarUrl);
      updateUser({ avatarUrl: newAvatarUrl });
      showToast('Avatar updated.', 'success');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const aiData = await portfolioApi.importGithubProject(githubUrl);
      
      const newProject = {
        id: aiData.projectId || 'proj-' + Date.now(),
        title: aiData.projectName || 'Project Name',
        tech: aiData.techStack ? Object.values(aiData.techStack).flat().join(', ') : 'Tech Stack',
        description: aiData.description || 'Project description',
        icon: 'fab fa-github',
        codeLink: aiData.repoUrl || '#',
        demoLink: aiData.demoUrl || '#'
      };

      setData(prev => ({
        ...prev,
        projects: [...prev.projects, newProject]
      }));
      
      setIsImportModalOpen(false);
      setGithubUrl('');
      showToast("Project imported successfully!", "success");
    } catch (error: any) {
      console.error("GitHub import failed:", error);
      let errorMsg = "The AI service is busy. Please try again later!"; // 500 or default

      if (error.response?.status === 400) {
        errorMsg = "Invalid GitHub URL format!";
      } else if (error.response?.status === 404) {
        errorMsg = "Repository not found, or it is private!";
      } else if (error.response?.status === 429) {
        errorMsg = "Too many requests. Please wait a moment!";
      }
      
      showToast(errorMsg, "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Append projects imported through the Sync-GitHub picker. Mirrors handleImport's
  // mapping but for many repos at once, skipping any whose repo is already listed.
  const handleBatchImported = (aiProjects: any[]) => {
    setData(prev => {
      const existingLinks = new Set(prev.projects.map(p => (p.codeLink || '').toLowerCase()));
      const mapped = aiProjects
        .map(aiData => ({
          id: aiData.projectId || 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          title: aiData.projectName || 'Project Name',
          tech: aiData.techStack ? Object.values(aiData.techStack).flat().join(', ') : 'Tech Stack',
          description: aiData.description || 'Project description',
          icon: 'fab fa-github',
          codeLink: aiData.repoUrl || '#',
          demoLink: aiData.demoUrl || '#',
        }))
        .filter(p => !existingLinks.has((p.codeLink || '').toLowerCase()));
      return { ...prev, projects: [...prev.projects, ...mapped] };
    });
    setIsImportModalOpen(false);
  };

  // Auto-save logic
  const debouncedData = useDebounce(data, 1500); // 1.5s delay after stop typing
  
  // Track initial mount to prevent saving on first load
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (isPublicView) return; // Don't auto-save in public view

    const saveData = async () => {
      setIsSaving(true);
      try {
        await portfolioApi.updatePortfolio(debouncedData);
      } catch (err) {
        console.error('Failed to save portfolio', err);
      } finally {
        setIsSaving(false);
      }
    };
    
    saveData();
  }, [debouncedData, isPublicView]);

  // No frontend slug generation or save logic required. Backend handles it.

  // Apply theme colors globally when they change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.theme);
    document.documentElement.style.setProperty('--primary-color', data.themeColors.primaryColor);
    document.documentElement.style.setProperty('--title-color', data.themeColors.titleColor);
    document.documentElement.style.setProperty('--text-color', data.themeColors.textColor);
    document.documentElement.style.setProperty('--bg-primary', data.themeColors.bgPrimary);
    document.documentElement.style.setProperty('--bg-secondary', data.themeColors.bgSecondary);
    document.documentElement.style.setProperty('--card-background', data.themeColors.bgSecondary);
    document.documentElement.style.setProperty('--card-radius', data.themeColors.radius || '16px');
    // Every card, the education timeline rule, the footer divider and the Add Project
    // dashed box read --border-color, but nothing ever defined it in the app — it only
    // existed in the old static portfolio-html prototype, which is not imported. An
    // undefined var() made those declarations invalid, so they all fell back to
    // currentColor and drew the border in the text colour at full strength.
    //
    // Derived from the text colour rather than stored: it then follows the light/dark
    // toggle and every preset on its own, and stays correct against both backgrounds
    // because the remaining 84% is transparent.
    document.documentElement.style.setProperty(
      '--border-color',
      `color-mix(in srgb, ${data.themeColors.textColor} 16%, transparent)`
    );
    document.documentElement.style.setProperty('--heading-font', data.fonts?.heading || "'Outfit', sans-serif");
    document.documentElement.style.setProperty('--body-font', data.fonts?.body || "'Inter', sans-serif");
  }, [data.theme, data.themeColors, data.fonts]);

  // GSAP Animations
  useGSAP(() => {
    // Reveal Elements
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => {
      gsap.fromTo(el, 
        { autoAlpha: 0, y: 40 }, 
        {
          autoAlpha: 1, 
          y: 0, 
          duration: 0.8, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    // Hero Timeline
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });
    heroTimeline
      .fromTo(".hero-title-pill", { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1 }, 0)
      .fromTo(".hero-img-wrapper", { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1 }, 0.2)
      .fromTo(".hero-text p", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 }, 0.4)
      .fromTo(".contact-title", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.6)
      .fromTo(".contact-grid div", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 }, 0.8);
      
  }, { scope: containerRef, dependencies: [] }); // Run once on mount

  // Update handlers
  const updateHero = (key: keyof PortfolioData['hero'], value: string) => {
    setData(prev => ({
      ...prev,
      hero: { ...prev.hero, [key]: value }
    }));
  };

  const updateTheme = (key: 'primaryColor' | 'titleColor' | 'textColor', color: string) => {
    setData(prev => ({
      ...prev,
      themeColors: { ...prev.themeColors, [key]: color }
    }));
  };

  const updateThemePreset = (colors: { primaryColor: string; titleColor: string; textColor: string }) => {
    setData(prev => ({
      ...prev,
      themeColors: { ...prev.themeColors, ...colors }
    }));
  };

  const updateThemeRadius = (radius: string) => {
    setData(prev => ({
      ...prev,
      themeColors: { ...prev.themeColors, radius }
    }));
  };

  const updateFont = (key: 'heading' | 'body', font: string) => {
    setData(prev => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: font }
    }));
  };

  const toggleTheme = () => {
    setData(prev => {
      const isCurrentlyDark = prev.theme === 'dark';
      return {
        ...prev,
        theme: isCurrentlyDark ? 'light' : 'dark',
        themeColors: {
          ...prev.themeColors,
          bgPrimary: isCurrentlyDark ? '#f8fafc' : '#0d0f17',
          bgSecondary: isCurrentlyDark ? '#ffffff' : '#151722',
          titleColor: isCurrentlyDark ? '#0f172a' : '#f8fafc',
          textColor: isCurrentlyDark ? '#334155' : '#cbd5e1',
        }
      };
    });
  };

  const handleCopyLink = () => {
    // The shared link must be the public one. /portfolio/<slug> is the internal
    // view and would send a recruiter to the sign-in page.
    navigator.clipboard.writeText(
      `${window.location.origin}${ROUTES.PUBLIC_PORTFOLIO.replace(':slug', slug)}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="e-portfolio-wrapper font-inter relative">
      {isSaving && !isPublicView && (
        <div className="fixed top-20 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm flex items-center gap-2 font-medium">
          <i className="fas fa-spinner fa-spin"></i> Auto-saving...
        </div>
      )}

      {isEditMode && !isPublicView && (
        <ThemeEditor
          primaryColor={data.themeColors.primaryColor}
          titleColor={data.themeColors.titleColor}
          textColor={data.themeColors.textColor}
          radius={data.themeColors.radius || '16px'}
          headingFont={data.fonts?.heading || "'Outfit', sans-serif"}
          bodyFont={data.fonts?.body || "'Inter', sans-serif"}
          onChangeColor={updateTheme}
          onApplyPreset={updateThemePreset}
          onChangeRadius={updateThemeRadius}
          onChangeFont={updateFont}
        />
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between border-b border-slate-200/20 px-4 py-3 md:px-8 transition-colors backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 50%, transparent)' }}>
        <div className="flex items-center gap-6">
          <div className="logo text-lg font-bold font-outfit text-[var(--title-color)]">
            <span className="text-[var(--primary-color)]">IN</span>TELIPATH<span className="text-[var(--primary-color)]">.</span>
          </div>
          <div className="portfolio-identity" aria-label={`Student${studentLevel ? `, level ${studentLevel}` : ''}`}>
            <span>Student</span>
            {studentLevel && <strong>{studentLevel}</strong>}
          </div>
          <ul className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[var(--text-color)]">
            <li><a href="#hero" className="hover:text-[var(--primary-color)] transition-colors">Home</a></li>
            <li><a href="#education" className="hover:text-[var(--primary-color)] transition-colors">Education</a></li>
            <li><a href="#skills" className="hover:text-[var(--primary-color)] transition-colors">Skills</a></li>
            <li><a href="#projects" className="hover:text-[var(--primary-color)] transition-colors">Projects</a></li>
          </ul>
        </div>
        
        <div className="flex items-center gap-4">
            {!isPublicView && !isMentor && (
              <div className="relative flex items-center">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border opacity-80 hover:opacity-100 transition-all bg-[var(--bg-secondary)] border-[var(--border-color)]">
                  <span className="text-xs font-semibold text-[var(--text-color)]">intelipath.com/portfolio/</span>
                  <span className="text-sm font-bold text-[var(--title-color)]">
                    {slug || <span className="text-slate-400 italic font-normal">will-be-generated</span>}
                  </span>
                  <button onClick={handleCopyLink} className="text-[var(--primary-color)] hover:opacity-80 p-1 ml-1" title="Copy public link">
                    <i className={`fas ${isCopied ? 'fa-check text-emerald-500' : 'fa-link'}`}></i>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 ml-2 cursor-pointer" onClick={toggleTheme}>
              <span className="text-sm font-semibold text-[var(--text-color)]"><i className="fas fa-sun"></i></span>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 pointer-events-none items-center rounded-full transition-colors ${data.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-semibold text-[var(--text-color)]"><i className="fas fa-moon"></i></span>
            </div>
            
          {!isPublicView && !isMentor && (
            <div className="flex items-center gap-4 border-l border-slate-200/20 pl-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-color)]">Preview</span>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEditMode ? 'bg-[var(--primary-color)]' : 'bg-slate-400'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEditMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-semibold text-[var(--title-color)]">Edit</span>
              </div>
              
              <button 
                onClick={() => setIsRequestReviewOpen(true)}
                className="px-4 py-1.5 bg-[var(--primary-color)] text-white font-semibold text-[13px] rounded-full shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={14} />
                Request Review
              </button>
            </div>
          )}

          {isMentor && isPublicView && (
            <div className="flex items-center gap-4 border-l border-slate-200/20 pl-4 ml-2">
              <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="px-4 py-1.5 bg-[var(--title-color)] text-[var(--bg-primary)] font-semibold text-[13px] rounded-full shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={14} />
                Provide Feedback
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* BACK TO HOME BUTTON */}
      {!isPublicView && (
        <button 
          onClick={() => navigate(isMentor ? ROUTES.DASHBOARD_MENTOR_STUDENTS : "/dashboard/student")}
          style={{ color: 'var(--text-color)', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--text-color)' }}
          className="fixed bottom-8 left-4 md:left-8 z-50 hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] px-4 py-2.5 rounded-full shadow-lg border transition-all flex items-center gap-2 text-sm font-semibold group hover:-translate-y-1 hover:shadow-[var(--primary-color)]/20 cursor-pointer"
        >
          <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
          <span>Back to InteliPath</span>
        </button>
      )}

      {/* MENTOR FEEDBACK MODAL */}
      {isMentor && isPublicView && (
        <FeedbackModal 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)}
          studentData={{
            id: data.studentId || 'unknown',
            name: data.hero.name,
            role: data.hero.role,
            avatarUrl: data.hero.avatarUrl,
            completionPercent: 85
          }}
        />
      )}

      {/* STUDENT REQUEST REVIEW MODAL */}
      {!isMentor && !isPublicView && (
        <RequestReviewModal
          isOpen={isRequestReviewOpen}
          onClose={() => setIsRequestReviewOpen(false)}
        />
      )}

      {/* HERO SECTION */}
      <header id="hero" className="relative min-h-screen pt-32 pb-16 overflow-hidden bg-[var(--bg-primary)] flex flex-col justify-center">
        <div className="hero-title-pill absolute top-32 left-0 bg-[var(--primary-color)] py-6 pr-24 pl-[10vw] rounded-r-[100px] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)] z-10 text-[var(--title-color)]">
          <EditableText isEditable={isEditMode} value={data.hero.title} onChange={val => updateHero('title', val)} as="h1" className="text-7xl font-outfit m-0" />
        </div>
        
        <div className="hero-content-wrapper flex flex-col md:flex-row justify-between items-center w-full px-[10vw] mt-60 relative z-20">
          <div className="hero-content flex-1 w-full max-w-2xl text-left">
            <div className="hero-text text-xl leading-relaxed mb-16 text-[var(--text-color)]">
              <p className="text-[var(--text-color)] text-xl leading-relaxed max-w-2xl">
                <EditableText isEditable={isEditMode} value={data.hero.greeting} onChange={val => updateHero('greeting', val)} as="span" className="block mb-2 font-medium" />
                My name is <EditableText isEditable={isEditMode} value={data.hero.name} onChange={val => updateHero('name', val)} as="span" className="text-[var(--primary-color)] font-bold" />.<br/>
                I am a <EditableText isEditable={isEditMode} value={data.hero.role} onChange={val => updateHero('role', val)} as="span" className="text-[var(--primary-color)] font-semibold" />.<br/>
                <EditableText isEditable={isEditMode} value={data.hero.description} onChange={val => updateHero('description', val)} as="span" />
              </p>
              <br/>
              <p><span className="text-[var(--primary-color)] font-semibold">My objective:</span> <EditableText isEditable={isEditMode} value={data.hero.objective} onChange={val => updateHero('objective', val)} multiline /></p>
              {isEditMode && (
                <aside className="portfolio-profile-prompts" aria-label="AI About Me writer">
                  <div className="portfolio-profile-prompts__heading">
                    <div>
                      <strong>AI About Me writer</strong>
                      <p>Drafted from your target career, level, skills and projects. Nothing changes until you apply it.</p>
                    </div>
                    <button type="button" onClick={generateAboutDraft} disabled={isGeneratingAbout}>
                      <Sparkles aria-hidden="true" /> {isGeneratingAbout ? 'Writing…' : aboutDraft ? 'Regenerate' : 'Create draft'}
                    </button>
                  </div>
                  {aboutDraft && (
                    <div className="portfolio-profile-prompts__draft">
                      <label>Role<input value={aboutDraft.role} onChange={event => setAboutDraft({ ...aboutDraft, role: event.target.value })} /></label>
                      <label>Description<textarea value={aboutDraft.description} onChange={event => setAboutDraft({ ...aboutDraft, description: event.target.value })} /></label>
                      <label>Objective<textarea value={aboutDraft.objective} onChange={event => setAboutDraft({ ...aboutDraft, objective: event.target.value })} /></label>
                      <div className="portfolio-profile-prompts__actions">
                        <button type="button" onClick={applyAboutDraft}><Check aria-hidden="true" /> Apply draft</button>
                        <button type="button" onClick={() => setAboutDraft(null)}><X aria-hidden="true" /> Discard</button>
                      </div>
                    </div>
                  )}
                </aside>
              )}
            </div>

            <h3 className="contact-title text-4xl italic font-extrabold mb-8 font-outfit text-[var(--title-color)]">Contact</h3>
            <div className="contact-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.hero.contact.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 text-[var(--text-color)] font-semibold group">
                  {isEditMode ? (
                    <button onClick={() => {
                      const icon = prompt("Enter FontAwesome class for icon:", c.icon);
                      if (icon) {
                        const newContact = [...data.hero.contact];
                        newContact[idx].icon = icon;
                        setData({ ...data, hero: { ...data.hero, contact: newContact } });
                      }
                    }} className={`${c.icon} w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--primary-color)] cursor-pointer hover:bg-[var(--primary-color)] hover:text-white transition-colors`} title="Change Icon"></button>
                  ) : (
                    <i className={`${c.icon} w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--primary-color)]`}></i>
                  )}
                  <EditableText isEditable={isEditMode} value={c.value} onChange={val => {
                    const newContact = [...data.hero.contact];
                    newContact[idx].value = val;
                    setData({ ...data, hero: { ...data.hero, contact: newContact } });
                  }} />
                  {isEditMode && (
                    <button onClick={() => {
                      setData({ ...data, hero: { ...data.hero, contact: data.hero.contact.filter(item => item.id !== c.id) } });
                    }} className="bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shadow-sm"><i className="fas fa-trash text-sm"></i></button>
                  )}
                </div>
              ))}
              {isEditMode && (
                <button onClick={() => {
                  setData({
                    ...data, 
                    hero: { 
                      ...data.hero, 
                      contact: [...data.hero.contact, { id: 'contact-'+Date.now(), type: 'New', value: 'new.contact@example.com', icon: 'fas fa-link' }] 
                    }
                  });
                }} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[var(--primary-color)] text-[var(--primary-color)] rounded-full hover:bg-[var(--primary-color)] hover:text-white transition-colors w-max font-semibold">
                  <i className="fas fa-plus"></i> New Contact
                </button>
              )}
            </div>
          </div>
          
          <div className="hero-img-wrapper relative flex-shrink-0 ml-0 md:ml-16 mt-16 md:mt-0">
            <div className="absolute -top-[10%] -left-[20%] w-[140%] h-[120%] border-2 border-[var(--primary-color)] opacity-30 z-0 animate-morph" style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}></div>
            {(() => {
              // Never fall back to the signed-in user's avatar: this component also
              // renders someone else's portfolio for mentors and public visitors, where
              // that would put the viewer's face on the student's page. The portfolio
              // response already carries the account avatar (see mapToFrontendData).
              const displayAvatar = data.hero.avatarUrl;
              return (
                <>
                  <img src={displayAvatar} alt="Profile" className="hero-img-pill w-[360px] h-[480px] object-cover rounded-[200px] relative z-10 border-4 border-[var(--bg-secondary)] shadow-2xl" />
                  {isEditMode && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                      <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity bg-black/40 rounded-[200px] ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                        <button
                          type="button"
                          disabled={isUploadingAvatar}
                          className="bg-white text-slate-900 px-4 py-2 rounded-full font-semibold text-sm cursor-pointer disabled:opacity-70 flex items-center gap-2"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {isUploadingAvatar ? (
                            <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                          ) : (
                            <><i className="fas fa-camera"></i> Change Photo</>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </header>

      {/* EDUCATION SECTION */}
      <section id="education" className="reveal bg-[var(--bg-secondary)] py-24 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-center font-bold font-outfit mb-16 text-[var(--title-color)]">Education</h2>
          <div className="relative border-l-2 border-[var(--border-color)] ml-4">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="relative pl-12 mb-12 last:mb-0 group">
                <div className="absolute left-[-17px] top-1 w-8 h-8 rounded-full bg-[var(--bg-primary)] border-4 border-[var(--primary-color)] shadow-sm group-hover:bg-[var(--primary-color)] transition-colors"></div>
                <div className="bg-[var(--bg-primary)] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[var(--border-color)] transition-transform hover:-translate-y-0.5" style={{ borderRadius: 'var(--card-radius)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <EditableText isEditable={isEditMode} value={edu.university} onChange={val => {
                      const newEdu = [...data.education];
                      newEdu[idx].university = val;
                      setData({ ...data, education: newEdu });
                    }} as="h3" className="text-2xl font-bold text-[var(--title-color)]" />
                    {isEditMode && (
                      <button onClick={() => {
                        setData({ ...data, education: data.education.filter(e => e.id !== edu.id) });
                      }} className="bg-red-500 text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><i className="fas fa-trash text-sm"></i></button>
                    )}
                  </div>
                  <p className="text-[var(--primary-color)] font-bold mb-2">
                    <EditableText isEditable={isEditMode} value={edu.degree} onChange={val => {
                      const newEdu = [...data.education];
                      newEdu[idx].degree = val;
                      setData({ ...data, education: newEdu });
                    }} /> | <EditableText isEditable={isEditMode} value={edu.period} onChange={val => {
                      const newEdu = [...data.education];
                      newEdu[idx].period = val;
                      setData({ ...data, education: newEdu });
                    }} />
                  </p>
                  <p className="text-[var(--text-color)]">
                    <EditableText isEditable={isEditMode} value={edu.description} onChange={val => {
                      const newEdu = [...data.education];
                      newEdu[idx].description = val;
                      setData({ ...data, education: newEdu });
                    }} multiline />
                  </p>
                </div>
              </div>
            ))}
            {isEditMode && (
              <div className="pl-12 mt-8">
                <button onClick={() => {
                  setData({ ...data, education: [...data.education, { id: 'edu-'+Date.now(), university: 'New University', degree: 'Degree', period: 'Year', description: 'Description' }] });
                }} className="px-4 py-2 border-2 border-dashed border-[var(--primary-color)] text-[var(--primary-color)] rounded-lg hover:bg-[var(--primary-color)] hover:text-white transition-colors w-full">+ Add Education</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <PortfolioSkillsShowcase
        skills={data.skills}
        isEditable={isEditMode}
        onRename={(id, value) => setData(current => ({
          ...current,
          skills: current.skills.map(skill => skill.id === id ? { ...skill, category: value } : skill),
        }))}
        onRemove={id => setData(current => ({ ...current, skills: current.skills.filter(skill => skill.id !== id) }))}
        onAdd={() => setData(current => ({
          ...current,
          skills: [...current.skills, { id: `skill-${Date.now()}`, category: 'New Skill', stack: '', description: '', verified: false, evidenceSource: 'MANUAL' }],
        }))}
      />

      <PortfolioLearningJourney journey={data.learningJourney} />

      {/* PROJECTS SECTION */}
      <section id="projects" className="reveal bg-[var(--bg-secondary)] py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl text-center font-bold font-outfit mb-16 text-[var(--title-color)]">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="bg-[var(--bg-primary)] overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.10)] border border-[var(--border-color)] flex flex-col group transition-transform hover:-translate-y-1 relative" style={{ borderRadius: 'var(--card-radius)' }}>
                {isEditMode && (
                  // An imported project may be the only proof behind several verified
                  // skills, so deleting it asks first. A manual entry has nothing behind
                  // it and goes straight away.
                  <button onClick={() => {
                    const repoUrl = proj.codeLink && proj.codeLink !== '#' ? proj.codeLink : '';
                    if (repoUrl.toLowerCase().includes('github.com')) {
                      setDeletingProject({ id: proj.id, repoUrl, name: proj.title || 'this project' });
                    } else {
                      removeProject(proj.id);
                    }
                  }} className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"><i className="fas fa-trash text-sm"></i></button>
                )}
                <div className="h-48 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--border-color)] flex items-center justify-center text-6xl text-[var(--primary-color)] border-b border-[var(--border-color)] relative">
                  <i className={proj.icon}></i>
                  {isEditMode && (
                    <button onClick={() => setIconPickerProjectIdx(idx)} className="absolute bottom-2 right-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Change Icon</button>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <EditableText isEditable={isEditMode} value={proj.title} onChange={val => {
                    const newProj = [...data.projects];
                    newProj[idx].title = val;
                    setData({ ...data, projects: newProj });
                  }} as="h3" className="text-2xl font-bold mb-2 text-[var(--title-color)]" />
                  <p className="text-[var(--primary-color)] font-bold text-sm mb-4 bg-[var(--primary-color)]/10 self-start px-3 py-1 rounded-full">
                    <EditableText isEditable={isEditMode} value={proj.tech} onChange={val => {
                      const newProj = [...data.projects];
                      newProj[idx].tech = val;
                      setData({ ...data, projects: newProj });
                    }} />
                  </p>
                  <p className="text-[var(--text-color)] mb-6 flex-1">
                    <EditableText isEditable={isEditMode} value={proj.description} onChange={val => {
                      const newProj = [...data.projects];
                      newProj[idx].description = val;
                      setData({ ...data, projects: newProj });
                    }} multiline />
                  </p>
                  {isPublicView && publicEvidence[proj.codeLink] && (() => {
                    const evidence = publicEvidence[proj.codeLink]!;
                    const credited = evidence.skills.filter(skill => skill.status === 'ACCEPTED');
                    const shown = credited.length > 0 ? credited : evidence.skills;
                    return (
                      <div className="mb-5 rounded-xl border border-[var(--primary-color)]/25 bg-[var(--primary-color)]/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-color)]">
                            <i className="fas fa-shield-halved"></i> AI evidence snapshot
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--text-color)]/60">
                            {evidence.sources.length} files inspected
                          </span>
                        </div>
                        {evidence.authorshipVerdict === 'CONTRIBUTED' && (
                          <p className="mt-2 text-xs font-semibold text-[var(--text-color)]">
                            GitHub authorship: {evidence.authorCommits}/{evidence.totalCommits} commits
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {shown.map(skill => (
                            <span key={skill.skill} className="rounded-full border border-[var(--primary-color)]/25 bg-[var(--bg-primary)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-color)]">
                              {skill.skill} · {Math.round(skill.confidence * 100)}%
                              {skill.status === 'ACCEPTED' ? ' verified' : ' matched'}
                            </span>
                          ))}
                          {shown.length === 0 && (
                            <span className="text-xs text-[var(--text-color)]/60">No skill claim passed the evidence threshold.</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-4 border-t border-[var(--border-color)] pt-6">
                    {/* The old owner-mode handler intercepted Code/Live Demo and opened
                        window.prompt instead of the destination. Navigation and editing
                        are separate actions now: labels always navigate; pencil buttons edit. */}
                    {proj.codeLink && proj.codeLink !== '#' && (
                      <a
                        href={proj.codeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-color)] hover:text-[var(--primary-color)] font-semibold flex items-center gap-2"
                      ><i className="fab fa-github"></i> Code</a>
                    )}
                    {isEditMode && !proj.codeLink?.toLowerCase().includes('github.com') && (
                      <button
                        type="button"
                        title={proj.codeLink && proj.codeLink !== '#' ? 'Edit code link' : 'Add code link'}
                        aria-label={proj.codeLink && proj.codeLink !== '#' ? 'Edit code link' : 'Add code link'}
                        onClick={() => {
                          setLinkEditor({
                            projectIndex: idx,
                            kind: 'code',
                            value: proj.codeLink === '#' ? '' : (proj.codeLink || ''),
                          });
                        }}
                        className="text-xs text-[var(--text-color)]/60 hover:text-[var(--primary-color)]"
                      >
                        <i className={proj.codeLink && proj.codeLink !== '#' ? 'fas fa-pen' : 'fas fa-plus'}></i>
                        <span className="sr-only">{proj.codeLink && proj.codeLink !== '#' ? 'Edit code link' : 'Add code link'}</span>
                      </button>
                    )}
                    {isEditMode && proj.codeLink && proj.codeLink !== '#'
                      && !proj.codeLink.toLowerCase().includes('github.com') && (
                      <button
                        type="button"
                        title="Remove code link"
                        aria-label="Remove code link"
                        onClick={() => {
                          const newProj = [...data.projects];
                          newProj[idx].codeLink = '';
                          setData({ ...data, projects: newProj });
                        }}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        <i className="fas fa-xmark"></i>
                        <span className="sr-only">Remove code link</span>
                      </button>
                    )}
                    {proj.demoLink && proj.demoLink !== '#' && (
                      <a
                        href={proj.demoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-color)] hover:text-[var(--primary-color)] font-semibold flex items-center gap-2"
                      ><i className="fas fa-external-link-alt"></i> Live Demo</a>
                    )}
                    {isEditMode && (
                      <button
                        type="button"
                        title={proj.demoLink && proj.demoLink !== '#' ? 'Edit demo link' : 'Add demo link'}
                        aria-label={proj.demoLink && proj.demoLink !== '#' ? 'Edit demo link' : 'Add demo link'}
                        onClick={() => {
                          setLinkEditor({
                            projectIndex: idx,
                            kind: 'demo',
                            value: proj.demoLink === '#' ? '' : (proj.demoLink || ''),
                          });
                        }}
                        className="text-xs text-[var(--text-color)]/60 hover:text-[var(--primary-color)]"
                      >
                        <i className={proj.demoLink && proj.demoLink !== '#' ? 'fas fa-pen' : 'fas fa-plus'}></i>
                        <span className="sr-only">{proj.demoLink && proj.demoLink !== '#' ? 'Edit demo link' : 'Add demo link'}</span>
                      </button>
                    )}
                    {isEditMode && proj.demoLink && proj.demoLink !== '#' && (
                      <button
                        type="button"
                        title="Remove demo link"
                        aria-label="Remove demo link"
                        onClick={() => {
                          const newProj = [...data.projects];
                          newProj[idx].demoLink = '';
                          setData({ ...data, projects: newProj });
                        }}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        <i className="fas fa-xmark"></i>
                        <span className="sr-only">Remove demo link</span>
                      </button>
                    )}
                  </div>

                  {/* GitHub evidence is useful to reviewers as well as the owner. Public
                      viewers receive a sanitized audit: no source body, token, login or
                      commit messages. Hand-made projects have no audit to open. */}
                  {(isEditMode || isMentor || isPublicView)
                    && proj.codeLink?.toLowerCase().includes('github.com') && (
                    <button
                      type="button"
                      onClick={() => setAuditProject({ repoUrl: proj.codeLink, name: proj.title })}
                      className="mt-4 flex w-fit items-center gap-2 rounded-full border border-[var(--primary-color)]/30 bg-[var(--primary-color)]/10 px-3 py-2 text-xs font-bold text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)]/20"
                    >
                      <i className="fas fa-shield-halved"></i>
                      {isEditMode ? 'View AI evidence' : 'Verified AI evidence'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isEditMode && (
              <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogTrigger asChild>
                  <button className="border-2 border-dashed border-[var(--border-color)] flex items-center justify-center flex-col gap-4 text-[var(--text-color)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-colors h-full min-h-[400px]" style={{ borderRadius: 'var(--card-radius)' }}>
                    <i className="fas fa-plus text-4xl"></i>
                    <span className="font-bold text-xl">Add Project</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>
                      Choose how you want to add a project to your portfolio.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                      <h4 className="mb-1 flex items-center gap-2 font-bold text-slate-800">
                        <GithubIcon size={16} /> Sync from GitHub
                      </h4>
                      <p className="mb-3 text-sm text-slate-500">
                        Connect your GitHub account to browse all your repositories — ranked by quality — and add several at once.
                      </p>
                      <Button
                        variant="brand"
                        className="w-full gap-2 font-bold"
                        onClick={() => { setIsImportModalOpen(false); setIsSyncModalOpen(true); }}
                      >
                        <GithubIcon size={16} /> Browse my repositories
                      </Button>
                    </div>

                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="mx-4 flex-shrink-0 text-sm font-semibold text-slate-400">OR</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><i className="fab fa-github"></i> Import a single repo (AI)</h4>
                      <p className="text-sm text-slate-500 mb-3">Paste a public repository URL and InteliPath AI will automatically summarize the project for you.</p>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://github.com/username/repo" 
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleImport} disabled={isImporting || !githubUrl} className="bg-black text-white hover:bg-slate-800">
                          {isImporting ? <i className="fas fa-spinner fa-spin"></i> : "Import"}
                        </Button>
                      </div>
                    </div>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold">OR</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full font-bold"
                      onClick={() => {
                        setData({
                          ...data,
                          projects: [...data.projects, { id: 'proj-'+Date.now(), title: 'New Project', tech: 'Tech Stack', description: 'Description', icon: 'fas fa-code', codeLink: '#', demoLink: '#' }]
                        });
                        setIsImportModalOpen(false);
                      }}
                    >
                      Create Blank Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" className="reveal bg-[var(--bg-primary)] py-16 text-center border-t border-[var(--border-color)]">
        <h2 className="text-3xl font-bold font-outfit text-[var(--title-color)] mb-8">Get in <span className="text-[var(--primary-color)]">touch</span>.</h2>
        <div className="flex justify-center gap-6 mb-8">
          <a href="#" className="text-3xl text-[var(--text-color)] hover:text-[var(--primary-color)] transition-transform hover:-translate-y-1"><i className="fab fa-linkedin"></i></a>
          <a href="#" className="text-3xl text-[var(--text-color)] hover:text-[var(--primary-color)] transition-transform hover:-translate-y-1"><i className="fab fa-github"></i></a>
          <a href="mailto:intelipath@gmail.com" className="text-3xl text-[var(--text-color)] hover:text-[var(--primary-color)] transition-transform hover:-translate-y-1"><i className="fas fa-envelope"></i></a>
        </div>
        <p className="text-[var(--text-color)] mb-8">Interested in collaborating? <a href="mailto:intelipath@gmail.com" className="text-[var(--primary-color)] font-bold">intelipath@gmail.com</a></p>
        
        <p className="text-[var(--text-color)] text-sm font-semibold">© 2026 IntelPath.</p>
      </footer>

      {auditProject && (
        <ProjectAuditModal
          open
          onOpenChange={open => !open && setAuditProject(null)}
          repoUrl={auditProject.repoUrl}
          projectName={auditProject.name}
          loadAudit={isMentor && data.studentId
            ? (repoUrl) => mentorApi.getStudentGithubAudit(data.studentId!, repoUrl)
            : isPublicView && data.slug
              ? (repoUrl) => portfolioApi.getPublicGithubEvidence(data.slug!, repoUrl)
              : undefined}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          open
          onOpenChange={open => !open && setDeletingProject(null)}
          repoUrl={deletingProject.repoUrl}
          projectName={deletingProject.name}
          onConfirm={() => {
            removeProject(deletingProject.id);
            setDeletingProject(null);
          }}
        />
      )}

      <Dialog open={linkEditor !== null} onOpenChange={open => !open && setLinkEditor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {linkEditor?.kind === 'code' ? 'Project code link' : 'Live demo link'}
            </DialogTitle>
            <DialogDescription>
              {linkEditor?.kind === 'code'
                ? 'Add the source-code URL for this manually created project.'
                : 'Add the public URL where visitors can try this project.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            type="url"
            placeholder="https://..."
            value={linkEditor?.value ?? ''}
            onChange={event => setLinkEditor(current => current ? { ...current, value: event.target.value } : current)}
            onKeyDown={event => {
              if (event.key !== 'Enter' || !linkEditor) return;
              const value = linkEditor.value.trim();
              if (!/^https?:\/\//i.test(value)) {
                toast.error('Enter a valid http:// or https:// URL.');
                return;
              }
              const newProj = [...data.projects];
              if (linkEditor.kind === 'code') newProj[linkEditor.projectIndex].codeLink = value;
              else newProj[linkEditor.projectIndex].demoLink = value;
              setData({ ...data, projects: newProj });
              setLinkEditor(null);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkEditor(null)}>Cancel</Button>
            <Button
              className="bg-black text-white hover:bg-slate-800"
              onClick={() => {
                if (!linkEditor) return;
                const value = linkEditor.value.trim();
                if (!/^https?:\/\//i.test(value)) {
                  toast.error('Enter a valid http:// or https:// URL.');
                  return;
                }
                const newProj = [...data.projects];
                if (linkEditor.kind === 'code') newProj[linkEditor.projectIndex].codeLink = value;
                else newProj[linkEditor.projectIndex].demoLink = value;
                setData({ ...data, projects: newProj });
                setLinkEditor(null);
              }}
            >Save link</Button>
          </div>
        </DialogContent>
      </Dialog>

      <GithubSyncModal
        open={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
        existingRepoUrls={data.projects.map(p => p.codeLink).filter(Boolean) as string[]}
        onImported={handleBatchImported}
      />

      {iconPickerProjectIdx !== null && (
        <IconPicker
          currentIcon={data.projects[iconPickerProjectIdx].icon}
          onSelect={(icon) => {
            const newProj = [...data.projects];
            newProj[iconPickerProjectIdx].icon = icon;
            setData({ ...data, projects: newProj });
            setIconPickerProjectIdx(null);
          }}
          onClose={() => setIconPickerProjectIdx(null)}
        />
      )}
    </div>
  );
};
