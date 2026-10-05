/**
 * THE HUD PAINT — every readout line. ⚠ An instrument, and the project's most-cited one: *when a defect resists several correct-looking analyses, ask which READOUT moves.*
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { demoReadout } from "./demo_wiring";
import { placedReport } from "./goal_capture_wiring";
import { scoreView } from "../input/score_view";
import { bandMmNow } from "./empty_space_probe";
import { formatElapsed } from "../input/episode_ledger";
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { depthLimits, neutralLeadSec, type ReleaseVerdict, type Sample } from "../input";
import { type Vec3 } from "../core/vec";
import { type ObjectId } from "../core/object_model";
import { type GoalReport } from "../core/goal";
import { formatFrameStats } from "../core/frame_meter";
import { alignedFaceOf } from "../core/face_pick";
import { type SceneState } from "./scene_state";
import { asVec3, modelPose } from "./bodies";
import { hitFaceNow } from "./markers";
import { axesOf } from "./gizmo";
import { secondFingerOf } from "./drive";
import { orbitDegPerMm } from "../input/follow_camera";
import { greenDragGains } from "./green_box_wiring";
import type { RestingCandidate, RestingResult } from "../core/resting_face";

export function describe(v: ReleaseVerdict) : string {
  // ⛔⛔ THE `ROLLED BACK` READOUT IS GONE WITH THE ROLLBACK (owner, 2026-09-16), and the
  // `rolledBack` field and the flick with it (`D110`).
  // ⭐ The measured lift speed is still printed — a readout of the release, nothing judges it now.
  const lift = `lift ${Math.round(v.liftSpeedMmPerS)}mm/s`;
  return `${v.kind}  ${Math.round(v.durationMs)}ms  ${lift}`;
}


/**
 * How deep the pinched object is, against the bounds A5 derives.
 *
 * ⭐⭐ PRINTED BECAUSE A CLAIM A DEVICE CANNOT CHECK IS AN ASSERTION, NOT A FINDING.
 * The owner looked for the ceiling and could not see it; rather than argue about whether
 * it binds, the number and its limits go on the glass and say so themselves. ⛔ If it
 * never reaches `⛔MAX`, the note warning about a tight ceiling is the thing to correct.
 * ⚠ Empty when nothing is being pinched — a readout that invents a number is worse than
 * a blank one.
 */
export function depthReadout(st: SceneState) : string {
  for (const grip of st.held.values()) {
    const push = grip.frame.depth;
    const mp = modelPose(st, grip.mesh);
    if (!mp) continue;
    const c = asVec3(st.camera.position);
    const r: Vec3 = [
      mp.position[0] - c[0],
      mp.position[1] - c[1],
      mp.position[2] - c[2],
    ];
    const d = r[0] * push[0] + r[1] * push[1] + r[2] * push[2];
    const { minM, maxM } = depthLimits(st.cfg, st.playVolume !== null);
    const at =
      d <= minM + 1e-4 ? "  ⛔MIN" : d >= maxM - 1e-4 ? "  ⛔MAX" : "";
    // ⭐⭐ A10'S GATE, ON THE GLASS. The rule is invisible otherwise: a hand that gets
    // no depth cannot tell whether the holder was judged to be moving or whether the
    // anchor was. ⛔ It prints what the gate DECIDED, never a recomputation.
    // ⭐⭐⭐ A12 ON THE GLASS: which of the second finger's two corridors is open.
    // ⛔ The rule is invisible otherwise — a hand that gets no roll cannot tell whether
    // the holder was judged to be moving or whether its own x had not left the band.
    const second = [...grip.anchorMotion.values()][0];
    const corridor = second
      ? `${second.axes.x === "MOVING" ? "X→roll " : ""}${second.axes.y === "MOVING" ? "Y→depth" : ""}` ||
        "—"
      : "no 2nd";
    // ⭐⭐ AND THE MODE ITSELF, with the counts behind it. ⛔ Three device reports on this
    // rule were diagnosed by reasoning about code because the HUD could not answer *"what
    // does the build think is down right now?"* — an instrument is judged against the
    // question it exists to answer.
    // ⚠ A14's grace countdown was printed here and is gone with the grace itself
    // (`D28`): the mode no longer reads second-touchpoint presence, so there was nothing
    // left for it to protect — and a readout of a quantity the product no longer acts on
    // is the trap the retired roll line already cost us.
    const mode =
      `${grip.mode ?? "—"} obj=${st.router.objects().length} out=${st.router.outside().length}` +
      `${secondFingerOf(st, grip).present ? " 2nd" : ""}` +
      `${grip.rec.motionState === "STATIONARY" ? ` ready ${corridor}` : ""}`;
    return `  depth=${d.toFixed(2)}m [${minM.toFixed(2)}–${Number.isFinite(maxM) ? maxM.toFixed(1) : "∞"}]${at} ${mode}`;
  }
  return "";
}

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
  if (m === 0) return "off";
  if (m === 1) return "on";
  if (st.autoShadow === null) return "auto (measuring…)";
  return st.autoShadow === "OFF"
    ? `auto → OFF (too slow: median over ${st.cfg.autoShadowBudgetMs}ms)`
    : `auto → on`;
}

export function paint(st: SceneState) {
  const first = st.held.get(st.router.objects()[0]?.id ?? -1);
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
      freeFlow: st.cfg.pioneerCursorDrag === 1,
    }),
  );
  st.hud.update({
    score:
      `${st.episodes.total} episode${st.episodes.total === 1 ? "" : "s"}` +
      // ⭐ `D180`: once the level is complete the clock is STOPPED at its result.
      `  ${formatElapsed(elapsedMs)}` +
      (st.levelEnd.result ? "  LEVEL COMPLETE" : "") +
      `  undo=${st.undo.size}` +
      // ⭐ `3D6`: the last block, for two seconds — a stop must never read as a bug.
      (performance.now() - st.lastCollisionAt < 2000 ? `  ⟂ ${st.lastCollision}` : "") +
      `  band=${bandMmNow(st) > 0 ? `${bandMmNow(st)}mm (no empty space)` : "off"}` +
      goalReadout(st, goal) +
      demoReadout(st) +
      (st.cfg.pioneerCursorDrag === 1 ? "  FREE FLOW (not scored)" : ""),
    // ⚠ EVERY finger down, ignored ones included — the readout must not lie about
    // what is on the glass. The rules read `activeCount`, which excludes them.
    pointers: st.router.size,
    // ⛔ Straight off the recognizer that made the decision. Never recomputed here:
    // a readout that derives its own answer is a second implementation, and it can
    // disagree with the product while showing green. See `METHOD`.
    phase: first ? first.rec.currentPhase : "—",
    motion: first ? first.rec.motionState : "—",
    green: greenReadout(st),
    lastVerdict: st.lastVerdict,
    // ⚠ Shown so a session can never be spent testing a value that was not in
    // force — including a typo'd key, which is REPORTED rather than ignored.
    camera:
      `c=(${st.orbitCentreM.x.toFixed(2)},${st.orbitCentreM.y.toFixed(2)},${st.orbitCentreM.z.toFixed(2)}) ` +
      `${st.centreBlend.isBlending ? `→${(st.centreBlend.progress * 100).toFixed(0)}% ` : ""}` +
      `r=${st.camera.radius.toFixed(3)}m zoom=${st.zoom.toFixed(2)}${st.greenBox !== null ? `(≥${st.greenZoomMin.toFixed(2)})` : ""} ` +
      `elev=${st.orbit.elevation.toFixed(2)}${st.orbit.atLimit ? "⛔LIMIT" : ""}` +
      `${st.pinch.isZooming ? "  ZOOMING" : ""}` +
      // ⭐ prototype (green box): the orbit swings kicked so far — it climbs at each start, resume or turn of an orbit drag.
      `${st.greenBox !== null ? `  orbitSway×${st.orbitSwayKicks}` : ""}` +
      depthReadout(st),
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
          // ⭐ The LATCHED mode of the gesture in progress — rule 6 vs the 2bis
          // stand-in. ⛔ Printed because it is decided once and cannot be inferred
          // from what the fingers are doing now, which is the whole point of a latch.
          (first?.mode ? `  ${first.mode}` : "") +
          // ⭐⭐⭐ THE MOVEMENT MODE, and it is the least guessable state on the glass:
          // nothing VISIBLE says whether the next drag translates or rotates, because
          // presence does not decide it — a tap does. ⛔ So the readout is the only way a
          // device pass can tell *"the toggle did not fire"* from *"I toggled twice"*.
          // ⚠ Shown even with nothing held: the mode is the state the next press inherits.
          `  [${st.behaviour}]` +
          // ⭐ The lead at which a steady drag leaves NO gap, for the sliders as they
          // stand. ⛔ Printed rather than left in a doc: it moves whenever either of
          // the other two sliders moves, so a written-down number would go stale the
          // first time the owner touched them.
          `  lead ${st.cfg.translateLeadMs}/${(
            neutralLeadSec(
              st.cfg.translateInertiaMs / 1000,
              st.cfg.translateDampingRatio,
            ) * 1000
          ).toFixed(1)}ms` +
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
          // ⭐⭐⭐ **THE OBJECT AXES, ON THEIR OWN LINE** (2026-09-22). ⛔ What a hand cannot see
          // and would otherwise have to infer from how the body moved: the axes themselves
          // (`WorldAxisB`, frozen at boot — the only frame since `D109`), the tracking gain, and
          // where the gizmo sits. ⚠ The zone basis and the leading face it once printed are deleted.
          //
          // ⚠ `METHOD`: an absent readout cannot be caught by looking at the screen — and this
          // rule's whole failure mode is *the body went somewhere I did not expect*, which no
          // amount of watching the body can attribute.
          `
axes      camera PLANE` +
          ` track=${st.lastTrackGain.toFixed(2)}×${st.edgeOnNow ? " ⛔EDGE-ON" : ""}` +
          // ⛔ Per HELD body, because that is the one whose axes are being used right now.
          [...st.held.values()]
            .map((g) => st.idOf.get(g.mesh))
            .filter((id): id is ObjectId => id !== undefined)
            .map((id) => {
              const a = axesOf(st);
              // ⚠ `lead=` stood here and named the face the body was advancing on. ⛔ There is no
              // such face any more: the gizmo sits on the FollowerFace, or on the body's centre.
              const ff = alignedFaceOf(st.world, id);
              const v = (x: readonly number[]): string =>
                `${x[0]!.toFixed(2)},${x[1]!.toFixed(2)},${x[2]!.toFixed(2)}`;
              return (
                `  ${id} x=(${v(a.x)}) g=(${v(a.gravity)}) d=(${v(a.depth)})` +
                ` gizmo@${ff ?? "centre"}`
              );
            })
            .join("") +
          // ⭐⭐⭐ **THE HITFACE, ON THE GLASS** (the owner, 2026-09-24; the offers deleted, `D109`), with
          // the snap cone it is judged against. ⛔ A hand that sees no fuchsia contour cannot otherwise
          // tell whether the body is aligned already or no face resolved.
          (() => {
            const hf = hitFaceNow(st);
            if (hf === null)
              return `  hit=— (needs an UNALIGNED held body with a resolved face)`;
            return `  hit=${hf.objectId}/${hf.faceId} snapCone=${st.cfg.snapConeDeg}°`;
          })() +
          // ⭐⭐⭐ **WHERE THE OUTLINE PIPELINE STOPS** — added 2026-09-18 after a device report
          // of *"no outline of any sort"*, which four different failures produce identically:
          // no topology, no outline meshes built, no face markers, or a throw in the draw path.
          // ⛔ `METHOD`: *an absent readout cannot be caught by looking at the screen* — so this
          // prints each stage's count rather than leaving one symptom with four causes.
          // ⛔⛔ **ON ITS OWN LINE, AND THE FIRST VERSION WAS NOT — which is why a hand
          // reported *"there is no such line"*.** The HUD box is `white-space: pre` with no
          // wrapping, so everything appended to this already-enormous line is simply CLIPPED at
          // the panel's right edge. ⚠ It was rendered the whole time and unreadable, which is
          // the *absent readout* failure wearing a different hat: the check I added to answer a
          // question could not be read, so it answered nothing.
          `
topo      ${[...st.topoOf.values()]
            .map((t) => `${t.faces.length}/${t.edges.length}`)
            .join(" ")}  mk=${st.faceMarkers.size}  pfc=${st.pioneerCursors.size}  seated=${st.links.seatedFollowers().join(",") || "—"}  snapping=${st.seatSnaps.size}
unsnap    ${st.unsnapTrace}` +
          // ⛔⛔ **`outl=` REPORTED THE CACHE SIZE, WHICH IS NOT THE QUESTION** — a hand read it
          // as a bug (*"it goes to 2, not to zero"*) and was right to: a number that only ever
          // grows cannot describe what is on the screen. ⭐ `METHOD`: *audit an instrument
          // against the QUESTION it is supposed to answer.* The question is **why is nothing
          // drawn**, so this prints, per body, whether each outline is visible and **how many
          // vertices it actually has** — an empty buffer and a hidden mesh look identical.
          `
outl      ${
            st.outlines.size === 0
              ? "(none built)"
              : [...st.outlines.entries()]
                  .map(([id, o]) => {
                    const v = (m: LinesMesh): string =>
                      `${m.isVisible ? "V" : "-"}${m.getTotalVertices()}`;
                    return `${id}:${v(o.align)}`;
                  })
                  .join(" ")
          }` +
          (st.drawFault === null
            ? ""
            : `
DRAWFAULT x${st.drawFaultCount} ${st.drawFault}`) +
          // ⭐⭐⭐ **THE ALIGNMENT LINKS, PRINTED — AND THIS LINE IS OWED TO A DEVICE REPORT.**
          //
          // ⛔⛔ A hand reported *"the release of the cyan follower objects by the rotation of
          // the pioneer is not working"* and there was **nothing on the glass to narrow it
          // with**: an alignment that never linked, a link pruned too eagerly, and a turn below
          // the epsilon all look identical — nothing happens.
          // ⭐ Now each link prints as `follower>pioneer/face:S` (seated) or `:A` (aligned), so
          // *the rule did not fire* and *the link was never there* stop being the same
          // observation. ⚠ Straight from the index; nothing is recomputed here.
          (st.links.size === 0
            ? ""
            : "  ⚭" +
              st.links
                .alignedObjects()
                .map((f) => {
                  const r = st.links.pioneerFor(f);
                  const m = st.links.isSeated(f) ? "S" : "A";
                  return r === null
                    ? f
                    : `${f}>${r.objectId}/${r.faceId}:${m}`;
                })
                .join(" ")),
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
  // ⭐⭐⭐ **THE ADAPTIVE REST WINDOW, ON THE GLASS.** ⛔ A threshold that MOVES and cannot be
  // seen is the instrument this project has been burned by most. ⚠ `rest` is what each held
  // pointer's tracker actually derived, beside the raw gaps it derived it from.
  const rests = [...st.held.values()]
    .map(
      (g) =>
        `${g.rec.restMs.toFixed(0)}(med ${g.rec.gapMedianMs.toFixed(0)})`,
    )
    .join(" ");
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
  const g = greenDragGains(st);
  const r = orbitDegPerMm(st.cfg, st.orbit.elevation, g);
  // ⭐ the orbited piece (green or turquoise, the SCENE menu's switch) and its logical faces, read when it was created
  const piece = `${st.orbitPieceKind === 1 ? "turquoise" : "green"}, ${st.orbitPieceFaces} faces${restingHud(st.orbitPieces.find((o) => o.mesh === st.greenBox)?.resting ?? null, st.orbitPieces.find((o) => o.mesh === st.greenBox)?.restingFace ?? null)}`;
  // ⭐ …and the scene's parts: how many have a resting face, and the one asked last (at boot, or the moment it was unseated)
  const last = st.restingLast === null ? undefined : st.restingFaces.get(st.restingLast);
  // ⭐ `RESTING_FACE_ALIGNMENT.md`: the orbit taps counted, and the alignment (turning / following the orbit)
  const taps = `${st.orbitTap === null ? "" : ` · taps ${st.orbitTap.count}${st.orbitTap.second === null ? "" : st.orbitTap.second.pinched ? " +pinch" : " +2nd"}`}${st.restAlign === null ? "" : st.restAlign.follow ? " · aligned, following the orbit" : " · aligning"}`;
  const parts = `${taps} | resting faces ${st.restingFaces.size}${last === undefined ? "" : ` (last ${st.restingLast} ${last.why === "BOOT" ? "at boot" : "UNSEATED"}${restingHud(last.result, last.chosen)})`}`;
  return `${piece}: ${st.greenBoxDistM.toFixed(3)} m to the yellow target${parts} | orbit ${r.yawDegPerMm.toFixed(2)}°/mm dx, ${r.pitchDegPerMm.toFixed(2)}°/mm dy`;
}


/** ⭐ prototype: a resting face on the HUD — ` · rests on f3 (M 2, θ 54°)`, flagged when below the gate or ambiguous. */
function restingHud(r: RestingResult | null, chosen: RestingCandidate | null): string {
  if (r === null || chosen === null) return " · rests on —";
  return ` · rests on f${chosen.faces.join("+")} (M ${chosen.mirrors}, θ ${chosen.thetaDeg.toFixed(0)}°)${r.belowGate ? " ⚠BELOW-GATE" : ""}${r.ambiguous !== null ? " ⚠AMBIGUOUS" : ""}`;
}
