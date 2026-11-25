import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ExamSession,
  LockedAnswerRecord,
  MCQQuestion,
  QuestionBankSummary,
  QuestionStatRecord,
  SeedManifest,
  TestSetDefinition,
  UploadedWorkbookMeta,
  UserBackupPayload,
} from '@/types/mcq';

interface MetaEntry {
  key: string;
  value: unknown;
}

export interface StoredSeedMeta {
  version: string;
  generatedAt: string;
  totalQuestions: number;
  totalSets: number;
}

interface NecMcqDB extends DBSchema {
  questions: {
    key: string;
    value: MCQQuestion;
    indexes: {
      'by-chapter': number;
      'by-section': string;
      'by-source': string;
      'by-origin': string;
    };
  };
  workbooks: {
    key: string; // fileName
    value: UploadedWorkbookMeta;
  };
  sessions: {
    key: string; // session.id
    value: ExamSession;
    indexes: {
      'by-created': string;
      'by-status': string;
      'by-user': string;
      'by-set': string;
    };
  };
  questionStats: {
    key: string; // `${userId}::${questionId}`
    value: QuestionStatRecord;
    indexes: {
      'by-user': string;
      'by-user-section': [string, string];
    };
  };
  meta: {
    key: string;
    value: MetaEntry;
  };
}

const DB_NAME = 'nec-asoe-mcq-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<NecMcqDB>> | null = null;

function getDb(): Promise<IDBPDatabase<NecMcqDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser context.'));
  }
  if (!dbPromise) {
    dbPromise = openDB<NecMcqDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (!db.objectStoreNames.contains('questions')) {
          const qStore = db.createObjectStore('questions', { keyPath: 'id' });
          qStore.createIndex('by-chapter', 'chapterNumber');
          qStore.createIndex('by-section', 'sectionId');
          qStore.createIndex('by-source', 'sourceFile');
          qStore.createIndex('by-origin', 'origin');
        } else if (oldVersion < 2) {
          const qStore = tx.objectStore('questions');
          if (!qStore.indexNames.contains('by-origin')) {
            qStore.createIndex('by-origin', 'origin');
          }
        }

        if (!db.objectStoreNames.contains('workbooks')) {
          db.createObjectStore('workbooks', { keyPath: 'fileName' });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sStore.createIndex('by-created', 'createdAt');
          sStore.createIndex('by-status', 'status');
          sStore.createIndex('by-user', 'userId');
          sStore.createIndex('by-set', 'setId');
        } else if (oldVersion < 2) {
          const sStore = tx.objectStore('sessions');
          if (!sStore.indexNames.contains('by-user')) {
            sStore.createIndex('by-user', 'userId');
          }
          if (!sStore.indexNames.contains('by-set')) {
            sStore.createIndex('by-set', 'setId');
          }
          let cursor = await sStore.openCursor();
          while (cursor) {
            const val = cursor.value as ExamSession & { userId?: string; mode?: string };
            if (!val.userId || !val.mode) {
              await cursor.update({
                ...val,
                userId: val.userId || 'guest',
                mode: val.mode === 'exam' ? 'exam' : 'practice',
                flaggedIds: val.flaggedIds ?? [],
              });
            }
            cursor = await cursor.continue();
          }
        }

        if (!db.objectStoreNames.contains('questionStats')) {
          const qsStore = db.createObjectStore('questionStats', { keyPath: 'key' });
          qsStore.createIndex('by-user', 'userId');
          qsStore.createIndex('by-user-section', ['userId', 'sectionId']);
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

function buildSummaryFromData(
  questions: MCQQuestion[],
  workbooks: UploadedWorkbookMeta[],
  seedVersion: string | null
): QuestionBankSummary {
  const chapterCounts: Record<number, number> = {};
  const sectionCounts: Record<string, number> = {};
  let seededQuestions = 0;
  let uploadedQuestions = 0;

  for (const q of questions) {
    chapterCounts[q.chapterNumber] = (chapterCounts[q.chapterNumber] ?? 0) + 1;
    sectionCounts[q.sectionId] = (sectionCounts[q.sectionId] ?? 0) + 1;
    if (q.origin === 'seeded') seededQuestions++;
    else uploadedQuestions++;
  }

  const populatedSectionsCount = Object.values(sectionCounts).filter((c) => c > 0).length;

  return {
    totalQuestions: questions.length,
    seededQuestions,
    uploadedQuestions,
    chapterCounts,
    sectionCounts,
    populatedSectionsCount,
    workbooks: [...workbooks].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    seedVersion,
  };
}

async function refreshSummaryMeta(db: IDBPDatabase<NecMcqDB>): Promise<QuestionBankSummary> {
  const [questions, workbooks, seedMetaEntry] = await Promise.all([
    db.getAll('questions'),
    db.getAll('workbooks'),
    db.get('meta', 'seedMeta'),
  ]);
  const seedMeta = seedMetaEntry?.value as StoredSeedMeta | undefined;
  const summary = buildSummaryFromData(questions, workbooks, seedMeta?.version ?? null);
  await db.put('meta', { key: 'bankSummary', value: summary });
  return summary;
}

export async function getSeedMeta(): Promise<StoredSeedMeta | null> {
  const db = await getDb();
  const entry = await db.get('meta', 'seedMeta');
  return (entry?.value as StoredSeedMeta | undefined) ?? null;
}

export async function getStoredTestSets(): Promise<TestSetDefinition[]> {
  const db = await getDb();
  const entry = await db.get('meta', 'testSets');
  return (entry?.value as TestSetDefinition[] | undefined) ?? [];
}

export async function getQuestionBankSummary(): Promise<QuestionBankSummary> {
  const db = await getDb();
  const cached = await db.get('meta', 'bankSummary');
  if (cached?.value) {
    return cached.value as QuestionBankSummary;
  }
  return refreshSummaryMeta(db);
}

/**
 * Bulk-seeds the database in a single pipelined IndexedDB transaction.
 * Replaces only previously seeded questions and preserves custom uploaded workbooks.
 */
export async function seedDatabaseBulk(
  manifest: SeedManifest,
  questions: MCQQuestion[],
  testSets: TestSetDefinition[]
): Promise<QuestionBankSummary> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks', 'meta'], 'readwrite');
  const qStore = tx.objectStore('questions');
  const wbStore = tx.objectStore('workbooks');
  const metaStore = tx.objectStore('meta');

  // Remove stale seeded questions
  const originIndex = qStore.index('by-origin');
  const staleSeededKeys = await originIndex.getAllKeys('seeded');
  for (const key of staleSeededKeys) {
    qStore.delete(key);
  }

  // Pipelined bulk insert (no await per item)
  for (const q of questions) {
    qStore.put(q);
  }

  // Remove stale seeded workbooks, keep uploaded workbooks
  const existingWorkbooks = await wbStore.getAll();
  for (const wb of existingWorkbooks) {
    if (wb.origin === 'seeded') {
      wbStore.delete(wb.fileName);
    }
  }
  for (const wb of manifest.workbooks) {
    wbStore.put(wb);
  }

  const seedMeta: StoredSeedMeta = {
    version: manifest.version,
    generatedAt: manifest.generatedAt,
    totalQuestions: manifest.totalQuestions,
    totalSets: manifest.totalSets,
  };
  metaStore.put({ key: 'seedMeta', value: seedMeta });
  metaStore.put({ key: 'testSets', value: testSets });

  await tx.done;
  return refreshSummaryMeta(db);
}

export async function saveParsedWorkbook(
  meta: UploadedWorkbookMeta,
  questions: MCQQuestion[]
): Promise<QuestionBankSummary> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  const qStore = tx.objectStore('questions');
  for (const q of questions) {
    qStore.put({ ...q, origin: q.origin ?? 'uploaded' });
  }
  tx.objectStore('workbooks').put({ ...meta, origin: meta.origin ?? 'uploaded' });
  await tx.done;
  return refreshSummaryMeta(db);
}

export async function getAllQuestions(): Promise<MCQQuestion[]> {
  const db = await getDb();
  return db.getAll('questions');
}

export async function getQuestionsByChapter(chapterNumber: number): Promise<MCQQuestion[]> {
  const db = await getDb();
  return db.getAllFromIndex('questions', 'by-chapter', chapterNumber);
}

export async function getQuestionsBySections(sectionIds: string[]): Promise<MCQQuestion[]> {
  if (sectionIds.length === 0) return [];
  const db = await getDb();
  const tx = db.transaction('questions', 'readonly');
  const idx = tx.objectStore('questions').index('by-section');
  const chunks = await Promise.all(sectionIds.map((secId) => idx.getAll(secId)));
  await tx.done;
  return chunks.flat();
}

export async function getQuestionsByIds(ids: string[]): Promise<MCQQuestion[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const tx = db.transaction('questions', 'readonly');
  const store = tx.objectStore('questions');
  const items = await Promise.all(ids.map((id) => store.get(id)));
  await tx.done;
  return items.filter((q): q is MCQQuestion => Boolean(q));
}

export async function getAllWorkbooks(): Promise<UploadedWorkbookMeta[]> {
  const db = await getDb();
  const list = await db.getAll('workbooks');
  return list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function removeWorkbookByName(fileName: string): Promise<QuestionBankSummary> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  const qStore = tx.objectStore('questions');
  const idx = qStore.index('by-source');
  const keys = await idx.getAllKeys(fileName);
  for (const key of keys) {
    qStore.delete(key);
  }
  tx.objectStore('workbooks').delete(fileName);
  await tx.done;
  return refreshSummaryMeta(db);
}

export async function clearUploadedWorkbooks(): Promise<QuestionBankSummary> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  const qStore = tx.objectStore('questions');
  const wbStore = tx.objectStore('workbooks');

  const uploadedKeys = await qStore.index('by-origin').getAllKeys('uploaded');
  for (const k of uploadedKeys) {
    qStore.delete(k);
  }

  const allWb = await wbStore.getAll();
  for (const wb of allWb) {
    if (wb.origin !== 'seeded') {
      wbStore.delete(wb.fileName);
    }
  }
  await tx.done;
  return refreshSummaryMeta(db);
}

export async function clearQuestionBank(): Promise<QuestionBankSummary> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks', 'meta'], 'readwrite');
  tx.objectStore('questions').clear();
  tx.objectStore('workbooks').clear();
  tx.objectStore('meta').delete('seedMeta');
  tx.objectStore('meta').delete('bankSummary');
  await tx.done;
  return refreshSummaryMeta(db);
}

// ============================================================================
// Sessions & Per-User Question Stats
// ============================================================================

export async function createSession(session: ExamSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getSessionById(sessionId: string): Promise<ExamSession | undefined> {
  const db = await getDb();
  return db.get('sessions', sessionId);
}

export async function getUserSessions(userId: string): Promise<ExamSession[]> {
  const db = await getDb();
  const list = await db.getAllFromIndex('sessions', 'by-user', userId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllSessions(): Promise<ExamSession[]> {
  const db = await getDb();
  const list = await db.getAll('sessions');
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteSessionById(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.delete('sessions', sessionId);
}

function makeStatKey(userId: string, questionId: string): string {
  return `${userId}::${questionId}`;
}

function applyStatUpdate(
  existing: QuestionStatRecord | undefined,
  params: {
    userId: string;
    questionId: string;
    sectionId: string;
    chapterNumber: number;
    isCorrect: boolean;
    attemptedAt: string;
  }
): QuestionStatRecord {
  return {
    key: makeStatKey(params.userId, params.questionId),
    userId: params.userId,
    questionId: params.questionId,
    sectionId: params.sectionId,
    chapterNumber: params.chapterNumber,
    attempts: (existing?.attempts ?? 0) + 1,
    correctCount: (existing?.correctCount ?? 0) + (params.isCorrect ? 1 : 0),
    wrongCount: (existing?.wrongCount ?? 0) + (params.isCorrect ? 0 : 1),
    lastIsCorrect: params.isCorrect,
    lastAttemptedAt: params.attemptedAt,
    bookmarked: existing?.bookmarked ?? false,
  };
}

/**
 * Practice mode: Atomically locks a single-choice answer for a question in an ExamSession.
 * STRICT IMMUTABILITY: If an answer already exists for `questionId`, it is NEVER overwritten.
 */
export async function lockSessionAnswer(
  sessionId: string,
  questionId: string,
  record: LockedAnswerRecord,
  elapsedSeconds: number
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'questionStats'], 'readwrite');
  const sStore = tx.objectStore('sessions');
  const qsStore = tx.objectStore('questionStats');

  const existing = await sStore.get(sessionId);
  if (!existing) {
    await tx.done;
    return undefined;
  }

  if (existing.answers[questionId] || existing.status === 'completed') {
    await tx.done;
    return existing;
  }

  const updated: ExamSession = {
    ...existing,
    elapsedSeconds: Math.max(existing.elapsedSeconds, elapsedSeconds),
    answers: {
      ...existing.answers,
      [questionId]: record,
    },
  };
  sStore.put(updated);

  const qMeta = existing.questionsSnapshot.find((q) => q.id === questionId);
  if (qMeta) {
    const userId = existing.userId || 'guest';
    const statKey = makeStatKey(userId, questionId);
    const prevStat = await qsStore.get(statKey);
    qsStore.put(
      applyStatUpdate(prevStat, {
        userId,
        questionId,
        sectionId: qMeta.sectionId,
        chapterNumber: qMeta.chapterNumber,
        isCorrect: record.isCorrect,
        attemptedAt: record.lockedAt,
      })
    );
  }

  await tx.done;
  return updated;
}

/**
 * Real Exam mode: Allows selecting or changing an option before final submission.
 */
export async function selectExamAnswer(
  sessionId: string,
  questionId: string,
  record: LockedAnswerRecord,
  elapsedSeconds: number
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  const existing = await store.get(sessionId);
  if (!existing || existing.status === 'completed') {
    await tx.done;
    return existing;
  }

  if (existing.mode === 'practice' && existing.answers[questionId]) {
    await tx.done;
    return existing;
  }

  const updated: ExamSession = {
    ...existing,
    elapsedSeconds: Math.max(existing.elapsedSeconds, elapsedSeconds),
    answers: {
      ...existing.answers,
      [questionId]: record,
    },
  };

  store.put(updated);
  await tx.done;
  return updated;
}

export async function toggleSessionFlag(
  sessionId: string,
  questionId: string
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  const existing = await store.get(sessionId);
  if (!existing) {
    await tx.done;
    return undefined;
  }
  const current = new Set(existing.flaggedIds ?? []);
  if (current.has(questionId)) current.delete(questionId);
  else current.add(questionId);

  const updated: ExamSession = {
    ...existing,
    flaggedIds: Array.from(current),
  };
  store.put(updated);
  await tx.done;
  return updated;
}

export async function updateSessionProgress(
  sessionId: string,
  patch: { currentIndex?: number; elapsedSeconds?: number }
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  const existing = await store.get(sessionId);
  if (!existing || existing.status === 'completed') {
    await tx.done;
    return;
  }
  const updated: ExamSession = {
    ...existing,
    currentIndex: patch.currentIndex ?? existing.currentIndex,
    elapsedSeconds:
      patch.elapsedSeconds !== undefined
        ? Math.max(existing.elapsedSeconds, patch.elapsedSeconds)
        : existing.elapsedSeconds,
  };
  store.put(updated);
  await tx.done;
}

export async function completeSessionInDb(
  sessionId: string,
  elapsedSeconds: number
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'questionStats'], 'readwrite');
  const sStore = tx.objectStore('sessions');
  const qsStore = tx.objectStore('questionStats');

  const existing = await sStore.get(sessionId);
  if (!existing) {
    await tx.done;
    return undefined;
  }
  if (existing.status === 'completed') {
    await tx.done;
    return existing;
  }

  const completedAt = new Date().toISOString();
  const updated: ExamSession = {
    ...existing,
    status: 'completed',
    completedAt,
    elapsedSeconds: Math.max(existing.elapsedSeconds, elapsedSeconds),
  };
  sStore.put(updated);

  // In 'exam' mode, stats are recorded upon submission
  if (existing.mode === 'exam') {
    const userId = existing.userId || 'guest';
    const qLookup = new Map(existing.questionsSnapshot.map((q) => [q.id, q]));
    const answerEntries = Object.entries(existing.answers);
    const existingStats = await Promise.all(
      answerEntries.map(([qId]) => qsStore.get(makeStatKey(userId, qId)))
    );

    answerEntries.forEach(([qId, ans], i) => {
      const qMeta = qLookup.get(qId);
      if (!qMeta) return;
      qsStore.put(
        applyStatUpdate(existingStats[i], {
          userId,
          questionId: qId,
          sectionId: qMeta.sectionId,
          chapterNumber: qMeta.chapterNumber,
          isCorrect: ans.isCorrect,
          attemptedAt: ans.lockedAt || completedAt,
        })
      );
    });
  }

  await tx.done;
  return updated;
}

export async function getUserStats(userId: string): Promise<QuestionStatRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex('questionStats', 'by-user', userId);
}

export async function getUserStatsMap(
  userId: string
): Promise<Map<string, QuestionStatRecord>> {
  const list = await getUserStats(userId);
  return new Map(list.map((r) => [r.questionId, r]));
}

export async function toggleQuestionBookmark(
  userId: string,
  question: Pick<MCQQuestion, 'id' | 'sectionId' | 'chapterNumber'>
): Promise<boolean> {
  const db = await getDb();
  const tx = db.transaction('questionStats', 'readwrite');
  const store = tx.objectStore('questionStats');
  const key = makeStatKey(userId, question.id);
  const existing = await store.get(key);
  const nextBookmarked = !(existing?.bookmarked ?? false);

  const record: QuestionStatRecord = existing
    ? { ...existing, bookmarked: nextBookmarked }
    : {
        key,
        userId,
        questionId: question.id,
        sectionId: question.sectionId,
        chapterNumber: question.chapterNumber,
        attempts: 0,
        correctCount: 0,
        wrongCount: 0,
        lastIsCorrect: null,
        lastAttemptedAt: null,
        bookmarked: nextBookmarked,
      };
  store.put(record);
  await tx.done;
  return nextBookmarked;
}

// ============================================================================
// Portable JSON Backup & Restore
// ============================================================================

export async function exportUserBackup(
  userId: string,
  userName: string
): Promise<UserBackupPayload> {
  const db = await getDb();
  const [sessions, questionStats, allWorkbooks, uploadedQuestions] = await Promise.all([
    getUserSessions(userId),
    getUserStats(userId),
    getAllWorkbooks(),
    db.getAllFromIndex('questions', 'by-origin', 'uploaded'),
  ]);

  const uploadedWorkbooks = allWorkbooks.filter((w) => w.origin !== 'seeded');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    userName,
    sessions,
    questionStats,
    uploadedWorkbooks,
    uploadedQuestions,
  };
}

export async function importUserBackup(
  targetUserId: string,
  payload: UserBackupPayload
): Promise<{ importedSessions: number; importedStats: number; importedQuestions: number }> {
  if (!payload || payload.version !== 1 || !Array.isArray(payload.sessions)) {
    throw new Error('Invalid backup JSON file.');
  }

  const db = await getDb();
  const tx = db.transaction(['sessions', 'questionStats', 'workbooks', 'questions'], 'readwrite');
  const sStore = tx.objectStore('sessions');
  const qsStore = tx.objectStore('questionStats');
  const wbStore = tx.objectStore('workbooks');
  const qStore = tx.objectStore('questions');

  let importedSessions = 0;
  for (const s of payload.sessions) {
    if (!s?.id || !Array.isArray(s.questionsSnapshot)) continue;
    sStore.put({
      ...s,
      userId: targetUserId,
      mode: s.mode === 'exam' ? 'exam' : 'practice',
      flaggedIds: s.flaggedIds ?? [],
    });
    importedSessions++;
  }

  let importedStats = 0;
  for (const st of payload.questionStats ?? []) {
    if (!st?.questionId) continue;
    qsStore.put({
      ...st,
      userId: targetUserId,
      key: makeStatKey(targetUserId, st.questionId),
    });
    importedStats++;
  }

  for (const wb of payload.uploadedWorkbooks ?? []) {
    if (!wb?.fileName) continue;
    wbStore.put({ ...wb, origin: 'uploaded' });
  }

  let importedQuestions = 0;
  for (const q of payload.uploadedQuestions ?? []) {
    if (!q?.id) continue;
    qStore.put({ ...q, origin: 'uploaded' });
    importedQuestions++;
  }

  await tx.done;
  await refreshSummaryMeta(db);
  return { importedSessions, importedStats, importedQuestions };
}
