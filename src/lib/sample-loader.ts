import { parseExcelWorkbook } from '@/lib/excel-parser';
import { saveParsedWorkbook } from '@/lib/db';
import { ParseWorkbookResult } from '@/types/mcq';

export const SAMPLE_CH1_FILENAME = 'NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx';
export const SAMPLE_CH1_URL = `/samples/${SAMPLE_CH1_FILENAME}`;

export async function loadBundledChapter1Sample(): Promise<ParseWorkbookResult> {
  const response = await fetch(SAMPLE_CH1_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sample Excel workbook (${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const parsed = parseExcelWorkbook(arrayBuffer, SAMPLE_CH1_FILENAME, {
    fallbackChapter: 1,
  });
  await saveParsedWorkbook(parsed.meta, parsed.questions);
  return parsed;
}

