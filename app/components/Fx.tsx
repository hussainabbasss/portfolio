"use client";

import { useEffect } from "react";

/**
 * Progressive-enhancement orchestrator. Renders nothing.
 * — Adds `.js` to <html> only when IntersectionObserver exists and the
 *   user allows motion, so reveal-hidden states never strand content.
 * — Reveals [data-reveal] elements as they enter the viewport.
 * — Tracks scroll for the header hairline and scrollspys the nav.
 */
export default function Fx() {
  useEffect(() => {
    // Header: hairline + backdrop once the page moves (motion-independent).
    const head = document.querySelector<HTMLElement>(".site-head");
    // Scroll meter: one custom property, read by .scroll-meter's transform.
    const root = document.documentElement;
    const onScroll = () => {
      head?.classList.toggle("scrolled", window.scrollY > 8);
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty(
        "--scroll-p",
        max > 0 ? (window.scrollY / max).toFixed(4) : "0",
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Scrollspy: mark the section currently in view on its nav link.
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.site-nav a[href^="#"]'),
    );
    const byId = new Map(links.map((a) => [a.getAttribute("href")!.slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((a) => a.removeAttribute("aria-current"));
          // Back over the hero: no section is current.
          const link = byId.get((e.target as HTMLElement).id);
          link?.setAttribute("aria-current", "true");
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    byId.forEach((_, id) => {
      const sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
    const hero = document.querySelector(".hero");
    if (hero) spy.observe(hero);

    // Scroll reveals — only when motion is welcome.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | undefined;
    if (!reduced && "IntersectionObserver" in window) {
      document.documentElement.classList.add("js");
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io!.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      document.querySelectorAll("[data-reveal]").forEach((el) => io!.observe(el));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      spy.disconnect();
      io?.disconnect();
    };
  }, []);

  return null;
}
