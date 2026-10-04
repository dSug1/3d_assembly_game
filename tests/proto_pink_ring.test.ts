/**
 * ⭐⭐⭐ prototype (green box) — THE PINK RING AT THE YELLOW TARGET, THE GREEN PYRAMID, AND THE HUD'S GREEN LINE
 * (the owner, 2026-10-02).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { bodyNamed, greenPyramidSizeM, pinkRingVisibility } from "../src/input/green_box";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ prototype — the pink ring's occlusion", () => {
  it("⭐ a piece in front hides it; only the green piece in front makes it translucent; nothing in front, visible", () => {
    const at = 1.0;
    const eps = 0.002;
    expect(pinkRingVisibility([], at, eps)).toBe("VISIBLE");
    expect(pinkRingVisibility([{ distanceM: 0.6, isGreenBox: true }], at, eps)).toBe("TRANSLUCENT");
    expect(pinkRingVisibility([{ distanceM: 0.6, isGreenBox: false }], at, eps)).toBe("HIDDEN");
    // the green piece AND a piece in front: the piece hides it
    expect(pinkRingVisibility([{ distanceM: 0.4, isGreenBox: true }, { distanceM: 0.7, isGreenBox: false }], at, eps)).toBe("HIDDEN");
    // ⭐ the piece the target sits ON is met right at the target — it does not hide it
    expect(pinkRingVisibility([{ distanceM: 0.9995, isGreenBox: false }], at, eps)).toBe("VISIBLE");
    // a piece BEHIND the target never hides it
    expect(pinkRingVisibility([{ distanceM: 1.3, isGreenBox: false }], at, eps)).toBe("VISIBLE");
    // ⭐ the BOOT target (the owner, 2026-10-02: *"display the pink ring at the boot"*): pieces in front make it translucent, never hide it
    expect(pinkRingVisibility([{ distanceM: 0.6, isGreenBox: false }], at, eps, true)).toBe("TRANSLUCENT");
    expect(pinkRingVisibility([], at, eps, true)).toBe("VISIBLE");
  });

  it("⭐ wired: at the yellow target, the amber ring's size on the glass, billboarded, drawn on top; frozen bodies never hide it", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const t = st\.centreBlend\.targetM;/);
    expect(w).toMatch(/trackingMetresPerPx\(dist, st\.camera\.fov, st\.canvas\.clientHeight\) \* GIZMO_RING_PX/);
    expect(w).toMatch(/ring\.billboardMode = Mesh\.BILLBOARDMODE_ALL;/);
    expect(w).toMatch(/st\.world\.objects\.get\(id\)\?\.frozen !== true/);
    expect(w).toMatch(/ring\.alpha = v === "TRANSLUCENT" \? PINK_MASKED_ALPHA : 1;/);
    // ⭐ the owner, 2026-10-02: *"the pink ring shall occlude already from boot because it sits on the blue piece face"* — one
    // rule from the first frame; the boot exemption is switched off (the parameter stays, `true` would restore it)
    expect(w).toMatch(/const v = pinkRingVisibility\(hits, dist, PINK_EPS_M\);/);
    expect(w).not.toMatch(/targetSetByPress/);
    expect(w.indexOf("pinkRingFrame(st);")).toBeGreaterThan(w.indexOf("st.camera.setTarget(c.clone());"));
  });
});

describe("⭐⭐ prototype — the painting SWINGS when the green piece orbits (the owner, 2026-10-02: *\"build 1-3\"*)", () => {
  it("⭐⭐ the axis carries the green piece the way it orbits, about the target: a yaw orbit swings about the vertical, an elevation orbit about a horizontal", async () => {
    const { orbitSwingAxis } = await import("../src/input/green_box");
    const { qFromAxisAngle, qRotate } = await import("../src/core/vec");
    const c: [number, number, number] = [0, 0.2, 0];
    // the box on +x, the rig ahead of it toward +z (a yaw orbit): turning by a small +angle about the axis carries it toward the rig
    const box: [number, number, number] = [1, 0.2, 0];
    const rig: [number, number, number] = [Math.cos(0.1), 0.2, Math.sin(0.1)];
    const a = orbitSwingAxis(c, box, rig)!;
    expect(Math.abs(a[1])).toBeCloseTo(1, 9); // vertical
    const moved = qRotate(qFromAxisAngle(a, 0.1), [box[0] - c[0], box[1] - c[1], box[2] - c[2]]);
    [rig[0] - c[0], rig[1] - c[1], rig[2] - c[2]].forEach((x, i) => expect(moved[i]!).toBeCloseTo(x, 9)); // carried along
    // the other way round: the opposite axis
    const back = orbitSwingAxis(c, box, [Math.cos(-0.1), 0.2, Math.sin(-0.1)])!;
    expect(back[1]).toBeCloseTo(-a[1], 9);
    // an elevation orbit: a horizontal axis
    const up = orbitSwingAxis(c, box, [Math.cos(0.1), 0.2 + Math.sin(0.1), 0])!;
    expect(Math.abs(up[1])).toBeLessThan(1e-9);
    expect(orbitSwingAxis(c, box, box)).toBeNull(); // not moving
  });

  it("⭐⭐ IN PITCH TOO (the owner, 2026-10-02: *\"make sure the sway also applies in pitch when green piece orbits in pitch\"*) — on Scene_1's own rings", async () => {
    const { orbitSwingAxis } = await import("../src/input/green_box");
    const { orbitOffset } = await import("../src/input/orbit");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    const { sceneConfig } = await import("../src/input/scene_rig");
    const { qFromAxisAngle, qRotate, dot, cross, normalize } = await import("../src/core/vec");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    const c: [number, number, number] = [0, 0.23, 0];
    const at = (yaw: number, v: number) => {
      const o = orbitOffset(cfg, yaw, v, 1.5).offsetM;
      return [c[0] + o[0], c[1] + o[1], c[2] + o[2]] as [number, number, number];
    };
    for (const yaw of [0.3, 1.9, -2.4]) {
      for (const [v0, v1] of [[0.4, 0.45], [0.8, 0.75]]) {
        // a PITCH-only orbit: same yaw, the elevation moving (up, then down)
        const box = at(yaw, v0!);
        const rig = at(yaw, v1!);
        const a = orbitSwingAxis(c, box, rig)!;
        expect(Math.abs(a[1])).toBeLessThan(1e-9); // a HORIZONTAL axis …
        const r = normalize([box[0] - c[0], 0, box[2] - c[2]])!;
        expect(Math.abs(dot(a, r))).toBeLessThan(1e-9); // … across the view (square to the piece's bearing)
        // ⭐ and turning about it carries the green piece toward where the rig puts it — the way it is orbiting
        const rel: [number, number, number] = [box[0] - c[0], box[1] - c[1], box[2] - c[2]];
        const toward: [number, number, number] = [rig[0] - box[0], rig[1] - box[1], rig[2] - box[2]];
        const moved = qRotate(qFromAxisAngle(a, 0.01), rel);
        expect(dot([moved[0] - rel[0], moved[1] - rel[1], moved[2] - rel[2]], toward)).toBeGreaterThan(0);
        expect(Math.hypot(...cross(a, [0, 1, 0]))).toBeGreaterThan(0.99);
      }
    }
  });

  it("⭐ wired: the held body's own TRIGGER on the orbit finger; a block SWING about the yellow target; counted on the HUD", () => {
    const p = code("render/pointer_wiring.ts");
    const step = p.slice(p.indexOf("export function orbitDragStep"));
    expect(step).toMatch(/new SwayWatcher\(st\.cfg\.swayTurnDeg, st\.cfg\.pointerNoiseMm\)/);
    expect(step).toMatch(/st\.orbitSway\.watcher\.push\(s, st\.orbitMotion\.tracker\.current === "MOVING", true\)/);
    expect(step).toMatch(/st\.cfg\.orbitSwayDeg \* Math\.PI\) \/ 180\) \* swayScale\(kick\.speedMmPerS, st\.cfg\.swayReferenceSpeedMmPerS\)/);
    expect(step).toMatch(/swingBlock\(st, st\.greenBox, \{ x: t\[0\], y: t\[1\], z: t\[2\] \}, axis, impulse, st\.cfg\.orbitSwayTauMs\);/);
    expect(step).toMatch(/if \(kicked\) \{\s*st\.orbitSwayKicks\+\+;/);
    // ⭐ sized with its OWN softness — the same τ it springs back on
    expect(step).toMatch(/impulseForPeak\(peakRad, st\.cfg\.orbitSwayTauMs \/ 1000\)/);
    // ⭐ option 2's slide: the push, but far larger (`orbitSlideMm`) and on the swing's quick softness — never the dragged piece's 0.8 mm
    expect(step).toMatch(/nudgeOthersWorld\(st, st\.greenBox, dir, kick\.speedMmPerS, st\.cfg\.orbitSlideMm, st\.cfg\.orbitSwayTauMs\)/);
    expect(step).toMatch(/if \(kinds\.swing && st\.cfg\.orbitSwayDeg > 0\)/);
    expect(step).toMatch(/if \(kinds\.slide && st\.cfg\.orbitSlideMm > 0\)/);
    expect(code("render/hud_paint.ts")).toContain("orbitSway×${st.orbitSwayKicks}");
    expect(code("render/tuning_menu.ts")).toContain('"orbitSwayDeg", 0, 10, 0.1)');
    // ⭐ the rotation sway of a held piece goes through the SAME block swing
    expect(code("render/sway_pass.ts")).toMatch(/swingBlock\(st, grip\.mesh, grip\.mesh\.position, kick\.axis, impulse, st\.cfg\.rotateSwayTauMs\);/);
    expect(code("render/sway_pass.ts")).toMatch(/f\.swayRotTauMs = tauMs;/);
    expect(code("render/render_loop.ts")).toMatch(/const rotTau = f\.swayRotTauMs \/ 1000;/);
  });

  it("⭐⭐ the orbit swing RESOLVES QUICKLY (the owner: *\"I want the sway to resolve quickly\"*): same peak, ~3× sooner, settled ~3× sooner", async () => {
    const { advanceFollow, impulseForPeak } = await import("../src/input");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    // the owner, 2026-10-02: *"set the default orbit sway to 8 degrees, default orbit sway softness to 65 ms"*
    expect(DEFAULT_CONFIG.orbitSwayTauMs).toBe(70); // the owner, 2026-10-03 (was 65)
    expect(DEFAULT_CONFIG.orbitSwayDeg).toBe(4.5); // the owner, 2026-10-03 (was 8)
    // one kick of `peak` on a spring of softness τ: when does it peak, and when is it back under 5 % of that?
    const run = (tauMs: number) => {
      const peak = 2 * (Math.PI / 180);
      let s = { x: 0, v: impulseForPeak(peak, tauMs / 1000) };
      let max = 0;
      let peakAt = 0;
      let settledAt = 0;
      for (let t = 4; t <= 3000; t += 4) {
        s = advanceFollow(s, 0, tauMs / 1000, 1, 0.004);
        if (s.x > max) {
          max = s.x;
          peakAt = t;
        }
        if (Math.abs(s.x) > 0.05 * peak) settledAt = t;
      }
      return { max, peakAt, settledAt };
    };
    const quick = run(DEFAULT_CONFIG.orbitSwayTauMs);
    const held = run(180);
    expect(quick.max).toBeCloseTo(held.max, 3); // the same angle
    expect(quick.peakAt).toBeLessThan(held.peakAt / 2.4); // ⚠ 2.5 until 70 ms (the owner, 2026-10-03): 180 / 70 = 2.57
    expect(quick.settledAt).toBeLessThan(held.settledAt / 2.4);
    expect(quick.settledAt).toBeLessThan(450); // gone in under half a second (⚠ 400 until 70 ms: it settles at 400 now)
    expect(code("render/tuning_menu.ts")).toContain('"orbitSwayTauMs", 10, 300, 5)');
  });
});

describe("⭐⭐ prototype — option 2, the SLIDE (the owner, 2026-10-02: *\"build also option 2\"*)", () => {
  it("⭐ a switch: 0 the swing, 1 the slide, 2 both — swing by default; the slide along the green piece's heading", async () => {
    const { orbitSwayKinds, orbitSlideDirection } = await import("../src/input/green_box");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    expect(orbitSwayKinds(0)).toEqual({ swing: true, slide: false });
    expect(orbitSwayKinds(1)).toEqual({ swing: false, slide: true });
    expect(orbitSwayKinds(2)).toEqual({ swing: true, slide: true });
    expect(DEFAULT_CONFIG.orbitSwayKind).toBe(0);
    expect(DEFAULT_CONFIG.orbitSlideMm).toBe(5);
    expect(orbitSlideDirection([1, 0, 0], [1, 0, 2])).toEqual([0, 0, 1]);
    expect(orbitSlideDirection([1, 2, 3], [1, 2, 3])).toBeNull();
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"orbitSwayKind", 0, 2, 1)');
    expect(m).toContain('"orbitSlideMm", 0, 20, 0.5)');
  });

  it("⭐ each body's slide springs back on the softness its kick was sized with — a dragged piece's 180 ms, the orbit's quick one", () => {
    const s = code("render/sway_pass.ts");
    expect(s).toMatch(/const impulse = impulseForPeak\(peakM, tauMs \/ 1000\);/);
    expect(s).toMatch(/f\.swayTransTauMs = tauMs;/);
    expect(code("render/render_loop.ts")).toMatch(/const transTau = f\.swayTransTauMs \/ 1000;/);
  });
});

describe("⭐ prototype — the yellow orbit centre is HIDDEN (the owner, 2026-10-02: *\"hide the yellow orbit center\"*)", () => {
  it("⭐ hidden at boot, and nothing turns it back on — the pink ring marks the target", () => {
    expect(code("render/scene.ts")).toContain("st.centreMarker.isVisible = false;");
    for (const f of ["render/camera_rig.ts", "render/render_loop.ts", "render/green_box_wiring.ts", "render/pointer_wiring.ts"]) {
      expect(code(f)).not.toMatch(/centreMarker\.isVisible = true/);
    }
  });
});

describe("⭐⭐ prototype — the green piece is a PYRAMID, Piece17 × 150 %, its height halved, its length cut by 25 %", () => {
  it("⭐ 103.5 × 41.25 × 45 mm in Scene_1, its top tapered to half (Scene_0's pyramid); none without a Piece17", () => {
    const p17 = bodyNamed(SCENE_1.bodies, "Piece17")!;
    expect(p17.dims).toEqual([0.92, 0.55, 0.3]);
    const s = greenPyramidSizeM(p17.dims, SCENE_1.unitM!);
    // the owner: *"Dimensions = 150 % dimensions of the piece 17"*, *"divide the height of the green piece by 2"*, then
    // *"reduce the length of the green piece by 25%"* — the length is its longest side, the width
    [0.1035, 0.04125, 0.045].forEach((v, i) => expect(s[i]!).toBeCloseTo(v, 12));
    expect(bodyNamed(SCENE_0.bodies, "Piece17")).toBeNull();
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/bodyNamed\(st\.sceneSpec\.bodies, "Piece17"\)/);
    expect(w).toMatch(/greenPyramidSizeM\(piece17\.dims, st\.sceneSpec\.unitM \?\? 1\)/);
    expect(w).toMatch(/taperMesh\(box, OBJECT_TOP_SCALE\)/);
  });
});

describe("⭐ prototype — the HUD's green line (the owner: *\"after motion, add a line with the distance of the green piece to yellow orbit center\"*)", () => {
  it("⭐ right after motion; the distance is to the YELLOW target (the marker), set every frame", () => {
    const hud = code("render/hud.ts");
    expect(hud.indexOf("`green     ${f.green}`")).toBeGreaterThan(hud.indexOf("`motion    ${f.motion}`"));
    expect(hud.indexOf("`green     ${f.green}`")).toBeLessThan(hud.indexOf("`last      ${f.lastVerdict}`"));
    expect(code("render/hud_paint.ts")).toContain("green: greenReadout(st),");
    const w = code("render/green_box_wiring.ts");
    expect(w).toContain("const tgt = st.centreBlend.targetM;");
    expect(w).toMatch(/st\.greenBoxDistM = Math\.hypot\(box\.position\.x - tgt\[0\], box\.position\.y - tgt\[1\], box\.position\.z - tgt\[2\]\);/);
  });
});

describe("⭐ prototype — the pink ring is thicker and brighter (the owner, 2026-10-02: *\"so I can see it better\"*)", () => {
  it("⭐ five concentric loops ±1 px around the ring (one line system, ~3 px), and a brighter pink", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const PINK_RING_LOOPS = \[-1, -0\.5, 0, 0\.5, 1\]\.map\(\(px\) => 1 \+ \(px \* 2\) \/ GIZMO_RING_PX\);/);
    expect(w).toMatch(/CreateLineSystem\(\s*"pink-target-ring",\s*\{ lines: PINK_RING_LOOPS\.map\(\(k\) => RING_POINTS\.map\(\(p\) => p\.scale\(k\)\)\) \}/);
    expect(w).toMatch(/const PINK = new Color3\(1, 0\.6, 0\.9\);/);
    // ⭐ the 1 px step in the ring's own scale: it is GIZMO_RING_PX across, so its RADIUS is half that — 2 / GIZMO_RING_PX per px
  });
});

describe("⭐ prototype — the GUIDE SPHERE is REMOVED (the owner, 2026-10-04: *\"Remove the white sphere and whatever it controls\"*)", () => {
  it("⭐ no sphere, no frame step, no sliders, no settings", async () => {
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    expect("guideSphereAlpha" in DEFAULT_CONFIG).toBe(false);
    expect("guideSphereShare" in DEFAULT_CONFIG).toBe(false);
    expect(code("render/green_box_wiring.ts")).not.toMatch(/guide-sphere|guideSphere/);
    expect(code("render/tuning_menu.ts")).not.toMatch(/guideSphere/);
    expect(code("render/scene_state.ts")).not.toMatch(/guideSphere/);
  });
});
