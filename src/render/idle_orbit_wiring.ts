/**
 * ⭐⭐ **THE IDLE ORBIT — ITS WIRING** (2026-11-14; `40_RENDER_SCENE/spec/ANIMATION.md` §4 and §6 — a MODULE: removable). After `afterS` without
 * a SCENE input (a press, a drag or a wheel on the glass — ⛔ never the menu or the UI, which are not the canvas; ⛔ never a mouse merely hovering),
 * the camera draws a small ellipse round its game angles (`core/idle_orbit.ts`); the next scene input stops it, and the camera CATCHES BACK its
 * game position by the finger's travel (or in time for an input without a delta).
 *
 * ⭐⭐ A LAYER, NOT A CAMERA MOVE: the offset is added to the ArcRotate camera's angles just before the draw and taken off right after it (the
 * view matrix rebuilt) — the game's camera, its rig, its picks and its readouts never see it. ⚠ The one consequence: a press during the idle orbit
 * picks from the game camera, at most the orbit's ≈ 1° off what is drawn (and the catch back starts on that press).
 *
 * ⚠ TO REMOVE IT: delete this file and `core/idle_orbit.ts` (+ `tests/idle_orbit.test.ts`), the line marked `ANIMATION MODULE: idle` in
 * `scene.ts`, the `idle…` keys in `input/gestureConfig.ts` and the IDLE ORBIT sliders (`tuning_menu.ts`, `tests/menu_layout.test.ts`).
 */
import { catchProgress, caughtOffset, IDLE_ORBIT_DEFAULT, idleOffset, type IdleOrbitConfig } from "../core/idle_orbit";
import { mmToPx } from "../core/units";
import type { SceneState } from "./scene_state";

export function wireIdleOrbit(st: SceneState): void {
  const canvas = st.engine.getRenderingCanvas();
  if (canvas === null) return;
  const cfgNow = (): IdleOrbitConfig => ({
    ...IDLE_ORBIT_DEFAULT,
    afterS: st.cfg.idleOrbitAfterS,
    yawDeg: st.cfg.idleOrbitYawDeg,
    pitchDeg: st.cfg.idleOrbitPitchDeg,
    periodS: st.cfg.idleOrbitPeriodS,
    catchMm: st.cfg.idleCatchMm,
    catchMs: st.cfg.idleCatchMs,
  });

  let lastInput = performance.now();
  const down = new Map<number, { x: number; y: number }>();
  type Mode =
    | { kind: "game" }
    | { kind: "idle"; since: number }
    | { kind: "catch"; held: { yaw: number; pitch: number }; progress: number; inputAt: number; travelledMm: number };
  let mode: Mode = { kind: "game" };
  let current = { yaw: 0, pitch: 0 };

  /** A SCENE input: the idle orbit stops, the catch back starts from where it is. */
  const input = (now: number): void => {
    lastInput = now;
    if (mode.kind === "idle") mode = { kind: "catch", held: current, progress: 0, inputAt: now, travelledMm: 0 };
  };
  canvas.addEventListener("pointerdown", (e) => {
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    input(performance.now());
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = down.get(e.pointerId);
    if (p === undefined) return; // ⛔ a mouse hovering is not an input
    const mm = Math.hypot(e.clientX - p.x, e.clientY - p.y) / mmToPx(1);
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    input(performance.now());
    if (mode.kind === "catch") mode.travelledMm += mm;
  });
  const up = (e: PointerEvent): void => {
    if (down.delete(e.pointerId)) lastInput = performance.now();
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", () => input(performance.now()), { passive: true });

  // ⭐ the layer: on for the draw, off right after it
  // ⚠ taken off by its OWN delta (not the saved angles): the boot's camera layer stacks on the same camera, in any order
  let saved: { dAlpha: number; dBeta: number } | null = null;
  st.scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    const cfg = cfgNow();
    if (st.cfg.idleOrbitOn !== 1) mode = { kind: "game" };
    else if (mode.kind === "game" && down.size === 0 && now - lastInput >= cfg.afterS * 1000) mode = { kind: "idle", since: now };
    if (mode.kind === "idle") current = idleOffset((now - mode.since) / 1000, cfg);
    else if (mode.kind === "catch") {
      mode.progress = catchProgress(mode.progress, mode.travelledMm, now - mode.inputAt, cfg);
      current = caughtOffset(mode.held, mode.progress);
      if (mode.progress >= 1) mode = { kind: "game" };
    } else current = { yaw: 0, pitch: 0 };
    if (current.yaw === 0 && current.pitch === 0) return;
    const cam = st.camera;
    const b0 = cam.beta;
    cam.alpha += current.yaw;
    cam.beta = Math.min(Math.PI - 1e-3, Math.max(1e-3, b0 - current.pitch)); // + pitch: the camera higher
    saved = { dAlpha: current.yaw, dBeta: cam.beta - b0 };
  });
  st.scene.onAfterRenderObservable.add(() => {
    if (saved === null) return;
    st.camera.alpha -= saved.dAlpha;
    st.camera.beta -= saved.dBeta;
    saved = null;
    st.camera.getViewMatrix(true); // ⭐ the game's camera back, its position rebuilt — nothing after the draw sees the offset
  });
}
