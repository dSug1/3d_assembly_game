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

/**
 * ⭐ prototype (green box) — **THE BOOT ZOOM SLIDER** (the owner, 2026-10-01: *"add the slider boot zoom and set it at 1.5"*).
 * ⭐ Applied AT ONCE, not at the next boot: the zoom jumps to it, and it is where the camera reset (double tap on empty space)
 * returns — the boot view, as if the scene had booted with it.
 */
export function bootZoomSlider(st: SceneState): MenuSlider {
  // ⭐ 2026-10-02: the zoom is the CAMERA's distance behind the green piece (× the radius offset), 0.1–2.
  const base = tunable(st, "boot zoom (× the camera's distance behind the green piece)", "bootZoom", 0.1, 2, 0.05);
  return {
    ...base,
    set: (value) => {
      const err = base.set(value);
      if (err !== null) return err;
      st.orbitStartZoom = value;
      st.zoom = value;
      st.zoomAtPinchStart = value;
      applyCamera(st);
      return null;
    },
  };
}

export function installTuningMenu(st: SceneState): void {

  createMenu([
    // ⚠ **SECTION ORDER IS THE OWNER'S, 2026-09-18** — camera, translation, rotation,
    // eviction, capture. ⛔ It is a reading order, not a grouping: the camera frames what the
    // other four act on, and the two destructive ones sit last. ⭐ The panel remembers which
    // sections are open by TITLE (`localStorage`), so reordering costs a hand nothing.
    {
      title: "SCENE",
      // ⛔ `D186` (the owner, 2026-09-30: *"remove the slider scene (0=scene_0,...)"*): the scene switch is deleted — a
      // scene is chosen from the level menu (`?flow=1`) or `?sceneIndex=N`, as the pause menu's *Quit to menu* leads.
      sliders: [
        // ⭐ `D183`: how near a piece NEVER GRABBED must sit to its goal to count (a grabbed one: the snap's margins).
        tunable(st, "never-grabbed goal (mm on glass)", "ungrabbedGoalMm", 0.5, 10, 0.5),
        tunable(st, "never-grabbed goal (°)", "ungrabbedGoalDeg", 0.5, 15, 0.5),
        // ⭐ `D170`: how long a demo scene takes, first move to last — changing it mid-demo changes the speed.
        tunable(st, "demo duration (s)", "demoDurationS", 10, 60, 5),
      ],
    },
    {
      title: "CAMERA",
      // ⭐⭐ The owner, 2026-09-26: *"in CAMERA menu, create a subfolder CAMERA ORBIT"*. ⛔ Its sibling,
      // CAMERA APPROACH SWING AT CAPTURE, is deleted with the swing (`D120`).
      // ⭐ `D113` (the owner, 2026-09-27: *"Put a slider for the band width"*): at the TOP of CAMERA,
      // not inside a subsection — the strip that is always empty space, 0 = off.
      // ⭐ `D114`: the width it opens to when NO empty space is left on the glass — 0 otherwise.
      sliders: [
        tunable(st, "edge band width when no empty space (mm, 0 = never)", "edgeBandMm", 0, 20, 1),
      ],
      // ⭐ prototype (green box), the owner 2026-10-02: *"there are too many rows directly under CAMERA menu. Create submenus
      // depending on what the slider tunes (green piece, camera offset, etc.)"* — one subsection per subject; no slider changed.
      subsections: [
        {
          // ⭐ How the green piece moves when the finger orbits, and after it lifts.
          title: "GREEN PIECE ORBIT",
          sliders: [
            tunable(st, "green box orbit gain — yaw (×)", "boxGainYaw", 0.05, 2, 0.05),
            // ⭐ 2026-10-02: the share of it left while the green piece is outside the guide sphere.
            tunable(st, "yaw gain share outside the guide sphere", "boxGainYawOutsideShare", 0.05, 1, 0.05),
            tunable(st, "green box orbit gain — pitch (×)", "boxGainPitch", 0.05, 2, 0.05),
            tunable(st, "green box gain inside the leash (×)", "boxGainInsideLeash", 0.05, 1, 0.05),
            tunable(st, "green box smoothing (ms, 0 = steps with the input)", "boxSmoothMs", 0, 300, 5),
            // ⭐ The orbit coasts after the finger lifts — τ = this × the green piece's volume.
            tunable(st, "orbit inertia gain (ms per cm³ of the green piece, 0 = none)", "orbitInertiaGain", 0, 10, 0.1),
          ],
        },
        {
          // ⭐ prototype (green box), 2026-10-02: an orbited piece outside the guide sphere steps through its faces as it orbits.
          title: "FACE ALIGNMENT IN YAW",
          sliders: [tunable(st, "yaw face alignment span (deg, all faces once)", "yawFaceAlignSpanDeg", 30, 720, 15)],
        },
        {
          // ⭐ Where the camera sits relative to the green piece, and the zoom it boots at.
          title: "CAMERA OFFSET",
          sliders: [
            bootZoomSlider(st),
            tunable(st, "camera yaw offset (deg)", "cameraYawOffsetDeg", -45, 45, 1),
            tunable(st, "camera pitch offset (deg)", "cameraPitchOffsetDeg", -30, 30, 1),
            tunable(st, "camera radius offset beyond the green box (mm)", "cameraRadiusOffsetMm", 100, 2000, 50),
            // ⭐ 2026-10-02: the zoom never comes closer than keeps the green piece inside this share of the view.
            tunable(st, "green piece keep-in-view margin (share of the half-view)", "greenKeepInViewMargin", 0.3, 1, 0.05),
          ],
        },
        {
          // ⭐ How the camera follows the green piece: the leash, the time lag, and what happens when the input stops.
          title: "CAMERA FOLLOW",
          sliders: [
            tunable(st, "camera leash behind the green box (deg)", "cameraLeashDeg", 0, 60, 0.05),
            // ⭐ The TIME LAG on top of the leash (0 = none).
            tunable(st, "camera time lag behind the green box (ms, 0 = none)", "cameraFollowMs", 0, 1000, 10),
            tunable(st, "camera settle delay after an input stops (ms)", "cameraSettleDelayMs", 0, 1000, 10),
            tunable(st, "camera catch-up after release, from rest (ms)", "cameraCatchUpMs", 20, 1000, 10),
          ],
        },
        {
          // ⭐ What the painting does when the green piece orbits: option 1 (swing), option 2 (slide), or both.
          title: "ORBIT SWAY",
          sliders: [
            tunable(st, "orbit sway kind (0 = swing, 1 = slide, 2 = both)", "orbitSwayKind", 0, 2, 1),
            tunable(st, "orbit sway — the scene swings when the green box orbits (deg)", "orbitSwayDeg", 0, 10, 0.1),
            tunable(st, "orbit slide — the pieces translate the way the green box orbits (mm)", "orbitSlideMm", 0, 20, 0.5),
            tunable(st, "orbit sway softness — how quickly it resolves (ms)", "orbitSwayTauMs", 10, 300, 5),
          ],
        },
        {
          // ⭐ How the scene is drawn.
          title: "RENDERING",
          sliders: [
            // ⭐ `D125`: the transparent contour around a piece's coloured core (0 = invisible).
            tunable(st, "piece contour opacity", "pieceContourAlpha", 0, 1, 0.05),
            // ⭐ `D138`: 2 = AUTO (off on a device too slow for them). Watch the HUD's `frame` line.
            tunable(st, "shadows (0 = off, 1 = on, 2 = auto)", "shadowsOn", 0, 2, 1),
            tunable(st, "auto shadows: frame budget (ms, median)", "autoShadowBudgetMs", 10, 100, 1),
            // ⭐ prototype (green box), 2026-10-02: the guide sphere on the yellow target — for prototyping only (0 = hidden).
            tunable(st, "guide sphere opacity (0 = hidden)", "guideSphereAlpha", 0, 0.5, 0.01),
          ],
        },
        {
          title: "CAMERA ORBIT",
          sliders: [
            tunable(st, "1st ring (top) radius (m)", "orbitTopRadiusM", 0, 3, 0.01),
            tunable(st, "1st ring (top) height (m)", "orbitTopHeightM", -3, 3, 0.01),
            tunable(st, "2nd ring radius (m)", "orbitMiddleRadiusM", 0, 3, 0.01),
            tunable(st, "2nd ring height (m)", "orbitMiddleHeightM", -3, 3, 0.01),
            // ⭐ prototype (green box), 2026-10-02: the rings named 1st … 4th from the TOP (the owner); the 3rd sits between the 2nd and the
            // 4th, on = 1 (a three-ring scene has none).
            tunable(st, "3rd ring on (0 / 1)", "orbitLowerRingOn", 0, 1, 1),
            tunable(st, "3rd ring radius (m)", "orbitLowerRadiusM", 0, 3, 0.01),
            tunable(st, "3rd ring height (m)", "orbitLowerHeightM", -3, 3, 0.01),
            tunable(st, "4th ring (bottom) radius (m)", "orbitBottomRadiusM", 0, 3, 0.01),
            tunable(st, "4th ring (bottom) height (m)", "orbitBottomHeightM", -3, 3, 0.01),
            // ⚠ 0 reproduces the old teleporting centre, for an A/B by finger.
            tunable(st, "centre blend (mm)", "orbitBlendDistanceMm", 0, 200, 5),
            // ⭐ How long rule 1 waits to see whether a second finger is landing — i.e.
            // whether this is an orbit or the start of a pinch. 0 commits immediately.
            tunable(st, "centre grace (ms)", "orbitCentreGraceMs", 0, 400, 10),
            // ⭐ How long the double-tap reset takes to fly home. 0 snaps.
            tunable(st, "reset time (ms)", "cameraResetMs", 0, 2000, 50),
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
          ],
        },
      ],
    },
    {
      title: "OBJECT TRANSLATION",
      sliders: [
        // ⭐ prototype (green box): a piece in its goal cannot be moved or turned — 0 re-enables it (`goal_lock.ts`).
        tunable(st, "lock pieces in their goal (1 = locked, 0 = free)", "lockPlacedPieces", 0, 1, 1),
        // ⭐ `D136`: how far a body may SINK into another (mm on the glass) — contact is allowed; the
        // margin a hand must line a piece up within to slide it into a zero-clearance slot.
        tunable(st, "collision allowance — how far a body may sink into another (mm on glass)", "collisionSkinMm", 0.05, 3, 0.05),
        // ⭐⭐ 1.0 IS THE CORRECT VALUE, NOT A PREFERRED ONE — the object sits exactly
        // under the finger at every camera distance. The slider exists so that claim
        // can be DISPROVED by finger, and so the owner can judge whether direct
        // manipulation actually feels best; it is not there because the number is
        // unknown. ⚠ Every other gain on this project was guessed too slow; this is the
        // first one that was computed. See input/translate.ts.
        tunable(st, 
          "screen-plane gain (1 = under finger)",
          "gainTranslateScreen",
          0.1,
          3,
          0.05,
        ),
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
        // ⭐ The sympathetic sway: how far the OTHER objects drift when this one sets
        // off, and how lazily they spring back. ⛔ 0 mm disables it exactly.
        // ⭐⭐ AMENDMENT A6 — DEPTH TRANSLATION. 1.0 moves the object as far INTO the
        // scene as rule 6 moves it ACROSS, for the same finger travel: one gain, one
        // computed tracking factor, two directions. ⛔ Not a metres-per-millimetre
        // constant — rule 6 proved that cannot serve both ends of a 20x zoom clamp.
        // ⛔⛔ THE DEFAULT IS 3.0, NOT THE COMPUTED 1.0 — set by a hand on 2026-09-15.
        // Depth is visually foreshortened, so equal WORLD motion is not equal PERCEIVED
        // motion, and the eye is what is being served. ⚠ The range was widened to 0.5–5
        // in the same breath, which is itself a reading: the owner wanted room ABOVE the
        // old ceiling of 3, so 3 may not be the end of the movement either.
        tunable(st, 
          "depth gain (1 = as far as a drag)",
          "gainTranslateDepth",
          0.5,
          5,
          0.05,
        ),
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
        tunable(st, "roll drag gain (deg/mm)", "gainRollDrag", 0.25, 12, 0.25),
        tunable(st, "motion DEADBAND (mm)", "motionDeadbandMm", 0.5, 8, 0.1),
        tunable(st, "rest floor (ms)", "restConfirmMs", 0, 400, 10),
        // ⭐ How many of a pointer's own event intervals of silence mean it has stopped.
        tunable(st, "rest = N x event gap", "restGapFactor", 2, 6, 0.5),
        // ⭐⭐⭐ A14: how long a lift-and-replace of the second touchpoint stays ONE
        // gesture. ⛔ 0 restores the old behaviour exactly, which is how to A/B it.
        tunable(st, "sway of others (mm)", "translateSwayMm", 0, 8, 0.1),
        tunable(st, "sway softness (ms)", "translateSwayTauMs", 40, 600, 20),
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
        // ⛔ The three rule selectors that stood here (pinned Pioneer, WorldAxisB, plane/channels)
        // are DELETED with their alternatives (`D109`, 2026-09-27).
      ],
    },
    {
      title: "OBJECT ROTATION",
      // ⭐ prototype (green box), the owner 2026-10-03: *"Create in menu Object Rotation the submenu Rotation in World coordinates and
      // move every existing slider into this submenu; the submenu Double Orbit mode"*. No slider changed.
      sliders: [],
      subsections: [
        {
          title: "ROTATION IN WORLD COORDINATES",
          sliders: [
            // ⚠ §2bis's own gain, in radians per MILLIMETRE of finger travel, chosen on the
            // device. `IN3` inherits it — the rotation is real, only its plumbing is not.
            tunable(st, 
              "yaw/pitch gain (rad/mm)",
              "gainRotateFree",
              0.005,
              0.15,
              0.005,
            ),
            // ⭐ `D185`: past this angle out of the glass the maroon pitch turns like a wheel seen from the camera — the
            // pressed side follows the finger up.
            tunable(st, "pitch: wheel past (deg out of screen)", "pitchSideConeDeg", 0, 80, 5),
            // ⭐⭐ 2sexte's twist about a constraint axis (`D34`). ⚠ Defaulted EQUAL to the free
            // gain so one DOF does not feel like a different control from three — a guess, and
            // the range is the same as the free gain's so a hand can compare them directly.
            tunable(st, 
              "anchored twist gain (rad/mm)",
              "gainRotateConstrained",
              0.005,
              0.15,
              0.005,
            ),
            // ⭐⭐⭐ **THE ROTATION INCREMENT (trial, 2026-09-22)** — a turn ENDS on a multiple of
            // this, slerped into place. ⛔ **`0` is the current build, no change.** ⚠ Only the END
            // is quantised: the drag itself keeps every gain, deadband and smoothing it has now,
            // because the earlier formulation that quantised the turn as it happened was rejected
            // on the device for lagging the finger.
            tunable(st, 
              "rotation increment (deg, 0=off)",
              "rotationIncrementDeg",
              0,
              45,
              5,
            ),
            // ⭐ The sympathetic swing: the rest of the scene turns as a block about this
            // object's centre when it starts turning or turns the other way.
            tunable(st, "sway of others (deg)", "rotateSwayDeg", 0, 8, 0.1),
            tunable(st, "sway softness (ms)", "rotateSwayTauMs", 40, 600, 20),
            tunable(st, "sway re-trigger turn (deg)", "rotateSwayTurnDeg", 15, 170, 5),
            tunable(st, 
              "sway reference turn (deg/s)",
              "rotateSwayReferenceDegPerS",
              20,
              400,
              10,
            ),
          ],
        },
        {
          // ⭐ The green piece outside the guide sphere, in the double orbit (`trackOrbitedFaces`).
          title: "DOUBLE ORBIT MODE",
          sliders: [
            // ⭐ the owner, 2026-10-03: on (1) = the faces step by increments of the yaw orbit (the yaw / pitch cycles) — the current
            // rule; off (0) = no stepping (its own rule to be specified by the owner).
            tunable(st, "FacesRotateByIncrement (0 / 1)", "facesRotateByIncrement", 0, 1, 1),
          ],
        },
      ],
    },
    {
      // ⭐⭐ **THE FACE SUBMENU** — the owner, 2026-09-25: *"create a Face submenu and place the
      // slider as PioneerFaceCursor sensitivity inside this submenu"*. ⚠ Last, after CAPTURE: the
      // section order above is the owner's, and a new section does not reorder it.
      // ⭐⭐ **RENAMED FACE ALIGNMENT** — the owner, 2026-09-26: *"rename the menu FACE to FACE
      // ALIGNMENT and move the menus eviction shake and capture under FACE ALIGNMENT"*.
      title: "FACE ALIGNMENT",
      // ⭐ The owner, 2026-09-27: every highlight one pixel off what it marks, at every zoom.
      sliders: [
        tunable(st, "highlight offset (mm on the glass)", "highlightLiftMm", 0.05, 3, 0.05),
        // ⭐ `D165` — the owner, 2026-09-29: *"provide a slider for that below highlight offset slider"*.
        tunable(st, "face highlight opacity (cyan / amber fills)", "faceHighlightAlpha", 0, 1, 0.05),
      ],
      // ⭐⭐ **TWO FOLDERS, ONE PER FACE OF THE PAIR** — the owner, 2026-09-26.
      subsections: [
        {
          title: "PIONEERFACECURSOR",
          sliders: [
            // ⭐⭐ **FREE FLOW MODE** — the owner, 2026-09-26: the player leaves the SCORE and builds
            // freely, and moving the PioneerFaceCursor is its first freedom (`20_GAME_RULES/spec/SCORE.md`).
            // ⚠ `0` keeps the ring drawn and hands every press on it back to the ordinary rules.
            // ⛔ The config key is unchanged, so `?pioneerCursorDrag=1` still works.
            tunable(st, 
              "Free Flow mode (PioneerFaceCursor drag on/off)",
              "pioneerCursorDrag",
              0,
              1,
              1,
            ),
            // ⭐⭐ The owner's 1–10 ring radii a TOUCH may press from the ring and still grab it.
            // ⚠ Touch only: the mouse must click INSIDE the ring, whatever this says.
            tunable(st, 
              "PioneerFaceCursor sensitivity (radii)",
              "pioneerCursorGrabRadii",
              1,
              10,
              0.5,
            ),
          ],
        },
        {
          title: "FOLLOWERFACE",
          sliders: [
            // ⭐ prototype (green box): the HitFace's fuchsia contour, off by default (the owner, 2026-10-01).
            tunable(st, "HitFace fuchsia contour (1 = shown, 0 = hidden)", "showHitFaceContour", 0, 1, 1),
            // ⭐⭐ See the FollowerFace THROUGH its own body. ⛔ `0` is off and is the build before
            // the flag; anything above draws an x-ray twin at that opacity.
            tunable(st, 
              "FollowerFace x-ray opacity (0=off)",
              "followerFaceXrayAlpha",
              0,
              1,
              0.05,
            ),
          ],
          subsections: [
            {
              // ⭐⭐ THE OWNER ASKED FOR THIS SLIDER BY NAME (`D49`): *"I want the offset distance to be
              // manually adjustable by slider."* ⛔ The standing *do not inflate the tuning menu* rule
              // is set aside where a hand says it wants to tune something — the same exception §8 of the
              // spec grants `BreakThreshold`.
              // ⚠⚠ IT IS MILLIMETRES ON THE GLASS, NOT IN THE WORLD. The world gap it authorises grows
              // with the camera distance, so the same slider value means the same APPARENT clearance at
              // every zoom — which is what the owner asked for.
              title: "⭐ CAPTURE (D49)",
              sliders: [
                // ⚠ 1–40 mm: below ~2 mm two bodies must essentially touch before white appears, and
                // above ~40 mm the whole scene captures at the boot zoom. ⛔ A range chosen to make both
                // ends visibly WRONG on the glass, because a slider whose every value looks plausible
                // teaches a hand nothing.
                tunable(st, "capture offset (mm on glass)", "captureOffsetMm", 1, 40, 0.5),
                // ⭐ The magnet's pull: how long the face centre takes to reach the cursor (`D100`).
                tunable(st, "snap time (ms, 0 = at once)", "snapMs", 0, 400, 10),
                // ⭐ The UNSNAP's rapid move — the two numbers kept from the deleted eviction shake (`D107`).
                tunable(st, "unsnap window (ms)", "unsnapWindowMs", 200, 1200, 50),
                tunable(st, "unsnap leg (mm)", "unsnapLegMm", 3, 25, 1),
                // ⭐⭐ `D109` (the owner, 2026-09-27): *"Fuchsia cone is used for snap: rename it snap
                // cone angle and move it to snap slider"* — how far from anti-parallel the two faces
                // may be and still snap. ⚠ The owner asked for 0–45 in steps of 5 when it was the
                // fuchsia offer's cone.
                tunable(st, "snap cone angle (deg)", "snapConeDeg", 0, 45, 5),
                // ⚠ Blender's 5°. Below it the exact mapping is abandoned for the fixed-rate push; at 0
                // there is no fallback and a level camera sends the body a very long way.
                tunable(st, "axis tracking cone (deg)", "axisTrackingConeDeg", 0, 30, 1),
                // ⛔⛔ **THE `mesh contour width` SLIDER IS DELETED**, with the edge renderer it
                // controlled. ⚠ The second white is a `CreateLines` polyline now, which WebGL pins at
                // one pixel — so a width tunable would be a slider that does nothing, which is the
                // shape `config_debt.test.ts` exists to refuse. ⭐ *Deleted, not disabled.*
              ],
            },
          ],
        },
      ],
    },
  ]);
}
