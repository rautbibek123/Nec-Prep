'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Lightbulb,
  MinusCircle,
  Printer,
  RotateCcw,
  Search,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { createSession, getSessionById } from '@/lib/db';
import { buildRemediationSession } from '@/lib/exam-generator';
import { calculateExamSummary, formatDuration } from '@/lib/scoring';
import { ExamSession, OPTION_KEYS } from '@/types/mcq';

type ReviewTab = 'all' | 'wrong' | 'correct' | 'skipped';

export default function ExamResultDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewTab, setReviewTab] = useState<ReviewTab>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await getSessionById(sessionId);
        if (!active) return;
        setSession(s ?? null);
        // Default to 'wrong' review tab if user made mistakes, else 'all'
        if (s) {
          const hasWrong = Object.values(s.answers).some((a) => !a.isCorrect);
          if (hasWrong) setReviewTab('wrong');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const summary = useMemo(
    () => (session ? calculateExamSummary(session) : null),
    [session]
  );

  const missedOrSkippedQuestions = useMemo(() => {
    if (!session) return [];
    return session.questionsSnapshot.filter((q) => {
      const ans = session.answers[q.id];
      return !ans || !ans.isCorrect;
    });
  }, [session]);

  const wrongOnlyQuestions = useMemo(() => {
    if (!session) return [];
    return session.questionsSnapshot.filter((q) => {
      const ans = session.answers[q.id];
      return Boolean(ans && !ans.isCorrect);
    });
  }, [session]);

  const filteredReviewQuestions = useMemo(() => {
    if (!session) return [];
    const qLower = searchQuery.trim().toLowerCase();

    return session.questionsSnapshot
      .map((q, index) => ({ q, index, ans: session.answers[q.id] }))
      .filter(({ q, ans }) => {
        if (reviewTab === 'wrong' && (!ans || ans.isCorrect)) return false;
        if (reviewTab === 'correct' && !ans?.isCorrect) return false;
        if (reviewTab === 'skipped' && ans) return false;
        if (sectionFilter !== 'all' && q.sectionId !== sectionFilter) return false;
        if (
          qLower &&
          !q.question.toLowerCase().includes(qLower) &&
          !q.reason.toLowerCase().includes(qLower)
        ) {
          return false;
        }
        return true;
      });
  }, [session, reviewTab, sectionFilter, searchQuery]);

  const handleRetryQuestions = async (mode: 'wrong_only' | 'wrong_and_skipped') => {
    if (!session || retrying) return;
    const subset =
      mode === 'wrong_only' ? wrongOnlyQuestions : missedOrSkippedQuestions;
    if (subset.length === 0) return;

    setRetrying(true);
    try {
      const newSession = buildRemediationSession({
        title: `Retry Mistakes — ${session.title}`,
        questions: subset,
        timeLimitMinutes: null,
      });
      await createSession(newSession);
      router.push(`/exam/${newSession.id}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleExportCsv = () => {
    if (!session || !summary) return;
    const lines: string[] = [
      ['No', 'Section', 'Syllabus Code', 'Question', 'Your Choice', 'Correct Option', 'Status', 'Reason / Explanation'].join(','),
    ];

    session.questionsSnapshot.forEach((q, idx) => {
      const ans = session.answers[q.id];
      const status = !ans ? 'Skipped' : ans.isCorrect ? 'Correct' : 'Wrong';
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      lines.push(
        [
          idx + 1,
          esc(q.sectionId),
          esc(q.syllabusCode),
          esc(q.question),
          esc(ans?.selectedOption ?? '—'),
          esc(q.correctOption),
          esc(status),
          esc(q.reason),
        ].join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]+/gi, '_')}_Result.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
        Calculating exam results &amp; syllabus breakdown...
      </div>
    );
  }

  if (!session || !summary) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-bold text-slate-900">Result Not Found</h1>
        <Link
          href="/results"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Results History
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Executive Scorecard Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  summary.passed
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                {summary.passed
                  ? `NEC PASS BENCHMARK MET (≥ ${summary.passThresholdPercent}%)`
                  : `BELOW NEC PASS BENCHMARK (${summary.passThresholdPercent}%)`}
              </span>
              <span className="text-xs text-slate-400">
                Completed{' '}
                {new Date(session.completedAt ?? session.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{session.title}</h1>

            {/* Action Buttons */}
            <div className="no-print flex flex-wrap items-center gap-2.5 pt-2">
              {wrongOnlyQuestions.length > 0 && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={() => handleRetryQuestions('wrong_only')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-rose-400 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry {wrongOnlyQuestions.length} Wrong Question
                  {wrongOnlyQuestions.length === 1 ? '' : 's'}
                </button>
              )}

              {missedOrSkippedQuestions.length > wrongOnlyQuestions.length && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={() => handleRetryQuestions('wrong_and_skipped')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry Wrong + Skipped ({missedOrSkippedQuestions.length})
                </button>
              )}

              <Link
                href={`/generator?chapter=${session.config.selectedChapters[0] ?? 1}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-400"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                New Exam
              </Link>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Report
              </button>
            </div>
          </div>

          {/* KPI Stat Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="text-xs text-slate-300">Final Score</div>
              <div className="mt-1 text-2xl font-extrabold">
                {summary.correct} / {summary.totalQuestions}
              </div>
              <div className="mt-0.5 text-xs font-bold text-indigo-300">
                {summary.overallPercent}% Total
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/15 p-4 ring-1 ring-emerald-400/30">
              <div className="text-xs text-emerald-200">Correct</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-300">
                {summary.correct}
              </div>
              <div className="mt-0.5 text-xs text-emerald-200/80">
                {summary.attemptAccuracyPercent}% precision
              </div>
            </div>

            <div className="rounded-xl bg-rose-500/15 p-4 ring-1 ring-rose-400/30">
              <div className="text-xs text-rose-200">Wrong</div>
              <div className="mt-1 text-2xl font-extrabold text-rose-300">{summary.wrong}</div>
              <div className="mt-0.5 text-xs text-rose-200/80">{summary.skipped} skipped</div>
            </div>

            <div className="col-span-2 sm:col-span-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-xs text-slate-300 ring-1 ring-white/10">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-300" />
                Time Taken: <strong className="text-white">{formatDuration(summary.elapsedSeconds)}</strong>
              </span>
              <span>
                Avg Pace: <strong className="text-white">{summary.avgSecondsPerAttempt}s / Q</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section-Wise Syllabus Performance Breakdown (Upgraded Excel Summary Sheet) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chapter &amp; Section-Wise Syllabus Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Performance across official Nepal Engineering Council (ASoE) syllabus sections
              included in this exam.
            </p>
          </div>
          {summary.weakSections.length > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              {summary.weakSections.length} section(s) need extra revision
            </span>
          )}
        </div>

        {/* Mobile Cards for Section Breakdown (< md) */}
        <div className="grid gap-3 md:hidden">
          {summary.sectionBreakdown.map((sec) => (
            <div
              key={sec.sectionId}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-xs text-indigo-700 mr-1.5">{sec.sectionId}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 border border-slate-200">
                    {sec.syllabusCode}
                  </span>
                  <div className="mt-1 text-xs font-bold text-slate-900">{sec.sectionTitle}</div>
                </div>
                <Link
                  href={`/generator?section=${sec.sectionId}`}
                  className="shrink-0 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-600"
                >
                  Drill {sec.sectionId}
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                <div className="rounded bg-white py-1 border border-slate-200/70">
                  <div className="text-slate-400">Total</div>
                  <div className="font-bold text-slate-800">{sec.totalQuestions}</div>
                </div>
                <div className="rounded bg-white py-1 border border-slate-200/70">
                  <div className="text-slate-400">Tried</div>
                  <div className="font-bold text-slate-800">{sec.attempted}</div>
                </div>
                <div className="rounded bg-emerald-50 py-1 border border-emerald-200/70">
                  <div className="text-emerald-700">Right</div>
                  <div className="font-bold text-emerald-700">{sec.correct}</div>
                </div>
                <div className="rounded bg-rose-50 py-1 border border-rose-200/70">
                  <div className="text-rose-700">Wrong</div>
                  <div className="font-bold text-rose-700">{sec.wrong}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      sec.scorePercent >= 80
                        ? 'bg-emerald-500'
                        : sec.scorePercent >= 50
                        ? 'bg-indigo-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${sec.scorePercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-800">{sec.scorePercent}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table for Section Breakdown (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-3">Section</th>
                <th className="py-3 px-3">Topic</th>
                <th className="py-3 px-3 text-center">Questions</th>
                <th className="py-3 px-3 text-center">Attempted</th>
                <th className="py-3 px-3 text-center">Correct</th>
                <th className="py-3 px-3 text-center">Wrong</th>
                <th className="py-3 px-3">Score %</th>
                <th className="py-3 pl-3 text-right no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.sectionBreakdown.map((sec) => (
                <tr key={sec.sectionId} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 mr-1.5">{sec.sectionId}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                      {sec.syllabusCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{sec.sectionTitle}</td>
                  <td className="py-3 px-3 text-center font-semibold">{sec.totalQuestions}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{sec.attempted}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600">
                    {sec.correct}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-rose-600">{sec.wrong}</td>
                  <td className="py-3 px-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            sec.scorePercent >= 80
                              ? 'bg-emerald-500'
                              : sec.scorePercent >= 50
                              ? 'bg-indigo-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${sec.scorePercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 w-11 text-right">
                        {sec.scorePercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap no-print">
                    <Link
                      href={`/generator?section=${sec.sectionId}`}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      Drill {sec.sectionId}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed Question-by-Question Review with Explanations */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Detailed Question &amp; Explanation Review
            </h2>
            <p className="text-xs text-slate-500">
              Inspect every question, compare your locked choice against the correct option, and
              study the explanation.
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: `All (${summary.totalQuestions})` },
                { id: 'wrong', label: `Wrong (${summary.wrong})` },
                { id: 'correct', label: `Correct (${summary.correct})` },
                { id: 'skipped', label: `Skipped (${summary.skipped})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewTab(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  reviewTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-medium"
            >
              <option value="all">All Sections</option>
              {summary.sectionBreakdown.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>
                  Sec {s.sectionId} ({s.sectionTitle})
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {filteredReviewQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No questions match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviewQuestions.map(({ q, index, ans }) => {
              const isSkipped = !ans;
              const isCorrect = Boolean(ans?.isCorrect);

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-xs space-y-4 ${
                    isSkipped
                      ? 'border-slate-200'
                      : isCorrect
                      ? 'border-emerald-200'
                      : 'border-rose-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                        Q{index + 1}
                      </span>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        Sec {q.sectionId} • {q.syllabusCode}
                      </span>
                      <span className="text-xs text-slate-500">{q.sectionTitle}</span>
                    </div>

                    {isSkipped ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        <MinusCircle className="h-3.5 w-3.5" />
                        Skipped / Unattempted
                      </span>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Answered Correctly ({ans?.selectedOption})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        <XCircle className="h-3.5 w-3.5" />
                        Your Choice: {ans?.selectedOption} • Correct: {q.correctOption}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-bold text-slate-900">{q.question}</p>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {OPTION_KEYS.map((key) => {
                      const chosenByUser = ans?.selectedOption === key;
                      const actualRight = q.correctOption === key;

                      let style = 'border-slate-200 bg-slate-50 text-slate-700';
                      if (actualRight) {
                        style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                      } else if (chosenByUser && !actualRight) {
                        style = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                      }

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${style}`}
                        >
                          <span>
                            <strong className="mr-1.5">{key}.</strong>
                            {q.options[key]}
                          </span>
                          {actualRight && (
                            <span className="shrink-0 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Correct
                            </span>
                          )}
                          {chosenByUser && !actualRight && (
                            <span className="shrink-0 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Your Pick
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5">
                    <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-slate-900">Reason / Explanation: </strong>
                      {q.reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

