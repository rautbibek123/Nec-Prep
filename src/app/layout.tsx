import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'NEC ASoE Exam Prep — Excel MCQ Extractor & Chapter-Wise Exam Simulator',
  description:
    'Upload Excel MCQ workbooks mapped to the Nepal Engineering Council Software Engineering (ASoE) 10-Chapter Syllabus, generate chapter-wise exams with permanent single-choice answer locking, instant explanations, and detailed analytics.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="no-print border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            Nepal Engineering Council (NEC) Software Engineering Syllabus (ASoE01 – AALL10) •
            Excel MCQ Extractor &amp; Interactive Exam Simulator
          </div>
        </footer>
      </body>
    </html>
  );
}
