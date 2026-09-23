import { useDialogFocus } from "./useDialogFocus";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Flag,
  GraduationCap,
  House,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
  RotateCcw,
  ExternalLink,
  Plus,
  Save,
  Mail,
  LoaderCircle,
} from "lucide-react";

import {
  buildTest,
  readStorage,
  writeStorage,
  scoreRun,
  topic,
  STATES,
  SOURCE,
} from "./domain";
import type { Question, Progress, Run, Mode, TestResult } from "./domain";
import { supabase } from "./supabase";
import { Admin } from "./Admin";

type View = "home" | "catalog" | "tests" | "saved" | "progress" | "admin";
const nav = [
  { id: "home", label: "Übersicht", icon: House },
  { id: "catalog", label: "Lernen", icon: BookOpen },
  { id: "tests", label: "Tests", icon: Target },
  { id: "saved", label: "Merkliste", icon: Bookmark },
  { id: "progress", label: "Fortschritt", icon: ChartNoAxesCombined },
] as const;
function useStored<T>(key: string, initial: T) {
  const [value, set] = useState<T>(() => readStorage(key, initial));
  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);
  return [value, set] as const;
}
function LearningIllustration() {
  return (
    <div className="learning-art" aria-hidden="true">
      <div className="art-orbit" />
      <span className="art-star">✳</span>
      <div className="art-back">
        <span>DEIN NÄCHSTES KAPITEL</span>
        <BookOpen size={72} strokeWidth={1} />
      </div>
      <div className="art-card">
        <span className="art-kicker">EINBÜRGERUNG · DEIN LERNWEG</span>
        <div className="art-rule" />
        <h3>
          Was uns
          <br />
          zusammenbringt.
        </h3>
        <div className="art-answer">
          <span>01</span> Demokratie verstehen.
        </div>
        <div className="art-answer">
          <span>02</span> Geschichte entdecken.
        </div>
        <div className="art-answer chosen">
          <span>03</span> Zusammenleben gestalten. <Check size={17} />
        </div>
        <span className="art-page">
          WISSEN ÖFFNET TÜREN. <ArrowRight size={18} />
        </span>
      </div>
      <div className="art-stamp">
        DEIN WEG.
        <br />
        <strong>DEIN TEMPO.</strong>
      </div>
    </div>
  );
}
export default function App() {
  const [view, setView] = useState<View>(() =>
    location.pathname.startsWith("/admin") ? "admin" : "home",
  );
  const [menu, setMenu] = useState(false);
  const [state, setState] = useStored("state", "Hamburg");
  const [progress, setProgress] = useStored<Progress>("progress", {});
  const [saved, setSaved] = useStored<string[]>("saved", []);
  const [history, setHistory] = useStored<TestResult[]>("history", []);
  const [run, setRun] = useStored<Run | null>("run", null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showReset, setShowReset] = useState(false);
  useDialogFocus(confirmExit || confirmFinish || showReset, () => {
    setConfirmExit(false);
    setConfirmFinish(false);
    setShowReset(false);
  });
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) {
        setQuestions((await import("./questions.json")).default as Question[]);
        setNotice(
          "Offline-Fragenkatalog · Änderungen werden momentan nicht synchronisiert.",
        );
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("active", true)
        .order("number");
      if (!mounted) return;
      if (error) {
        setQuestions((await import("./questions.json")).default as Question[]);
        setNotice(
          "Keine Verbindung zur Datenbank. Du lernst mit dem gespeicherten Fragenkatalog.",
        );
      } else {
        setQuestions(data ?? []);
      }
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!run || run.done || !run.deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run?.deadline, run?.done]);
  useEffect(() => {
    if (run && !run.done && run.deadline && now >= run.deadline) finish(run);
  }, [now, run]);
  useEffect(() => {
    if (!run || run.done) return;
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [run]);
  const pool = questions.filter((q) => !q.state || q.state === state);
  const learned = pool.filter((q) => progress[q.id]?.correct).length;
  const attempted = pool.filter((q) => progress[q.id]).length;
  const wrong = pool.filter((q) => progress[q.id] && !progress[q.id].correct);
  const savedPool = pool.filter((q) => saved.includes(q.id));
  const percentage = pool.length
    ? Math.round((learned / pool.length) * 100)
    : 0;
  const selected = run?.questions[run.index];
  const answered = selected && run ? run.answers[selected.id] : undefined;
  const isLearning = run?.mode === "learn";
  const shown = pool.filter(
    (q) =>
      (view !== "saved" || saved.includes(q.id)) &&
      (!query ||
        `${q.number} ${q.question} ${q.answers.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (filter === "all" ||
        (filter === "wrong" && progress[q.id] && !progress[q.id].correct) ||
        (filter === "new" && !progress[q.id]) ||
        (filter === "state" && q.state === state) ||
        filter === topic(q)),
  );
  function navigate(v: View) {
    setView(v);
    setMenu(false);
    setQuery("");
    setFilter("all");
    window.history.replaceState(null, "", v === "admin" ? "/admin" : "/");
    window.scrollTo(0, 0);
  }
  function toggleSaved(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function record(q: Question, a: number) {
    setProgress((p) => ({
      ...p,
      [q.id]: {
        correct: a === q.correct_answer,
        attempts: (p[q.id]?.attempts || 0) + 1,
        answeredAt: new Date().toISOString(),
      },
    }));
  }
  function start(mode: Mode, list?: Question[]) {
    try {
      const qs =
        mode === "learn" ? (list ?? pool) : buildTest(questions, state, mode);
      if (!qs.length) {
        setNotice("Hier gibt es noch keine Fragen.");
        return;
      }
      setRun({
        mode,
        questions: qs,
        answers: {},
        index: 0,
        startedAt: Date.now(),
        deadline: mode === "exam" ? Date.now() + 3600000 : null,
        done: false,
      });
      setNow(Date.now());
      window.scrollTo(0, 0);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function answer(a: number) {
    if (!run || !selected || run.done || (isLearning && answered !== undefined))
      return;
    if (run.deadline && Date.now() >= run.deadline) {
      finish(run);
      return;
    }
    setRun({ ...run, answers: { ...run.answers, [selected.id]: a } });
    if (isLearning) record(selected, a);
  }
  function finish(r: Run) {
    if (r.done) return;
    const finished = { ...r, done: true };
    setRun(finished);
    setConfirmFinish(false);
    if (r.mode !== "learn") {
      const next = { ...progress };
      for (const q of r.questions) {
        next[q.id] = {
          correct: r.answers[q.id] === q.correct_answer,
          attempts: (next[q.id]?.attempts || 0) + 1,
          answeredAt: new Date().toISOString(),
        };
      }
      setProgress(next);
      const result = {
        id: String(r.startedAt),
        at: new Date().toISOString(),
        mode: r.mode,
        score: scoreRun(r),
        total: r.questions.length,
        state,
      };
      setHistory((h) =>
        h.some((x) => x.id === result.id) ? h : [result, ...h].slice(0, 50),
      );
    }
    window.scrollTo(0, 0);
  }
  const home = (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-label">
            <span className="chapter-mark">01 /</span> BEREIT FÜR DEIN NÄCHSTES
            KAPITEL
          </span>
          <h1>
            Deutschland verstehen.
            <br />
            <em>Mit Sicherheit</em>
            <br />
            ankommen.
          </h1>
          <p>
            Dein Einbürgerungstest beginnt mit einer Frage.
            <br />
            Lerne, entdecke und übe – Schritt für Schritt.
          </p>
          <div className="hero-actions">
            <button
              className="button lime"
              onClick={() =>
                start(
                  "learn",
                  pool.filter((q) => !progress[q.id]?.correct),
                )
              }
              disabled={loading || learned === pool.length}
            >
              Jetzt lernen <ArrowRight size={18} />
            </button>
            <span className="hero-note">
              Kostenlos.
              <br />
              Ohne Anmeldung.
            </span>
          </div>
        </div>
        <LearningIllustration />
      </section>
      <div className="stats">
        <div className="stat">
          <span className="stat-icon">
            <BookOpen />
          </span>
          <div>
            <span>Fragen für dich</span>
            <strong>
              {pool.length}
              <small>Fragen</small>
            </strong>
            <p>300 allgemein + 10 für {state}</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon green">
            <CheckCheck />
          </span>
          <div>
            <span>Richtig beantwortet</span>
            <strong>
              {learned}
              <small>von {pool.length}</small>
            </strong>
            <p>Jeder Schritt zählt.</p>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon amber">
            <Trophy />
          </span>
          <div>
            <span>Deine Übungstests</span>
            <strong>
              {history.length}
              <small>abgeschlossen</small>
            </strong>
            <p>
              {history.length
                ? `Zuletzt ${history[0].score} von ${history[0].total} richtig`
                : "Dein erster Test wartet auf dich."}
            </p>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <h2>Dein Lernplan. Deine Wahl.</h2>
        <span>DREI WEGE ZU MEHR SICHERHEIT</span>
      </div>
      <div className="mode-grid">
        <button className="mode-card" onClick={() => navigate("catalog")}>
          <span className="tile-icon">
            <BookOpen />
          </span>
          <h3>Fragen lernen</h3>
          <p>
            Alle Fragen entdecken und direkt
            <br />
            aus deinen Antworten lernen.
          </p>
          <span className="card-bottom">
            {pool.length} Fragen <ArrowRight size={18} />
          </span>
        </button>
        <button className="mode-card" onClick={() => navigate("tests")}>
          <span className="tile-icon purple">
            <Target />
          </span>
          <h3>Prüfung simulieren</h3>
          <p>
            Teste dein Wissen unter
            <br />
            echten Prüfungsbedingungen.
          </p>
          <span className="card-bottom">
            33 Fragen · 60 Minuten <ArrowRight size={18} />
          </span>
        </button>
        <button
          className="mode-card"
          onClick={() => start("learn", wrong)}
          disabled={!wrong.length}
        >
          <span className="tile-icon peach">
            <RotateCcw />
          </span>
          <h3>Gezielt wiederholen</h3>
          <p>
            Gib den Fragen eine zweite Chance,
            <br />
            die noch nicht ganz sitzen.
          </p>
          <span className="card-bottom">
            {wrong.length} Fragen zum Wiederholen <ArrowRight size={18} />
          </span>
        </button>
      </div>
      <section className="bottom-grid">
        <div className="progress-card">
          <div className="section-heading">
            <h2>Dein Lernfortschritt</h2>
            <button
              className="text-button"
              onClick={() => navigate("progress")}
            >
              Details <ChevronRight size={16} />
            </button>
          </div>
          <div className="progress-overview">
            <div
              className="ring"
              style={{ "--p": `${percentage}%` } as CSSProperties}
            >
              <strong>
                {percentage}
                <small>%</small>
              </strong>
            </div>
            <div>
              <h3>
                {learned
                  ? "Du bist auf dem Weg!"
                  : "Ein guter Anfang beginnt hier."}
              </h3>
              <p>
                {learned} Fragen richtig beantwortet.
                <br />
                {pool.length - learned} warten noch auf dich.
              </p>
            </div>
          </div>
          <div className="legend">
            <span>
              <i /> Sicher beantwortet
            </span>
            <span>
              <i /> Noch zu lernen
            </span>
          </div>
        </div>
        <div className="state-card">
          <div>
            <span className="eyebrow">DEIN BUNDESLAND</span>
            <h2>
              <MapPin size={21} />
              {state}
            </h2>
            <p>
              Dein Zuhause. Deine Fragen.
              <br />
              Lerne die 10 landesbezogenen Aufgaben.
            </p>
            <button
              className="text-button"
              onClick={() =>
                start(
                  "learn",
                  pool.filter((q) => q.state === state),
                )
              }
            >
              Bundesland-Fragen üben <ArrowRight size={16} />
            </button>
          </div>
          <Flag className="state-art" size={90} strokeWidth={1} />
        </div>
      </section>
    </>
  );
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Zum Inhalt
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="brand-icon">
            <BookOpen strokeWidth={1.8} />
          </span>
          <span>
            Einbürgerung
            <strong>
              klar<span>.</span>
            </strong>
          </span>
        </a>
        <span className="nav-title">DEIN LERNBEREICH</span>
        <nav aria-label="Hauptnavigation">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (run && !run.done) {
                  setConfirmExit(true);
                  return;
                }
                setRun(null);
                navigate(n.id);
              }}
              className={view === n.id && !run ? "active" : ""}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "saved" && savedPool.length > 0 && (
                <span className="count">{savedPool.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip">
            <span>
              Ein kleiner Tipp <Sparkles size={16} />
            </span>
            <p>Lieber jeden Tag ein paar Fragen als alles auf einmal.</p>
          </div>
          <button
            className="admin-link"
            onClick={() => {
              if (run && !run.done) {
                setConfirmExit(true);
                return;
              }
              setRun(null);
              navigate("admin");
            }}
          >
            <Settings size={17} /> Fragen verwalten
          </button>
          <div className="sidebar-caption">
            Dein nächstes Kapitel beginnt hier.
          </div>
        </div>
      </aside>
      {menu && (
        <button
          aria-label="Menü schließen"
          className="overlay"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Menü öffnen"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span>Dein Lernbereich</span>
            <ChevronRight size={14} />
            <strong>
              {run
                ? "Lerneinheit"
                : nav.find((n) => n.id === view)?.label || "Verwaltung"}
            </strong>
          </div>
          <label className="state-select">
            <MapPin size={16} />
            <select
              aria-label="Bundesland"
              value={state}
              disabled={!!run && !run.done}
              onChange={(e) => {
                setState(e.target.value);
                setRun(null);
              }}
            >
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </header>
        <main id="main">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                aria-label="Hinweis schließen"
                className="icon-button"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="empty">
              <LoaderCircle className="spin" />
              <h2>Deine Fragen werden geladen …</h2>
            </div>
          ) : run ? (
            run.done ? (
              <>
                <div className="eyebrow">DEINE AUSWERTUNG</div>
                <section className="result-hero">
                  <Trophy size={42} />
                  <h1>
                    {run.mode === "exam"
                      ? scoreRun(run) >= 17
                        ? "Geschafft. Gut gemacht!"
                        : "Du bist auf dem richtigen Weg."
                      : "Wieder ein Stück weiter."}
                  </h1>
                  <p>
                    <strong>
                      {scoreRun(run)} von {run.questions.length}
                    </strong>{" "}
                    Fragen richtig beantwortet.
                  </p>
                  {run.mode === "exam" && (
                    <span className="soft-pill">
                      {scoreRun(run) >= 17
                        ? "Prüfungssimulation bestanden"
                        : "Noch nicht bestanden"}{" "}
                      · Bestehensgrenze: 17
                    </span>
                  )}
                  <div className="actions">
                    <button
                      className="button primary"
                      onClick={() => {
                        setRun(null);
                        navigate("home");
                      }}
                    >
                      Zur Übersicht
                    </button>
                    <button
                      className="button secondary"
                      onClick={() =>
                        start(
                          "learn",
                          run.questions.filter(
                            (q) => run.answers[q.id] !== q.correct_answer,
                          ),
                        )
                      }
                      disabled={scoreRun(run) === run.questions.length}
                    >
                      Fehler wiederholen
                    </button>
                  </div>
                </section>
                <h2>Deine Antworten im Überblick</h2>
                <div className="review-list">
                  {run.questions.map((q) => (
                    <details key={q.id}>
                      <summary>
                        <span
                          className={
                            run.answers[q.id] === q.correct_answer
                              ? "success-text"
                              : "error-text"
                          }
                        >
                          {run.answers[q.id] === q.correct_answer ? (
                            <Check size={20} />
                          ) : (
                            <X size={20} />
                          )}
                        </span>
                        <span>{q.question}</span>
                        <ChevronRight size={17} />
                      </summary>
                      <div className="review-body">
                        {q.image_url && (
                          <img
                            src={q.image_url}
                            alt={`Abbildung zu Frage ${q.number}`}
                          />
                        )}
                        <p>
                          Deine Antwort:{" "}
                          <strong>
                            {run.answers[q.id] === undefined
                              ? "Nicht beantwortet"
                              : q.answers[run.answers[q.id]]}
                          </strong>
                        </p>
                        <p className="success-text">
                          Richtige Antwort:{" "}
                          <strong>{q.answers[q.correct_answer]}</strong>
                        </p>
                        {q.explanation && <p>{q.explanation}</p>}
                      </div>
                    </details>
                  ))}
                </div>
              </>
            ) : (
              selected && (
                <div className="quiz">
                  <div className="quiz-top">
                    <button
                      className="text-button"
                      onClick={() => setConfirmExit(true)}
                    >
                      <ArrowLeft size={17} /> Beenden
                    </button>
                    <span className="soft-pill">
                      {run.mode === "exam" ? (
                        <>
                          <Clock size={16} />
                          {Math.floor(
                            Math.max(0, (run.deadline! - now) / 1000) / 60,
                          )}
                          :
                          {String(
                            Math.floor(
                              Math.max(0, (run.deadline! - now) / 1000) % 60,
                            ),
                          ).padStart(2, "0")}
                        </>
                      ) : isLearning ? (
                        "In deinem Tempo"
                      ) : (
                        "30-Fragen-Übung"
                      )}
                    </span>
                  </div>
                  <div className="section-heading">
                    <span>
                      Frage {run.index + 1} von {run.questions.length}
                    </span>
                    <span>{Object.keys(run.answers).length} beantwortet</span>
                  </div>
                  <div className="bar">
                    <i
                      style={{
                        width: `${(Object.keys(run.answers).length / run.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <section className="question-card">
                    <div className="section-heading">
                      <span className="eyebrow">
                        {topic(selected)} · NR. {selected.number}
                      </span>
                      <button
                        className={`icon-button ${saved.includes(selected.id) ? "bookmarked" : ""}`}
                        aria-label={
                          saved.includes(selected.id)
                            ? "Aus Merkliste entfernen"
                            : "Frage merken"
                        }
                        onClick={() => toggleSaved(selected.id)}
                      >
                        <Bookmark
                          fill={
                            saved.includes(selected.id)
                              ? "currentColor"
                              : "none"
                          }
                          size={20}
                        />
                      </button>
                    </div>
                    <h1>{selected.question}</h1>
                    {selected.image_url && (
                      <img
                        className="question-image"
                        src={selected.image_url}
                        alt={`Abbildung der amtlichen Aufgabe ${selected.number}; die Bildnummern entsprechen den Antworten.`}
                      />
                    )}
                    <p className="question-hint">Eine Antwort ist richtig.</p>
                    <div className="answers">
                      {selected.answers.map((a, i) => (
                        <button
                          key={i}
                          aria-pressed={answered === i}
                          disabled={isLearning && answered !== undefined}
                          className={`answer ${answered === i ? "selected" : ""} ${isLearning && answered !== undefined ? (i === selected.correct_answer ? "correct" : i === answered ? "incorrect" : "") : ""}`}
                          onClick={() => answer(i)}
                        >
                          <span className="answer-letter">{"ABCD"[i]}</span>
                          <span>{a}</span>
                          {isLearning &&
                          answered !== undefined &&
                          i === selected.correct_answer ? (
                            <Check size={21} />
                          ) : answered === i ? (
                            <span className="selected-dot" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                    {isLearning && answered !== undefined && (
                      <div
                        className={`feedback ${answered === selected.correct_answer ? "good" : "bad"}`}
                        role="status"
                      >
                        <strong>
                          {answered === selected.correct_answer
                            ? "Richtig. Das sitzt!"
                            : "Noch nicht ganz – daraus lernst du."}
                        </strong>
                        <p>
                          {selected.explanation ||
                            `Die richtige Antwort ist: ${selected.answers[selected.correct_answer]}`}
                        </p>
                      </div>
                    )}
                    <div className="quiz-actions">
                      <button
                        className="button secondary"
                        disabled={run.index === 0}
                        onClick={() => setRun({ ...run, index: run.index - 1 })}
                      >
                        <ArrowLeft size={16} /> Zurück
                      </button>
                      {run.index < run.questions.length - 1 ? (
                        <button
                          className="button primary"
                          onClick={() =>
                            setRun({ ...run, index: run.index + 1 })
                          }
                        >
                          Nächste Frage <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="button primary"
                          onClick={() => setConfirmFinish(true)}
                        >
                          Auswerten <Check size={16} />
                        </button>
                      )}
                    </div>
                  </section>
                  {!isLearning && (
                    <>
                      <div
                        className="question-numbers"
                        aria-label="Fragenübersicht"
                      >
                        {run.questions.map((q, i) => (
                          <button
                            aria-label={`Zu Frage ${i + 1}`}
                            aria-current={run.index === i ? "step" : undefined}
                            className={`${run.answers[q.id] !== undefined ? "answered" : ""} ${run.index === i ? "current" : ""}`}
                            onClick={() => setRun({ ...run, index: i })}
                            key={q.id}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        className="text-button finish-link"
                        onClick={() => setConfirmFinish(true)}
                      >
                        Test jetzt auswerten
                      </button>
                    </>
                  )}
                </div>
              )
            )
          ) : view === "home" ? (
            home
          ) : view === "admin" ? (
            <Admin
              onChange={() => {
                void supabase
                  ?.from("questions")
                  .select("*")
                  .eq("active", true)
                  .order("number")
                  .then(({ data }) => {
                    if (data) setQuestions(data);
                  });
              }}
            />
          ) : view === "catalog" || view === "saved" ? (
            <>
              <div className="eyebrow">
                {view === "saved" ? "FÜR SPÄTER GEMERKT" : "DEIN FRAGENKATALOG"}
              </div>
              <div className="page-heading">
                <div>
                  <h1>
                    {view === "saved"
                      ? "Deine Merkliste."
                      : "Wissen, das bleibt."}
                  </h1>
                  <p>
                    {view === "saved"
                      ? "Hier findest du die Fragen, die du noch einmal anschauen möchtest."
                      : `${pool.length} Fragen. Ein Ziel. Lerne so, wie es zu dir passt.`}
                  </p>
                </div>
                <button
                  className="button primary"
                  disabled={!shown.length}
                  onClick={() => start("learn", shown)}
                >
                  Auswahl lernen <Play size={16} />
                </button>
              </div>
              <div className="filters">
                <label className="search">
                  <Search size={18} />
                  <input
                    placeholder="Frage oder Nummer suchen …"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Fragen filtern"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Alle Fragen</option>
                  <option value="new">Noch nicht beantwortet</option>
                  <option value="wrong">Falsch beantwortet</option>
                  <option value="state">Nur {state}</option>
                  <option>Politik &amp; Demokratie</option>
                  <option>Geschichte &amp; Verantwortung</option>
                  <option>Mensch &amp; Gesellschaft</option>
                </select>
              </div>
              <p className="muted">{shown.length} Fragen in deiner Auswahl</p>
              <div className="catalog">
                {shown.map((q) => (
                  <div className="catalog-row" key={q.id}>
                    <span
                      className={`question-number ${progress[q.id]?.correct ? "learned" : ""}`}
                    >
                      {progress[q.id]?.correct ? <Check size={19} /> : q.number}
                    </span>
                    <button
                      className="catalog-question"
                      onClick={() =>
                        start("learn", [
                          q,
                          ...shown.filter((x) => x.id !== q.id),
                        ])
                      }
                    >
                      <span>{topic(q)}</span>
                      <strong>{q.question}</strong>
                    </button>
                    <button
                      className={`icon-button ${saved.includes(q.id) ? "bookmarked" : ""}`}
                      aria-label={
                        saved.includes(q.id)
                          ? `Frage ${q.number} nicht mehr merken`
                          : `Frage ${q.number} merken`
                      }
                      onClick={() => toggleSaved(q.id)}
                    >
                      <Bookmark
                        size={19}
                        fill={saved.includes(q.id) ? "currentColor" : "none"}
                      />
                    </button>
                    <ChevronRight size={17} />
                  </div>
                ))}
              </div>
              {!shown.length && (
                <div className="empty">
                  <Bookmark size={36} />
                  <h2>
                    {view === "saved"
                      ? "Platz für deine Aha-Momente."
                      : "Keine passenden Fragen."}
                  </h2>
                  <p>
                    {view === "saved"
                      ? "Tippe bei einer Frage auf das Lesezeichen, um sie hier zu speichern."
                      : "Versuche einen anderen Suchbegriff oder Filter."}
                  </p>
                </div>
              )}
            </>
          ) : view === "tests" ? (
            <>
              <div className="eyebrow">BEREIT FÜR DEN ERNSTFALL?</div>
              <div className="page-heading">
                <div>
                  <h1>Zeig dir, was du kannst.</h1>
                  <p>Übe entspannt oder probiere die echte Prüfung aus.</p>
                </div>
              </div>
              <div className="test-options">
                <section className="test-option">
                  <span className="tile-icon">
                    <BookOpen />
                  </span>
                  <h2>Die kleine Generalprobe</h2>
                  <p>
                    30 zufällige allgemeine Fragen.
                    <br />
                    Ganz ohne Zeitdruck.
                  </p>
                  <ul>
                    <li>
                      <Check size={17} />
                      30 allgemeine Fragen
                    </li>
                    <li>
                      <Check size={17} />
                      Antworten frei ändern
                    </li>
                    <li>
                      <Check size={17} />
                      Auswertung zum Schluss
                    </li>
                  </ul>
                  <button
                    className="button secondary"
                    onClick={() => start("practice")}
                  >
                    Übungstest starten <ArrowRight size={17} />
                  </button>
                </section>
                <section className="test-option featured">
                  <span className="soft-pill">WIE IN DER ECHTEN PRÜFUNG</span>
                  <span className="tile-icon">
                    <GraduationCap />
                  </span>
                  <h2>Deine Prüfungssimulation</h2>
                  <p>
                    Alles wie am Prüfungstag.
                    <br />
                    Damit du mit einem guten Gefühl reingehst.
                  </p>
                  <ul>
                    <li>
                      <Check size={17} />
                      30 allgemeine + 3 Fragen zu {state}
                    </li>
                    <li>
                      <Check size={17} />
                      60 Minuten Zeit
                    </li>
                    <li>
                      <Check size={17} />
                      Bestanden ab 17 richtigen Antworten
                    </li>
                  </ul>
                  <button
                    className="button primary"
                    onClick={() => start("exam")}
                  >
                    Prüfung starten <ArrowRight size={17} />
                  </button>
                </section>
              </div>
              <div className="info-card">
                <ShieldCheck />
                <div>
                  <h3>Üben darf sich leicht anfühlen.</h3>
                  <p>
                    Du kannst Fragen überspringen und später zurückkommen. Die
                    richtigen Antworten siehst du erst nach der Abgabe. Beim
                    Neuladen bleibt dein Test erhalten; die Prüfungszeit läuft
                    weiter.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow">DAS HAST DU SCHON GESCHAFFT</div>
              <div className="page-heading">
                <div>
                  <h1>Jede Frage bringt dich weiter.</h1>
                  <p>Dein Fortschritt wird auf diesem Gerät gespeichert.</p>
                </div>
              </div>
              <section className="progress-card">
                <div className="progress-overview">
                  <div
                    className="ring"
                    style={{ "--p": `${percentage}%` } as CSSProperties}
                  >
                    <strong>
                      {percentage}
                      <small>%</small>
                    </strong>
                  </div>
                  <div>
                    <h2>{learned} Fragen richtig beantwortet</h2>
                    <p>
                      {attempted} ausprobiert · {wrong.length} zum Wiederholen ·{" "}
                      {pool.length - attempted} unentdeckt
                    </p>
                  </div>
                </div>
                {[
                  "Politik & Demokratie",
                  "Geschichte & Verantwortung",
                  "Mensch & Gesellschaft",
                  "Dein Bundesland",
                ].map((t) => {
                  const group = pool.filter((q) => topic(q) === t);
                  const n = group.filter((q) => progress[q.id]?.correct).length;
                  return (
                    <div className="topic-progress" key={t}>
                      <div>
                        <strong>{t}</strong>
                        <span>
                          {n} / {group.length}
                        </span>
                      </div>
                      <div className="bar">
                        <i
                          style={{
                            width: `${group.length ? (n / group.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
              <h2 className="history-heading">Deine letzten Tests</h2>
              {!history.length ? (
                <div className="empty">
                  <Target />
                  <p>Dein erster Übungstest wartet auf dich.</p>
                  <button
                    className="button primary"
                    onClick={() => navigate("tests")}
                  >
                    Test auswählen
                  </button>
                </div>
              ) : (
                <div className="catalog">
                  {history.map((h) => (
                    <div className="history-row" key={h.id}>
                      <Trophy />
                      <div>
                        <strong>
                          {h.mode === "exam"
                            ? "Prüfungssimulation"
                            : "Übungstest"}
                        </strong>
                        <span>
                          {new Date(h.at).toLocaleDateString("de-DE")} ·{" "}
                          {h.state}
                        </span>
                      </div>
                      <strong>
                        {h.score} / {h.total}
                      </strong>
                      <span className="soft-pill">
                        {h.mode === "exam"
                          ? h.score >= 17
                            ? "Bestanden"
                            : "Weiter üben"
                          : `${Math.round((h.score / h.total) * 100)} %`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="text-button reset-link"
                onClick={() => setShowReset(true)}
              >
                Lokalen Lernfortschritt zurücksetzen
              </button>
            </>
          )}
          <footer>
            <span>
              <span className="tiny-check">✓</span> Mit Klarheit zum nächsten
              Kapitel.
            </span>
            <a href={SOURCE} target="_blank" rel="noreferrer">
              BAMF-Katalog · Stand 07.05.2025 <ExternalLink size={12} />
            </a>
            <span>Unabhängiges Lernangebot</span>
          </footer>
        </main>
      </div>
      {confirmExit && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
          >
            <h2 id="exit-title">Lerneinheit beenden?</h2>
            <p>
              Bereits geübte Fragen bleiben in deinem Lernfortschritt. Ein noch
              nicht abgegebener Test wird verworfen.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setConfirmExit(false)}
              >
                Weiterlernen
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setRun(null);
                  setConfirmExit(false);
                  navigate("home");
                }}
              >
                Beenden
              </button>
            </div>
          </section>
        </div>
      )}
      {confirmFinish && run && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-title"
          >
            <h2 id="finish-title">Bereit für deine Auswertung?</h2>
            <p>
              {run.questions.length - Object.keys(run.answers).length} Fragen
              sind noch unbeantwortet. Diese werden als falsch gewertet.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setConfirmFinish(false)}
              >
                Zurück zum Test
              </button>
              <button className="button primary" onClick={() => finish(run)}>
                Jetzt auswerten
              </button>
            </div>
          </section>
        </div>
      )}
      {showReset && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title">Neu anfangen?</h2>
            <p>
              Dein Fortschritt und deine Testergebnisse auf diesem Gerät werden
              gelöscht. Deine Merkliste bleibt erhalten.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setShowReset(false)}
              >
                Abbrechen
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setProgress({});
                  setHistory([]);
                  setShowReset(false);
                }}
              >
                Fortschritt zurücksetzen
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
