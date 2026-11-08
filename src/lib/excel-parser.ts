import * as XLSX from 'xlsx';
import {
  MCQQuestion,
  OptionKey,
  OPTION_KEYS,
  ParseWorkbookResult,
} from '@/types/mcq';
import { resolveSyllabusSection } from '@/data/nec-asoe-syllabus';

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

interface ColumnMapping {
  headerRowIndex: number;
  noCol?: number;
  questionCol: number;
  optionCols: Record<OptionKey, number>;
  correctCol: number;
  reasonCol?: number;
  sectionCol?: number;
  chapterCol?: number;
}

function detectHeaderMapping(rows: unknown[][]): ColumnMapping | null {
  const maxScan = Math.min(rows.length, 15);

  for (let r = 0; r < maxScan; r++) {
    const row = rows[r] ?? [];
    let noCol: number | undefined;
    let questionCol: number | undefined;
    const optionCols: Partial<Record<OptionKey, number>> = {};
    let correctCol: number | undefined;
    let reasonCol: number | undefined;
    let sectionCol: number | undefined;
    let chapterCol: number | undefined;

    for (let c = 0; c < row.length; c++) {
      const h = normalizeHeader(row[c]);
      if (!h) continue;

      if (['no', 'no.', 's.n', 's.n.', 'sn', 'q.no', 'qno', '#', 'id'].includes(h)) {
        if (noCol === undefined) noCol = c;
      } else if (
        ['question', 'questions', 'question text', 'prompt', 'statement', 'stem'].includes(h)
      ) {
        if (questionCol === undefined) questionCol = c;
      } else if (['a', 'option a', 'opt a', '(a)', 'choice a'].includes(h)) {
        optionCols.A = c;
      } else if (['b', 'option b', 'opt b', '(b)', 'choice b'].includes(h)) {
        optionCols.B = c;
      } else if (['c', 'option c', 'opt c', '(c)', 'choice c'].includes(h)) {
        optionCols.C = c;
      } else if (['d', 'option d', 'opt d', '(d)', 'choice d'].includes(h)) {
        optionCols.D = c;
      } else if (
        [
          'correct',
          'correct answer',
          'correct option',
          'answer',
          'ans',
          'key',
          'right answer',
          'right option',
        ].includes(h)
      ) {
        // Make sure we don't match "your answer"
        correctCol = c;
      } else if (
        h.includes('reason') ||
        h.includes('explanation') ||
        ['rationale', 'solution', 'why', 'note'].includes(h)
      ) {
        if (reasonCol === undefined) reasonCol = c;
      } else if (['section', 'subtopic', 'sub-topic', 'section id', 'code'].includes(h)) {
        sectionCol = c;
      } else if (['chapter', 'chapter no', 'ch'].includes(h)) {
        chapterCol = c;
      }
    }

    if (
      questionCol !== undefined &&
      optionCols.A !== undefined &&
      optionCols.B !== undefined &&
      optionCols.C !== undefined &&
      optionCols.D !== undefined &&
      correctCol !== undefined
    ) {
      return {
        headerRowIndex: r,
        noCol,
        questionCol,
        optionCols: optionCols as Record<OptionKey, number>,
        correctCol,
        reasonCol,
        sectionCol,
        chapterCol,
      };
    }
  }

  return null;
}

function normalizeCorrectOption(
  rawCorrect: unknown,
  options: Record<OptionKey, string>
): OptionKey | null {
  const cleaned = String(rawCorrect ?? '').trim();
  if (!cleaned) return null;

  const upper = cleaned.toUpperCase();
  if (OPTION_KEYS.includes(upper as OptionKey)) {
    return upper as OptionKey;
  }

  // Handle "Option A", "(B)", "B.", "Ans: C"
  const prefixMatch = upper.match(/^(?:OPTION\s*|OPT\s*|ANS(?:WER)?[:\s]*|\()([ABCD])(?:\)|\.|\b)/);
  if (prefixMatch) {
    return prefixMatch[1] as OptionKey;
  }

  // Handle cell containing the literal option text
  for (const key of OPTION_KEYS) {
    if (options[key].trim().toLowerCase() === cleaned.toLowerCase()) {
      return key;
    }
  }

  return null;
}

/**
 * Extracts MCQs from an Excel (.xlsx / .xls / .csv) ArrayBuffer.
 * Built specifically for NEC ASoE multi-sheet workbooks (Summary + 1.1..1.6)
 * as well as generic single/multi-sheet MCQ spreadsheets.
 */
export function parseExcelWorkbook(
  buffer: ArrayBuffer,
  fileName: string,
  options?: { fallbackChapter?: number; fallbackSection?: string }
): ParseWorkbookResult {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const nowIso = new Date().toISOString();

  let workbookTitle = fileName.replace(/\.(xlsx|xls|csv)$/i, '');
  const questions: MCQQuestion[] = [];
  const warnings: string[] = [];
  const sheetSummaries: ParseWorkbookResult['meta']['sheetSummaries'] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rows.length === 0) continue;

    const normalizedSheet = sheetName.trim().toLowerCase();
    // Extract workbook title if this is a Summary / Cover sheet
    if (
      normalizedSheet === 'summary' ||
      normalizedSheet === 'instructions' ||
      normalizedSheet === 'readme' ||
      normalizedSheet === 'overview'
    ) {
      const firstCell = String(rows[0]?.[0] ?? '').trim();
      if (firstCell) {
        workbookTitle = firstCell;
      }
      continue;
    }

    const mapping = detectHeaderMapping(rows);
    if (!mapping) {
      warnings.push(
        `Skipped sheet "${sheetName}": could not find required columns (Question, A, B, C, D, Correct).`
      );
      continue;
    }

    // Gather banner text above the header row (e.g. Row 1 in NEC workbooks)
    const bannerText = rows
      .slice(0, mapping.headerRowIndex)
      .map((r) => r.map((c) => String(c ?? '').trim()).filter(Boolean).join(' '))
      .join(' ');

    const sheetDefaultSyllabus = resolveSyllabusSection({
      sheetName,
      bannerText: `${bannerText} ${workbookTitle}`,
      fileName,
      fallbackChapter: options?.fallbackChapter,
      fallbackSection: options?.fallbackSection,
    });

    let extractedCount = 0;
    let skippedCount = 0;

    for (let r = mapping.headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const questionText = String(row[mapping.questionCol] ?? '').trim();

      // Skip empty trailing or note rows
      if (!questionText) continue;

      const optMap: Record<OptionKey, string> = {
        A: String(row[mapping.optionCols.A] ?? '').trim(),
        B: String(row[mapping.optionCols.B] ?? '').trim(),
        C: String(row[mapping.optionCols.C] ?? '').trim(),
        D: String(row[mapping.optionCols.D] ?? '').trim(),
      };

      const missingOpts = OPTION_KEYS.filter((k) => !optMap[k]);
      if (missingOpts.length > 0) {
        skippedCount++;
        warnings.push(
          `Sheet "${sheetName}" row ${r + 1}: skipped because option(s) ${missingOpts.join(', ')} are empty.`
        );
        continue;
      }

      const correctOption = normalizeCorrectOption(row[mapping.correctCol], optMap);
      if (!correctOption) {
        skippedCount++;
        warnings.push(
          `Sheet "${sheetName}" row ${r + 1}: skipped because Correct column ("${String(
            row[mapping.correctCol] ?? ''
          )}") is not A, B, C, or D.`
        );
        continue;
      }

      const rowSectionVal =
        mapping.sectionCol !== undefined ? String(row[mapping.sectionCol] ?? '').trim() : undefined;
      const rowChapterVal =
        mapping.chapterCol !== undefined ? String(row[mapping.chapterCol] ?? '').trim() : undefined;

      const resolved =
        rowSectionVal || rowChapterVal
          ? resolveSyllabusSection({
              rowSection: rowSectionVal,
              rowChapter: rowChapterVal,
              sheetName,
              bannerText,
              fileName,
              fallbackChapter: sheetDefaultSyllabus.chapterNumber,
              fallbackSection: sheetDefaultSyllabus.sectionId,
            })
          : sheetDefaultSyllabus;

      const rawNo = mapping.noCol !== undefined ? Number(row[mapping.noCol]) : NaN;
      const originalNo = Number.isFinite(rawNo) && rawNo > 0 ? rawNo : extractedCount + 1;

      const rawReason =
        mapping.reasonCol !== undefined ? String(row[mapping.reasonCol] ?? '').trim() : '';
      const reason =
        rawReason ||
        `Option ${correctOption} ("${optMap[correctOption]}") is the correct answer for this ${resolved.sectionTitle} concept.`;

      const normalizedQuestionKey = questionText.toLowerCase().replace(/\s+/g, ' ');
      const id = `${resolved.sectionId}::${simpleHash(normalizedQuestionKey)}`;

      questions.push({
        id,
        sourceFile: fileName,
        chapterNumber: resolved.chapterNumber,
        sectionId: resolved.sectionId,
        syllabusCode: resolved.syllabusCode,
        sectionTitle: resolved.sectionTitle,
        originalNo,
        question: questionText,
        options: optMap,
        correctOption,
        reason,
        importedAt: nowIso,
      });
      extractedCount++;
    }

    sheetSummaries.push({
      sheetName,
      sectionId: sheetDefaultSyllabus.sectionId,
      extractedCount,
      skippedCount,
    });
  }

  // Deduplicate within the same workbook if identical question appeared twice
  const dedupedMap = new Map<string, MCQQuestion>();
  for (const q of questions) {
    dedupedMap.set(q.id, q);
  }
  const uniqueQuestions = Array.from(dedupedMap.values());

  const chaptersCovered = Array.from(
    new Set(uniqueQuestions.map((q) => q.chapterNumber))
  ).sort((a, b) => a - b);

  const sectionsCovered = Array.from(
    new Set(uniqueQuestions.map((q) => q.sectionId))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return {
    meta: {
      fileName,
      workbookTitle,
      uploadedAt: nowIso,
      totalQuestions: uniqueQuestions.length,
      chaptersCovered,
      sectionsCovered,
      sheetSummaries,
      warnings,
    },
    questions: uniqueQuestions,
  };
}
