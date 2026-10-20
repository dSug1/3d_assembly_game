/**
 * ⭐⭐⭐ (2026-10-20, the owner: *"there are still too many quads. Just keep the three quads of the frozen object's faces orientations (or gravity and horizontal
 * planes) and the orientation of the face which supports the gizmo. that will be max 4 quads. always put them in the same order"* → *"don't duplicate the
 * quads if the orientation of the face supporting the gizmo is the same as one of the faces of the frozen object"*) — `quadFrames`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { distinctDirections, distinctPlanes, GRAVITY_FRAMES, quadFrames } from "../src/core/orientation_set";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
// the floor's six faces, listed in a scrambled order on purpose
const FLOOR = ([[0, 0, -1], [1, 0, 0], [0, -1, 0], [0, 0, 1], [0, 1, 0], [-1, 0, 0]] as Vec3[]).map((n) => ({ normal: n, axes: [] as Vec3[] }));
// Piece42's inclined top face (the frustum on Piece5's right face)
const TILTED = { normal: unit([0.53, 0.85, 0]), axes: [[0, 0, 1] as Vec3] };
const planes = (dirs: readonly { normal: Vec3 }[]) => distinctPlanes(dirs.map((d) => d.normal)).map((n) => n.map((x) => Math.round(x * 100) / 100 + 0));

describe("⭐⭐⭐ the quads: the frozen body's three planes, then the gizmo face's (2026-10-20)", () => {
  it("⭐⭐ a tilted gizmo face: FOUR quads, always the frozen body's three first (horizontal, then by heading), the gizmo's last", () => {
    const q = quadFrames(FLOOR, TILTED);
    expect(planes(q)).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1], [0.53, 0.85, 0]]);
    expect(planes(quadFrames([...FLOOR].reverse(), TILTED))).toEqual(planes(q)); // the faces' order changes nothing
    expect(planes(quadFrames(FLOOR, { ...TILTED, normal: unit([-0.53, -0.85, 0]) }))).toEqual(planes(q)); // the face's sense neither
  });
  it("⭐⭐ ⛔ NO DUPLICATE: a gizmo face along one of the three planes (either sense) adds nothing — three quads", () => {
    for (const n of [[0, 1, 0], [0, -1, 0], [1, 0, 0], [0, 0, -1], unit([1, 0.01, 0])] as Vec3[]) expect(planes(quadFrames(FLOOR, { normal: n, axes: [] }))).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1]]);
    expect(planes(quadFrames(FLOOR, null))).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1]]); // no gizmo face
  });
  it("⭐ no frozen body: gravity and the horizontal plane (the caller's GRAVITY_FRAMES) — the same three, then the gizmo's", () => {
    expect(planes(quadFrames(GRAVITY_FRAMES, TILTED))).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 1], [0.53, 0.85, 0]]);
  });
  it("⭐ three planes at most from the frozen body, whatever its faces; each quad both senses with its axes (a tap on either side of it)", () => {
    const many = [...FLOOR, { normal: unit([1, 0, 1]), axes: [] as Vec3[] }, { normal: unit([1, 1, 0]), axes: [] as Vec3[] }];
    expect(planes(quadFrames(many, TILTED)).length).toBe(4);
    const q = quadFrames(FLOOR, TILTED);
    expect(q.length).toBe(8);
    const d = distinctDirections(q);
    expect(d.length).toBe(8); // ± each
    const g = d.find((x) => x.normal[0] < -0.3 && x.normal[1] < -0.5)!; // the gizmo plane's other sense
    expect(Math.abs(g.axes[0]![2])).toBeCloseTo(1, 9); // the face's own axis kept
  });
  it("⭐ wired: the biggest frozen body, the gizmo's face from its host (its axes), its normal kept at every gizmo move, the boot and a respawn", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("return quadFrames(base.length > 0 ? base : GRAVITY_FRAMES, gizmo);");
    expect(g).toContain("const r = st.meshOf.get(id)?.getBoundingInfo().boundingSphere.radiusWorld ?? 0;");
    expect(g).toContain("st.gizmoNormal = st.bootGizmoNormal ?? null;");
    expect(code("render/camera_rig.ts")).toContain("st.gizmoNormal = normal;");
    expect(code("render/scene.ts")).toContain("st.gizmoNormal = st.bootGizmoNormal;");
  });
});
