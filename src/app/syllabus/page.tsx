'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Upload } from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { getAllQuestions } from '@/lib/db';
import { MCQQuestion } from '@/types/mcq';

export default function SyllabusExplorerPage() {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    getAllQuestions()
      .then(setQuestions)
      .catch(() => {});
  }, []);

  const sectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      map.set(q.sectionId, (map.get(q.sectionId) ?? 0) + 1);
    }
    return map;
  }, [questions]);

  const filteredChapters = useMemo(() => {
    const qLower = query.trim().toLowerCase();
    return NEC_ASOE_SYLLABUS.filter((ch) => {
      if (categoryFilter !== 'all' && ch.category !== categoryFilter) return false;
      if (!qLower) return true;
      if (
        ch.title.toLowerCase().includes(qLower) ||
        ch.chapterCode.toLowerCase().includes(qLower)
      ) {
        return true;
      }
      return ch.sections.some(
        (s) =>
          s.title.toLowerCase().includes(qLower) ||
          s.topics.toLowerCase().includes(qLower) ||
          s.syllabusCode.toLowerCase().includes(qLower) ||
          s.sectionId.includes(qLower)
      );
    });
  }, [query, categoryFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
            <BookOpen className="h-4 w-4" />
            Nepal Engineering Council Registration Examination
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Software Engineering Syllabus (ASoE) — 10 Chapters / 60 Sections
          </h1>
          <p className="text-sm text-slate-600">
            Chapters 1–4 cover fundamentals &amp; principles; Chapters 5–9 cover engineering
            practice; Chapter 10 covers project planning, design &amp; implementation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search topic or code (e.g. OSI, ASoE0104)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64 rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Syllabus Parts</option>
            <option value="Fundamentals & Principles">Ch 1–4: Fundamentals &amp; Principles</option>
            <option value="Engineering Practice">Ch 5–9: Engineering Practice</option>
            <option value="Project Planning & Management">Ch 10: Project Planning &amp; Management</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredChapters.map((ch) => {
          const chCount = ch.sections.reduce(
            (sum, s) => sum + (sectionCounts.get(s.sectionId) ?? 0),
            0
          );

          return (
            <section
              key={ch.chapterNumber}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                      Chapter {ch.chapterNumber}
                    </span>
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700">
                      {ch.chapterCode}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{ch.category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{ch.title}</h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      chCount > 0
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {chCount} Uploaded MCQs
                  </span>
                  {chCount > 0 ? (
                    <Link
                      href={`/generator?chapter=${ch.chapterNumber}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Practice Ch {ch.chapterNumber}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/upload"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Excel
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {ch.sections.map((sec) => {
                  const sCount = sectionCounts.get(sec.sectionId) ?? 0;
                  return (
                    <div
                      key={sec.sectionId}
                      className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-indigo-700">
                            {sec.sectionId} — {sec.title}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-slate-500">
                            {sec.syllabusCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{sec.topics}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {sCount} MCQ{sCount === 1 ? '' : 's'} in bank
                        </span>
                        {sCount > 0 && (
                          <Link
                            href={`/generator?section=${sec.sectionId}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Start Section Test →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

