// ⭐ (2026-11-24, S11 — ORBIT_SURFACE_L1.md §3) A MEASUREMENT, not a check: do today's DATA scenes have a SEALED or BURIED face, and cavities BETWEEN
// parts deeper than their mouth is wide? Each scene's plain BOXES only (⚠ its frusta and prisms left out — their sockets read as cavities), all at
// their spawn places as one placed set: B2's states at 2 mm (`exposedPerStage`), then packet 2's R1b on the set as ONE part (≈ 5 min on Scene_1).
// Usage: npx vite-node scripts/surface/l1_data_scenes.ts
import { SCENES } from "../../src/content/scenes";
import { exposedPerStage, type PartSolids } from "../../src/core/part_checks";
import { checkProxyCover } from "../../src/core/proxy_cover";
import type { Vec3 } from "../../src/core/vec";
for (const sc of SCENES) {
  const boxes = sc.bodies.filter((b) => b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity");
  const u = (sc as unknown as { unitM: number }).unitM * 1000;
  const parts: PartSolids[] = boxes.map((b) => {
    const m = b.margin ?? 0;
    const h = b.dims.map((d) => (d / 2 + m) * u);
    const c = b.position.map((x) => x * u);
    const P = (sx: number, sy: number, sz: number): Vec3 => [c[0]! + sx * h[0]!, c[1]! + sy * h[1]!, c[2]! + sz * h[2]!];
    const pts = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => P(k & 1 ? 1 : -1, k & 2 ? 1 : -1, k & 4 ? 1 : -1));
    // the six faces as triangles, outward
    const F: [number, number, number, number][] = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]];
    const raw: [number, number, number][] = F.flatMap(([a, b2, c2, d]) => [[a, b2, c2], [a, c2, d]] as [number, number, number][]);
    const tris = raw.map(([a, b2, c2]): [number, number, number] => {
      const A = pts[a]!, B = pts[b2]!, C = pts[c2]!;
      const n = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
      const g = [(A[0] + B[0] + C[0]) / 3 - c[0]!, (A[1] + B[1] + C[1]) / 3 - c[1]!, (A[2] + B[2] + C[2]) / 3 - c[2]!];
      return n[0]! * g[0]! + n[1]! * g[1]! + n[2]! * g[2]! >= 0 ? [a, b2, c2] : [a, c2, b2];
    });
    const mesh = { name: `UFM_${b.id}`, points: pts, triangles: tris };
    return { id: b.id, frozen: false, fitMm: 0.5, pieces: [{ name: `UCX_${b.id}`, points: pts, triangles: tris }], proxy: [mesh], renders: [] };
  });
  if (parts.length === 0) continue;
  const goals = new Map(parts.map((p) => [p.id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]));
  const m = exposedPerStage(parts, goals, new Set(parts.map((p) => p.id)), 2);
  const last = m.stages[m.stages.length - 1]!;
  const tot = last.parts.reduce((a, p) => ({ e: a.e + p.exposed, g: a.g + p.glued, b: a.b + p.buried, s: a.s + p.sealed }), { e: 0, g: 0, b: 0, s: 0 });
  console.log(`${sc.id}: ${parts.length} boxes of ${sc.bodies.length} bodies — triangles exposed ${tot.e}, glued ${tot.g}, buried ${tot.b}, SEALED ${tot.s}; sealed parts: ${last.parts.filter((p) => p.sealed > 0).map((p) => `${p.id}(${p.sealed})`).join(" ") || "none"}`);
  if (sc.id === "Scene_1" || sc.id === "Scene1_demo") {
    // ⭐ R1b on the assembled set as ONE part (its render = every box's faces): the cavities between parts deeper than their mouth is wide
    const t0 = performance.now();
    const one: PartSolids = { id: `${sc.id}_union`, frozen: false, fitMm: 0.5, pieces: parts.flatMap((p) => p.pieces), proxy: [{ name: "UFM_union_dummy", points: [[0, 0, 0], [1, 0, 0], [0, 1, 0]], triangles: [[0, 1, 2]] }], renders: parts.flatMap((p) => p.proxy) };
    const f = checkProxyCover([one]).filter((x) => x.rule === "R1b");
    console.log(`  R1b on ${sc.id}'s union (${((performance.now() - t0) / 1000).toFixed(0)} s): ${f.length ? f.map((x) => `${x.info ? "(info) " : ""}${x.detail}`).join(" | ") : "no cavity deeper than its mouth is wide"}`);
  }
}
