import { useDialogFocus } from "./useDialogFocus";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  LoaderCircle,
  LogOut,
  Mail,
  Plus,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "./supabase";
import { STATES } from "./domain";
import type { Question } from "./domain";
export function Admin({ onChange }: { onChange: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Question[]>([]);
  const [edit, setEdit] = useState<Question | null>(null);
  const [search, setSearch] = useState("");
  const [isNew, setIsNew] = useState(false);
  useDialogFocus(!!edit, () => setEdit(null));
  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setAdmin(false);
        setChecking(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let live = true;
    if (!session || !supabase) return;
    setChecking(true);
    void supabase.rpc("is_admin").then(({ data, error }) => {
      if (!live) return;
      setAdmin(data === true && !error);
      setChecking(false);
      if (error)
        setMessage(
          "Deine Berechtigung konnte nicht geprüft werden. Bitte erneut anmelden.",
        );
      if (data === true) void load();
    });
    return () => {
      live = false;
    };
  }, [session]);
  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("number");
    if (error) setMessage(error.message);
    else setRows(data ?? []);
  }
  async function login(e: React.SubmitEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setMessage(
        error
          ? `Der Anmeldelink konnte nicht gesendet werden: ${error.message}`
          : "Der Anmeldelink ist unterwegs. Prüfe dein Postfach und gegebenenfalls den Spam-Ordner.",
      );
    } catch {
      setMessage("Keine Verbindung. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.SubmitEvent) {
    e.preventDefault();
    if (!edit || !supabase) return;
    if (edit.answers.some((a) => !a.trim())) {
      setMessage("Bitte alle vier Antworten ausfüllen.");
      return;
    }
    if (
      edit.image_url &&
      !/^https:\/\//.test(edit.image_url) &&
      !/^\/questions\/[a-z0-9.-]+$/.test(edit.image_url)
    ) {
      setMessage(
        "Nutze eine HTTPS-Bildadresse oder einen Pfad unter /questions/.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const row = {
        ...edit,
        question: edit.question.trim(),
        answers: edit.answers.map((a) => a.trim()),
        updated_at: new Date().toISOString(),
      };
      const result = isNew
        ? await supabase.from("questions").insert(row).select("id")
        : await supabase
            .from("questions")
            .update(row)
            .eq("id", edit.id)
            .select("id");
      if (result.error) throw result.error;
      if (!result.data?.length)
        throw new Error(
          "Keine Änderung gespeichert. Bitte prüfe deine Berechtigung.",
        );
      setEdit(null);
      setMessage("Frage gespeichert.");
      await load();
      onChange();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function add() {
    setIsNew(true);
    setEdit({
      id: crypto.randomUUID(),
      number: Math.max(310, ...rows.map((q) => q.number)) + 1,
      state: null,
      question: "",
      answers: ["", "", "", ""],
      correct_answer: 0,
      image_url: null,
      source_page: null,
      explanation: "",
      active: false,
    });
  }
  return (
    <>
      <div className="eyebrow">FRAGENVERWALTUNG</div>
      <div className="page-heading">
        <div>
          <h1>Wissen auf dem neuesten Stand.</h1>
          <p>Fragen, Antworten und Bilder an einem Ort pflegen.</p>
        </div>
        {session && (
          <button
            className="button secondary"
            onClick={() => void supabase?.auth.signOut()}
          >
            <LogOut size={16} /> Abmelden
          </button>
        )}
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
          <button
            className="icon-button"
            aria-label="Hinweis schließen"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {checking ? (
        <div className="empty">
          <LoaderCircle className="spin" />
          <p>Zugriff wird geprüft …</p>
        </div>
      ) : !session ? (
        <section className="login-card">
          <span className="tile-icon">
            <ShieldCheck />
          </span>
          <h2>Dein geschützter Bereich.</h2>
          <p>
            Melde dich mit deiner freigeschalteten E-Mail-Adresse an. Du
            erhältst einen sicheren Anmeldelink.
          </p>
          <form onSubmit={login}>
            <label>
              E-Mail-Adresse
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
              />
            </label>
            <button className="button primary" disabled={busy || !supabase}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Mail size={17} />
              )}{" "}
              Anmeldelink senden
            </button>
          </form>
          <small>Zum Lernen brauchst du keinen Account.</small>
        </section>
      ) : !admin ? (
        <div className="empty">
          <ShieldCheck size={40} />
          <h2>Keine Verwaltungsberechtigung</h2>
          <p>
            Dieser Account darf keine Fragen verändern. Bitte melde dich mit
            deiner freigeschalteten Adresse an.
          </p>
        </div>
      ) : (
        <>
          <div className="filters">
            <label className="search">
              <Search size={18} />
              <input
                placeholder="Frage, Nummer oder Bundesland suchen …"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button className="button primary" onClick={add}>
              <Plus size={17} /> Neue Frage
            </button>
          </div>
          <p className="muted">
            {rows.length} Fragen · {rows.filter((q) => q.active).length} aktiv
          </p>
          <div className="catalog">
            {rows
              .filter((q) =>
                `${q.number} ${q.state || ""} ${q.question}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((q) => (
                <div className="catalog-row" key={q.id}>
                  <span className="question-number">{q.number}</span>
                  <button
                    className="catalog-question"
                    onClick={() => {
                      setEdit({ ...q, answers: [...q.answers] });
                      setIsNew(false);
                    }}
                  >
                    <span>
                      {q.state || "Allgemein"} ·{" "}
                      {q.active ? "Aktiv" : "Entwurf / deaktiviert"}
                    </span>
                    <strong>{q.question}</strong>
                  </button>
                  <ArrowRight size={17} />
                </div>
              ))}
          </div>
        </>
      )}
      {edit && (
        <div className="modal-backdrop">
          <section
            className="modal editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="section-heading">
              <h2 id="editor-title">
                {isNew ? "Neue Frage" : "Frage bearbeiten"}
              </h2>
              <button
                className="icon-button"
                aria-label="Editor schließen"
                onClick={() => setEdit(null)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                <label>
                  Nummer
                  <input
                    type="number"
                    min="1"
                    required
                    value={edit.number}
                    onChange={(e) =>
                      setEdit({ ...edit, number: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Bundesland
                  <select
                    value={edit.state ?? ""}
                    onChange={(e) =>
                      setEdit({ ...edit, state: e.target.value || null })
                    }
                  >
                    <option value="">Allgemein (alle Bundesländer)</option>
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Frage
                <textarea
                  required
                  value={edit.question}
                  onChange={(e) =>
                    setEdit({ ...edit, question: e.target.value })
                  }
                />
              </label>
              <fieldset>
                <legend>Antworten · die richtige Antwort markieren</legend>
                {edit.answers.map((a, i) => (
                  <div className="edit-answer" key={i}>
                    <input
                      type="radio"
                      name="correct"
                      aria-label={`Antwort ${"ABCD"[i]} ist richtig`}
                      checked={edit.correct_answer === i}
                      onChange={() => setEdit({ ...edit, correct_answer: i })}
                    />
                    <input
                      aria-label={`Antwort ${"ABCD"[i]}`}
                      required
                      value={a}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          answers: edit.answers.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </fieldset>
              <label>
                Bildadresse (optional)
                <input
                  value={edit.image_url ?? ""}
                  placeholder="https://… oder /questions/…"
                  onChange={(e) =>
                    setEdit({ ...edit, image_url: e.target.value || null })
                  }
                />
              </label>
              <label>
                Erklärung (optional)
                <textarea
                  value={edit.explanation}
                  onChange={(e) =>
                    setEdit({ ...edit, explanation: e.target.value })
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) =>
                    setEdit({ ...edit, active: e.target.checked })
                  }
                />{" "}
                Im Lernkatalog veröffentlichen
              </label>
              {message && <p role="status">{message}</p>}
              <div className="actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEdit(null)}
                >
                  Abbrechen
                </button>
                <button className="button primary" disabled={busy}>
                  <Save size={17} /> {busy ? "Wird gespeichert …" : "Speichern"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
