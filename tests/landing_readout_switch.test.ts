/**
 * ⭐⭐⭐ V4 — THE READOUT'S SWITCH, `landingReadout` (package S2, `ORBIT_SURFACE_READOUT.md` §5, §7): 0 / 1 only, 1 by default (his word *"proceed"*); READ
 * (`config_debt.test.ts`); in GIZMO & SECTIONS (`menu_layout.test.ts` pins the tree and the count, 136); ⛔ at 0 the module returns BEFORE ANY COMPUTATION —
 * proved on a state that throws at any read but `cfg`; the hook ONCE a frame, for the frame's own gizmo only; and ⛔ NOTHING READS ITS RESULT back.
 * RED on its mutant first (the switch read after the state is made: the guarded state's read throws) — the design document §13.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { landingLine, landingMarkerFrame, landingReadoutFrame, type GizmoRead, type ReadoutSource } from "../src/render/landing_readout";
import type { SceneState } from "../src/render/scene_state";
import type { FaceMap } from "../src/input/face_map";
import { qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import type { Turn } from "../src/core/landing_map";
import { bx, toConvex } from "./helpers/surface_shapes";

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = (f: string) => raw(f).replace(/\s+/g, " ");
/** ⛔ an object that throws at any read or write but the keys allowed */
function guarded<T extends object>(own: Record<string, unknown>, name: string): T {
  return new Proxy(own, {
    get(t, k) {
      if (typeof k === "string" && k in t) return t[k];
      throw new Error(`${name}.${String(k)} read`);
    },
    set(_t, k) {
      throw new Error(`${name}.${String(k)} written`);
    },
  }) as T;
}
const throwing = <T extends object>(name: string): T => guarded<T>({}, name);

describe("⭐⭐⭐ V4 — the switch `landingReadout`", () => {
  it("1 by default; validated 0 or 1 only", () => {
    expect(DEFAULT_CONFIG.landingReadout).toBe(1);
    for (const v of [0, 1]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingReadout: v })).not.toThrow();
    for (const v of [2, 0.5, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, landingReadout: v })).toThrow(/landingReadout/);
  });

  it("⛔ AT 0 THE MODULE RETURNS BEFORE ANY COMPUTATION — nothing of the state, the gizmo or the source read; no state made; no ring, no HUD line", () => {
    const st0 = guarded<SceneState>({ cfg: { landingReadout: 0 } }, "st");
    expect(() => landingReadoutFrame(st0, throwing<GizmoRead>("raw"), throwing<GizmoRead>("drawn"), throwing<ReadoutSource>("src"))).not.toThrow();
    expect(landingLine(st0)).toBe("");
    // the ring: at 0 only hidden if it exists (none here)
    expect(() => landingMarkerFrame(guarded<SceneState>({ cfg: { landingReadout: 0 }, landingMarker: null }, "st"))).not.toThrow();
    // ⭐ not vacuous: at 1 the same guarded state IS read
    const st1 = guarded<SceneState>({ cfg: { landingReadout: 1 } }, "st");
    expect(() => landingReadoutFrame(st1, throwing<GizmoRead>("raw"), throwing<GizmoRead>("drawn"), throwing<ReadoutSource>("src"))).toThrow(/read|written/);
  });

  it("READ and in the menu's GIZMO & SECTIONS: the readout's three entry points read the switch first", () => {
    const m = raw("render/tuning_menu.ts");
    const sub = m.indexOf('title: "GIZMO & SECTIONS"');
    const at = m.indexOf('"landingReadout", 0, 1, 1)');
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
    const r = code("render/landing_readout.ts");
    expect(r).toContain("export function landingReadoutFrame(st: SceneState, raw: GizmoRead | null, drawn: GizmoRead | null, src: ReadoutSource): void { if (st.cfg.landingReadout !== 1) return;");
    expect(r).toContain("export function landingMarkerFrame(st: SceneState): void { if (st.cfg.landingReadout !== 1) {");
    expect(r).toContain('export function landingLine(st: SceneState): string { if (st.cfg.landingReadout !== 1) return "";');
  });

  it("⭐ THE HOOK: once a frame, right after the frame's own gizmo (`rawGizmo` kept, `gizmoOf` its blend — `mapGizmo`'s same two steps), nowhere else", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("export function mapGizmo(st: SceneState, yaw: number, pitch: number): MapGizmo | null { return gizmoOf(st, yaw, pitch, rawGizmo(st, yaw, pitch)); }");
    expect(a).toContain("const mr0 = rawGizmo(st, mq.yaw, mq.pitch); const m0g = gizmoOf(st, mq.yaw, mq.pitch, mr0);");
    expect(a).toMatch(/const m0g = gizmoOf\(st, mq\.yaw, mq\.pitch, mr0\);( \/\/[^\n]*)? landingReadoutFrame\(st, mr0, m0g, READOUT_SOURCE\); if \(m0g !== null\) \{/);
    // ⛔ exactly one call in the product (not in the sections' samples, the edge blend's, the solver's queries)
    const calls = srcFiles().reduce((n, f) => n + (strip(readFileSync(f, "utf8")).match(/\blandingReadoutFrame\(/g) ?? []).length, 0);
    expect(calls).toBe(2); // its definition and its one call
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("restingFillFrame(st, now); landingMarkerFrame(st);"); // the ring after the gizmo's (`pinkRingFrame`), the camera as drawn
    expect(g.indexOf("landingMarkerFrame(st);")).toBeGreaterThan(g.indexOf("pinkRingFrame(st);"));
  });

  it("⛔ NOTHING READS ITS RESULT BACK: `st.landing` and its ring are touched only by its own module (and the state's declaration, its creation)", () => {
    const allowed = new Set(["src/render/landing_readout.ts", "src/render/scene_state.ts", "src/render/scene.ts"]);
    const readers: string[] = [];
    for (const f of srcFiles()) {
      const p = f.replace(/\\/g, "/");
      if (allowed.has(p)) continue;
      if (/\bst\.landing\b|\blandingMarker\b/.test(strip(readFileSync(f, "utf8")))) readers.push(p); // (the HUD's own field `f.landing` is its string)
    }
    expect(readers).toEqual([]);
    // the module's three entry points, each with its one reader: the hook, the ring after the gizmo's, the HUD
    const importers = srcFiles().filter((f) => /from "\.\/landing_readout"/.test(readFileSync(f, "utf8"))).map((f) => f.replace(/\\/g, "/")).sort();
    expect(importers).toEqual(["src/render/assembly_wiring.ts", "src/render/green_box_wiring.ts", "src/render/hud_paint.ts"]);
  });
});

describe("⭐⭐ V4b — the module AT 1 on a stub frame: the readout into `st.landing`, one preparation per facet under one key, the band, the HUD line", () => {
  const M = 0.001;
  const LOCAL: Vec3[] = [];
  for (const x of [-50, 50]) for (const y of [-10, 10]) for (const z of [-20, 20]) LOCAL.push([x * M, y * M, z * M]);
  const RC: Vec3 = [0, 0, 20 * M]; // turned 90° about x: its +z face down
  const placed = toConvex([bx("plate", -200, 200, 0, 40, -200, 200), bx("block", 60, 200, 40, 81, -200, 200)]);
  const Q90: Quat = qFromAxisAngle([1, 0, 0], Math.PI / 2);
  /** the stub frame; `turn` (R and the quaternion qR it is): the map's frame — the parts and the held piece turned by it in the world, the facets not */
  const make = (turn: { R: Turn; qR: Quat } | null = null, shared?: { readonly map: FaceMap }) => {
    const greenBox = { name: "g" };
    const objects = new Map<string, unknown>();
    const hold = (q: Quat) => objects.set("g", { id: "g", parent: null, local: { position: [0, 0.2, 0], orientation: turn === null ? q : qmul(turn.qR, q) }, shape: { points: LOCAL } });
    hold(Q90);
    const orbitPieces = [{ mesh: greenBox, restingCentre: RC }];
    const setRc = (rc: Vec3) => (orbitPieces[0] = { mesh: greenBox, restingCentre: rc });
    const st = { cfg: { landingReadout: 1 }, landing: null, greenBox, world: { objects }, orbitPieces, orbitPiecePlaced: false, frames: 7, sceneSpec: { id: "Scene_1" } } as unknown as SceneState;
    const map = shared?.map ?? ({ facets: [{ n: [0, 1, 0], t: [1, 0, 0], b: [0, 0, 1] }, { n: [1, 0, 0], t: [0, 0, -1], b: [0, 1, 0] }] } as unknown as FaceMap);
    const parts = turn === null ? placed : placed.map((p) => ({ id: p.id, points: p.points.map((q) => qRotate(turn.qR, q)) }));
    let frameR: Turn | null = turn?.R ?? null;
    const src: ReadoutSource = { map: () => map, frame: () => frameR, placed: () => ({ key: "plate|block", parts: parts.map((p) => p.points), ids: parts.map((p) => p.id) }) };
    /** the map's frame changed under the same map object and placed key (a zone's frame): the world's parts as they are */
    const reframe = (R: Turn) => {
      frameR = R;
    };
    return { st, src, hold, setRc, map, reframe };
  };
  const at = (x: number, y: number, stack = 0, n: Vec3 = [0, 1, 0]): GizmoRead => ({ hit: { point: [x * M, y * M, 0] }, t: { stack, normal: n, surface: [x * M, 40 * M, 0] } });
  const E0 = "0:0,1,0";
  /** the rows of the turn by `q` (`mulM`'s convention: R · v = qRotate(q, v)) */
  const rowsOf = (q: Quat): Turn => [0, 1, 2].map((i) => [0, 1, 2].map((j) => qRotate(q, [j === 0 ? 1 : 0, j === 1 ? 1 : 0, j === 2 ? 1 : 0])[i]!)) as unknown as Turn;
  const deltaMm = (st: SceneState) => {
    const r = st.landing!.shown!.readout;
    return r.kind === "land" ? r.delta / M : NaN;
  };

  it("Δ and the part at the gizmo's place; the drawn gizmo off today's point → `band`; the HUD line in the design's form", () => {
    const { st, src } = make();
    landingReadoutFrame(st, at(11, 40), at(11, 40), src);
    const sh = st.landing!.shown!;
    expect(sh.frame).toBe(7);
    expect(sh.readout.kind).toBe("land");
    if (sh.readout.kind === "land") {
      expect(Math.round(sh.readout.delta / M * 1e6) / 1e6).toBe(41); // within half a piece of the 41 mm block
      expect(sh.readout.part).toBe("block");
    }
    expect(sh.band).toBe(false);
    expect(landingLine(st)).toMatch(/^P2 Δ\+41\.0 mm {2}land block · prep \d+\.\d ms \(worst \d+\.\d\) · query \d+\.\d µs · facets 1$/);
    landingReadoutFrame(st, at(11, 40), at(12, 40), src);
    expect(st.landing!.shown!.band).toBe(true);
    expect(landingLine(st)).toContain("land block  band · prep");
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    expect(landingLine(st)).toMatch(/^P2 Δ\+0\.0 mm {2}land plate · /);
  });

  it("⭐ THE CACHE: the same key → the same preparation; another facet → a second one (one a frame); a TURN of the piece → all cleared, the current one again", () => {
    const { st, src, hold } = make();
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    const p0 = st.landing!.prepared.get(E0);
    expect(p0).toBeDefined();
    landingReadoutFrame(st, at(5, 40), at(5, 40), src);
    expect(st.landing!.prepared.get(E0)).toBe(p0); // not prepared again
    landingReadoutFrame(st, at(0, 40, 1, [1, 0, 0]), at(0, 40, 1, [1, 0, 0]), src);
    expect(st.landing!.prepared.size).toBe(2);
    expect(st.landing!.prepared.get(E0)).toBe(p0);
    hold(qFromAxisAngle([1, 0, 0], Math.PI / 2 + 1e-9)); // a turn of the piece, however small
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    expect(st.landing!.prepared.size).toBe(1);
    expect(st.landing!.prepared.get(E0)).not.toBe(p0);
  });

  it("⭐ (fix round 1, the audit) a CHANGE OF RESTING FACE with the SAME orientation (a tapped face, its turn refused) → prepared anew: P2 read from the new reference point", () => {
    const { st, src, setRc } = make();
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    const p0 = st.landing!.prepared.get(E0);
    expect(Math.abs(deltaMm(st))).toBeLessThan(1e-9);
    setRc([0, 0, -20 * M]); // its -z face, the one facing UP: the piece now hangs 40 mm below its reference point
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    expect(st.landing!.prepared.get(E0)).not.toBe(p0);
    expect(Math.abs(deltaMm(st) - 40)).toBeLessThan(1e-9);
  });

  it("⭐ (fix round 1) THE MAP'S FRAME (tilted or zoned, R not the identity): the place and today's point turned by R, the facet's axes by R — the same Δ as unturned; another R under the same map and placed key → prepared anew", () => {
    const qR = qFromAxisAngle([1, 2, 3], 0.7);
    const R = rowsOf(qR);
    const { st, src, map, reframe } = make({ R, qR });
    landingReadoutFrame(st, at(11, 40), at(11, 40), src);
    const r = st.landing!.shown!.readout;
    expect(r.kind === "land" && r.part).toBe("block");
    expect(Math.abs(deltaMm(st) - 41)).toBeLessThan(1e-9);
    const want = qRotate(qR, [11 * M, 81 * M, 0]); // the place turned, at P2's level
    for (let k = 0; k < 3; k++) expect(Math.abs(r.point[k]! - want[k]!), `point ${k}`).toBeLessThan(1e-12);
    // today's point higher on the same line (the map's frame): Δ follows today's level, turned by R
    landingReadoutFrame(st, { hit: { point: [11 * M, 60 * M, 0] }, t: at(11, 40).t }, at(11, 60), src);
    expect(Math.abs(deltaMm(st) - 21)).toBeLessThan(1e-9);
    // ⭐ another frame R2 under the SAME map object and placed key: prepared anew, the result a fresh state's
    const p0 = st.landing!.prepared.get(E0);
    const R2 = rowsOf(qmul(qFromAxisAngle([0, 1, 0], 0.4), qR));
    reframe(R2);
    landingReadoutFrame(st, at(11, 40), at(11, 40), src);
    expect(st.landing!.prepared.get(E0)).not.toBe(p0);
    const fresh = make({ R, qR }, { map });
    fresh.reframe(R2);
    landingReadoutFrame(fresh.st, at(11, 40), at(11, 40), fresh.src);
    expect(st.landing!.shown!.readout).toEqual(fresh.st.landing!.shown!.readout);
  });

  it("⭐ (fix round 1, D6) one preparation per facet AND NORMAL: the same stack read with another normal (a cap's) prepares anew — never the other normal's", () => {
    const { st, src } = make();
    landingReadoutFrame(st, at(11, 40), at(11, 40), src);
    const n2: Vec3 = [0, 0.8, 0.6];
    landingReadoutFrame(st, at(11, 40, 0, n2), at(11, 40, 0, n2), src);
    expect(st.landing!.prepared.size).toBe(2);
    const fresh = make();
    landingReadoutFrame(fresh.st, at(11, 40, 0, n2), at(11, 40, 0, n2), fresh.src);
    expect(st.landing!.shown!.readout).toEqual(fresh.st.landing!.shown!.readout);
  });

  it("⭐ (§13.4 D1) `Scene_1` ONLY: on another scene at 1 nothing is prepared, no readout, the line says so", () => {
    const { st, src } = make();
    (st as { sceneSpec: { id: string } }).sceneSpec = { id: "Scene_2" };
    landingReadoutFrame(st, at(11, 40), at(11, 40), src);
    expect(st.landing!.shown).toBeNull();
    expect(st.landing!.prepared.size).toBe(0);
    expect(landingLine(st)).toBe("— (Scene_1 only)");
  });

  it("no piece held / the piece placed / no gizmo: no readout (`—`), nothing prepared", () => {
    const { st, src } = make();
    (st as { orbitPiecePlaced: boolean }).orbitPiecePlaced = true;
    landingReadoutFrame(st, at(0, 40), at(0, 40), src);
    expect(st.landing!.shown).toBeNull();
    expect(st.landing!.prepared.size).toBe(0);
    expect(landingLine(st).startsWith("— · prep")).toBe(true);
    (st as { orbitPiecePlaced: boolean }).orbitPiecePlaced = false;
    landingReadoutFrame(st, null, null, src);
    expect(st.landing!.shown).toBeNull();
  });
});

function srcFiles(dir = "src", out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) srcFiles(p, out);
    else if (n.endsWith(".ts")) out.push(p);
  }
  return out;
}
/** comments stripped (a comment naming the symbol is not a reader) */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
