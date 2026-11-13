/**
 * THE TUNING MENU — every slider, in the owner's order. ⛔ Every tunable is a field of `GestureConfig`; the sliders write THOSE fields.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { validateGestureConfig } from "../input/gestureConfig";
import { createMenu, type MenuSlider } from "./menu";
import { type SceneState } from "./scene_state";
import { applyCamera } from "./camera_rig";
import { paint } from "./hud_paint";

/**
 * ⚠ `performance.now()`, NOT `event.timeStamp`. Their epochs differ by browser
 * (and historically within one), and every threshold in `gestureConfig` is a
 * duration. One clock, chosen here, used for every sample.
 */
// ─────────────────────────────────────────────────────────────────
// THE TUNING MENU. ⭐ Every number it touches is an `IN5` placeholder.

/**
 * One tunable, bound to the live config.
 *
 * ⛔⛔ THE CHANGE IS TRIED ON A COPY AND VALIDATED BEFORE IT IS KEPT.
 * `validateGestureConfig` normally runs once, in `MotionTracker`'s constructor, so a
 * slider writing straight into the config would bypass every cross-tunable rule
 * there is — and these are exactly the numbers that are only meaningful in
 * combination. Ring heights that stop climbing fold the orbit surface back through
 * itself; a camera radius inside the near plane renders a black page with no error.
 * ⭐ A rejected change is RETURNED so the menu can show why, never dropped in silence.
 */
export function tunable(st: SceneState, label: string,
  key: keyof typeof st.cfg & string,
  min: number,
  max: number,
  step: number,) : MenuSlider {
return ({
  label,
  min,
  max,
  step,
  get: () => st.cfg[key] as unknown as number,
  set: (value) => {
    const candidate = { ...st.cfg, [key]: value };
    try {
      validateGestureConfig(candidate);
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
    // ⛔ Mutate the ONE config object everything already holds — no second copy.
    // Carried rule `L1`: a tuning value living in both a debug tool and production
    // silently drifted apart.
    (st.cfg as unknown as Record<string, number>)[key] = value;
    applyCamera(st);
    paint(st);
    return null;
  },
});
}


export function installTuningMenu(st: SceneState): void {

  createMenu([
    // ⭐⭐⭐ (2026-11-13, the owner: *"Propose how to better organize the sliders … Propose a full architecture so I can validate"* → *"agree with all your
    // recommendations. proceed"*) THE MENU BY SUBJECT — nine sections, none over ~9 sliders a folder; every slider's key, range and default unchanged
    // (its comments carried with it). ⛔ Removed (they never act): the way in to the orbit around the piece (its gap, way in, way back — no live caller)
    // and the centre grace (`EMPTY_PRESS_MOVES_TARGET` off since 2026-10-02) — their config values kept for the parked code. ⚠ The panel remembers open
    // sections by TITLE: the new titles start folded once.
    {
      // ⭐ The level as played: which piece is orbited, the pieces locked in their goal, the demo's length; and when a piece counts as placed.
      title: "LEVEL",
      sliders: [
        // ⭐ prototype, the owner 2026-10-04: *"a slider in scene menu to choose between the green piece or the turquoise piece. When
        // toggled, the piece shall be spawn as per boot"*
        tunable(st, "orbited piece (0 = green, 1 = turquoise)", "orbitPieceKind", 0, 1, 1),
        // ⭐ prototype (green box): a piece in its goal cannot be moved or turned — 0 re-enables it (`goal_lock.ts`).
        tunable(st, "lock pieces in their goal (1 = locked, 0 = free)", "lockPlacedPieces", 0, 1, 1),
        // ⭐ `D170`: how long a demo scene takes, first move to last — changing it mid-demo changes the speed.
        tunable(st, "demo duration (s)", "demoDurationS", 10, 60, 5),
      ],
      subsections: [
        {
          // ⭐ When a piece is in its goal: the never-grabbed and the orbited piece's margins; the capture's fit (offset, cone) and the pull's time.
          title: "GOAL",
          sliders: [
            // ⭐ `D183`: how near a piece NEVER GRABBED must sit to its goal to count (a grabbed one: the snap's margins).
            tunable(st, "never-grabbed goal (mm on glass)", "ungrabbedGoalMm", 0.5, 10, 0.5),
            tunable(st, "never-grabbed goal (°)", "ungrabbedGoalDeg", 0.5, 15, 0.5),
            // ⭐ (2026-10-14) the orbited piece's goal margins, in the world
            tunable(st, "orbited piece goal margin (mm)", "orbitGoalMm", 1.5, 30, 0.5),
            tunable(st, "orbited piece goal margin (°)", "orbitGoalDeg", 0.5, 15, 0.5),
            // ⚠ 1–40 mm: below ~2 mm two bodies must essentially touch before white appears, and
            // above ~40 mm the whole scene captures at the boot zoom. ⛔ A range chosen to make both
            // ends visibly WRONG on the glass, because a slider whose every value looks plausible
            // teaches a hand nothing.
            tunable(st, "capture offset (mm on glass)", "captureOffsetMm", 1, 40, 0.5),
            // ⭐⭐ `D109` (the owner, 2026-09-27): *"Fuchsia cone is used for snap: rename it snap
            // cone angle and move it to snap slider"* — how far from anti-parallel the two faces
            // may be and still snap. ⚠ The owner asked for 0–45 in steps of 5 when it was the
            // fuchsia offer's cone.
            tunable(st, "snap cone angle (deg)", "snapConeDeg", 0, 45, 5),
            // ⭐ The magnet's pull: how long the face centre takes to reach the cursor (`D100`).
            tunable(st, "snap time (ms, 0 = at once)", "snapMs", 0, 400, 10),
          ],
        },
      ],
    },
    {
      // ⭐ The finger and the mouse, before any rule reads them: the tap, the motion deadband and the rest, the orbit drag's own deadband.
      title: "INPUT",
      sliders: [
        // ⭐ the owner, 2026-10-05: the ONE tap time (every tap: the orbit tap, the quads, the resting face) — Unity's 200 ms
        tunable(st, "tap max duration (ms)", "tapMaxDuration", 100, 400, 10),
        // ⭐ (2026-10-10) the sliders read only when a scene PART is dragged moved to TRANSLATION IN WORLDSPACE › OBJECT TRANSLATION;
        // these stay — the orbit finger's motion state (the camera's follow, a tap from a pinch) and the orbit's sway trigger and size.
        // ⭐ How parallel the two fingers must be to read as ONE common drag, and over
        // what baseline. ⛔ The tolerance is on the DIFFERENCE of the two travels: it is
        // what separates A6 from rule 6, whose anchor is deliberately still.
        // ⭐⭐ A10 MADE THESE FOUR LOAD-BEARING FOR A MODE, not only for the (since deleted)
        // flick test: the depth gate IS the holder's §1.1 motion state. ⛔ They were re-sized against
        // the measured noise floor when A10 landed, and a hand has not judged the new set.
        // ⭐⭐⭐ ONE RADIUS, and it is now the commit threshold, the rest test AND the
        // jitter deadband at once (A11). ⛔ The most load-bearing number in the input
        // layer, and nobody has judged it by finger yet.
        // ⭐⭐⭐ A12: the second touchpoint's x rolls the object. Nobody has judged this
        // by finger, and every gain a hand has set was raised from my guess.
        tunable(st, "motion DEADBAND (mm)", "motionDeadbandMm", 0.5, 8, 0.1),
        tunable(st, "rest floor (ms)", "restConfirmMs", 0, 400, 10),
        // ⭐ How many of a pointer's own event intervals of silence mean it has stopped.
        tunable(st, "rest = N x event gap", "restGapFactor", 2, 6, 0.5),
        tunable(st, "orbit drag deadband (mm on glass, ≥ 3× the pointer noise)", "orbitDeadbandMm", 2.3, 8, 0.1),
        tunable(st, "orbit drag deadband — the pause that re-arms it (ms)", "orbitBandRestMs", 0, 1500, 50),
      ],
    },
    {
      // ⭐ The orbited piece round the assembly: how fast, how smooth, the calm on a face, the tilted pole.
      title: "ORBIT",
      sliders: [
      ],
      subsections: [
        {
          // ⭐ What a millimetre of finger turns: the gains, the coast, the piece's own yaw, the close-in gain.
          title: "SPEED",
          sliders: [
            // ⭐ prototype (2026-10-12, *"Build with the 150ms rest"*)
            // ⛔ (2026-11-04, the audit) the "zoom → roll" rest slider (`holdSwitchRestMs`) removed: only the ⏸ way in reads it (`config_debt`'s PENDING)
            // ⛔ Radians (and elevation-parameter) per MILLIMETRE of finger travel, never
            // per pixel — a pixel means something different on a phone and a tablet.
            tunable(st, "yaw gain ←→ (rad/mm)", "gainOrbitYaw", 0.002, 0.06, 0.002),
            tunable(st,
              "elevation gain ↑↓ (/mm)",
              "gainOrbitElevation",
              0.002,
              0.05,
              0.002,
              ),
            tunable(st, "green box orbit gain — yaw (×)", "boxGainYaw", 0.05, 2, 0.05),
            tunable(st, "green box orbit gain — pitch (×)", "boxGainPitch", 0.05, 2, 0.05),
            // ⭐ The orbit coasts after the finger lifts — τ = this × the green piece's volume.
            tunable(st, "orbit inertia gain (ms per cm³ of the green piece, 0 = none)", "orbitInertiaGain", 0, 10, 0.1),
            // ⭐ 2026-10-06: before the alignment, the piece's own yaw per orbit yaw (2 = twice, with the orbit; −1 = against, as before)
            tunable(st, "piece yaw per orbit yaw (× , − = against)", "orbitPieceYawFactor", -3, 3, 0.25),
            // ⭐⭐⭐ (2026-11-12, CLOSE_IN_CONTACT.md step 3) the close-in gain: full from this distance out, down to the contact's
            tunable(st, "close-in gain: the orbit's full speed from this distance of the piece out (m)", "orbitGainFullM", 0.05, 3, 0.05),
            tunable(st, "close-in gain: at the contact, the gizmo's travel per mm of finger (mm)", "orbitContactMmPerMm", 0.1, 10, 0.1),
          ],
        },
        {
          // ⭐ The lags: the piece after the rig, the gizmo, the orbit's angles, the camera's catch-up after a release.
          title: "SMOOTHING",
          sliders: [
            tunable(st, "green box smoothing (ms, 0 = steps with the input)", "boxSmoothMs", 0, 300, 5),
            // ⭐⭐ (2026-11-04, the owner: *"add a slider for gizmo position and one for orbit angles"*) the piece's lag behind the ring, its two parts
            tunable(st, "lag: the gizmo's position the piece follows (ease, ms; 0 at once)", "gizmoEaseMs", 0, 500, 5),
            tunable(st, "lag: the orbit's angles (spring, ms; 0 at once)", "orbitSpringMs", 0, 500, 5),
            // ⭐ The TIME LAG on top of the leash (0 = none).
            tunable(st, "camera catch-up after release, from rest (ms)", "cameraCatchUpMs", 20, 1000, 10),
          ],
        },
        {
          // ⭐ The face-span share (`input/orbit_calm.ts`): the orbit's angle shown in a face's middle, whole toward its edges — dx and dy.
          title: "CALM ON A FACE",
          sliders: [
            tunable(st, "dx: the orbit's angle shown in the middle of a face (share)", "faceSpanShareH", 0, 1, 0.05),
            tunable(st, "dx: the edge zone (% of the gizmo's run)", "faceSpanZoneHPct", 0, 50, 1),
            tunable(st, "dx: the edge zone's minimum (cm)", "faceSpanZoneMinHCm", 0, 30, 0.5),
            tunable(st, "dy: compressed too (1 on, 0 off — the full orbit angle)", "faceSpanShareVOn", 0, 1, 1),
            tunable(st, "dy: the orbit's angle shown in the middle of a face (share)", "faceSpanShareV", 0, 1, 0.05),
            tunable(st, "dy: the edge zone (% of the gizmo's run)", "faceSpanZoneVPct", 0, 50, 1),
            tunable(st, "dy: the edge zone's minimum (cm)", "faceSpanZoneMinVCm", 0, 30, 0.5),
          ],
        },
        {
          // ⭐ A face holding a pole made a side (`input/orbit_tilt.ts`): on / off, its speed, automatic within, the camera's blend, the dy hold.
          title: "TILTED POLE",
          sliders: [
            // ⛔ (2026-11-10, the owner: *"remove it"*) the face map's slow stretch through an edge deleted (`faceEdgeSlideMm` / `faceEdgeSlideDeg`)
            // ⭐⭐⭐ (2026-11-10, §9.4) the tilted pole: a press on a cap makes it a side; its press's swing
            tunable(st, "tilted pole: a press on a face holding a pole makes it a side (1) / off (0)", "tiltedPole", 0, 1, 1),
            tunable(st, "tilted pole: every tilt's speed — its roll, its swing (°/s; 0: at once)", "tiltRollDegS", 0, 1440, 30),
            tunable(st, "tilted pole: automatic within this distance (m; 0: the press only)", "tiltAutoM", 0, 3, 0.05),
            tunable(st, "tilted pole: automatic — the camera blended in over the orbit's first (mm of finger; 0: at once)", "tiltBlendMm", 0, 100, 5),
            // ⭐⭐⭐ (2026-11-12, `ORBIT_ANY_SHAPE.md` §8) the owner's hysteresis
            tunable(st, "tilted pole: past a pole face's far edge, the dy back held until this deep (mm)", "edgeHoldMm", 0, 100, 5),
          ],
        },
      ],
    },
    {
      // ⭐ The piece brought in (the pinch, A + drag) and resting on a part: the shell, the look at the gizmo, the gap, the collision, the solver.
      title: "APPROACH & CONTACT",
      sliders: [
        // ⭐⭐⭐ (2026-11-13) the pinch is the approach on the phone
        tunable(st, "approach by pinch: per mm of the fingers' spread (×; spread in, pinch out)", "approachPinchGain", 0.1, 5, 0.1),
        tunable(st, "the shell's offset: onto the gizmo within it, the smooth shell beyond (mm)", "orbitShellOffsetMm", 5, 300, 5),
        tunable(st, "look at the gizmo within (m)", "assemblyLockDistM", 0.05, 2, 0.05),
        // ⭐ (2026-10-13, §12) the orbited piece: its gap to the parts (mm in the world) and its solver's work per frame
        tunable(st, "piece gap — the orbited piece rests this far from a part (mm)", "pieceGapMm", 0.2, 5, 0.1),
        // ⭐ `D136`: how far a body may SINK into another (mm on the glass) — contact is allowed; the
        // margin a hand must line a piece up within to slide it into a zero-clearance slot.
        tunable(st, "collision allowance — how far a body may sink into another (mm on glass)", "collisionSkinMm", 0.05, 3, 0.05),
        tunable(st, "piece solver — gap checks per frame (more: smoother, slower)", "pieceSolverQueries", 8, 96, 4),
        // ⭐⭐⭐ (2026-11-12, `CLOSE_IN_CONTACT.md`) the slide's sliders DELETED with it; its reach is the contact readout's band
        tunable(st, "contact band — the resting face looking at a placed part's face this close lights the contact (mm)", "contactBandMm", 2, 60, 1),
      ],
      subsections: [
        {
          // ⭐ The rings' curve: ring 1's distance is the far orbit, the waist where the approach goes straight in; the 3rd ring's switch scales the elevation.
          title: "THE APPROACH'S DISTANCE (THE RINGS)",
          sliders: [
            // ⭐ (2026-10-12) to 6 m — the 1st and 4th rings doubled (Scene_1: 5.1 / ±3.15, 6 m)
            tunable(st, "1st ring (top) radius (m)", "orbitTopRadiusM", 0, 6, 0.01),
            tunable(st, "1st ring (top) height (m)", "orbitTopHeightM", -6, 6, 0.01),
            tunable(st, "2nd ring radius (m)", "orbitMiddleRadiusM", 0, 3, 0.01),
            tunable(st, "2nd ring height (m)", "orbitMiddleHeightM", -3, 3, 0.01),
            // ⭐ prototype (green box), 2026-10-02: the rings named 1st … 4th from the TOP (the owner); the 3rd sits between the 2nd and the
            // 4th, on = 1 (a three-ring scene has none).
            tunable(st, "3rd ring on (0 / 1)", "orbitLowerRingOn", 0, 1, 1),
            tunable(st, "3rd ring radius (m)", "orbitLowerRadiusM", 0, 3, 0.01),
            tunable(st, "3rd ring height (m)", "orbitLowerHeightM", -3, 3, 0.01),
            tunable(st, "4th ring (bottom) radius (m)", "orbitBottomRadiusM", 0, 6, 0.01),
            tunable(st, "4th ring (bottom) height (m)", "orbitBottomHeightM", -6, 6, 0.01),
          ],
        },
      ],
    },
    {
      // ⭐ The gizmo, its red / green sections and the faces contour they are cut from; the resting-face quads' shape.
      title: "GIZMO & SECTIONS",
      sliders: [
        tunable(st, "sections drawn (green / red): on (1) / off (0)", "sectionLines", 0, 1, 1),
        // ⭐⭐⭐ (2026-11-04, Step 5, D5) the faces contour: the facets' merge angle and the real face share a facet needs
        tunable(st, "faces contour: faces merged into a facet within (°)", "facetMergeDeg", 1, 44, 1),
        tunable(st, "faces contour: a facet kept with this share of real face", "facetMinShare", 0, 1, 0.05),
        tunable(st, "gizmo face edge margin (mm)", "gizmoEdgeMarginMm", 0, 20, 0.5),
        // ⭐ prototype (2026-10-11, *"add a slider to hide the pink gizmo"*)
        tunable(st, "yellow gizmo (the orbit centre's ring): shown (0 = hidden; 1 = shown)", "pinkGizmoVisible", 0, 1, 1),
        tunable(st, "yellow quad: slice of yaw at most (°)", "quadSliceMaxDeg", 10, 180, 1),
        // ⭐ prototype (2026-10-12, *"create a slider for the power of the scaling distance"*)
        // ⭐ (2026-10-12, *"instead of power 3 for the quad scale, use a logarythm curve so that the quads and resting face grow faster when they are small"*) — the log curve's steepness (0 = a straight line)
        tunable(st, "resting-face quads: growth steepness (log curve) with the gizmo's distance", "quadGrowthLogK", 0, 50, 0.5),
      ],
    },
    {
      // ⭐ Where the camera sits behind the piece, and how the orbit centre moves when it changes.
      title: "CAMERA",
      sliders: [
        tunable(st, "camera yaw offset (deg)", "cameraYawOffsetDeg", -45, 45, 0.5),
        tunable(st, "camera pitch offset (deg)", "cameraPitchOffsetDeg", -30, 30, 1),
        tunable(st, "camera radius offset beyond the green box (mm)", "cameraRadiusOffsetMm", 100, 2000, 50),
        // ⚠ 0 reproduces the old teleporting centre, for an A/B by finger.
        tunable(st, "centre blend (mm)", "orbitBlendDistanceMm", 0, 200, 5),
      ],
    },
    {
      // ⭐ What is drawn and how: the opacities (contours, face highlights, quads), the highlights' offset, the shadows.
      title: "RENDERING",
      sliders: [
        // ⭐ `D125`: the transparent contour around a piece's coloured core (0 = invisible).
        tunable(st, "piece contour opacity", "pieceContourAlpha", 0, 1, 0.05),
        // ⭐ `D165` — the owner, 2026-09-29: *"provide a slider for that below highlight offset slider"*.
        tunable(st, "face highlight opacity (cyan / amber fills)", "faceHighlightAlpha", 0, 1, 0.05),
        // ⭐ (2026-10-15, the owner: *"make a slider for non-yellow quad highlight transparency (edges and fill) just below pink gizmo slider"*)
        tunable(st, "non-yellow quads' opacity (edges; the fill a quarter of it)", "quadUnlitAlpha", 0, 1, 0.01),
        tunable(st, "highlight offset (mm on the glass)", "highlightLiftMm", 0.05, 3, 0.05),
        // ⭐ `D138`: 2 = AUTO (off on a device too slow for them). Watch the HUD's `frame` line.
        tunable(st, "shadows (0 = off, 1 = on, 2 = auto)", "shadowsOn", 0, 2, 1),
        tunable(st, "auto shadows: frame budget (ms, median)", "autoShadowBudgetMs", 10, 100, 1),
      ],
    },
    {
      // ⭐ The scene's answer to the orbit: the sway (swing / slide), its re-trigger and reference speed.
      title: "SCENE SWAY",
      sliders: [
        tunable(st, "orbit sway kind (0 = swing, 1 = slide, 2 = both)", "orbitSwayKind", 0, 2, 1),
        tunable(st, "orbit sway — the scene swings when the green box orbits (deg)", "orbitSwayDeg", 0, 10, 0.1),
        tunable(st, "orbit slide — the pieces translate the way the green box orbits (mm)", "orbitSlideMm", 0, 20, 0.5),
        tunable(st, "orbit sway softness — how quickly it resolves (ms)", "orbitSwayTauMs", 10, 300, 5),
        // ⭐ How far the drag must swing before the scene reacts again, and the drag
        // speed at which the amplitude above is what you get.
        tunable(st, "sway re-trigger turn (deg)", "swayTurnDeg", 15, 150, 5),
        tunable(st,
          "sway reference speed (mm/s)",
          "swayReferenceSpeedMmPerS",
          30,
          400,
          10,
          ),
      ],
      subsections: [
        {
          // ⭐ How a part eases onto its pose (the demo's moves, the sway): inertia, damping, lead, the sway's softness.
          title: "PARTS' FOLLOW",
          sliders: [
            // ⭐ 0 pins the object to the fingertip — the behaviour before inertia existed,
            // and the only setting that can be checked against the tracking factor.
            // ⚠ 1–20 ms in steps of 0.2, and 0.1–0.5 for the ratio: the owner's ranges after
            // two device passes, zoomed hard into the corner that worked. ⛔ Three reference
            // settings are now OFF the sliders — `translateInertiaMs = 0` (exact tracking,
            // the only setting checkable against rule 6's tracking factor), `ζ = 1`
            // (critical damping, what every overshoot vector is written against), and the
            // neutral lead. All three remain reachable from the URL, e.g.
            // `?translateInertiaMs=0&translateDampingRatio=1`. ⚠ A slider that cannot reach
            // a reference is fine; a reference nobody can reach at all is not.
            tunable(st, "inertia (ms)", "translateInertiaMs", 1, 20, 0.2),
            // ⭐ BELOW 1 IS THE CATCH-UP. 1 = critically damped, never overshoots; lower
            // accelerates through the gap and overshoots a little; far lower rings.
            // ⚠ It does nothing perceptible unless the inertia above is large enough to
            // give it something to act on.
            tunable(st,
              "damping ratio (<1 = catch-up)",
              "translateDampingRatio",
              0.1,
              0.5,
              0.05,
              ),
            // ⭐ The phantom target's lead. The HUD prints the NEUTRAL value (2·ζ·τ) for
            // whatever the two sliders above are set to, so this one has a landmark rather
            // than a range of equally arbitrary numbers.
            tunable(st, "phantom lead (ms)", "translateLeadMs", 0, 1.5, 0.1),
            // ⭐⭐⭐ A14: how long a lift-and-replace of the second touchpoint stays ONE
            // gesture. ⛔ 0 restores the old behaviour exactly, which is how to A/B it.
            // ⛔ (2026-11-04, the audit) "sway of others (mm)" (`translateSwayMm`) removed: the one sway call passes its own amplitude
            tunable(st, "sway softness (ms)", "translateSwayTauMs", 40, 600, 20),
            tunable(st, "sway softness (ms)", "rotateSwayTauMs", 40, 600, 20),
          ],
        },
      ],
    },
    {
      // ⭐ Only for `orbitMode` 1 — the gizmo's 2D curve, kept whole (2026-10-25): the switch, the top roll band, the turn governor.
      title: "LEGACY",
      sliders: [
        // ⭐⭐⭐ (2026-10-28) THE ORBIT AROUND THE ASSEMBLY — or the gizmo's 2D curve (kept)
        tunable(st, "orbit: around the assembly (0) / the gizmo's 2D curve (1)", "orbitMode", 0, 1, 1),
        // ⭐⭐ (2026-10-17, the owner: *"trigger the semi-isometric view during ring 2 and 3 travel only if the normal of the gizmo-supporting face is beyond a certain cone"*)
        tunable(st, "top roll band (°): the half-turn only this near straight above", "topRollBandDeg", 2, 60, 1),
        tunable(st, "turn governor, horizontal face (°/mm of dy)", "orbitTurnCapDegMm", 5, 300, 0.5),
        tunable(st, "turn governor, vertical face (°/mm of dy)", "orbitTurnCapVerticalDegMm", 5, 300, 0.5),
      ],
    },
  ]);
}
