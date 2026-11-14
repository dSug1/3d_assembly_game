/**
 * ⭐⭐ **THE BOOT'S POP AND TUMBLE — ITS WIRING** (2026-11-14; `40_RENDER_SCENE/spec/ANIMATION.md` §4 and §6 — a MODULE: removable).
 * Every part but the floor — ALL AT ONCE — pops in the air above its spot, falls turning about the world's pitch axis, rebounds a hair, rests EXACTLY at its
 * layout pose (`core/boot_anim.ts`, the curves and the schedule). Played when the stage becomes the boot (at load; the stage slider 1 → 0 replays
 * it; a BOOT ANIMATION slider's change replays it), the camera pulling back and sweeping meanwhile (2.5 m → the game's 3 m, yaw −15° → the front). ⛔ The floor never moves. `?anim=0` or the OS's *reduce motion*: the heaps at once.
 *
 * ⚠ TO REMOVE IT: delete this file and `core/boot_anim.ts` (+ `tests/boot_anim.test.ts`), the lines marked `ANIMATION MODULE: boot` in
 * `model_import.ts`, the `boot…` keys in `input/gestureConfig.ts` and the BOOT ANIMATION sliders (`tuning_menu.ts`, `tests/menu_layout.test.ts`).
 */
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { animatedPlacement, BOOT_ANIM_DEFAULT, bootAnimPlan, bootAnimState, pitchAxis, pullBackRadius, type AnimEntry, type BootAnimConfig } from "../core/boot_anim";
import type { BootLayout } from "../core/boot_heaps";
import type { Placement } from "../core/glb_geometry";
import type { Quat, Vec3 } from "../core/vec";
import type { SceneState } from "./scene_state";

/** What the model's loader gives the animation: its parts' nodes and how to place them. */
export interface BootAnimHost {
  readonly st: SceneState;
  /** The model's holder (unfrozen while it plays). */
  readonly holder: TransformNode;
  readonly layout: BootLayout;
  /** The boot's seed — each piece's hold drawn from it (a replay the same). */
  readonly seed: number;
  /** The yaw origin (the scene's front) — the pitch axis is the boot camera's right. */
  readonly yawOriginDeg: number;
  /** A part's node, `null` when not in the level. */
  node(id: string): TransformNode | null;
  /** Put a part's node at a scene-frame placement, its scaling × `s`. */
  place(id: string, P: { readonly position: Vec3; readonly rotation: Quat }, s: number): void;
  /** Put an ANCHOR's node exactly at its goal (its own stored transform). */
  restoreAnchor(id: string): void;
  /** Resolved when the boot's other work is done (the contact file) — the clock waits for it. */
  readonly ready: Promise<void>;
  /** Clear the contact shadows while it plays. */
  clearContact(): void;
  /** Its end: the stage applied, exact (the poses, the contact shadows, the caps, frozen again). */
  finish(): void;
  /** A slider changed at the boot stage: play it again. */
  replay(): void;
}

export interface BootAnimator {
  /** Start it (`false`: off — the caller shows the heaps at once). */
  start(): boolean;
  running(): boolean;
  stop(): void;
  /** Every frame. */
  step(): void;
}

type Item = { e: AnimEntry; rest: Placement; centre: Vec3; exact: () => void; meshes: AbstractMesh[]; shown: boolean; landed: boolean };

export function bootAnimator(host: BootAnimHost): BootAnimator {
  const { st, layout: L } = host;
  const reduceMotion =
    new URLSearchParams(globalThis.location?.search ?? "").get("anim") === "0" ||
    (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const cfgNow = (): BootAnimConfig => ({
    ...BOOT_ANIM_DEFAULT,
    popMs: st.cfg.bootPopMs,
    holdMinMs: st.cfg.bootHoldMinMs,
    holdMaxMs: st.cfg.bootHoldMaxMs,
    fallMs: st.cfg.bootFallMs,
    rebound: st.cfg.bootReboundPct / 100,
    turns: st.cfg.bootTurns,
  });
  const key = (): string =>
    [st.cfg.bootAnimOn, st.cfg.bootPopMs, st.cfg.bootHoldMinMs, st.cfg.bootHoldMaxMs, st.cfg.bootFallMs, st.cfg.bootReboundPct, st.cfg.bootTurns].join();
  let seen = key();
  // ⭐⭐ THE CLOCK (the owner: "the scene is shown and the timer starts so the pop up and rotation is cut and I start to see the pieces sometimes
  // when they have fallen already"): it starts only once the boot is READY (`host.ready` — the other boot work, the contact file — and the parts'
  // shaders and shadow shaders COMPILED); until then every part is hidden. ⭐ Then it advances by at most one 30-fps frame a frame: a hitch slows
  // the animation, never skips it.
  let anim: { cfg: BootAnimConfig; axis: Vec3; items: Item[]; endMs: number; ready: boolean; clock: number; last: number | null } | null = null;
  const FRAME_CAP_MS = 1000 / 30;

  // ⭐⭐ THE CAMERA'S PULL BACK AND SWEEP while it plays (the owner: "add a backwards approach of the camera from the boot moment until the pieces
  // are set, from r=1.5m to r=3m", then "from 2.25m to 3m, yaw from -5 to 0 degree (current front)"): the distance from `bootCamFromM` to the
  // game's and the yaw from `bootCamYawFromDeg` to 0, together, eased, both arriving as the last piece is set. A LAYER, as the idle orbit's: added
  // for the draw and TAKEN OFF after it (by its own delta — the two layers stack in any order), so the game's camera, its rig and its picks never
  // see it; the player may orbit meanwhile. `bootCamFromM` 0 and `bootCamYawFromDeg` 0: none.
  let applied: { dRadius: number; dAlpha: number } | null = null;
  st.scene.onBeforeRenderObservable.add(() => {
    if (anim === null) return;
    const t = anim.clock;
    const r0 = st.camera.radius;
    const r = st.cfg.bootCamFromM > 0 ? pullBackRadius(st.cfg.bootCamFromM, r0, t, anim.endMs) : r0;
    const dAlpha = (pullBackRadius(st.cfg.bootCamYawFromDeg, 0, t, anim.endMs) * Math.PI) / 180;
    if (r === r0 && dAlpha === 0) return;
    st.camera.radius = r;
    st.camera.alpha += dAlpha;
    applied = { dRadius: r - r0, dAlpha };
  });
  st.scene.onAfterRenderObservable.add(() => {
    if (applied === null) return;
    st.camera.radius -= applied.dRadius;
    st.camera.alpha -= applied.dAlpha;
    applied = null;
    st.camera.getViewMatrix(true);
  });

  const stop = (): void => {
    if (anim === null) return;
    for (const it of anim.items) {
      if (!it.shown) host.node(it.e.id)?.setEnabled(true);
      for (const m of it.meshes) st.modelBrowse.add(m);
    }
    anim = null;
  };

  const start = (): boolean => {
    if (reduceMotion || st.cfg.bootAnimOn !== 1) return false;
    const cfg = cfgNow();
    const anchorIds = Object.keys(L.anchors).filter((id) => L.anchors[id]!.goal !== null && host.node(id) !== null);
    const partIds = Object.keys(L.poses).filter((id) => host.node(id) !== null);
    // ⭐ all at once, the plinth with them (the owner: "all pieces shall appear and drop at the same time")
    const plan = bootAnimPlan(
      [
        ...anchorIds.map((id) => ({ id, extent: L.anchors[id]!.extent, motion: "pop" as const })), // ⭐ the plinth pops IN PLACE: no fall, no turn
        ...partIds.map((id) => ({ id, extent: L.poses[id]!.extent })),
      ],
      cfg,
      host.seed,
    );
    const items: Item[] = plan.entries.map((e) => {
      const a = L.anchors[e.id];
      const rest: Placement = a !== undefined ? a.goal! : L.poses[e.id]!;
      const exact = a !== undefined ? () => host.restoreAnchor(e.id) : () => host.place(e.id, rest, 1);
      // ⛔ not browsed in flight: its drawn meshes leave the browse set until it lands
      const meshes = host.node(e.id)!.getChildMeshes(false).filter((m) => st.modelBrowse.has(m));
      return { e, rest, centre: (a ?? L.poses[e.id]!).extent.centre, exact, meshes, shown: false, landed: false };
    });
    host.holder.unfreezeWorldMatrix();
    for (const m of host.holder.getChildMeshes(false)) m.unfreezeWorldMatrix();
    host.clearContact();
    for (const it of items) {
      it.exact();
      for (const m of it.meshes) st.modelBrowse.delete(m);
    }
    const a = { cfg, axis: pitchAxis(host.yawOriginDeg), items, endMs: plan.endMs, ready: false, clock: 0, last: null as number | null };
    anim = a;
    st.modelAnimNote = ` · boot animation ${(plan.endMs / 1000).toFixed(1)} s (waiting for the boot)`;
    // ⭐ READY: the boot's other work, then the materials compiled while the parts are still HIDDEN (enabled for the compile, then hidden again —
    // a part first drawn mid-pop would stall that frame); a 4 s guard so a stuck promise never holds the scene back
    const meshes = items.flatMap((it) => host.node(it.e.id)!.getChildMeshes(false));
    // ⚠ NOTHING HERE MAY REJECT OR HANG (the owner's first try: a compile that threw rejected the wait before the guard — the parts hidden for
    // good, "nothing loads"): each call guarded, a failure logged, and the scene shown whatever happens
    const quietly = (what: string, f: () => unknown): Promise<void> => {
      try {
        return Promise.resolve(f()).then(
          () => undefined,
          (e: unknown) => console.warn(`boot animation: ${what} failed (shown anyway)`, e),
        );
      } catch (e) {
        console.warn(`boot animation: ${what} failed (shown anyway)`, e);
        return Promise.resolve();
      }
    };
    const compile = async (): Promise<void> => {
      for (const it of items) host.node(it.e.id)?.setEnabled(true);
      try {
        await Promise.all([
          ...meshes.map((m) => quietly(`compiling ${m.name}`, () => m.material?.forceCompilationAsync(m))),
          // ⛔ NOT `ShadowGenerator.forceCompilationAsync()`: it left a shadow pass's defines (a STRING) where the PBR material expects its own
          // object — every frame then threw in `_prepareDefines` and nothing was drawn (the owner: "nothing loads", 2026-11-14). The shadow map
          // compiles on its first draw.
        ]);
      } finally {
        for (const it of items) if (!it.shown) host.node(it.e.id)?.setEnabled(false);
      }
    };
    for (const it of items) host.node(it.e.id)?.setEnabled(false);
    const guard = new Promise<void>((r) => setTimeout(r, 4000));
    const go = (): void => {
      if (anim !== a || a.ready) return;
      a.ready = true;
      st.modelAnimNote = ` · boot animation ${(plan.endMs / 1000).toFixed(1)} s`;
      st.modelStatus = st.modelStatus.replace(" (waiting for the boot)", ""); // the HUD's line was written while it waited
    };
    void Promise.race([Promise.all([quietly("the boot's other work", () => host.ready), quietly("the compile", compile)]), guard]).then(go, go);
    setTimeout(go, 4000); // ⛔ belt and braces: shown after 4 s whatever the promises do
    return true;
  };

  const step = (): void => {
    const k = key();
    if (k !== seen) {
      seen = k;
      stop();
      host.replay();
    }
    if (anim === null) return;
    if (!anim.ready) return; // ⛔ nothing shown, no clock, until the boot is ready
    const now = performance.now();
    if (anim.last !== null) anim.clock += Math.min(FRAME_CAP_MS, now - anim.last); // ⭐ a hitch slows it, never skips it
    anim.last = now;
    const t = anim.clock;
    for (const it of anim.items) {
      if (it.landed) continue;
      const s = bootAnimState(it.e, t, anim.cfg);
      if (s.visible !== it.shown) {
        host.node(it.e.id)?.setEnabled(s.visible);
        it.shown = s.visible;
      }
      if (!s.visible) continue;
      if (s.done) {
        it.exact();
        for (const m of it.meshes) st.modelBrowse.add(m);
        it.landed = true;
        continue;
      }
      const P = animatedPlacement(it.rest, it.centre, anim.axis, s);
      host.place(it.e.id, P, Math.max(1e-3, P.scale));
    }
    if (t >= anim.endMs) {
      stop();
      host.finish();
    }
  };

  return { start, running: () => anim !== null, stop, step };
}
