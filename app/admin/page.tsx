"use client";

/**
 * Dossier admin — edits every piece of site content.
 * Auth: Supabase email/password. Storage: single jsonb row
 * (site_content, id=1) guarded by RLS. Saving upserts the row and
 * pings /api/revalidate so the public page refreshes immediately.
 */

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabaseClient";
import { defaults, type SiteContent } from "@/lib/data";
import type { Job, Metric, Project } from "@/app/content";

type Tab = "identity" | "projects" | "experience" | "about";
type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "identity", label: "Identity" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
];

/* ── small form primitives ────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea
        className="input textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

function RowControls({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <span className="row-controls">
      <button
        type="button"
        className="icon-btn"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-danger"
        onClick={onRemove}
        aria-label="Remove"
      >
        ✕
      </button>
    </span>
  );
}

/** Trim edit debris (trailing commas, empty metrics/paragraphs) before publishing. */
function sanitize(c: SiteContent): SiteContent {
  return {
    ...c,
    projects: c.projects.map((p) => ({
      ...p,
      stack: p.stack.map((s) => s.trim()).filter(Boolean),
      metrics: p.metrics.filter((m) => m.label.trim() || m.value.trim()),
    })),
    about: {
      ...c.about,
      paragraphs: c.about.paragraphs.filter((p) => p.trim()),
    },
  };
}

function arrayMove<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ── page ─────────────────────────────────────────────────────── */

export default function AdminPage() {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(() => Boolean(supabase));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState<Tab>("identity");
  const [dirty, setDirty] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  /* session lifecycle */
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  /* load content once signed in */
  useEffect(() => {
    if (!supabase || !session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("data")
        .eq("id", 1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadError(
          `Couldn't load content (${error.message}). Has supabase/schema.sql been run?`,
        );
        return;
      }
      const d = (data?.data ?? {}) as Partial<SiteContent>;
      setContent({
        person: { ...defaults.person, ...d.person },
        projects: d.projects?.length ? d.projects : defaults.projects,
        jobs: d.jobs?.length ? d.jobs : defaults.jobs,
        about: { ...defaults.about, ...d.about },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, session]);

  const update = useCallback((patch: Partial<SiteContent>) => {
    setContent((c) => (c ? { ...c, ...patch } : c));
    setDirty(true);
    setSave({ kind: "idle" });
  }, []);

  const doSave = useCallback(async () => {
    if (!supabase || !content) return;
    const c = sanitize(content);
    setSave({ kind: "saving" });
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: 1, data: c, updated_at: new Date().toISOString() });
    if (error) {
      setSave({ kind: "error", message: error.message });
      return;
    }
    // refresh the public page's cache; non-fatal if it fails
    try {
      const { data } = await supabase.auth.getSession();
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { authorization: `Bearer ${data.session?.access_token}` },
      });
    } catch {
      /* the ISR window will pick it up */
    }
    setDirty(false);
    setSave({
      kind: "saved",
      at: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }, [supabase, content]);

  /* Cmd/Ctrl+S saves; warn before leaving with unsaved changes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void doSave();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, doSave]);

  /* ── not configured ─────────────────────────────────────────── */
  if (!supabase) {
    return (
      <div className="admin admin-center">
        <div className="login-card">
          <p className="admin-mark">DOSSIER / ADMIN</p>
          <h1 className="admin-h1">Supabase isn&apos;t connected yet</h1>
          <ol className="setup-steps">
            <li>Create a project at supabase.com</li>
            <li>
              Put its URL and anon key in <code>.env.local</code> as{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              Run <code>supabase/schema.sql</code> in the SQL editor
            </li>
            <li>Add a user under Authentication → Users</li>
            <li>Restart the dev server and reload this page</li>
          </ol>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="admin admin-center" aria-busy="true">
        <p className="admin-mark">DOSSIER / ADMIN</p>
      </div>
    );
  }

  /* ── login ──────────────────────────────────────────────────── */
  if (!session) {
    return <Login />;
  }

  /* ── editor ─────────────────────────────────────────────────── */
  return (
    <div className="admin">
      <header className="admin-bar">
        <p className="admin-mark">DOSSIER / ADMIN</p>
        <div className="admin-bar-right">
          <span className="admin-user">{session.user.email}</span>
          <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav" aria-label="Content sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="admin-tab"
              aria-current={tab === t.id ? "true" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          {loadError ? (
            <p className="admin-alert" role="alert">
              {loadError}
            </p>
          ) : !content ? (
            <div className="skeleton-stack" aria-busy="true" aria-label="Loading">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" style={{ width: "60%" }} />
            </div>
          ) : (
            <>
              {tab === "identity" && (
                <IdentityForm content={content} update={update} />
              )}
              {tab === "projects" && (
                <ProjectsForm content={content} update={update} />
              )}
              {tab === "experience" && (
                <JobsForm content={content} update={update} />
              )}
              {tab === "about" && <AboutForm content={content} update={update} />}
            </>
          )}
        </main>
      </div>

      <footer className="admin-save">
        <p className="save-status" role="status">
          {save.kind === "saving" && "Saving…"}
          {save.kind === "saved" && `Saved · ${save.at}`}
          {save.kind === "error" && (
            <span className="save-error">Save failed: {save.message}</span>
          )}
          {save.kind === "idle" && (dirty ? "Unsaved changes" : "Up to date")}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void doSave()}
          disabled={!dirty || !content || save.kind === "saving"}
        >
          {save.kind === "saving" ? "Saving…" : "Save & publish"}
        </button>
      </footer>
    </div>
  );
}

/* ── login screen ─────────────────────────────────────────────── */

function Login() {
  const supabase = getSupabase()!;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setPending(false);
  };

  return (
    <div className="admin admin-center">
      <form className="login-card" onSubmit={submit}>
        <p className="admin-mark">DOSSIER / ADMIN</p>
        <h1 className="admin-h1">Sign in</h1>
        <Field label="EMAIL" value={email} onChange={setEmail} type="email" />
        <Field
          label="PASSWORD"
          value={password}
          onChange={setPassword}
          type="password"
        />
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={pending || !email || !password}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/* ── section forms ────────────────────────────────────────────── */

type FormProps = {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
};

function IdentityForm({ content, update }: FormProps) {
  const p = content.person;
  const set = (k: keyof typeof p) => (v: string) =>
    update({ person: { ...p, [k]: v } });
  return (
    <section aria-label="Identity">
      <h2 className="admin-h2">Identity</h2>
      <div className="field-grid">
        <Field label="NAME" value={p.name} onChange={set("name")} />
        <Field label="ROLE" value={p.role} onChange={set("role")} />
        <Field label="LOCATION" value={p.location} onChange={set("location")} />
        <Field label="STATUS" value={p.status} onChange={set("status")} />
      </div>
      <Field
        label="TAGLINE — LINE 1"
        value={p.taglineLine1}
        onChange={set("taglineLine1")}
        hint='The hero statement, first line — e.g. "Web systems,"'
      />
      <Field
        label="TAGLINE — LINE 2 (RENDERS AMBER)"
        value={p.taglineLine2}
        onChange={set("taglineLine2")}
        hint='Second line — e.g. "built to hold."'
      />
      <Area
        label="VALUE PROPOSITION"
        value={p.valueProp}
        onChange={set("valueProp")}
        hint="One sentence: what you do, for whom, to what end."
      />
      <div className="field-grid">
        <Field label="EMAIL" value={p.email} onChange={set("email")} type="email" />
        <Field label="GITHUB URL" value={p.githubUrl} onChange={set("githubUrl")} />
        <Field
          label="LINKEDIN URL"
          value={p.linkedinUrl}
          onChange={set("linkedinUrl")}
        />
      </div>
    </section>
  );
}

function ProjectsForm({ content, update }: FormProps) {
  const list = content.projects;
  const setAt = (i: number, patch: Partial<Project>) =>
    update({
      projects: list.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    });
  const setMetric = (i: number, mi: number, patch: Partial<Metric>) =>
    setAt(i, {
      metrics: list[i].metrics.map((m, j) => (j === mi ? { ...m, ...patch } : m)),
    });
  return (
    <section aria-label="Projects">
      <h2 className="admin-h2">Projects</h2>
      {list.map((proj, i) => (
        <div className="row-card" key={i}>
          <div className="row-card-head">
            <span className="row-card-title">FIG. 0{i + 1}</span>
            <RowControls
              index={i}
              total={list.length}
              onMove={(dir) => update({ projects: arrayMove(list, i, dir) })}
              onRemove={() =>
                update({ projects: list.filter((_, j) => j !== i) })
              }
            />
          </div>
          <Field label="NAME" value={proj.name} onChange={(v) => setAt(i, { name: v })} />
          <Area
            label="PROBLEM IT SOLVES"
            value={proj.problem}
            onChange={(v) => setAt(i, { problem: v })}
            rows={2}
          />
          <Field
            label="STACK (COMMA-SEPARATED)"
            value={proj.stack.join(", ")}
            onChange={(v) =>
              setAt(i, {
                stack: v.split(",").map((s) => s.trimStart()),
              })
            }
            hint="e.g. Next.js, PostgreSQL, Redis"
          />
          <div className="metric-rows">
            <span className="field-label">METRICS</span>
            {proj.metrics.map((m, mi) => (
              <div className="metric-row" key={mi}>
                <input
                  className="input"
                  value={m.label}
                  placeholder="Label — e.g. p95 latency"
                  aria-label={`Metric ${mi + 1} label`}
                  onChange={(e) => setMetric(i, mi, { label: e.target.value })}
                />
                <input
                  className="input"
                  value={m.value}
                  placeholder="Value — e.g. 180ms"
                  aria-label={`Metric ${mi + 1} value`}
                  onChange={(e) => setMetric(i, mi, { value: e.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label={`Remove metric ${mi + 1}`}
                  onClick={() =>
                    setAt(i, { metrics: proj.metrics.filter((_, j) => j !== mi) })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setAt(i, { metrics: [...proj.metrics, { label: "", value: "" }] })
              }
            >
              + Add metric
            </button>
          </div>
          <div className="field-grid">
            <Field
              label="LIVE DEMO URL"
              value={proj.demoUrl}
              onChange={(v) => setAt(i, { demoUrl: v })}
            />
            <Field
              label="REPO URL"
              value={proj.repoUrl}
              onChange={(v) => setAt(i, { repoUrl: v })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          update({
            projects: [
              ...list,
              {
                name: "New project",
                problem: "",
                stack: [],
                metrics: [{ label: "", value: "" }],
                demoUrl: "",
                repoUrl: "",
              },
            ],
          })
        }
      >
        + Add project
      </button>
    </section>
  );
}

function JobsForm({ content, update }: FormProps) {
  const list = content.jobs;
  const setAt = (i: number, patch: Partial<Job>) =>
    update({ jobs: list.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  return (
    <section aria-label="Experience">
      <h2 className="admin-h2">Experience</h2>
      {list.map((job, i) => (
        <div className="row-card" key={i}>
          <div className="row-card-head">
            <span className="row-card-title">ENTRY 0{i + 1}</span>
            <RowControls
              index={i}
              total={list.length}
              onMove={(dir) => update({ jobs: arrayMove(list, i, dir) })}
              onRemove={() => update({ jobs: list.filter((_, j) => j !== i) })}
            />
          </div>
          <div className="field-grid">
            <Field label="COMPANY" value={job.company} onChange={(v) => setAt(i, { company: v })} />
            <Field label="ROLE" value={job.role} onChange={(v) => setAt(i, { role: v })} />
            <Field
              label="DATES"
              value={job.dates}
              onChange={(v) => setAt(i, { dates: v })}
              hint='e.g. "2024 — now"'
            />
          </div>
          <Area
            label="IMPACT (ONE LINE)"
            value={job.impact}
            onChange={(v) => setAt(i, { impact: v })}
            rows={2}
          />
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          update({
            jobs: [...list, { company: "", role: "", dates: "", impact: "" }],
          })
        }
      >
        + Add entry
      </button>
    </section>
  );
}

function AboutForm({ content, update }: FormProps) {
  const a = content.about;
  return (
    <section aria-label="About">
      <h2 className="admin-h2">About</h2>
      <Area
        label="PULL LINE (SET LARGE, IN SERIF)"
        value={a.pullLine}
        onChange={(v) => update({ about: { ...a, pullLine: v } })}
        rows={2}
      />
      <Area
        label="PARAGRAPHS (SEPARATE WITH A BLANK LINE)"
        value={a.paragraphs.join("\n\n")}
        onChange={(v) =>
          update({
            about: {
              ...a,
              paragraphs: v.split(/\n\s*\n/).map((s) => s.replace(/\s+$/, "")),
            },
          })
        }
        rows={8}
      />
    </section>
  );
}
