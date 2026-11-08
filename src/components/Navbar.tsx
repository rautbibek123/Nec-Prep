'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  History,
  LayoutDashboard,
  SlidersHorizontal,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Excel', icon: FileSpreadsheet },
  { href: '/generator', label: 'Exam Generator', icon: SlidersHorizontal },
  { href: '/syllabus', label: 'NEC Syllabus', icon: BookOpen },
  { href: '/results', label: 'Results', icon: History },
];

export function Navbar() {
  const pathname = usePathname();

  // Keep top nav compact/clean during active exam if desired, still accessible
  const isExamActive = pathname?.startsWith('/exam/');

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                NEC ASoE Exam Prep
              </span>
              <span className="hidden rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:inline-block">
                Ch 1–10 MCQ Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Excel Extractor • Locked MCQ Exam • Syllabus Analytics
            </p>
          </div>
        </Link>

        {!isExamActive && (
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {isExamActive && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Live Locked Exam Mode
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

