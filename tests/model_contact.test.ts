/**
 * ⭐⭐ `core/model_contact.ts` — the contact shadows per pair, switched on when seated (`SCENE_SETUP.md` §6.3). Read on the REAL files (`Scene_2`'s
 * `.glb` and its `_contact.json`), then on broken copies: each claim shown to fail on its counter-example.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contactFactors, positionKey, readContactFile, type ContactFile } from "../src/core/model_contact";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";

const DIR = "../Assets/Blender/World0_Scene2_engine/";
const bytes = new Uint8Array(readFileSync(fileURLToPath(new URL(DIR + "world0_scene_2_engine.glb", import.meta.url))));
const parsed = glbJson(bytes);
if (!("json" in parsed)) throw new Error(parsed.refusal);
const gl = parsed.json as {
  nodes: { name: string; mesh?: number }[];
  meshes: { primitives: { attributes: Record<string, number> }[] }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; type: string }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
};
const catalog = readModelCatalog(gl).catalog!;
const PARTS = new Set(catalog.parts.map((p) => p.id));
const CONTACT = JSON.parse(readFileSync(fileURLToPath(new URL(DIR + "world0_scene_2_engine_contact.json", import.meta.url)), "utf8"));

/** The BIN chunk's float VEC3 positions of a node's mesh (every primitive), keyed as the renderer keys them. */
const jsonLen = new DataView(bytes.buffer, bytes.byteOffset).getUint32(12, true);
const binStart = 20 + jsonLen + 8;
function vertexKeys(nodeName: string): Set<string> {
  const node = gl.nodes.find((n) => n.name === nodeName)!;
  const keys = new Set<string>();
  for (const pr of gl.meshes[node.mesh!]!.primitives) {
    const acc = gl.accessors[pr.attributes["POSITION"]!]!;
    const bv = gl.bufferViews[acc.bufferView]!;
    const dv = new DataView(bytes.buffer, bytes.byteOffset + binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0));
    const stride = bv.byteStride ?? 12;
    for (let i = 0; i < acc.count; i++) keys.add(positionKey(dv.getFloat32(i * stride, true), dv.getFloat32(i * stride + 4, true), dv.getFloat32(i * stride + 8, true)));
  }
  return keys;
}

describe("Scene_2's contact shadows — the real files", () => {
  const { file, refusals } = readContactFile(CONTACT, PARTS);

  it("read with no refusal; every term names two parts of the model, a factor in [0, 1] (0: a buried vertex)", () => {
    expect(refusals).toEqual([]);
    expect(file!.terms.length).toBeGreaterThan(20);
  });

  it("⭐⭐ every term's points ARE vertices of its mesh in the .glb (the Blender → glTF mapping (x, z, −y) proven on the file)", () => {
    let total = 0;
    let found = 0;
    for (const t of file!.terms) {
      const keys = vertexKeys(t.mesh);
      for (const [x, y, z] of t.points) {
        total++;
        if (keys.has(positionKey(x, y, z))) found++;
      }
    }
    expect(found / total).toBeGreaterThan(0.995);
    // the counter-example: the mapping without the axis turn finds (almost) nothing
    const t0 = file!.terms[0]!;
    const k0 = vertexKeys(t0.mesh);
    const wrong = t0.points.filter(([x, y, z]) => k0.has(positionKey(x, -z, y))).length;
    expect(wrong / t0.points.length).toBeLessThan(0.5);
  });

  it("every receiver mesh carries its own baked occlusion (COLOR_0) in the .glb", () => {
    const missing = [...new Set(file!.terms.map((t) => t.mesh))].filter((m) => {
      const node = gl.nodes.find((n) => n.name === m)!;
      return !gl.meshes[node.mesh!]!.primitives.every((pr) => "COLOR_0" in pr.attributes);
    });
    expect(missing).toEqual([]);
  });
});

describe("the factors for a set of seated parts", () => {
  const file = readContactFile(CONTACT, PARTS).file!;
  const all = [...PARTS];

  it("⭐ ANY ORDER gives the same factors (a product) — the plan's several valid orders", () => {
    const a = contactFactors(file, new Set(all));
    const b = contactFactors(file, new Set([...all].reverse()));
    expect([...a.keys()].sort()).toEqual([...b.keys()].sort());
    for (const [mesh, m] of a) for (const [k, v] of m) expect(b.get(mesh)!.get(k)).toBeCloseTo(v, 12);
  });

  it("a term applies only when BOTH its parts are seated; unseating a part lifts its terms (both ways)", () => {
    const t = file.terms[0]!;
    const without = contactFactors(file, new Set(all.filter((p) => p !== t.by)));
    const withIt = contactFactors(file, new Set(all));
    const k = positionKey(t.points[0]![0], t.points[0]![1], t.points[0]![2]);
    expect(withIt.get(t.mesh)!.get(k)!).toBeLessThan(without.get(t.mesh)?.get(k) ?? 1);
    expect(contactFactors(file, new Set([t.part])).size).toBe(0);
  });

  it("a hand-made file: factors multiply per vertex", () => {
    const f: ContactFile = {
      version: 1,
      terms: [
        { mesh: "M", part: "A", by: "B", points: [[0, 0, 0, 0.5]] },
        { mesh: "M", part: "A", by: "C", points: [[0, 0, 0, 0.8], [1, 0, 0, 0.9]] },
      ],
    };
    const m = contactFactors(f, new Set(["A", "B", "C"])).get("M")!;
    expect(m.get(positionKey(0, 0, 0))).toBeCloseTo(0.4, 12);
    expect(m.get(positionKey(1, 0, 0))).toBeCloseTo(0.9, 12);
    expect(contactFactors(f, new Set(["A", "C"])).get("M")!.get(positionKey(0, 0, 0))).toBeCloseTo(0.8, 12);
  });
});

describe("broken contact files — refused, by name", () => {
  const term = { mesh: "E03_crankshaft_mesh", part: "E03", by: "E17", points: [[0, 0, 0, 0.9]] };
  const refused = (terms: unknown[]) => readContactFile({ version: 1, terms }, PARTS);
  it("a factor above 1 (a contact only darkens); a part not in the model; a part shadowing itself; not version 1", () => {
    expect(refused([{ ...term, points: [[0, 0, 0, 1.2]] }]).refusals[0]).toMatch(/only darkens/);
    expect(refused([{ ...term, by: "E99" }]).refusals[0]).toMatch(/by E99 is not a part/);
    expect(refused([{ ...term, by: "E03" }]).refusals[0]).toMatch(/shadowing itself/);
    expect(readContactFile({ version: 2, terms: [] }, PARTS).file).toBeNull();
    expect(refused([term]).file).not.toBeNull();
  });
});
