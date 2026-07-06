"use client";

import { useEffect, useRef } from "react";

/** Deterministic PRNG so the trace is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The hero's plotted trace, now a live instrument:
 * — draws itself left→right on load;
 * — the curve lifts toward the pointer with a gaussian bump, and a
 *   measurement crosshair with a mono x/y readout rides the curve;
 * — the rAF loop runs only while the pointer state is settling, and
 *   pauses entirely when the hero leaves the viewport.
 * Reduced motion: one static frame, no pointer reaction.
 */
export default function Trace() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const hero = canvas.closest("section");

    const styles = getComputedStyle(document.documentElement);
    const BRAND = styles.getPropertyValue("--brand").trim() || "#e0aa3e";
    const LINE = styles.getPropertyValue("--line").trim() || "#3a3a35";
    const MUTED = styles.getPropertyValue("--muted").trim() || "#b0aca0";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Profile: layered seeded sines → a plausible measured curve.
    const rand = mulberry32(1897);
    const waves = Array.from({ length: 5 }, (_, i) => ({
      amp: (0.5 / (i + 1)) * (0.6 + rand() * 0.8),
      freq: (i + 1) * (1.2 + rand() * 1.6),
      phase: rand() * Math.PI * 2,
    }));
    const profile = (t: number) =>
      waves.reduce((y, w) => y + w.amp * Math.sin(t * w.freq * Math.PI * 2 + w.phase), 0);

    // Pointer state eased every frame; the loop stops once settled.
    const cur = { x: -1, s: 0 };
    const tgt = { x: -1, s: 0 };
    let intro = reduced ? 1 : 0;
    let raf = 0;
    let running = false;
    let inView = true;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // measurement grid: dots every 26px
      ctx.fillStyle = LINE;
      ctx.globalAlpha = 0.5;
      for (let gx = 13; gx < w; gx += 26)
        for (let gy = 13; gy < h; gy += 26) ctx.fillRect(gx, gy, 1, 1);
      ctx.globalAlpha = 1;

      const base = h * 0.55;
      const ampl = h * 0.3;
      const sigma = w * 0.06;
      const bump = (x: number) =>
        cur.s > 0.004 && cur.x >= 0
          ? -h * 0.16 * cur.s * Math.exp(-((x - cur.x) ** 2) / (2 * sigma * sigma))
          : 0;
      const yAt = (x: number) => base + profile(x / w) * ampl + bump(x);
      const upTo = Math.floor(w * intro);

      // the amber profile line, with a soft glow
      ctx.beginPath();
      for (let x = 0; x <= upTo; x++) {
        const y = yAt(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = BRAND;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = BRAND;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // datum crosshairs at fixed stations along the curve
      for (const s of [0.18, 0.47, 0.76]) {
        const x = s * w;
        if (x > upTo) continue;
        const y = yAt(x);
        ctx.strokeStyle = BRAND;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = BRAND;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }

      // live measurement: crosshair + mono readout riding the curve
      if (cur.s > 0.02 && cur.x >= 0 && intro >= 1) {
        const x = Math.max(0, Math.min(w, cur.x));
        const y = yAt(x);
        ctx.globalAlpha = Math.min(cur.s, 1);
        ctx.strokeStyle = MUTED;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = BRAND;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px "Geist Mono", ui-monospace, monospace';
        ctx.fillStyle = MUTED;
        const label = `x ${(x / w).toFixed(3)}  y ${(-profile(x / w)).toFixed(3)}`;
        const tx = x + 10 + ctx.measureText(label).width > w ? x - 10 - ctx.measureText(label).width : x + 10;
        ctx.fillText(label, tx, Math.max(12, y - 10));
        ctx.globalAlpha = 1;
      }
    };

    const settled = () =>
      intro >= 1 &&
      Math.abs(tgt.s - cur.s) < 0.002 &&
      cur.s < 0.005 &&
      (tgt.x < 0 || Math.abs(tgt.x - cur.x) < 0.5);

    const t0 = performance.now();
    const INTRO_MS = 1700;
    const tick = (t: number) => {
      if (intro < 1) {
        const p = Math.min((t - t0) / INTRO_MS, 1);
        intro = 1 - Math.pow(1 - p, 4); // ease-out-quart
        if (p >= 1) intro = 1;
      }
      cur.x = cur.x < 0 ? tgt.x : cur.x + (tgt.x - cur.x) * 0.14;
      cur.s += (tgt.s - cur.s) * 0.09;
      draw();
      if (!settled() && inView) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const wake = () => {
      if (!running && inView && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    if (reduced) {
      draw();
    } else {
      wake();
    }

    // pointer reaction (skipped under reduced motion)
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tgt.x = e.clientX - r.left;
      tgt.s = e.clientY > r.top - 40 ? 1 : 0.35;
      wake();
    };
    const onLeave = () => {
      tgt.s = 0;
      wake();
    };
    if (!reduced && hero) {
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
    }

    // pause everything while the hero is offscreen
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) wake();
    });
    io.observe(canvas);

    // Redraw whenever the element itself changes size (fonts settling,
    // orientation, container shifts) — window.resize alone misses these.
    const ro = new ResizeObserver(() => {
      draw();
      wake();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      if (hero) {
        hero.removeEventListener("pointermove", onMove);
        hero.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
