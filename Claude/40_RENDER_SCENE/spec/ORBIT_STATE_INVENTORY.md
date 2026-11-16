# THE ORBIT'S STATE — the inventory before the charts take over (2026-11-15, branch `1.0.146-Orbit-charts`)

Step 2.1 of [`ORBIT_CHARTS.md`](ORBIT_CHARTS.md) §7.2 (§4.2, §4.4). Read-only: nothing here changes code. Every line number is this worktree's at the
commit that adds this file. Abbreviations: `AW` = `src/render/assembly_wiring.ts`, `SS` = `src/render/scene_state.ts`, `SC` = `src/render/scene.ts`,
`PW` = `src/render/pointer_wiring.ts`, `GB` = `src/render/green_box_wiring.ts`, `MB` = `src/render/model_bodies_wiring.ts`,
`PR` = `src/render/play_recorder.ts` (a recorder: it reads, never writes), `FM` = `src/input/face_map.ts`, `OT` = `src/input/orbit_tilt.ts`,
`PZ` = `src/input/polar_zone.ts`, `OC` = `src/input/orbit_calm.ts`, `RL` = `src/render/render_loop.ts`.

⭐ **Reset**: every field below is set ONLY at `createScene` (`SC:97`, the lines `SC:537 – 589`) unless the column says otherwise. There is no reset
function. A part picked (`MB:375 pick`) clears four fields only (`MB:398 – 401`); a part put down (`MB:457`) clears none.

⭐ **Space** (section G): MODEL = read on the parts' model pose (`worldPlacementOf`), world axes; F = MODEL coordinates expressed in the map's frame F
(the tilt's or the zone's: `mapFrame`, `AW:213`); DRAWN = read off a rendered mesh or the camera as drawn; — = no position.

## A. The `asm…` fields (and the three `pieceHold…` fields declared in the same block, `SS:329 – 470`)

53 fields: 50 named `asm…`, plus `pieceHold`, `pieceHoldPrev`, `pieceHoldCount`. ⭐ Added since this inventory (not in the table): `asmAtlas`, `asmDirEase` (step 2.4, 2026-11-15); `asmFaceBand` (step 2.4d, 2026-11-16 — the banded facet under the gizmo and the map it indexes: HISTORY, the map's frame, `null` with `chartLayout` 0, cleared with `asmShown` at every change of frame).

| field | decl | holds | written (fn, line) | read by | reset besides init | kind | space |
|---|---|---|---|---|---|---|---|
| `asm` | `SS:332` | the assembly's centre and radius (half its largest size) | `ensureAssembly AW:92` | `ensureAssembly AW:87`, `assemblyFrame AW:860`, `orbitDragStep PW:355` (radius), `MB:405`, `cameraBlends MB:616,626`, `PR:188` | `MB:398` (pick) | GEOMETRY (no key: once per pick) | DRAWN — from `placedBox`, the meshes' world bounding boxes `AW:68 – 80` |
| `asmGizmo` | `SS:333` | the gizmo's FOOT on the shell, eased | `ensureAssembly AW:97`, `assemblyFrame AW:984` | `gizmoFor AW:440`, `assemblyFrame AW:964,987,988,992`, `PR:156` | `MB:399` | VIEW | MODEL |
| `asmSupport` | `SS:335` | the support part under the piece's footprint (key, index) | `supportFrame AW:508,523,529` | none in `src` | — | OTHER (write-only result) | — |
| `asmSupportLevel` | `SS:337` | the support's level `h` along `n`, a drop eased | `supportFrame AW:509,524,559,562,566` | `footOf AW:466`, `restDrawn AW:490`, `supportFrame AW:533` | — | HISTORY | MODEL |
| `pieceHold` | `SS:340` | the ring's hold offset | `greenBoxFrame GB:883,930` | `GB:878,963`, `ringAnchorAt GB:1124` | `GB:930` | HISTORY | MODEL |
| `pieceHoldPrev` | `SS:342` | last frame's solved anchor and its approach | `GB:864,924,931` | `GB:873` | `GB:864,931` | HISTORY | MODEL |
| `asmRestOff` | `SS:344` | the rest left out during the approach's own query | `approachMove AW:1171,1173` | `footOf AW:474`, `restDrawn AW:491`, `AW:1170` | — | OTHER (re-entrancy flag) | — |
| `pieceHoldCount` | `SS:346` | ring holds counted | `GB:886` | (HUD, probes) | — | OTHER (counter) | — |
| `asmLook` | `SS:347` | the camera's look point, eased | `ensureAssembly AW:98`, `assemblyFrame AW:994` | `greenBoxFrame GB:1045,1049`, `PR:157` | `MB:400` | VIEW | MODEL from `asmGizmo` and DRAWN `asm.centre` |
| `asmFacePoint` | `SS:348` | the point the gizmo's face was taken at (the edge rule) | `assemblyFrame AW:974,975` | `assemblyFrame AW:966` | — | HISTORY (latch) | MODEL |
| `asmG` | `SS:350` | this frame's gizmo (map point + relocation) | `ensureAssembly AW:99`, `assemblyFrame AW:960` | `gizmoFor AW:436`, `supportFrame AW:532`, `gizmoAtAngles AW:810`, `assemblyFrame AW:851,952,964`, `sectionLinesFrame AW:1044`, `tiltOn AW:1488`, `nextTiltHeading AW:1578,1581`, `tiltOff AW:1603`, `zoneStep AW:1698`, `zoneSwitch AW:1725`, `spitStep AW:1838` | `MB:401` | HISTORY (read next frame as last frame's place) | MODEL |
| `asmPrevQ` | `SS:351` | last frame's orbit angles (yaw, v) | `assemblyFrame AW:918`, `turnAngles AW:1466` | `gizmoAtAngles AW:807`, `assemblyFrame AW:917` | — | HISTORY | angles in the base frame |
| `asmSectionLines` | `SS:352` | the red / green line mesh | `sectionLinesFrame AW:1047,1094,1138 – 1145` | `assemblyFrame AW:1009` | — | RENDER | MODEL points drawn |
| `asmSectionKey` | `SS:353` | the drawn lines' key | `sectionLinesFrame AW:1096` | `AW:1095` | — | RENDER | — |
| `asmShown` | `SS:355` | the map's place this frame: `t` (`MapTarget`), `yaw`, `pitch` | `assemblyFrame AW:954`, `tiltOff AW:1642`; nulled `tiltOn AW:1549`, `tiltOff AW:1629`, `zoneSwitch AW:1737` | `squareFrame AW:248`, `calmTargets AW:340`, `assemblyFrame AW:934,952`, `sectionLinesFrame AW:1043`, `tiltOn AW:1487`, `exitNormal AW:1590`, `PR:166` | at each change of frame | HISTORY | F |
| `asmMapQ` | `SS:357` | the map's angles (after the catch-up) | `assemblyFrame AW:928`, `tiltOn AW:1536`, `tiltOff AW:1634,1644`, `zoneSwitch AW:1744,1750` | `gizmoAtAngles AW:808`, `assemblyFrame AW:909,922`, `PR:165` | re-read at each change of frame | HISTORY | angles in F |
| `asmEdgeHold` | `SS:365` | the dy hold after a crossing (`EdgeHold`) | `tiltOff AW:1612`, `spitStep AW:1840`, `edgeHoldFinger` via `PW:339`; nulled `AW:851`, `spitStep AW:1833`, `gestureOver PW:269` | `edgeHoldDy` via `PW:337`, `PW:339`, `PR:173` | `AW:851`, `PW:269`, `AW:1833` | TRANSITION | MODEL (`g0`, `d`) |
| `asmZones` | `SS:367` | the placed set's polar zones | `zonesOf AW:1667` | `zonesOf AW:1665`, `zoneHighlightFrame AW:1858`, `PR:187` | by key | GEOMETRY, key `` `${asmWorldMap.key}#…the six zone knobs` `` (`AW:1664`) | MODEL (world map) |
| `asmZone` | `SS:369` | the zone the orbit is in: `id`, `zone` | `zoneStep AW:1708`, `zoneSwitch AW:1727` | `baseFrame AW:206`, `zoneFacetOf AW:315`, `faceMapOf AW:659`, `sectionLinesFrame AW:1050`, `assemblyCameraFrameRaw AW:1277,1282,1283`, `tiltOn AW:1486`, `nextTiltHeading AW:1578`, `zoneStep AW:1693`, `spitZone AW:1762` | — | HISTORY (the frame held, latched with `zoneExitMm`) | MODEL |
| `asmZoneMix` | `SS:372` | the camera's turn of a zone switch or a spit crossing | `zoneStep AW:1690` (null), `zoneSwitch AW:1752`, `spitStep AW:1836`; inner fields below | `zoneMixPose AW:1232`, `tiltClampStep AW:1402`, `zoneStep AW:1681`, `PR:172` | `AW:1690` when whole | TRANSITION | DRAWN (`from`: the camera shown) |
| `asmZoneFacetsF` | `SS:374` | memo: is facet j of the map in use one of the zone's | `zoneFacetOf AW:318` | `zoneFacetOf AW:319` | by key | GEOMETRY, key `` `${asmFaceMap.key}#${asmWorldMap.key}#${zone id}` `` (`AW:317`) | — |
| `asmPieceDrawn` | `SS:376` | where the piece was drawn last frame | `zoneMixPose AW:1234` | `poseShown AW:1260` | — | HISTORY | DRAWN (the orbited piece's drawn anchor `GB:963 – 965`; not swayed) |
| `asmCamLast` | `SS:378` | the last camera frame built (dir, up) | `assemblyCameraFrame AW:1220`, `zoneMixPose AW:1252` | `zoneSwitch AW:1752`, `zoneFinger AW:1774`, `spitStep AW:1836` | — | HISTORY | camera (never swayed) |
| `asmSpitSide` | `SS:380` | the side of the spit's axis the camera is on (±1, 0) | `assemblyFrame AW:874`, `zoneSwitch AW:1735`, `spitStep AW:1805,1824` | `assemblyCameraFrameRaw AW:1282`, `spitStep AW:1821`, `PR:171` | `AW:874,1735,1805` | HISTORY (2° hysteresis, `PZ:443`) | — |
| `asmSpitU` | `SS:382` | the direction the side was last read at | `AW:875,1736,1806,1825` | `spitStep AW:1823` | same | HISTORY | world direction from F |
| `asmZoneMesh` | `SS:384` | the fuchsia zones mesh and its key | `zoneHighlightFrame AW:1893` (visibility `AW:853,1860,1864`) | `AW:853,1860 – 1869` | disposed `AW:1868 – 1869` | RENDER | MODEL polygons drawn |
| `asmZoneAlpha` | `SS:386` | F's up angle on the glass, kept | `zoneFinger AW:1784` | `zoneFinger AW:1783` | — | HISTORY | — |
| `asmDySign` | `SS:388` | the sign of the finger's last orbit dy | `orbitDragStep PW:336` | `tiltOff AW:1610`, `spitStep AW:1839` | — | HISTORY | — |
| `asmHeadO` | `SS:390` | the world camera's held calm heading offset | `calmFrame AW:291,300`, `assemblyFrame AW:854` | `levelHeadingOf AW:307` | `AW:291,854` | VIEW | — |
| `asmHeadW` | `SS:392` | last frame's `poleWeight` | `AW:292,301,855` | `calmFrame AW:300` | same | HISTORY | — |
| `asmHeadYaw` | `SS:394` | last frame's orbit yaw for the held offset | `AW:293,302,856` | `calmFrame AW:299` | same | HISTORY | — |
| `asmTilt` | `SS:395` | the tilted pole (inner fields below) | `tiltOn AW:1521`, `tiltOff AW:1628` (null); inner writes below | 20 places: `dirFrame AW:198`, `mapFrame AW:214`, `calmDir AW:229`, `squareFrame AW:249`, `calmFrame AW:290`, `calmTargets AW:358`, `faceMapOf AW:659`, `assemblyFrame AW:869,885,911,1000,1004`, `sectionLinesFrame AW:1050`, `assemblyCameraFrameRaw AW:1273,1287`, `tiltFrame AW:1358`, `tiltClampStep AW:1398`, `tiltOn AW:1484`, `exitNormal AW:1588`, `tiltOff AW:1599`, `zoneStep AW:1712`, `spitZone AW:1763`, `PR:169` | `AW:1628` | TRANSITION (and the frame held) | F → world |
| `asmGOff` | `SS:425` | the gizmo's relocation offset and its ease (`v`, `left`, `timeMs`, `durMs`) | `assemblyFrame AW:953` (glide), `gOffStep AW:1346 – 1348`, `tiltOn AW:1538,1542`, `tiltOff AW:1630,1638`, `zoneSwitch AW:1738,1748` | `withGOff AW:1334`, `gOffStep AW:1343` | `AW:1348` when done | TRANSITION | MODEL (world offset) |
| `asmTiltAuto` | `SS:427` | the automatic tilt's latch | `assemblyFrame AW:884` | `squareFrame AW:259,260`, `assemblyFrame AW:883,885,899,900,911`, `tiltOnPress AW:1478`, `nextTiltHeading AW:1578` | — | HISTORY (5 cm hysteresis `OT:332`) | — |
| `asmTiltPending` | `SS:429` | the automatic tilt switched on, the camera waiting | `assemblyFrame AW:899` | `squareFrame AW:258`, `AW:898,901`, `tiltFrame AW:1365`, `tiltClampStep AW:1407`, `tiltOn AW:1520` | — | TRANSITION | — |
| `asmOrbitMm` | `SS:431` | finger travel (mm) since last frame | `orbitDragStep PW:362` (+=), `assemblyFrame AW:897` (0) | `assemblyFrame AW:896` | every frame | OTHER (input accumulator) | — |
| `asmBlend` | `SS:433` | the blend into the close-in alignment (`mm`, `tiltId`, `target`) | `assemblyFrame AW:900,901,902,1002,1003,1004,1005,1006` | `squareFrame AW:259`, `assemblyFrame AW:998`, `tiltFrame AW:1367`, `tiltClampStep AW:1407` | `AW:900,1004,1006` | TRANSITION | F (`target`) |
| `asmCalmWhole` | `SS:435` | the calm made whole by position (both shares) | `calmTargets AW:359,368,379,424`, `calmFrame AW:286` | `calmDir AW:230,231`, `calmFrame AW:282,297`, `levelHeadingOf AW:307`, `PR:174` | each frame | VIEW | — |
| `asmCalmWholeV` | `SS:437` | the same, the vertical share alone | `calmTargets AW:360,369,380,393,418`, `calmFrame AW:287` | `calmDir AW:231`, `calmFrame AW:283`, `PR:174` | each frame | VIEW | — |
| `asmSquare` | `SS:439` | the square camera close in (`n`, `target`, `q`) | inner writes below | `calmDir AW:234`, `squareFrame AW:247`, `assemblyFrame AW:1003 – 1005`, `tiltClampStep AW:1400`, `tiltOn AW:1532`, `tiltOff AW:1618`, `zoneSwitch AW:1732`, `PR:144` | never | VIEW | directions' frame (F) |
| `asmMouth` | `SS:441` | the gizmo held before a void's mouth (`point`, `hi`) | `assemblyFrame AW:939,940` | `assemblyFrame AW:911,937,941,952` | `AW:940` | HISTORY (latch) | MODEL |
| `asmRawPrev` | `SS:443` | last frame's gizmo before the glide | `assemblyFrame AW:942` | `assemblyFrame AW:939` | — | HISTORY | MODEL |
| `asmFaceMap` | `SS:445` | the face map in use (world's, tilt's or zone's) | `faceMapOf AW:662`, `worldFaceMap AW:675` | `zoneFacetOf AW:317`, `faceMapOf AW:660`, `PR:186` | by key | GEOMETRY (section D) | F |
| `asmWorldMap` | `SS:447` | the world's face map | `worldFaceMap AW:674` | `zoneFacetOf AW:317`, `worldFaceMap AW:672`, `zonesOf AW:1664`, `PR:186` | by key | GEOMETRY (section D) | MODEL |
| `asmCalm` | `SS:450` | the calm's eased normal and shares (`n`, `sH`, `sV`, `wA`) | `calmTargets AW:370,376,397,410,428`, `turnAngles AW:1467`, `tiltOn AW:1548`, `tiltOff AW:1627` | `calmDir AW:225`, `calmFrame AW:297`, `levelHeadingOf AW:307`, `assemblyCameraFrameRaw AW:1304`, `tiltFrame AW:1385`, `PR:175` | — | VIEW | F (`n`) |
| `asmRedCache` | `SS:452` | the red line's samples and refinement | `sectionLinesFrame AW:1085` | `AW:1093,1134` | by key `AW:1084` | RENDER | MODEL |
| `asmGreenCache` | `SS:453` | the green line's samples and refinement | `sectionLinesFrame AW:1088` | `AW:1093,1131` | by key `AW:1087` | RENDER | MODEL |
| `asmGizmoAt` | `SS:455` | the gizmo's exact point, where the ring is drawn | `assemblyFrame AW:985` | `pinkRingFrame GB:790`, `PR:151` | — | VIEW | MODEL |
| `asmGizmoLag` | `SS:457` | the rig's base lag along the face (ring, sections) | `assemblyFrame AW:987` | `assemblyFrame AW:1010`, `pinkRingFrame GB:790` | — | VIEW | MODEL |
| `asmParts` | `SS:459` | the placed parts' vertices and model-space boxes | `placedParts AW:616` | `placedParts AW:593,617`, `sectionLinesFrame AW:1050` | by key | GEOMETRY, key `placedKey` (`AW:592`) | MODEL (`modelHit`, `AW:605`) |
| `asmKey` | `SS:461` | the placed set's key and meshes | `placedKey AW:633` | `placedKey AW:624,634` | per frame | GEOMETRY, key frame + world + placed count (`AW:625`) | — |
| `asmCast` | `SS:463` | per part: model pose, drawn place and turn, model box | `castParts AW:182` | `castParts AW:172` | per frame | GEOMETRY, key frame + world + count (`AW:173`) | MODEL and DRAWN (both, by design) |
| `asmShell` | `SS:470` | the shell box (`shellBox`, the vertices' AABB) | `shellOf AW:449` | `shellOf AW:447` | by key | GEOMETRY, key `asmParts.key` (`AW:447`) | MODEL |

**Counts** — GEOMETRY 9 (`asm`, `asmZones`, `asmZoneFacetsF`, `asmFaceMap`, `asmWorldMap`, `asmParts`, `asmKey`, `asmCast`, `asmShell`); TRANSITION 6
(`asmEdgeHold`, `asmZoneMix`, `asmTilt`, `asmGOff`, `asmTiltPending`, `asmBlend`); HISTORY 20 (`asmSupportLevel`, `pieceHold`, `pieceHoldPrev`,
`asmFacePoint`, `asmG`, `asmPrevQ`, `asmShown`, `asmMapQ`, `asmZone`, `asmPieceDrawn`, `asmCamLast`, `asmSpitSide`, `asmSpitU`, `asmZoneAlpha`,
`asmDySign`, `asmHeadW`, `asmHeadYaw`, `asmTiltAuto`, `asmMouth`, `asmRawPrev`); VIEW 9 (`asmGizmo`, `asmLook`, `asmHeadO`, `asmCalmWhole`,
`asmCalmWholeV`, `asmSquare`, `asmCalm`, `asmGizmoAt`, `asmGizmoLag`); RENDER 5 (`asmSectionLines`, `asmSectionKey`, `asmZoneMesh`, `asmRedCache`,
`asmGreenCache`); OTHER 4 (`asmSupport`, `asmRestOff`, `pieceHoldCount`, `asmOrbitMm`). Total 53.

### A.1 The composites' inner fields

**`asmTilt`** (`SS:395 – 423`; created whole at `tiltOn AW:1521`):

| inner | holds | written | read | kind |
|---|---|---|---|---|
| `id` | the tilt's number (`++TILT_SEQ`) | `AW:1521` | `faceMapOf AW:659` (map key), `sectionLinesFrame AW:1050`, `assemblyFrame AW:1000`, `PR:169` | OTHER (cache key) |
| `map` | F → world, `capTilt` | `AW:1521` | `mapFrame AW:214`, `tiltFrame AW:1371`, `exitNormal AW:1591`, `tiltOff AW:1608` | GEOMETRY |
| `dir` | the directions' frame during the swing | `AW:1521`, `tiltFrame AW:1371` | `dirFrame AW:198`, `assemblyCameraFrameRaw AW:1292,1293,1297`, `tiltOn AW:1533,1534`, `tiltOff AW:1601` | TRANSITION |
| `facet` | the tilted facet in F's map | `AW:1521` (−1), `AW:1529`, `AW:1540` | `squareFrame AW:250`, `calmTargets AW:373`, `tiltFrame AW:1378`, `tiltOff AW:1608` | GEOMETRY |
| `delta` | the swing's angle | `AW:1521` | `tiltFrame AW:1371` | TRANSITION |
| `swingMs` | the swing's clock; null when done | `AW:1521`, `tiltFrame AW:1361,1372` | `tiltFrame AW:1360,1370,1390`, `tiltClampStep AW:1407` | TRANSITION |
| `byMm` | the swing paced by the finger (auto tilt made pending) | `AW:1521` | `tiltFrame AW:1364,1370`, `tiltClampStep AW:1407` | TRANSITION |
| `swingE` | that swing's share shown | `AW:1521`, `tiltFrame AW:1367,1368` | `tiltFrame AW:1370` | TRANSITION |
| `swingDurMs` | the swing's duration | `AW:1521` | `tiltFrame AW:1368,1370` | TRANSITION |
| `k` | the roll back shown (0 … 1) | `AW:1521`, `tiltFrame AW:1389` | `calmDir AW:230,231`, `assemblyCameraFrameRaw AW:1311,1313`, `tiltFrame AW:1390`, `tiltClampStep AW:1412`, `PR:169` | TRANSITION |
| `kT` | the roll back's target | `AW:1521`, `tiltFrame AW:1388` | `tiltFrame AW:1389` | TRANSITION |
| `off` | out past the auto threshold, or ended for a zone | `AW:1521`, `assemblyFrame AW:886`, `zoneStep AW:1713` | `AW:885`, `tiltFrame AW:1388,1390`, `tiltClampStep AW:1412`, `tiltOff AW:1602`, `zoneStep AW:1713` | TRANSITION |
| `finishing` | the gizmo crossed off the facet | `AW:1521`, `tiltFrame AW:1384` | `tiltFrame AW:1382,1388`, `tiltClampStep AW:1412`, `assemblyFrame AW:1004` | TRANSITION |
| `rollRad` | the roll's whole angle, read in the camera stage | `AW:1521` (π), `assemblyCameraFrameRaw AW:1312` | `tiltFrame AW:1389` | HISTORY (last frame's) |
| `axis` | the roll's last axis | `AW:1521`, `assemblyCameraFrameRaw AW:1314` | `AW:1311` | HISTORY |
| `exit` | the tilt is over: the world's frame next frame | `AW:1521`, `tiltFrame AW:1390` | `assemblyFrame AW:869` | TRANSITION |
| `exitAcross` | the exit is over a `b` end | `AW:1521`, `tiltFrame AW:1385` | `calmDir AW:230`, `assemblyCameraFrameRaw AW:1304`, `tiltOff AW:1627` | TRANSITION |
| `heading` | the snapped heading (`tiltHeading`) | `AW:1521` | `tiltOff AW:1610` | GEOMETRY |

**`asmZoneMix`** (`SS:372`): `from` (`AW:1752`, `AW:1836`; read `zoneMixPose AW:1236,1245`); `k` (0 at creation; `zoneStep AW:1689`; read
`AW:1236,1245`, `tiltClampStep AW:1402`, `AW:1690`); `rad` (π/2 placeholder at creation; `zoneMixPose AW:1238`; read `zoneStep AW:1688,1689`); `axis`
(`zoneMixPose AW:1237`; read `zoneStep AW:1686`, `AW:1236,1237`); `rule` (`AW:1246,1249`; read `AW:1245,1246`); `keep` (`AW:1250`; read `AW:1245`); `done`
(`zoneStep AW:1688`; read `AW:1688,1689`). All TRANSITION.

**`asmSquare`** (`SS:439`): `n` — `squareFrame AW:252,255`, `tiltOn AW:1533`, `tiltOff AW:1619`, `zoneSwitch AW:1733`; read `calmDir AW:235,236`,
`AW:254,255`, `tiltClampStep AW:1400` (VIEW). `target` — `squareFrame AW:251`, `tiltOn AW:1534`, `tiltOff AW:1620,1624`, `zoneSwitch AW:1734`; read
`AW:251,252`, `assemblyFrame AW:1003 – 1005`, `AW:1400` (HISTORY). `q` — `squareFrame AW:259,260`; read `calmDir AW:235,236`, `AW:1400`, `PR:144` (VIEW).

**`asmBlend`**: `mm` (`AW:901` 0, `AW:902` +=; read `AW:259,1006,1367`), `tiltId` (`AW:901`, `AW:1002`; read `AW:1001,1004`), `target` (`AW:901,1003,1005`;
read `AW:1004,1005`). **`asmGOff`**: `v`, `durMs` set at creation (`AW:953,1542,1638,1748`); `timeMs`, `left` stepped `gOffStep AW:1346,1347`; all read by
`withGOff AW:1335`. **`asmEdgeHold`** (`OT:99 – 108`): `sign` (read `edgeHoldDy OT:137`, `edgeHoldFinger OT:131`, `PR:173`), `back` (`OT:132 – 133`), `g0`
and `d` — written by `edgeHoldAt OT:119` and `crossingHold PZ:546`, read by NOTHING (F.6). **`asmCalm`**: `n`, `sH`, `sV`, `wA` (`OC:262 – 268`), read
together by `calmShown OC:424`. **`asmShown`**: `t` (`MapTarget` `FM:1102`: `band`, `side`, `stack`, `normal`, `surface`, `across`), `yaw`, `pitch`.
**`asmZone`**: `id`, `zone` (`PolarZone` `PZ:45`: `facets`, `poles`, `axis`, `frame`, `orientation`, `whole`, `reason`).

### A.2 Other state the three changes of frame read or write

| state | where | how the changes use it |
|---|---|---|
| `st.orbit` (yaw, elevation, `takeBeyond`) | — | reset by `turnAngles AW:1434`, `tiltClampStep AW:1409,1414`; read everywhere |
| `st.orbitUserV`, `st.orbitRawPrev`, `st.pieceQ`, `st.boxSpring`, `st.boxOrbit`, `st.cameraLagged`, `st.cameraOrbit` | — | turned into the new frame by `turnAngles AW:1437 – 1465` |
| `st.orbitInertia` | — | stopped `turnAngles AW:1468`, `tiltOff AW:1613`, `spitStep AW:1837`, `GB:832` |
| `st.approach` | `SS:471` | the auto tilt's distance `AW:884`; reset `MB:413,457`, `SC:590` |
| `st.gizmoNormal`, `st.gizmoHost` | — | written `assemblyFrame AW:968,973`, `GB:602,603`, `SC:803,805`; read `zoneStep AW:1702`, `zoneSwitch AW:1726`, `spitStep AW:1839`, `footOf AW:466`, `supportFrame AW:521` |
| `st.cameraPrev` | — | written `GB:1039`; read `shownHeading AW:1560` (the tilt's swing angle) |
| `st.camera` | — | read `poseShown AW:1258 – 1260` (the zone turn's start) |
| `st.lastVerdict`, `st.hudDirty` | — | the HUD's messages (`AW:887,1386,1550,1645,1753,1841`) |
| module `TILT_SEQ` | `AW:1330` | `++` at `AW:1521`; never reset (HISTORY outside the state) |
| module `ZONE_SEQ` | `AW:1651` | `++` at `AW:1727`; never reset |
| module `GIZMO_MEMO` | `AW:825` | `gizmoAtAngles`' memo per `st.frames`, ≤ 512 entries (`AW:811 – 823`); see F.4 |

## B. The three changes of frame

### B.1 The order within one frame

Between frames, each orbit pointer move (`orbitDragStep PW:303`): `asmDySign` `PW:336` → `edgeHoldDy` `PW:337` → `edgeHoldFinger` `PW:339` →
`zoneFinger` `PW:343` → `st.orbit.drag` `PW:357` → `tiltClampStep` `PW:360` → `asmOrbitMm +=` `PW:362`. A first press alone: `tiltOnPress` `PW:147`.
The last finger up: `gestureOver` clears `asmEdgeHold` `PW:269`.

The frame (`RL:344 greenBoxFrame`; `st.frames++` after it, `RL:349`):

1. `GB:827 – 832` the coast, clamped by `tiltClampStep` (`GB:832`).
2. `GB:842 assemblyFrame`: `takeBeyond` `AW:848`; `asmEdgeHold` dropped if the orbit is off `AW:851`; return if no part held `AW:852 – 858`;
   `ensureAssembly` `AW:859`; the approach's coast `AW:862 – 865` (solver queries, F.4); `supportFrame` `AW:867`.
3. **The tilt's exit** — `tiltOff` if `asmTilt.exit` (set by last frame's `tiltFrame`) `AW:869`.
4. **The zone** — `zoneStep` `AW:871`: the zone turn advanced, then the zone looked up; a switch made or, with a tilt present, DEFERRED (B.3).
5. **The spit's side cleared** outside a spit `AW:873 – 876`; `zoneHighlightFrame` `AW:877`.
6. **The automatic tilt** — the latch `AW:883 – 888` (out past it: `off`), pending / blend `AW:896 – 902`, the virtual pole `AW:909 – 910`, `tiltOn("auto")`
   `AW:911`.
7. **The map's place** — `mapAnglesStep` `AW:926`, `mapGizmo` `AW:929`, the mouth `AW:934 – 942`, the glide `AW:948 – 953`, `asmShown` `AW:954`,
   `tiltFrame` `AW:956` (the crossing, the roll back, `exit`), `gOffStep` `AW:958`, `asmG` `AW:960`.
8. `calmFrame` `AW:963` (→ `calmTargets`, `squareFrame`, the held heading); the face by the edge rule `AW:966 – 975`; the foot, `asmGizmo`,
   `asmGizmoAt`, `asmGizmoLag`, the centre, `asmLook` `AW:982 – 994`; `sectionLinesFrame` `AW:995`; the blend's end `AW:998 – 1007`.
9. Back in `greenBoxFrame`: the ring hold and the solve `GB:855 – 935`; the spring `GB:950`.
10. **The spit's side** — `spitStep(st, camPlace)` `GB:1037`, then the camera frame `cameraFrameNow` `GB:1038` → `assemblyCameraFrame AW:1216`
    (the tilt's roll angle `rollRad` written `AW:1312`), then **the zone / spit turn** applied `zoneMixPose` `GB:1061`.

**Where one waits for, delays or clears another:**

* A zone change with a tilt present sets `asmTilt.off` and returns (`AW:1712 – 1715`); the switch happens the frame `tiltOff` has run, i.e. after the
  whole roll back (`tiltExits` needs `k ≥ 1` and the swing done, `OT:353`) — not "a frame" (F.8).
* `tiltOn` refuses in any zone (`AW:1486`); `nextTiltHeading` returns none in a zone (`AW:1578`); `spitZone` requires no tilt (`AW:1763`).
* `zoneSwitch` clears the spit's side and `asmSpitU` (`AW:1735 – 1736`), `asmShown`, `asmGOff` (`AW:1737 – 1738`).
* A silent spit side change (round a tip) clears `asmEdgeHold` (`AW:1832 – 1834`).
* The calm's held heading is dropped under a tilt or a zone frame (`AW:290 – 295`).
* A new tilt id or `finishing` ends the blend (`blendCrossed`, `AW:1004`, `OT:663 – 667`).
* A spit crossing and a zone switch write the SAME `asmZoneMix`: one made during the other's turn restarts it from the pose shown (`AW:1752`, `AW:1836`).
* The tilt's roll uses the angle the camera stage read the frame before (`rollRad`, `AW:1312` → `AW:1389`); the zone turn waits a frame for its
  axis (`AW:1686`) and its angle is the one `zoneMixPose` read (`AW:1238`).

### B.2 The tilted pole

Functions: `tiltOnPress AW:1477 – 1480`, `tiltOn AW:1483 – 1552`, `shownHeading AW:1559 – 1570`, `nextTiltHeading AW:1577 – 1584`,
`exitNormal AW:1587 – 1592`, `tiltOff AW:1598 – 1647`, `tiltFrame AW:1357 – 1391`, `tiltClampStep AW:1397 – 1416`, `turnAngles AW:1422 – 1469`,
`withGOff AW:1333 – 1336`, `gOffStep AW:1342 – 1349`, `squareFrame AW:246 – 261`; in `assemblyFrame` `AW:869, 883 – 911, 956 – 958, 998 – 1007`;
the camera `AW:1287 – 1316`; the calm `AW:229 – 232, 373 – 382`.

* **Trigger, the press**: a first press alone, not the mouse's second touch (`PW:147`), and the auto latch off (`AW:1478`). **Automatic**: the latch on
  (`tiltAutoLatch`, approach distance ≤ `tiltAutoM`, off beyond + 5 cm, `OT:333 – 336`) and no tilt (`AW:911`). Both: `cfg.tiltedPole === 1`, a part
  held, no tilt, no zone, `asmShown`, `asmG` and the world map present (`AW:1484 – 1490`); the face `capStack` — the place's facet, or at a mouth / the
  virtual pole the world map's `top` / `bottom` (`AW:1492`) — must hold a pole (`holdsPole`, `AW:1495`).
* **Recomputed**: the heading `tiltHeading(cap.n, yaw)` snapped to 90° (`AW:1504`, `OT:84 – 86`); `R1 = capTilt` (`AW:1506`); the map BUILT IN F
  (`faceMapOf`, key `#T<id>`, `tiltFaces` + `tiltBox`, `AW:659 – 661`); the tilted facet by its normal (`facetOfNormal`, `AW:1528`); every angle turned
  (`turnAngles(Dᵀ)`, `AW:1530`); the square camera into F (`AW:1532 – 1534`); the map's angles re-read AT THE GIZMO (`mapAngles(map, gF, fi)`,
  `AW:1535`); the calm carried into F (`AW:1548`); `asmShown` null (`AW:1549`).
* **The camera's turn**: the swing's angle `deltaShown`, from the heading on the glass (`shownHeading`, `AW:1515 – 1516`), its duration at
  `tiltRollDegS` (`AW:1518`); by time, or by the finger (`byMm`: `blendShare` over `tiltBlendMm`, then `rollStep`, `AW:1364 – 1370`). The ROLL BACK:
  the angle of `frameMix` between F's camera and the world's camera that follows (`AW:1309 – 1312`, its heading `nextTiltHeading` over a ridge),
  stepped at `rollDurationMs(rollRad)` (`AW:1389`). The gizmo's relocation over max(swing, 45° at the speed) (`AW:1542`).
* **Exit**: the place off the tilted facet → `finishing`, `kT = 1` (`AW:1382 – 1388`); out past the auto threshold → `off` (`AW:886`); `exit` when off
  the facet (or `off`), `k ≥ 1` and the swing done (`AW:1390`, `OT:353`); next frame `tiltOff`: the dy hold if leaving AWAY from the heading
  (`edgeHoldAt`, exit normal more than 120° from it, `OT:112`; not when `off`, `AW:1609 – 1615`), every angle turned back (`AW:1616`), the square camera
  out with its target the face crossed onto (`AW:1618 – 1624`), the calm carried out (`AW:1627`), the map's angles re-read at the gizmo on the world
  map (`AW:1633`), `asmShown` set at once so a following tilt can be made in the same frame (`AW:1642`).
* **Held meanwhile**: every orbit step refused (`tiltClampStep`, `AW:1412 – 1415`) while the timed swing runs, while `finishing` or `off`, or while the
  square camera turns (`squareTurning`, `OT:321 – 324`); released when `asmTilt` is null and the square camera is within 0.5°. The square camera's share
  held while pending (`AW:258`).

### B.3 The polar zone

Functions: `zoneOptsOf AW:1654`, `zonesOf AW:1660 – 1669`, `sameZone AW:1672`, `zoneStep AW:1680 – 1717`, `zoneSwitch AW:1723 – 1758`,
`zoneMixPose AW:1231 – 1254`, `poseShown AW:1257 – 1261`, `baseFrame AW:205 – 210`, `zoneFacetOf AW:314 – 334`, `zoneHighlightFrame AW:1855 – 1894`;
the camera `AW:1273 – 1284`; the calm `AW:367 – 372, 419 – 425`; `polarZones PZ:237 – 346`, `zoneAt PZ:388 – 395`.

* **The zones**: on the WORLD map, `cfg.zoneOn === 1` (`AW:1662`): poles = contour corners of valence ≥ `valenceMin`, off the box's centre line
  (`PZ:249 – 250`); seeds where the star's median facet is small (`PZ:254 – 258`); growth by T2 / T3 (`PZ:262 – 276`); merged when touching
  (`PZ:278 – 289`); axis rim centroid → pole, snapped `snapDeg` (`PZ:291 – 301`); two on one line merged (`PZ:303 – 319`); UPRIGHT / SPIT by the axis's
  angle (`PZ:203 – 208`); `whole` over `wholeShare` of the contour's area (`PZ:321 – 334`).
* **Entering / leaving**: the zone holding the gizmo's world facet (`facetOfNormal(wm, gizmoNormal, asmG)`, last frame's), else the previous one until
  `zoneExitMm` past its rim (`distanceToFacets`), else none (`AW:1701 – 1704`, `PZ:388 – 395`). A recomputed set keeps the zone (and its id) when equal
  (`AW:1695`, `AW:1707 – 1709`). **The whole case**: `zoneAt` always returns it (`PZ:389 – 390`); with no gizmo yet, the whole zone or the previous one
  (`AW:1700`); the tilt is then never made (`AW:1486`).
* **The switch (the re-base)**: `turnAngles` from B0 to B1 (`AW:1729 – 1731`); the square camera turned (`AW:1733 – 1734`); the spit cleared; the map
  built in the zone's frame (key `#Z<id>`, `AW:659`) — or, for an UPRIGHT zone whose frame is the identity, NO frame: the world map, the zone a restriction
  only (`baseFrame` `AW:209`); the map's angles re-read at the gizmo (`mapAngles(map, gF, facetOfNormal(map, nF, gF))`, `AW:1743`); the relocation
  over 45° at the speed (`AW:1748`).
* **The camera's turn**: `asmZoneMix` from the pose on the glass (`AW:1752`); each frame `zoneMixPose` turns from it to the frame built
  (`poseAboutPiece`, or `poseFramingTwo` when the two framed exist, rule kept from the first frame, `AW:1236 – 1251`), and reads the turn's angle
  (`AW:1238`); `zoneStep` advances `done` at `tiltRollDegS` (`AW:1686 – 1690`). Upright: the camera upright in F (`AW:1277 – 1279`); spit: upright in the
  world, the heading by the side (`AW:1281 – 1283`).
* **Held**: every orbit step refused while `asmZoneMix.k < 1` (`AW:1402, 1408 – 1411`). No dy hold at a switch. On the zone's own facets the calm is
  whole (`AW:367 – 372`) and toward them by position (`AW:419 – 425`).

### B.4 The spit's side (the zenith crossing)

Functions: `spitZone AW:1761 – 1764`, `spitStep AW:1802 – 1843` (called `GB:1037`), `zoneFinger AW:1770 – 1792` (called `PW:343`); the camera
`AW:1280 – 1283`; `spitSide PZ:454`, `spitCameraHeading PZ:479`, `crossingPitch PZ:521`, `crossingHold PZ:540`.

* **Trigger**: a SPIT zone with a frame, no tilt (`AW:1763`); the side of the axis the camera's SHOWN direction is on at THIS frame's camera place
  (`AW:1820 – 1822`, 2° hysteresis `PZ:461`) changed; it is a CROSSING only if the camera's path passes over / under the axis at ≥ 60°
  (`crossingPitch`, `SPIT_CROSSING_PITCH_RAD`, `AW:1832`); else silent (the hold cleared, `AW:1833`).
* **Recomputed**: nothing of the map — F is unchanged, only the camera's heading side (`spitCameraHeading`, `AW:1283`).
* **The camera's turn**: `asmZoneMix` from the pose on the glass (`AW:1836`), advanced and applied as a zone's (B.3).
* **Held**: the orbit step while the turn runs (`AW:1402`); the coast stopped (`AW:1837`); then the dy that crossed (`crossingHold`, `AW:1839 – 1840`),
  released by the finger the other way (`PW:339`) or the gesture's end (`PW:269`). The finger is read in F's screen (`fingerInFrame`), swapped when the
  camera looks steeper than 60° (`AW:1787 – 1790`).

## C. The specificities' paths, and the map fields they read

| path | called from | map fields read |
|---|---|---|
| `stackDepthAt FM:967 – 1011` (protrusions, voids, bridges, the mouth) | `rawGizmo AW:728` (the facet `map.facets[t.stack]`, the place in its `t`, `b`, `heldFoot AW:700`) | facet `groups` (`region`, `depth`), `e`, `tLo`, `tHi`, `bLo`, `bHi`; `t`, `b` |
| `closedAlong FM:271` | `stackDepthAt FM:984` only | the groups' regions on the facet's plane |
| `voidOpening FM:1021`, `pieceEnters FM:1061` | `stackDepthAt FM:999` only | regions, `tLo` … `bHi` |
| the cast for the real depth | `rawGizmo AW:739 – 748` (`castPoint FM:1089`, `frameCast AW:780`) | `map.box` (`AW:740`); facet `t`, `b`, `bLo`, `bHi`, `tb`, `rect` (`chordAt FM:110`) |
| **a void's mouth** | `stackDepthAt FM:991 – 994` → `rawGizmo AW:750` → `mapGizmo AW:765` → `mouthHold AW:938` (`OT:290`) → `asmMouth AW:939 – 941`; the glide off while held `AW:952`; the tilt at the mouth `AW:911` → `capStack` = world map `top` / `bottom` `AW:1492` | `t.stack`, `t.surface`; facet groups / extents as above; world map `top`, `bottom` |
| `holdsPole FM:944 – 951` | `tiltOn AW:1495`, `nextTiltHeading AW:1583` — the only two | `top`, `bottom`, facet `kind`, `n[1]` against √½ |
| the tilt's virtual pole | `assemblyFrame AW:909 – 911` (`asmMapQ.pitch` at ±`ORBIT_PITCH_MAX_RAD`) → `tiltOn` `capStack` `AW:1492`; `cap = wm.facets[top/bottom]` may be the virtual cap (`FM:670, 682`) | `top`, `bottom`, that facet's `n` |
| the edge blend `blendThroughEdges FM:1353`, `edgeBlend FM:1293` | `mapGizmo AW:761` only (cast `blendCast AW:774`) — ⛔ INERT: `mapOpts` gives `edgeDeg 0` (`AW:638`), `edgeBlend` returns at `FM:1300`, `blendThroughEdges` at `FM:1363` (F.1) | (if active) `columns` (`mid`, `hw`, `bounds`), `mapTarget`'s `normal` |
| the glide `gizmoGlide OT:626` | `assemblyFrame AW:952` | `t.surface` now and last frame (`asmShown`) — none after a change of frame (`asmShown` null) |
| `acrossNormals AW:270 – 277` (the calm) | `calmTargets AW:354, 409` | `columns[side]` `mid`, `hw`; `mapTarget` `normal` |
| `calmTargets AW:337 – 429` | `calmFrame AW:284` | `facets[stack]` (`n`, `b`, `bLo`, `bHi`), `map.box`, `columns[side].facets` (top / bottom ends `AW:414 – 424`), `band` by `capEdgePitch` (`AW:395`) |
| `squareFrame AW:246` | `calmFrame AW:285` | `t.band`, `t.stack`, `t.normal` |
| `zoneFacetOf AW:314` | `calmTargets AW:367, 422, 423` | facets `poly`, `n`; world map by `facetOfNormal` |
| `exitNormal AW:1587`, `tiltOff AW:1608` | the tilt's camera and exit | `facets[t.stack].n`, `facets[tl.facet].n` |
| `mapTarget FM:1183`, `mapAngles FM:1236` | `rawGizmo AW:724`; `AW:276, 395, 400`; `mapAngles` at `AW:1535, 1633, 1743` | `columns` (`mid`, `hw`, `bounds`, `facets`), facets (`n`, `e`, `t`, `b`, `bLo`, `bHi`, `tLo`, `tHi`, `tb`, `rect`, `poly`), `levels`, `top`, `bottom`, `core` |
| `polarZones PZ:237`, `t2Fails PZ:158` | `zonesOf AW:1666` | facets `real`, `poly`, `kind`, `n`; `columns[].facets`; `box` |

⭐ A chart-built map must therefore still provide: `box`, `core`, `facets[]` with `n`, `t`, `b`, `e`, `kind`, `groups` (regions and depths), `poly`,
`tLo` … `bHi`, `tb`, `rect`, `real`, `share`; `columns[]` with `mid`, `hw`, `facets`, `bounds`; `top`, `bottom`; `levels`.

## D. Where face maps are built

Two calls of `buildFaceMap` in `src` (both in `AW`; `orbit_charts.ts` and `ring_chart.ts` are not imported by the wiring):

| call | faces | box | options | cache, key | invalidated |
|---|---|---|---|---|---|
| `faceMapOf AW:661` (a tilt's or a zone's frame) | `tiltFaces(placedFaces(st), R)` — turned by Rᵀ (`OT:191`) | `tiltBox(shellOf(st), R)` — the bounds of the world box's 8 turned corners (`OT:201 – 214`) | `{ mergeDeg: cfg.facetMergeDeg, minShare: cfg.facetMinShare }` — no `layout`, no `scale`: today's | `asmFaceMap`, `` `${parts.key}#${facetMergeDeg}#${facetMinShare}#T${tilt id}` `` or `` `#Z${zone id ?? 0}` `` (`AW:659`) | by key only: a new placed set, a knob, every new tilt (`TILT_SEQ`), every zone switch (`ZONE_SEQ`) |
| `worldFaceMap AW:673` | `placedFaces(st)` (`AW:680 – 694`) | `shellOf(st)` — `shellBox` of `placedParts` (`AW:445 – 451`, `orbit_shell.ts:26`) | the same | `asmWorldMap`, `` `${parts.key}#${facetMergeDeg}#${facetMinShare}` `` (`AW:671`); also copied to `asmFaceMap` with no frame (`AW:675`) | by key only |

`placedFaces` takes every object not orbited, not frozen, goal-locked, enabled (`AW:683 – 685`), each face by `faceWorld` (`object_model.ts:419`) and
`faceTrianglesWorld` (`contact_wiring.ts:47`) — both on `worldPlacementOf`, the MODEL pose. `placedParts` / `placedKey` take every goal-locked enabled
mesh, frozen included (`AW:628 – 629`) — a different filter (F.9).

## E. Assumptions about the map's angles outside `buildFaceMap`

| place | what it assumes | reads | risk |
|---|---|---|---|
| `holdsPole FM:949 – 950` | a SIDE facet beyond 45° (`n_y > √½`) holds a pole | constant | ⛔ yes — a chart's side can run to ±90° (§2.2); a 60° roof would still trigger the tilt (`AW:1495`, `AW:1583`) |
| `poleWeight OC:232 – 238` (in `calmShown OC:428`, `calmFrame AW:298`) | the calm fades from 60° to 85° of pitch (a pole is beyond 60°) | constant | ⛔ yes — §5.1 removes the fade by the pitch |
| `cameraHeading OC:196 – 213` (`AW:1310, 1325`) | the camera looks DOWN from 50° – 60° of pitch: the heading read level | constant | ⚠ moderate — assumes the steep pitch is over a cap |
| `SPIT_BIAS_FROM_RAD` / `FULL` 60° / 75°, `SPIT_CROSSING_PITCH_RAD` 60° (`PZ:492 – 496`; `AW:1787`, `AW:1832`), `SPIT_OVER_AXIS_MIN` 0.5 (`PZ:499`) | a crossing over the axis is seen at ≥ 60° of the camera's pitch | constant (camera's pitch, not the map's) | ⚠ moderate — the crossing is a change of chart in §4.1, read at the edge, not by a pitch |
| `polarZones PZ:331` | a side facet "alike" in F if `|n_y| ≤ √½` | constant | ⚠ the whole rule (§3.4) is redefined on cells |
| `polarZones PZ:249` | the orbit's own pole 1 mm from the box's centre line | constant | ⚠ §3's table replaces it by the top / bottom set |
| `snapHeading OT:75 – 77` (`tiltHeading OT:84`) | a tilt's heading on a world axis (multiples of 90°) | constant | ⚠ yes for a frame off the world axes (§3.3: "found, not snapped") |
| `edgeHoldAt OT:112` | a far edge = the exit normal more than 120° from the tilt's heading | constant on normals | low |
| `capEdgePitch OC:288 – 298` (`calmTargets AW:395`) | pitch 0 is on a side band | reads the map (`band`) | low |
| `atPole AW:909 – 910` | a pole is at ±90° of the map's pitch | `ORBIT_PITCH_MAX_RAD` (`assembly_orbit.ts:28`), the map's angles | fine — a chart's pole is ±90° |
| `onCap AW:250`, `calmTargets AW:392, 413`, `calmTarget OC:307` | a cap is a band other than SIDE | reads the map | fine |
| `mapTarget FM:1192, 1218`, `edgeBlend FM:1306 – 1313` | pitch clamped to ±90° | H | fine |
| `RELOCATE_ANGLE AW:1351`, the placeholders π/2 `AW:1752, 1836`, the π `rollRad` at `AW:1521` | durations and placeholders | constant | none (no map angle) |
| `orbit_rig.ts:79 – 83, 188, 385 – 386` (30 / 60 / 75 / 85°) | the ring rig's swing and offsets | constant | none here — the assembly orbit returns before them (`camera_rig.ts:25, 32`); only `rigPlace` for the boot pitch (`AW:94`) |

Inside `buildFaceMap` (by design, the builder's): `capOf` beyond 45° and the ridge's tie `FM:672 – 679`; `PB`/`PT` ±45° / ±90° `FM:763 – 764`; the chart
fallback `FM:856 – 857, 893 – 894`.

## G. The sway and the two coordinate spaces

### G.1 Where the drawn assembly leaves its model pose

* The ONLY mesh writer for every non-orbited body: `RL:123 – 220` — the model re-read (`RL:130 – 134`), a follower spring toward it (`RL:163 – 183`),
  the sway springs home (`RL:187 – 196`), the pose `displayPose` = SWAY ∘ FOLLOW ∘ model (`RL:207 – 211`), written `RL:218 – 219`. It runs before
  `greenBoxFrame` (`RL:344`), so the orbit reads meshes already swayed this frame.
* The kicks: `orbitDragStep PW:370 – 411` — `swingBlock` (a turn about the placed parts' barycentre, `PW:402`; `sway_pass.ts:61 – 100`) and
  `nudgeOthersWorld` (a slide, `PW:411`; `sway_pass.ts:13 – 53`) on every body with `orbitCandidate` that `receivesSway` (frozen bodies excluded,
  `sway_pass.ts:43 – 46, 77 – 80`). The orbited piece is never swayed (`RL:125`).
* What moves: the placed parts' meshes (position and rotation) — never the model, never the camera.

### G.2 The conversions the orbit uses

| conversion | what | called |
|---|---|---|
| `swayRay` (`assembly_orbit.ts:141`) | a MODEL ray moved onto a part as drawn | `modelCast AW:141` |
| `unswayHit` (`assembly_orbit.ts:130`) via `modelHit AW:112 – 123` | a DRAWN hit (point, normal) back onto the model pose | `modelCast AW:156`, `placedParts AW:605` |
| `modelNormal` (`assembly_orbit.ts:150`) | the hit's local facet normal on the model pose | `modelHit AW:122` |
| `castParts AW:171 – 184` | each part's model pose and drawn place / turn, per frame | `modelCast AW:134` |
| `frameCast AW:780 – 785` | a ray in F turned into the world, the hit turned back | `rawGizmo AW:746`, `blendCast AW:775` |

`modelCast` is the only ray cast of the orbit; every gizmo, section sample and blended depth goes through it (`frameCast` → `modelCast`).

### G.3 The fields' spaces

In section A's last column. MODEL by construction: `asmG`, `asmGizmo`, `asmGizmoAt`, `asmGizmoLag`, `asmFacePoint`, `asmMouth.point`, `asmRawPrev`,
`asmGOff.v`, `asmEdgeHold.g0/d`, `asmSupportLevel`, `pieceHold`, `pieceHoldPrev`, the maps, `asmParts`, `asmShell`, `asmZones` / `asmZone` (from the world
map), `st.gizmoNormal` (`AW:973`, the hit's normal through `modelHit`). In F: `asmShown`, `asmMapQ`, `asmCalm.n`, `asmSquare`, `asmBlend.target`,
`asmFaceMap`. DRAWN: `asm` (centre and radius from the meshes' bounding boxes, `AW:73 – 77`); `asmZoneMix.from` and `asmCamLast` (the camera, never
swayed); `asmPieceDrawn` (the orbited piece, never swayed). The section lines and the fuchsia are drawn at MODEL places over swayed parts.

### G.4 The faces handed to `buildFaceMap`

On the MODEL pose: `faceWorld` (`object_model.ts:428 – 431`, `worldPlacementOf`) and `faceTrianglesWorld` (`contact_wiring.ts:49, 54`, the topology's
positions placed by `worldPlacementOf`). The box: `shellBox` of `placedParts`' vertices, each brought back by `modelHit` (`AW:603 – 605`). Confirmed.

### G.5 Rendered meshes, picks and camera rays in B and C

* No pick and no camera ray in the three changes of frame or the specificities: the tilt's press reads no pick (`PW:147`; the pick at `PW:156 – 161`
  serves the tap's centre, inert around the assembly — `PW:104` → `retargetGizmo` returns, `camera_rig.ts:44`).
* Rendered meshes read: `castParts AW:178 – 180` (converted, G.2); `placedParts AW:597 – 605` (converted); `placedBox AW:73 – 77` — ⛔ NOT converted
  (F.10); `heldFoot AW:703 – 705` (the held piece's local extents × scale: not swayed).
* The camera as drawn: `poseShown AW:1258 – 1260`, `shownHeading AW:1560` (`cameraPrev`), `zoneFinger AW:1774` — the camera, never swayed; they read
  the GLASS on purpose.

## F. Open questions for the auditor

1. **The edge blend is dead.** `MAP_OPTS` is `{ edgeMm: 0, edgeDeg: 0 }` (`AW:638`); `edgeBlend` returns at `FM:1300`, so `blendThroughEdges` returns
   `here` at `FM:1363` and `blendCast` is never reached. §4.4 lists it as live. Keep, port, or delete?
2. **A pick-up resets four fields only** (`MB:398 – 401`); a put-down none. With no part held `assemblyFrame` returns at `AW:852` clearing only the held
   heading and the fuchsia's visibility — `asmTilt`, `asmZone`, `asmZoneMix`, `asmMouth`, `asmShown`, `asmMapQ`, `asmCalm`, `asmSquare`,
   `asmTiltAuto`, `asmBlend`, `asmGOff`, `asmSpitSide` carry from one held part to the next. Intended?
3. **`asm` is not re-read when a part is seated**, only at a pick (`AW:87`, `MB:398`); the zones and maps are re-keyed on the placed set but the
   centre and radius (the look point, the close-in gain `PW:355`) stay those of the pick.
4. **`GIZMO_MEMO` is keyed by `st.frames` and the angles only** (`AW:811 – 818`). `st.frames++` is at `RL:349`, so queries made by pointer-time approach
   moves (`PW:332` → `approachMove AW:1165`) and by the coast in `assemblyFrame` (`AW:864`) share a frame number with the frame's later solve — across a
   `tiltOn` / `tiltOff` / `zoneSwitch` and across the `asmMapQ` / `asmPrevQ` updates (`AW:918, 928`) made in between. Can a stale memo entry be served?
5. **`asmSupport` is written and never read** (`AW:508, 523, 529`; nothing in `src`, nor the recorder).
6. **`EdgeHold.g0` and `.d` are dead** since the depth release was deleted (`OT:121`): only `sign` and `back` are read.
7. **The `asmTilt` doc comment is above `asmEdgeHold`** (`SS:358 – 363`, the field at `SS:395`).
8. **The zone switch waits for the WHOLE roll back**, not one frame as §4.2 says (`AW:1712 – 1715`; `tiltExits OT:353`): meanwhile the tilted map
   stays in use and the gizmo is held (`AW:1412`).
9. **Two filters for "the placed parts"**: `placedFaces` skips frozen and orbited objects (`AW:683`), `placedParts` / `placedKey` / `castParts` do not
   (`AW:629, 177`). The shell box (the maps' `box`, the tilted `tiltBox`) may then include the frozen floor while the faces do not. Is a frozen body ever
   in `goalCommit`?
10. **`asm.centre` and `asm.radius` are read off the DRAWN meshes** (`placedBox AW:73 – 77`, `getBoundingInfo().boundingBox` world), the only orbit input
    not brought back to the model: a pick made while the sway rings gives a centre off by the sway. Small (sub-degree swings), but it breaks the owner's
    rule.
11. **One `asmZoneMix` for two triggers** (`AW:1752`, `AW:1836`): a spit crossing during a zone's turn restarts the turn from the pose shown, and the
    reverse; is that the wanted single transition?
12. **The section lines and the fuchsia are drawn at MODEL places over SWAYED parts** (`AW:1063`, `AW:1878`): by the owner's rule, but they visibly part
    from the faces while the sway rings.
13. **The tilt reads `wm.facets[capStack]` with `capStack` from the map in use** (`AW:1492, 1500`): equal only because `tiltOn` runs with no tilt and no
    zone (`AW:1484, 1486`) and an UPRIGHT identity zone is refused too; a chart frame other than the world's would break this silently.
14. **The face map in a frame is rebuilt at every tilt** (key `#T<id>`, `AW:659`) even when the same cap and heading recur — a cost, not a defect.
