// ⭐⭐⭐ (2026-11-17, package LF1 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §3, §10; the owner: *"Agreed to every recommendation. Proceed."*)
// (A) THE LEVEL READING TAKES THE SQUARE CAMERA'S SHARE: close in the square camera shows the face along its normal, so the camera's heading toward the
// poles is the FACE's own heading, not the calm's (the leak: `Scene_0` close in, a slow dy down a leaning face near an end rolled the picture −11.1° in
// the 20 frames before the bottom's edge, then took 13.2° back in the edge's turn). `calmLevelHeading(yaw, calm, kH, squareShare)`: the calm's share
// times (1 − the square camera's share). RED against `a9b061f` (the share ignored: the face's heading never reached) and against the share the wrong
// way round (×share: far out no longer today's to the bit) and against the share applied before the fade behind the face.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calmLevelHeading, type CalmState } from "../src/input/orbit_calm";

const D = Math.PI / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** today's formula (`a9b061f`), kept to pin the share 0 to the bit */
function today(yaw: number, c: CalmState | null, kH = 0): number {
  if (c === null) return yaw;
  const hn = Math.hypot(c.n[0], c.n[2]);
  if (!(hn > 1e-3)) return yaw;
  const a = Math.atan2(Math.sin(yaw - Math.atan2(c.n[2], c.n[0])), Math.cos(yaw - Math.atan2(c.n[2], c.n[0])));
  const s0 = 1 - (1 - Math.min(1, Math.max(0, c.sH))) * (1 - Math.min(1, Math.max(0, kH)));
  const x = Math.min(1, Math.max(0, (Math.abs(a) - Math.PI / 2) / (Math.PI / 2)));
  const s = s0 + (1 - s0) * x * x * (3 - 2 * x);
  return yaw + (s - 1) * a;
}
// faces: Scene_1's front, the heptagon's lower front face (leaning), a face turned 40° about the vertical
const FACES: CalmState[] = [
  { n: [0, 0, -1], sH: 0.25, sV: 0.25, wA: 0 },
  { n: [0, -0.6235, -0.7818], sH: 0.25, sV: 0.25, wA: 0 },
  { n: [Math.sin(40 * D), 0.2, -Math.cos(40 * D)], sH: 0.6, sV: 0.25, wA: 0 },
];
const ownHeading = (c: CalmState) => Math.atan2(c.n[2], c.n[0]);

describe("(A) the level reading takes the square camera's share (`calmLevelHeading`, 4th argument)", () => {
  it("the share 0 (far out) is today's value BIT FOR BIT, on a grid of yaws, faces, shares and kH (and the argument left out)", () => {
    for (const c of FACES)
      for (let y = -180; y <= 180; y += 7.5)
        for (const kH of [0, 0.3, 1])
          for (const sH of [0, 0.25, 0.9]) {
            const cc = { ...c, sH };
            expect(calmLevelHeading(y * D, cc, kH, 0)).toBe(today(y * D, cc, kH));
            expect(calmLevelHeading(y * D, cc, kH)).toBe(today(y * D, cc, kH));
          }
    expect(calmLevelHeading(0.3, null, 0, 1)).toBe(0.3);
    expect(calmLevelHeading(0.3, { ...FACES[0]!, n: [0, -1, 0] }, 0, 1)).toBe(0.3); // a cap's normal: no heading of its own
  });

  it("the share 1 (the square camera whole) = the face's own heading, whatever the yaw and the calm — in front of the face and behind it", () => {
    for (const c of FACES)
      for (let y = -180; y <= 180; y += 7.5)
        for (const kH of [0, 0.5])
          expect(Math.abs(wrap(calmLevelHeading(y * D, c, kH, 1) - ownHeading(c)))).toBeLessThan(1e-12);
  });

  it("monotone in the share: from today's value to the face's own heading, never past it, never back (the near-end yaw 28° off the face)", () => {
    for (const c of FACES)
      for (const off of [-150, -28, -5, 12, 28, 100]) {
        const y = ownHeading(c) + off * D;
        let prev = Math.abs(wrap(calmLevelHeading(y, c, 0, 0) - ownHeading(c)));
        for (let q = 0.05; q <= 1.0001; q += 0.05) {
          const d = Math.abs(wrap(calmLevelHeading(y, c, 0, Math.min(1, q)) - ownHeading(c)));
          expect(d).toBeLessThanOrEqual(prev + 1e-12);
          prev = d;
        }
      }
    // out of [0, 1]: clamped
    expect(calmLevelHeading(0.4, FACES[1]!, 0, -2)).toBe(calmLevelHeading(0.4, FACES[1]!, 0, 0));
    expect(calmLevelHeading(0.4, FACES[1]!, 0, 3)).toBe(calmLevelHeading(0.4, FACES[1]!, 0, 1));
  });

  it("wired at the two calls (`calmFrame`, `levelHeadingOf`) with the share the square camera SHOWS (`squareShareShown`: as `calmDir` reads it)", () => {
    const src = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8");
    expect(src).toMatch(/const tgt = calmLevelHeading\(q\.yaw, st\.asmCalm, st\.asmCalmWhole, squareShareShown\(st\)\) - q\.yaw;/);
    expect(src).toMatch(/return st\.asmHeadO !== null \? yaw \+ st\.asmHeadO : calmLevelHeading\(yaw, st\.asmCalm, st\.asmCalmWhole, squareShareShown\(st\)\);/);
    expect(src).toMatch(/function squareShareShown\(st: SceneState\): number \{\n\s*const sq = st\.asmSquare;\n\s*return sq\.n === null \|\| !\(sq\.q > 0\) \? 0 : sq\.q;/);
    expect(src).toMatch(/if \(sq\.n === null \|\| !\(sq\.q > 0\)\) return base;/); // `calmDir`'s own reading of the share, the same
  });
});
