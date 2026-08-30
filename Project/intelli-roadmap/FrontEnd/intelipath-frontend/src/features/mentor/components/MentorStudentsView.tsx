import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  MagnifyingGlass, 
  Eye, 
  Layout, 
  ChatTeardropText,
  Users,
} from '@phosphor-icons/react';
import { NavLink, useNavigate } from 'react-router-dom';
import mentorApi from '@/features/mentor/api/mentorApi';
import { ROUTES } from '@/shared';
import { useAuth } from '@/context';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  UserHeaderActions,
  Input,
  Logo,
  Skeleton,
  Select
} from "@/components";

const USERS_PER_PAGE = 7;

export function MentorStudentsView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<any[]>([]);
  // Set when the request itself failed, so a broken backend is not
  // rendered as an empty dashboard.
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [careerFilter, setCareerFilter] = useState('All');
  const [uniFilter, setUniFilter] = useState('All');

  useEffect(() => {
    mentorApi.getStudentsList()
      .then(res => setStudents(Array.isArray(res) ? res : []))
      .catch(() => {
        setStudents([]);
        setLoadError('Could not load your students. Please refresh or try again shortly.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const keyword = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        student.fullName.toLowerCase().includes(keyword) || 
        student.email.toLowerCase().includes(keyword);
      const matchesCareer = careerFilter === 'All' || student.career === careerFilter;
      const matchesUni = uniFilter === 'All' || student.university === uniFilter;
      return matchesSearch && matchesCareer && matchesUni;
    });
  }, [students, searchQuery, careerFilter, uniFilter]);

  const uniqueCareers = ['All', ...Array.from(new Set(students.map(s => s.career)))];
  const uniqueUnis = ['All', ...Array.from(new Set(students.map(s => s.university)))];

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / USERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + USERS_PER_PAGE);
  const visibleStart = filteredStudents.length ? startIndex + 1 : 0;
  const visibleEnd = Math.min(startIndex + USERS_PER_PAGE, filteredStudents.length);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".gsap-fade-section", {
      y: 40,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pb-14 font-sans text-slate-950 xl:h-screen xl:overflow-hidden xl:pb-0">
      {/* TOP NAVIGATION */}
      {loadError && (
        <div role="alert" className="mx-auto mb-6 max-w-[1680px] rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
          {loadError}
        </div>
      )}
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[72px] max-w-[1680px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Logo iconOnly className="origin-left scale-90" />
            <nav className="hidden items-center gap-8 lg:flex">
              <NavLink
                end
                to={ROUTES.DASHBOARD_MENTOR}
                className={({ isActive }) =>
                  `relative flex h-[72px] items-center gap-2 border-b-[3px] px-0 text-sm font-semibold transition-colors ${
                    isActive ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500 hover:text-slate-950"
                  }`
                }
              >
                <Layout size={17} weight="duotone" />
                Dashboard
              </NavLink>
              <NavLink
                to={ROUTES.DASHBOARD_MENTOR_STUDENTS}
                className={({ isActive }) =>
                  `relative flex h-[72px] items-center gap-2 border-b-[3px] px-0 text-sm font-semibold transition-colors ${
                    isActive ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500 hover:text-slate-950"
                  }`
                }
              >
                <Users size={17} weight="duotone" />
                Students
              </NavLink>
            </nav>
          </div>
          <UserHeaderActions user={user} onLogout={handleLogout} onSettings={() => navigate(ROUTES.DASHBOARD_MENTOR_SETTINGS)} />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-8 xl:flex xl:h-[calc(100vh-72px)] xl:min-h-0 xl:flex-col xl:overflow-hidden">
        
        <Card className="mt-4 overflow-hidden xl:flex xl:min-h-0 xl:flex-1 xl:flex-col shadow-xs border-slate-200 rounded-2xl gsap-fade-section">
          <CardHeader className="gap-4 border-b border-slate-200 bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Student Directory</CardTitle>
              <CardDescription>
                Showing {visibleStart} to {visibleEnd} of {filteredStudents.length} students
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Select
                  wrapperClassName="w-full sm:w-40"
                  className="text-xs font-semibold text-slate-700"
                  value={careerFilter}
                  onChange={(e) => { setCareerFilter(e.target.value); setCurrentPage(1); }}
                >
                  {uniqueCareers.map(c => <option key={c} value={c}>{c === 'All' ? 'All Careers' : c}</option>)}
                </Select>

                <Select
                  wrapperClassName="w-full sm:w-40"
                  className="text-xs font-semibold text-slate-700"
                  value={uniFilter}
                  onChange={(e) => { setUniFilter(e.target.value); setCurrentPage(1); }}
                >
                  {uniqueUnis.map(u => <option key={u} value={u}>{u === 'All' ? 'All Universities' : u}</option>)}
                </Select>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={safeCurrentPage === 1 || !filteredStudents.length} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                  <ArrowLeft size={15} weight="bold" />
                </Button>
                <span className="min-w-24 text-center text-xs font-semibold text-slate-600">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <Button variant="outline" size="icon" disabled={safeCurrentPage === totalPages || !filteredStudents.length} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                  <ArrowRight size={15} weight="bold" />
                </Button>
              </div>

              {/* Search */}
              <div className="flex h-10 w-full items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 transition focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-600/15 sm:w-64">
                <MagnifyingGlass className="shrink-0 text-slate-400" size={17} />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name or email"
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus:border-0 focus:ring-0"
                />
              </div>

            </div>
          </CardHeader>

          <div className="relative xl:min-h-0 xl:flex-1 bg-white">
            <div className="max-h-[calc(100vh-230px)] min-h-[280px] overflow-auto xl:h-full xl:max-h-none xl:min-h-0">
              <table className="w-full min-w-[860px] table-fixed text-left">
                <colgroup>
                  <col className="w-[35%]" />
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Career</th>
                    <th className="px-5 py-3">University</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4"><Skeleton className="h-9 w-48" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-5 py-4"><Skeleton className="ml-auto h-8 w-32" /></td>
                    </tr>
                  ))}
                  
                  {!isLoading && paginatedStudents.map((student) => (
                    <tr key={student.id} className="h-[72px] transition-colors hover:bg-slate-50/80">
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                            {student.fullName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{student.fullName}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <Badge variant="info">{student.career}</Badge>
                      </td>
                      <td className="px-5 py-4 align-middle text-sm text-slate-600 font-medium">
                        {student.university}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center justify-end">
                          <Button 
                            variant="outline"
                            className="h-8 text-xs font-semibold"
                            onClick={() => navigate(ROUTES.DASHBOARD_STUDENT_PORTFOLIO)}
                          >
                            <Eye size={14} weight="bold" className="mr-1.5" /> View Portfolio
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {!isLoading && paginatedStudents.length === 0 && (
                <div className="grid min-h-64 place-items-center px-5 text-center">
                  <div>
                    <MagnifyingGlass className="mx-auto text-slate-300" size={32} weight="duotone" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">No students found</p>
                    <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search query.</p>
                  </div>
                </div>
              )}
            </div>
            
            {!isLoading && paginatedStudents.length > 4 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-white via-white/85 to-transparent" />
            )}
          </div>
        </Card>

      </main>
    </div>
  );
}
