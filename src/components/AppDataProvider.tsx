'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getQuestionBankSummary,
  getSeedMeta,
  getStoredTestSets,
  seedDatabaseBulk,
} from '@/lib/db';
import type {
  MCQQuestion,
  QuestionBankSummary,
  SeedManifest,
  TestSetDefinition,
} from '@/types/mcq';

interface AppDataContextValue {
  ready: boolean;
  seeding: boolean;
  seedError: string | null;
  summary: QuestionBankSummary;
  testSets: TestSetDefinition[];
  refreshSummary: () => Promise<void>;
  reseedDatabase: () => Promise<void>;
}

const EMPTY_SUMMARY: QuestionBankSummary = {
  totalQuestions: 0,
  seededQuestions: 0,
  uploadedQuestions: 0,
  chapterCounts: {},
  sectionCounts: {},
  populatedSectionsCount: 0,
  workbooks: [],
  seedVersion: null,
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [summary, setSummary] = useState<QuestionBankSummary>(EMPTY_SUMMARY);
  const [testSets, setTestSets] = useState<TestSetDefinition[]>([]);

  const performSeed = useCallback(async (manifest: SeedManifest) => {
    const [qRes, sRes] = await Promise.all([
      fetch('/seed/questions.json', { cache: 'force-cache' }),
      fetch('/seed/test-sets.json', { cache: 'force-cache' }),
    ]);
    if (!qRes.ok || !sRes.ok) {
      throw new Error('Failed to fetch pre-compiled question seed.');
    }
    const [questions, sets] = (await Promise.all([qRes.json(), sRes.json()])) as [
      MCQQuestion[],
      TestSetDefinition[],
    ];
    const nextSummary = await seedDatabaseBulk(manifest, questions, sets);
    setSummary(nextSummary);
    setTestSets(sets);
  }, []);

  const initialize = useCallback(async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      const [localMeta, manifestRes] = await Promise.all([
        getSeedMeta(),
        fetch('/seed/manifest.json', { cache: 'no-cache' }),
      ]);

      if (!manifestRes.ok) {
        // Fallback: load whatever is already in IndexedDB
        const [curSummary, curSets] = await Promise.all([
          getQuestionBankSummary(),
          getStoredTestSets(),
        ]);
        setSummary(curSummary);
        setTestSets(curSets);
        return;
      }

      const manifest = (await manifestRes.json()) as SeedManifest;
      const currentSummary = await getQuestionBankSummary();

      const needsSeed =
        !localMeta ||
        localMeta.version !== manifest.version ||
        localMeta.totalSets !== manifest.totalSets ||
        currentSummary.seededQuestions < manifest.totalQuestions;

      if (needsSeed) {
        await performSeed(manifest);
      } else {
        const storedSets = await getStoredTestSets();
        if (storedSets.length === 0) {
          const sRes = await fetch('/seed/test-sets.json');
          const sets = (await sRes.json()) as TestSetDefinition[];
          setTestSets(sets);
        } else {
          setTestSets(storedSets);
        }
        setSummary(currentSummary);
      }
    } catch (err) {
      setSeedError(
        err instanceof Error ? err.message : 'Unable to initialize local question bank.'
      );
      try {
        const [curSummary, curSets] = await Promise.all([
          getQuestionBankSummary(),
          getStoredTestSets(),
        ]);
        setSummary(curSummary);
        setTestSets(curSets);
      } catch {
        // Ignore fallback failure
      }
    } finally {
      setSeeding(false);
      setReady(true);
    }
  }, [performSeed]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const refreshSummary = useCallback(async () => {
    const next = await getQuestionBankSummary();
    setSummary(next);
  }, []);

  const reseedDatabase = useCallback(async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      const manifestRes = await fetch('/seed/manifest.json', { cache: 'no-cache' });
      if (!manifestRes.ok) throw new Error('Seed manifest unavailable.');
      const manifest = (await manifestRes.json()) as SeedManifest;
      await performSeed(manifest);
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Failed to reseed database.');
    } finally {
      setSeeding(false);
    }
  }, [performSeed]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ready,
      seeding,
      seedError,
      summary,
      testSets,
      refreshSummary,
      reseedDatabase,
    }),
    [ready, seeding, seedError, summary, testSets, refreshSummary, reseedDatabase]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside <AppDataProvider>.');
  }
  return ctx;
}
