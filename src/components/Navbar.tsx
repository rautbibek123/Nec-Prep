'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Excel', shortLabel: 'Upload', icon: FileSpreadsheet },
  { href: '/generator', label: 'Exam Generator', shortLabel: 'Generator', icon: SlidersHorizontal },
  { href: '/syllabus', label: 'NEC Syllabus', shortLabel: 'Syllabus', icon: BookOpen },
  { href: '/results', label: 'Results', shortLabel: 'Results', icon: History },
];

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  if (!pathname || pathname === '/') {
    return [{ label: 'Dashboard Overview' }];
  }
  if (pathname.startsWith('/upload')) {
    return [{ label: 'Upload Excel & Question Bank' }];
  }
  if (pathname.startsWith('/generator')) {
    return [{ label: 'Chapter-Wise Question Generator' }];
  }
  if (pathname.startsWith('/syllabus')) {
    return [{ label: 'NEC ASoE Syllabus (Ch 1–10)' }];
  }
  if (pathname === '/results') {
    return [{ label: 'Exam Results History' }];
  }
  if (pathname.startsWith('/results/')) {
    return [
      { label: 'Results', href: '/results' },
      { label: 'Exam Scorecard & Review' },
    ];
  }
  if (pathname.startsWith('/exam/')) {
    return [
      { label: 'Generator', href: '/generator' },
      { label: 'Live Locked MCQ Exam' },
    ];
  }
  return [{ label: 'NEC ASoE Exam Prep' }];
}

export function Navbar() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isExamActive = pathname.startsWith('/exam/');
  const breadcrumbs = getBreadcrumbs(pathname);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isItemActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        {/* Main Top Row */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition group-hover:bg-indigo-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm sm:text-base font-bold tracking-tight text-slate-900">
                  NEC ASoE Exam Prep
                </span>
                <span className="hidden rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 xl:inline-block shrink-0">
                  Ch 1–10 MCQ Engine
                </span>
              </div>
              <p className="truncate text-[11px] sm:text-xs text-slate-500">
                Excel Extractor • Locked MCQ Exam
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {!isExamActive && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs lg:text-sm font-semibold transition whitespace-nowrap ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Mobile Hamburger Button (shown on < md when not in active exam) */}
          {!isExamActive && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex md:hidden items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          {/* Live Exam Mode Indicator */}
          {isExamActive && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden xs:inline">Live</span> Locked Exam
              </span>
            </div>
          )}
        </div>

        {/* Responsive Breadcrumb Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1.5 sm:px-6 lg:px-8 text-xs">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5"
            >
              {pathname !== '/' && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-1 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                  title="Go back"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              <Link
                href="/"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 shrink-0 font-medium"
              >
                <Home className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-slate-600 hover:text-indigo-600 font-medium whitespace-nowrap"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-slate-900">
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 shrink-0">
              ASoE01 – AALL10
            </span>
          </div>
        </div>

        {/* Slide-Down Mobile Menu Drawer */}
        {mobileMenuOpen && !isExamActive && (
          <div className="md:hidden border-t border-slate-200 bg-white px-3 py-3 shadow-lg">
            <div className="grid grid-cols-1 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 ${active ? 'text-indigo-200' : 'text-slate-400'}`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Dock Navigation (shown on < md when not inside a live exam) */}
      {!isExamActive && (
        <nav
          aria-label="Mobile bottom navigation"
          className="no-print fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        >
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                    active
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="truncate max-w-[64px]">{item.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
