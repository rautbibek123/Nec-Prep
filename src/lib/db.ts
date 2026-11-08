import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ExamSession,
  LockedAnswerRecord,
  MCQQuestion,
  UploadedWorkbookMeta,
} from '@/types/mcq';

interface NecMcqDB extends DBSchema {
  questions: {
    key: string;
    value: MCQQuestion;
    indexes: {
      'by-chapter': number;
      'by-section': string;
      'by-source': string;
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
    };
  };
}

const DB_NAME = 'nec-asoe-mcq-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NecMcqDB>> | null = null;

function getDb(): Promise<IDBPDatabase<NecMcqDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser context.'));
  }
  if (!dbPromise) {
    dbPromise = openDB<NecMcqDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('questions')) {
          const qStore = db.createObjectStore('questions', { keyPath: 'id' });
          qStore.createIndex('by-chapter', 'chapterNumber');
          qStore.createIndex('by-section', 'sectionId');
          qStore.createIndex('by-source', 'sourceFile');
        }
        if (!db.objectStoreNames.contains('workbooks')) {
          db.createObjectStore('workbooks', { keyPath: 'fileName' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sStore.createIndex('by-created', 'createdAt');
          sStore.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveParsedWorkbook(
  meta: UploadedWorkbookMeta,
  questions: MCQQuestion[]
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  const qStore = tx.objectStore('questions');
  for (const q of questions) {
    await qStore.put(q);
  }
  await tx.objectStore('workbooks').put(meta);
  await tx.done;
}

export async function getAllQuestions(): Promise<MCQQuestion[]> {
  const db = await getDb();
  return db.getAll('questions');
}

export async function getAllWorkbooks(): Promise<UploadedWorkbookMeta[]> {
  const db = await getDb();
  const list = await db.getAll('workbooks');
  return list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function removeWorkbookByName(fileName: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  const qStore = tx.objectStore('questions');
  const idx = qStore.index('by-source');
  const keys = await idx.getAllKeys(fileName);
  for (const key of keys) {
    await qStore.delete(key);
  }
  await tx.objectStore('workbooks').delete(fileName);
  await tx.done;
}

export async function clearQuestionBank(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['questions', 'workbooks'], 'readwrite');
  await tx.objectStore('questions').clear();
  await tx.objectStore('workbooks').clear();
  await tx.done;
}

export async function createSession(session: ExamSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getSessionById(sessionId: string): Promise<ExamSession | undefined> {
  const db = await getDb();
  return db.get('sessions', sessionId);
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

/**
 * Atomically locks a single-choice answer for a question in an ExamSession.
 * STRICT IMMUTABILITY: If an answer already exists for `questionId`, it is NEVER overwritten.
 */
export async function lockSessionAnswer(
  sessionId: string,
  questionId: string,
  record: LockedAnswerRecord,
  elapsedSeconds: number
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  const existing = await store.get(sessionId);
  if (!existing) {
    await tx.done;
    return undefined;
  }

  // Enforce strict one-time selection lock
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

  await store.put(updated);
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
  await store.put(updated);
  await tx.done;
}

export async function completeSessionInDb(
  sessionId: string,
  elapsedSeconds: number
): Promise<ExamSession | undefined> {
  const db = await getDb();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  const existing = await store.get(sessionId);
  if (!existing) {
    await tx.done;
    return undefined;
  }
  if (existing.status === 'completed') {
    await tx.done;
    return existing;
  }
  const updated: ExamSession = {
    ...existing,
    status: 'completed',
    completedAt: new Date().toISOString(),
    elapsedSeconds: Math.max(existing.elapsedSeconds, elapsedSeconds),
  };
  await store.put(updated);
  await tx.done;
  return updated;
}

