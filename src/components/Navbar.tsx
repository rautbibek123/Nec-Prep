'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  History,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Plus,
  SlidersHorizontal,
  Smartphone,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useAppData } from '@/components/AppDataProvider';
import { usePwa } from '@/components/PwaProvider';
import { exportUserBackup, importUserBackup } from '@/lib/db';
import type { UserBackupPayload } from '@/types/mcq';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/sets', label: 'Test Sets', shortLabel: 'Sets', icon: ClipboardList },
  { href: '/generator', label: 'Exam Generator', shortLabel: 'Builder', icon: SlidersHorizontal },
  { href: '/syllabus', label: 'NEC Syllabus', shortLabel: 'Syllabus', icon: BookOpen },
  { href: '/upload', label: 'Question Bank', shortLabel: 'Bank', icon: FileSpreadsheet },
  { href: '/results', label: 'Results', shortLabel: 'Results', icon: History },
];

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  if (!pathname || pathname === '/') {
    return [{ label: 'Dashboard Overview' }];
  }
  if (pathname.startsWith('/sets')) {
    return [{ label: '100-Q Mock Test Sets' }];
  }
  if (pathname.startsWith('/upload')) {
    return [{ label: 'Question Bank & Excel Upload' }];
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
      { label: 'Test Sets', href: '/sets' },
      { label: 'Live Exam Session' },
    ];
  }
  return [{ label: 'NEC ASoE Exam Prep' }];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'U').toUpperCase();
}

export function Navbar() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const {
    user,
    googleUser,
    googleConfigured,
    localProfiles,
    signInWithGoogle,
    signOut,
    switchLocalProfile,
    createLocalProfile,
  } = useAuth();
  const { summary, seeding, refreshSummary } = useAppData();
  const { canInstall, isInstalled, isIos, promptInstall, openInstallGuide } = usePwa();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const accountRef = useRef<HTMLDivElement | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const isExamActive = pathname.startsWith('/exam/');
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const isItemActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const handleExportBackup = async () => {
    setBackupNotice(null);
    const payload = await exportUserBackup(user.id, user.name);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nec-asoe-backup-${user.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice(
      `Exported ${payload.sessions.length} session(s) and ${payload.questionStats.length} stats.`
    );
  };

  const handleRestoreFile = async (file: File) => {
    setBackupNotice(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as UserBackupPayload;
      const res = await importUserBackup(user.id, parsed);
      await refreshSummary();
      setBackupNotice(
        `Restored ${res.importedSessions} sessions & ${res.importedStats} question records.`
      );
    } catch (err) {
      setBackupNotice(err instanceof Error ? err.message : 'Failed to import backup.');
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    createLocalProfile(newProfileName);
    setNewProfileName('');
    setBackupNotice(null);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.webp"
              alt="NEC ASoE Prep logo"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl object-cover shadow-xs ring-1 ring-slate-200 transition group-hover:scale-105"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm sm:text-base font-bold tracking-tight text-slate-900">
                  NEC ASoE Prep
                </span>
                <span className="hidden rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 xl:inline-block shrink-0">
                  {seeding
                    ? 'Syncing Bank...'
                    : `${summary.totalQuestions.toLocaleString()} MCQs`}
                </span>
              </div>
              <p className="truncate text-[11px] sm:text-xs text-slate-500">
                30 Mock • 20 Practice Sets
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {!isExamActive && (
            <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs xl:text-sm font-semibold transition whitespace-nowrap ${
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

          {/* Right Controls: Install + Account + Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {!isExamActive && !isInstalled && (canInstall || isIos) && (
              <button
                type="button"
                onClick={canInstall ? promptInstall : openInstallGuide}
                className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Install App
              </button>
            )}

            {isExamActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Live Exam
              </span>
            )}

            {/* Account / Profile Switcher */}
            {!isExamActive && (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`Account menu for ${user.name}`}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {getInitials(user.name)}
                    </span>
                  )}
                  <span className="hidden sm:inline max-w-[110px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </button>

                {accountMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User account and profile options"
                    className="absolute right-0 mt-2 w-76 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 space-y-3.5"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900">{user.name}</div>
                        <div className="truncate text-xs text-slate-500">
                          {user.email || 'Local Browser Profile'}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.provider === 'google'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.provider === 'google' ? 'Google' : 'Local'}
                      </span>
                    </div>

                    {/* Google Sign-In / Sign-Out */}
                    {googleUser ? (
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out of Google
                      </button>
                    ) : googleConfigured ? (
                      <button
                        type="button"
                        onClick={signInWithGoogle}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Sign in with Google
                      </button>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
                        <div className="font-semibold text-slate-800">
                          Google Sign-In Optional
                        </div>
                        Add <code className="font-mono">GOOGLE_CLIENT_ID</code> &amp;{' '}
                        <code className="font-mono">GOOGLE_CLIENT_SECRET</code> in{' '}
                        <code className="font-mono">.env.local</code> to enable Google OAuth. Local
                        profiles below keep each user&apos;s progress separate.
                      </div>
                    )}

                    {/* Local Profiles Switcher (when not using Google account) */}
                    {!googleUser && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Switch Local User Profile
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {localProfiles.map((prof) => {
                            const active = prof.id === user.id;
                            return (
                              <button
                                key={prof.id}
                                type="button"
                                onClick={() => switchLocalProfile(prof.id)}
                                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                                  active
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <User className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{prof.name}</span>
                                </span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                        <form onSubmit={handleCreateProfile} className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="New profile name..."
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            aria-label="New local profile name"
                            className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Portable JSON Progress Backup */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Portable Progress Backup
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => restoreInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Restore JSON
                        </button>
                        <input
                          ref={restoreInputRef}
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleRestoreFile(f);
                          }}
                        />
                      </div>
                      {backupNotice && (
                        <p className="text-[11px] font-medium text-emerald-700" aria-live="polite">
                          {backupNotice}
                        </p>
                      )}
                    </div>

                    {!isInstalled && (
                      <div className="border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            if (canInstall) promptInstall();
                            else openInstallGuide();
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          {canInstall ? 'Install App on Device' : 'How to Install Mobile App'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            {!isExamActive && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0 min-h-[40px] min-w-[40px]"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
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
              Account: {user.name} • ASoE01–AALL10
            </span>
          </div>
        </div>

        {/* Slide-Down Mobile Menu Drawer */}
        {mobileMenuOpen && !isExamActive && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-3 shadow-lg">
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

      {/* Mobile Bottom Dock Navigation */}
      {!isExamActive && (
        <nav
          aria-label="Mobile bottom navigation"
          className="no-print safe-bottom fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        >
          <div className="grid grid-cols-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition ${
                    active
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="truncate max-w-[54px]">{item.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
