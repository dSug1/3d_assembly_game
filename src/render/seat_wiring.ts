/**
 * THE SEAT WIRING — the snap, the seats, the unsnap feed, the PioneerFaceCursor drag. ⛔ The decisions are `input/snap.ts`'s, `input/unsnap.ts`'s and `core/seat.ts`'s.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { retargetAlignment, type Sample } from "../input";
import { type Vec3 } from "../core/vec";
import { attach, setLocalPlacement, worldPlacementOf, type ObjectId } from "../core/object_model";
import { mmToPx } from "../core/units";
import { clearObjectConstraints, faceWorld, pushObjectConstraint } from "../core/object_model";
import { add, dot, qRotate, sub } from "../core/vec";
import { type PioneerFaceCursor } from "../core/pioneer_face_cursors";
import { pointOnFace } from "../core/face_surface";
import { snapConditionMet } from "../input/snap";
import { UnsnapDetector, unsnapCouple, unsnapParamsFrom } from "../input/unsnap";
import { magnetEase } from "../input/seat_snap";
import { seatedLocalPlacement } from "../core/seat";
import { grabbedCursor, PIONEER_CURSOR_PX, type CursorOnScreen } from "../input/pioneer_cursor_grab";
import { captureOffsetM } from "../input/highlight";
import { type SceneState } from "./scene_state";
import { modelOrientation, requirePose, setModelPose } from "./bodies";
import { unseatWorld } from "./alignment_wiring";

export function cursorScreen(st: SceneState, cur: PioneerFaceCursor,) : { x: number; y: number } | null {
  const body = st.meshOf.get(cur.pioneerId);
  if (!body) return null;
  const w = Vector3.TransformCoordinates(
    new Vector3(cur.position[0], cur.position[1], cur.position[2]),
    body.computeWorldMatrix(true),
  );
  const rw = st.engine.getRenderWidth();
  const rh = st.engine.getRenderHeight();
  const p = Vector3.Project(
    w,
    Matrix.IdentityReadOnly,
    st.scene.getTransformMatrix(),
    st.camera.viewport.toGlobal(rw, rh),
  );
  // ⚠ Behind the camera or past the far plane: not on screen, so not grabbable.
  if (!(p.z >= 0 && p.z <= 1)) return null;
  const rect = st.canvas.getBoundingClientRect();
  return {
    x: rect.left + (p.x * rect.width) / rw,
    y: rect.top + (p.y * rect.height) / rh,
  };
}

export function dragCursorTo(st: SceneState, key: string, x: number, y: number) : void {
  const cur = st.pioneerCursors.get(key);
  if (cur === null) return;
  const body = st.meshOf.get(cur.pioneerId);
  const topo = st.topoOf.get(cur.pioneerId);
  const face = topo?.faces.find((f) => f.id === cur.pioneerFaceId);
  if (!body || !topo || !face) return;
  // ⭐ Into the Pioneer's LOCAL frame, where the cursor and the face's triangles both live.
  const ray = st.scene.createPickingRay(x, y, null, st.camera);
  const inv = body.computeWorldMatrix(true).clone().invert();
  const o = Vector3.TransformCoordinates(ray.origin, inv);
  const d = Vector3.TransformNormal(ray.direction, inv).normalize();
  const p = pointOnFace(
    [o.x, o.y, o.z],
    [d.x, d.y, d.z],
    topo.positions,
    face.triangles,
    cur.position,
    face.normal,
  );
  if (p !== null) cur.position = p;
}

/** ⭐ `true` when this event belongs to a cursor drag and must go no further. */
export function cursorPointer(st: SceneState, type: number, e: PointerEvent) : boolean {
  if (type === PointerEventTypes.POINTERDOWN) {
    st.cursorDrags.delete(e.pointerId);
    if (st.pioneerCursors.size === 0) return false;
    const onScreen: CursorOnScreen[] = [];
    for (const cur of st.pioneerCursors.all()) {
      const p = cursorScreen(st, cur);
      if (p !== null) onScreen.push({ key: cur.key, x: p.x, y: p.y });
    }
    const key = grabbedCursor(
      {
        x: e.clientX,
        y: e.clientY,
        pointerType: e.pointerType,
        pointerId: e.pointerId,
        button: e.button,
      },
      onScreen,
      PIONEER_CURSOR_PX / 2,
      st.cfg.pioneerCursorGrabRadii,
      st.cfg.pioneerCursorDrag === 1,
    );
    if (key === null) return false;
    const at = onScreen.find((c) => c.key === key);
    if (at === undefined) return false;
    st.cursorDrags.set(e.pointerId, {
      key,
      dx: e.clientX - at.x,
      dy: e.clientY - at.y,
    });
    const cur = st.pioneerCursors.get(key);
    st.lastVerdict = `cursor: grabbed ${cur?.followerId ?? "?"} → ${cur?.pioneerId ?? "?"}/${cur?.pioneerFaceId ?? "?"}`;
    return true;
  }
  const d = st.cursorDrags.get(e.pointerId);
  if (d === undefined) return false;
  if (type === PointerEventTypes.POINTERMOVE)
    dragCursorTo(st, d.key, e.clientX - d.dx, e.clientY - d.dy);
  else if (type === PointerEventTypes.POINTERUP) st.cursorDrags.delete(e.pointerId);
  return true;
}


/**
 * ⭐ The offset radius in world metres NOW — the white contour's own conversion, so the snap's
 * *within the offset radius* is the capture's.
 */
export function offsetRadiusM(st: SceneState) : number {
return captureOffsetM(
    st.cfg.captureOffsetMm,
    st.camera.radius,
    st.camera.fov,
    st.canvas.clientHeight,
  );
}


/** ⭐ The PioneerFaceCursor in WORLD, from the MODEL (never the swayed mesh). */
export function cursorWorldOf(st: SceneState, pioneerId: ObjectId, local: Vec3) : Vec3 | null {
  const pw = worldPlacementOf(st.world, pioneerId);
  if (!pw) return null;
  return add(pw.position, qRotate(pw.orientation, local));
}


/**
 * ⭐⭐⭐ **SEATS AND SNAPS, ONE PASS.** For every aligned couple: a SEATED one has its local
 * placement re-derived from the cursor (`seatedLocalPlacement`) and its constraint retargeted;
 * an unseated, armed one that meets `snapConditionMet` starts its position lerp; a lerp that
 * lands ATTACHES the body and marks the seat.
 */
export function syncSeats(st: SceneState, nowMs: number) : void {
  const offsetM = offsetRadiusM(st);
  const coneRad = (st.cfg.pioneerCandidateConeDeg * Math.PI) / 180;
  for (const cur of st.pioneerCursors.all()) {
    const f = cur.followerId;
    const faceLocal = st.world.objects
      .get(f)
      ?.faces.find((x) => x.id === cur.followerFaceId);
    if (faceLocal === undefined) continue;
    const cursorW = cursorWorldOf(st, cur.pioneerId, cur.position);
    const pn = faceWorld(st.world, cur.pioneerId, cur.pioneerFaceId)?.normal;
    if (cursorW === null || !pn) continue;

    if (st.links.isSeated(f)) {
      // ⭐ The seat is an IDENTITY, held every frame: face centre ON the cursor.
      const o = st.world.objects.get(f);
      if (!o || o.parent !== cur.pioneerId) continue;
      const want = seatedLocalPlacement(cur.position, o.local.orientation, faceLocal.centre);
      const d = sub(want.position, o.local.position);
      if (dot(d, d) > 1e-16) st.world = setLocalPlacement(st.world, f, want);
      // ⭐ Keep the constraint truthful as the assembly turns — the same retarget `FOLLOW` uses.
      const stack = o.constraints;
      if (stack.length === 1 && stack[0]!.kind === "FACE_ALIGN") {
        const t = stack[0]!.targetWorld;
        if (dot(t, pn) > -0.999999) {
          st.world = clearObjectConstraints(st.world, f);
          st.world = pushObjectConstraint(st.world, f, retargetAlignment(stack[0]!, pn), false);
        }
      }
      continue;
    }

    const fw = faceWorld(st.world, f, cur.followerFaceId);
    if (!fw) continue;
    const dvec = sub(fw.centre, cursorW);
    const dist = Math.sqrt(dot(dvec, dvec));
    const armed = st.snapArming.armed(cur.key, dist, offsetM);
    if (st.seatSnaps.has(f)) {
      // ⚠ A flight follows a cursor or a Pioneer that moves: its END is the cursor NOW.
      const q = st.alignSnaps.targetOf(f) ?? modelOrientation(st, st.meshOf.get(f)!);
      st.seatSnaps.retarget(f, sub(cursorW, qRotate(q, faceLocal.centre)));
      continue;
    }
    if (!armed) continue;
    if (st.world.objects.get(f)?.frozen === true) continue;
    if (!snapConditionMet(fw.centre, cursorW, offsetM, fw.normal, pn, coneRad)) continue;
    const mesh = st.meshOf.get(f);
    if (!mesh) continue;
    const q = st.alignSnaps.targetOf(f) ?? modelOrientation(st, mesh);
    st.seatSnaps.start(
      f,
      requirePose(st, mesh).position,
      sub(cursorW, qRotate(q, faceLocal.centre)),
      nowMs,
    );
    st.lastVerdict = `snap: ${f} → ${cur.pioneerId}/${cur.pioneerFaceId} (${(dist * 1000).toFixed(0)} mm)`;
    st.hudDirty = true;
  }
  // ⭐ The position half of every snap in flight, on the alignment's own clock and easing.
  // ⭐ THE MAGNET: the snap's own, shorter time and an easing that accelerates into contact.
  for (const step of st.seatSnaps.advance(
    nowMs,
    st.cfg.snapMs,
    magnetEase,
    (id) => st.meshOf.has(id) && st.pioneerCursors.ofFollower(id) !== null,
  )) {
    const mesh = st.meshOf.get(step.id);
    if (!mesh) continue;
    setModelPose(st, mesh, {
      position: step.position,
      orientation: modelOrientation(st, mesh),
    });
    if (!step.done) continue;
    const cur = st.pioneerCursors.ofFollower(step.id);
    if (cur === null) continue;
    // ⭐⭐ LANDED: the body becomes a CHILD of its Pioneer, and the seat is marked on the link.
    st.world = attach(st.world, step.id, cur.pioneerId);
    if (st.world.objects.get(step.id)?.parent === cur.pioneerId && st.links.seat(step.id)) {
      st.lastVerdict = `snap: ${step.id} SEATED on ${cur.pioneerId}/${cur.pioneerFaceId}`;
    } else {
      st.lastVerdict = `snap: ${step.id} could not be seated on ${cur.pioneerId} (refused)`;
    }
    st.hudDirty = true;
  }
}

export function feedUnsnap(st: SceneState, sample: Sample) : void {
  // ⭐ The FIRST touchpoint: the earliest OBJECT holder. Its RAW body must be the Pioneer.
  const holders = st.router.objects();
  if (holders.length === 0) {
    st.unsnapTrace = "no holder";
    return;
  }
  const first = holders[0]!;
  const g1 = st.held.get(first.id);
  if (!g1) {
    st.unsnapTrace = `holder #${first.id} has no grip`;
    return;
  }
  const rawFirst = st.rawPressedBody.get(first.id) ?? st.idOf.get(g1.mesh);
  if (rawFirst === undefined) {
    st.unsnapTrace = "first body unknown";
    return;
  }
  // ⭐ The SECOND touchpoint: a `SECOND` on the same drive body (the seated member, redirected to
  // its root), or a second OBJECT holder (a member seated on the frozen plate, which the walk
  // stops below). Its RAW body must be the seated Follower.
  const onSame = st.router.secondTouchOn(g1.mesh);
  const g2 = holders.length >= 2 ? st.held.get(holders[1]!.id) : undefined;
  const second: { id: number; last: Sample } | null =
    onSame !== null
      ? { id: onSame.id, last: onSame.last }
      : holders.length >= 2 && g2 !== undefined
        ? { id: holders[1]!.id, last: g2.prev }
        : null;
  if (second === null) {
    st.unsnapTrace = `first ${rawFirst} (#${first.id}); no second touch (holders ${holders.length})`;
    return;
  }
  const rawSecond = st.rawPressedBody.get(second.id);
  if (rawSecond === undefined) {
    st.unsnapTrace = `first ${rawFirst}; second #${second.id} has no raw body`;
    return;
  }
  const follower = unsnapCouple(
    rawFirst,
    rawSecond,
    (f) => st.links.pioneerFor(f)?.objectId ?? null,
    (f) => st.links.isSeated(f),
  );
  if (follower === null) {
    st.unsnapTrace =
      `not a seated pair: first ${rawFirst}, second ${rawSecond}` +
      ` (seated=${st.links.isSeated(rawSecond)}, pioneer=${st.links.pioneerFor(rawSecond)?.objectId ?? "—"})`;
    return;
  }
  const cur = st.pioneerCursors.ofFollower(follower);
  if (cur === null) {
    st.unsnapTrace = `${follower} has no cursor`;
    return;
  }
  // ⭐ On a mouse the DRIVEN pointer is the second (the real, left-button one); the right-button
  // touchpoint that holds the Pioneer never moves.
  const mouse = st.pointerTypeOf.get(second.id) === "mouse";
  let det = st.unsnapDetectors.get(cur.key);
  if (det === undefined) {
    det = new UnsnapDetector(unsnapParamsFrom(st.cfg), mouse ? "MOUSE" : "TOUCH");
    st.unsnapDetectors.set(cur.key, det);
  }
  const mm = (p: Sample) => ({ x: p.x / mmToPx(1), y: p.y / mmToPx(1) });
  // ⭐ This event's own sample is the freshest for the pointer that sent it; a grip's `prev` is
  // one event behind.
  const pa = second.id === st.lastFedPointer ? sample : second.last;
  const pb = first.id === st.lastFedPointer ? sample : g1.prev;
  const fired = det.push(sample.t, mm(pa), mm(pb));
  st.unsnapTrace =
    `${rawFirst}→${follower} ${mouse ? "MOUSE" : "TOUCH"} armed` +
    ` (need ${st.cfg.evictShakeLegMm} mm in ${st.cfg.evictShakeWindowMs} ms)`;
  if (!fired) return;
  unseatWorld(st, follower);
  st.links.unseat(follower);
  st.snapArming.holdOff(cur.key);
  st.unsnapDetectors.delete(cur.key);
  st.unsnapTrace = `FIRED — ${follower} released from ${cur.pioneerId}`;
  st.lastVerdict = `unsnap: ${follower} released from ${cur.pioneerId} — re-arms once outside the offset radius`;
  st.hudDirty = true;
}
