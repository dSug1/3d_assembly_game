/**
 * ⭐⭐ **THE CONTACT SHADOWS AS THE ASSEMBLY GETS BUILT** (`40_RENDER_SCENE/spec/SCENE_SETUP.md` §6.3, §6.4; the owner, 2026-11-13: *"we will need a
 * strategy to manage shadows as the assembly gets built by the player"* · *"we may need to bake at each step of assembly to trigger when a part is
 * seated"*). Engine-free.
 *
 * The scene's Blender build bakes each part's OWN occlusion into its vertex colours (the `.glb`'s `COLOR_0`, always on) and, per PAIR of parts that
 * come close at their goals, what one casts on the other — `<scene>_contact.json`: a term per receiver mesh and occluder part, its vertices by their
 * glTF-local POSITION (the exporter splits and reorders vertices) and their factor in [0, 1] (0: buried — a crank pin inside a big end).
 *
 * ⭐ A term APPLIES when BOTH its parts are seated; the applied terms MULTIPLY. The plan is a partial order (several orders valid): a product does not
 * care which came first, so one set of seated parts gives one result whatever the order (Kontkanen & Laine 2005; Iwanicki 2013: occluders
 * accumulated). The renderer recomputes from the baked colours on every seating or unseating — nothing per frame.
 */

/** One baked pair: what part `by` casts on mesh `mesh` of part `part` — `[x, y, z, factor]` per vertex, glTF-local. */
export interface ContactTerm {
  readonly mesh: string;
  readonly part: string;
  readonly by: string;
  readonly points: readonly (readonly [number, number, number, number])[];
}

export interface ContactFile {
  readonly version: 1;
  readonly terms: readonly ContactTerm[];
}

/** ⭐ A vertex's key: its glTF-local position to 1e-4 (the sidecar's rounding) — the renderer keys its own vertices the same way. */
export function positionKey(x: number, y: number, z: number): string {
  const r = (v: number) => (Math.round(v * 1e4) / 1e4).toFixed(4);
  return `${r(x)},${r(y)},${r(z)}`;
}

/** ⭐ The sidecar read and checked — or every refusal, named (a term naming a part not in the file, a factor outside [0, 1], …). */
export function readContactFile(json: unknown, partIds: ReadonlySet<string>): { file: ContactFile | null; refusals: string[] } {
  const refusals: string[] = [];
  const o = json as { version?: unknown; terms?: unknown } | null;
  if (typeof o !== "object" || o === null || o.version !== 1 || !Array.isArray(o.terms)) {
    return { file: null, refusals: ["the contact file: not version 1 with a terms array"] };
  }
  o.terms.forEach((t: Record<string, unknown>, i: number) => {
    const at = `term ${i} (${String(t?.mesh)} by ${String(t?.by)})`;
    if (typeof t?.mesh !== "string" || t.mesh === "") refusals.push(`${at}: no mesh`);
    if (typeof t?.part !== "string" || !partIds.has(t.part)) refusals.push(`${at}: part ${String(t?.part)} is not a part of the model`);
    if (typeof t?.by !== "string" || !partIds.has(t.by)) refusals.push(`${at}: by ${String(t?.by)} is not a part of the model`);
    if (t?.part === t?.by) refusals.push(`${at}: a part shadowing itself (its own occlusion is in its vertex colours)`);
    if (!Array.isArray(t?.points) || t.points.length === 0) refusals.push(`${at}: no points`);
    else if (!(t.points as unknown[]).every((p) => Array.isArray(p) && p.length === 4 && p.every((v) => typeof v === "number" && Number.isFinite(v))))
      refusals.push(`${at}: a point is not [x, y, z, factor]`);
    else if (!(t.points as number[][]).every((p) => p[3]! >= 0 && p[3]! <= 1)) refusals.push(`${at}: a factor outside [0, 1] — a contact only darkens`);
  });
  return refusals.length > 0 ? { file: null, refusals } : { file: o as ContactFile, refusals };
}

/**
 * ⭐⭐ The factors to apply for a SET of seated parts: per receiver mesh, per vertex key, the PRODUCT of the factors of every term whose two parts
 * are seated. A mesh with no applicable term is absent (its baked colours stand).
 */
export function contactFactors(file: ContactFile, seated: ReadonlySet<string>): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const t of file.terms) {
    if (!seated.has(t.part) || !seated.has(t.by)) continue;
    let m = out.get(t.mesh);
    if (m === undefined) out.set(t.mesh, (m = new Map()));
    for (const [x, y, z, f] of t.points) {
      const k = positionKey(x, y, z);
      m.set(k, (m.get(k) ?? 1) * f);
    }
  }
  return out;
}
