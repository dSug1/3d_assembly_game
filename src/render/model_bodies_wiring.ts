/**
 * ⭐⭐⭐ **THE PICK-UP FLOW, WIRED** (2026-11-14, `20_GAME_RULES/spec/PICK_AND_PLACE.md`; `GM10` – `GM12`) — a scene's `.glb` parts made BODIES once the
 * boot has settled, then picked, held in the PIECE ORBIT, put down or seated. The rules are `core/model_bodies.ts`'s; the orbit, the goal capture and
 * the commit are the game's own (`green_box_wiring.ts`, `assembly_wiring.ts`, `goal_capture_wiring.ts`). Loaded with the model (the lazy module).
 *
 * - **A body per part**: an INVISIBLE proxy mesh from its FACE PROXY (what the face map, the gizmo's casts and the resting-face quads read), its
 *   collision its `UCX_` pieces (`SceneObject.pieces`), its frame the world's at its goal (`core/model_bodies.ts`). The drawn part follows its proxy
 *   (`place`), its meshes unfrozen only while it moves.
 * - **The goal**: every part at its assembled pose (`ABSOLUTE`), its symmetry and kind the file's; the anchors placed from the start.
 * - **The pick** (§2): a TAP on a part whose step is available (outlined), its hit area 9 mm, the nearest part winning; another candidate within reach
 *   taken by a tap as the IMMEDIATE next input (the cycle). **The put-down** (§3): a DOUBLE TAP on the held part — the free spot nearest, the least
 *   turn; a single tap on it waits for the double-tap window, then picks its resting face.
 * - **The switches** (§5, §6): by the CLOCK (`SWITCH_MS`), every scene input held until the piece and the camera are in place; held and idle, the
 *   camera blends out to the scene orbit's distance (the idle orbit plays there) and back on an input.
 * - **After a snap** (§7): the part placed, out of the hand; the scene orbit, its centre to the part just placed (the level complete: the
 *   assembly's), the contact shadows of the seated set, the outlines back.
 * ⛔ No animation of the part itself (§9: its poses are spawned).
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import "@babylonjs/core/Rendering/outlineRenderer";
import { bodyPoseOf, perimeterOf, pickableParts, placementOf, putDownPlacement, type BodyFrame } from "../core/model_bodies";
import { makeWorld, worldPlacementOf, type SceneObject } from "../core/object_model";
import { apply, type Placement } from "../core/glb_geometry";
import type { BootRule } from "../core/boot_heaps";
import type { FinalPose, GoalSymmetry } from "../core/game_structure";
import type { ModelCatalog } from "../core/model_catalog";
import { mmToPx } from "../core/units";
import { add, dot, qRotate, scale, sub, type Quat, type Vec3 } from "../core/vec";
import { OrbitController } from "../input";
import { approachDistance, approachRange } from "../input/assembly_orbit";
import { TapHistory, isTapRelease } from "../input/recognizer";
import { topologyOfBody } from "./bodies";
import { orbitPieceEntry, resetPieceOrbit, restOnTappedFace } from "./green_box_wiring";
import { ensureAssembly } from "./assembly_wiring";
import { applyCamera, syncCentre } from "./camera_rig";
import { selectRestingFace } from "./pointer_wiring";
import type { SceneState } from "./scene_state";

/** ⭐ The switches' clock (ms) — the camera from the scene orbit to the piece orbit and back (`PICK_AND_PLACE.md` §5: "a clock"). */
export const SWITCH_MS = 600;
/** ⭐ The idle blend's clock (ms), out and back. */
const IDLE_MS = 600;
/** ⭐ A part's hit area on the glass (mm, a diameter — Parhi, Karlson & Bederson 2006). */
const HIT_MM = 9;
/** ⭐ The outline of a part that may be picked (`PICK_AND_PLACE.md` §2 item 5): its colour, its width (the part's own units). */
const OUTLINE_COLOUR = new Color3(0.25, 0.85, 0.35);
const OUTLINE_WIDTH = 0.012;
/** ⭐ Frames a drawn part must stay still before its meshes are frozen again (`SCENE_SETUP.md` §6.2). */
const STILL_FRAMES = 30;

/** What the model module hands over once its boot has settled. */
export interface ModelPlayHost {
  readonly catalog: ModelCatalog;
  readonly frames: ReadonlyMap<string, BodyFrame>;
  /** Each part's collision pieces in its own frame (reference units) — the put-down's shape. */
  readonly partPieces: ReadonlyMap<string, readonly (readonly Vec3[])[]>;
  /** Where each part stands now (scene frame): the boot's place, an anchor's goal. */
  readonly starts: ReadonlyMap<string, Placement>;
  readonly anchors: readonly string[];
  readonly rule: BootRule;
  readonly yawOriginDeg: number;
  readonly unitM: number;
  /** Draw the part at a scene placement. */
  place(id: string, P: Placement): void;
  /** Its render meshes. */
  meshesOf(id: string): readonly AbstractMesh[];
  /** Its meshes' world matrices frozen (still) or not (moving). */
  freeze(id: string, frozen: boolean): void;
  /** The contact shadows of a seated set. */
  contact(seated: ReadonlySet<string>): void;
}

type CamPose = { readonly pos: Vec3; readonly target: Vec3; readonly up: Vec3 };
type Switch = { readonly kind: "toPiece" | "toScene"; readonly t0: number; readonly from: CamPose; readonly centre?: { readonly from: Vec3; readonly to: Vec3 } };
type Pending =
  | { readonly kind: "pick"; readonly id: string; readonly others: readonly string[] }
  | { readonly kind: "cycle"; readonly id: string }
  | { readonly kind: "put" };

const smoother = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (6 * x - 15) + 10);
};
const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const v3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];
const SYM: Readonly<Record<string, GoalSymmetry>> = { yawHalfTurn: "yawHalfTurns", yawHalfTurns: "yawHalfTurns", halfTurns: "halfTurns", spinFree: "spinX" };

/**
 * ⭐⭐⭐ THE PARTS BECOME BODIES — once, when the boot has settled (`model_import.ts`). Returns `false` (nothing done) for a scene whose parts are not all
 * readable as bodies.
 */
export function makeModelBodies(st: SceneState, host: ModelPlayHost): boolean {
  const ids = host.catalog.parts.map((p) => p.id).filter((id) => host.frames.has(id));
  if (ids.length === 0) return false;
  const proxies = new Map<string, Mesh>();
  const proxyMat = new StandardMaterial("model-proxy-mat", st.scene); // ⭐ never drawn; the resting face's rules read a material
  const added: SceneObject[] = [];
  for (const id of ids) {
    const f = host.frames.get(id)!;
    const at = host.anchors.includes(id) ? f.goal : host.starts.get(id) ?? f.goal;
    const pose = bodyPoseOf(f, at, host.unitM);
    const m = new Mesh(id, st.scene);
    const vd = new VertexData();
    vd.positions = f.faces.positions.flatMap((p) => [p[0], p[1], p[2]]);
    vd.indices = [...f.faces.indices];
    vd.applyToMesh(m);
    m.position.set(pose.position[0], pose.position[1], pose.position[2]);
    m.rotationQuaternion = new Quaternion(pose.orientation[1], pose.orientation[2], pose.orientation[3], pose.orientation[0]);
    m.isVisible = false;
    m.material = proxyMat;
    m.isPickable = true; // ⭐ the gizmo's casts read it (`castParts`); invisible, the game's own picks never meet it
    m.metadata = { orbitCandidate: false, modelBody: true };
    proxies.set(id, m);
    const topo = topologyOfBody(st, m);
    added.push({
      id,
      local: pose,
      parent: null,
      faces: topo.faces.map((fc) => ({ id: fc.id, centre: fc.centre, normal: fc.normal })),
      shape: { points: f.pieces.flat() },
      pieces: f.pieces.map((points) => ({ points })),
      connectors: [],
    });
    st.idOf.set(m, id);
    st.meshOf.set(id, m);
  }
  st.world = makeWorld([...st.world.objects.values(), ...added]);

  // ⭐⭐ THE GOAL: every part at its assembled pose — its body's origin, no turn (the body's frame is the world's at its goal)
  const u = st.sceneSpec.unitM ?? 1;
  const bodies: FinalPose[] = ids.map((id) => {
    const p = host.catalog.parts.find((q) => q.id === id)!;
    const c = host.frames.get(id)!.goalCentre;
    const sym = SYM[p.symmetry];
    return {
      id,
      position: [c[0] / u, c[1] / u, c[2] / u],
      orientation: "identity" as const,
      ...(sym === undefined ? {} : { symmetry: sym }),
      ...(p.kind === "" ? {} : { kind: p.kind }),
    };
  });
  st.sceneSpec = { ...st.sceneSpec, final: { frame: "ABSOLUTE", bodies }, orbitGoals: [] };
  st.goalReportMemo = null;

  const play = new ModelPlay(st, host, ids, proxies);
  st.modelHooks = { before: (dt) => play.before(dt), after: (dt) => play.after(dt) };
  return true;
}

/** ⭐ The approach whose distance from the gizmo is nearest `d` (m) — `approachDistance` read backwards over its range. */
function approachFor(st: SceneState, d: number): number {
  const r = approachRange(st.cfg);
  let best = { a: r.max, e: Infinity };
  for (let i = 0; i <= 400; i++) {
    const a = r.min + ((r.max - r.min) * i) / 400;
    const e = Math.abs(approachDistance(st.cfg, a) - d);
    if (e < best.e) best = { a, e };
  }
  return best.a;
}

/** The flow's state and its frame. */
class ModelPlay {
  held: string | null = null;
  /** Where the held part lay (scene frame) — a cycle puts it back there. */
  heldFrom: Placement | null = null;
  /** The scene orbit's centre before the pick (the put-down's way back). */
  sceneCentre: Vec3 | null = null;
  switch: Switch | null = null;
  pending: Pending | null = null;
  cycle: { ids: readonly string[]; armed: boolean } | null = null;
  single: { faceId: string; due: number } | null = null;
  readonly taps: TapHistory;
  readonly presses = new Map<number, { x: number; y: number; t: number; heldFace: string | null; placedHit: { at: Vec3; n: Vec3 | null; id: string } | null }>();
  readonly drawn = new Map<string, { key: string; still: number }>();
  outlined = new Set<string>();
  outlinesKey = "";
  lastInput: number;
  idle = 0;
  heldPointers = new Set<number>();

  constructor(readonly st: SceneState, readonly host: ModelPlayHost, readonly ids: readonly string[], readonly proxies: ReadonlyMap<string, Mesh>) {
    this.taps = new TapHistory(st.cfg);
    this.lastInput = performance.now();
    for (const id of ids) host.freeze(id, true);
    // ⭐ FIRST in line: a switch holds every scene input; the taps the flow takes are noted
    st.scene.onPointerObservable.add((info, es) => this.pointerFirst(info.type, info.event as PointerEvent, es), undefined, true);
    // ⚠ a tap on a PLACED part while a part is held moves NO gizmo: around the assembly the ray places it (`retargetGizmo`, 2026-10-28) — as today
  }

  // ─── the pointer ──────────────────────────────────────────────────────────────────────────────────────────────────

  private pointerFirst(type: number, e: PointerEvent, es: { skipNextObservers: boolean }): void {
    const now = performance.now();
    // ⛔ a switch running: every scene input stopped here (a press made meanwhile stays stopped until its release)
    if (this.switch !== null || this.pending !== null) {
      if (type === PointerEventTypes.POINTERDOWN) this.heldPointers.add(e.pointerId);
    }
    if (this.heldPointers.has(e.pointerId)) {
      es.skipNextObservers = true;
      if (type === PointerEventTypes.POINTERUP) this.heldPointers.delete(e.pointerId);
      return;
    }
    if (type === PointerEventTypes.POINTERDOWN || type === PointerEventTypes.POINTERMOVE) this.lastInput = now;
    if (type === PointerEventTypes.POINTERDOWN) {
      this.presses.set(e.pointerId, { x: e.clientX, y: e.clientY, t: now, heldFace: this.held === null ? null : this.heldFaceAt(e.clientX, e.clientY), placedHit: null });
      return;
    }
    const pr = this.presses.get(e.pointerId);
    if (pr === undefined) return;
    if (type === PointerEventTypes.POINTERMOVE) {
      if (Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > mmToPx(this.st.cfg.doubleTapSlop) && this.cycle !== null) this.cycle.armed = false;
      return;
    }
    if (type !== PointerEventTypes.POINTERUP) return;
    this.presses.delete(e.pointerId);
    const tapped = isTapRelease(pr.t, pr.x, pr.y, now, e.clientX, e.clientY, this.st.cfg.tapMaxDuration, mmToPx(this.st.cfg.doubleTapSlop));
    if (!tapped || this.st.router.all().length > 1) {
      if (this.cycle !== null) this.cycle.armed = false;
      return;
    }
    if (this.held !== null) {
      // ⭐⭐ a tap ON THE HELD PART: a double tap puts it down; a single one waits for the window, then picks its resting face
      if (pr.heldFace !== null || this.onHeld(e.clientX, e.clientY)) {
        this.st.modelTapTaken = e.pointerId;
        const kind = this.taps.record({ x: pr.x, y: pr.y, t: pr.t }, now);
        if (kind === "DOUBLE_TAP") {
          this.single = null;
          this.pending = { kind: "put" };
        } else if (pr.heldFace !== null) this.single = { faceId: pr.heldFace, due: now + this.st.cfg.doubleTapWindow };
        if (this.cycle !== null) this.cycle.armed = false;
        return;
      }
      // ⭐ THE CYCLE: the immediate next input, a tap on the other candidate within reach
      const c = this.cycle;
      if (c !== null && c.armed) {
        const near = this.partsNear(e.clientX, e.clientY, new Set(c.ids));
        if (near.length > 0) {
          this.st.modelTapTaken = e.pointerId;
          this.pending = { kind: "cycle", id: near[0]! };
          c.armed = false;
          return;
        }
      }
      if (c !== null) c.armed = false;
      return; // a tap elsewhere: the game's (a placed part: the gizmo; a loose one: empty space)
    }
    // ⭐⭐ THE PICK (the scene orbit): the nearest pickable part within the hit area
    const can = this.pickable();
    const near = this.partsNear(e.clientX, e.clientY, can);
    if (near.length === 0) return;
    this.st.modelTapTaken = e.pointerId;
    this.pending = { kind: "pick", id: near[0]!, others: near.slice(1) };
  }

  /** The parts of `eligible` within the hit area round (x, y), the nearest first. */
  private partsNear(x: number, y: number, eligible: ReadonlySet<string>): string[] {
    const r = mmToPx(HIT_MM / 2);
    const samples: [number, number, number][] = [[x, y, 0]];
    for (const k of [0.5, 1])
      for (let i = 0; i < 8; i++) samples.push([x + r * k * Math.cos((i * Math.PI) / 4), y + r * k * Math.sin((i * Math.PI) / 4), k]);
    const best = new Map<string, number>();
    for (const [sx, sy, d] of samples) {
      const h = this.pickParts(sx, sy, null);
      if (h === null || !eligible.has(h.id)) continue;
      if (!best.has(h.id) || best.get(h.id)! > d) best.set(h.id, d);
    }
    return [...best.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1)).map(([id]) => id);
  }

  /** The drawn part under (x, y) — its id, the point, the normal; `only`: those parts. ⛔ The held part never. */
  private pickParts(x: number, y: number, only: ReadonlySet<string> | null): { id: string; at: Vec3; n: Vec3 | null } | null {
    const owner = new Map<AbstractMesh, string>();
    for (const id of this.ids) {
      if (id === this.held || (only !== null && !only.has(id))) continue;
      for (const m of this.host.meshesOf(id)) owner.set(m, id);
    }
    const p = this.st.scene.pick(x, y, (m) => owner.has(m) && m.isEnabled(), false, this.st.camera);
    if (p?.hit !== true || p.pickedMesh === null || p.pickedPoint === null) return null;
    const n = p.getNormal(true);
    return { id: owner.get(p.pickedMesh)!, at: v3(p.pickedPoint), n: n === null ? null : v3(n) };
  }

  /** The held part's proxy face under (x, y) — its topology's face id; `null`: the finger is not on its face proxy. */
  private heldFaceAt(x: number, y: number): string | null {
    const m = this.held === null ? undefined : this.proxies.get(this.held);
    if (m === undefined) return null;
    const ray: Ray = this.st.scene.createPickingRay(x, y, null, this.st.camera);
    const info = ray.intersectsMesh(m, false);
    if (!info.hit) return null;
    const n = info.getNormal(true);
    if (n === null) return null;
    const topo = this.st.topoOf.get(m.name);
    const q = m.rotationQuaternion ?? Quaternion.Identity();
    let best: { id: string; d: number } | null = null;
    for (const f of topo?.faces ?? []) {
      const w = qRotate([q.w, q.x, q.y, q.z], f.normal);
      const d = dot(w, v3(n));
      if (best === null || d > best.d) best = { id: f.id, d };
    }
    return best === null || best.d < 0.9 ? null : best.id;
  }

  /** The finger on the held part's DRAWN meshes (its face proxy may be a single face) — within the same 9 mm hit area as a pick (a crank's thin bar). */
  private onHeld(x: number, y: number): boolean {
    if (this.held === null) return false;
    const mine = new Set(this.host.meshesOf(this.held));
    const r = mmToPx(HIT_MM / 2);
    const at: [number, number][] = [[x, y]];
    for (const k of [0.5, 1]) for (let i = 0; i < 8; i++) at.push([x + r * k * Math.cos((i * Math.PI) / 4), y + r * k * Math.sin((i * Math.PI) / 4)]);
    return at.some(([sx, sy]) => this.st.scene.pick(sx, sy, (m) => mine.has(m) && m.isEnabled(), false, this.st.camera)?.hit === true);
  }

  // ─── the frame ────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Before the orbited piece's frame: the pending action, the delayed single tap, the snap's step. */
  before(_dt: number): void {
    const now = performance.now();
    const p = this.pending;
    this.pending = null;
    if (p !== null) {
      if (p.kind === "pick") this.pick(p.id, p.others, now);
      else if (p.kind === "cycle") this.cycleTo(p.id, now);
      else this.putDown(now);
    }
    // ⭐ the single tap on the held part, its double-tap window over: its resting face (`PICK_AND_PLACE.md` §3 item 2)
    if (this.single !== null && now >= this.single.due) {
      const f = this.single.faceId;
      this.single = null;
      if (this.held !== null && selectRestingFace(this.st, f)) this.st.hudDirty = true;
    }
    // ⭐⭐ AFTER A SNAP: the held part captured onto its goal and committed (its pull landed)
    if (this.held !== null && this.st.orbitPiecePlaced && this.st.goalCommit.has(this.held) && this.st.goalPulls.size === 0) this.seated(now);
    this.outlines();
  }

  /** After it: the parts drawn where their bodies are, the switch's and the idle's camera blends. */
  after(_dt: number): void {
    const now = performance.now();
    this.draw();
    this.cameraBlends(now);
  }

  // ─── the actions ──────────────────────────────────────────────────────────────────────────────────────────────────

  private pickable(): Set<string> {
    if (this.st.levelEnd.result !== null) return new Set();
    const placed = new Set(this.ids.filter((id) => this.st.goalCommit.has(id)));
    const parts = this.host.catalog.parts.filter((q) => this.ids.includes(q.id)).map((q) => ({ id: q.id, step: q.step }));
    return pickableParts(parts, placed);
  }

  private camPose(): CamPose {
    const c = this.st.camera;
    return { pos: v3(c.position), target: v3(c.getTarget()), up: v3(c.upVector) };
  }

  private setObject(id: string, change: (o: SceneObject) => SceneObject): void {
    const w = this.st.world;
    this.st.world = makeWorld([...w.objects.values()].map((o) => (o.id === id ? change(o) : o)));
  }

  /** ⭐⭐ THE PICK (§2, §5): the part out of its heap into the piece orbit — its place on the orbit's line at the highest pitch, turned onto the
   *  nearest quad; the camera blends there by the clock, the inputs held. */
  private pick(id: string, others: readonly string[], now: number): void {
    const st = this.st;
    const m = this.proxies.get(id)!;
    const f = this.host.frames.get(id)!;
    const pose = worldPlacementOf(st.world, id);
    if (pose === null) return;
    const from = this.camPose();
    this.heldFrom = placementOf(f, pose, this.host.unitM);
    if (this.held === null) this.sceneCentre = [...st.centreBlend.centreM] as Vec3;
    this.held = id;
    st.browseGlide = null; // ⭐ the press had armed the centre's glide: a pick moves no centre
    this.setObject(id, (o) => ({ ...o, orbited: true }));
    // ⭐ the orbited piece: this part's proxy
    for (const o of st.orbitPieces) if (o.mesh !== m) o.restingFill?.dispose();
    const lo = f.pieces.flat().reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.min(a[2], q[2])] as Vec3, [Infinity, Infinity, Infinity] as Vec3);
    const hi = f.pieces.flat().reduce((a, q) => [Math.max(a[0], q[0]), Math.max(a[1], q[1]), Math.max(a[2], q[2])] as Vec3, [-Infinity, -Infinity, -Infinity] as Vec3);
    const entry = orbitPieceEntry(st, m, Math.max(1e-6, (hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2])));
    st.orbitPieces = [entry];
    st.greenBox = m;
    st.orbitPieceKind = st.cfg.orbitPieceKind;
    st.orbitPieceFaces = entry.faces;
    st.greenPieceVolumeM3 = entry.volumeM3;
    resetPieceOrbit(st);
    st.asm = null;
    st.asmGizmo = null;
    st.asmLook = null;
    st.asmG = null;
    applyCamera(st); // ⭐ the rig's handle for the orbited piece (`greenBoxRigM`)
    ensureAssembly(st);
    // ⭐ the orbit at the camera's yaw round the assembly, the HIGHEST pitch (the owner: "up to the highest position in the piece orbit at this distance")
    const a = st.asm as SceneState["asm"]; // ⚠ set by `ensureAssembly` (the narrowing above does not see it)
    const cam = from.pos;
    const yaw = a === null ? st.orbit.yaw : Math.atan2(cam[2] - a.centre[2], cam[0] - a.centre[0]);
    st.orbit.reset(yaw, 1);
    // ⭐ …"AT THIS DISTANCE": the approach set to the part's own distance from the assembly's centre as it lay (⛔ the approach's far end: 6 m up)
    if (a !== null) st.approach = approachFor(st, Math.hypot(pose.position[0] - a.centre[0], pose.position[1] - a.centre[1], pose.position[2] - a.centre[2]));
    // ⭐ its resting face: the face most DOWN as it lay — the turn onto the nearest quad the least (`bootRestAlign` turns it onto the floor's top)
    const q = pose.orientation;
    let down: { id: string; d: number } | null = null;
    for (const fc of st.topoOf.get(m.name)?.faces ?? []) {
      const d = -qRotate(q, fc.normal)[1];
      if (down === null || d > down.d) down = { id: fc.id, d };
    }
    if (down !== null) restOnTappedFace(st, down.id);
    st.bootRestAlign = true;
    this.cycle = others.length > 0 ? { ids: others, armed: true } : null;
    this.single = null;
    this.idle = 0;
    this.switch = { kind: "toPiece", t0: now, from };
    st.episodes.touch(--st.episodeSeq, true, true); // ⭐ a pick costs one episode (`PICK_AND_PLACE.md` §8)
    st.episodes.sync(true);
    st.lastVerdict = `pick: ${id} in hand${others.length > 0 ? ` (tap again: ${others.join(", ")})` : ""}`;
    st.hudDirty = true;
  }

  /** ⭐ THE CYCLE: the held part back where it lay, the other candidate picked. */
  private cycleTo(id: string, now: number): void {
    const held = this.held;
    if (held === null || this.heldFrom === null) return;
    const back = this.heldFrom;
    this.release(held, bodyPoseOf(this.host.frames.get(held)!, back, this.host.unitM));
    this.held = null;
    this.pick(id, [], now);
    this.st.episodes.touch(--this.st.episodeSeq, false, false);
  }

  /** The held part out of the hand at a pose — its model and proxy there, no longer orbited. */
  private release(id: string, pose: { position: Vec3; orientation: Quat }): void {
    const st = this.st;
    const m = this.proxies.get(id)!;
    this.setObject(id, (o) => ({ ...o, orbited: false, local: pose }));
    m.position.set(pose.position[0], pose.position[1], pose.position[2]);
    m.rotationQuaternion = new Quaternion(pose.orientation[1], pose.orientation[2], pose.orientation[3], pose.orientation[0]);
    for (const o of st.orbitPieces) o.restingFill?.dispose();
    st.orbitPieces = [];
    st.greenBox = null;
    st.greenBoxRigM = null;
    st.orbitPiecePlaced = false;
    st.hold = null;
    st.approach = 1;
    resetPieceOrbit(st);
  }

  /** ⭐⭐ THE PUT-DOWN (§3): the free spot nearest the part, the least turn; the scene orbit by the clock. */
  private putDown(now: number): void {
    const st = this.st;
    const id = this.held;
    if (id === null) return;
    const f = this.host.frames.get(id)!;
    const pose = worldPlacementOf(st.world, id);
    if (pose === null) return;
    const P = placementOf(f, pose, this.host.unitM);
    const others: Vec3[][] = [];
    const placedPts: Vec3[] = [];
    for (const o of this.ids) {
      if (o === id) continue;
      const op = worldPlacementOf(st.world, o);
      const fo = this.host.frames.get(o)!;
      if (op === null) continue;
      const Po = placementOf(fo, op, this.host.unitM);
      const pts = (this.host.partPieces.get(o) ?? []).flat().map((p) => apply(Po, p));
      if (st.goalCommit.has(o)) placedPts.push(...pts);
      else others.push(pts);
    }
    const r = this.host.rule;
    const part = this.host.catalog.parts.find((q) => q.id === id)!;
    const spot = putDownPlacement({ id, step: part.step, heap: r.heapOf[id] ?? "", pieces: this.host.partPieces.get(id) ?? [] }, P, others, {
      floorY: r.floorY,
      floorHalf: r.floorHalf,
      floorMargin: r.floorMargin,
      perimeter: perimeterOf(placedPts, r.anchorMargin),
      yawOriginDeg: this.host.yawOriginDeg,
      stepU: 0.1,
      maxU: 2 * r.floorHalf,
    });
    if (spot === null) {
      st.lastVerdict = `put down: no free spot for ${id} — it stays in hand`;
      st.hudDirty = true;
      return;
    }
    const from = this.camPose();
    this.release(id, bodyPoseOf(f, spot, this.host.unitM));
    this.held = null;
    this.cycle = null;
    this.single = null;
    this.toScene(now, from, this.sceneCentre);
    st.episodes.touch(--st.episodeSeq, true, true); // ⭐ a put-down costs one episode (`PICK_AND_PLACE.md` §8)
    st.episodes.sync(true);
    st.lastVerdict = `put down: ${id} back on the floor`;
    st.hudDirty = true;
  }

  /** ⭐⭐ AFTER A SNAP (§7): the part placed, out of the hand; the scene orbit, its centre to the part just placed — the level complete: the assembly's. */
  private seated(now: number): void {
    const st = this.st;
    const id = this.held!;
    const pose = worldPlacementOf(st.world, id);
    if (pose === null) return;
    const from = this.camPose();
    this.release(id, pose);
    this.held = null;
    this.cycle = null;
    this.single = null;
    const placed = new Set(this.ids.filter((q) => st.goalCommit.has(q)));
    this.host.contact(placed);
    const done = placed.size === this.ids.length;
    let to: Vec3;
    if (done) {
      const all = this.ids.map((q) => this.host.frames.get(q)!.goalCentre);
      const lo = all.reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.min(a[2], c[2])] as Vec3);
      const hi = all.reduce((a, c) => [Math.max(a[0], c[0]), Math.max(a[1], c[1]), Math.max(a[2], c[2])] as Vec3);
      to = scale(add(lo, hi), 0.5);
    } else to = this.host.frames.get(id)!.goalCentre;
    this.toScene(now, from, to);
    st.lastVerdict = done ? "the engine is assembled" : `${id} seated — the next part`;
    st.hudDirty = true;
  }

  /** The scene orbit from the camera as it is: the rig's place nearest it, the centre gliding to `centre` — by the clock. */
  private toScene(now: number, from: CamPose, centre: Vec3 | null): void {
    const st = this.st;
    const c0: Vec3 = [...st.centreBlend.centreM] as Vec3;
    const c1 = centre ?? c0;
    // ⭐ the rings' place that looks from the camera's DIRECTION now (its yaw, its pitch from the centre it is going to), the nearest distance among
    // equals — ⛔ a ring surface cannot hold every piece-orbit place (that orbit has a distance too): the nearest PLACE dropped to the bottom ring
    // (the camera 2.2 m out at the horizon, the waist 0.9 m: measured). ⚠ Beyond the rings' pitches the nearest ring's (`Scene_2`: −37° … +41°)
    const dc = sub(from.pos, c1);
    const yaw = Math.atan2(dc[2], dc[0]);
    const hz = Math.hypot(dc[0], dc[2]);
    const pc = Math.atan2(dc[1], hz);
    const dist = Math.hypot(dc[0], dc[1], dc[2]) || 1;
    let best: { v: number; score: number } | null = null;
    for (let i = 0; i <= 128; i++) {
      const o = new OrbitController(st.cfg, yaw, i / 128).pose(1).offsetM;
      const r = Math.hypot(o[0], o[1], o[2]) || 1;
      const score = Math.abs(Math.atan2(o[1], Math.hypot(o[0], o[2])) - pc) + 0.1 * Math.abs(Math.log(r / dist));
      if (best === null || score < best.score) best = { v: i / 128, score };
    }
    st.orbit = new OrbitController(st.cfg, yaw, best!.v);
    this.switch = { kind: "toScene", t0: now, from, centre: { from: c0, to: c1 } };
  }

  // ─── the drawing ──────────────────────────────────────────────────────────────────────────────────────────────────

  /** Each part drawn where its proxy is; its meshes unfrozen while it moves, frozen again once still. */
  private draw(): void {
    for (const id of this.ids) {
      const m = this.proxies.get(id)!;
      const r = m.rotationQuaternion ?? Quaternion.Identity();
      const key = `${m.position.x.toFixed(7)},${m.position.y.toFixed(7)},${m.position.z.toFixed(7)},${r.w.toFixed(8)},${r.x.toFixed(8)},${r.y.toFixed(8)},${r.z.toFixed(8)}`;
      const was = this.drawn.get(id);
      if (was !== undefined && was.key === key) {
        if (was.still === STILL_FRAMES) this.host.freeze(id, true);
        if (was.still <= STILL_FRAMES) was.still++;
        continue;
      }
      if (was === undefined || was.still > STILL_FRAMES) this.host.freeze(id, false);
      const pose = { position: v3(m.position), orientation: [r.w, r.x, r.y, r.z] as Quat };
      this.host.place(id, placementOf(this.host.frames.get(id)!, pose, this.host.unitM));
      this.drawn.set(id, { key, still: 0 });
    }
  }

  /** ⭐ The parts that may be picked, outlined — none while a part is held or the level is complete (§2 item 5). */
  private outlines(): void {
    const want = this.held === null ? this.pickable() : new Set<string>();
    const key = [...want].sort().join(",");
    if (key === this.outlinesKey) return;
    this.outlinesKey = key;
    for (const id of this.ids) {
      const on = want.has(id);
      for (const m of this.host.meshesOf(id)) {
        m.renderOutline = on;
        if (on) {
          m.outlineColor = OUTLINE_COLOUR;
          m.outlineWidth = OUTLINE_WIDTH;
        }
      }
    }
  }

  /** ⭐ The switch's blend (§5, §6) and, held and idle, the blend out to the scene orbit's distance and back. */
  private cameraBlends(now: number): void {
    const st = this.st;
    const sw = this.switch;
    if (sw !== null) {
      const k = smoother((now - sw.t0) / SWITCH_MS);
      if (sw.kind === "toScene" && sw.centre !== undefined) {
        st.centreBlend.snapTo(lerp3(sw.centre.from, sw.centre.to, k));
        syncCentre(st);
        applyCamera(st);
      }
      const to = this.camPose();
      this.writeCamera({ pos: lerp3(sw.from.pos, to.pos, k), target: lerp3(sw.from.target, to.target, k), up: lerp3(sw.from.up, to.up, k) });
      if (k >= 1) this.switch = null;
      return;
    }
    // ⭐⭐ (§6) a part held, no finger down and no input for the idle orbit's time: the camera out to the scene orbit's distance, the idle orbit there
    if (this.held === null || st.asm === null) {
      this.idle = 0;
      return;
    }
    const quiet = st.router.all().length === 0 && now - this.lastInput > st.cfg.idleOrbitAfterS * 1000 && st.cfg.idleOrbitOn === 1;
    const step = (st.engine.getDeltaTime() || 16) / IDLE_MS;
    this.idle = Math.min(1, Math.max(0, this.idle + (quiet ? step : -step)));
    if (this.idle <= 0) return;
    const k = smoother(this.idle);
    const game = this.camPose();
    const c = st.asm.centre;
    const dir = sub(game.pos, c);
    const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    const dist = st.sceneSpec.orbit?.bootDistanceM ?? 3;
    const out = add(c, scale(dir, dist / len));
    this.writeCamera({ pos: lerp3(game.pos, out, k), target: lerp3(game.target, c, k), up: game.up });
  }

  private writeCamera(p: CamPose): void {
    const c = this.st.camera;
    const n = Math.hypot(p.up[0], p.up[1], p.up[2]) || 1;
    c.upVector = new Vector3(p.up[0] / n, p.up[1] / n, p.up[2] / n);
    c.setPosition(new Vector3(p.pos[0], p.pos[1], p.pos[2]));
    c.setTarget(new Vector3(p.target[0], p.target[1], p.target[2]));
  }
}
