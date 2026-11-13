/**
 * THE HUD PAINT — every readout line. ⚠ An instrument, and the project's most-cited one: *when a defect resists several correct-looking analyses, ask which READOUT moves.*
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { demoReadout } from "./demo_wiring";
import { placedReport } from "./goal_capture_wiring";
import { scoreView } from "../input/score_view";
import { formatElapsed } from "../input/episode_ledger";
import { type Sample } from "../input";
import { restingFaceWorld } from "../core/object_model";
import { type GoalReport } from "../core/goal";
import { formatFrameStats } from "../core/frame_meter";
import { type SceneState } from "./scene_state";
import { orbitDegPerMm } from "../input/follow_camera";
import type { RestingCandidate, RestingResult } from "../core/resting_face";

// ⛔⛔ (2026-11-02) the release verdict and the pinched part's depth readout are deleted with the parts' translation (commit `d8134eb`).

/**
 * ⭐ `D130`: the goal, read from the model — `goal ✅` once met, else how many bodies are in place and
 * the one furthest out. ⛔ The rule is `core/goal.ts`'s; this only prints its answer. Empty for a
 * scene with no goal.
 */
function goalReadout(st: SceneState, r: GoalReport | null): string {
  if (r === null) return "";
  // ⭐ `D189`: the COUNT is the committed one — it moves when an action completes, never midway; the piece furthest out
  // is read live (an instrument).
  const c = st.goalCommit;
  if (c.total > 0 && c.count >= c.total) return "  goal ✅";
  const far = Number.isFinite(r.worstPositionM)
    ? ` (${r.worstId} ${(r.worstPositionM * 1000).toFixed(0)}mm/${((r.worstAngleRad * 180) / Math.PI).toFixed(0)}°)`
    : ` (${r.worstId} missing)`;
  return `  goal ${c.count}/${c.total}${far}`;
}

/** ⭐ `D138`: what the shadow switch is doing — and on AUTO, what the device's measurement decided. */
function shadowsLabel(st: SceneState): string {
  const m = st.cfg.shadowsOn;
  // ⭐ (2026-10-15) "off" keeps the orbited piece's own shadow (`shadowLevel`)
  if (m === 0) return "off (the piece's shadow kept)";
  if (m === 1) return "on";
  if (st.autoShadow === null) return "auto (measuring…)";
  return st.autoShadow === "OFF"
    ? `auto → OFF (too slow: median over ${st.cfg.autoShadowBudgetMs}ms) — the piece's shadow kept`
    : `auto → on`;
}

export function paint(st: SceneState) {
  // ⭐ ONE goal report per paint — the HUD's line and the score bar (`D188`) read the same answer.
  const goal = placedReport(st);
  const elapsedMs = st.levelEnd.result ? st.levelEnd.result.elapsedMs : st.sceneStartMs === null ? 0 : performance.now() - st.sceneStartMs;
  st.scoreOverlay.update(
    scoreView({
      episodes: st.episodes.total,
      elapsedMs,
      // ⭐ `D189`: the committed goal — it moves when an action completes.
      goal: goal === null ? null : { inPlace: st.goalCommit.count, total: st.goalCommit.total },
      demo: st.demo !== null,
      freeFlow: false,
    }),
  );
  st.hud.update({
    score:
      `${st.episodes.total} episode${st.episodes.total === 1 ? "" : "s"}` +
      // ⭐ `D180`: once the level is complete the clock is STOPPED at its result.
      `  ${formatElapsed(elapsedMs)}` +
      (st.levelEnd.result ? "  LEVEL COMPLETE" : "") +
      // ⭐ `3D6`: the last block, for two seconds — a stop must never read as a bug.
      (performance.now() - st.lastCollisionAt < 2000 ? `  ⟂ ${st.lastCollision}` : "") +
      // ⭐ (2026-10-13, `COLLISION.md` §11bis) what the orbited piece's guard costs a frame (ms, smoothed)
      (st.greenBox !== null ? `  solver ${st.pieceGuardMs.toFixed(2)}ms (peak ${st.pieceGuardPeak.toFixed(0)}) q${st.pieceQueries}${st.pieceDeferred ? " d" : ""}${st.pieceMoveBlocked ? " b" : ""}` : "") +
      goalReadout(st, goal) +
      demoReadout(st),
    // ⚠ EVERY finger down, ignored ones included — the readout must not lie about
    // what is on the glass. The rules read `activeCount`, which excludes them.
    pointers: st.router.size,
    // ⛔ Straight off the recognizer that made the decision. Never recomputed here:
    // a readout that derives its own answer is a second implementation, and it can
    // disagree with the product while showing green. See `METHOD`.
    phase: "—",
    motion: st.orbitMotion === null ? "—" : st.orbitMotion.tracker.current,
    green: greenReadout(st),
    lastVerdict: st.lastVerdict,
    // ⚠ Shown so a session can never be spent testing a value that was not in
    // force — including a typo'd key, which is REPORTED rather than ignored.
    camera:
      `c=(${st.orbitCentreM.x.toFixed(2)},${st.orbitCentreM.y.toFixed(2)},${st.orbitCentreM.z.toFixed(2)}) ` +
      `${st.centreBlend.isBlending ? `→${(st.centreBlend.progress * 100).toFixed(0)}% ` : ""}` +
      // ⭐ prototype (2026-10-06): around the piece the camera looks along an axis, not at a target — r is its distance to the PIECE
      `r=${(st.pieceOrbit !== null && st.greenBox !== null ? st.camera.position.subtract(st.greenBox.position).length() : st.camera.radius).toFixed(3)}m${st.pieceOrbit !== null ? " to the piece" : ""} ` +
      `elev=${st.orbit.elevation.toFixed(2)}${st.orbit.atLimit ? "⛔LIMIT" : ""}${st.topPause > 0 && st.topPause < 1 ? ` pause=${(st.topPause * 100).toFixed(0)}%` : ""}` +
      // ⭐ prototype (green box): the orbit swings kicked so far — it climbs at each start, resume or turn of an orbit drag.
      `${st.greenBox !== null ? `  orbitSway×${st.orbitSwayKicks}` : ""}`,
    tuning:
      st.tuning.applied.length === 0 ? "defaults" : st.tuning.applied.join(" "),
    tuningRejected: st.tuning.rejected,
    // ⭐ Each touchpoint in PRESS order with its latched role, e.g. `#1OBJ #2IGN`.
    // ⛔ `IGN` is the one that matters: it is the visible form of the IN8 decision.
    jump:
      st.lastJump === null
        ? "—"
        : `${st.lastJump.id} ${st.lastJump.mm.toFixed(0)}mm/${st.lastJump.deg.toFixed(0)}° ` +
          `(usual ${st.lastJump.usualMm.toFixed(1)}mm/${st.lastJump.usualDeg.toFixed(1)}°) ` +
          `${((performance.now() - st.lastJumpAt) / 1000).toFixed(0)}s ago — ${st.lastJumpVerdict}`,
    roles:
      st.router.size === 0
        ? "—"
        : st.router
            .all()
            .map((p) => `#${p.id}${p.role.slice(0, 3)}`)
            .join(" ") +
          `  active=${st.router.activeCount}` +
          // ⛔⛔ **A BODY WHOSE GEOMETRY COULD NOT BE READ, NAMED.** It has no shape, so it can
          // never collide and never be outlined — and every one of those is a SILENCE. ⚠ An
          // absent readout cannot be caught by looking at the screen (`METHOD`), and *this part
          // never highlights* would otherwise be indistinguishable from *I am holding it wrong*.
          // ⭐ Empty in every normal run, so it costs nothing until it matters.
          (st.shapelessBodies.length === 0
            ? ""
            : `  ⛔NOSHAPE(${st.shapelessBodies.join(",")})`) +
          // ⛔⛔ **A BODY WHOSE TAPER WAS REFUSED, NAMED, for the same reason one sentence up.**
          // `taperTop` returns null rather than substituting a shape (`LESSONS_CARRIED` §6), so
          // the body is still on the glass — as a BOX. ⚠ *The pyramid is a rectangle again* is
          // a thing a hand would notice and have no way to explain, and a silent fallback is
          // exactly the class this readout exists to close.
          (st.untaperedBodies.length === 0
            ? ""
            : `  ⛔NOTAPER(${st.untaperedBodies.join(",")})`) +
          (st.drawFault === null
            ? ""
            : `
DRAWFAULT x${st.drawFaultCount} ${st.drawFault}`),
    noise: noiseLine(st),
    frame: `${formatFrameStats(st.frameMeter.stats())}  shadows=${shadowsLabel(st)}`,
  });
}

export function noiseLine(st: SceneState) : string {
  const floor = st.noise.floorMm;
  if (Number.isNaN(floor))
    return `— (n=${st.noise.samples}, hold one finger still)`;
  // ⭐ Printed against the value currently IN FORCE, because the reading is only
  // ever interesting as a comparison — and a config the sagitta rule is judged by
  // must not be compared against a half-remembered number.
  // ⭐⭐ AND THE EVENT GAPS, against the threshold they have to beat. ⛔ A `!` marks a pointer
  // whose worst gap EXCEEDS `restConfirmMs` — the flicker's precondition, as a measured fact.
  const gaps = [...st.eventGaps.entries()]
    .map(([pid, v]) => {
      const worst = v.gaps.reduce((m, g) => Math.max(m, g.ms), 0);
      return `p${pid}:${worst.toFixed(0)}${worst > st.cfg.restConfirmMs ? "!" : ""}`;
    })
    .join(" ");
  // ⭐⭐⭐ **THE ADAPTIVE REST WINDOW, ON THE GLASS** — what the orbit finger's tracker derived, beside the raw gaps.
  const t = st.orbitMotion?.tracker;
  const rests = t === undefined ? "" : `${t.restMs.toFixed(0)}`;
  return (
    `floor=${floor.toFixed(3)}mm n=${st.noise.samples}` +
    ` | rest ${rests || `${st.cfg.restConfirmMs}(seed)`}` +
    ` x${st.cfg.restGapFactor} | gaps ${gaps || "—"}`
  );
}

export function sampleOf(e: { clientX: number; clientY: number }) : Sample {
return ({
  x: e.clientX,
  y: e.clientY,
  t: performance.now(),
});
}

/** ⭐ prototype (green box) — the HUD's `green` line: the green piece's distance to the YELLOW target (the marker). */
export function greenReadout(st: SceneState): string {
  if (st.greenBox === null || st.greenBoxDistM === null) return "—";
  // ⭐ …and what one millimetre of finger orbits HERE (the owner, 2026-10-02): yaw per mm of dx, pitch per mm of dy (`orbitDegPerMm`).
  const r = orbitDegPerMm(st.cfg, st.orbit.elevation); // ⛔ (2026-11-13) the leash's gains deleted: 1
  // ⭐ the orbited piece (green or turquoise, the SCENE menu's switch) and its logical faces, read when it was created
  const piece = `${st.orbitPieceKind === 1 ? "turquoise" : "green"}, ${st.orbitPieceFaces} faces${restingHud(st.orbitPieces.find((o) => o.mesh === st.greenBox)?.resting ?? null, st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingFace ?? null)}`;
  // ⭐ …and the scene's parts: how many have a resting face, and the one asked last (at boot, or the moment it was unseated)
  const last = st.restingLast === null ? undefined : st.restingFaces.get(st.restingLast);
  // ⭐ `RESTING_FACE_ALIGNMENT.md`: the orbit taps counted, and the alignment (turning / following the orbit)
  // ⭐ (2026-10-11) the held second touch's input: undecided, the way in / round the piece, or the approach (⛔ 2026-11-13 no zoom)
  const taps = `${st.hold === null ? "" : ` · second touch held (${st.hold.mode === "HELD" ? "undecided" : st.hold.mode === "WAY" ? "way in / round the piece" : "approach"}${st.hold.first === null ? ", first touch lifted" : ""})`}${st.restAlign !== null ? " · aligning" : st.restAligned ? ` · aligned (no counter-yaw)${st.restRoll !== null && st.restRoll.couple !== null ? ` · a${st.restRoll.couple[0]}∥b${st.restRoll.couple[1]} (${st.restRoll.rolls} roll${st.restRoll.rolls === 1 ? "" : "s"})` : ""}` : ""}${st.pieceOrbit !== null ? ` · around the piece, yaw gain ×${st.pieceYawGain.toFixed(2)}` : ""}${st.pieceEntry !== null ? " · entering the orbit around the piece" : ""}${st.centreReturn !== null ? " · back to the centre orbit" : ""}`;
  const parts = `${taps} | resting faces ${st.restingFaces.size}${last === undefined ? "" : ` (last ${st.restingLast} ${last.why === "BOOT" ? "at boot" : "UNSEATED"}${restingHud(last.result, last.chosen)})`}`;
  // ⭐ (2026-10-09) its resting face as the OBJECT MODEL tracks it — the world normal now (`restingFaceWorld`)
  const rw = restingFaceWorld(st.world, st.greenBox.name);
  const tracked = rw === null ? " · model: no resting face" : ` · model: resting n (${rw.normal.map((v) => v.toFixed(2)).join(", ")})`;
  return `${piece}${tracked}: ${st.greenBoxDistM.toFixed(3)} m to the yellow target${parts} | orbit ${r.yawDegPerMm.toFixed(2)}°/mm dx, ${r.pitchDegPerMm.toFixed(2)}°/mm dy`;
}


/** ⭐ prototype: a resting face on the HUD — ` · rests on f3 (M 2, θ 54°)`, flagged when below the gate or ambiguous. */
function restingHud(r: RestingResult | null, chosen: RestingCandidate | null): string {
  if (r === null || chosen === null) return " · rests on —";
  return ` · rests on f${chosen.faces.join("+")} (M ${chosen.mirrors}, θ ${chosen.thetaDeg.toFixed(0)}°)${r.belowGate ? " ⚠BELOW-GATE" : ""}${r.ambiguous !== null ? " ⚠AMBIGUOUS" : ""}`;
}
