// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.7 R5 — `TOP_BOTTOM_STUDY.md` §3, §6, §9) THE FAR TARGET'S TOP RULE AS DECIDED
// (D-H13 – D-H19), behind `pictureOne` 1 — the pure rules (`src/input/camera_follow.ts`) and their wiring read in the sources.
// D-H19: the far reading — the calm asked's own WORLD heading below 50° of the orbit's world elevation, H2's level reading from 60°, a smoothstep
// between; a level face carried. The fixtures are the kit's `h5/band_sim.ts` / `ab_sim.ts` (`Scene_0bis`'s spit: F's y the world's x).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { farReading, farReadingShare, headingOf, levelledHeading } from "../src/input/camera_follow";
import { calmShown } from "../src/input/orbit_calm";
import { zoneFrame } from "../src/input/polar_zone";
import { mulT, tiltDir } from "../src/input/orbit_tilt";
import { orbitDir, vOfPitch } from "../src/input/assembly_orbit";

type V = [number, number, number];
const D = Math.PI / 180;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const un = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const between = (s: string, from: string, to: string): string => {
  const i = s.indexOf(from);
  const j = s.indexOf(to, i + from.length);
  expect(i).toBeGreaterThanOrEqual(0);
  expect(j).toBeGreaterThan(i);
  return s.slice(i, j);
};

// `Scene_0bis`'s spit: the zone's frame about the world's x (the heptagon's axis)
const R = zoneFrame([1, 0, 0]);
const RT = (w: V): V => mulT(R, w) as V;
/** the orbit at the world direction `uW`, the calm asked on the world facet `nW` with both shares `s`: the far reading and H2's */
const read = (uW: V, nW: V, s: number) => {
  const uF = RT(un(uW));
  const yaw = Math.atan2(uF[2], uF[0]);
  const v = vOfPitch(Math.asin(uF[1]));
  const c = { n: RT(un(nW)), sH: s, sV: s };
  return { far: farReading(yaw, v, c, R, 30, un(uW)), h2: levelledHeading(yaw, v, c, R, 30), own: headingOf(tiltDir(R, calmShown(orbitDir(yaw, v), c))) };
};
const SIDE_TRI: V = [0.88, 0.1, -0.46];
const UPPER_TRI: V = [0.88, 0.42, -0.21];

describe("R5 D-H19 — the far reading in the WORLD (the band of `cameraHeading` on the orbit's world elevation)", () => {
  it("the band's share: whole below 50°, none from 60°, a smoothstep between, up or down alike", () => {
    const at = (el: number): number => farReadingShare([0, Math.sin(el * D), Math.cos(el * D)]);
    expect([at(0), at(49.9), at(-49.9)]).toEqual([1, 1, 1]);
    expect(at(55)).toBeCloseTo(0.5, 9);
    expect([at(60), at(-60), at(75), at(90)]).toEqual([0, 0, 0, 0]);
  });

  it("A — the tips: the calm asked's own heading on the tip triangles (116 / 102 / 89°), where H2 reads square to the axis (180 / 180 / 0°)", () => {
    const side = read([0.3, 0.02, -0.12], SIDE_TRI, 0.3);
    const upper = read([0.3, 0.12, -0.05], UPPER_TRI, 0.3);
    const bottom = read([0.3, -0.12, 0.02], [0.89, -0.46, 1e-9], 0.3);
    expect(side.far! / D).toBeCloseTo(115.85, 1);
    expect(upper.far! / D).toBeCloseTo(102.21, 1);
    expect(bottom.far! / D).toBeCloseTo(88.82, 1);
    expect([side.h2! / D, upper.h2! / D, bottom.h2! / D].map((x) => Math.round(Math.abs(x)))).toEqual([180, 180, 0]);
  });

  it("B — the bottom triangle: no flip on a 1e-9 residue of its normal nor on the side of its middle line (H2: 180 / 90 / 0°)", () => {
    const far: number[] = [];
    const h2: number[] = [];
    for (const nz of [-1e-9, 0, 1e-9])
      for (const uz of [-0.02, 0.02]) {
        const r = read([0.3, -0.12, uz], [0.89, -0.46, nz], 0.3);
        far.push(r.far!);
        h2.push(r.h2!);
      }
    const spread = (a: number[]): number => Math.max(...a.map((x) => Math.abs(wrap(x - a[0]!)))) / D;
    expect(spread(far)).toBeLessThan(3);
    expect(spread(h2)).toBeGreaterThan(80);
  });

  it("the band's ends: below 50° of the WORLD elevation the calm asked's own heading; from 60° H2's level reading exactly — read on the world, never F's pitch", () => {
    // low in the world: the own heading
    const lo = read([0.3, 0.12, -0.05], UPPER_TRI, 0.3);
    expect(lo.far).toBe(lo.own);
    // high in the world (64°) but low in F (its pitch along the axis 5.6°): H2's reading, whole
    const uHi = un([0.1, 0.9, 0.42]);
    const hi = read(uHi, UPPER_TRI, 0.3);
    expect(Math.asin(uHi[1]) / D).toBeGreaterThan(60);
    expect(Math.abs(Math.asin(RT(uHi)[1]) / D)).toBeLessThan(10);
    expect(hi.far).toBe(hi.h2);
    expect(Math.abs(wrap(hi.own! - hi.h2!)) / D).toBeGreaterThan(5); // the two differ there: a read on F's pitch would take the own one
  });

  it("a LEVEL face carried at every elevation (`null`), low in the world too", () => {
    const yaw = 0.3;
    const v = vOfPitch(30 * D);
    const u = orbitDir(yaw, v);
    expect(Math.asin(u[1]) / D).toBeLessThan(50);
    expect(farReading(yaw, v, { n: [0, 1, 0], sH: 0.3, sV: 0.3 }, null, 30, u)).toBeNull();
    expect(farReading(yaw, v, { n: [0, -1, 0], sH: 0.3, sV: 0.3 }, null, 30, u)).toBeNull();
  });

  it("no calm (a cap's orbit): the orbit's own heading below the band, carried within the pole's cone as H2", () => {
    const v = vOfPitch(20 * D);
    const u = orbitDir(0.7, v);
    expect(farReading(0.7, v, null, null, 30, u)).toBeCloseTo(headingOf(u)!, 12);
    const vUp = vOfPitch(80 * D);
    expect(farReading(0.7, vUp, null, null, 30, orbitDir(0.7, vUp))).toBeNull();
  });

  it("wired: under the far rule as decided the reading at the rig's angles is `farAsked`'s (the band on the orbit's world direction); else H2's exactly", () => {
    const g = code("render/green_box_wiring.ts");
    const i = g.indexOf("st.asmAsk = askedDir(st, rig.yaw, rig.v);");
    const j = g.indexOf("st.asmAskLevel = st.cfg.followTop !== 1 ? null : farTopDecided(st) ? farAsked(st, rig.yaw, rig.v, st.asmAskCalm) : levelledAsked(st, rig.yaw, rig.v);");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    const a = code("render/assembly_wiring.ts");
    expect(between(a, "export function farTopDecided(", "export function farAsked(")).toContain("return st.cfg.pictureOne === 1 && st.cfg.cameraFollower === 1 && st.cfg.followTop === 1; }");
    expect(between(a, "export function farAsked(", "export function gizmoFacetW(")).toContain("return farReading(yaw, v, c, R, st.cfg.followPoleDeg, tiltDir(R, orbitDir(st.orbit.yaw, st.orbit.elevation))); }");
  });
});
