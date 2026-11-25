import fs from 'node:fs';
import path from 'node:path';

const SEED_DIR = path.join(process.cwd(), 'public', 'seed');

function assert(cond, msg) {
  if (!cond) {
    throw new Error(`Seed verification failed: ${msg}`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'manifest.json'), 'utf8'));
  const questions = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'questions.json'), 'utf8'));
  const allSets = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'test-sets.json'), 'utf8'));

  assert(questions.length === 3180, `Expected 3180 questions, got ${questions.length}`);
  assert(manifest.totalQuestions === 3180, `Manifest totalQuestions mismatch: ${manifest.totalQuestions}`);
  assert(allSets.length === 50, `Expected 50 total sets (30 mock + 20 practice), got ${allSets.length}`);
  assert(manifest.totalSets === 50, `Manifest totalSets mismatch: ${manifest.totalSets}`);

  const qById = new Map();
  const chapters = new Set();
  const sections = new Set();
  let contextCount = 0;

  for (const q of questions) {
    assert(!qById.has(q.id), `Duplicate question ID ${q.id}`);
    assert(q.question && q.question.length > 0, `Empty question stem on ${q.id}`);
    for (const k of ['A', 'B', 'C', 'D']) {
      assert(q.options?.[k] && q.options[k].length > 0, `Empty option ${k} on ${q.id}`);
    }
    assert(['A', 'B', 'C', 'D'].includes(q.correctOption), `Invalid correctOption on ${q.id}`);
    assert(q.reason && q.reason.length > 0, `Empty reason on ${q.id}`);
    if (q.contextNote) contextCount++;
    qById.set(q.id, q);
    chapters.add(q.chapterNumber);
    sections.add(q.sectionId);
  }

  assert(chapters.size === 10, `Expected 10 chapters, got ${chapters.size}`);
  assert(sections.size === 60, `Expected 60 sections, got ${sections.size}`);
  assert(contextCount >= 20, `Expected >=20 contextNote enrichments, got ${contextCount}`);

  const mockSets = allSets.filter((s) => s.tier === 'core' || s.tier === 'extended');
  const practiceSets = allSets.filter((s) => s.tier === 'practice');
  assert(mockSets.length === 30, `Expected 30 mock sets, got ${mockSets.length}`);
  assert(practiceSets.length === 20, `Expected 20 practice sets, got ${practiceSets.length}`);

  // Verify 30 Mock Sets
  const coreSeenGlobal = new Set();
  const ch2To10SeenGlobal = new Set();

  for (const set of mockSets) {
    assert(set.questionCount === 100, `${set.id} has ${set.questionCount} questions instead of 100`);
    assert(set.questionIds.length === 100, `${set.id} questionIds length != 100`);
    assert(set.timeLimitMinutes === 120, `${set.id} timeLimitMinutes != 120`);

    const localSet = new Set();
    const chCounts = new Map();
    const secCounts = new Map();

    for (const qId of set.questionIds) {
      assert(!localSet.has(qId), `${set.id} contains duplicate question ${qId}`);
      localSet.add(qId);

      const q = qById.get(qId);
      assert(Boolean(q), `${set.id} references unknown question ID ${qId}`);

      chCounts.set(q.chapterNumber, (chCounts.get(q.chapterNumber) ?? 0) + 1);
      secCounts.set(q.sectionId, (secCounts.get(q.sectionId) ?? 0) + 1);

      if (set.setNumber <= 18) {
        assert(!coreSeenGlobal.has(qId), `Core Set ${set.setNumber} repeats ${qId} from an earlier Core Set`);
        coreSeenGlobal.add(qId);
      }

      if (q.chapterNumber >= 2) {
        assert(
          !ch2To10SeenGlobal.has(qId),
          `Set ${set.setNumber} repeats Ch ${q.chapterNumber} question ${qId} across Sets 1–30`
        );
        ch2To10SeenGlobal.add(qId);
      }
    }

    for (let ch = 1; ch <= 10; ch++) {
      assert(chCounts.get(ch) === 10, `${set.id} Ch ${ch} has ${chCounts.get(ch)} questions (expected 10)`);
      for (let s = 1; s <= 6; s++) {
        const secId = `${ch}.${s}`;
        const cnt = secCounts.get(secId) ?? 0;
        assert(cnt === 1 || cnt === 2, `${set.id} Sec ${secId} has ${cnt} questions (expected 1 or 2)`);
      }
    }
  }

  assert(coreSeenGlobal.size === 1800, `Expected 1800 unique Core Set questions, got ${coreSeenGlobal.size}`);
  assert(ch2To10SeenGlobal.size === 2700, `Expected 2700 unique Ch 2–10 questions across all 30 mock sets, got ${ch2To10SeenGlobal.size}`);

  // Verify 20 Practice Sets
  const practiceSeenGlobal = new Set();
  for (const set of practiceSets) {
    assert(set.questionCount === 50, `${set.id} has ${set.questionCount} questions instead of 50`);
    assert(set.questionIds.length === 50, `${set.id} questionIds length != 50`);
    assert(set.timeLimitMinutes === null, `${set.id} timeLimitMinutes should be null`);

    const localSet = new Set();
    const chCounts = new Map();
    const secCounts = new Map();

    for (const qId of set.questionIds) {
      assert(!localSet.has(qId), `${set.id} contains duplicate question ${qId}`);
      assert(!practiceSeenGlobal.has(qId), `${set.id} repeats ${qId} from another Practice Set`);
      localSet.add(qId);
      practiceSeenGlobal.add(qId);

      const q = qById.get(qId);
      assert(Boolean(q), `${set.id} references unknown question ID ${qId}`);

      chCounts.set(q.chapterNumber, (chCounts.get(q.chapterNumber) ?? 0) + 1);
      secCounts.set(q.sectionId, (secCounts.get(q.sectionId) ?? 0) + 1);
    }

    for (let ch = 1; ch <= 10; ch++) {
      assert(chCounts.get(ch) === 5, `${set.id} Ch ${ch} has ${chCounts.get(ch)} questions (expected 5)`);
      for (let s = 1; s <= 6; s++) {
        const secId = `${ch}.${s}`;
        const cnt = secCounts.get(secId) ?? 0;
        assert(cnt === 0 || cnt === 1, `${set.id} Sec ${secId} has ${cnt} questions (expected 0 or 1)`);
      }
    }
  }

  assert(
    practiceSeenGlobal.size === 1000,
    `Expected 1000 unique Practice Set questions, got ${practiceSeenGlobal.size}`
  );

  console.log(
    `[verify-seed] PASS: ${questions.length} MCQs, 30 Mock Sets (1800 unique in Core 1-18, 2700 unique Ch2-10), 20 Practice Sets (1000 unique MCQs, 5/Ch, 0 repeats).`
  );
}

main();
