/**
 * ⭐⭐ (2026-10-19, the owner: *"now there are as much quads as there are orientations of faces in the scene. this is too many quads. make the quads as many as
 * the orientations of the faces of the part which supports the gizmo."*) — the quads read from the gizmo's HOST part alone (`quadSourceIds`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRAVITY_FRAMES, quadSourceIds } from "../src/core/orientation_set";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const bodies = [
  { id: "Floor", frozen: true },
  { id: "Piece11", frozen: false },
  { id: "Piece42", frozen: false },
];

describe("⭐⭐ the quads from the gizmo's host part (2026-10-19)", () => {
  it("⭐⭐ the HOST alone when the gizmo rests on a part; with none, the FROZEN bodies; with none of those, nothing — gravity's frames (the owner)", () => {
    expect(quadSourceIds(bodies, "Piece42")).toEqual(["Piece42"]); // the frustum's 6 faces: 6 orientations, not the scene's
    expect(quadSourceIds(bodies, "Piece11")).toEqual(["Piece11"]);
    expect(quadSourceIds(bodies, "Floor")).toEqual(["Floor"]);
    expect(quadSourceIds(bodies, null)).toEqual(["Floor"]); // no host: the frozen body's faces
    expect(quadSourceIds(bodies, "Gone")).toEqual(["Floor"]); // a host no longer in the world: as with none
    expect(quadSourceIds([{ id: "Piece11", frozen: false }], null)).toEqual([]); // no host, nothing frozen: none — the caller takes gravity's
    expect(GRAVITY_FRAMES.map((f) => f.normal)).toEqual([[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]); // up, down, the horizontal plane
    for (const f of GRAVITY_FRAMES) for (const a of f.axes) expect(a[0] * f.normal[0] + a[1] * f.normal[1] + a[2] * f.normal[2]).toBe(0); // each axis in its face
  });
  it("⭐ wired: every gizmo move names its host (a tap, the held second touch, the boot, a respawn), the quads re-read on a change", () => {
    expect(code("render/green_box_wiring.ts")).toContain("const ids = quadSourceIds(bodies, st.gizmoHost ?? null); if (ids.length === 0) return GRAVITY_FRAMES.map((f) => ({ normal: f.normal, axes: f.axes }));");
    const c = code("render/camera_rig.ts");
    expect(c).toContain("export function retargetGizmo(st: SceneState, to: Vec3, normal: Vec3 | null, host: string | null = null): void {");
    expect(c).toContain("if ((st.gizmoHost ?? null) !== host) { st.gizmoHost = host; st.orientDirty = true; }");
    const p = code("render/pointer_wiring.ts");
    expect(p).toContain("host: st.idOf.get(mesh) ?? null,");
    expect(p).toContain("if (to !== null) retargetGizmo(st, to, pc.normal, pc.host ?? null);");
    expect(code("render/hold_wiring.ts")).toContain("h.centreNormal, h.centreHost ?? null);");
    expect(code("render/scene.ts")).toContain("st.bootGizmoHost = bootOnBlue !== null ? bootGizmoHostOf(st) : null;");
    expect(code("render/green_box_wiring.ts")).toContain("st.gizmoHost = st.bootGizmoHost ?? null;");
  });
});
