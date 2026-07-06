/**
 * Deterministic decorative schematic per project — a small routed
 * "circuit" unique to its figure number. Pure SVG, server-rendered,
 * zero runtime cost. Colors come from the design tokens.
 */
export default function Schematic({ seed }: { seed: number }) {
  // Tiny LCG — deterministic per seed, stable across builds.
  let s = seed * 2654435761 + 1013904223;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const COLS = 12;
  const ROWS = 8;
  const CELL = 20;
  const W = COLS * CELL;
  const H = ROWS * CELL;
  const gx = (c: number) => c * CELL + CELL / 2;
  const gy = (r: number) => r * CELL + CELL / 2;

  // Walk 6 nodes across the grid, connected by orthogonal routes.
  const nodes: Array<[number, number]> = [];
  let c = 1;
  for (let i = 0; i < 6; i++) {
    const r = 1 + Math.floor(rand() * (ROWS - 2));
    nodes.push([c, r]);
    c += 1 + Math.floor(rand() * ((COLS - 2 - c) / Math.max(5 - i, 1)));
    c = Math.min(c, COLS - 2);
  }
  const route = (a: [number, number], b: [number, number]) =>
    `M ${gx(a[0])} ${gy(a[1])} H ${gx(b[0])} V ${gy(b[1])}`;
  const amberIdx = 1 + Math.floor(rand() * 4);

  return (
    <svg
      className="schematic"
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* measurement dot grid */}
      {Array.from({ length: COLS }, (_, i) =>
        Array.from({ length: ROWS }, (_, j) => (
          <rect
            key={`${i}-${j}`}
            x={gx(i) - 0.5}
            y={gy(j) - 0.5}
            width="1"
            height="1"
            fill="var(--line)"
          />
        )),
      )}
      {/* routed traces — pathLength=1 so CSS can draw them in on reveal */}
      {nodes.slice(0, -1).map((n, i) => (
        <path
          key={i}
          className="s-trace"
          d={route(n, nodes[i + 1])}
          pathLength={1}
          fill="none"
          stroke={i === amberIdx ? "var(--brand)" : "var(--line-strong)"}
          strokeWidth="1"
          style={{ transitionDelay: `${0.3 + i * 0.12}s` }}
        />
      ))}
      {/* nodes */}
      <g className="s-nodes">
        {nodes.map(([nc, nr], i) =>
          i === amberIdx ? (
            <circle key={i} cx={gx(nc)} cy={gy(nr)} r="3.5" fill="var(--brand)" />
          ) : (
            <rect
              key={i}
              x={gx(nc) - 3}
              y={gy(nr) - 3}
              width="6"
              height="6"
              fill="var(--surface)"
              stroke="var(--line-strong)"
              strokeWidth="1"
            />
          ),
        )}
      </g>
      {/* figure tick, bottom-right */}
      <text
        x={W - 8}
        y={H - 8}
        textAnchor="end"
        fontFamily="var(--font-data)"
        fontSize="8"
        fill="var(--muted)"
      >
        {`FIG.0${seed}`}
      </text>
    </svg>
  );
}
