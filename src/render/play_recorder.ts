/**
 * ⭐⭐ THE PLAY RECORDER (dev only, 2026-11-14 — the owner: *"I intend to play the scene 0bis and show you the defects. Can you record the data … while I play
 * from local host?"*). Loaded by `scene.ts` only on the dev server and only with `#rec` in the URL (`?sceneIndex=4#rec`) — never in a build.
 * Every frame the walk probe's own reading (`scripts/probes/walk_probe.mjs`: the gizmo, the piece, the camera, the orbit's and the map's angles, the
 * zone's side / turn / hold, the calm, the verdict) plus the finger's raw events, sent once a second to the dev server (`/__rec`, `vite.config.ts`),
 * which appends them to `.recordings/<session>_rNN.jsonl`. ⭐ (2026-11-14, the owner: *"make a push button to record and one to stop"*) TWO BUTTONS: ● REC starts a
 * record, ■ STOP ends it — one file per record (`_r01`, `_r02`, …), nothing recorded in between; the M key marks a moment inside a record.
 */
import type { SceneState } from "./scene_state";
import { worldPlacementOf } from "@core/object_model";

type V3 = [number, number, number];
type Any = Record<string, unknown> & { [k: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const v3 = (x: unknown): V3 | null => {
  const o = x as { x?: number; y?: number; z?: number; length?: number; [i: number]: number } | null;
  if (o === null || o === undefined) return null;
  if (typeof o.x === "number") return [o.x, o.y!, o.z!];
  if (o.length === 3) return [o[0]!, o[1]!, o[2]!];
  return null;
};
const r4 = (v: V3 | null): V3 | null => (v === null ? null : [+v[0].toFixed(5), +v[1].toFixed(5), +v[2].toFixed(5)]);

export function installPlayRecorder(stIn: SceneState): void {
  const st = stIn as unknown as Any;
  const session = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "_" + Math.random().toString(36).slice(2, 6);
  const rows: Any[] = [];
  const events: Any[] = [];
  const marks: Any[] = [];
  let frame = 0;
  let press = 0;
  const down = new Map<number, { x: number; y: number }>();
  let moved: [number, number] = [0, 0];
  let markCount = 0;
  let sent = 0;
  // the record: none until ● REC; each REC a new record (its own file), STOP ends it
  let recording = false;
  let recNo = 0;
  let recId = "";
  let recT0 = 0;

  // the panel: ● REC, ■ STOP and the state
  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;top:8px;right:8px;z-index:99999;display:flex;gap:6px;align-items:center;font:600 13px system-ui;user-select:none";
  const button = (label: string, bg: string): HTMLButtonElement => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = `padding:8px 12px;border:0;border-radius:14px;color:#fff;font:inherit;cursor:pointer;touch-action:manipulation;background:${bg}`;
    return b;
  };
  const recBtn = button("● REC", "rgba(190,0,0,0.9)");
  const stopBtn = button("■ STOP", "rgba(60,60,60,0.9)");
  const state = document.createElement("span");
  state.style.cssText = "padding:6px 10px;border-radius:12px;background:rgba(0,0,0,0.6);color:#fff";
  panel.append(state, recBtn, stopBtn);
  document.body.appendChild(panel);
  const paint = (): void => {
    state.textContent = recording ? `recording r${String(recNo).padStart(2, "0")} · ${((performance.now() - recT0) / 1000).toFixed(0)} s · ${markCount} mark${markCount === 1 ? "" : "s"} (M)` : `idle · ${recNo} record${recNo === 1 ? "" : "s"} saved`;
    recBtn.disabled = recording;
    stopBtn.disabled = !recording;
    recBtn.style.opacity = recording ? "0.4" : "1";
    stopBtn.style.opacity = recording ? "1" : "0.4";
  };
  const start = (): void => {
    if (recording) return;
    recNo++;
    recId = `${session}_r${String(recNo).padStart(2, "0")}`;
    rows.length = 0;
    events.length = 0;
    marks.length = 0;
    markCount = 0;
    sent = 0;
    recT0 = performance.now();
    recording = true;
    paint();
  };
  const stop = (): void => {
    if (!recording) return;
    flush(true);
    recording = false;
    paint();
  };
  const mark = (how: string): void => {
    if (!recording) return;
    markCount++;
    marks.push({ frame, t: performance.now(), how });
    paint();
    state.style.background = "rgba(255,140,0,0.95)";
    setTimeout(() => (state.style.background = "rgba(0,0,0,0.6)"), 250);
  };
  for (const [b, f] of [[recBtn, start], [stopBtn, stop]] as const) {
    b.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      f();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") mark("key");
  });
  setInterval(() => recording && paint(), 1000);

  // the finger's raw events (the canvas's)
  const canvas = (st.engine?.getRenderingCanvas?.() ?? document.querySelector("canvas")) as HTMLCanvasElement | null;
  const onPtr = (e: PointerEvent): void => {
    if (panel.contains(e.target as Node)) return;
    if (recording) events.push({ frame, t: +e.timeStamp.toFixed(1), type: e.type, id: e.pointerId, kind: e.pointerType, x: +e.clientX.toFixed(1), y: +e.clientY.toFixed(1) });
    if (e.type === "pointerdown") {
      if (down.size === 0) press++;
      down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (e.type === "pointermove") {
      const p = down.get(e.pointerId);
      if (p !== undefined) {
        if (e.pointerId === [...down.keys()][0]) moved = [moved[0] + e.clientX - p.x, moved[1] + e.clientY - p.y];
        down.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
    } else down.delete(e.pointerId);
  };
  if (canvas !== null) for (const t of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) canvas.addEventListener(t, onPtr as EventListener, { capture: true });

  // the sway: the placed parts' drawn place against their model pose (the decoration the gizmo must never read)
  const swayMm = (): number => {
    let worst = 0;
    for (const [mesh, id] of st.idOf as Map<{ absolutePosition: { x: number; y: number; z: number } }, string>) {
      const w = worldPlacementOf(st.world, id as never);
      if (w === null || !st.goalCommit?.has?.(id)) continue;
      const a = mesh.absolutePosition;
      worst = Math.max(worst, Math.hypot(a.x - w.position[0], a.y - w.position[1], a.z - w.position[2]));
    }
    return +(worst * 1000).toFixed(2);
  };

  // every frame: the walk probe's reading
  st.scene.onAfterRenderObservable.add(() => {
    frame++;
    if (!recording) {
      moved = [0, 0];
      return;
    }
    try {
      const c = st.camera;
      const t = c.getTarget ? c.getTarget() : c.target;
      const m = c.getViewMatrix().m as number[];
      const sq = st.asmSquare;
      rows.push({
        frame,
        ts: +performance.now().toFixed(1),
        leg: down.size > 0 ? `press${press}` : `free${press}`,
        fd: down.size > 0 ? [+moved[0].toFixed(1), +moved[1].toFixed(1)] : null,
        nf: down.size,
        g: r4(v3(st.asmGizmoAt ?? null)),
        p: r4(st.greenBox ? v3(st.greenBox.getAbsolutePosition()) : null),
        // the piece's rotation (w, x, y, z), the gizmo's foot (the orbit's centre), the look point, the scene's SWAY (the placed parts drawn vs their model
        // pose: the largest offset, mm)
        pr: st.greenBox?.rotationQuaternion ? [st.greenBox.rotationQuaternion.w, st.greenBox.rotationQuaternion.x, st.greenBox.rotationQuaternion.y, st.greenBox.rotationQuaternion.z].map((x: number) => +x.toFixed(5)) : null,
        gf: r4(v3(st.asmGizmo ?? null)),
        look: r4(v3(st.asmLook ?? null)),
        sway: swayMm(),
        c: r4(v3(c.position)),
        t: r4(v3(t)),
        up: r4(v3(c.upVector)),
        cax: [[0, 4, 8], [1, 5, 9], [2, 6, 10]].map((a) => a.map((i) => +(m[i] ?? 0).toFixed(5))),
        ov: [+st.orbit.yaw.toFixed(4), +st.orbit.elevation.toFixed(4)],
        pq: st.pieceQ ? [+st.pieceQ.yaw.toFixed(4), +st.pieceQ.v.toFixed(4)] : null,
        mq: st.asmMapQ ? [+st.asmMapQ.yaw.toFixed(4), +st.asmMapQ.pitch.toFixed(4)] : null,
        ms: st.asmShown?.t ? [st.asmShown.t.stack, st.asmShown.t.band, st.asmShown.t.side ?? null] : null,
        gn: r4(v3(st.gizmoNormal ?? null)),
        ap: typeof st.approach === "number" ? +st.approach.toFixed(4) : null,
        tl: st.asmTilt ? [st.asmTilt.id, +st.asmTilt.k.toFixed(3)] : null,
        sq: sq && sq.n && sq.target ? [+((Math.acos(Math.max(-1, Math.min(1, sq.n[0] * sq.target[0] + sq.n[1] * sq.target[1] + sq.n[2] * sq.target[2]))) * 180) / Math.PI).toFixed(1), +sq.q.toFixed(2)] : null,
        zs: st.asmSpitSide ?? null,
        zm: st.asmZoneMix ? [+st.asmZoneMix.k.toFixed(3), st.asmZoneMix.rule, +st.asmZoneMix.rad.toFixed(2)] : null,
        eh: st.asmEdgeHold ? [st.asmEdgeHold.sign, +st.asmEdgeHold.back.toFixed(1)] : null,
        cw: [+(st.asmCalmWhole ?? 0).toFixed(3), +(st.asmCalmWholeV ?? 0).toFixed(3)],
        cs: st.asmCalm ? { n: st.asmCalm.n.map((x: number) => +x.toFixed(3)), sH: +st.asmCalm.sH.toFixed(3), sV: +st.asmCalm.sV.toFixed(3) } : null,
        v: String(st.lastVerdict ?? "").slice(0, 100),
      });
      moved = [0, 0];
    } catch (err) {
      rows.push({ frame, error: String(err) });
    }
  });

  // once a second: the batch to the dev server; the first one carries the scene's facts
  const meta = (): Any => {
    const box = st.asmFaceMap?.map?.box ?? st.asmWorldMap?.map?.box ?? null;
    const zones = st.asmZones?.zones?.map((z: Any) => ({ orientation: z.orientation, whole: z.whole, axis: z.axis, facets: z.facets?.length, poles: z.poles })) ?? null;
    return { build: __BUILD_ID__, url: location.href, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, ua: navigator.userAgent, box, centre: st.asm?.centre ?? null, radius: st.asm?.radius ?? null, zones };
  };
  const flush = (final = false): void => {
    if (rows.length === 0 && events.length === 0 && marks.length === 0) return;
    const body = JSON.stringify({ session: recId, seq: sent++, meta: sent === 1 || final ? meta() : undefined, rows: rows.splice(0), events: events.splice(0), marks: marks.splice(0) });
    void fetch("/__rec", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60000 }).catch(() => undefined);
  };
  setInterval(flush, 1000);
  window.addEventListener("pagehide", () => recording && flush(true));
  paint();
  console.info(`[play recorder] ready — ● REC starts a record (${session}_rNN.jsonl), ■ STOP ends it`);
}
