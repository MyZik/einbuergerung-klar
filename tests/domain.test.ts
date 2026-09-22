import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import catalog from "../src/questions.json";
import { buildTest, scoreRun, shuffle, STATES } from "../src/domain";
import type { Question, Run } from "../src/domain";
const questions = catalog as Question[];
test("complete official catalog and valid four-answer questions", () => {
  assert.equal(questions.length, 460);
  assert.equal(new Set(questions.map((q) => q.id)).size, 460);
  assert.equal(questions.filter((q) => !q.state).length, 300);
  for (const state of STATES)
    assert.equal(questions.filter((q) => q.state === state).length, 10, state);
  for (const q of questions) {
    assert.ok(q.question.length > 10, q.id);
    assert.equal(q.answers.length, 4, q.id);
    assert.ok(
      q.answers.every((a) => a.trim().length > 0),
      q.id,
    );
    assert.ok(q.correct_answer >= 0 && q.correct_answer <= 3, q.id);
    if (q.image_url) assert.ok(existsSync(`public${q.image_url}`), q.id);
  }
});
test("each exam has 30 unique general questions and 3 matching state questions", () => {
  for (const state of STATES)
    for (let i = 0; i < 30; i++) {
      const selected = buildTest(questions, state, "exam");
      assert.equal(selected.length, 33);
      assert.equal(new Set(selected.map((q) => q.id)).size, 33);
      assert.equal(selected.filter((q) => !q.state).length, 30);
      assert.equal(selected.filter((q) => q.state === state).length, 3);
    }
});
test("30-question practice has only general questions", () => {
  const selected = buildTest(questions, "Hamburg", "practice");
  assert.equal(selected.length, 30);
  assert.ok(selected.every((q) => q.state === null));
});
test("inactive questions excluded and incomplete pools rejected", () => {
  const inactive = questions.map((q) => ({ ...q, active: q.number > 25 }));
  const exam = buildTest(inactive, "Hamburg", "exam");
  assert.ok(exam.every((q) => q.number > 25));
  assert.throws(() =>
    buildTest(
      questions.filter((q) => q.state === null),
      "Hamburg",
      "exam",
    ),
  );
  assert.throws(() => buildTest(questions.slice(0, 29), "Hamburg", "practice"));
});
test("unanswered questions are not scored and 17 correct is possible", () => {
  const qs = buildTest(questions, "Hamburg", "exam");
  const answers = Object.fromEntries(
    qs.slice(0, 17).map((q) => [q.id, q.correct_answer]),
  );
  const run: Run = {
    mode: "exam",
    questions: qs,
    answers,
    index: 0,
    startedAt: 0,
    deadline: 3600000,
    done: true,
  };
  assert.equal(scoreRun(run), 17);
  assert.equal(scoreRun({ ...run, answers: {} }), 0);
});
test("shuffle preserves source order and all elements", () => {
  const source = [1, 2, 3, 4, 5];
  const result = shuffle(source, () => 0);
  assert.deepEqual(source, [1, 2, 3, 4, 5]);
  assert.deepEqual([...result].sort(), source);
  assert.notDeepEqual(result, source);
});

test("critical corrected answers agree with the official BAMF key", () => {
  const correct = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    return q.answers[q.correct_answer];
  };
  assert.equal(correct("de-163"), "1938");
  assert.equal(correct("de-145"), "Judikative");
  assert.equal(correct("brandenburg-001"), "Bild 1");
  assert.equal(correct("hamburg-001"), "Bild 2");
  assert.equal(correct("hamburg-008"), "3");
});
