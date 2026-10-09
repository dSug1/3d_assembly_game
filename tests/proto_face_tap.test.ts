/**
 * ⭐⭐ prototype — A TAP ON THE ORBITED PIECE MAKES THE FACE IT HIT THE RESTING FACE (2026-10-09; the owner: *"when a face of the green
 * piece or the turquoise piece is left button tapped or first touch tapped, the hit face becomes the resting face and it aligns. the roll
 * to the next edge is then implemented on this new resting face"*).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { candidateForFace, restingFaces, type RestingResult } from "../src/core/resting_face";
import { restingFaceTap } from "../src/input/orbit_tap";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { meshTopology } from "../src/core/mesh_topology";

const box = CreateBox("b", { width: 2, height: 1, depth: 1 }, new Scene(new NullEngine()));
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — a tap on the orbited piece sets its resting face", () => {
  it("⭐⭐ the tapped face's candidate: the rule's own (its merged support, its metrics) when it has one; else that face alone, metrics unknown", () => {
    // a 2 × 1 × 1 box from Babylon's own builder: six logical faces, each in the rule's answer (a support or refused by the gate)
    const t = meshTopology(new Float32Array(box.getVerticesData(VertexBuffer.PositionKind)!), box.getIndices()!);
    expect(t.faces.length).toBe(6);
    const r = restingFaces(t.positions, t.faces);
    for (let i = 0; i < 6; i++) {
      const c = candidateForFace(r, i, t.faces[i]!.normal);
      expect(c.faces).toContain(i);
      expect(Number.isFinite(c.thetaDeg)).toBe(true);
    }
    // a face the rule never listed: itself, its normal, metrics NaN
    const empty: RestingResult = { com: [0, 0, 0], groups: [], rejected: [], winner: null, belowGate: false, ambiguous: null, principalAxis: null };
    const lone = candidateForFace(empty, 3, [0, 1, 0]);
    expect(lone.faces).toEqual([3]);
    expect(lone.normal).toEqual([0, 1, 0]);
    expect(Number.isNaN(lone.thetaDeg)).toBe(true);
  });

  it("⭐ only the FIRST touch (or the left button) on the orbited piece, outside the edge band", () => {
    expect(restingFaceTap(true, true, false)).toBe(true);
    expect(restingFaceTap(false, true, false)).toBe(false); // not on the piece
    expect(restingFaceTap(true, false, false)).toBe(false); // a second touch: its tap aligns or rolls
    expect(restingFaceTap(true, true, true)).toBe(false); // in the edge band: empty space
  });

  it("⭐⭐ wired: the face recorded at the press; at a TAP release with nothing else down, the resting face set, then ALIGNED — consumed before the camera-reset tap", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p).toMatch(/const first = st\.router\.all\(\)\.length === 0;/); // asked before this press is routed
    expect(p.indexOf("const first = st.router.all().length === 0;")).toBeLessThan(p.indexOf("const routed = st.router.press(e.pointerId, s, hit);"));
    expect(p).toMatch(/st\.pieceFaceTap = restingFaceTap\(onPiece, first, inBand\) && face !== null \? \{ pointerId: e\.pointerId, faceId: face\.faceId \} : null;/);
    expect(p).toMatch(/st\.router\.all\(\)\.length === 0 &&\s*isTapRelease\(routed\.pressed\.t, routed\.pressed\.x, routed\.pressed\.y, s\.t, s\.x, s\.y, st\.cfg\.tapMaxDuration, mmToPx\(st\.cfg\.doubleTapSlop\)\);/);
    expect(p).toMatch(/if \(tapped && restOnTappedFace\(st, ft\.faceId\) && alignRestingFace\(st, performance\.now\(\)\)\) \{\s*st\.episodes\.touch\(--st\.episodeSeq, true, true\);/);
    expect(p.indexOf("restOnTappedFace(st, ft.faceId)")).toBeLessThan(p.indexOf("ONE call, ONE record: it judges the tap"));
    const w = code("render/green_box_wiring.ts");
    const fn = w.slice(w.indexOf("export function restOnTappedFace"), w.indexOf("export function restTargetKey"));
    expect(fn).toMatch(/if \(p\.restingFace !== null && p\.restingFace\.faces\.includes\(idx\)\) return true;/);
    expect(fn).toMatch(/p\.restingFill\?\.dispose\(\);/);
    expect(fn).toMatch(/st\.orbitPieces\[i\] = \{ \.\.\.p, restingFace: cand, \.\.\.restingParts\(st, p\.mesh, topo, cand\) \};/);
    expect(fn).toMatch(/st\.world = setRestingFace\(st\.world, p\.mesh\.name, \{ \.\.\.rec, why: "TAPPED" \}\);/);
    // the piece's depth clone and transparent pass are set once, at creation — never again for a new face
    expect(w).toMatch(/const parts = restingParts\(st, m, topo, restingFace\);\s*restingDepth\(st, m\);/);
    expect(fn).not.toMatch(/restingDepth/);
  });
});
