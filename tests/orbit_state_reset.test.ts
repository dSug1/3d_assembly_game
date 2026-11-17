// ⭐⭐⭐ (2026-11-15, `ORBIT_STATE_INVENTORY.md` F.2; the owner: *"this is not intended. Fix it."*) — THE ORBIT'S STARTING STATE HAS ONE HOME
// (`orbitStateStart`, `render/assembly_wiring.ts`): the scene's creation and the pick-up (`model_bodies_wiring.ts`) both apply it (`resetOrbitState`), so a
// newly held part starts as the first one did — no tilt, zone, calm, mouth, dy hold or pending tilt carried from the last part; and a piece spawned
// again (the test scenes' piece switch, the stuck respawn — `spawnOrbitPiece`, not at the boot) applies it too. ⛔ Before: set at the
// creation only; a pick-up cleared four fields, a put-down none. RED on mutants: a field left out of `orbitStateStart`; a starting value changed; the
// square camera's object shared between calls; the pick-up's call removed; the creation's call removed; the memo's clearing removed.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { orbitStateStart, resetOrbitState } from "../src/render/assembly_wiring";
import type { SceneState } from "../src/render/scene_state";

const raw = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = (f: string) => raw(f).replace(/\s+/g, " ");
/** one function's source, from its signature to the first closing brace at its own indentation */
function fnSource(f: string, sig: string, close = "\n}\n"): string {
  const s = raw(f);
  const i = s.indexOf(sig);
  expect(i, `${sig} not found`).toBeGreaterThanOrEqual(0);
  return s.slice(i, s.indexOf(close, i) + close.length).replace(/\s+/g, " ");
}

/** ⭐ The fields RESET (HISTORY, TRANSITION, VIEW of the inventory's table A, and `asmSupport`, `asmOrbitMm`) and their starting values — the creation's
 *  as they were written in `scene.ts` before this change. */
const RESET: Record<string, unknown> = {
  asmGizmo: null,
  asmSupport: null,
  asmSupportLevel: null,
  pieceHold: null,
  pieceHoldPrev: null,
  asmLook: null,
  asmFacePoint: null,
  asmG: null,
  asmPrevQ: null,
  asmShown: null,
  asmFaceBand: null,
  asmFree: null,
  asmPlaceWas: null,
  asmMapQ: null,
  asmEdgeHold: null,
  asmZone: null,
  asmZoneMix: null,
  asmPieceDrawn: null,
  asmDirEase: null,
  asmCamLast: null,
  asmSpitSide: 0,
  asmSpitU: null,
  asmZoneAlpha: 0,
  asmDySign: 0,
  asmHeadO: null,
  asmHeadW: 1,
  asmHeadYaw: null,
  asmTilt: null,
  asmGOff: null,
  asmTiltAuto: false,
  asmTiltPending: false,
  asmOrbitMm: 0,
  asmBlend: null,
  asmCalmWhole: 0,
  asmCalmWholeV: 0,
  asmSquare: { n: null, target: null, q: 0 },
  asmCalm: null,
  asmMouth: null,
  asmRawPrev: null,
  asmGizmoAt: null,
  asmGizmoLag: null,
};
/** ⭐ The fields KEPT: the GEOMETRY caches (`asm` the pick's own), the RENDER objects, the re-entrancy flag, the running count. */
const KEPT = [
  "asm", "asmZones", "asmAtlas", "asmFaceMap", "asmWorldMap", "asmParts", "asmKey", "asmCast", "asmShell",
  "asmSectionLines", "asmSectionKey", "asmZoneMesh", "asmRedCache", "asmGreenCache",
  "asmRestOff", "pieceHoldCount",
];

describe("⭐⭐⭐ the orbit's starting state (`orbitStateStart`, `resetOrbitState`)", () => {
  it("every `asm…` / `pieceHold…` field of the scene's state is decided: reset or kept (57)", () => {
    const decl = [...raw("render/scene_state.ts").matchAll(/^ {2}((?:asm|pieceHold)\w*)\??:/gm)].map((m) => m[1]!);
    expect(decl.length).toBe(57); // ⭐ (2026-11-16, C2W) + `asmPlaceWas`; ⛔ (step 2.5) − `asmZoneFacetsF` (`zoneFacetOf`'s memo, deleted with the old calm)
    expect([...Object.keys(RESET), ...KEPT].sort()).toEqual([...decl].sort());
  });

  it("returns exactly the reset fields at their starting values, each composite a fresh object", () => {
    const s = orbitStateStart() as unknown as Record<string, unknown>;
    expect(Object.keys(s).sort()).toEqual(Object.keys(RESET).sort());
    for (const [k, v] of Object.entries(RESET)) expect(s[k], k).toEqual(v);
    expect(orbitStateStart().asmSquare).not.toBe(orbitStateStart().asmSquare);
  });

  it("on a state whose every field is dirtied: the reset fields back to their start, the kept ones untouched", () => {
    const st: Record<string, unknown> = {};
    const dirty = new Map<string, unknown>();
    for (const k of [...Object.keys(RESET), ...KEPT]) {
      const v = { dirty: k };
      st[k] = v;
      dirty.set(k, v);
    }
    resetOrbitState(st as unknown as SceneState);
    for (const [k, v] of Object.entries(RESET)) expect(st[k], k).toEqual(v);
    for (const k of KEPT) expect(st[k], k).toBe(dirty.get(k));
  });

  it("the memo cleared with it (keyed by the frame and the angles only)", () => {
    const f = fnSource("render/assembly_wiring.ts", "export function resetOrbitState(");
    expect(f).toContain("Object.assign(st, orbitStateStart());");
    expect(f).toContain("GIZMO_MEMO.delete(st);");
  });
});

describe("⭐⭐⭐ one home: the creation and the pick-up both apply it", () => {
  it("the scene's creation applies it and sets none of the reset fields itself", () => {
    const s = code("render/scene.ts");
    expect(s).toContain("st.asm = null; // ⭐⭐⭐ (2026-11-15) the orbit's starting state from its ONE home (`orbitStateStart`) — the pick-up resets to the same (`model_bodies_wiring.ts`) resetOrbitState(st);");
    for (const k of Object.keys(RESET)) expect(s, k).not.toMatch(new RegExp(`\\bst\\.${k} = `));
  });

  it("the pick-up applies it, after the piece orbit's own reset and before the assembly is read", () => {
    const p = fnSource("render/model_bodies_wiring.ts", "  private pick(", "\n  }\n");
    expect(p).toMatch(/resetPieceOrbit\(st\); (\/\/[^;]*?)?resetOrbitState\(st\); st\.asm = null; applyCamera\(st\);/);
    expect(p.indexOf("resetOrbitState(st);")).toBeLessThan(p.indexOf("ensureAssembly(st);"));
    const m = code("render/model_bodies_wiring.ts");
    for (const k of Object.keys(RESET)) expect(m, k).not.toMatch(new RegExp(`\\bst\\.${k} = `));
  });

  // ⭐⭐⭐ (2026-11-15, the owner: *"State reset: do what is best for"* — the builder's call) the test scenes' piece switch and the stuck piece's respawn
  // put the orbit back at its boot angles (`spawnOrbitPiece`, not at the boot): the orbit's state with it — ⛔ before, the tilt, the zone's turn, the calm,
  // the dy hold and the map's angles of where the piece WAS stayed, against angles that had just jumped to the boot's. RED on the code before (no call).
  it("a piece spawned again (the switch, the stuck respawn) applies it, after the piece orbit's own reset — the boot's spawn does not (the creation did)", () => {
    const s = fnSource("render/green_box_wiring.ts", "export function spawnOrbitPiece(");
    // ⭐ …and the spring's last place cleared with it (`boxOrbit`): the assembly's frame reads it before the spring starts again — ⛔ left, the gizmo was
    // put for ONE frame at the last place's angles read in the world's frame (probed: low on `Scene_1`'s front, then the boot's place). RED without it.
    expect(s).toMatch(/if \(!atBoot\) \{ st\.orbit = new OrbitController\([^;]*\); (\/\/[^;]*?)?resetPieceOrbit\(st\); (\/\/[^;]*?)?resetOrbitState\(st\); st\.boxOrbit = null; (\/\/[^;]*?)?\}/);
    expect(s.match(/resetOrbitState\(st\);/g)?.length).toBe(1);
    // the respawn goes through it (its own fields after)
    expect(fnSource("render/green_box_wiring.ts", "export function respawnStuckPiece(")).toMatch(/\{ spawnOrbitPiece\(st, st\.orbitPieceKind, false\);/);
  });
});
