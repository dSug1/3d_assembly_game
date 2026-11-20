// ⭐⭐⭐ (2026-11-18, package ES — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §15, §16; `069682a`'s (iv′), §10.3, rebuilt with its two cures)
// THE SILENT ENTRY: on a FREE face (a level face carrying a heading) entered over an edge, the picture KEPT at the entry — the heading the picture's level
// direction (the view's level part turned by the offset the bound face's camera stood at, read once at the entry — `pictureOffset`, `viewLevelTurned`) —
// then turned toward the entry edge's layout as the gizmo goes deeper, whole at the depth of the face's centre; (a) the layout's share whole by the
// square camera's share shown (close in the layout exactly, far out the blend whole — ⛔ the fade by the view's elevation); (b) the heading shown turned
// toward that value by at most the tilts' one speed a frame (`headingStep`). Behind the switch `freeEntryUpright` (0 = the entry edge's layout at once).
// RED against the base (the functions absent) and against the mutants listed in `LEVEL_FACE_ENTRY.md` §16 (v1) and §17 (v7, as kept).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spitCameraHeading } from "../src/input/polar_zone";
import { entryBlendHeading, entryDepth, entryEdgeOf, freeEdges, freeHeadingAngle, headingStep, pictureLevel, pictureOffset, transportUp, viewLevelTurned } from "../src/input/free_face";
import { offsetFrame } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { ChartFace } from "../src/input/orbit_charts";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
/** one function's CODE (its `//` comments out, then its whitespace collapsed): a pin reads the code, not its prose nor its layout */
function fnCode(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf(close, i) + close.length).replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ");
}
const before = (src: string, a: string, b: string) => {
  expect(src.indexOf(a), a).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(b), b).toBeGreaterThanOrEqual(0);
  expect(src.indexOf(a), `${a} before ${b}`).toBeLessThan(src.indexOf(b));
};
const head = (v: Vec3) => Math.atan2(v[2], v[0]);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const at = (h: number): Vec3 => [Math.cos(h), 0, Math.sin(h)];
// Scene_0bis's bottom entered from the lower front rectangle: the layout out of the bottom toward the rectangle (−z), the camera leaning 30° along the
// edge toward +x; the face's centre 94 mm deep
const LAYOUT: Vec3 = [0, 0, -1];
const VIEW: Vec3 = [Math.sin(30 * D) * 0.57, -0.82, -Math.cos(30 * D) * 0.57]; // centre → camera: below, in front, leaning 30° toward +x
const C = 0.094;
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

describe("(iv′) `entryBlendHeading` — the picture kept at the entry, the layout by the face's middle", () => {
  it("at the entry edge and on the band past it (depth ≤ 0), far out (share 0): the picture's level direction, laid level, ITS SIGN KEPT", () => {
    for (const d of [0, -0.002, -0.01]) {
      const h = entryBlendHeading(VIEW, LAYOUT, d, C, 0);
      expect(h[1]).toBe(0);
      expect(Math.hypot(h[0], h[2])).toBeCloseTo(1, 12);
      expect(wrap(head(h) - head([VIEW[0], 0, VIEW[2]]))).toBeCloseTo(0, 12);
    }
    // ⛔ never turned to the layout's side: a picture level direction 100° off the layout stays where it is (the flip was a jump near a tip)
    const off100 = at(head(LAYOUT) + 100 * D);
    expect(wrap(head(entryBlendHeading(off100, LAYOUT, 0, C, 0)) - head(off100))).toBeCloseTo(0, 12);
    // …and turns toward the layout the short way as the depth grows (100° → 50° half way)
    expect(wrap(head(entryBlendHeading(off100, LAYOUT, C / 2, C, 0)) - head(LAYOUT))).toBeCloseTo(50 * D, 12);
  });

  it("at the centre's depth and beyond: the layout itself", () => {
    for (const d of [C, C + 0.001, 0.3]) for (const s of [0, 0.4]) expect(entryBlendHeading(VIEW, LAYOUT, d, C, s)).toBe(LAYOUT);
  });

  it("monotone between: the heading turns from the view's toward the layout as the depth grows, never past it, the short way (a smoothstep)", () => {
    const h0 = head([VIEW[0], 0, VIEW[2]]);
    const hL = head(LAYOUT);
    let prev = Math.abs(wrap(h0 - hL));
    for (let i = 1; i <= 20; i++) {
      const d = (C * i) / 20;
      const now = Math.abs(wrap(head(entryBlendHeading(VIEW, LAYOUT, d, C, 0)) - hL));
      expect(now).toBeLessThanOrEqual(prev + 1e-12);
      prev = now;
    }
    // half way: half the angle (the smoothstep's middle); a quarter of the way: 0.15625 of it
    const full = wrap(hL - h0);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, C / 2, C, 0)) - h0)).toBeCloseTo(full * 0.5, 12);
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, C / 4, C, 0)) - h0)).toBeCloseTo(full * 0.15625, 12);
  });

  it("(cure a) by the SQUARE CAMERA'S SHARE: 0 (far out) the blend whole, 1 (close in) the layout EXACTLY at every depth, monotone between — the view's elevation read nowhere", () => {
    const h0 = head([VIEW[0], 0, VIEW[2]]);
    const full = wrap(head(LAYOUT) - h0);
    for (const d of [-0.01, 0, C / 4, C / 2, C * 0.99]) expect(entryBlendHeading(VIEW, LAYOUT, d, C, 1)).toBe(LAYOUT);
    expect(entryBlendHeading(VIEW, LAYOUT, 0, C, 1.3)).toBe(LAYOUT); // over 1: whole (clamped)
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, -0.5)) - h0)).toBeCloseTo(0, 12); // under 0: none
    // at the edge the share IS the square camera's: half of it, half the angle
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, 0.5)) - h0)).toBeCloseTo(full * 0.5, 12);
    // with the depth: 1 − (1 − w)(1 − s) — a quarter deep (w 0.15625) and s 0.5: 0.578125
    expect(wrap(head(entryBlendHeading(VIEW, LAYOUT, C / 4, C, 0.5)) - h0)).toBeCloseTo(full * 0.578125, 12);
    let prev = 0;
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const off = Math.abs(wrap(head(entryBlendHeading(VIEW, LAYOUT, 0, C, s)) - h0));
      expect(off).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = off;
    }
    // a view looking near the vertical (80° — where `069682a` faded) far out: the blend whole all the same
    const steep: Vec3 = [Math.cos(80 * D) * Math.sin(30 * D), -Math.sin(80 * D), -Math.cos(80 * D) * Math.cos(30 * D)];
    expect(wrap(head(entryBlendHeading(steep, LAYOUT, 0, C, 0)) - head([steep[0], 0, steep[2]]))).toBeCloseTo(0, 12);
  });

  it("the switch at 0 (`upright` 0): the layout at every depth and share; no level part in the view: the layout", () => {
    for (const d of [-0.01, 0, C / 3, C, 0.2]) for (const s of [0, 0.5, 1]) expect(entryBlendHeading(VIEW, LAYOUT, d, C, s, 0)).toBe(LAYOUT);
    expect(entryBlendHeading([0, -1, 0], LAYOUT, 0, C, 0)).toBe(LAYOUT);
    // any heading of the layout's (a triangle's side, 120° round): the same rule
    const L2 = at(30 * D);
    expect(entryBlendHeading(at(-10 * D), L2, 0, C, 0)[0]).toBeCloseTo(Math.cos(-10 * D), 12);
  });
});

describe("(cure b) `headingStep` — the heading shown turned so that the PICTURE turns by at most the tilts' one speed a frame", () => {
  const SPEED = DEFAULT_CONFIG.tiltRollDegS; // 360°/s: 6° in a frame of 1000/60 ms
  const DT = 1000 / 60;
  const DOWN: Vec3 = [0, -1, 0]; // straight down: the picture's turn IS the heading's
  // the picture's angle of a level heading seen along `u`: its part square to `u`, about `u`
  const img = (h: Vec3, u: Vec3): Vec3 => {
    const k = (h[0] * u[0] + h[1] * u[1] + h[2] * u[2]) / (u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
    return norm([h[0] - k * u[0], h[1] - k * u[1], h[2] - k * u[2]]);
  };
  const picTurn = (a: Vec3, b: Vec3, u: Vec3): number => {
    const p = img(a, u), q = img(b, u);
    return Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])));
  };
  it("never over the speed ON THE GLASS, the short way; lands EXACTLY (the target itself) once within reach; never past it — at the vertical and at a 55° view, below and above", () => {
    const views: Vec3[] = [DOWN, norm([Math.cos(55 * D) * 0.6, -Math.sin(55 * D), Math.cos(55 * D) * 0.8]), norm([-0.4, Math.sin(50 * D), 0.5])];
    for (const u of views)
      for (const a of [-170, -60, 0, 45, 179]) {
        for (const b of [-175, -90, -3, 0, 2, 50, 178]) {
          let h = at(a * D);
          const to = at(b * D);
          const gap0 = picTurn(h, to, u);
          let left = gap0;
          let n = 0;
          while (h !== to && n < 100) {
            const nx = headingStep(h, to, DT, SPEED, u);
            const turned = picTurn(h, nx, u);
            expect(turned).toBeLessThanOrEqual(6 * D + 1e-9);
            if (nx !== to) expect(turned).toBeCloseTo(6 * D, 9); // the whole speed while it is not there: never slower
            const now = picTurn(nx, to, u);
            expect(now).toBeLessThanOrEqual(left + 1e-9); // never away from it, never past it (the gap only shrinks)
            expect(nx[1]).toBe(0);
            left = now;
            h = nx;
            n++;
          }
          expect(h).toBe(to);
          if (u === DOWN) expect(n).toBe(Math.max(1, Math.ceil(Math.abs(wrap((b - a) * D)) / (6 * D) - 1e-9)));
        }
      }
  });
  it("at a slanted view the HEADING's own turn is not the bound — across the view's level line the picture turns 1 / sin e as fast (the brief's letter: 8.2° on the glass, measured)", () => {
    const u = norm([Math.cos(55 * D), -Math.sin(55 * D), 0]); // level line along x
    const h1 = headingStep(at(0), at(90 * D), DT, SPEED, u); // starting along the level line: the heading turns LESS than 6°
    expect(Math.abs(head(h1)) / D).toBeLessThan(5.0); // about 6 · sin 55° = 4.9
    expect(Math.abs(head(h1)) / D).toBeGreaterThan(4.8);
    const h2 = headingStep(at(90 * D), at(180 * D), DT, SPEED, u); // across it: the heading turns MORE than 6°
    expect(Math.abs(wrap(head(h2) - 90 * D)) / D).toBeGreaterThan(7.0); // about 6 / sin 55° = 7.3
  });
  it("its reach is the speed × the frame's time (30 ms: 10.8°; 0 ms or less: none); the speed 0, or a level view: the target at once", () => {
    const from = at(0);
    const to = at(90 * D);
    expect(head(headingStep(from, to, 30, SPEED, DOWN)) / D).toBeCloseTo(10.8, 9);
    expect(head(headingStep(from, at(-90 * D), 30, SPEED, DOWN)) / D).toBeCloseTo(-10.8, 9);
    expect(head(headingStep(from, to, 0, SPEED, DOWN))).toBeCloseTo(0, 12);
    expect(head(headingStep(from, to, -20, SPEED, DOWN))).toBeCloseTo(0, 12);
    expect(headingStep(from, to, DT, 0, DOWN)).toBe(to);
    expect(headingStep(from, to, DT, SPEED, [1, 0, 0])).toBe(to);
    expect(headingStep(at(5 * D), at(10 * D), DT, SPEED, DOWN)).toEqual(at(10 * D)); // within reach: the target itself
  });
});

describe("(iv′) `pictureLevel` — the bound face's picture continued EXACTLY on the free face", () => {
  it("the free face's camera with the heading `pictureLevel` gives back the bound camera's own heading (any heading, not only upright; looking up and down)", () => {
    for (const e of [-65, -50, -35, 35, 50, 65])
      for (const yu of [-150, -90, -20, 40, 120])
        for (const dh of [-25, -8, 0, 6, 30]) {
          const u: Vec3 = [Math.cos(e * D) * Math.cos(yu * D), Math.sin(e * D), Math.cos(e * D) * Math.sin(yu * D)];
          const hB = (yu + dh) * D; // the bound camera's heading: upright (dh 0) or off it (the spit's side bias)
          const T = pictureLevel(u, offsetFrame(u, hB, 0, 0).up);
          expect(T[1]).toBe(0);
          expect(Math.abs(wrap(freeHeadingAngle(T, u) - hB))).toBeLessThan(1e-9);
        }
  });
  it("an upright camera: the view's own level part (the prototype's reading) — off upright they part (the offsets' and the bias's 3° – 4°)", () => {
    const nu = Math.hypot(0.3, 0.8, 0.52);
    const u: Vec3 = [0.3 / nu, -0.8 / nu, -0.52 / nu]; // a unit view 53° below level
    const lv = head([u[0], 0, u[2]]);
    const line = (a: number) => Math.abs(Math.sin(a));
    expect(line(head(pictureLevel(u, offsetFrame(u, lv, 0, 0).up)) - lv)).toBeLessThan(1e-12);
    expect(line(head(pictureLevel(u, offsetFrame(u, lv + 3 * D, 0, 0).up)) - lv)).toBeGreaterThan(Math.sin(1 * D)); // 1.1° here for 3° of heading off upright
  });
});

describe("(iv′) the picture's offset read ONCE at the entry (`pictureOffset`, `viewLevelTurned`)", () => {
  it("at the entry: the view's level part turned by the offset IS the picture's level direction — through `entryBlendHeading` at depth 0 the bound camera's heading comes back", () => {
    for (const e of [-65, -40, 40, 65])
      for (const yu of [-150, -20, 120])
        for (const dh of [-12, -3, 0, 4, 15]) {
          const u: Vec3 = [Math.cos(e * D) * Math.cos(yu * D), Math.sin(e * D), Math.cos(e * D) * Math.sin(yu * D)];
          const hB = (yu + dh) * D;
          const up = offsetFrame(u, hB, 0, 0).up;
          const P = pictureLevel(u, up);
          const layout = at(head(P) + 35 * D); // a layout 35° off the picture
          const off = pictureOffset(u, up);
          expect(Math.abs(wrap(head(viewLevelTurned(u, off)) - head(P)))).toBeLessThan(1e-9); // the picture's level direction itself, its sign too
          const T = entryBlendHeading(viewLevelTurned(u, off), layout, 0, C, 0);
          expect(Math.abs(wrap(freeHeadingAngle(T, u) - hB))).toBeLessThan(1e-9);
        }
  });
  it("an upright picture: offset 0; 4° off upright: about 4° / sin(elevation) on the level; no level part: 0", () => {
    const u: Vec3 = [0, -Math.sin(55 * D), -Math.cos(55 * D)];
    expect(pictureOffset(u, offsetFrame(u, head(u), 0, 0).up)).toBeCloseTo(0, 12); // below a face: the up toward the camera's side
    expect(Math.abs(pictureOffset(u, offsetFrame(u, head(u) + 4 * D, 0, 0).up))).toBeGreaterThan(2 * D);
    const above: Vec3 = [0, Math.sin(55 * D), -Math.cos(55 * D)];
    expect(Math.abs(wrap(pictureOffset(above, offsetFrame(above, head(above), 0, 0).up) - Math.PI))).toBeLessThan(1e-9); // above: the up away from it
    expect(pictureOffset([0, -1, 0], [0, 0, 1])).toBe(0);
    expect(viewLevelTurned([1, -1, 0], 90 * D)[2]).toBeCloseTo(1, 12);
  });
});

// ⭐⭐⭐ (E3, the owner's assumption: *"valid for any level face"*) a level BOTTOM and a level TOP (its mirror), a rectangle, a triangle and a trapezoid,
// entered over EACH edge: the entry edge found, its depth read, and the heading at the entry the picture's own
const UP: Vec3 = [0, 1, 0];
/** a level face at height y (normal down for a bottom, up for a top) with the outline `P` (x, z), and one slanted neighbour on each side */
function solid(P: readonly [number, number][], top: boolean): { faces: ChartFace[]; centre: Vec3 } {
  const y = top ? 0.2 : 0;
  const pts: Vec3[] = P.map(([x, z]) => [x, y, z]);
  const c: Vec3 = [pts.reduce((s, p) => s + p[0], 0) / pts.length, y, pts.reduce((s, p) => s + p[2], 0) / pts.length];
  const faces: ChartFace[] = [{ index: 0, n: top ? [0, 1, 0] : [0, -1, 0], pts, area: 1, c }];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k]!;
    const b = pts[(k + 1) % pts.length]!;
    const d = norm([b[0] - a[0], 0, b[2] - a[2]]);
    const m: Vec3 = [(a[0] + b[0]) / 2 - c[0], 0, (a[2] + b[2]) / 2 - c[2]];
    let o: Vec3 = [d[2], 0, -d[0]];
    if (o[0] * m[0] + o[2] * m[2] < 0) o = [-o[0], 0, -o[2]]; // outward, level, square to the side
    const s = top ? -1 : 1; // a bottom's neighbour rises outward, a top's falls
    const q = (p: Vec3): Vec3 => [p[0] + o[0] * 0.1, p[1] + s * 0.1, p[2] + o[2] * 0.1];
    const n = norm([o[0], -s, o[2]]); // outward: away from the solid
    faces.push({ index: k + 1, n, pts: [a, b, q(b), q(a)], area: 1, c: [(a[0] + b[0]) / 2 + o[0] * 0.05, y + s * 0.05, (a[2] + b[2]) / 2 + o[2] * 0.05] });
  }
  return { faces, centre: c };
}
const OUTLINES: Record<string, [number, number][]> = {
  rectangle: [[-0.25, -0.094], [0.25, -0.094], [0.25, 0.094], [-0.25, 0.094]],
  triangle: [[0, -0.12], [0.11, 0.07], [-0.11, 0.07]],
  trapezoid: [[-0.2, -0.08], [0.2, -0.08], [0.1, 0.08], [-0.1, 0.08]],
};

describe("(E3) ANY level face, ANY outline, ANY edge — `entryEdgeOf`, `entryDepth`; the entry's heading the picture's own", () => {
  for (const [name, P] of Object.entries(OUTLINES))
    for (const top of [false, true])
      it(`${top ? "a level TOP" : "a level bottom"}, a ${name}: over each of its ${P.length} edges`, () => {
        const { faces, centre } = solid(P, top);
        const edges = freeEdges(faces, 0, UP);
        expect(edges.length).toBe(P.length);
        for (let k = 0; k < P.length; k++) {
          const from = edges[k]!.to;
          expect(from).toBe(k + 1);
          const layout = edges[k]!.heading!;
          const E = entryEdgeOf(faces, 0, from, UP)!;
          expect(E).not.toBeNull();
          const a = edges[k]!.a;
          const b = edges[k]!.b;
          const dn = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
          expect(Math.abs(E.inward[0] * dn[0] + E.inward[2] * dn[2])).toBeLessThan(1e-12); // square to the edge
          expect(E.inward[1]).toBeCloseTo(0, 12); // in the face's plane
          expect(entryDepth(E, centre)).toBeCloseTo(E.centreDepth, 12); // the centre at its depth, inside
          expect(E.centreDepth).toBeGreaterThan(0.01);
          expect(entryDepth(E, [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2])).toBeCloseTo(0, 12); // the edge at 0
          // the layout points INTO a top, OUT of a bottom (`freeEdges`) — the mirror
          expect(Math.sign(layout[0] * E.inward[0] + layout[2] * E.inward[2])).toBe(top ? 1 : -1);
          // a camera on the neighbour's side (below a bottom, above a top), leaning along the edge both ways, its picture off upright by a bias:
          // at the entry (depth 0, far out) the free face's heading gives back the bound camera's own heading — the picture KEPT
          const o: Vec3 = [-E.inward[0], 0, -E.inward[2]];
          for (const lean of [-0.4, 0, 0.5])
            for (const dh of [-6, 0, 3]) {
              const u = norm([o[0] * 0.6 + dn[0] * lean, top ? 0.8 : -0.8, o[2] * 0.6 + dn[2] * lean]);
              const hB = head([u[0], 0, u[2]]) + dh * D;
              const upB = offsetFrame(u, hB, 0, 0).up;
              const T = entryBlendHeading(viewLevelTurned(u, pictureOffset(u, upB)), layout, entryDepth(E, a), E.centreDepth, 0);
              expect(Math.abs(wrap(freeHeadingAngle(T, u) - hB))).toBeLessThan(1e-9);
              // …and at the centre's depth the layout itself
              expect(entryBlendHeading(viewLevelTurned(u, pictureOffset(u, upB)), layout, entryDepth(E, centre), E.centreDepth, 0)).toBe(layout);
            }
        }
        // no entry over an edge: none before, the same face, not a neighbour
        expect(entryEdgeOf(faces, 0, -1, UP)).toBeNull();
        expect(entryEdgeOf(faces, 0, 0, UP)).toBeNull();
        expect(entryEdgeOf(faces, 0, 99, UP)).toBeNull();
      });
});

describe("(ES) `transportUp` — the picture of the frame before carried to this view, not rolled: the entry continues it EXACTLY", () => {
  it("square to the new view; the old up when the view is unchanged; through the entry chain the free camera's up IS it; the bound upright instead is rolled", () => {
    const views: [Vec3, Vec3][] = [
      [norm([0.3, -0.7, -0.6]), norm([0.42, -0.78, -0.45])], // below a face, the view swinging 10° – 15° (the calm at an entry)
      [norm([-0.5, 0.6, 0.6]), norm([-0.35, 0.72, 0.55])], // above (a level top)
    ];
    for (const [u0, u1] of views)
      for (const dh of [-8, 0, 5]) {
        const up0 = offsetFrame(u0, head([u0[0], 0, u0[2]]) + dh * D, 0, 0).up;
        const T = transportUp(u0, up0, u1);
        expect(Math.abs(T[0] * u1[0] + T[1] * u1[1] + T[2] * u1[2])).toBeLessThan(1e-12);
        expect(Math.hypot(T[0], T[1], T[2])).toBeCloseTo(1, 12);
        const same = transportUp(u0, up0, u0);
        for (let k = 0; k < 3; k++) expect(same[k]).toBeCloseTo(up0[k]!, 12);
        // the free face's camera at the entry, its heading the picture's (the offset read on the carried up): its up IS the carried one
        const off = pictureOffset(u1, T);
        const h = entryBlendHeading(viewLevelTurned(u1, off), at(0.3), 0, C, 0);
        const up1 = offsetFrame(u1, freeHeadingAngle(h, u1), 0, 0).up;
        for (let k = 0; k < 3; k++) expect(up1[k]).toBeCloseTo(T[k]!, 9);
        // ⛔ the bound camera's upright at the new view instead: rolled by the view's swing (the 3° – 5° measured)
        const upB = offsetFrame(u1, head([u1[0], 0, u1[2]]) + dh * D, 0, 0).up;
        expect(Math.acos(Math.min(1, upB[0] * T[0] + upB[1] * T[1] + upB[2] * T[2])) / D).toBeGreaterThan(0.5);
      }
  });
  it("(v7 as kept, mutation-checked 2026-11-18) the ONE rotation taking `u0` onto `u1` turns `up0` exactly (the minimal rotation, about `u0 × u1`); an `up0` not square to `u0`, or not unit, comes out unit and square to `u1`", () => {
    const rotAbout = (v: Vec3, k: Vec3, a: number): Vec3 => {
      const c = Math.cos(a), sn = Math.sin(a), kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
      const kx: Vec3 = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      return [v[0] * c + kx[0] * sn + k[0] * kd * (1 - c), v[1] * c + kx[1] * sn + k[1] * kd * (1 - c), v[2] * c + kx[2] * sn + k[2] * kd * (1 - c)];
    };
    const u0 = norm([0.3, -0.7, -0.6]);
    for (const [kRaw, a] of [[[1, 0, 0], 12], [[0.2, 0.3, -0.9], -25], [[0, 1, 0], 40]] as [Vec3, number][]) {
      // an axis square to u0 (so the rotation is the minimal one from u0 to u1)
      const kd = kRaw[0] * u0[0] + kRaw[1] * u0[1] + kRaw[2] * u0[2];
      const k = norm([kRaw[0] - kd * u0[0], kRaw[1] - kd * u0[1], kRaw[2] - kd * u0[2]]);
      const u1 = rotAbout(u0, k, a * D);
      for (const dh of [-8, 0, 5]) {
        const up0 = offsetFrame(u0, head([u0[0], 0, u0[2]]) + dh * D, 0, 0).up;
        const want = rotAbout(up0, k, a * D);
        const T = transportUp(u0, up0, u1);
        for (let q = 0; q < 3; q++) expect(T[q]).toBeCloseTo(want[q]!, 12);
      }
      const skew: Vec3 = [0.2 + 0.5 * u0[0], 1.3 + 0.5 * u0[1], 0.1 + 0.5 * u0[2]]; // not square to u0, not unit
      const T = transportUp(u0, skew, u1);
      expect(Math.abs(T[0] * u1[0] + T[1] * u1[1] + T[2] * u1[2])).toBeLessThan(1e-12);
      expect(Math.hypot(T[0], T[1], T[2])).toBeCloseTo(1, 12);
    }
  });
});

// ⭐⭐⭐ (2026-11-18, v5 — `LEVEL_FACE_ENTRY.md` §16 fix round 1, §17) THE TARGET read every frame on the ENTRY side's bound camera: an exit back over the
// entry edge (depth ≤ 0, far out) meets the picture the bound face's camera shows there EXACTLY — the middle exit −5° / +4° → −0.2° / −0.2°, measured —
// and the side is the entry's, kept (above 60° of view the side's bias parts the two sides' pictures: read each frame, it flips across the axis)
describe("(v5) the target on the ENTRY side's bound camera (`spitCameraHeading` of the side kept, through `pictureOffset`)", () => {
  const AXIS: Vec3 = [1, 0, 0]; // a spit along x (Scene_0bis's long axis)
  const target = (u: Vec3, side0: number, depth: number, share: number, layout: Vec3): Vec3 =>
    entryBlendHeading(viewLevelTurned(u, pictureOffset(u, offsetFrame(u, spitCameraHeading(u, AXIS, side0), 0, 0).up)), layout, depth, C, share);
  it("at the entry edge and past it, far out: the free face's heading IS the bound camera's of that side — any view, below and above, the bias acting or not", () => {
    for (const e of [-80, -70, -62, -45, 45, 70])
      for (const yu of [-150, -95, -40, 30, 100])
        for (const side0 of [-1, 1]) {
          const u: Vec3 = [Math.cos(e * D) * Math.cos(yu * D), Math.sin(e * D), Math.cos(e * D) * Math.sin(yu * D)];
          for (const d of [0, -0.003]) {
            const T = target(u, side0, d, 0, LAYOUT);
            expect(Math.abs(wrap(freeHeadingAngle(T, u) - spitCameraHeading(u, AXIS, side0)))).toBeLessThan(1e-9);
          }
          expect(target(u, side0, 0, 1, LAYOUT)).toBe(LAYOUT); // close in: the layout exactly (cure a)
          expect(target(u, side0, C, 0, LAYOUT)).toBe(LAYOUT); // by the face's middle: the layout
        }
  });
  it("the side matters above 60° of view (the bias): the two sides' targets part there by over a degree — and not at all below 60°", () => {
    const steep: Vec3 = [Math.cos(72 * D) * Math.cos(-60 * D), -Math.sin(72 * D), Math.cos(72 * D) * Math.sin(-60 * D)];
    const gap = Math.abs(wrap(freeHeadingAngle(target(steep, 1, 0, 0, LAYOUT), steep) - freeHeadingAngle(target(steep, -1, 0, 0, LAYOUT), steep)));
    expect(gap / D).toBeGreaterThan(1);
    const low: Vec3 = [Math.cos(45 * D) * Math.cos(-60 * D), -Math.sin(45 * D), Math.cos(45 * D) * Math.sin(-60 * D)];
    expect(Math.abs(wrap(freeHeadingAngle(target(low, 1, 0, 0, LAYOUT), low) - freeHeadingAngle(target(low, -1, 0, 0, LAYOUT), low)))).toBeLessThan(1e-9);
  });
});

describe("the switch `freeEntryUpright` (0 or 1, the default 1) — validated as `freeFaceSquare`, a slider in POLAR ZONES, a URL override", () => {
  it("the default 1; 0 and 1 valid; anything else refused", () => {
    expect(DEFAULT_CONFIG.freeEntryUpright).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeEntryUpright: 0 })).not.toThrow();
    for (const v of [0.5, 2, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, freeEntryUpright: v })).toThrow();
  });

  it("wired: the depth read at the gizmo's place each frame (the MODEL's: `t.surface` through `B`); the switch 0 — no entry edge, the step never called; the frame's picture kept for the next entry; the frame time passed down to the step", () => {
    const src = raw("render/assembly_wiring.ts");
    expect(src).toMatch(/const entry = st\.cfg\.freeEntryUpright === 1 \? entryEdgeOf\(at\.contour, ci, from, WORLD_UP\) : null;/);
    expect(src).toMatch(/if \(fr\.entry !== null\) st\.asmFree = \{ \.\.\.fr, depth: entryDepth\(fr\.entry, mulM\(B, t\.surface\)\) \};/);
    expect(src).toMatch(/st\.asmSpitPicWas = st\.asmSpitPic;\s*st\.asmSpitPic = null;/);
    // ⭐ (v7) one heading for both branches: the free face's SHOWN one (its side passed down — the entry's side is kept from it), else the side's own
    const cf = fnCode("render/assembly_wiring.ts", "function assemblyCameraFrameRaw(");
    const hS = "const hS = st.asmFree !== null ? freeHeadingAngle(freeShownHeading(st, uW, side, dtMs), uW) : spitHeadingFor(st, uW, st.asmZone!.zone.axis, side);";
    expect(cf).toContain(hS);
    before(cf, "const side = st.asmSpitSide !== 0 ? st.asmSpitSide : spitSide(uW, st.asmZone!.zone.axis, 0);", hS);
    before(cf, hS, "st.asmSpitPic = { u: uW, up: offsetFrame(uW, hS, 0, 0).up };");
    before(cf, "st.asmSpitPic = { u: uW, up: offsetFrame(uW, hS, 0, 0).up };", "return offsetFrame(uW, hS, o.yawRad, o.pitchRad);");
    expect(cf).toContain("function assemblyCameraFrameRaw(st: SceneState, cam: OrbitAt, off?: CameraAngleOffset, dtMs?: number): RigCameraFrame {");
    expect(fnCode("render/assembly_wiring.ts", "export function assemblyCameraFrame(")).toContain("const f = assemblyCameraFrameRaw(st, cam, off, dtMs);");
    expect(fnCode("render/camera_rig.ts", "export function cameraFrameNow(")).toContain("if (assemblyOn(st)) return assemblyCameraFrame(st, cam, off, dtMs);");
    expect(src).not.toMatch(/viewElevation|FREE_ENTRY_FADE/); // ⛔ (cure a) the fade by the view's elevation
    const menu = raw("render/tuning_menu.ts");
    expect(menu).toContain('"freeEntryUpright", 0, 1, 1)');
  });

  // ⭐⭐⭐ (2026-11-18, v5 – v7, `LEVEL_FACE_ENTRY.md` §16 – §17) THE HEADING SHOWN, `freeShownHeading` (render: the state and the call) — its rules pinned
  // in their order; the pure functions it calls have their values above and below
  it("`freeShownHeading` (v5 – v7): the switch 0 / no edge returns the heading carried; the entry's SIDE kept from its first frame; the TARGET on that side's bound camera read EVERY frame; the entry frame the picture shown carried, at the EDGE's blend; HELD while a camera turn runs and on the frame it lands; else stepped on the glass", () => {
    const f = fnCode("render/assembly_wiring.ts", "function freeShownHeading(");
    const R = {
      none: "if (fr.entry === null) return fr.heading;",
      share: "const share = squareShareShown(st);",
      side0: "const side0 = fr.offset === null ? side : fr.side;", // (v5) the entry's side, kept for the face
      offB: "const offB = pictureOffset(uW, offsetFrame(uW, spitHeadingFor(st, uW, st.asmZone!.zone.axis, side0), 0, 0).up);", // (v5) every frame, on side0
      target: "const target = entryBlendHeading(viewLevelTurned(uW, offB), fr.layout, fr.depth, fr.entry.centreDepth, share, st.cfg.freeEntryUpright);",
      first: "if (fr.offset === null) {",
      offP: "const offP = was !== null ? pictureOffset(uW, transportUp(was.u, was.up, uW)) : offB;", // (v3) the picture shown, carried
      entryH: "h = entryBlendHeading(viewLevelTurned(uW, offP), fr.layout, Math.min(0, fr.depth), fr.entry.centreDepth, share, st.cfg.freeEntryUpright);",
      held: "} else if (st.asmZoneMix !== null || fr.turning) { h = fr.heading; }", // (v6) a turn under way, (v7) the frame it lands
      step: "} else h = dtMs === undefined ? target : headingStep(fr.heading, target, dtMs, st.cfg.tiltRollDegS, uW);",
      write: "st.asmFree = { ...fr, heading: h, offset: offB, side: side0, turning: st.asmZoneMix !== null }; return h;",
    };
    const order = Object.values(R);
    for (const r of order) expect(f, r).toContain(r);
    for (let i = 1; i < order.length; i++) before(f, order[i - 1]!, order[i]!);
    expect(f.match(/headingStep\(/g)?.length).toBe(1);
    expect(f.match(/st\.asmFree = /g)?.length).toBe(1);
    expect(f.match(/entryBlendHeading\(/g)?.length).toBe(2);
    // ⛔ the sway: the picture is read on the camera's own direction (the MODEL's, turned into the world) — nothing drawn
    expect(f).not.toMatch(/getBoundingInfo|pickWithRay|absolutePosition|computeWorldMatrix|cameraPrev|asmCamLast/);
  });
});
