import type { Metadata } from "next";
import Fx from "./components/Fx";
import Trace from "./components/Trace";
import Schematic from "./components/Schematic";
import { getContent } from "@/lib/data";

/**
 * Single-page portfolio — "engineering dossier".
 * Content comes from Supabase (editable at /admin), falling back to
 * the defaults in app/content.ts; this file is structure only.
 */

/** A URL is "live" only if it's filled in and not a leftover placeholder. */
function isLive(url: string): boolean {
  const u = url?.trim();
  return Boolean(u) && !u.startsWith("{{");
}

export async function generateMetadata(): Promise<Metadata> {
  const { person } = await getContent();
  return {
    title: `${person.name} — ${person.role}`,
    description: person.valueProp,
  };
}

export default async function Home() {
  const { person, projects, jobs, about } = await getContent();
  return (
    <>
      <a href="#work" className="skip-link">
        Skip to content
      </a>
      <div className="scroll-meter" aria-hidden="true" />

      <header className="site-head">
        <div className="container">
          <a href="#top" className="wordmark">
            {person.name}
          </a>
          <nav className="site-nav" aria-label="Sections">
            <a href="#work">Work</a>
            <a href="#experience">Experience</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ── Hero: the type is the visual ─────────────────────── */}
        <section className="hero" aria-label="Introduction">
          <Trace />
          <div className="container">
            <h1 className="hero-title">
              <span className="line">
                <span>{person.taglineLine1}</span>
              </span>
              <span className="line">
                <span>{person.taglineLine2}</span>
              </span>
            </h1>
            <p className="hero-sub">{person.valueProp}</p>
            <a className="hero-cue" href="#work">
              <span className="tick" aria-hidden="true" />
              Selected work
            </a>

            {/* dossier title block */}
            <dl className="tblock">
              <div>
                <dt>NAME</dt>
                <dd>{person.name}</dd>
              </div>
              <div>
                <dt>ROLE</dt>
                <dd>{person.role}</dd>
              </div>
              <div>
                <dt>LOCATION</dt>
                <dd>{person.location}</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd>
                  <span className="status-dot" aria-hidden="true" />
                  {person.status}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Selected work: numbered dossier figures ──────────── */}
        <section id="work" aria-labelledby="work-title">
          <div className="container">
            <div className="sec-head" data-reveal>
              <h2 id="work-title">Selected work</h2>
              <span className="rule" aria-hidden="true" />
              <span className="tally">{projects.length} FIGURES</span>
            </div>

            {projects.map((p, i) => (
              <article className="fig" key={i} data-reveal>
                <p className="fig-num" aria-hidden="true">
                  0{i + 1}
                </p>

                <div className="fig-main">
                  <p className="fig-kicker">FIG. 0{i + 1}</p>
                  <h3 className="fig-title">{p.name}</h3>
                  <p className="fig-problem">{p.problem}</p>
                  <ul className="stack" aria-label="Tech stack">
                    {p.stack.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  {(isLive(p.demoUrl) || isLive(p.repoUrl)) && (
                    <p className="fig-links">
                      {isLive(p.demoUrl) && (
                        <a
                          className="alink"
                          href={p.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Live demo of ${p.name}`}
                        >
                          Live demo <span className="arr" aria-hidden="true">↗</span>
                        </a>
                      )}
                      {isLive(p.repoUrl) && (
                        <a
                          className="alink"
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Source code of ${p.name}`}
                        >
                          Source <span className="arr" aria-hidden="true">↗</span>
                        </a>
                      )}
                    </p>
                  )}
                </div>

                <div className="fig-aside">
                  <Schematic seed={i + 1} />
                  <dl className="specs" aria-label={`Key metrics of ${p.name}`}>
                    {p.metrics.map((m) => (
                      <div key={m.label}>
                        <dt>{m.label}</dt>
                        <dd>{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Experience: the ledger ───────────────────────────── */}
        <section id="experience" aria-labelledby="exp-title">
          <div className="container">
            <div className="sec-head" data-reveal>
              <h2 id="exp-title">Experience</h2>
              <span className="rule" aria-hidden="true" />
            </div>
            <ol className="ledger">
              {jobs.map((j, i) => (
                <li
                  key={i}
                  data-reveal
                  style={{ "--stagger": i } as React.CSSProperties}
                >
                  <p className="when">
                    {j.dates?.trim() && !j.dates.startsWith("{{")
                      ? j.dates
                      : "—"}
                  </p>
                  <div>
                    <h3>{j.role}</h3>
                    <p className="co">{j.company}</p>
                  </div>
                  <p className="impact">{j.impact}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────── */}
        <section id="about" aria-labelledby="about-title">
          <div className="container">
            <div className="sec-head" data-reveal>
              <h2 id="about-title">About</h2>
              <span className="rule" aria-hidden="true" />
            </div>
            <div className="about-grid">
              <p className="pull-line" data-reveal>
                {about.pullLine}
              </p>
              <div className="about-prose" data-reveal>
                {about.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact: the amber drench ────────────────────────── */}
        <section
          id="contact"
          className="drench"
          aria-labelledby="contact-title"
          data-reveal
        >
          <div className="container">
            <h2 className="drench-title" id="contact-title" data-reveal>
              Have something worth building?
            </h2>
            <p className="drench-sub" data-reveal>
              One email away. I read everything and reply to anything real.
            </p>
            <a className="mega-mail" href={`mailto:${person.email}`} data-reveal>
              {person.email}
            </a>
            <ul className="channels" data-reveal>
              {isLive(person.githubUrl) && (
                <li>
                  <a
                    className="alink"
                    href={person.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${person.name} on GitHub`}
                  >
                    GITHUB <span className="arr" aria-hidden="true">↗</span>
                  </a>
                </li>
              )}
              {isLive(person.linkedinUrl) && (
                <li>
                  <a
                    className="alink"
                    href={person.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${person.name} on LinkedIn`}
                  >
                    LINKEDIN <span className="arr" aria-hidden="true">↗</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  className="alink"
                  href={`mailto:${person.email}`}
                  aria-label={`Email ${person.name}`}
                >
                  EMAIL <span className="arr" aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>

          <footer className="site-foot">
            <div className="container">
              <dl className="tblock">
                <div>
                  <dt>DOSSIER</dt>
                  <dd>{person.name}</dd>
                </div>
                <div>
                  <dt>REV</dt>
                  <dd>2026.07</dd>
                </div>
                <div>
                  <dt>BUILD</dt>
                  <dd>Next.js · zero trackers</dd>
                </div>
              </dl>
              <p className="colophon">
                Set in Gloock, Geist &amp; Geist Mono.
                <br />© 2026 {person.name}. Built by hand.
              </p>
            </div>
          </footer>
        </section>
      </main>

      <Fx />
    </>
  );
}
