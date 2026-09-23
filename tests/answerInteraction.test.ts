import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptsAnswerClick } from "../src/answerInteraction";

test("retry transition does not turn a trailing pointer click into an answer", () => {
  assert.equal(acceptsAnswerClick(1, 1100, 1400), false);
  assert.equal(acceptsAnswerClick(2, 1450, 1400), false);
  assert.equal(acceptsAnswerClick(1, 1400, 1400), true);
});

test("keyboard and assistive activation remain available during transition", () => {
  assert.equal(acceptsAnswerClick(0, 1100, 1400), true);
  assert.equal(acceptsAnswerClick(1, 100, 0), true);
});
