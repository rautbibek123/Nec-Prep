'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { useAuth } from '@/components/AuthProvider';
import { useAppData } from '@/components/AppDataProvider';
import {
  clearUploadedWorkbooks,
  getAllQuestions,
  getAllWorkbooks,
  getQuestionsByChapter,
  getUserStatsMap,
  removeWorkbookByName,
  saveParsedWorkbook,
  toggleQuestionBookmark,
} from '@/lib/db';
import { parseExcelWorkbookAsync } from '@/lib/excel-parser';
import { SAMPLE_CH1_FILENAME, SAMPLE_CH1_URL } from '@/lib/sample-loader';
import {
  MCQQuestion,
  OPTION_KEYS,
  ParseWorkbookResult,
  QuestionStatRecord,
  UploadedWorkbookMeta,
} from '@/types/mcq';

const PAGE_SIZE = 25;

export default function UploadExcelPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { summary, reseedDatabase, refreshSummary } = useAppData();

  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fallbackChapter, setFallbackChapter] = useState<number>(1);
  const [recentResults, setRecentResults] = useState<ParseWorkbookResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [workbooks, setWorkbooks] = useState<UploadedWorkbookMeta[]>([]);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, QuestionStatRecord>>(new Map());
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Filters + debounced search + pagination
  const [filterChapter, setFilterChapter] = useState<string>('1');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadWorkbooksAndStats = useCallback(async () => {
    const [wb, st] = await Promise.all([getAllWorkbooks(), getUserStatsMap(user.id)]);
    setWorkbooks(wb);
    setStatsMap(st);
  }, [user.id]);

  // Load only the selected chapter via IndexedDB index (fast!), or all if 'all'
  const loadQuestionsForFilter = useCallback(async (chFilter: string) => {
    setLoadingQuestions(true);
    try {
      const qs =
        chFilter === 'all'
          ? await getAllQuestions()
          : await getQuestionsByChapter(Number(chFilter));
      setQuestions(qs);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    loadWorkbooksAndStats();
  }, [loadWorkbooksAndStats]);

  useEffect(() => {
    loadQuestionsForFilter(filterChapter);
  }, [filterChapter, loadQuestionsForFilter, summary.totalQuestions]);

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setProcessing(true);
    setErrorMsg(null);
    const parsedBatch: ParseWorkbookResult[] = [];

    try {
      for (const file of files) {
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
          throw new Error(
            `Unsupported file "${file.name}". Please upload an Excel (.xlsx / .xls) or .csv file.`
          );
        }
        const buffer = await file.arrayBuffer();
        const result = await parseExcelWorkbookAsync(buffer, file.name, {
          fallbackChapter,
          origin: 'uploaded',
        });
        if (result.questions.length === 0) {
          throw new Error(
            `No valid MCQs found in "${file.name}". Ensure sheets contain columns: Question, A, B, C, D, Correct, and Reason / Explanation.`
          );
        }
        await saveParsedWorkbook(result.meta, result.questions);
        parsedBatch.push(result);
      }
      setRecentResults(parsedBatch);
      await Promise.all([
        refreshSummary(),
        loadWorkbooksAndStats(),
        loadQuestionsForFilter(filterChapter),
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error parsing Excel file.');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveWorkbook = async (fileName: string) => {
    await removeWorkbookByName(fileName);
    await Promise.all([
      refreshSummary(),
      loadWorkbooksAndStats(),
      loadQuestionsForFilter(filterChapter),
    ]);
  };

  const handleClearCustom = async () => {
    if (!window.confirm('Remove all custom uploaded workbooks? Pre-seeded NEC MCQs will stay intact.')) {
      return;
    }
    await clearUploadedWorkbooks();
    setRecentResults([]);
    await Promise.all([
      refreshSummary(),
      loadWorkbooksAndStats(),
      loadQuestionsForFilter(filterChapter),
    ]);
  };

  const handleReseed = async () => {
    setProcessing(true);
    setErrorMsg(null);
    try {
      await reseedDatabase();
      await Promise.all([loadWorkbooksAndStats(), loadQuestionsForFilter(filterChapter)]);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleBookmark = async (q: MCQQuestion) => {
    const next = await toggleQuestionBookmark(user.id, q);
    setStatsMap((prev) => {
      const copy = new Map(prev);
      const old = copy.get(q.id);
      copy.set(
        q.id,
        old
          ? { ...old, bookmarked: next }
          : {
              key: `${user.id}::${q.id}`,
              userId: user.id,
              questionId: q.id,
              sectionId: q.sectionId,
              chapterNumber: q.chapterNumber,
              attempts: 0,
              correctCount: 0,
              wrongCount: 0,
              lastIsCorrect: null,
              lastAttemptedAt: null,
              bookmarked: next,
            }
      );
      return copy;
    });
  };

  const seededWorkbooks = useMemo(
    () => workbooks.filter((w) => w.origin === 'seeded'),
    [workbooks]
  );
  const customWorkbooks = useMemo(
    () => workbooks.filter((w) => w.origin !== 'seeded'),
    [workbooks]
  );

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      set.add(q.sectionId);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (filterSection !== 'all' && q.sectionId !== filterSection) return false;
        if (
          debouncedQuery &&
          !q.question.toLowerCase().includes(debouncedQuery) &&
          !q.reason.toLowerCase().includes(debouncedQuery)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sCmp = a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true });
        if (sCmp !== 0) return sCmp;
        return a.originalNo - b.originalNo;
      });
  }, [questions, filterSection, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Question Bank &amp; Excel MCQ Extractor
          </h1>
          <p className="text-sm text-slate-600">
            Pre-loaded with <strong>{summary.seededQuestions.toLocaleString()}</strong> official
            NEC ASoE MCQs across all 10 chapters. Upload custom{' '}
            <code className="font-mono text-xs">.xlsx</code> workbooks anytime to expand your bank.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReseed}
            disabled={processing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${processing ? 'animate-spin' : ''}`} />
            Re-sync Pre-Seeded Bank
          </button>
          {summary.totalQuestions > 0 && (
            <Link
              href="/sets"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              100-Q Mock Sets
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files) {
                processFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition ${
              dragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) processFiles(e.target.files);
              }}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">
              {processing
                ? 'Extracting Questions & Explanations...'
                : 'Upload Custom Excel (.xlsx) Workbooks'}
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Supports multi-tab NEC workbooks (tabs <span className="font-mono">1.1</span>–
              <span className="font-mono">10.6</span>) and single-sheet MCQ spreadsheets. SheetJS
              loads on demand only when uploading.
            </p>
            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Select .xlsx File(s)
              </button>
              <a
                href={SAMPLE_CH1_URL}
                download={SAMPLE_CH1_FILENAME}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample Template .xlsx
              </a>
            </div>
          </div>
        </div>

        {/* Fallback Settings & Format Spec Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Smart Schema Detection</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sheets named <code className="rounded bg-slate-100 px-1">1.1</code>–
            <code className="rounded bg-slate-100 px-1">10.6</code> or containing syllabus codes (
            <code className="rounded bg-slate-100 px-1">ASoE0101</code>–
            <code className="rounded bg-slate-100 px-1">AALL1006</code>) map automatically.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fallback Chapter (if not specified in sheet)
            </label>
            <select
              value={fallbackChapter}
              onChange={(e) => setFallbackChapter(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              {NEC_ASOE_SYLLABUS.map((c) => (
                <option key={c.chapterNumber} value={c.chapterNumber}>
                  Ch {c.chapterNumber} ({c.chapterCode}): {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Recognized Columns:</div>
            <div>• Question, A, B, C, D</div>
            <div>• Correct (A / B / C / D)</div>
            <div>• Reason / Explanation</div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Recent Extraction Summary */}
      {recentResults.map((res) => (
        <section
          key={res.meta.fileName}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Extracted {res.meta.totalQuestions} MCQs — {res.meta.fileName}
                </h3>
                <p className="text-xs text-slate-600">{res.meta.workbookTitle}</p>
              </div>
            </div>
            <Link
              href={`/generator?chapter=${res.meta.chaptersCovered[0] ?? 1}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Practice This Workbook
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      ))}

      {/* Custom Uploaded Workbooks (if any) */}
      {customWorkbooks.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Custom Uploaded Workbooks ({customWorkbooks.length})
              </h2>
              <p className="text-xs text-slate-500">
                Added on top of the pre-seeded 3,180-MCQ bank.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCustom}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Custom
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {customWorkbooks.map((wb) => (
              <div
                key={wb.fileName}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-900">{wb.fileName}</span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {wb.totalQuestions} MCQs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Chapters: {wb.chaptersCovered.join(', ')} • Sections:{' '}
                    {wb.sectionsCovered.join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveWorkbook(wb.fileName)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  title="Remove custom workbook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pre-Seeded Workbooks Summary */}
      {seededWorkbooks.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <summary className="cursor-pointer text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>
              Pre-Seeded NEC ASoE Workbooks ({seededWorkbooks.length} chapters •{' '}
              {summary.seededQuestions.toLocaleString()} MCQs)
            </span>
            <span className="text-xs font-medium text-indigo-600">View list</span>
          </summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {seededWorkbooks.map((wb) => (
              <div
                key={wb.fileName}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate font-bold text-slate-800">{wb.fileName}</div>
                  <div className="text-[11px] text-slate-500">
                    Sections {wb.sectionsCovered.join(', ')}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  {wb.totalQuestions}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Spoiler-Safe Paginated Question Bank Explorer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Question Bank Explorer ({filteredQuestions.length} matching
              {filterChapter !== 'all' ? ` in Chapter ${filterChapter}` : ''})
            </h2>
            <p className="text-xs text-slate-500">
              Correct options &amp; explanations stay hidden until you click Peek Key.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                aria-label="Search questions and explanations"
                placeholder="Search questions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full sm:w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by chapter"
              value={filterChapter}
              onChange={(e) => {
                setFilterChapter(e.target.value);
                setFilterSection('all');
                setPage(1);
              }}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Chapters ({summary.totalQuestions})</option>
              {NEC_ASOE_SYLLABUS.map((c) => (
                <option key={c.chapterNumber} value={String(c.chapterNumber)}>
                  Ch {c.chapterNumber} ({summary.chapterCounts[c.chapterNumber] ?? 0})
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by section"
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingQuestions ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Loading questions from IndexedDB...
          </div>
        ) : paginatedQuestions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No questions match the current filter.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedQuestions.map((q) => {
              const revealed = !!revealedIds[q.id];
              const isBookmarked = Boolean(statsMap.get(q.id)?.bookmarked);
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          Sec {q.sectionId} • {q.syllabusCode}
                        </span>
                        <span className="text-xs text-slate-400">#{q.originalNo}</span>
                        <span className="text-xs text-slate-500">{q.sectionTitle}</span>
                      </div>
                      {q.contextNote && (
                        <div className="mt-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600 mt-0.5" />
                          <span>
                            <strong>Context:</strong> {q.contextNote}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(q)}
                        aria-pressed={isBookmarked}
                        title="Bookmark question"
                        className={`rounded-lg border p-1.5 cursor-pointer ${
                          isBookmarked
                            ? 'border-amber-300 bg-amber-50 text-amber-600'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleReveal(q.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        {revealed ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Peek Key
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {OPTION_KEYS.map((key) => {
                      const isCorrect = revealed && q.correctOption === key;
                      return (
                        <div
                          key={key}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            isCorrect
                              ? 'border-emerald-400 bg-emerald-50 font-semibold text-emerald-900'
                              : 'border-slate-100 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{key}.</span>
                          {q.options[key]}
                        </div>
                      );
                    })}
                  </div>

                  {revealed && (
                    <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-950">
                      <span className="font-bold">Correct: {q.correctOption} — Reason: </span>
                      {q.reason}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
                <span className="text-slate-500">
                  Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> (
                  {filteredQuestions.length} questions)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
