'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import {
  clearQuestionBank,
  getAllQuestions,
  getAllWorkbooks,
  removeWorkbookByName,
  saveParsedWorkbook,
} from '@/lib/db';
import { parseExcelWorkbook } from '@/lib/excel-parser';
import {
  loadBundledChapter1Sample,
  SAMPLE_CH1_FILENAME,
  SAMPLE_CH1_URL,
} from '@/lib/sample-loader';
import {
  MCQQuestion,
  OPTION_KEYS,
  ParseWorkbookResult,
  UploadedWorkbookMeta,
} from '@/types/mcq';

export default function UploadExcelPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fallbackChapter, setFallbackChapter] = useState<number>(1);
  const [recentResults, setRecentResults] = useState<ParseWorkbookResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [workbooks, setWorkbooks] = useState<UploadedWorkbookMeta[]>([]);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);

  // Question Bank Browser filters
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const refreshBank = async () => {
    const [wb, qs] = await Promise.all([getAllWorkbooks(), getAllQuestions()]);
    setWorkbooks(wb);
    setQuestions(qs);
  };

  useEffect(() => {
    refreshBank();
  }, []);

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
        const result = parseExcelWorkbook(buffer, file.name, {
          fallbackChapter,
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
      await refreshBank();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error parsing Excel file.');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadSample = async () => {
    setProcessing(true);
    setErrorMsg(null);
    try {
      const res = await loadBundledChapter1Sample();
      setRecentResults([res]);
      await refreshBank();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load sample file.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveWorkbook = async (fileName: string) => {
    await removeWorkbookByName(fileName);
    await refreshBank();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Remove all uploaded workbooks and questions from your local bank?')) {
      return;
    }
    await clearQuestionBank();
    setRecentResults([]);
    await refreshBank();
  };

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (filterChapter === 'all' || String(q.chapterNumber) === filterChapter) {
        set.add(q.sectionId);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [questions, filterChapter]);

  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return questions
      .filter((q) => {
        if (filterChapter !== 'all' && String(q.chapterNumber) !== filterChapter) return false;
        if (filterSection !== 'all' && q.sectionId !== filterSection) return false;
        if (qLower && !q.question.toLowerCase().includes(qLower)) return false;
        return true;
      })
      .sort((a, b) => {
        const sCmp = a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true });
        if (sCmp !== 0) return sCmp;
        return a.originalNo - b.originalNo;
      });
  }, [questions, filterChapter, filterSection, searchQuery]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Excel MCQ Extractor &amp; Question Bank
          </h1>
          <p className="text-sm text-slate-600">
            Upload NEC ASoE chapter Excel files (<code className="font-mono text-xs">.xlsx</code>).
            Multi-tab sheets (<code className="font-mono text-xs">1.1</code>–
            <code className="font-mono text-xs">10.6</code>),{' '}
            <code className="font-mono text-xs">Correct</code> keys, and{' '}
            <code className="font-mono text-xs">Reason / Explanation</code> columns are mapped
            automatically.
          </p>
        </div>
        {questions.length > 0 && (
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            Generate Exam ({questions.length} MCQs)
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
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
                : 'Click or Drag & Drop Excel (.xlsx) Workbooks Here'}
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Supports multi-tab NEC workbooks (e.g.,{' '}
              <span className="font-mono">{SAMPLE_CH1_FILENAME}</span> with Summary + tabs 1.1 to
              1.6) as well as custom single-sheet MCQ Excel files.
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
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Load Bundled Ch 1 (180 MCQs)
              </button>
              <a
                href={SAMPLE_CH1_URL}
                download={SAMPLE_CH1_FILENAME}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample .xlsx
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
            <code className="rounded bg-slate-100 px-1">AALL1006</code>) map automatically. For
            custom sheets without section names, assign a fallback chapter below:
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
                  Successfully Extracted {res.meta.totalQuestions} MCQs — {res.meta.fileName}
                </h3>
                <p className="text-xs text-slate-600">{res.meta.workbookTitle}</p>
              </div>
            </div>
            <Link
              href={`/generator?chapter=${res.meta.chaptersCovered[0] ?? 1}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Start Exam from This Workbook
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-6">
            {res.meta.sheetSummaries.map((sh) => (
              <div
                key={sh.sheetName}
                className="rounded-xl border border-emerald-200/80 bg-white p-3 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Tab {sh.sheetName}</span>
                  <span className="text-emerald-700">{sh.extractedCount} Qs</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Section {sh.sectionId}
                  {sh.skippedCount > 0 ? ` (${sh.skippedCount} skipped)` : ''}
                </div>
              </div>
            ))}
          </div>

          {res.meta.warnings.length > 0 && (
            <details className="text-xs text-amber-800">
              <summary className="cursor-pointer font-semibold">
                {res.meta.warnings.length} import notice(s)
              </summary>
              <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
                {res.meta.warnings.slice(0, 10).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      ))}

      {/* Uploaded Workbooks List */}
      {workbooks.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Uploaded Excel Workbooks ({workbooks.length})
              </h2>
              <p className="text-xs text-slate-500">
                Stored persistently in your browser database — re-uploading updates questions
                without duplicates.
              </p>
            </div>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {workbooks.map((wb) => (
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
                    {wb.sectionsCovered.join(', ')} • Uploaded{' '}
                    {new Date(wb.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/generator?chapter=${wb.chaptersCovered[0] ?? 1}`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Practice
                  </Link>
                  <button
                    onClick={() => handleRemoveWorkbook(wb.fileName)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    title="Remove workbook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spoiler-Safe Question Bank Explorer */}
      {questions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Extracted Question Bank Preview ({filteredQuestions.length} of {questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Correct options &amp; explanations are hidden by default so you don&apos;t spoil
                upcoming exams.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={filterChapter}
                onChange={(e) => {
                  setFilterChapter(e.target.value);
                  setFilterSection('all');
                }}
                className="w-full sm:w-auto rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Chapters</option>
                {NEC_ASOE_SYLLABUS.map((c) => (
                  <option key={c.chapterNumber} value={String(c.chapterNumber)}>
                    Chapter {c.chapterNumber} ({c.chapterCode})
                  </option>
                ))}
              </select>

              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
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

          <div className="space-y-3">
            {filteredQuestions.slice(0, 40).map((q) => {
              const revealed = !!revealedIds[q.id];
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
                      <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                    </div>
                    <button
                      onClick={() => toggleReveal(q.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      {revealed ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Peek Key
                        </>
                      )}
                    </button>
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

            {filteredQuestions.length > 40 && (
              <p className="text-center text-xs text-slate-500 pt-2">
                Showing first 40 of {filteredQuestions.length} matching questions. Use filters or
                launch an exam to practice all questions.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

