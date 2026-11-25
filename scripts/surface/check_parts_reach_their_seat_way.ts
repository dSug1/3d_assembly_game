// ⭐ THE WAY IN A SCENE NAMES FOR A PART (SCENE_WORKFLOW.md §8.3) — moved out of check_parts_reach_their_seat.ts (2026-11-24, S8) so that the landing
// check (check_where_each_part_lands.ts: B4's "a direction starts at a place") reads the SAME way in. The direction INTO its seat is its own seat
// marker's normal; the withdrawal is minus it. Which marker:
//   1. the plan file's, when it names one;
//   2. else the marker a PLUNGE GHOST authored for this part lands on (the ghost's `to` marker, on a placed part, meets it) — "ghost";
//   3. else the part's markers that MEET a placed part's marker (coincident, anti-parallel: a seat pair): one direction — "seat"; several — "seats"
//      (each is checked; the scene should name one);
//   4. else none — the entry set is still computed, the way in is reported as not named.
// (A marker of the part that meets only a LATER part's marker is where that later part seats ON it: not its own way in.)
import type { ModelGhost, ModelPart, ModelSeat } from "../../src/core/model_catalog";
import { angleBetween, deg, unit, type V } from "./check_parts_reach_their_seat_geom";

// ─── a SEAT PAIR: a marker of the part and a marker of a placed part, coincident and anti-parallel within these (PART_AUTHORING.md §3 item 4)
export const PAIR_MM = 0.1, PAIR_DEG = 0.1;
const minus = (v: readonly number[]): V => [-v[0]!, -v[1]!, -v[2]!];

/** a plan file's line for a part: the seat marker whose normal is its way in, the plan's words */
export interface PlanLine { readonly marker?: string; readonly says?: string }
export interface WayIn { how: "plan file" | "ghost" | "seat" | "seats" | "none"; says: string; markers: ModelSeat[] }

/** the placed parts' markers a marker `s` MEETS (coincident within PAIR_MM, anti-parallel within PAIR_DEG); `mm`: the file's unit → mm */
export const meets = (s: ModelSeat, hosts: readonly ModelPart[], mm: number): string[] =>
  hosts.flatMap((h) => h.seats.filter((t) => Math.hypot(s.position[0] - t.position[0], s.position[1] - t.position[1], s.position[2] - t.position[2]) * mm <= PAIR_MM
    && deg(angleBetween(unit(s.normal), unit(minus(t.normal)))) <= PAIR_DEG).map((t) => t.node));

/** ⭐ the part's way in at its stage (`placedParts` placed before it), from the plan file's `line`, its ghosts' plunges or its seat pairs */
export function wayIn(part: ModelPart, placedParts: readonly ModelPart[], ghosts: { g: ModelGhost; host: string }[], line: PlanLine | undefined, mm: number): WayIn {
  if (line?.marker) {
    const m = part.seats.find((s) => s.node === line.marker);
    if (!m) throw new Error(`${part.id}: the plan file names the marker ${line.marker}; the part's seat markers are ${part.seats.map((s) => s.node).join(" ") || "none"}`);
    return { how: "plan file", says: line.says ?? `the plan file: ${m.node}`, markers: [m] };
  }
  const own = part.seats.filter((s) => meets(s, placedParts, mm).length > 0);
  for (const { g } of ghosts) {
    if (!g.plunge) continue;
    const m = own.find((s) => meets(s, placedParts, mm).includes(g.plunge!.to));
    if (m) return { how: "ghost", says: line?.says ?? `the plunge of the ghost ${g.node} onto ${g.plunge.to} (the part's ${m.node})`, markers: [m] };
  }
  const dirs: ModelSeat[] = [];
  for (const s of own) if (!dirs.some((t) => angleBetween(unit(s.normal), unit(t.normal)) < 1e-4)) dirs.push(s);
  const list = own.map((s) => `${s.node} on ${meets(s, placedParts, mm).join(" + ")}`).join("; ");
  if (dirs.length === 1) return { how: "seat", says: line?.says ?? `onto its seat: ${list}`, markers: dirs };
  if (dirs.length > 1) return { how: "seats", says: line?.says ?? `${dirs.length} seats on placed parts, none named as the way in: ${list}`, markers: dirs };
  return { how: "none", says: line?.says ?? "no seat marker of this part meets a placed part's marker: its way in is not named", markers: [] };
}
