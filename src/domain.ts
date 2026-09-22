export interface Question {
  id: string;
  number: number;
  state: string | null;
  question: string;
  answers: string[];
  correct_answer: number;
  image_url: string | null;
  source_page: number | null;
  explanation: string;
  active: boolean;
}
export type Progress = Record<
  string,
  { correct: boolean; attempts: number; answeredAt: string }
>;
export type Mode = "learn" | "practice" | "exam";
export interface Run {
  mode: Mode;
  questions: Question[];
  answers: Record<string, number>;
  index: number;
  startedAt: number;
  deadline: number | null;
  done: boolean;
}
export interface TestResult {
  id: string;
  at: string;
  mode: Mode;
  score: number;
  total: number;
  state: string;
}
export const STATES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];
export const SOURCE =
  "https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile";
export function shuffle<T>(items: T[], rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function buildTest(
  questions: Question[],
  state: string,
  mode: "practice" | "exam",
): Question[] {
  const general = questions.filter((q) => q.active && !q.state);
  const regional = questions.filter((q) => q.active && q.state === state);
  if (general.length < 30 || (mode === "exam" && regional.length < 3))
    throw new Error(
      "Für diesen Test sind noch nicht genug aktive Fragen vorhanden.",
    );
  return shuffle([
    ...shuffle(general).slice(0, 30),
    ...(mode === "exam" ? shuffle(regional).slice(0, 3) : []),
  ]);
}
export function scoreRun(run: Run) {
  return run.questions.filter((q) => run.answers[q.id] === q.correct_answer)
    .length;
}
export function topic(q: Question) {
  return q.state
    ? "Dein Bundesland"
    : q.number <= 150
      ? "Politik & Demokratie"
      : q.number <= 225
        ? "Geschichte & Verantwortung"
        : "Mensch & Gesellschaft";
}
export function readStorage<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem("klar:" + key) || "null") ?? fallback
    );
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem("klar:" + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
