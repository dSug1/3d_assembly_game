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
    // ⚠ **SECTION ORDER IS THE OWNER'S, 2026-09-18** — camera, translation, rotation,
    // eviction, capture. ⛔ It is a reading order, not a grouping: the camera frames what the
    // other four act on, and the two destructive ones sit last. ⭐ The panel remembers which
    // sections are open by TITLE (`localStorage`), so reordering costs a hand nothing.
    {
      // ⭐⭐ **CAMERA, WITH TWO FOLDERS** — the owner, 2026-09-26: *"in CAMERA menu, create a
      // subfolder CAMERA ORBIT and move all the sliders under CAMERA ORBIT except the subfolder
      // CAMERA APPROACH SWING AT CAPTURE which stays under CAMERA"*.
      title: "CAMERA",
      sliders: [],
      subsections: [
        {
          title: "CAMERA ORBIT",
          sliders: [
            tunable(st, "top radius (m)", "orbitTopRadiusM", 0, 1.5, 0.01),
            tunable(st, "top height (m)", "orbitTopHeightM", -1.5, 1.5, 0.01),
            tunable(st, "middle radius (m)", "orbitMiddleRadiusM", 0, 1.5, 0.01),
            tunable(st, "middle height (m)", "orbitMiddleHeightM", -1.5, 1.5, 0.01),
            tunable(st, "bottom radius (m)", "orbitBottomRadiusM", 0, 1.5, 0.01),
            tunable(st, "bottom height (m)", "orbitBottomHeightM", -1.5, 1.5, 0.01),
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
        {
          title: "CAMERA APPROACH SWING AT CAPTURE",
          sliders: [
          // ⭐⭐⭐ **THE APPROACH SWING (trial, branch `1.0.18-`)** — how far the camera leans out
          // at HALF the trigger gap, and back to zero at contact.
          // ⛔ **`0` TURNS THE WHOLE MECHANISM OFF**, which is what makes it A/B-able by finger
          // in the same minute on the same scene — the comparison that settled `D28` and `IN13`.
          // ⛔ **SHIPS AT 0 — OFF** (the owner, 2026-09-26: *"set the default approach swing to
          // zero"*); the 30° a hand chose on 2026-09-19 is one slider move away.
          tunable(st, 
            "approach swing (° of camera yaw)",
            "approachSwingDeg",
            0,
            90,
            1,
          ),
          // ⭐⭐ **THE SPEED DIVISOR, `gain × speed^exponent`** — the owner's fine-tuning pair.
          // ⛔ Damping starts where the divisor passes 1, at `(1/gain)^(1/exponent)` mm/s: the
          // default 0.0083 puts that knee at **120 mm/s**. ⚠ A small range with a fine step,
          // because the useful values are all near the bottom of it.
          tunable(st, "swing speed gain", "approachSwingSpeedGain", 0, 0.05, 0.0005),
          // ⛔ **`0` REMOVES THE SPEED DEPENDENCE ENTIRELY**, which is how to A/B the idea by
          // finger; `1` makes the camera's angular rate independent of hand speed; above 1 the
          // camera slows as the hand speeds up.
          tunable(st, 
            "swing speed exponent",
            "approachSwingSpeedExponent",
            0,
            3,
            0.1,
          ),
          // ⭐⭐⭐ **A RULE SELECTOR, NOT A NUMBER** — `0` is the current build; `1` switches the
          // yellow orbit target to the Pioneer–Follower barycentre the moment they capture.
          tunable(st, 
            "orbit retargets on capture (0/1)",
            "approachRetargetsOrbit",
            0,
            1,
            1,
          ),
          ],
        },
      ],
    },
    {
      title: "OBJECT TRANSLATION",
      sliders: [
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
        // ⭐⭐ A10 MADE THESE FOUR LOAD-BEARING FOR A MODE, not only for a flick test:
        // the depth gate IS the holder's §1.1 motion state. ⛔ They were re-sized against
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
        // ⭐ Moved here from CAPTURE (the owner, 2026-09-26): the three rules that decide what a
        // translating finger does.
        // ⭐⭐⭐ **`D51` — NOT A TUNABLE, A RULE SELECTOR.** Every other control here changes a
        // NUMBER; this one changes what two fingers on a Pioneer and its Follower DO.
        // ⛔ `1` = today (both translate). `0` = the Pioneer is pinned: it cannot translate, and
        // its finger drives the Follower's roll AND depth together.
        // ⚠ A 0/1 slider because the menu has no other kind of control — the fork selector took
        // the same shape (`D26`) — and `validateGestureConfig` refuses anything between, so a
        // half-set flag cannot masquerade as the default.
        tunable(st, "PIONEER translates (0=pinned)", "pioneerTranslates", 0, 1, 1),
        // ⭐⭐⭐ **THE OWNER'S FLAG OF 2026-09-22 — `WorldAxisA` / `WorldAxisB`.** `1` (the
        // default) fixes the object axes to the BOOT camera for the whole scene; `0` lets them
        // follow the camera, which is the build before this. ⛔ It does NOT select the channel
        // remap — `dy` drives depth and the second finger drives gravity either way.
        tunable(st, "WorldAxisB: axes fixed at boot (0/1)", "worldAxisB", 0, 1, 1),
        // ⭐⭐ 1 = the body follows the finger in its own horizontal plane; 0 = the dictated
        // dx→x / dy→depth channels. ⛔ A RULE, not a number — the device report of 2026-09-23.
        tunable(st, "translate: 1=plane, 0=channels", "translatePairing", 0, 1, 1),
      ],
    },
    {
      title: "OBJECT ROTATION",
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
      // ⭐⭐ **THE FACE SUBMENU** — the owner, 2026-09-25: *"create a Face submenu and place the
      // slider as PioneerFaceCursor sensitivity inside this submenu"*. ⚠ Last, after CAPTURE: the
      // section order above is the owner's, and a new section does not reorder it.
      // ⭐⭐ **RENAMED FACE ALIGNMENT** — the owner, 2026-09-26: *"rename the menu FACE to FACE
      // ALIGNMENT and move the menus eviction shake and capture under FACE ALIGNMENT"*.
      title: "FACE ALIGNMENT",
      sliders: [],
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
              // ⭐⭐⭐ SHIPPED WITH THE RULE, NOT AFTER IT — `QUEUE`'s standing lesson: *a guessed
              // number has been wrong every single time*, and all four of these are guesses.
              // ⛔⛔ AND THE JUDGEMENT IS A SAFETY ONE, not a feel one: the whole question is the gap
              // between a shake and a **corrective nudge** during fine positioning, because eviction
              // destroys alignments the user set deliberately. ⚠ `evictShakeLegMm` has a validator
              // rule under it (3× the measured noise), so the slider cannot reach a value where a
              // reversal could be jitter.
              title: "⭐ EVICTION SHAKE (A4)",
              sliders: [
                tunable(st, "reversals to evict", "evictShakeReversals", 2, 5, 1),
                tunable(st, "window (ms)", "evictShakeWindowMs", 200, 1200, 50),
                tunable(st, "leg / hysteresis (mm)", "evictShakeLegMm", 3, 25, 1),
                tunable(st, 
                  "straightness (0=strict, 1=any)",
                  "evictShakeStraightness",
                  0.1,
                  0.9,
                  0.05,
                ),
              ],
            },
            {
              // ⭐⭐ THE OWNER ASKED FOR THIS SLIDER BY NAME (`D49`): *"I want the offset distance to be
              // manually adjustable by slider."* ⛔ The standing *do not inflate the tuning menu* rule
              // is set aside where a hand says it wants to tune something — the same exception §8 of the
              // spec grants `BreakThreshold`.
              // ⚠⚠ IT IS MILLIMETRES ON THE GLASS, NOT IN THE WORLD. The world gap it authorises grows
              // with the camera distance, so the same slider value means the same APPARENT clearance at
              // every zoom — which is what the owner asked for and what the HUD's `gap=…/…mm` shows.
              title: "⭐ CAPTURE (D49)",
              sliders: [
                // ⚠ 1–40 mm: below ~2 mm two bodies must essentially touch before white appears, and
                // above ~40 mm the whole scene captures at the boot zoom. ⛔ A range chosen to make both
                // ends visibly WRONG on the glass, because a slider whose every value looks plausible
                // teaches a hand nothing.
                tunable(st, "capture offset (mm on glass)", "captureOffsetMm", 1, 40, 0.5),
                // ⭐ The owner, 2026-09-26: the Pioneer does not sway while its Follower is within this
                // many capture offsets of it; *"put it just below the offset radius"*.
                tunable(st, "Pioneer sway off within (× offset)", "pioneerSwayRadii", 0, 10, 0.5),
                // ⭐ The magnet's pull: how long the face centre takes to reach the cursor (`D100`).
                tunable(st, "snap time (ms, 0 = at once)", "snapMs", 0, 400, 10),
                // ⚠ Gates a method THAT DOES NOT EXIST YET (*"we will define it later on"*), so it
                // ships at 0 and turning it on changes only what the HUD reports.
                tunable(st, 
                  "zone ENTER calls CameraOffsetZoneEnter (0/1)",
                  "cameraOffsetZoneEnterSetupB",
                  0,
                  1,
                  1,
                ),
                // ⚠ Blender's 5°. Below it the exact mapping is abandoned for the fixed-rate push; at 0
                // there is no fallback and a level camera sends the body a very long way.
                tunable(st, "axis tracking cone (deg)", "axisTrackingConeDeg", 0, 30, 1),
                // ⭐⭐⭐ THE FEATURE'S OWN SWITCH, directly above its cone — the owner, 2026-09-25.
                // ⚠ `0` also retires the exception that lets a press reach a FROZEN body's offered face.
                tunable(st, "fuchsia offer on/off", "pioneerCandidates", 0, 1, 1),
                // ⭐⭐ How close to MATING a face must be before it lights fuchsia. ⛔ `0` is the honest
                // OFF for the cone: only an exactly opposed face. The owner asked for 0–45 in steps of 5.
                tunable(st, "fuchsia cone (deg)", "pioneerCandidateConeDeg", 0, 45, 5),
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
