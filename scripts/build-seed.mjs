import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT_DIR = process.cwd();
const WORKBOOKS_DIR = path.join(ROOT_DIR, 'data', 'workbooks');
const SEED_OUT_DIR = path.join(ROOT_DIR, 'public', 'seed');
const SEED_VERSION = '2.1.0-3180-50sets';
const PRNG_SEED = 20261125;

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const FOLLOW_UP_RE = /^(for the same|in the same|using the same)\b|\b(previous question|the above)\b/i;

// Official chapter codes & section titles matching src/data/nec-asoe-syllabus.ts
const SECTION_CATALOG = new Map([
  ['1.1', { chapterNumber: 1, syllabusCode: 'ASoE0101', title: 'Introduction to Information Technology' }],
  ['1.2', { chapterNumber: 1, syllabusCode: 'ASoE0102', title: 'Storage system' }],
  ['1.3', { chapterNumber: 1, syllabusCode: 'ASoE0103', title: 'Software' }],
  ['1.4', { chapterNumber: 1, syllabusCode: 'ASoE0104', title: 'Computer networks' }],
  ['1.5', { chapterNumber: 1, syllabusCode: 'ASoE0105', title: 'Data communication' }],
  ['1.6', { chapterNumber: 1, syllabusCode: 'ASoE0106', title: 'Business data processing' }],

  ['2.1', { chapterNumber: 2, syllabusCode: 'ACtE0801', title: 'Software process and requirements' }],
  ['2.2', { chapterNumber: 2, syllabusCode: 'ACtE0802', title: 'Software design' }],
  ['2.3', { chapterNumber: 2, syllabusCode: 'ACtE0803', title: 'Software testing, cost estimation, quality management, and configuration management' }],
  ['2.4', { chapterNumber: 2, syllabusCode: 'ACtE0804', title: 'Object-oriented fundamentals and analysis' }],
  ['2.5', { chapterNumber: 2, syllabusCode: 'ACtE0805', title: 'Object-oriented design' }],
  ['2.6', { chapterNumber: 2, syllabusCode: 'ACtE0806', title: 'Object-oriented design implementation' }],

  ['3.1', { chapterNumber: 3, syllabusCode: 'ASoE0301', title: 'Procedure and parallel programming languages' }],
  ['3.2', { chapterNumber: 3, syllabusCode: 'ASoE0302', title: 'Exception handling in various languages' }],
  ['3.3', { chapterNumber: 3, syllabusCode: 'ASoE0303', title: 'Pointers, structure and data files in C programming' }],
  ['3.4', { chapterNumber: 3, syllabusCode: 'ASoE0304', title: 'Object-oriented programming concepts' }],
  ['3.5', { chapterNumber: 3, syllabusCode: 'ASoE0305', title: 'Streams, file handling' }],
  ['3.6', { chapterNumber: 3, syllabusCode: 'ASoE0306', title: 'Templates' }],

  ['4.1', { chapterNumber: 4, syllabusCode: 'ACtE0701', title: 'Introduction to data structure, list, linked lists and trees' }],
  ['4.2', { chapterNumber: 4, syllabusCode: 'ACtE0702', title: 'Sorting, searching, and graphs' }],
  ['4.3', { chapterNumber: 4, syllabusCode: 'ACtE0703', title: 'Introduction to data models, normalization, and SQL' }],
  ['4.4', { chapterNumber: 4, syllabusCode: 'ACtE0704', title: 'Transaction processing, concurrency control and crash recovery' }],
  ['4.5', { chapterNumber: 4, syllabusCode: 'ACtE0705', title: 'Introduction to Operating System and process management' }],
  ['4.6', { chapterNumber: 4, syllabusCode: 'ACtE0706', title: 'Memory management, file systems and system administration' }],

  ['5.1', { chapterNumber: 5, syllabusCode: 'ASoE0501', title: 'Programming with 8085 and 8086 microprocessors' }],
  ['5.2', { chapterNumber: 5, syllabusCode: 'ASoE0502', title: 'Microprocessor system' }],
  ['5.3', { chapterNumber: 5, syllabusCode: 'ASoE0503', title: 'Interrupt operations' }],
  ['5.4', { chapterNumber: 5, syllabusCode: 'ASoE0504', title: 'Control and central processing units' }],
  ['5.5', { chapterNumber: 5, syllabusCode: 'ASoE0505', title: 'Computer arithmetic and memory system' }],
  ['5.6', { chapterNumber: 5, syllabusCode: 'ASoE0506', title: 'Input-Output organization and multiprocessor' }],

  ['6.1', { chapterNumber: 6, syllabusCode: 'ASoE0601', title: 'Foundations of algorithm analysis' }],
  ['6.2', { chapterNumber: 6, syllabusCode: 'ASoE0602', title: 'Divide and conquer algorithms' }],
  ['6.3', { chapterNumber: 6, syllabusCode: 'ASoE0603', title: 'Dynamic programming' }],
  ['6.4', { chapterNumber: 6, syllabusCode: 'ASoE0604', title: 'Loading, linker and macro processor' }],
  ['6.5', { chapterNumber: 6, syllabusCode: 'ASoE0605', title: 'Macro processor basic' }],
  ['6.6', { chapterNumber: 6, syllabusCode: 'ASoE0606', title: 'Network Programming' }],

  ['7.1', { chapterNumber: 7, syllabusCode: 'ACtE0901', title: 'Introduction to AI and intelligent agent' }],
  ['7.2', { chapterNumber: 7, syllabusCode: 'ACtE0902', title: 'Problem solving and searching techniques' }],
  ['7.3', { chapterNumber: 7, syllabusCode: 'ACtE0903', title: 'Knowledge representation' }],
  ['7.4', { chapterNumber: 7, syllabusCode: 'ACtE0904', title: 'Expert system and natural language processing' }],
  ['7.5', { chapterNumber: 7, syllabusCode: 'ACtE0905', title: 'Machine learning' }],
  ['7.6', { chapterNumber: 7, syllabusCode: 'ACtE0906', title: 'Neural networks' }],

  ['8.1', { chapterNumber: 8, syllabusCode: 'ASoE0801', title: 'Java basics and multithreading' }],
  ['8.2', { chapterNumber: 8, syllabusCode: 'ASoE0802', title: 'Java swing, AWT, event handling and JDBC' }],
  ['8.3', { chapterNumber: 8, syllabusCode: 'ASoE0803', title: 'J2EE, servlet programming and JSP programming' }],
  ['8.4', { chapterNumber: 8, syllabusCode: 'ASoE0804', title: 'Introduction to web technology' }],
  ['8.5', { chapterNumber: 8, syllabusCode: 'ASoE0805', title: 'Client and server-side scripting' }],
  ['8.6', { chapterNumber: 8, syllabusCode: 'ASoE0806', title: 'JDBC' }],

  ['9.1', { chapterNumber: 9, syllabusCode: 'ASoE0901', title: 'Introduction to real time system and real time scheduling' }],
  ['9.2', { chapterNumber: 9, syllabusCode: 'ASoE0902', title: 'Resources sharing and real time communication' }],
  ['9.3', { chapterNumber: 9, syllabusCode: 'ASoE0903', title: 'Introduction to distributed systems and cloud computing' }],
  ['9.4', { chapterNumber: 9, syllabusCode: 'ASoE0904', title: 'Distributed file system and CORBA' }],
  ['9.5', { chapterNumber: 9, syllabusCode: 'ASoE0905', title: 'Virtualization, cloud architecture, services and storage and cloud security' }],
  ['9.6', { chapterNumber: 9, syllabusCode: 'ASoE0906', title: 'Agreement in distributed system' }],

  ['10.1', { chapterNumber: 10, syllabusCode: 'AALL1001', title: 'Engineering drawings and its concepts' }],
  ['10.2', { chapterNumber: 10, syllabusCode: 'AALL1002', title: 'Engineering Economics' }],
  ['10.3', { chapterNumber: 10, syllabusCode: 'AALL1003', title: 'Project planning and scheduling' }],
  ['10.4', { chapterNumber: 10, syllabusCode: 'AALL1004', title: 'Project management' }],
  ['10.5', { chapterNumber: 10, syllabusCode: 'AALL1005', title: 'Engineering professional practice' }],
  ['10.6', { chapterNumber: 10, syllabusCode: 'AALL1006', title: 'Engineering Regulatory Body' }],
]);

function simpleHash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function buildQuestionId(sectionId, questionText, options) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const composite = [
    norm(questionText),
    norm(options.A),
    norm(options.B),
    norm(options.C),
    norm(options.D),
  ].join('||');
  return `${sectionId}::${simpleHash(composite)}`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(items, rng) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

function detectHeaderMapping(rows) {
  const maxScan = Math.min(rows.length, 15);
  for (let r = 0; r < maxScan; r++) {
    const row = rows[r] ?? [];
    let noCol;
    let questionCol;
    const optionCols = {};
    let correctCol;
    let reasonCol;

    for (let c = 0; c < row.length; c++) {
      const h = normalizeHeader(row[c]);
      if (!h) continue;
      if (['no', 'no.', 's.n', 's.n.', 'sn', 'q.no', 'qno', '#', 'id'].includes(h)) {
        if (noCol === undefined) noCol = c;
      } else if (['question', 'questions', 'question text', 'prompt', 'statement', 'stem'].includes(h)) {
        if (questionCol === undefined) questionCol = c;
      } else if (['a', 'option a', 'opt a', '(a)', 'choice a'].includes(h)) {
        optionCols.A = c;
      } else if (['b', 'option b', 'opt b', '(b)', 'choice b'].includes(h)) {
        optionCols.B = c;
      } else if (['c', 'option c', 'opt c', '(c)', 'choice c'].includes(h)) {
        optionCols.C = c;
      } else if (['d', 'option d', 'opt d', '(d)', 'choice d'].includes(h)) {
        optionCols.D = c;
      } else if (['correct', 'correct answer', 'correct option', 'answer', 'ans', 'key'].includes(h)) {
        correctCol = c;
      } else if (h.includes('reason') || h.includes('explanation')) {
        if (reasonCol === undefined) reasonCol = c;
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
      return { headerRowIndex: r, noCol, questionCol, optionCols, correctCol, reasonCol };
    }
  }
  return null;
}

function parseAllWorkbooks() {
  if (!fs.existsSync(WORKBOOKS_DIR)) {
    throw new Error(`Missing workbooks directory: ${WORKBOOKS_DIR}`);
  }

  const files = fs
    .readdirSync(WORKBOOKS_DIR)
    .filter((f) => /\.xlsx$/i.test(f))
    .sort((a, b) => {
      const ma = a.match(/Ch(\d+)/i);
      const mb = b.match(/Ch(\d+)/i);
      return (ma ? Number(ma[1]) : 99) - (mb ? Number(mb[1]) : 99);
    });

  const nowIso = new Date().toISOString();
  const allQuestions = [];
  const workbooksMeta = [];

  for (const fileName of files) {
    const fullPath = path.join(WORKBOOKS_DIR, fileName);
    const wb = XLSX.readFile(fullPath);

    let workbookTitle = fileName.replace(/\.xlsx$/i, '');
    const fileQuestions = [];
    const sheetSummaries = [];
    const warnings = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
      if (rows.length === 0) continue;

      if (sheetName.trim().toLowerCase() === 'summary') {
        const firstCell = String(rows[0]?.[0] ?? '').trim();
        if (firstCell) workbookTitle = firstCell;
        continue;
      }

      const secMeta = SECTION_CATALOG.get(sheetName.trim());
      if (!secMeta) {
        throw new Error(`Unexpected sheet "${sheetName}" in ${fileName} (not in 1.1..10.6 catalog).`);
      }

      const mapping = detectHeaderMapping(rows);
      if (!mapping) {
        throw new Error(`Could not detect header columns in "${sheetName}" of ${fileName}.`);
      }

      let extractedCount = 0;
      let skippedCount = 0;
      let lastAnchorStem = null;

      for (let r = mapping.headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] ?? [];
        const questionText = String(row[mapping.questionCol] ?? '').trim();
        if (!questionText) continue;

        const options = {
          A: String(row[mapping.optionCols.A] ?? '').trim(),
          B: String(row[mapping.optionCols.B] ?? '').trim(),
          C: String(row[mapping.optionCols.C] ?? '').trim(),
          D: String(row[mapping.optionCols.D] ?? '').trim(),
        };

        if (OPTION_KEYS.some((k) => !options[k])) {
          skippedCount++;
          warnings.push(`${sheetName} row ${r + 1}: empty option`);
          continue;
        }

        const correctOption = String(row[mapping.correctCol] ?? '').trim().toUpperCase();
        if (!OPTION_KEYS.includes(correctOption)) {
          skippedCount++;
          warnings.push(`${sheetName} row ${r + 1}: invalid correct option "${correctOption}"`);
          continue;
        }

        const rawNo = mapping.noCol !== undefined ? Number(row[mapping.noCol]) : NaN;
        const originalNo = Number.isFinite(rawNo) && rawNo > 0 ? rawNo : extractedCount + 1;
        const rawReason =
          mapping.reasonCol !== undefined ? String(row[mapping.reasonCol] ?? '').trim() : '';
        const reason =
          rawReason ||
          `Option ${correctOption} ("${options[correctOption]}") is the correct answer for ${secMeta.title}.`;

        let contextNote;
        if (FOLLOW_UP_RE.test(questionText) && lastAnchorStem) {
          contextNote = lastAnchorStem;
        } else {
          lastAnchorStem = questionText;
        }

        const sectionId = sheetName.trim();
        const id = buildQuestionId(sectionId, questionText, options);

        const qObj = {
          id,
          sourceFile: fileName,
          chapterNumber: secMeta.chapterNumber,
          sectionId,
          syllabusCode: secMeta.syllabusCode,
          sectionTitle: secMeta.title,
          originalNo,
          question: questionText,
          options,
          correctOption,
          reason,
          ...(contextNote ? { contextNote } : {}),
          origin: 'seeded',
          importedAt: nowIso,
        };

        fileQuestions.push(qObj);
        extractedCount++;
      }

      sheetSummaries.push({
        sheetName,
        sectionId: sheetName.trim(),
        extractedCount,
        skippedCount,
      });
    }

    const chaptersCovered = Array.from(new Set(fileQuestions.map((q) => q.chapterNumber))).sort(
      (a, b) => a - b
    );
    const sectionsCovered = Array.from(new Set(fileQuestions.map((q) => q.sectionId))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    workbooksMeta.push({
      fileName,
      workbookTitle,
      uploadedAt: nowIso,
      totalQuestions: fileQuestions.length,
      chaptersCovered,
      sectionsCovered,
      origin: 'seeded',
      sheetSummaries,
      warnings,
    });

    allQuestions.push(...fileQuestions);
  }

  return { allQuestions, workbooksMeta };
}

function buildBalanced30TestSets(allQuestions) {
  const rng = mulberry32(PRNG_SEED);

  // Group question IDs by sectionId
  const bySection = new Map();
  for (const secId of SECTION_CATALOG.keys()) {
    bySection.set(secId, []);
  }
  for (const q of allQuestions) {
    bySection.get(q.sectionId).push(q.id);
  }

  // Initial deterministic shuffle of each section's pool + cursors
  const sectionPools = new Map();
  const sectionCursors = new Map();
  for (const [secId, ids] of bySection.entries()) {
    sectionPools.set(secId, shuffleWithRng(ids, rng));
    sectionCursors.set(secId, 0);
  }

  function drawFromSection(secId, count, usedInCurrentSet) {
    const picked = [];
    for (let i = 0; i < count; i++) {
      let pool = sectionPools.get(secId);
      let cursor = sectionCursors.get(secId);
      if (cursor >= pool.length) {
        // Only Ch 1 reaches here after Set 18 (30 Qs exhausted); reshuffle for clean second pass
        pool = shuffleWithRng(bySection.get(secId), rng);
        sectionPools.set(secId, pool);
        cursor = 0;
      }
      // Guard against same-set collision right after a pass wrap
      while (usedInCurrentSet.has(pool[cursor])) {
        cursor = (cursor + 1) % pool.length;
      }
      const chosenId = pool[cursor];
      sectionCursors.set(secId, cursor + 1);
      usedInCurrentSet.add(chosenId);
      picked.push(chosenId);
    }
    return picked;
  }

  const testSets = [];

  for (let k = 0; k < 30; k++) {
    const setNumber = k + 1;
    const id = `set-${String(setNumber).padStart(2, '0')}`;
    const tier = setNumber <= 18 ? 'core' : 'extended';
    const usedInSet = new Set();
    const collectedIds = [];
    const chapterDistribution = {};
    const sectionDistribution = {};

    for (let ch = 1; ch <= 10; ch++) {
      chapterDistribution[ch] = 0;
      const offset = (k * 2 + (ch - 1)) % 6;
      const oneQIdxA = offset;
      const oneQIdxB = (offset + 1) % 6;

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const secId = `${ch}.${sIdx + 1}`;
        const take = sIdx === oneQIdxA || sIdx === oneQIdxB ? 1 : 2;
        const drawn = drawFromSection(secId, take, usedInSet);
        collectedIds.push(...drawn);
        chapterDistribution[ch] += drawn.length;
        sectionDistribution[secId] = drawn.length;
      }
    }

    const shuffledSetIds = shuffleWithRng(collectedIds, rng);

    testSets.push({
      id,
      setNumber,
      title: `NEC ASoE Full Mock Set ${setNumber}`,
      tier,
      defaultMode: 'exam',
      timeLimitMinutes: 120,
      questionCount: shuffledSetIds.length,
      questionIds: shuffledSetIds,
      chapterDistribution,
      sectionDistribution,
    });
  }

  return testSets;
}

function buildBalanced20PracticeSets(allQuestions) {
  const rng = mulberry32(PRNG_SEED + 1);

  const bySection = new Map();
  for (const secId of SECTION_CATALOG.keys()) {
    bySection.set(secId, []);
  }
  for (const q of allQuestions) {
    bySection.get(q.sectionId).push(q.id);
  }

  const sectionPools = new Map();
  const sectionCursors = new Map();
  for (const [secId, ids] of bySection.entries()) {
    sectionPools.set(secId, shuffleWithRng(ids, rng));
    sectionCursors.set(secId, 0);
  }

  const practiceSets = [];

  for (let k = 0; k < 20; k++) {
    const setNumber = k + 1;
    const id = `practice-${String(setNumber).padStart(2, '0')}`;
    const collectedIds = [];
    const chapterDistribution = {};
    const sectionDistribution = {};

    for (let ch = 1; ch <= 10; ch++) {
      chapterDistribution[ch] = 0;
      const skipIdx = (k + (ch - 1)) % 6;

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const secId = `${ch}.${sIdx + 1}`;
        if (sIdx === skipIdx) {
          sectionDistribution[secId] = 0;
          continue;
        }
        const pool = sectionPools.get(secId);
        const cursor = sectionCursors.get(secId);
        if (cursor >= pool.length) {
          throw new Error(`Section ${secId} exhausted while building Practice Set ${setNumber}.`);
        }
        const chosenId = pool[cursor];
        sectionCursors.set(secId, cursor + 1);
        collectedIds.push(chosenId);
        chapterDistribution[ch] += 1;
        sectionDistribution[secId] = 1;
      }
    }

    const shuffledSetIds = shuffleWithRng(collectedIds, rng);

    practiceSets.push({
      id,
      setNumber,
      title: `NEC ASoE Practice Set ${setNumber}`,
      tier: 'practice',
      defaultMode: 'practice',
      timeLimitMinutes: null,
      questionCount: shuffledSetIds.length,
      questionIds: shuffledSetIds,
      chapterDistribution,
      sectionDistribution,
    });
  }

  return practiceSets;
}

function main() {
  const { allQuestions, workbooksMeta } = parseAllWorkbooks();

  // Assert uniqueness across entire question bank
  const seenIds = new Set();
  for (const q of allQuestions) {
    if (seenIds.has(q.id)) {
      throw new Error(`Duplicate ID detected: ${q.id} (${q.question})`);
    }
    seenIds.add(q.id);
  }

  const mockSets = buildBalanced30TestSets(allQuestions);
  const practiceSets = buildBalanced20PracticeSets(allQuestions);
  const allSets = [...mockSets, ...practiceSets];

  const manifest = {
    version: SEED_VERSION,
    generatedAt: new Date().toISOString(),
    totalQuestions: allQuestions.length,
    totalSets: allSets.length,
    mockSetsCount: mockSets.length,
    practiceSetsCount: practiceSets.length,
    chaptersCount: 10,
    sectionsCount: SECTION_CATALOG.size,
    workbooks: workbooksMeta,
  };

  fs.mkdirSync(SEED_OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(SEED_OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(SEED_OUT_DIR, 'questions.json'), JSON.stringify(allQuestions));
  fs.writeFileSync(path.join(SEED_OUT_DIR, 'test-sets.json'), JSON.stringify(allSets));

  const contextCount = allQuestions.filter((q) => Boolean(q.contextNote)).length;
  console.log(
    `[build-seed] Generated ${allQuestions.length} unique MCQs (${contextCount} with scenario contextNote), ${mockSets.length} balanced 100-Q mock sets, and ${practiceSets.length} balanced 50-Q practice sets in public/seed/.`
  );
}

main();
