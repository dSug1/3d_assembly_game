/**
 * GOLDEN VECTORS — prototype: **THE QUADS GATE THE TURN** (2026-10-15, the owner; `input/quad_gate.ts`, `RESTING_FACE_ALIGNMENT.md` §30): a tap
 * turns the piece or picks its resting face only while the quads are shown; the hosting face's yellow is deleted; the resting face's contour is
 * green and shown with the quads or a slide; the unlit quads 30 % fainter; the quads hidden at 65 % of the farthest distance.
 */
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUAD_UNLIT_FILL_SHARE, quadEdgeAlpha, quadFillAlpha, quadTapsAllowed, restingContourShown } from "../src/input/quad_gate";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { quadsShownFromM } from "../src/core/orientation_set";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");

describe("⭐⭐⭐ the quads gate the turn (2026-10-15, the owner: *\"Allow the quad rotation on tap only if the quads are shown. Also, allow the resting face selection by tap on piece only if quads are shown.\"*)", () => {
  it("⭐⭐⭐ a tap turns the piece, or picks its resting face, only while the quads are shown", () => {
    expect(quadTapsAllowed(true)).toBe(true);
    expect(quadTapsAllowed(false)).toBe(false);
  });
  it("⭐⭐⭐ wired: the tap on empty space (first and second touch, through `orientTapShown`) and the tap on the piece (`selectRestingFace`) ask it first", () => {
    const q = code("render/orient_cube.ts");
    const tapShown = q.slice(q.indexOf("export function orientTapShown"));
    expect(tapShown.indexOf("if (!quadTapsAllowed(st.restingQuads?.shown === true)) return false;")).toBeGreaterThan(0);
    expect(tapShown.indexOf("if (!quadTapsAllowed(st.restingQuads?.shown === true)) return false;")).toBeLessThan(tapShown.indexOf("orientCubeTap(st, tag)"));
    const p = code("render/pointer_wiring.ts");
    const sel = p.slice(p.indexOf("function selectRestingFace"));
    expect(sel.indexOf("if (!quadTapsAllowed(st.restingQuads?.shown === true)) return false;")).toBeGreaterThan(0);
    expect(sel.indexOf("if (!quadTapsAllowed(st.restingQuads?.shown === true)) return false;")).toBeLessThan(sel.indexOf("restOnTappedFace(st, faceId)"));
    expect(code("render/hold_wiring.ts")).toContain("orientTapShown(st)"); // the second touch's tap goes through the same gate
  });
  it("⭐⭐⭐ the hosting face's yellow (and red) is DELETED, and with it the supporting face as the mating direction: the shown direction is the tapped one, else the candidate", () => {
    expect(existsSync(new URL("../src/input/support_face.ts", import.meta.url))).toBe(false);
    const q = code("render/orient_cube.ts");
    expect(q).not.toMatch(/supportFace|supportHighlight|support-face-outline/);
    expect(q).toContain("return st.orientShown.clicked?.tag ?? st.orientShown.candidate;");
    expect(code("render/scene_state.ts")).not.toMatch(/supportFace|supportHighlight/);
  });
});

describe("⭐⭐⭐ the resting face's contour (2026-10-15, the owner: *\"Hide the yellow highlight of the resting face when the quads are not shown. When the quads are shown, make the highlight of the resting face green (same as the highlight when sliding)\"*)", () => {
  it("⭐⭐⭐ shown with the quads, or while a slide is available or on; hidden otherwise", () => {
    expect(restingContourShown(true, false)).toBe(true);
    expect(restingContourShown(false, true)).toBe(true); // ⭐ *"Continue to green highlight the resting face … when sliding is allowed"*
    expect(restingContourShown(true, true)).toBe(true);
    expect(restingContourShown(false, false)).toBe(false);
  });
  it("⭐⭐⭐ wired: green (the slide's #D8FDD2), its visibility from the gate — ⛔ it was yellow and always shown", () => {
    const g = code("render/green_box_wiring.ts");
    // ⭐ in a LEAF module: green_box_wiring and hover_wiring import each other, and a colour one exported and the other read at its top level crashed the boot (TDZ)
    const col = readFileSync(new URL("../src/render/colours.ts", import.meta.url), "utf8");
    expect(col.replace(/\s+/g, " ")).toContain("export const RESTING_FACE_COLOUR = Color3.FromInts(216, 253, 210);");
    expect(col).not.toMatch(/from "\.\//); // imports nothing from the render layer
    expect(g).toContain('import { RESTING_FACE_COLOUR } from "./colours";');
    expect(g).toContain("contour.color = RESTING_FACE_COLOUR.clone();");
    expect(g).toContain("xray.color = RESTING_FACE_COLOUR.clone();");
    expect(g).toContain("const shown = restingContourShown(st.restingQuads?.shown === true, st.hoverReady !== null || st.hover !== null); for (const c of fill.getChildMeshes(true)) c.isVisible = shown;");
    expect(g).not.toContain("for (const c of fill.getChildMeshes(true)) c.isVisible = true;");
    const h = code("render/hover_wiring.ts");
    expect(h).toContain("const READY_COLOUR = RESTING_FACE_COLOUR;"); // ⭐ one colour, one place
    expect(h).toContain('import { RESTING_FACE_COLOUR } from "./colours";');
    expect(h).not.toMatch(/import \{[^}]*RESTING_FACE_COLOUR[^}]*\} from "\.\/green_box_wiring"/);
    expect(h).not.toContain("hoverTint");
  });
});

describe("⭐⭐ the quads (2026-10-15, the owner: *\"Make the quads' non-yellow edges highlight and their corresponding face fill 30% more transparent\"* · *\"quads are hidden when 65 % max travel distance is still remaining\"*)", () => {
  it("⭐⭐ (2026-10-15, the owner: *\"make a slider for non-yellow quad highlight transparency (edges and fill) just below pink gizmo slider\"*) an unlit quad's edges `quadUnlitAlpha` (0.1), its fill a quarter of it (0.025); the yellow one 1 and 0.12 — ⛔ 0.315 / 0.084, then 0.2 / 0.05, the same day", () => {
    expect(DEFAULT_CONFIG.quadUnlitAlpha).toBe(0.1);
    expect(QUAD_UNLIT_FILL_SHARE).toBe(0.25);
    expect(quadEdgeAlpha(false, 0.1)).toBe(0.1);
    expect(quadFillAlpha(false, 0.1)).toBeCloseTo(0.025, 12);
    expect(quadEdgeAlpha(false, 0.4)).toBe(0.4);
    expect(quadFillAlpha(false, 0.4)).toBeCloseTo(0.1, 12);
    expect(quadEdgeAlpha(true, 0.1)).toBe(1);
    expect(quadFillAlpha(true, 0.1)).toBe(0.12);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadUnlitAlpha: -0.1 })).toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, quadUnlitAlpha: 1.1 })).toThrow();
    const q = code("render/orient_cube.ts");
    expect(q).toContain("x.edges.alpha = quadEdgeAlpha(lit, st.cfg.quadUnlitAlpha);");
    expect(q).toContain("(x.fill.material as StandardMaterial).alpha = quadFillAlpha(lit, st.cfg.quadUnlitAlpha);");
    expect(q).not.toMatch(/QUAD_EDGE_ALPHA|QUAD_ALPHA\b/); // one place: `quad_gate.ts` and the tunable
    // the slider just below the (renamed) yellow gizmo's
    const m = code("render/tuning_menu.ts");
    const g = m.indexOf('"pinkGizmoVisible", 0, 1, 1)');
    const u = m.indexOf('"quadUnlitAlpha", 0, 1, 0.01)');
    expect(g).toBeGreaterThan(0);
    expect(u).toBeGreaterThan(g);
    expect(m.slice(g, u).split("tunable(st,").length - 1).toBe(1); // only its own call between them: just below
    expect(m).toContain('tunable(st, "yellow gizmo (the orbit centre\'s ring): shown (0 = hidden; 1 = shown)", "pinkGizmoVisible", 0, 1, 1)');
    expect(m).not.toContain('"pink gizmo (the orbit centre');
  });
  it("⭐⭐ hidden nearer than 65 % of the farthest distance — ⛔ half", () => {
    expect(quadsShownFromM(6)).toBeCloseTo(3.9, 12);
    expect(quadsShownFromM(1)).toBeCloseTo(0.65, 12);
  });
});

describe("⛔⛔ the quads' edges never faded (2026-10-15, the owner: *\"the slider does not change the opacity of the non-yellow quads' edges\"*)", () => {
  it("⛔⛔ Babylon: a line mesh BLENDS only when created with `useVertexAlpha: true` — without it its `alpha` is ignored (the default, despite the docs, is undefined)", async () => {
    const { NullEngine } = await import("@babylonjs/core/Engines/nullEngine");
    const { Scene } = await import("@babylonjs/core/scene");
    const { CreateLines } = await import("@babylonjs/core/Meshes/Builders/linesBuilder");
    const { Vector3 } = await import("@babylonjs/core/Maths/math.vector");
    const scene = new Scene(new NullEngine());
    const pts = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
    const plain = CreateLines("plain", { points: pts }, scene);
    const blended = CreateLines("blended", { points: pts, useVertexAlpha: true }, scene);
    expect(plain.material?.needAlphaBlending()).toBe(false); // ⛔ what the quads' edges were: opaque whatever the alpha
    expect(blended.material?.needAlphaBlending()).toBe(true);
  });
  it("⭐⭐ wired: the quads' edges are created blending", () => {
    expect(code("render/orient_cube.ts")).toContain("{ points: [...corners, corners[0]!].map((v) => new Vector3(v[0], v[1], v[2])), useVertexAlpha: true }");
  });
});
