import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AppDataProvider } from '@/components/AppDataProvider';
import { PwaProvider } from '@/components/PwaProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'NEC ASoE Exam Prep — 3,180 MCQs, 50 Mock & Practice Sets',
  description:
    'Installable Nepal Engineering Council Software Engineering (ASoE) exam app with 3,180 pre-seeded MCQs across 10 chapters / 60 sections, 30 balanced 100-question 2-hour mock sets, 20 balanced 50-question practice sets, Google Sign-In, and offline support.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEC Prep',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.webp', sizes: '1024x1024', type: 'image/webp' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0d1846',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-indigo-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <PwaProvider>
          <AuthProvider>
            <AppDataProvider>
              <Navbar />
              <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
              </main>
              <footer className="no-print border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  Nepal Engineering Council (NEC) Software Engineering Syllabus (ASoE01 – AALL10) •
                  3,180 MCQs • 30 Mock Sets &amp; 20 Practice Sets
                </div>
              </footer>
            </AppDataProvider>
          </AuthProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
