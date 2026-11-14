/**
 * ⭐ **A `.glb`'s GEOMETRY, read engine-free** (2026-11-13 — the boot stage's heaps, `SCENE_2_ASSEMBLY.md` §2.5): the BIN chunk's vertex positions,
 * each part's COLLISION PIECES (`UCX_`, convex) in the PART's own frame, and each part's goal placement in the scene frame (the reference's,
 * y up — the frame every marker's position is recorded in, `model_catalog.ts`).
 */
import { add, qmul, qRotate, type Quat, type Vec3 } from "./vec";
import type { ModelCatalog } from "./model_catalog";

interface Node {
  readonly name?: string;
  readonly children?: readonly number[];
  readonly mesh?: number;
  readonly translation?: readonly number[];
  readonly rotation?: readonly number[];
  readonly scale?: readonly number[];
}
interface Gltf {
  readonly nodes: readonly Node[];
  readonly meshes: readonly { readonly primitives: readonly { readonly attributes: Readonly<Record<string, number>> }[] }[];
  readonly accessors: readonly { readonly bufferView: number; readonly byteOffset?: number; readonly count: number; readonly componentType: number; readonly type: string }[];
  readonly bufferViews: readonly { readonly byteOffset?: number; readonly byteLength: number; readonly byteStride?: number }[];
}

/** A rigid placement: `p ↦ rotation · p + position` (no scale: the build exports none below the root). */
export interface Placement {
  readonly position: Vec3;
  readonly rotation: Quat;
}

export const apply = (t: Placement, p: Vec3): Vec3 => add(qRotate(t.rotation, p), t.position);
export const compose = (outer: Placement, inner: Placement): Placement => ({
  position: apply(outer, inner.position),
  rotation: qmul(outer.rotation, inner.rotation),
});

const quatOf = (r: readonly number[] | undefined): Quat => (r ? [r[3]!, r[0]!, r[1]!, r[2]!] : [1, 0, 0, 0]);
const local = (n: Node): Placement => ({ position: (n.translation as Vec3 | undefined) ?? [0, 0, 0], rotation: quatOf(n.rotation) });

/** The BIN chunk of a `.glb` (the second chunk). */
export function glbBin(bytes: Uint8Array): Uint8Array {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLen = dv.getUint32(12, true);
  const at = 20 + jsonLen;
  const binLen = dv.getUint32(at, true);
  return bytes.subarray(at + 8, at + 8 + binLen);
}

/** A float VEC3 accessor's points. */
export function accessorPoints(g: Gltf, bin: Uint8Array, accessor: number): Vec3[] {
  const acc = g.accessors[accessor]!;
  if (acc.componentType !== 5126 || acc.type !== "VEC3") throw new Error(`accessor ${accessor}: not float VEC3`);
  const bv = g.bufferViews[acc.bufferView]!;
  const dv = new DataView(bin.buffer, bin.byteOffset + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0));
  const stride = bv.byteStride ?? 12;
  const out: Vec3[] = [];
  for (let i = 0; i < acc.count; i++) out.push([dv.getFloat32(i * stride, true), dv.getFloat32(i * stride + 4, true), dv.getFloat32(i * stride + 8, true)]);
  return out;
}

/** An index accessor's values (unsigned byte, short or int). */
export function accessorIndices(g: Gltf, bin: Uint8Array, accessor: number): number[] {
  const acc = g.accessors[accessor]!;
  const bv = g.bufferViews[acc.bufferView]!;
  const dv = new DataView(bin.buffer, bin.byteOffset + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0));
  const size = acc.componentType === 5121 ? 1 : acc.componentType === 5123 ? 2 : acc.componentType === 5125 ? 4 : 0;
  if (size === 0 || acc.type !== "SCALAR") throw new Error(`accessor ${accessor}: not an index accessor`);
  const out: number[] = [];
  for (let i = 0; i < acc.count; i++) out.push(size === 1 ? dv.getUint8(i) : size === 2 ? dv.getUint16(i * 2, true) : dv.getUint32(i * 4, true));
  return out;
}

/** ⭐ A triangle mesh (positions and their triangles, three indices each). */
export interface TriMesh {
  readonly positions: readonly Vec3[];
  readonly indices: readonly number[];
}

/**
 * ⭐⭐ (2026-11-14, `PICK_AND_PLACE.md`) Each part's FACE PROXY (`UFM_` — the real faces; the ghosts apart) as ONE triangle mesh in the PART's
 * frame (reference units): what the face map, the gizmo and the resting-face quads read once the part is a body.
 */
export function partFaces(json: unknown, bin: Uint8Array, catalog: ModelCatalog): { readonly id: string; readonly mesh: TriMesh }[] {
  const g = json as Gltf & { readonly meshes: readonly { readonly primitives: readonly { readonly attributes: Readonly<Record<string, number>>; readonly indices?: number }[] }[] };
  const byName = new Map(g.nodes.map((n, i) => [n.name ?? `#${i}`, i]));
  return catalog.parts.map((part) => {
    const real = new Set(part.faces);
    const positions: Vec3[] = [];
    const indices: number[] = [];
    const walk = (i: number, toPart: Placement): void => {
      const n = g.nodes[i]!;
      const here = compose(toPart, local(n));
      if (n.mesh !== undefined && real.has(n.name ?? "")) {
        for (const pr of g.meshes[n.mesh]!.primitives) {
          const base = positions.length;
          for (const p of accessorPoints(g, bin, pr.attributes["POSITION"]!)) positions.push(apply(here, p));
          const idx = pr.indices === undefined ? positions.slice(base).map((_, k) => k) : accessorIndices(g, bin, pr.indices);
          for (const k of idx) indices.push(base + k);
        }
      }
      for (const c of n.children ?? []) walk(c, here);
    };
    const pi = byName.get(part.node);
    if (pi !== undefined) for (const c of g.nodes[pi]!.children ?? []) walk(c, { position: [0, 0, 0], rotation: [1, 0, 0, 0] });
    return { id: part.id, mesh: { positions, indices } };
  });
}

export interface PartGeometry {
  readonly id: string;
  readonly node: string;
  /** Its convex collision pieces, in the PART's frame (reference units). */
  readonly pieces: readonly (readonly Vec3[])[];
  /** Where the part stands at its goal: part frame → scene frame. */
  readonly goal: Placement;
}

/**
 * ⭐ Each part's collision pieces in its own frame and its goal placement. The ROOT's placement is the scene frame's own (`YUP_ROOT`'s turn is the
 * export's axis conversion: the scene frame is what it maps to) — so a part's goal = root ∘ part, a piece's points = (part ← … ← piece) applied.
 */
export function partGeometry(json: unknown, bin: Uint8Array, catalog: ModelCatalog): PartGeometry[] {
  const g = json as Gltf;
  const byName = new Map(g.nodes.map((n, i) => [n.name ?? `#${i}`, i]));
  const rootIdx = byName.get(catalog.root)!;
  const root = local(g.nodes[rootIdx]!);
  return catalog.parts.map((part) => {
    const pi = byName.get(part.node)!;
    const pieces: Vec3[][] = [];
    const walk = (i: number, toPart: Placement): void => {
      const n = g.nodes[i]!;
      const here = compose(toPart, local(n));
      if (n.mesh !== undefined && (n.name ?? "").startsWith("UCX_")) {
        for (const pr of g.meshes[n.mesh]!.primitives) pieces.push(accessorPoints(g, bin, pr.attributes["POSITION"]!).map((p) => apply(here, p)));
      }
      for (const c of n.children ?? []) walk(c, here);
    };
    for (const c of g.nodes[pi]!.children ?? []) walk(c, { position: [0, 0, 0], rotation: [1, 0, 0, 0] });
    return { id: part.id, node: part.node, pieces, goal: compose(root, local(g.nodes[pi]!)) };
  });
}
