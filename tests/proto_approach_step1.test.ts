/**
 * ⭐⭐ prototype (green box) — APPROACH STEP 1: selection, the double tap, and the coarse push `w` (`GREEN_PIECE_PHASES.md` §3.1, §2;
 * the owner, 2026-10-04: *"If a face of the green piece is pressed upon, it is selected and highlighted in white"* — *"Double tap on
 * green piece unselects any face if not null"* — *"no camera reset. Count as an episode"* — *"the deadbanded dy accumulated since the
 * face was selected, in mm, signed so that toward the target is positive"* — *"Yes to both"*: the reference is the last press outside a
 * seated piece, and every press resets `w`).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { accumulatePush, greenDoubleTap, pickedFace, pieceFaces, towardSignAt } from "../src/input/green_box";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { meshTopology } from "../src/core/mesh_topology";
import { qFromAxisAngle, qRotate, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

// the green piece's frustum
function frustumFaces() {
  const W = 0.1035 / 2, H = 0.04125 / 2, D = 0.045 / 2;
  const c: Vec3[] = [
    [-W, -H, -D], [W, -H, -D], [W / 2, H, -D / 2], [-W / 2, H, -D / 2],
    [-W, -H, D], [W, -H, D], [W / 2, H, D / 2], [-W / 2, H, D / 2],
  ];
  const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  const t = meshTopology(new Float32Array(c.flat()), tris);
  return pieceFaces(t.positions, t.faces);
}

describe("⭐⭐ prototype — approach step 1: selection, the double tap, the coarse push", () => {
  it("⭐⭐ the pressed face is the one whose normal is closest to the pick's — in the piece's OWN frame, so a TUMBLED piece picks right", () => {
    const faces = frustumFaces();
    const q = qFromAxisAngle([1, 2, 3], 2.1); // tumbled
    for (let i = 0; i < faces.length; i++) {
      const world = qRotate(q, faces[i]!.normal);
      expect(pickedFace(faces, q, world)).toBe(i);
    }
    // ⛔ read in the WORLD frame (the identity), a tumbled piece's top would pick the wrong face
    const top = faces.findIndex((f) => f.normal[1] > 0.99);
    expect(pickedFace(faces, [1, 0, 0, 0], qRotate(q, faces[top]!.normal))).not.toBe(top);
    expect(pickedFace([], q, [0, 1, 0])).toBe(-1);
  });

  it("⭐ a double tap ON the green piece unselects (or does nothing with nothing selected); anywhere else it resets the camera, as ever", () => {
    expect(greenDoubleTap(true, true)).toBe("UNSELECT");
    expect(greenDoubleTap(true, false)).toBe("NOTHING");
    expect(greenDoubleTap(false, true)).toBe("RESET_CAMERA");
    expect(greenDoubleTap(false, false)).toBe("RESET_CAMERA");
  });

  it("⭐ 'toward the target' is the ring half's: above the waist (1st, 2nd rings) a positive dy is away (−1), below (3rd, 4th) toward (+1)", () => {
    expect(towardSignAt(0.8, 0.5)).toBe(-1);
    expect(towardSignAt(0.2, 0.5)).toBe(1);
    expect(towardSignAt(0.5, 0.5)).toBe(1); // the waist itself
  });

  it("⭐⭐ `w` SATURATES at the commits (the owner, on the glass: *\"I can bring w to a very negative value by pushing backwards … all the w values stay negative\"*)", () => {
    // pulled back 40 mm (the orbit stopped at the rings' end), then pushed toward 12 mm
    let w = 0;
    for (let i = 0; i < 40; i++) w = accumulatePush(w, -1, 6, 10);
    expect(w).toBe(-6); // ⛔ unbounded it was −40
    for (let i = 0; i < 12; i++) w = accumulatePush(w, 1, 6, 10);
    expect(w).toBe(6); // ⛔ unbounded it was still −28
    for (let i = 0; i < 20; i++) w = accumulatePush(w, 1, 6, 10);
    expect(w).toBe(10); // and no further than the forward commit
    expect(DEFAULT_CONFIG.greenCommitFwdMm).toBe(10);
    expect(DEFAULT_CONFIG.greenCommitBackMm).toBe(6);
  });

  it("⭐⭐ wired: the press on the piece selects (white, parented, lifted); every press outside a seated piece resets `w`; `w` is the DEADBANDED dy, signed; the double tap unselects and COUNTS", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/st\.greenPressedPointers\.add\(e\.pointerId\);\s*const nrm = pick\.getNormal\(true\);\s*if \(nrm\) selectGreenFace\(st, \[nrm\.x, nrm\.y, nrm\.z\]\);/);
    expect(p).toMatch(/if \(!goalLocked\(rawHitId, st\.goalCommit, st\.cfg\.lockPlacedPieces === 1\)\) resetGreenPush\(st\);/);
    expect(p).toMatch(/st\.greenPushMm = accumulatePush\(st\.greenPushMm, st\.greenTowardSign \* pxToMm\(st\.orbitMotion\.tracker\.step\.dy\), st\.cfg\.greenCommitBackMm, st\.cfg\.greenCommitFwdMm\);/);
    expect(p).toMatch(/const dt = greenDoubleTap\(st\.greenPressedPointers\.has\(e\.pointerId\), st\.greenSelectedFace !== null\);/);
    expect(p).toMatch(/if \(dt === "RESET_CAMERA"\) \{\s*resetCamera\(st\);/);
    // the episode: the unselecting double tap counts, and lands (the model itself is unchanged)
    expect(p).toMatch(/if \(greenUnselected\) st\.gestureChanged = true;/);
    expect(p).toMatch(/\(greenUnselected \|\| episodeCounts\(\{/);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const face = pickedFace\(topo\.faces, \[r\.w, r\.x, r\.y, r\.z\], worldNormal\);/);
    expect(w).toMatch(/mat\.emissiveColor = new Color3\(1, 1, 1\);/);
    expect(w).toMatch(/fill\.parent = box;/);
    // the whole-piece contour is OFF (§1: replaced by the selected face's white)
    expect(w).toMatch(/const GREEN_CONTOUR_ON = false;/);
    expect(w).toMatch(/st\.greenPushMm = 0;\s*st\.greenTowardSign = towardSignAt\(st\.orbit\.elevation, st\.greenWaistV\);/);
    expect(code("render/hud_paint.ts")).toMatch(/w=\$\{st\.greenPushMm >= 0 \? "\+" : ""\}\$\{st\.greenPushMm\.toFixed\(1\)\} mm F=/);
  });
});
