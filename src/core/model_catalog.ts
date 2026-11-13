/**
 * ⭐⭐ **A SCENE'S `.glb`, READ AS THE GAME'S DATA — and REFUSED, by name, where it breaks a convention** (W4 of
 * `20_GAME_RULES/spec/SCENE_WORKFLOW.md`; the conventions: `30_OBJECTS_3D/spec/PART_AUTHORING.md` §3, §4.4; `3D4`).
 *
 * The owner, 2026-11-13: *"proceed with building the slice of playable game"* — the slice of `Scene_2` (the plinth, the lower case, the crankshaft,
 * the pulley; `SCENE_2_ASSEMBLY.md`). ⭐ Babylon's glTF reader (`@babylonjs/loaders`) makes the MESHES (`render/model_import.ts`); THIS module reads
 * the file's JSON — which parts it holds, what each child IS (its `role`), the seats, hinges and ghosts with their numbers — and checks it, so the
 * rules are testable headlessly on the real file and on broken copies (`tests/model_catalog.test.ts`).
 *
 * ⛔ Every refusal is NAMED (the node, the rule): a file that breaks a convention never loads half-right (`METHOD.md`: *a skipped check must be
 * announced*). ⛔ Engine-free — nothing here may import the renderer (`tests/boundary.test.ts`).
 */
import type { Quat, Vec3 } from "./vec";
import { dot, length, qRotate, sub } from "./vec";

/** What a part's child IS — the `role` the Blender build writes on every object (`PART_AUTHORING.md` §3, §4.4). */
export type ModelRole = "render" | "ucx" | "ufm" | "seat" | "hinge";

export interface ModelRender {
  readonly node: string;
  /** ⭐ §3 item 1bis: a label (a crown's number) — the game may hide it. */
  readonly metadata: boolean;
  /** ⭐ §3bis: hidden until its part seats (a rod's cap). */
  readonly appearsWhenSeated: boolean;
  /** The hinge it turns on at the level's end (`HINGE_<part>_<name>`), if any. */
  readonly hinge: string | null;
}

/**
 * ⭐ §3 item 3: a GHOST face, read only while ITS part is held. At a hole's mouth it carries the PLUNGE from there onto the host's seat marker
 * (`Scene_2`: the crank into the tub); a ghost that only BRIDGES openings for a part to rest on (`Scene_2`'s slopes, for the banks) has none.
 */
export interface ModelGhost {
  readonly node: string;
  readonly forPart: string;
  readonly plunge: { readonly axis: Vec3; readonly depth: number; readonly to: string } | null;
}

/** ⭐ §3 item 4: a SEAT marker — its frame in REFERENCE UNITS, +Y up (§4.4 item 3). */
export interface ModelSeat {
  readonly node: string;
  readonly position: Vec3;
  readonly normal: Vec3;
  readonly twist: Vec3;
}

export interface ModelHinge {
  readonly node: string;
  readonly position: Vec3;
  readonly axis: Vec3;
  readonly lockedAtDeg: number;
}

export interface ModelPart {
  /** `E01` … — the plan's id (`part_id`). */
  readonly id: string;
  /** The part's node name (`E01_plinth`). */
  readonly node: string;
  /** The plan's step (`step`): the order the parts are placed in. */
  readonly step: number;
  /** PRE-PLACED and immovable: the anchor (`SCENE_WORKFLOW.md` §2.3 rule 9). */
  readonly frozen: boolean;
  /** Interchangeable copies (`FinalPose.kind`, `D183`); `""` none. */
  readonly kind: string;
  /** The look-alike turns at the goal; `""` none. */
  readonly symmetry: string;
  readonly renders: readonly ModelRender[];
  /** `UCX_` — the convex collision pieces. */
  readonly ucx: readonly string[];
  /** `UFM_` — the face proxy's real faces (ghosts apart). */
  readonly faces: readonly string[];
  readonly ghosts: readonly ModelGhost[];
  readonly seats: readonly ModelSeat[];
  readonly hinges: readonly ModelHinge[];
}

export interface ModelCatalog {
  /** The root node (`YUP_ROOT`). */
  readonly root: string;
  /** Metres per reference unit (`unitM` on the root). */
  readonly unitM: number;
  /** In the plan's order (`step`, then id). */
  readonly parts: readonly ModelPart[];
  /**
   * ⭐ The scene's FLOOR, designed in its Blender file (the owner, 2026-11-13: *"update the md files to capture that the floor is designed in the
   * blender file of the scene"*): a child of the root with role `floor` and a mesh, never a part (never placed). `null`: the file has none (the
   * level's own floor body is drawn). At most one.
   */
  readonly floor: string | null;
}

export interface CatalogResult {
  /** `null` when anything was refused — never a half-read catalogue. */
  readonly catalog: ModelCatalog | null;
  readonly refusals: readonly string[];
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The GLB container (glTF 2.0 binary): a 12-byte header, then chunks; the first is the JSON.

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"

/** ⭐ The JSON chunk of a `.glb`, parsed — or a NAMED reason it is not one. */
export function glbJson(bytes: Uint8Array): { json: unknown } | { refusal: string } {
  if (bytes.byteLength < 20) return { refusal: `not a .glb: ${bytes.byteLength} bytes` };
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== GLB_MAGIC) return { refusal: "not a .glb: no 'glTF' magic" };
  const version = dv.getUint32(4, true);
  if (version !== 2) return { refusal: `not a glTF 2.0 .glb: version ${version}` };
  const len = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== CHUNK_JSON || 20 + len > bytes.byteLength) return { refusal: "not a .glb: its first chunk is not JSON" };
  try {
    return { json: JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + len))) };
  } catch (e) {
    return { refusal: `the .glb's JSON does not parse: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The node tree, its transforms (glTF: TRS, rotation [x, y, z, w]), and the checks.

interface GltfNode {
  readonly name?: string;
  readonly children?: readonly number[];
  readonly mesh?: number;
  readonly translation?: readonly number[];
  readonly rotation?: readonly number[];
  readonly scale?: readonly number[];
  readonly extras?: Record<string, unknown>;
}

interface Gltf {
  readonly scene?: number;
  readonly scenes?: readonly { readonly nodes?: readonly number[] }[];
  readonly nodes?: readonly GltfNode[];
  readonly materials?: readonly { readonly name?: string; readonly doubleSided?: boolean }[];
  readonly animations?: readonly unknown[];
  readonly cameras?: readonly unknown[];
}

/** ⭐ How far a marker's recorded frame may be from its node's own (reference units) — §4.4 item 4's read-back tolerance. */
export const MARKER_TOLERANCE = 1e-4;

const vec3Of = (v: unknown): Vec3 | null =>
  Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === "number" && Number.isFinite(x)) ? [v[0], v[1], v[2]] : null;

const quatOf = (r: readonly number[] | undefined): Quat => (r ? [r[3]!, r[0]!, r[1]!, r[2]!] : [1, 0, 0, 0]);

/** A point given in node `i`'s own frame, carried up to the scene (every parent's TRS applied). */
function toScene(nodes: readonly GltfNode[], parentOf: ReadonlyMap<number, number>, i: number, p: Vec3, isDirection: boolean): Vec3 {
  let v = p;
  for (let n: number | undefined = i; n !== undefined; n = parentOf.get(n)) {
    const nd = nodes[n]!;
    const s = nd.scale ?? [1, 1, 1];
    v = qRotate(quatOf(nd.rotation), [v[0] * s[0]!, v[1] * s[1]!, v[2] * s[2]!]);
    if (!isDirection) {
      const t = nd.translation ?? [0, 0, 0];
      v = [v[0] + t[0]!, v[1] + t[1]!, v[2] + t[2]!];
    }
  }
  return v;
}

const ROLES: readonly ModelRole[] = ["render", "ucx", "ufm", "seat", "hinge"];
const PREFIX: Partial<Record<ModelRole, string>> = { ucx: "UCX_", ufm: "UFM_", seat: "MC_", hinge: "HINGE_" };

/**
 * ⭐⭐ The catalogue — or every refusal, named. The checks (each with its broken copy in the vectors):
 * ① one root carrying `unitM` > 0, its children the parts; ② each part a `part_id` (unique), a `step`, `frozen`; ③ every descendant a known `role`,
 * its name's prefix the role's (`UCX_`, `UFM_`, `MC_`, `HINGE_`), a render / collision / face node carrying a mesh; ④ each seat a unit `normal`
 * and `twist` square to it, ⭐ its `position` and `normal` its node's OWN place and +Y carried up to the root (the AXES check: a file exported
 * without the +Y-up conversion fails here); ⑤ each ghost's `for_part` a part of the file, its `plunge_to` a seat marker of that part's HOST (this
 * part), its axis a unit vector, its plunge > 0; ⑥ every material one-sided; no animation, no camera (§4.4 item 2).
 */
export function readModelCatalog(json: unknown): CatalogResult {
  const refusals: string[] = [];
  const g = json as Gltf;
  const nodes = g?.nodes ?? [];
  const sceneRoots = g?.scenes?.[g.scene ?? 0]?.nodes ?? [];
  const nameOf = (i: number): string => nodes[i]?.name ?? `#${i}`;

  const parentOf = new Map<number, number>();
  nodes.forEach((n, i) => (n.children ?? []).forEach((c) => parentOf.set(c, i)));

  // ⑥ the file as a whole
  (g?.materials ?? []).forEach((m, i) => {
    if (m.doubleSided) refusals.push(`material ${m.name ?? i}: double-sided (every material one-sided — PART_AUTHORING §4.4)`);
  });
  if ((g?.animations ?? []).length > 0) refusals.push(`${g.animations!.length} animation(s): none allowed (the game computes the motion — §4.4)`);
  if ((g?.cameras ?? []).length > 0) refusals.push(`${g.cameras!.length} camera(s): none allowed (§4.4)`);

  // ① the root
  const rootIdx = sceneRoots.length === 1 ? sceneRoots[0]! : -1;
  const root = rootIdx >= 0 ? nodes[rootIdx] : undefined;
  const unitM = root?.extras?.["unitM"];
  if (root === undefined) refusals.push(`the scene has ${sceneRoots.length} root nodes: exactly one (the Y-up root carrying unitM) expected`);
  else if (typeof unitM !== "number" || !(unitM > 0)) refusals.push(`root ${nameOf(rootIdx)}: no unitM > 0 in its extras`);

  const parts: ModelPart[] = [];
  const ids = new Set<string>();
  const floors: string[] = [];
  for (const pi of root?.children ?? []) {
    const pn = nodes[pi]!;
    const pname = nameOf(pi);
    const ex = pn.extras ?? {};
    // ⭐ the scene's floor: a child of the root, not a part — a mesh, nothing under it
    if (ex["role"] === "floor") {
      if (pn.mesh === undefined) refusals.push(`${pname}: role floor without a mesh`);
      if ((pn.children ?? []).length > 0) refusals.push(`${pname}: the floor has children (it is one face, never a part)`);
      floors.push(pname);
      continue;
    }
    // ② the part
    const id = ex["part_id"];
    if (typeof id !== "string" || id === "") {
      refusals.push(`${pname}: a child of the root without a part_id`);
      continue;
    }
    if (ids.has(id)) refusals.push(`${pname}: part_id ${id} used twice`);
    ids.add(id);
    const step = ex["step"];
    if (typeof step !== "number" || !Number.isInteger(step) || step < 1) refusals.push(`${pname}: no step (a whole number ≥ 1)`);
    if (ex["frozen"] !== 0 && ex["frozen"] !== 1) refusals.push(`${pname}: frozen must be 0 or 1`);

    const renders: ModelRender[] = [];
    const ucx: string[] = [];
    const faces: string[] = [];
    const ghosts: ModelGhost[] = [];
    const seats: ModelSeat[] = [];
    const hinges: ModelHinge[] = [];
    const stack = [...(pn.children ?? [])];
    while (stack.length > 0) {
      const ci = stack.pop()!;
      const cn = nodes[ci]!;
      stack.push(...(cn.children ?? []));
      const cname = nameOf(ci);
      const cx = cn.extras ?? {};
      // ③ the role
      const role = cx["role"] as ModelRole;
      if (!ROLES.includes(role)) {
        refusals.push(`${cname} (in ${pname}): unknown role ${JSON.stringify(cx["role"])}`);
        continue;
      }
      const prefix = PREFIX[role];
      if (prefix !== undefined && !cname.startsWith(prefix)) refusals.push(`${cname}: role ${role} but its name does not start with ${prefix}`);
      if ((role === "render" || role === "ucx" || role === "ufm") && cn.mesh === undefined) refusals.push(`${cname}: role ${role} without a mesh`);
      if (role === "render") {
        renders.push({
          node: cname,
          metadata: cx["metadata"] === 1,
          appearsWhenSeated: cx["appears_when_seated"] === 1,
          hinge: typeof cx["hinge"] === "string" ? cx["hinge"] : null,
        });
      } else if (role === "ucx") {
        ucx.push(cname);
      } else if (role === "ufm") {
        if (cx["ghost"] === 1) {
          const forPart = cx["for_part"];
          if (typeof forPart !== "string") refusals.push(`${cname}: ghost without for_part`);
          // ⭐ the plunge: all three keys, or none (a bridging ghost)
          const given = ["plunge_axis", "plunge", "plunge_to"].filter((k) => k in cx);
          let plunge: ModelGhost["plunge"] = null;
          if (given.length > 0) {
            const axis = vec3Of(cx["plunge_axis"]);
            const depth = cx["plunge"];
            const to = cx["plunge_to"];
            if (given.length < 3) refusals.push(`${cname}: half a plunge (${given.join(", ")}): plunge_axis, plunge and plunge_to go together`);
            else if (axis === null || Math.abs(length(axis) - 1) > 1e-6) refusals.push(`${cname}: ghost's plunge_axis not a unit vector`);
            else if (typeof depth !== "number" || !(depth > 0)) refusals.push(`${cname}: ghost's plunge not > 0`);
            else if (typeof to !== "string") refusals.push(`${cname}: ghost's plunge_to not a name`);
            else plunge = { axis, depth, to };
          }
          if (typeof forPart === "string") ghosts.push({ node: cname, forPart, plunge });
        } else {
          faces.push(cname);
        }
      } else if (role === "seat") {
        const position = vec3Of(cx["position"]);
        const normal = vec3Of(cx["normal"]);
        const twist = vec3Of(cx["twist"]);
        if (!position || !normal || !twist) {
          refusals.push(`${cname}: a seat needs position, normal and twist`);
          continue;
        }
        // ④ the frame itself, then the AXES check against the node's own place and +Y
        if (Math.abs(length(normal) - 1) > 1e-4 || Math.abs(length(twist) - 1) > 1e-4) refusals.push(`${cname}: normal / twist not unit vectors`);
        if (Math.abs(dot(normal, twist)) > 1e-4) refusals.push(`${cname}: twist not square to the normal`);
        const at = toScene(nodes, parentOf, ci, [0, 0, 0], false);
        const up = toScene(nodes, parentOf, ci, [0, 1, 0], true);
        if (length(sub(at, position)) > MARKER_TOLERANCE) {
          refusals.push(`${cname}: its node is at ${fmt(at)}, its recorded position ${fmt(position)} (the axes: exported without +Y up?)`);
        }
        if (length(sub(up, normal)) > MARKER_TOLERANCE) {
          refusals.push(`${cname}: its node's +Y is ${fmt(up)}, its recorded normal ${fmt(normal)} (the axes: exported without +Y up?)`);
        }
        seats.push({ node: cname, position, normal, twist });
      } else {
        const position = vec3Of(cx["position"]);
        const axis = vec3Of(cx["axis_dir"]);
        const locked = cx["locked_at_deg"];
        if (!position || !axis || typeof locked !== "number") {
          refusals.push(`${cname}: a hinge needs position, axis_dir and locked_at_deg`);
          continue;
        }
        hinges.push({ node: cname, position, axis, lockedAtDeg: locked });
      }
    }
    const byName = (a: { node: string }, b: { node: string }): number => (a.node < b.node ? -1 : a.node > b.node ? 1 : 0);
    parts.push({
      id,
      node: pname,
      step: typeof step === "number" ? step : 0,
      frozen: ex["frozen"] === 1,
      kind: typeof ex["kind"] === "string" ? ex["kind"] : "",
      symmetry: typeof ex["symmetry"] === "string" ? ex["symmetry"] : "",
      renders: renders.sort(byName),
      ucx: ucx.sort(),
      faces: faces.sort(),
      ghosts: ghosts.sort(byName),
      seats: seats.sort(byName),
      hinges: hinges.sort(byName),
    });
  }

  // ⑤ each ghost serves a part of this file and plunges onto a seat of its host
  for (const p of parts) {
    for (const gh of p.ghosts) {
      if (!ids.has(gh.forPart)) refusals.push(`${gh.node}: for_part ${gh.forPart} is not a part of the file`);
      if (gh.plunge !== null && !p.seats.some((s) => s.node === gh.plunge!.to)) {
        refusals.push(`${gh.node}: plunge_to ${gh.plunge.to} is not a seat marker of ${p.node}`);
      }
    }
  }
  if (root !== undefined && parts.length === 0) refusals.push(`root ${nameOf(rootIdx)}: no parts`);
  if (floors.length > 1) refusals.push(`${floors.length} floors (${floors.join(", ")}): at most one`);

  parts.sort((a, b) => a.step - b.step || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return refusals.length > 0 || root === undefined
    ? { catalog: null, refusals }
    : { catalog: { root: nameOf(rootIdx), unitM: unitM as number, parts, floor: floors[0] ?? null }, refusals };
}

const fmt = (v: Vec3): string => `[${v.map((x) => x.toFixed(4)).join(", ")}]`;

/**
 * ⭐ The slice a level plays: the named parts of the catalogue, in the plan's order — or the ids it lacks, named.
 * ⛔ A slice must hold the file's anchor (a frozen part): the goals are absolute poses (`SCENE_WORKFLOW.md` §2.3 rule 9).
 */
export function catalogSlice(catalog: ModelCatalog, ids: readonly string[]): { parts: readonly ModelPart[]; refusals: readonly string[] } {
  const refusals: string[] = [];
  for (const id of ids) if (!catalog.parts.some((p) => p.id === id)) refusals.push(`the slice names ${id}: not a part of the file`);
  const parts = catalog.parts.filter((p) => ids.includes(p.id));
  if (parts.length > 0 && !parts.some((p) => p.frozen)) refusals.push("the slice has no anchor (no frozen part)");
  return { parts, refusals };
}

/** ⭐ What a mesh of the model IS, by the conventions' prefixes (`PART_AUTHORING.md` §3): the look, a collision piece, a face proxy, a ghost. */
export type ModelLayer = "render" | "ucx" | "face" | "ghost";

export function layerOf(name: string, ghosts: ReadonlySet<string>): ModelLayer {
  if (name.startsWith("UCX_")) return "ucx";
  if (name.startsWith("UFM_")) return ghosts.has(name) ? "ghost" : "face";
  return "render";
}

/** ⭐ The `modelLayers` slider → the layers shown: 0 the look only, 1 + the collision pieces, 2 + the face proxies and ghosts, 3 all. */
export function layersShown(v: number): ReadonlySet<ModelLayer> {
  const s = new Set<ModelLayer>(["render"]);
  if (v === 1 || v === 3) s.add("ucx");
  if (v === 2 || v === 3) {
    s.add("face");
    s.add("ghost");
  }
  return s;
}
