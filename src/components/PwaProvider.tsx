'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<void>;
  openInstallGuide: () => void;
}

const DISMISS_KEY = 'nec_pwa_banner_dismissed_v1';

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIsInstalled(standalone);

    const iosDevice =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !('MSStream' in window);
    setIsIos(iosDevice);

    setIsOnline(window.navigator.onLine);
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
    setBannerDismissed(dismissed);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!showIosGuide) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIosGuide(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showIosGuide]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, '1');
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIos) {
      setShowIosGuide(true);
    }
  }, [deferredPrompt, isIos]);

  const openInstallGuide = useCallback(() => {
    if (deferredPrompt) {
      promptInstall();
    } else {
      setShowIosGuide(true);
    }
  }, [deferredPrompt, promptInstall]);

  const canInstall = Boolean(deferredPrompt);
  const showInstallBanner = !isInstalled && !bannerDismissed && (canInstall || isIos);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall,
      isInstalled,
      isIos,
      isOnline,
      promptInstall,
      openInstallGuide,
    }),
    [canInstall, isInstalled, isIos, isOnline, promptInstall, openInstallGuide]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}

      {/* Offline Status Toast */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed top-16 right-3 z-40 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-lg ring-1 ring-white/15"
        >
          <WifiOff className="h-3.5 w-3.5" />
          Offline Mode — All 3,180 MCQs Ready
        </div>
      )}

      {/* Mobile-Friendly Install App Banner */}
      {showInstallBanner && (
        <div
          role="region"
          aria-label="Install app prompt"
          className="no-print fixed bottom-16 md:bottom-4 right-3 left-3 md:left-auto md:w-96 z-40 rounded-2xl border border-indigo-200 bg-white/95 backdrop-blur p-3.5 shadow-xl"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.webp"
              alt="NEC Prep app icon"
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900">Install NEC Prep App</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Run offline like a native mobile app with all 3,180 MCQs &amp; 50 sets.
              </p>
            </div>
            <button
              type="button"
              onClick={promptInstall}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
            <button
              type="button"
              aria-label="Dismiss install banner"
              onClick={dismissBanner}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS / Browser Install Guide Modal */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.webp"
                  alt="NEC Prep app icon"
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-bold text-slate-900">
                    Install NEC Prep on Your Device
                  </h3>
                  <p className="text-xs text-slate-500">Works offline • Instant launch</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close install instructions"
                onClick={() => setShowIosGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 border border-slate-200">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  iPhone / iPad (Safari):
                </div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Tap the <strong className="inline-flex items-center gap-1"><Share className="h-3.5 w-3.5 text-indigo-600" /> Share</strong> button in Safari&apos;s toolbar.
                  </li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> — launch NEC Prep directly from your home screen!</li>
                </ol>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-200">
                <div className="font-bold text-slate-900">Android / Chrome / Edge:</div>
                <p>
                  Open the browser menu (<strong>⋮</strong>) and tap{' '}
                  <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full min-h-[42px] rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaContextValue {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error('usePwa must be used inside <PwaProvider>.');
  }
  return ctx;
}
