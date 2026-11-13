// ⭐⭐⭐ THE TELEPORT CHECK (2026-11-12, the slide's rebuild) — reads a `walk_probe.mjs` recording (its `pm` rows: the piece's MODEL pose each frame, and
// its `hulls`: every part's convex parts in the world, the piece's own) and checks the piece's move between two frames against the parts, with the
// product's own GJK (`gapBetween`):
//   TUNNEL     the piece's SWEPT hull (the convex hull of its pose before and after: exact for a translation) meets a part neither pose meets — the piece
//              went THROUGH something (over a wall, from one channel to another)
//   INSIDE     a pose whose hull is in a part (gap 0) — the piece sunk into it
//   LEAP       a model step > 15 mm in one frame (the finger moves ≤ 4 px a frame) — a teleport even if nothing is crossed
// Usage: npx vite-node scripts/probes/walk_teleport.ts -- <recording.json> [--frames]
import { readFileSync } from "node:fs";
import { gapBetween } from "../../src/core/collision_shape";
import { qRotate, type Quat, type Vec3 } from "../../src/core/vec";

const args = process.argv.slice(2).filter((a) => a !== "--");
const file = args.find((a) => !a.startsWith("--"))!;
const verbose = args.includes("--frames");
const rec = JSON.parse(readFileSync(file, "utf8"));
const LEAP_M = 0.015;
type Box = { lo: Vec3; hi: Vec3 };
const boxOf = (pts: readonly Vec3[]): Box => {
  const lo: Vec3 = [Infinity, Infinity, Infinity];
  const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k]!, p[k]!);
    hi[k] = Math.max(hi[k]!, p[k]!);
  }
  return { lo, hi };
};
const boxesNear = (a: Box, b: Box, m: number): boolean => [0, 1, 2].every((k) => a.lo[k]! - m <= b.hi[k]! && b.lo[k]! - m <= a.hi[k]!);
const totals = { tunnel: 0, inside: 0, leap: 0, frames: 0 };
for (const sc of rec.results) {
  const parts: { id: string; pts: Vec3[]; box: Box }[] = (sc.hulls?.parts ?? []).map((p: { id: string; pts: Vec3[] }) => ({ ...p, box: boxOf(p.pts) }));
  const piece: Vec3[] = (sc.hulls?.piece ?? []).flat();
  if (parts.length === 0 || piece.length === 0) {
    console.log(`${sc.name}: ⚠ no hulls recorded — SKIPPED`);
    continue;
  }
  const poseOf = (pm: number[]): Vec3[] => {
    const q = [pm[3], pm[4], pm[5], pm[6]] as unknown as Quat;
    return piece.map((p) => {
      const r = qRotate(q, p);
      return [pm[0]! + r[0], pm[1]! + r[1], pm[2]! + r[2]] as Vec3;
    });
  };
  const gapTo = (pts: Vec3[], box: Box, part: { pts: Vec3[]; box: Box }): number => (boxesNear(box, part.box, 0.002) ? (gapBetween(pts, part.pts) ?? 0) : 1);
  let prev: { pts: Vec3[]; box: Box; pm: number[] } | null = null;
  const ev: string[] = [];
  let tunnel = 0, inside = 0, leap = 0;
  sc.rows.forEach((r: { pm: number[] | null; leg: string; tilt?: boolean; dist?: number | null; fd?: unknown }, i: number) => {
    if (!r.pm) {
      prev = null;
      return;
    }
    const pts = poseOf(r.pm);
    const box = boxOf(pts);
    for (const part of parts) {
      const g = gapTo(pts, box, part);
      if (g < 1e-5) {
        inside++;
        if (ev.length < 80) ev.push(`  INSIDE  f${i} ${r.leg} ${part.id} (gap ${(g * 1000).toFixed(2)} mm)`);
      }
    }
    if (prev !== null) {
      const step = Math.hypot(r.pm[0]! - prev.pm[0]!, r.pm[1]! - prev.pm[1]!, r.pm[2]! - prev.pm[2]!);
      // ⭐ an approach leg (A + drag: `a…`), the boot and a reset move the piece by design — a leap counts on an ORBIT leg only
      const orbitLeg = /^s\d/.test(r.leg) || /^s\d.*_rel$/.test(r.leg);
      // ⭐ close in only (the piece within 150 mm of its gizmo): far out a fast orbit moves the piece metres a second by design
      if (step > LEAP_M && orbitLeg && r.dist != null && r.dist < 0.15) {
        leap++;
        if (ev.length < 40) ev.push(`  LEAP    f${i} ${r.leg} ${(step * 1000).toFixed(1)} mm (tilt ${r.tilt ? "on" : "off"}, dist ${r.dist == null ? "-" : (r.dist * 1000).toFixed(0)} mm) ${prev.pm.slice(0, 3).map((x) => (x * 1000).toFixed(0)).join(",")} → ${r.pm.slice(0, 3).map((x) => (x * 1000).toFixed(0)).join(",")}`);
      }
      if (step > 1e-5) {
        const sw = [...prev.pts, ...pts];
        const sb = boxOf(sw);
        for (const part of parts) {
          const g = gapTo(sw, sb, part);
          if (!/^reset/.test(r.leg) && g < 1e-5 && gapTo(prev.pts, prev.box, part) > 1e-5 && gapTo(pts, box, part) > 1e-5) {
            tunnel++;
            const turn = (2 * Math.acos(Math.min(1, Math.abs(prev.pm[3]! * r.pm[3]! + prev.pm[4]! * r.pm[4]! + prev.pm[5]! * r.pm[5]! + prev.pm[6]! * r.pm[6]!))) * 180) / Math.PI;
            if (ev.length < 80) ev.push(`  TUNNEL  f${i} ${r.leg} through ${part.id}: ${(step * 1000).toFixed(1)} mm (tilt ${r.tilt ? "on" : "off"}, turn ${turn.toFixed(1)}°, dist ${r.dist == null ? "-" : (r.dist * 1000).toFixed(0)} mm) ${prev.pm.slice(0, 3).map((x) => (x * 1000).toFixed(0)).join(",")} → ${r.pm.slice(0, 3).map((x) => (x * 1000).toFixed(0)).join(",")}`);
          }
        }
      }
    }
    prev = { pts, box, pm: r.pm };
  });
  totals.tunnel += tunnel;
  totals.inside += inside;
  totals.leap += leap;
  totals.frames += sc.rows.length;
  console.log(`${sc.name}: ${sc.rows.length} frames — TUNNEL ${tunnel}, INSIDE ${inside}, LEAP ${leap}`);
  if (verbose || tunnel + inside + leap > 0) for (const e of ev) console.log(e);
}
console.log(`TOTAL ${totals.frames} frames — TUNNEL ${totals.tunnel}, INSIDE ${totals.inside}, LEAP ${totals.leap}`);
