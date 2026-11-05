/**
 * ⭐⭐⭐ THE CAMERA'S UP FROM THE PLACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3 — the owner: *"always maintain the scene upside up: for that,
 * tilt or roll the camera at the edge crossing as required"*): `src/input/camera_up.ts`, wired in `render/assembly_wiring.ts`. On a wall gravity's up; on a cap
 * its axis (the up of the edge it came over — no roll at a square crossing); within `cameraRollMm` of a cap ↔ wall edge the up rolled toward that edge's up,
 * committed at it — a HALF roll at a cap's far edge, a QUARTER at its side edge; never a jump. RED against `8dfa635` (§20's view rule: `placeUp` absent).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { UP_FRESH, placeUp, type UpPlace, type UpState } from "../src/input/camera_up";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
const unit = (u: Vec3): Vec3 => {
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};
const ROLL = 0.01;
const TOP: Vec3 = [0, 1, 0];
/** a 0.2 m top centred on the origin: the front edge at z = −0.1 (its up toward +z, back over the top), the back at +0.1 (up −z), the sides at x = ±0.1 (up ∓x) */
const topAt = (x: number, z: number): UpPlace => ({
  cap: TOP,
  edges: [
    { dist: z + 0.1, t: [0, 0, 1] },
    { dist: 0.1 - z, t: [0, 0, -1] },
    { dist: x + 0.1, t: [1, 0, 0] },
    { dist: 0.1 - x, t: [-1, 0, 0] },
  ],
});
/** the view from straight above, tilted a little toward the front (so +z is up the screen's way when the axis is +z) */
const above: Vec3 = unit([0, 1, -0.3]);
/** walk the gizmo's places; the up each step, the state carried */
function walk(places: readonly UpPlace[], u: Vec3 = above, s0: UpState = UP_FRESH): { ups: Vec3[]; s: UpState } {
  let s = s0;
  const ups: Vec3[] = [];
  for (const p of places) {
    const r = placeUp(u, p, s, ROLL);
    ups.push(r.up);
    s = r.next;
  }
  return { ups, s };
}
const worstStep = (ups: readonly Vec3[]) => ups.slice(1).reduce((w, v, i) => Math.max(w, angle(v, ups[i]!)), 0);

describe("the camera's up from the place (§21.4 R2 / R3)", () => {
  it("⭐ on a WALL, gravity's up on the screen; out of the band no roll", () => {
    const u = unit([0.3, 0.2, -1]);
    const r = placeUp(u, { cap: null, edges: [{ dist: 0.05, t: [0, 0, 1] }] }, UP_FRESH, ROLL);
    expect(r.band).toBe(false);
    const g = unit([-u[1] * u[0], 1 - u[1] * u[1], -u[1] * u[2]]);
    expect(angle(r.up, g)).toBeLessThan(1e-9);
  });

  it("⭐⭐ ON A CAP ENTERED SQUARE: its axis the edge's up — no roll (up the screen the way it was); the axis carried across the cap", () => {
    const { ups, s } = walk([-0.0999, -0.095, -0.09, -0.05, 0, 0.05].map((z) => topAt(0, z)));
    expect(s.axis).toEqual([0, 0, 1]);
    for (const up of ups) expect(up[2]).toBeGreaterThan(0.9); // +z up the screen (the view from above, a little toward the front)
  });

  it("⭐⭐⭐ THE FAR EDGE: a HALF roll over the last `cameraRollMm`, committed AT the edge — the axis then −z; no step over 2·(180°/steps); going back NOT undone", () => {
    const zs: number[] = [];
    for (let z = -0.05; z <= 0.1 + 1e-9; z += 0.0002) zs.push(z);
    const { ups, s } = walk(zs.map((z) => topAt(0, z)), above, { axis: [0, 0, 1] });
    expect(s.axis).toEqual([0, 0, -1]);
    expect(ups[0]![2]).toBeGreaterThan(0.9);
    expect(ups[ups.length - 1]![2]).toBeLessThan(-0.9);
    expect(worstStep(ups)).toBeLessThan(6 * D); // 180° over 50 steps, smoothstep's peak 1.5×
    // the roll starts only in the band
    const i9 = zs.findIndex((z) => z > 0.1 - ROLL - 1e-9);
    for (let i = 0; i < i9; i++) expect(ups[i]![2]).toBeGreaterThan(0.9);
    // back the other way: the axis kept (−z), until the FRONT edge — a half roll there again
    const back = walk(zs.slice().reverse().map((z) => topAt(0, z - 0.05)), above, s);
    expect(back.ups[1]![2]).toBeLessThan(-0.9);
  });

  it("⭐⭐ A SIDE EDGE: a QUARTER roll; the axis committed to the side's up", () => {
    const xs: number[] = [];
    for (let x = 0; x <= 0.1 + 1e-9; x += 0.0002) xs.push(x);
    const u = TOP;
    const { ups, s } = walk(xs.map((x) => topAt(x, 0)), u, { axis: [0, 0, 1] });
    expect(s.axis).toEqual([-1, 0, 0]);
    expect(angle(ups[0]!, [0, 0, 1])).toBeLessThan(1e-9);
    expect(angle(ups[ups.length - 1]!, [-1, 0, 0])).toBeLessThan(1e-9);
    expect(worstStep(ups)).toBeLessThan(3 * D);
  });

  it("⭐ on the WALL's side of an off-square edge, gravity rolled toward the edge's up over the band — continuous with the cap's side", () => {
    const u = unit([0.5, 0, -1]); // a view off square to the front
    const t: Vec3 = [0, 0, 1];
    const far = placeUp(u, { cap: null, edges: [{ dist: ROLL * 2, t }] }, UP_FRESH, ROLL);
    const at = placeUp(u, { cap: null, edges: [{ dist: 0, t }] }, UP_FRESH, ROLL);
    expect(far.band).toBe(false);
    expect(at.band).toBe(true);
    const tc = unit([t[0] - dot(t, u) * u[0], t[1] - dot(t, u) * u[1], t[2] - dot(t, u) * u[2]]);
    expect(angle(at.up, tc)).toBeLessThan(1e-6);
    expect(angle(far.up, [0, 1, 0])).toBeLessThan(1e-9);
  });

  it("⭐ wired: the camera's frame from the place (`placeUp`, `offsetWithUp`), the frame's own camera committing it; the place read after the gizmo", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const r = placeUp(u, st.asmUpPlace, st.asmUpState, st.cfg.cameraRollMm / 1000); if (commit) { st.asmUpState = r.next; st.asmUpBand = r.band; } return offsetWithUp(u, r.up, o.yawRad, o.pitchRad);");
    expect(a).toContain("st.asmUpPlace = upPlaceOf(st);");
    expect(a).not.toContain("cameraUp(");
    const c = readFileSync(new URL("../src/render/camera_rig.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(c).toContain("return assemblyCameraFrame(st, cam, off, dtMs !== undefined);");
  });
});
