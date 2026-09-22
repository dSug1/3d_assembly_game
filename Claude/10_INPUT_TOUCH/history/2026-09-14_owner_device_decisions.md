# THE OWNER'S DEVICE DECISIONS OF 2026-09-14 — rule 1, the orbit, and the roll

> **STATUS** · record · **OWNS** · why rule 1 and the roll smoothing are what they are
> **READ IF** · you are about to change the orbit, or wondering why tilt-orbit is gone
> **LAST VERIFIED** · 2026-09-15

⚠ **This is narrative, not state.** What is in force lives in
[`../INDEX.md`](../INDEX.md) and [`../AMENDMENTS_R5.md`](../AMENDMENTS_R5.md).

⭐ Moved out of `INDEX.md` on 2026-09-15 when that file passed its 400-line cap.
`README.md` rule 1: *state lives in `INDEX.md`; narrative lives in `history/`*, and rule 3:
*hitting the cap is the signal to push narrative down a tier, not to keep appending.*

⛔ These are different in kind from the amendments in `AMENDMENTS_R5.md`. Those supersede
the owner's own specification. These are places the build **could not** follow it, or the
owner chose otherwise on the device with the alternative in front of them — and they are
kept because each one is a decision somebody will otherwise re-litigate.

---

## ⭐⭐ Amendments the OWNER made, 2026-09-14

⚠ These are different in kind from the departures above. Those are places the build
**could not** follow the spec and reported why. These are places the owner **chose**
something else, on the device, with the alternative in front of them.

**§2 rule 1 is DRAG-ORBIT, not tilt-orbit.** The spec orbits *"by the value of yaw
and pitch of the **device tilt**"* and states that *"the touch delta gates this rule
but its value is unused: touch acts as a clutch for tilt-orbit."*
⛔ **The orbit is now driven by the DELTA POSITION** of one touchpoint that hits no
object. ⭐ Consequences, so they are not rediscovered: `DeviceOrientation` leaves the
critical path entirely (no iOS permission prompt, no platform axis conventions, no
gimbal behaviour near vertical), and `tiltDeadband` was orphaned and **deleted**.
⚠ The barycentre selection is unaffected: it still chooses what the camera orbits
*around*.

**The orbit CENTRE migrates, it does not teleport.** Rule 1 re-chooses a barycentre on
every press, so aiming at a different pair of objects jumped the camera. ⭐ The centre
now blends over `orbitBlendDistanceMm` of **finger travel** — not wall-clock, so it
cannot drift on after the finger lifts — and blending the centre carries the position
and the orientation together.

**The orbit STOPS SHORT, on a three-ring surface.** Owner: *"we should define height
and radius of top and bottom rigs and not exceed these."* The camera rides a surface
defined by TOP / MIDDLE / BOTTOM rings, each with a radius **and** a height, and the
elevation parameter is clamped.
⭐⭐ **There is no pole to gimbal at, because the poles are not reachable** — the
classic orbit-camera failure cannot occur, rather than being patched where it occurs.
⭐ And *"three rigs, therefore two transitions"* is now **enforced by
`validateGestureConfig`**, which refuses any ring set whose camera distance changes
direction more than once — so the tuning menu explains a bad shape instead of leaving
it to be found by finger, which is how it was found the first time.

**Orbit directions are INVERTED** — *"if fingers move up and right, camera orbits down
and left."* The grab-the-**world** convention: the finger pushes the scene and the
camera swings the other way.
⛔ Recorded as a decision, not a detail: the two readings are exact opposites and both
internally consistent, so no sign-checking can tell you which a hand expects. `IN1`
shipped yaw **and** pitch inverted for precisely that reason.

**Roll smoothing ships ENGAGED, against the measurement.** A device A/B chose the
1€-filtered roll; the metric had scored it as a bad trade. ⭐ The metric was what was
wrong — its synthetic swirl rolled at twice a hand's speed, inflating the predicted
lag, and an error-against-ground-truth metric cannot score *"feels steady"*.

⚠ **Licence note for the three-ring orbit**, since it is the same idea as Unity
Cinemachine's FreeLook: ✅ no patent found, but ⛔ **Cinemachine's CODE is under the
Unity Companion License**, usable only in Unity-engine-dependent applications. Ours is
written from the geometry. See [`../../../THIRD_PARTY_NOTICES.md`](../../../THIRD_PARTY_NOTICES.md).
