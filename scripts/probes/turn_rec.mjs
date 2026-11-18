// ⭐⭐⭐ (2026-11-17, package LF2 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §11) THE TIMED TURNS' RECORDER, shared by the gates' probes
// (`tilt_check`, `ridge_check`, `mid_check`, `across_check`, `replay_probe`): with DUMP=<file.json> set, every frame of the run is recorded besides the
// probe's own readings — the camera, the gizmo, the transition's turn (`asmZoneMix`: its share, its angle, its WHOLE as the clock reads it — the
// camera's plus the piece's direction's ease eased on it —, how it is paced), the square camera (its share, its normal, its target) — in the format
// `level_entry_analyse.mjs` reads, and written at the run's end. Read by `turn_table.mjs` (every timed turn: its frames, its one rotation, its path,
// base against new). The probe's own recorder is untouched (it is wrapped): a run with DUMP prints exactly what it prints without.
// ⭐ (2026-11-18, FO1 second build) + per turn its id (one per turn object), its hold as decided (`hold`, null: none), its readers (`rt`); per frame the
// pose the camera's stage built and the one drawn (`pose`, the build's `probeCamPose`; null before FO1) — the circle's check (FAST_ORBIT.md §8).
// ⭐ (2026-11-18, FO3 S0 — FAST_ORBIT.md §13) + per frame THE SHADOW (`sh`, `SHADOW_REC`: `st.asmRollShadow` — null before it): the frame's twist, the two
// gaps and the free gap's speed (rad, rad a second), the gizmo free, the turn staying, in a spit, a turn's first frame, A2's error, the ghost and the picture.
// ⭐ (2026-11-18, law U — UPRIGHT_PICTURE.md §2 step 6) + law U's weight `uw` (the square camera's complement included) and its turn `uf` (rad); null: law U off.
import { writeFileSync } from "node:fs";

/** ⭐ (FO3 S0) one frame's shadow, an expression read in the page with `st` in scope (null: no shadow — a build before FO3, or none yet) */
export const SHADOW_REC = `((s) => s ? { tw: s.tw, gh: s.held.gap, gf: s.free.gap, vf: s.free.speed, fr: s.gizmoFree ? 1 : 0, stays: s.stays ? 1 : 0, ttw: s.turnTw, sp: s.spit ? 1 : 0, nt: s.freshTurn ? 1 : 0, a2: s.a2, uw: s.upright ? s.upright.w : null, uf: s.upright ? s.upright.phi : null, fe: s.freed ?? null,
  pp: s.piece, gh3: [s.ghost.eye, s.ghost.look, s.ghost.up], pi3: [s.picture.eye, s.picture.look, s.picture.up], fov: st.camera.fov, asp: st.camera.getEngine().getAspectRatio(st.camera) } : null)(st.asmRollShadow)`;

export const TURN_REC = () => `(() => { const st = window.__st; window.__turnRec = []; const f0 = window.__frame; const ids = new WeakMap(); let nid = 0;
  window.__frame = () => { if (f0) f0(); try {
    const g = st.asmGizmoAt, n = st.gizmoNormal, m = st.asmZoneMix, sq = st.asmSquare, t = st.camera.getTarget(), e = st.asmDirEase, cp = st.probeCamPose;
    let mid = 0; if (m) { if (!ids.has(m)) ids.set(m, ++nid); mid = ids.get(m); }
    window.__turnRec.push({ leg: window.__leg, c: [st.camera.position.x, st.camera.position.y, st.camera.position.z], t: [t.x, t.y, t.z], up: [st.camera.upVector.x, st.camera.upVector.y, st.camera.upVector.z],
      g: g ? [g[0], g[1], g[2]] : null, n: n ? [n[0], n[1], n[2]] : null,
      mix: m ? { id: mid, k: m.k, rad: m.rad, whole: m.rad + (e && e.mix === m ? e.angle : 0), known: m.axis !== null, rule: m.rule, byMm: !!m.byMm, out: !!m.out, hold: m.hold === undefined ? null : m.hold, rt: !!m.readTarget } : null,
      sqq: sq ? sq.q : -1, sqn: sq && sq.n ? [sq.n[0], sq.n[1], sq.n[2]] : null, sqt: sq && sq.target ? [sq.target[0], sq.target[1], sq.target[2]] : null,
      tilt: st.asmTilt ? st.asmTilt.id : 0, zone: st.asmZone ? st.asmZone.zone.orientation : null, ap: st.approach, auto: !!st.asmTiltAuto, pend: !!st.asmTiltPending, eh: st.asmEdgeHold ? 1 : 0, free: st.asmFree ? 1 : 0,
      pose: cp ? { to: [cp.to.eye, cp.to.look, cp.to.up], drawn: [cp.drawn.eye, cp.drawn.look, cp.drawn.up] } : null, sh: ${SHADOW_REC} });
  } catch (e) { window.__recErr = String(e); } }; return true; })()`;

/** after the probe's own recorder is set: the recorder wrapped round it (DUMP set only) */
export async function turnRecStart(ev) {
  if (process.env.DUMP) await ev(TURN_REC());
}

/** at the run's end: the frames written to DUMP (DUMP set only) */
export async function turnRecDump(ev) {
  if (!process.env.DUMP) return;
  const rows = await ev("window.__turnRec");
  writeFileSync(process.env.DUMP, JSON.stringify(rows ?? []));
}
