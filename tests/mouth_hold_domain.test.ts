/**
 * ⭐⭐⭐ S3 — THE MOUTH'S HOLD RESTRICTED (`ORBIT_SURFACE_MOUTH_HOLD.md` §4, §8; his Q4 (a) of 2026-11-16, *"Continue build"* 2026-11-23): V1 the domain
 * (`mouthHoldDomain`: never on a cap — H1; only over a void P2 leaves open for the held piece — H2), V1b P2's OPEN at a mouth (`heldReach`,
 * `voidOpenFor`), V2 the readout's evaluation asked by the hold (`landingReadoutFrame`'s `forHold`, `mouthP2`), V3 the switch and the wiring.
 * Each RED on its mutant first (the list and the red lines: the design document §10).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { heldPiece, heldReach, landingAxes, prepareLanding, readoutAt, voidOpenFor } from "../src/core/landing_map";
import { SURFACE_STEP_MIN_MM } from "../src/core/units";
import { qFromAxisAngle, type Quat, type Vec3 } from "../src/core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { FaceMap } from "../src/input/face_map";
import { mouthHoldDomain } from "../src/input/orbit_tilt";
import { landingReadoutFrame, mouthP2, type GizmoRead, type ReadoutSource } from "../src/render/landing_readout";
import type { SceneState } from "../src/render/scene_state";
import { bx, toConvex, type Part } from "./helpers/surface_shapes";

const M = 0.001;
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n").replace(/\s+/g, " ");
const BANDS = ["SIDE", "TOP", "BOTTOM"] as const;
const P2S = ["open", "closed", "unread"] as const;

describe("⭐⭐⭐ V1 — `mouthHoldDomain`: where a mouth may hold the gizmo", () => {
  it("0: the hold as built — every mouth kept, a cap's and a closed void's too", () => {
    for (const band of BANDS) for (const p2 of P2S) expect(mouthHoldDomain(0, band, p2), `${band} ${p2}`).toBe(true);
  });
  it("H1 — NEVER ON A CAP: on a TOP or BOTTOM band no mouth at 1 and at 2, whatever P2 says", () => {
    for (const lv of [1, 2]) for (const band of ["TOP", "BOTTOM"] as const) for (const p2 of P2S) expect(mouthHoldDomain(lv, band, p2), `${lv} ${band} ${p2}`).toBe(false);
  });
  it("on a side: 1 keeps every mouth (P2 not read); 2 keeps an OPEN or an UNREAD one (D2: his S10 where P2 cannot judge), drops a CLOSED one (H2)", () => {
    for (const p2 of P2S) expect(mouthHoldDomain(1, "SIDE", p2), p2).toBe(true);
    expect(mouthHoldDomain(2, "SIDE", "open")).toBe(true);
    expect(mouthHoldDomain(2, "SIDE", "unread")).toBe(true);
    expect(mouthHoldDomain(2, "SIDE", "closed")).toBe(false);
  });
});

// the held piece of the readout's vectors: 100 × 20 × 40 mm, its +z face (centre (0, 0, 20) mm) turned down — its resting face — AS HELD
const LOCAL: Vec3[] = [];
for (const x of [-50, 50]) for (const y of [-10, 10]) for (const z of [-20, 20]) LOCAL.push([x * M, y * M, z * M]);
const Q_HELD: Quat = qFromAxisAngle([1, 0, 0], Math.PI / 2);
const RC: Vec3 = [0, 0, 20 * M];
const HELD = [heldPiece(LOCAL, Q_HELD, RC)];
/** a SIDE facing +x (its plane x = 0) with a notch `w` mm wide (across it: z) from y 300 mm up to its top edge at 400 — closed across, open up the facet,
 *  right through (no floor); `back`: a wall that far (mm) behind the plane, inside the notch */
function side(w: number, back?: number): Part[] {
  const p: Part[] = [bx("A", -200, 0, 0, 400, -200, -w / 2), bx("B", -200, 0, 0, 400, w / 2, 200), bx("C", -200, 0, 0, 300, -w / 2, w / 2)];
  if (back !== undefined) p.push(bx("D", -400, -back, 300, 400, -w / 2, w / 2));
  return p;
}
const N: Vec3 = [1, 0, 0];
/** P2 at the place in the notch (y 350 mm), today's point the plane's — at a mouth today's gizmo IS the bridge */
const readSide = (parts: Part[]) => readoutAt(prepareLanding(toConvex(parts), HELD, landingAxes(N, [0, 0, -1], [0, 1, 0], null)), [0, 350 * M, 0], [0, 350 * M, 0]);
const mm = (r: ReturnType<typeof readSide>) => (r.kind === "land" ? Math.round((r.delta / M) * 1e6) / 1e6 : r.kind);

describe("⭐⭐⭐ V1b — P2's OPEN at a mouth (`heldReach`, `voidOpenFor`)", () => {
  it("the REACH: where the reference stands over a plane the piece rests on — 0 on its resting face, half its 100 mm on a side, 10 across, its 40 mm from below", () => {
    expect(heldReach(HELD, [0, 1, 0]) / M).toBeCloseTo(0, 9);
    expect(heldReach(HELD, N) / M).toBeCloseTo(50, 9);
    expect(heldReach(HELD, [0, 0, 1]) / M).toBeCloseTo(10, 9);
    expect(heldReach(HELD, [0, -1, 0]) / M).toBeCloseTo(40, 9);
  });
  it("a notch WIDER than the piece (60 mm across its 20), right through: P2 nothing → OPEN", () => {
    const r = readSide(side(60));
    expect(r.kind).toBe("nothing");
    expect(voidOpenFor(r, heldReach(HELD, N))).toBe(true);
  });
  it("a notch NARROWER than the piece (15 mm): P2 on the rims at its reach (Δ +50, half the piece as held) → CLOSED", () => {
    const r = readSide(side(15));
    expect(mm(r)).toBe(50);
    expect(voidOpenFor(r, heldReach(HELD, N))).toBe(false);
  });
  it("the piece ENTERING by more than Q6's step (a wall 20 mm behind: Δ +30 < 50 − 0.5) → OPEN; by less (0.4 mm: Δ +49.6) → CLOSED", () => {
    expect(SURFACE_STEP_MIN_MM).toBe(0.5);
    const deep = readSide(side(60, 20));
    expect(mm(deep)).toBe(30);
    expect(voidOpenFor(deep, heldReach(HELD, N))).toBe(true);
    const shallow = readSide(side(60, 0.4));
    expect(mm(shallow)).toBe(49.6);
    expect(voidOpenFor(shallow, heldReach(HELD, N))).toBe(false);
    // ⭐ (the audit, nit 4) the threshold pinned from BOTH sides: entering by 0.6 mm (Δ +49.4) is open
    const just = readSide(side(60, 0.6));
    expect(mm(just)).toBe(49.4);
    expect(voidOpenFor(just, heldReach(HELD, N))).toBe(true);
  });
});

describe("⭐⭐ V2 — the readout's evaluation ASKED BY THE HOLD (`forHold`) and its answer (`mouthP2`)", () => {
  const stub = (cfg: Record<string, number>, scene = "Scene_1") => {
    const greenBox = { name: "g" };
    const objects = new Map<string, unknown>([["g", { id: "g", parent: null, local: { position: [0, 0.2, 0], orientation: Q_HELD }, shape: { points: LOCAL } }]]);
    return { cfg, landing: null, greenBox, world: { objects }, orbitPieces: [{ mesh: greenBox, restingCentre: RC }], orbitPiecePlaced: false, frames: 3, sceneSpec: { id: scene } } as unknown as SceneState;
  };
  const map = { facets: [{ n: N, t: [0, 0, -1], b: [0, 1, 0] }] } as unknown as FaceMap;
  const srcOf = (parts: Part[]): ReadoutSource => {
    const c = toConvex(parts);
    return { map: () => map, frame: () => null, placed: () => ({ key: "k", parts: c.map((p) => p.points), ids: c.map((p) => p.id) }) };
  };
  const at: GizmoRead = { hit: { point: [0, 350 * M, 0] }, t: { stack: 0, normal: N, surface: [0, 350 * M, 0] } };

  it("at `landingReadout` 0 and NOT asked: nothing made — `mouthP2` unread", () => {
    const st = stub({ landingReadout: 0 });
    landingReadoutFrame(st, at, at, srcOf(side(60)), false);
    expect(st.landing).toBeNull();
    expect(mouthP2(st)).toBe("unread");
  });
  it("ASKED by the hold at `landingReadout` 0: P2 read at the place — open over the wide notch, closed over the narrow one", () => {
    const st = stub({ landingReadout: 0 });
    landingReadoutFrame(st, at, at, srcOf(side(60)), true);
    expect(mouthP2(st)).toBe("open");
    const st2 = stub({ landingReadout: 0 });
    landingReadoutFrame(st2, at, at, srcOf(side(15)), true);
    expect(mouthP2(st2)).toBe("closed");
  });
  it("only THIS frame's readout: a frame later, unread; outside `Scene_1` (the readout's D1), unread — D2", () => {
    const st = stub({ landingReadout: 1 });
    landingReadoutFrame(st, at, at, srcOf(side(15)), false);
    expect(mouthP2(st)).toBe("closed");
    (st as unknown as { frames: number }).frames = 4;
    expect(mouthP2(st)).toBe("unread");
    const s2 = stub({ landingReadout: 1 }, "Scene_2");
    landingReadoutFrame(s2, at, at, srcOf(side(15)), true);
    expect(mouthP2(s2)).toBe("unread");
  });
});

describe("⭐⭐ V3 — the switch `mouthHoldDomain` and the wiring", () => {
  it("0 / 1 / 2, 2 by default; validated; in GIZMO & SECTIONS", () => {
    expect(DEFAULT_CONFIG.mouthHoldDomain).toBe(2);
    for (const v of [0, 1, 2]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, mouthHoldDomain: v })).not.toThrow();
    for (const v of [3, 1.5, -1, Number.NaN]) expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, mouthHoldDomain: v })).toThrow(/mouthHoldDomain/);
    const m = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
    // ⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.7) in GIZMO & SECTIONS' subfolder THE ORBIT'S SURFACE (the surface's three switches together)
    const sub = m.indexOf(`title: "THE ORBIT'S SURFACE"`);
    const at = m.indexOf('"mouthHoldDomain", 0, 2, 1)');
    expect(sub).toBeGreaterThan(m.indexOf('title: "GIZMO & SECTIONS"'));
    expect(at).toBeGreaterThan(sub);
    expect(m.lastIndexOf("title:", at)).toBe(sub);
  });
  it("the frame's readout asked at a mouth only at 2; the domain read right before the hold; at 0 the mouth passed as built", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("landingReadoutFrame(st, mrT, mr0 === mrT ? m0g : gizmoOf(st, mq.yaw, mq.pitch, mrT), READOUT_SOURCE, st.cfg.mouthHoldDomain === 2 && m0g !== null && m0g.mouth !== undefined);"); // ⭐ (2026-11-23, S4) fed today's point
    expect(a).toContain("const mouthIn = m0g.mouth !== undefined && mouthHoldDomain(st.cfg.mouthHoldDomain, m0g.t.band, mouthP2(st)) ? m0g.mouth : null; const holdNow = mouthHold(wasHeld, mouthIn, dP, dY);");
  });
  it("⛔ (the audit, nit 5) P2 READ BACK BY ONE READER ONLY: `mouthP2` defined once and called once in the product — the hold's domain", () => {
    const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const src = (f: string) => strip(readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8"));
    const n = (f: string) => (src(f).match(/\bmouthP2\(/g) ?? []).length;
    expect(n("render/landing_readout.ts")).toBe(1); // its definition
    expect(n("render/assembly_wiring.ts")).toBe(1); // its one call
    for (const f of ["render/green_box_wiring.ts", "render/hud_paint.ts", "render/scene.ts", "input/orbit_tilt.ts", "input/assembly_orbit.ts"]) expect(n(f), f).toBe(0);
  });
});
