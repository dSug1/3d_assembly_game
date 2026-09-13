# CHARTER — what is being built, and for whom

> **STATUS** · live · **OWNS** · the goal, the audience, the target platforms
> **READ IF** · you are new, or a decision turns on "who is this for"
> **LAST VERIFIED** · 2026-09-13

## The product

A **touchscreen 3D game in which objects are picked up, oriented and ASSEMBLED**.
Assembly is by **mate connectors** — Onshape's model, adopted deliberately: a local
coordinate system on a surface, and two objects join when two connectors mate.

Manipulation is **direct and kinematic** — an object's transform is driven straight
from the input, not through a physics engine. Carried from the predecessor, where it
was an original constraint and never regretted.

## Who it is for

⛔⛔ **ALL PUBLIC, INCLUDING YOUTH** — owner decision, carried 2026-09-13. This is
not a preference: it makes **COPPA and GDPR-K live**, puts the build inside Google
Play's Families policy and Apple's Kids Category, and turns three architecture
questions into compliance questions. See
[`../60_SECURITY_COMPLIANCE/INDEX.md`](../60_SECURITY_COMPLIANCE/INDEX.md).

**The game will be commercialised.** That is what makes `N13` binding: no
non-commercially-licensed dependency may enter the build.

## Where it has to run

**Cross-platform is the target, not an aspiration**: web first, then iOS / Android,
then desktop. One codebase.

⭐ **The platform decision was made on day one, deliberately.** In the predecessor it
was deferred for months and blocked four queue rows and the entire game layer — the
router there still reads *"no amount of building advances it."* Not repeating that is
the single most valuable thing carried over. See
[`DECISIONS.md`](DECISIONS.md) and [`LESSONS_CARRIED.md`](LESSONS_CARRIED.md) §1.

## What "done" looks like for the current phase

Two objects can be picked up, oriented, brought together and **assembled**, on a
phone, with the joint surviving further manipulation — reliably enough that a person
stops thinking about the gestures. The first milestone is narrower: **one mate,
formed and broken deliberately, on a real device.**
