// ⭐⭐⭐ THE FREE-FACE STUDY (2026-11-16, offline — `TILTED_POLE_CLOSE_IN.md` §6 C0; simple convex shapes only) — the tilted pole made systematic:
// a face is FREE when the holding "up" is its normal (a level face under the world's hold): square to it every heading is upright, so its layout is
// CARRIED IN by the entry edge (the neighbour's own up, unfolded across the edge) and the turn is paid at the exit edge.
//   PART A — on the 35 shapes: the free faces, their layouts (one per edge) and every exit's turn; the exits between 90° and 120° (the dy hold's gap).
//   PART B — `Scene_0bis` as a spit (the owner's comment of 2026-11-16, D-T2): the camera and the finger along two paths on its bottom face, by
//            TODAY's rules (the side, the bias, the swap — the real functions of `src/input/polar_zone.ts`) and by the CARRIED heading (N1: the camera
//            square to a free face; N2: the calm kept): where the picture turns with no edge under the gizmo, whether the gizmo goes the finger's way,
//            how far the world's vertical points DOWN the glass.
// ⚠ A MODEL: the calm is its rule's shape (a quarter mid-face, whole in the edge zones), no ease, no spring, no solver, far out only.
// Usage: npx vite-node scripts/probes/free_face_study.ts        (ONLY=text — the shapes whose name holds it; VERBOSE=1 — every free face's table)
import { fingerInFrame, fingerSwapped, spitCameraHeading, spitSide, SPIT_CROSSING_PITCH_RAD } from "../../src/input/polar_zone";
import { type V, D, dot, sub, add, mul, cross, len, unit } from "./shapes_lib";
import { type Chart, type Face, H, LEVEL_COS, SHAPES, Y, buildChart, colAt, contourOf, dist, target } from "./chart_lib";

const TOL = 5e-4;
const rot = (v: V, k: V, th: number): V => add(add(mul(v, Math.cos(th)), mul(cross(k, v), Math.sin(th))), mul(k, dot(k, v) * (1 - Math.cos(th))));
const angDeg = (a: V, b: V): number => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / D;
const fmt = (x: number, n = 1): string => x.toFixed(n);

// ───────────────────────────────────────── the model: free faces, layouts, exit turns ─────────────────────────────────────────
interface Edge { a: V; b: V; g: number; h: V | null }
const isFree = (f: Face): boolean => Math.abs(f.n[1]) >= LEVEL_COS;
/** the neighbour's own "up" (the uphill direction in its plane), UNFOLDED across the shared edge into `F`'s plane; `null`: the neighbour is level too */
function unfoldedUp(F: Face, G: Face, a: V, b: V): V | null {
  const w = sub(Y, mul(G.n, G.n[1]));
  if (len(w) < 1e-6) return null;
  const d = unit(sub(b, a));
  const th = Math.atan2(dot(d, cross(G.n, F.n)), dot(G.n, F.n));
  return unit(rot(unit(w), d, th));
}
function edgesOf(faces: Face[], i: number): Edge[] {
  const F = faces[i]!;
  const out: Edge[] = [];
  for (let k = 0; k < F.pts.length; k++) {
    const a = F.pts[k]!, b = F.pts[(k + 1) % F.pts.length]!;
    const g = faces.findIndex((G, j) => j !== i && G.pts.some((p) => dist(p, a) < TOL) && G.pts.some((p) => dist(p, b) < TOL));
    out.push({ a, b, g, h: g < 0 ? null : unfoldedUp(F, faces[g]!, a, b) });
  }
  return out;
}

// ───────────────────────────────────────── PART A ─────────────────────────────────────────
function partA(): void {
  console.log("PART A — the free faces of the 35 shapes (the world's hold): one layout per edge, the turn of every exit\n");
  console.log("  shape".padEnd(64) + "free  edges   the exits' turns (°), entry → exit                    90°<turn<120°   layout square to its edge");
  let gaps = 0, total = 0, bad = 0;
  for (const s of SHAPES) {
    if (process.env.ONLY && !s.name.includes(process.env.ONLY)) continue;
    const faces = contourOf(s.polys());
    const free = faces.map((_, i) => i).filter((i) => isFree(faces[i]!));
    if (free.length === 0) { console.log(`  ${s.name.slice(0, 60).padEnd(62)}  0`); continue; }
    for (const i of free) {
      const F = faces[i]!;
      const E = edgesOf(faces, i).filter((e) => e.h !== null);
      const turns = new Map<string, number>();
      let gap = 0, sq = true;
      for (const e of E) {
        // the layout's heading lies square to its own edge, pointing INTO a top face and OUT of a bottom one
        const d = unit(sub(e.b, e.a));
        if (Math.abs(dot(e.h!, d)) > 1e-6 || Math.abs(dot(e.h!, F.n)) > 1e-6) sq = false;
        const inward = dot(e.h!, sub(F.c, mul(add(e.a, e.b), 0.5))) > 0;
        if (inward !== F.n[1] > 0) sq = false;
        for (const x of E) { const t = angDeg(e.h!, x.h!); const key = fmt(t, 1); turns.set(key, (turns.get(key) ?? 0) + 1); if (t > 90 + 1e-6 && t < 120 - 1e-6) gap++; }
      }
      total++; gaps += gap > 0 ? 1 : 0; if (!sq) bad++;
      const list = [...turns.keys()].map(Number).sort((x, y) => x - y).map((t) => fmt(t, t % 1 === 0 ? 0 : 1)).join(" ");
      console.log(`  ${s.name.slice(0, 60).padEnd(62)}  ${F.n[1] > 0 ? "top" : "bot"}   ${String(E.length).padStart(2)}    ${list.padEnd(56)}  ${String(gap).padStart(3)}            ${sq ? "yes" : "NO"}`);
      if (process.env.VERBOSE) for (const e of E) console.log(`      entry over the edge to face ${e.g}: ` + E.map((x) => `→ ${x.g}: ${fmt(angDeg(e.h!, x.h!), 0)}°`).join("  "));
    }
  }
  console.log(`\n  ${total} free faces; ${bad} whose layouts are not square to their edges; ${gaps} with an exit between 90° and 120° (a dy that crossed would come back, no hold today).\n`);
}

// ───────────────────────────────────────── PART B — the spit ─────────────────────────────────────────
type Model = "TODAY" | "N1" | "N2";
interface Sample { f: number; g: V; u: V; up: V; axisOnGlass: number; agreeDx: number; agreeDy: number; wDown: number; side: number; note: string }

function partB(): void {
  const shape = SHAPES.find((s) => s.key === "scene0bis")!;
  const faces = contourOf(shape.polys());
  const A: V = [1, 0, 0];
  const c: Chart = buildChart(faces, A, "normals");
  const bottom = faces.findIndex((f) => f.n[1] < -LEVEL_COS);
  const col = c.cols[c.colOf[c.sideOf[bottom]!]!]!;
  const yawN = col.mid;
  const dirF = (yaw: number, pitch: number): V => c.fromF([Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)]);
  const place = (yaw: number, pitch: number) => target(c, yaw, pitch);
  // the frame's own signs: in F's upright screen a +yaw goes one way round the axis, a +pitch toward the pole — read once, on a side face seen level
  const sgn = (() => {
    const yaw = yawN + H, pitch = 0.1;
    const u = dirF(yaw, pitch), v = mul(u, -1);
    const U1 = unit(sub(A, mul(v, dot(A, v)))), R1 = cross(U1, v);
    const g = place(yaw, pitch).p, e = 0.2 * D;
    return { yaw: Math.sign(dot(sub(place(yaw + e, pitch).p, g), R1)) || 1, pitch: Math.sign(dot(sub(place(yaw, pitch + e).p, g), U1)) || 1 };
  })();
  // the calm's shape (a model): the shown direction a quarter of the orbit's angle off the face's normal mid-face, whole within the edge zones
  const share = (t: number): number => { const x = Math.min(1, Math.abs(t) / 0.5); return 0.25 + 0.75 * x * x * (3 - 2 * x); };
  const shown = (f: number, yaw: number, pitch: number, square: boolean): V => {
    const u0 = dirF(yaw, pitch);
    const F = faces[f]!;
    if (square) return F.n;
    const s = c.sides[c.sideOf[f]!];
    if (s === undefined) return u0;
    const { a } = colAt(c, yaw);
    const q = c.toF(place(yaw, pitch).p);
    const tb = s.bHi - s.bLo > 1e-9 ? (2 * (dot(q, s.b) - s.bLo)) / (s.bHi - s.bLo) - 1 : 0;
    const t = c.fromF(s.t), b = c.fromF(s.b);
    const kn = dot(u0, F.n);
    if (kn < 0.05) return u0;
    return unit(add(add(F.n, mul(t, (share(a) * dot(u0, t)) / kn)), mul(b, (share(tb) * dot(u0, b)) / kn)));
  };
  const uprightUp = (u: V, heading: number | null): V => {
    const cp = Math.max(1e-3, Math.hypot(u[0], u[2]));
    const hd: V = heading === null ? unit([u[0], 0, u[2]]) : [Math.cos(heading), 0, Math.sin(heading)];
    const uh = unit([hd[0] * cp, u[1], hd[2] * cp]);
    return unit(sub(Y, mul(uh, uh[1])));
  };
  const frame = (u: V, up: V) => { const v = mul(u, -1); const U = unit(sub(up, mul(v, dot(up, v)))); return { v, U, R: cross(U, v) }; };

  const walk = (model: Model, path: { yaw: number; pitch: number }[]): { rows: Sample[]; events: string[]; noEdgeTurn: number } => {
    const rows: Sample[] = [];
    const events: string[] = [];
    let side = 0, alpha = 0, hCarried: V | null = null, fPrev = -1, noEdgeTurn = 0, axisPrev = NaN;
    for (let k = 0; k < path.length; k++) {
      const { yaw, pitch } = path[k]!;
      const pl = place(yaw, pitch);
      const f = pl.f;
      const F = faces[f]!;
      const free = isFree(F);
      const u = shown(f, yaw, pitch, model === "N1" && free);
      let up: V;
      let note = "";
      if (model === "TODAY") {
        const prev = side;
        side = spitSide(u, A, side);
        if (prev !== 0 && side !== prev) { note = "the side changes"; events.push(`sample ${k}: THE SIDE CHANGES on face ${f}${free ? " (level)" : ""} — the half turn`); }
        up = uprightUp(u, spitCameraHeading(u, A, side));
      } else {
        if (f !== fPrev && fPrev >= 0) {
          const E = edgesOf(faces, free ? f : fPrev).find((e) => e.g === (free ? fPrev : f));
          if (free) { hCarried = E?.h ?? null; note = "onto the level face: the heading carried in"; events.push(`sample ${k}: onto the level face ${f} from ${fPrev} — no turn`); }
          else if (hCarried !== null) { const t = E?.h ? angDeg(hCarried, E.h) : NaN; note = `off the level face: a turn of ${fmt(t, 0)}°`; events.push(`sample ${k}: off the level face over its edge to face ${f} — ONE turn of ${fmt(t, 0)}° at that edge${t > 90 ? ", then the dy hold" : ""}`); hCarried = null; }
        }
        up = free && hCarried !== null ? hCarried : uprightUp(u, null);
      }
      const fr = frame(u, up);
      const axisOnGlass = Math.atan2(dot(A, fr.U), dot(A, fr.R)) / D;
      if (f === fPrev && axisOnGlass === axisOnGlass && axisPrev === axisPrev && Math.hypot(dot(A, fr.U), dot(A, fr.R)) > 0.2) { let d = Math.abs(axisOnGlass - axisPrev); if (d > 180) d = 360 - d; noEdgeTurn += d; }
      axisPrev = axisOnGlass;
      // the finger: F's up on the glass from the orbit's own angles (the way toward the pole), then the rule
      const fUp = c.fromF([-Math.sin(pitch) * Math.cos(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.sin(yaw)]);
      const agree = (dx: number, dy: number): number => {
        const r = fingerInFrame(dx, dy, fr.v, fr.U, fUp, alpha);
        let m = { dx: r.dx, dy: r.dy };
        if (model === "TODAY" && Math.asin(Math.min(1, Math.abs(u[1]))) >= SPIT_CROSSING_PITCH_RAD) m = fingerSwapped(dx, dy, r.alpha);
        const e = 0.2 * D;
        const g2 = place(yaw + e * m.dx * sgn.yaw, pitch + e * m.dy * sgn.pitch).p;
        const dg = sub(g2, pl.p);
        const sx = dot(dg, fr.R), sy = dot(dg, fr.U);
        const l = Math.hypot(sx, sy);
        return l < 1e-9 ? 0 : (sx * dx + sy * dy) / l;
      };
      const agreeDx = agree(1, 0), agreeDy = agree(0, 1);
      alpha = fingerInFrame(1, 0, fr.v, fr.U, fUp, alpha).alpha;
      rows.push({ f, g: pl.p, u, up: fr.U, axisOnGlass, agreeDx, agreeDy, wDown: dot(Y, fr.U), side, note });
      fPrev = f;
    }
    return { rows, events, noEdgeTurn };
  };

  const pathB = (off: number): { yaw: number; pitch: number }[] => [...Array(161)].map((_, k) => ({ yaw: yawN + off * D, pitch: (80 - 0.5 * k) * D }));
  const pathA = (): { yaw: number; pitch: number }[] => [...Array(181)].map((_, k) => ({ yaw: yawN + (-45 + 0.5 * k) * D, pitch: 0 }));
  const paths: [string, { yaw: number; pitch: number }[]][] = [
    ["B+  from the triangle under the +x tip to the body's middle, 2° of yaw on one half", pathB(2)],
    ["B−  the same, 2° on the other half", pathB(-2)],
    ["A   across the bottom face round the axis, at the body's middle (from 45° before the nadir to 45° past it)", pathA()],
  ];
  console.log("PART B — `Scene_0bis` as a spit, far out: its bottom face (level, a FREE face) by today's rules and by the carried heading\n");
  console.log(`  the bottom face is face ${bottom}; its column's middle (the nadir) at F's yaw ${fmt(yawN / D, 1)}°, half width ${fmt(col.hw / D, 1)}°; the frame's signs: yaw ${sgn.yaw}, pitch ${sgn.pitch}\n`);
  for (const [name, path] of paths) {
    console.log(`  PATH ${name}`);
    console.log("     model   the picture's turn with NO edge under the gizmo   the gizmo against the finger (samples, of them on the level face)   the world's vertical DOWN the glass (worst)   events");
    for (const model of ["TODAY", "N1", "N2"] as Model[]) {
      const { rows, events, noEdgeTurn } = walk(model, path);
      const against = rows.filter((r) => Math.min(r.agreeDx, r.agreeDy) < 0.2);
      const againstFree = against.filter((r) => isFree(faces[r.f]!));
      const worstDown = Math.min(...rows.map((r) => r.wDown));
      console.log(`     ${model.padEnd(6)}  ${fmt(noEdgeTurn, 0).padStart(6)}°                                              ${String(against.length).padStart(4)} of ${rows.length}, ${String(againstFree.length).padStart(3)}                                              ${fmt(Math.min(0, worstDown), 2).padStart(6)}                                        ${events.length ? events.join(" · ") : "none"}`);
      if (process.env.VERBOSE) for (let k = 0; k < rows.length; k += 8) { const r = rows[k]!; console.log(`        ${String(k).padStart(3)} face ${String(r.f).padStart(2)}  the axis on the glass ${fmt(r.axisOnGlass, 0).padStart(5)}°  dx ${fmt(r.agreeDx, 2).padStart(5)}  dy ${fmt(r.agreeDy, 2).padStart(5)}  world up on the glass ${fmt(r.wDown, 2).padStart(5)}  ${r.note}`); }
    }
    console.log("");
  }
}

partA();
partB();
