/**
 * GOLDEN VECTORS — **prototype (green box): THE GREEN BOX** (the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the
 * smallest yellow box"*; *"the green cube shall billboard the camera"*; then, PROTOTYPE: *"swap the camera by the green box.
 * the green box orbits with the same inputs as the camera did before"* — *"the camera now lerp follows the green box,
 * always slerp looking at the green box"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sizeM, smallestOfColour } from "@input/green_box";
import { cameraOffset, cameraOrbitAt, cameraOrbitStep, easeOrbit, springOrbit, pitchOf, wrapPi, type OrbitAt } from "@input/follow_camera";
import { orbitOffset } from "@input/orbit";
import { DEFAULT_CONFIG } from "@input/gestureConfig";
import { SCENE_1, SCENE_1_PALETTE, SCENE_1_TABLE } from "../src/content/scene_1";
import { RIG_3M } from "./helpers/rig_3m"; // ⭐ (2026-10-12) the rig these vectors were written on
import { SCENE_0 } from "../src/content/scene_0";
import { parseSceneDescriptor, serializeSceneDescriptor } from "../src/core/game_structure";

const code = (f: string) =>
  readFileSync(new URL(`../src/render/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("⭐⭐ prototype — the green box", () => {
  it("⭐ its size is the smallest yellow piece's coloured core — Scene_1's Piece6, 65 × 37 × 30 mm", () => {
    // ⭐ (2026-11-08) on the owner's TABLE (the painting): the level's seated boxes are 4.8 deep since the cube
    const y = smallestOfColour(SCENE_1_TABLE.bodies, SCENE_1_PALETTE.MAT_C)!;
    expect(y.id).toBe("Piece6");
    const s = sizeM(y.dims, SCENE_1.unitM!);
    expect(s[0]).toBeCloseTo(0.065, 9);
    expect(s[1]).toBeCloseTo(0.037, 9);
    expect(s[2]).toBeCloseTo(0.03, 9);
  });

  it("⭐ by VOLUME, among the yellow ones only; a scene with no yellow body has no box", () => {
    const yellows = SCENE_1.bodies.filter((b) => b.colour.every((c, i) => c === SCENE_1_PALETTE.MAT_C[i])).map((b) => b.id);
    expect(yellows.sort()).toEqual(["Piece17", "Piece19", "Piece6"]);
    expect(smallestOfColour(SCENE_0.bodies, SCENE_1_PALETTE.MAT_C)).toBeNull();
  });

  const CFG = DEFAULT_CONFIG;
  const P = { restTauMs: 120 }; // ⛔ (2026-11-13) no leash, no settle delay: deleted
  const DEG = Math.PI / 180;

  const len = (v: readonly number[]) => Math.hypot(v[0]!, v[1]!, v[2]!);
  const NO_OFFSET = { yawRad: 0, pitchRad: 0 };

  it("⭐⭐ prototype: aligned, the camera is on the box's line, at the box's radius + the radius offset", () => {
    const at: OrbitAt = { yaw: 0.7, v: 0.3 };
    const o = orbitOffset(CFG, at.yaw, at.v, 1.4).offsetM;
    const c = cameraOffset(CFG, at, o, NO_OFFSET, 0.8);
    const k = (len(o) + 0.8) / len(o);
    [0, 1, 2].forEach((i) => expect(c[i]).toBeCloseTo(k * o[i]!, 12));
  });

  it("⛔⛔ prototype: LAGGING in pitch, the camera keeps the box's DISTANCE + the offset — the box never comes near it", () => {
    // ⭐ the box pitched up to the top ring (far out), the camera still at the middle ring's pitch: the rings are not a
    // sphere, so a camera on its OWN ring point would sit barely past the box (measured: box 2.79 m, camera ~3 m)
    const box = orbitOffset(CFG, 0, 1, 1.48).offsetM;
    const c = cameraOffset(CFG, { yaw: 0, v: 0.5 }, box, NO_OFFSET, 1.5);
    expect(len(c)).toBeCloseTo(len(box) + 1.5, 12);
    const own = orbitOffset(CFG, 0, 0.5, 1.48).offsetM;
    expect(len(own) * 2).toBeLessThan(len(box) * 1.5); // the first rule's camera: barely past the box
  });

  it("⭐ prototype: the owner's offsets turn the camera's angles — yaw about the vertical, pitch up", () => {
    const at: OrbitAt = { yaw: 0, v: 0.5 };
    const box = orbitOffset(CFG, 0, 0.5, 1).offsetM;
    const c = cameraOffset(CFG, at, box, { yawRad: 10 * DEG, pitchRad: 5 * DEG }, 1.5);
    expect((Math.atan2(c[2], c[0]) * 180) / Math.PI).toBeCloseTo(10, 9);
    expect((Math.atan2(c[1], Math.hypot(c[0], c[2])) * 180) / Math.PI).toBeCloseTo((pitchOf(CFG, 0.5) * 180) / Math.PI + 5, 9);
  });

  // ⛔⛔ (2026-11-13, the owner: *"remove all the float sliders which are currently set to zero"*) the follow camera's LEASH, SETTLE DELAY and TIME LAG
  // (`cameraLeashDeg`, `cameraSettleDelayMs`, `cameraFollowMs`, all 0) and the box's gain inside the leash deleted — their vectors with them; the step at 0
  // replayed bit for bit: `zero_sliders_removed.test.ts`.
  it("⭐⭐ prototype: the box EASES after the rig — part-way each frame, yaw the short way, zoom geometric, then arrives", () => {
    let b = { yaw: 175 * DEG, v: 0.2, zoom: 1 };
    const rig = { yaw: -175 * DEG, v: 0.6, zoom: 2 };
    const first = easeOrbit(b, rig, 16, 60);
    expect(first.yaw).toBeGreaterThan(175 * DEG); // forward through 180°, not back through 0
    expect(first.v).toBeGreaterThan(0.2);
    expect(first.v).toBeLessThan(0.6);
    for (let i = 0; i < 100; i++) b = easeOrbit(b, rig, 16, 60);
    expect(Math.abs(wrapPi(b.yaw - rig.yaw))).toBeLessThan(1e-9);
    expect(b.v).toBeCloseTo(0.6, 9);
    expect(b.zoom).toBeCloseTo(2, 9);
    // 0 ms = no ease: at once
    expect(easeOrbit({ yaw: 0, v: 0, zoom: 1 }, rig, 16, 0)).toEqual(rig);
  });

  it("⭐⭐ prototype: the box rides a SPRING — no speed jump at an event, so a time-lagged camera no longer shows a pulse (2026-10-02)", () => {
    // the owner: *"the camera lag at 30 ms create jitter in the green box visualization. can you improve"*
    const target = { yaw: 10 * DEG, v: 0.5, zoom: 1 };
    // ⭐ a step in the target starts it from REST: its first-frame speed is far below the exponential's
    const s1 = springOrbit({ at: { yaw: 0, v: 0.5, zoom: 1 }, velYaw: 0, velV: 0, velLnZoom: 0 }, target, 16, 30);
    const e1 = easeOrbit({ yaw: 0, v: 0.5, zoom: 1 }, target, 16, 60);
    expect(s1.at.yaw).toBeLessThan(e1.yaw / 2);
    // converges, the short way round, zoom in log space
    let s = s1;
    for (let i = 0; i < 200; i++) s = springOrbit(s, target, 16, 30);
    expect(Math.abs(s.at.yaw - target.yaw)).toBeLessThan(1e-6);
    const w = springOrbit({ at: { yaw: 175 * DEG, v: 0.5, zoom: 1 }, velYaw: 0, velV: 0, velLnZoom: 0 }, { yaw: -175 * DEG, v: 0.5, zoom: 2 }, 16, 30);
    expect(wrapPi(w.at.yaw - 175 * DEG)).toBeGreaterThan(0); // toward −175° the short way: forward through 180°
    expect(w.at.zoom).toBeGreaterThan(1);
    // ⛔ (2026-11-13) its ripple against a 30 ms LAGGED camera deleted with the lag (`cameraLag`)
  });

  it("⭐ prototype: yaw is compared the short way round", () => {
    const s = cameraOrbitStep(cameraOrbitAt({ yaw: 175 * DEG, v: 0.5 }, 0, CFG), { yaw: -165 * DEG, v: 0.5 }, 16, 16, CFG, P);
    // −165° is 20° PAST 175°, not 340° before it: moved FORWARD onto it (⛔ 2026-11-13 no leash: on the box, no longer 15° behind at 180°)
    expect(s.cam.yaw).toBeCloseTo(195 * DEG, 9);
  });

  it("⭐ wired: the rig drives the box, the camera follows every frame before the draw; NOT billboarded (2026-10-02), no parent", () => {
    expect(code("scene.ts")).toMatch(/createGreenBox\(st\)/);
    expect(code("camera_rig.ts")).toMatch(/st\.greenBoxRigM = \[/);
    const loop = code("render_loop.ts");
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeGreaterThan(0);
    expect(loop.indexOf("greenBoxFrame(st, dtSec)")).toBeLessThan(loop.indexOf("st.scene.render()"));
    const w = code("green_box_wiring.ts");
    expect(w).toMatch(/cameraOrbitStep\(\s*st\.cameraOrbit,\s*at,/);
    // ⭐ 2026-10-02: on a critically damped spring (it was `easeOrbit`, one exponential)
    expect(w).toMatch(/springOrbit\(st\.boxSpring, rig, dtSec \* 1000, st\.cfg\.orbitSpringMs\)/);
    expect(w).toMatch(/st\.boxOrbit = st\.boxSpring\.at;/);
    // ⭐ the owner: the camera looks at the yellow target — the orbit centre
    // ⭐ (2026-10-06) the camera looks at ITS centre — the orbit centre, or the piece once orbiting around it (`piece_orbit.ts`)
    expect(w).toMatch(/st\.camera\.setTarget\(new Vector3\(lookAt\[0\], lookAt\[1\], lookAt\[2\]\)\)/);
    // around the centre as before: the camera at its offset from the centre, looking at it (`piece_orbit.ts` takes over after an alignment)
    // ⛔ (2026-10-25) the camera's centre the gizmo — no lift through the waist (`topFaceAimLift`, 2026-10-22, deleted)
    expect(w).toMatch(/camAt = \[c\.x \+ o\[0\], c\.y \+ o\[1\], c\.z \+ o\[2\]\];\s*lookAt = \[c\.x, c\.y, c\.z\];/);
    // ⭐ the owner, 2026-10-02: *"remove the billboarding"*
    expect(w).toMatch(/box\.billboardMode = Mesh\.BILLBOARDMODE_NONE/);
    expect(w).not.toMatch(/box\.billboardMode = Mesh\.BILLBOARDMODE_ALL/);
    // the box itself has no parent — only its yellow RESTING FACE rides it (2026-10-05; its white contour went with the rotation)
    expect(w).not.toMatch(/box\.parent\s*=/);
    expect(w.match(/\.parent\s*=/g) ?? []).toHaveLength(3); // ⭐ (2026-10-12) the resting face's fill, its yellow contour and the contour's x-ray twin
    expect(w).toMatch(/fill\.parent = m;/);
    expect(w).not.toMatch(/fill\.parent = mesh;/); // ⛔ (2026-10-12) the part's pink face fill deleted
    expect(w).toContain("contour.parent = fill;"); // ⭐ (2026-10-12) the yellow contour rides the fill's lift
    expect(w).toContain("xray.parent = fill;"); // and its x-ray twin
  });

  it("⭐⭐ prototype: a press on the green box is EMPTY SPACE — the box stops the ray, and its hit is a miss (the owner: *\"the raycast hits the piece behind\"*)", () => {
    // ⭐ wired: the box is PICKABLE (so the ray stops on it), and a hit on it is never a part's (⛔ 2026-11-02 `throughGreenBox` deleted with the
    // parts' hold, `d8134eb`: every press is the orbit's)
    expect(code("green_box_wiring.ts")).toMatch(/box\.isPickable = true/);
    const p = code("pointer_wiring.ts");
    expect(p).toContain("const hitMesh = pick?.hit === true && pick.pickedMesh !== null && pick.pickedMesh !== st.greenBox ? pick.pickedMesh : null;");
    expect(p).toContain("const routed = st.router.press(e.pointerId, s, null);");
  });

  it("⭐ prototype: the camera's defaults behind the green piece (⛔ 2026-11-13 the boot zoom deleted with the zoom — `zoom_removed.test.ts`)", () => {
    expect(DEFAULT_CONFIG.cameraRadiusOffsetMm).toBe(1250);
  });

  it("⭐ prototype: Scene_1 boots on the TOP ring (the owner: *\"boot scene 1 on the top ring\"*)", () => {
    expect(SCENE_1.bootView).toBe("TOP");
    expect(code("scene.ts")).toMatch(/: st\.sceneSpec\.bootView === "TOP"\s*\? bootDistanceM !== undefined\s*\? elevationAtDistance\(st\.cfg, bootDistanceM\)\s*: 1/); // ⭐ (2026-10-12) at 3 m on the way up
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).bootView).toBe("TOP"); // the JSON seam keeps it
  });

  it("⛔⛔ the yellow marker is placed at BOOT, on the orbit centre — it sat at the origin until the first orbit (since `D169`)", () => {
    const scene = code("scene.ts");
    const blend = scene.indexOf("st.centreBlend = new OrbitCentreBlend(");
    const sync = scene.indexOf("syncCentre(st)", blend);
    expect(blend).toBeGreaterThan(0);
    expect(sync).toBeGreaterThan(blend);
  });
});

/* ⛔ (2026-11-13) the CAMERA menu's subsections (2026-10-02) replaced by the menu by subject — `menu_layout.test.ts`. */

describe("⛔⛔ prototype — NO STAIR between the rings: the camera's pitch axis runs on the ring position (the owner, 2026-10-02: *\"there is still a 'stair' effect at the transitions between rings\"*)", () => {
  const DEG = Math.PI / 180;
  it("⛔ on the waist the pitch angle is NOT monotone — it overshoots the top ring's pitch, then comes back", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const cfg = sceneConfig(DEFAULT_CONFIG, RIG_3M);
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => pitchOf(cfg, 0.5 + i * 0.005)));
    expect(peak).toBeGreaterThan(pitchOf(cfg, 1) + 1 * DEG); // 34.06° against 31.7°
  });

  it("⭐⭐ with the leash at 0, a dy sweep middle → top → middle: the camera sits EXACTLY on the green piece's pitch all the way", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const cfg = sceneConfig(DEFAULT_CONFIG, RIG_3M);
    const P0 = { restTauMs: 120 }; // ⛔ (2026-11-13) no leash, no settle delay: deleted
    let s = cameraOrbitAt({ yaw: 0, v: 0.5 }, 0, cfg);
    let worst = 0;
    const path = [...Array.from({ length: 100 }, (_, i) => 0.5 + (i + 1) * 0.005), ...Array.from({ length: 100 }, (_, i) => 1 - (i + 1) * 0.005)];
    path.forEach((v, f) => {
      const box = { yaw: 0, v };
      s = cameraOrbitStep(s, box, (f + 1) * 16, 16, cfg, P0, box, { yaw: false, pitch: true, holdMs: 150 });
      worst = Math.max(worst, Math.abs(pitchOf(cfg, s.cam.v) - pitchOf(cfg, v)));
    });
    expect(worst / DEG).toBeLessThan(0.01); // ⛔ was 2.4° — the camera clamped at the top ring's pitch, then snapped back
  });
});

describe("⭐⭐ prototype — Scene_1's rings are a smooth WAIST (the owner, 2026-10-02: *\"the shape shall be a waist … propose the three missing parameters so that the 2D curve … can be smooth\"*)", () => {
  it("⭐ the outer rings stay under the 3 m clamp (the rig at 1 — ⛔ 2026-11-13 no zoom); ⛔ the middle ring NO LONGER clears the painting (the owner's 0.09 m, 2026-10-02)", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const cfg = sceneConfig(DEFAULT_CONFIG, RIG_3M);
    const zoom = 1;
    const u = SCENE_1.unitM!;
    const c = SCENE_1.orbit!.centreM as readonly number[];
    // the painting's farthest horizontal reach from the orbit's axis
    let reach = 0;
    for (const b of SCENE_1.bodies) {
      if (b.frozen) continue;
      const p = b.position as readonly number[];
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        reach = Math.max(reach, Math.hypot(p[0]! * u + (sx * b.dims[0] * u) / 2 - c[0]!, p[2]! * u + (sz * b.dims[2] * u) / 2 - c[2]!));
    }
    // ⛔ was `> reach + 0.05` (0.375 m cleared the painting's 0.30 m): the owner, *"set the default middle ring radius to 0.09 and middle
    // ring height to 0.15"* — on the middle ring the green piece now passes THROUGH the painting (it has no collision)
    expect(cfg.orbitMiddleRadiusM * zoom).toBeLessThan(reach);
    for (const v of [0, 1]) expect(orbitOffset(cfg, 0, v, zoom).radiusM).toBeLessThanOrEqual(cfg.cameraRadiusMaxM + 1e-9); // no clamp
    // symmetric: the height runs evenly through the middle ring
    expect(cfg.orbitTopHeightM).toBeCloseTo(-cfg.orbitBottomHeightM, 12);
    expect(cfg.orbitTopRadiusM).toBe(cfg.orbitBottomRadiusM);
  });

  it("⭐⭐ against the stair it replaced: the tightest turn over 2× wider; the speed varies ~4× (the waist's plateau removed)", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const measure = (cfg: typeof DEFAULT_CONFIG) => {
      let tightest = Infinity;
      let lo = Infinity;
      let hi = 0;
      let prev: number | null = null;
      const N = 200;
      for (let i = 0; i < N; i++) {
        const v = i / N;
        const a = orbitOffset(cfg, 0, v, 1).offsetM;
        const b = orbitOffset(cfg, 0, v + 1 / N, 1).offsetM;
        const ds = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        if (prev !== null) tightest = Math.min(tightest, ds / Math.max(1e-12, Math.abs(ang - prev)));
        prev = ang;
        lo = Math.min(lo, ds * N);
        hi = Math.max(hi, ds * N);
      }
      return { radius: tightest, speedRatio: hi / lo };
    };
    const now = measure(sceneConfig(DEFAULT_CONFIG, RIG_3M));
    const stair = measure({ ...DEFAULT_CONFIG, orbitTopRadiusM: 1.7, orbitTopHeightM: 0.5, orbitMiddleRadiusM: 0.2, orbitMiddleHeightM: 0, orbitBottomRadiusM: 0.9, orbitBottomHeightM: -0.4 });
    // ⚠ was > 4× with three rings; the owner's fourth ring (2026-10-02) makes a short vertical cylinder at the waist, entered
    // and left more sharply — still over 2× the stair's tightest turn
    expect(now.radius).toBeGreaterThan(1.8 * stair.radius); // ⭐ (2026-10-17) rings 2 and 3 at r·√2 (±0.127 m, the slide view's tilt) — the owner relaxed their heights — a shorter waist, 1.88× (was over 2×)
    // ⚠ < 2.2 with the 0.375 m / 0 m middle ring, 2.37 with 0.09 m / 0.15 m, ~190 with the FOURTH ring evenly spaced (a plateau in the
    // waist) — and 4.24 with the waist re-spanned, the outer transitions kept (the owner, 2026-10-02)
    expect(now.speedRatio).toBeLessThan(5); // ⭐ (2026-10-17) 4.82 with rings 2 and 3 at r·√2 (was 4.24)
    expect(stair.speedRatio).toBeGreaterThan(3.5);
  });
});

describe("⭐⭐ prototype — zoom 1.00, the SAME scene (the owner, 2026-10-02: *\"set the zoom at 1.00 but the scene shall be exactly the same\"*)", () => {
  it("⭐ on the OUTER rings, the green piece at zoom 1.00 is where it was at zoom 1.5 on the old ones (the middle ring changed after, by the owner)", async () => {
    const { sceneConfig } = await import("../src/input/scene_rig");
    const now = sceneConfig(DEFAULT_CONFIG, RIG_3M);
    const before = { ...now, orbitTopRadiusM: 1.7, orbitTopHeightM: 1.05, orbitMiddleRadiusM: 0.25, orbitMiddleHeightM: 0, orbitBottomRadiusM: 1.7, orbitBottomHeightM: -1.05 };
    // ⚠ The whole surface matched until the owner set the middle ring to 0.09 m at 0.15 m (2026-10-02); the outer rings still do.
    for (const yaw of [0, 1.3, -2.7]) {
      for (const v of [0, 1]) {
        const a = orbitOffset(now, yaw, v, 1).offsetM; // ⭐ (2026-11-13) the rig at 1, the zoom deleted
        const b = orbitOffset(before, yaw, v, 1.5).offsetM;
        a.forEach((x, k) => expect(x).toBeCloseTo(b[k]!, 12));
      }
    }
  });
});

describe("⭐⭐ prototype — the boot orbit centre is the blue piece's face toward the green piece (the owner, 2026-10-02)", () => {
  it("⭐ of the faces, the one whose normal points most toward the green piece — and its CENTRE", async () => {
    const { faceToward } = await import("../src/input/green_box");
    const faces = [
      { centre: [0, 0, 0.15] as const, normal: [0, 0, 1] as const },
      { centre: [0, 0, -0.15] as const, normal: [0, 0, -1] as const },
      { centre: [0, 1.2, 0] as const, normal: [0, 1, 0] as const },
      { centre: [0.95, 0, 0] as const, normal: [1, 0, 0] as const },
    ];
    // the green piece up and in front (+z), mostly in front: the FRONT face, not the top
    expect(faceToward(faces, [0.2, 0.53, 0.85])!.centre).toEqual([0, 0, 0.15]);
    // seen from behind: the back face; from above: the top
    expect(faceToward(faces, [0, 0.3, -0.9])!.centre).toEqual([0, 0, -0.15]);
    expect(faceToward(faces, [0.1, 0.95, 0.1])!.centre).toEqual([0, 1.2, 0]);
    expect(faceToward([], [0, 0, 1])).toBeNull();
  });

  it("⭐ Scene_1 has ONE blue piece (Piece10); the boot centre is wired to its face, the scene's own centre only without one", () => {
    const blue = SCENE_1.bodies.filter((b) => b.colour.every((c, i) => c === SCENE_1_PALETTE.MAT_E[i]));
    expect(blue.map((b) => b.id)).toEqual(["Piece10"]);
    expect(code("scene.ts")).toMatch(/const bootOnBlue = bootTargetOnBlueFace\(st\);\s*st\.centreBlend = new OrbitCentreBlend\(st\.cfg, bootOnBlue \?\? bootOrbitCentre\(/); // ⭐ (2026-10-19) its host kept for the quads
    const w = code("green_box_wiring.ts");
    // ⭐ the green piece's orbit is the rings as they are (the zoom moves the camera only, 2026-10-02)
    expect(w).toMatch(/orbitOffset\(st\.cfg, st\.orbit\.yaw, st\.orbit\.elevation, GREEN_PIECE_ORBIT_ZOOM\)\.offsetM;/);
    expect(w).toMatch(/return faceToward\(faces, toward\);/); // ⭐ (2026-10-20) in `bootBlueFace`, shared with the boot gizmo's normal (the fourth quad)
  });
});

/* ⛔⛔ (2026-11-13, the owner: *"Set the zoom at 1 and then remove the zoom function entirely"*) the ZOOM's vectors deleted with it — the camera's gap
 * behind the green piece (×0.1 – 2), the wheel's and the pinch's range, the keep-on-screen floor (`minGreenZoom`): `zoom_removed.test.ts` pins its absence. */
