/**
 * THE HUD PAINT — every readout line. ⚠ An instrument, and the project's most-cited one: *when a defect resists several correct-looking analyses, ask which READOUT moves.*
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { type LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { depthLimits, neutralLeadSec, type ReleaseVerdict, type Sample } from "../input";
import { type Vec3 } from "../core/vec";
import { type ObjectId } from "../core/object_model";
import { alignedFaceOf } from "../core/face_pick";
import { swingProgress } from "../input/approach_swing";
import { type SceneState } from "./scene_state";
import { asVec3, modelPose } from "./bodies";
import { candidateFacesNow, hitFaceNow } from "./markers";
import { axesOf } from "./gizmo";
import { secondFingerOf } from "./drive";

export function describe(st: SceneState, v: ReleaseVerdict) : string {
  const rule = v.rule === "NONE" ? "" : `  → ${v.rule}`;
  // ⛔⛔ THE `ROLLED BACK` READOUT IS GONE WITH THE ROLLBACK (owner, 2026-09-16).
  // ⭐⭐ It could no longer fire — `rolledBack` is a permanent `false` — and a HUD line
  // that cannot fire is the DEAD INSTRUMENT shape this project met three times on
  // 2026-09-16 alone: a retired quantity printed as though it were live, a slider that
  // changed nothing, and a detector that still vetoed. ⚠ The field stays on the verdict
  // (one consumer could exist tomorrow); the LINE goes, because the line makes a claim.
  const f = v.flick ? `  ${v.flick.axis}${v.flick.sign > 0 ? "+" : "-"}` : "";
  // ⭐ The measured lift speed is printed WHETHER OR NOT it passed, against the
  // threshold it was judged by. "The flick did not fire" is otherwise
  // unfalsifiable on a device: too slow a finger and a broken estimator look the
  // same. That ambiguity is what made the first rollback build feel inconsistent.
  const lift = `lift ${Math.round(v.liftSpeedMmPerS)}/${st.cfg.flickLiftSpeed}mm/s`;
  return `${v.kind}${f}${rule}  ${Math.round(v.durationMs)}ms  ${lift}`;
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
    const { minM, maxM } = depthLimits(st.cfg);
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
    return `  depth=${d.toFixed(2)}m [${minM.toFixed(2)}–${maxM.toFixed(1)}]${at} ${mode}`;
  }
  return "";
}

export function paint(st: SceneState) {
  const first = st.held.get(st.router.objects()[0]?.id ?? -1);
  st.hud.update({
    // ⚠ EVERY finger down, ignored ones included — the readout must not lie about
    // what is on the glass. The rules read `activeCount`, which excludes them.
    pointers: st.router.size,
    // ⛔ Straight off the recognizer that made the decision. Never recomputed here:
    // a readout that derives its own answer is a second implementation, and it can
    // disagree with the product while showing green. See `METHOD`.
    phase: first ? first.rec.currentPhase : "—",
    motion: first ? first.rec.motionState : "—",
    // ⚠ A12 RETIRED the circular roll, so this is always false and is kept only because
    lastVerdict: st.lastVerdict,
    // ⚠ Shown so a session can never be spent testing a value that was not in
    // force — including a typo'd key, which is REPORTED rather than ignored.
    camera:
      `c=(${st.orbitCentreM.x.toFixed(2)},${st.orbitCentreM.y.toFixed(2)},${st.orbitCentreM.z.toFixed(2)}) ` +
      `${st.centreBlend.isBlending ? `→${(st.centreBlend.progress * 100).toFixed(0)}% ` : ""}` +
      `r=${st.camera.radius.toFixed(3)}m zoom=${st.zoom.toFixed(2)} ` +
      `elev=${st.orbit.elevation.toFixed(2)}${st.orbit.atLimit ? "⛔LIMIT" : ""}` +
      `${st.pinch.isZooming ? "  ZOOMING" : ""}` +
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
          // ⭐⭐⭐ **`A16`'s STATE — AND IT PRINTS WHICH CONDITION IS FAILING, NOT JUST THE
          // VERDICT.** ⛔⛔ Three conditions AND together, and on the glass a missing highlight
          // looks identical whichever one is false. ⚠ So *"I forgot to align"*, *"I am in
          // rotation mode"* and *"they are too far apart"* would be one symptom with three
          // causes — and this project has spent whole device passes on exactly that kind of
          // ambiguity. ⭐ Each condition gets a letter: **A**ligned, **T**ranslating,
          // **R**ange; upper case means satisfied, lower case means not.
          // ⚠ STRAIGHT FROM THE VERDICT — nothing recomputed here. `highlight.ts` returns its
          // reasons precisely so this line cannot become a second implementation.
          // ⛔ TWO FLAGS NOW, NOT THREE: the `A` for *aligned* is gone because the alignment
          // is no longer part of the approach. ⚠ Leaving it would have implied it still
          // gated the contour — the readout-that-lies shape, one letter wide.
          `  ${st.highlighted.pair === null ? "◇" : "◆"}` +
          `${st.highlighted.translating ? "T" : "t"}` +
          `${st.highlighted.inRange ? "R" : "r"}` +
          (st.highlighted.pair === null
            ? ""
            : ` ${st.highlighted.pair.subject}↔${st.highlighted.pair.target}`) +
          // ⭐⭐⭐ **THE GAP AND THE THRESHOLD IT WAS COMPARED AGAINST, BOTH IN MILLIMETRES.**
          //
          // ⛔⛔ **THE `R` FLAG ALONE STOPPED BEING ENOUGH THE MOMENT THE THRESHOLD BECAME
          // CAMERA-DEPENDENT** (`D49`). ⚠ *"Too far"* now has two causes that look identical
          // on the glass — the bodies really are apart, or the camera is close and the offset
          // has shrunk with it — and this project has spent whole device passes on one symptom
          // with two causes. ⭐ With both numbers printed, moving the camera and watching the
          // threshold move is a one-look confirmation that the rule is doing what was asked.
          // ⛔ STRAIGHT FROM THE VERDICT. A HUD that measured the gap itself would be a second
          // implementation, free to disagree with the product while both showed green — which
          // is the trap `highlight.ts` returns its reasons to avoid.
          (st.highlighted.gapM === null
            ? ""
            : ` gap=${(st.highlighted.gapM * 1000).toFixed(0)}/${(
                st.highlighted.offsetM * 1000
              ).toFixed(0)}mm`) +
          // ⛔⛔ **A BODY WHOSE GEOMETRY COULD NOT BE READ, NAMED.** It has no shape, so it can
          // never capture and never be outlined — and every one of those is a SILENCE. ⚠ An
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
          // ⭐⭐⭐ **THE OBJECT AXES, ON THEIR OWN LINE** (2026-09-22). ⛔ Three things a hand
          // cannot see and would otherwise have to infer from how the body moved:
          //
          //  * **which rule is in force** — `WorldAxisB` frozen at boot, or the live camera;
          //  * **whether this body is in the zone**, because the basis SWAPS there and *the
          //    controls changed direction* is exactly what that feels like;
          //  * **which face is leading**, since the in-zone basis is built from its normal.
          //
          // ⚠ `METHOD`: an absent readout cannot be caught by looking at the screen — and this
          // rule's whole failure mode is *the body went somewhere I did not expect*, which no
          // amount of watching the body can attribute.
          `
axes      ${st.cfg.worldAxisB === 1 ? "WorldAxisB(fixed@boot: move+turn)" : "WorldAxisA(live camera: move+turn)"}` +
          ` ${st.cfg.translatePairing === 1 ? "PLANE" : "CHANNELS"}` +
          ` track=${st.lastTrackGain.toFixed(2)}×${st.lastEdgeOn ? " ⛔EDGE-ON" : ""}` +
          ` zone=${st.highlighted.inRange ? "IN" : "out"}` +
          (st.zonePair.length === 0 ? "" : `(${st.zonePair.join("↔")})`) +
          (st.cfg.cameraOffsetZoneEnterSetupB === 1
            ? ` enterHook=${st.zoneEnterCalls}(no-op)`
            : "") +
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
          // ⭐⭐⭐ **THE HITFACE AND ITS OFFERS, ON THE GLASS** (the owner, 2026-09-24). ⛔ The
          // rule is invisible otherwise: a hand that sees no fuchsia cannot tell whether the
          // cone is too tight, the body is aligned already, or the mode is wrong.
          (() => {
            const hf = hitFaceNow(st);
            if (hf === null)
              return `  hit=— (needs an UNALIGNED held body with a resolved face)`;
            const n = candidateFacesNow(st).length;
            return st.cfg.pioneerCandidates !== 1
              ? `  hit=${hf.objectId}/${hf.faceId} fuchsia=OFF`
              : `  hit=${hf.objectId}/${hf.faceId} cone=${st.cfg.pioneerCandidateConeDeg}° fuchsia=${n}`;
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
                    return `${id}:${v(o.body)}/${v(o.align)}/${v(o.shell)}`;
                  })
                  .join(" ")
          }` +
          // ⭐⭐⭐ **THE SWING, ON THE READOUT** — a trial rule with three latched quantities and
          // an invented SIGN is exactly the kind a hand cannot debug from the outside.
          // ⛔ *A dead control must say so*, and so must a control that is alive and going the
          // wrong way: the sign, the progress and the angle are the three numbers a device
          // report about direction needs, and without them the only evidence is an impression.
          (st.swing === null
            ? ""
            : `
swing     sign${
                // ⛔ `?` is *no direction was available at the threshold*, which is a swing of
                // ZERO and not a swing going the wrong way — the 2026-09-20 report could not
                // distinguish those two from outside, and this is what tells them apart.
                st.swing.sign === null ? "⛔?" : st.swing.sign > 0 ? "+" : "−"
              } p=${swingProgress(st.highlighted.gapM ?? 0, st.swing).toFixed(2)}` +
              ` yaw=${((st.appliedSwingYaw * 180) / Math.PI).toFixed(1)}°` +
              ` g0=${(st.swing.gapAtTriggerM * 1000).toFixed(0)}mm` +
              // ⚠ The travel the ARMING FRAME saw, not a live one — *"what did the sign come
              // from"* is the question a direction report asks, and `0.0000` here is the whole
              // explanation of a `⛔?`.
              ` arm=(${(st.swing.armTravelM * 1000).toFixed(1)},${(st.swing.armTravelUpM * 1000).toFixed(1)})mm` +
              ` ${st.swingFrozenProgress === null ? "driven" : "FROZEN"}`) +
          (st.drawFault === null
            ? ""
            : `
DRAWFAULT x${st.drawFaultCount} ${st.drawFault}`) +
          // ⭐⭐⭐ **THE ALIGNMENT LINKS, PRINTED — AND THIS LINE IS OWED TO A DEVICE REPORT.**
          //
          // ⛔⛔ A hand reported *"the release of the cyan follower objects by the rotation of
          // the pioneer is not working"* and there was **nothing on the glass to narrow it
          // with**: an alignment that never linked, a link pruned too eagerly, a mode read as
          // `FOLLOW`, and a turn below the epsilon all look identical — nothing happens.
          // ⭐ Now each link prints as `follower>pioneer/face:C` or `:F` for cyan/FOLLOW, so
          // *the rule did not fire* and *the link was never there* stop being the same
          // observation. ⚠ Straight from the index; nothing is recomputed here.
          (st.links.size === 0
            ? ""
            : "  ⚭" +
              st.links
                .alignedObjects()
                .map((f) => {
                  const r = st.links.pioneerFor(f);
                  const m = st.alignModeOf.get(f) === "FOLLOW" ? "F" : "C";
                  return r === null
                    ? f
                    : `${f}>${r.objectId}/${r.faceId}:${m}`;
                })
                .join(" ")),
    noise: noiseLine(st),
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
