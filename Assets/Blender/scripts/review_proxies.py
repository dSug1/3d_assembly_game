"""THE FACE PROXIES' REVIEW, for playability (Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md §4.3 item 3) — any scene built by a build_<scene>.py.

Reads the built .blend, and for every step of the plan colours the faces the gizmo and the orbit will run on at that step — the PLACED parts'
face proxies (UFM_…), plus the ghost floors of the part being placed — by their risk:
  red     within 15° of 45° of elevation (the face map's side / cap boundary: the gizmo cannot decide)
  orange  NARROW or tiny (under ≈ 7 mm on the glass: the gizmo jumps across it)
  yellow  a plane CHOPPED into 4 separate ISLANDS or more (faces touching are one island)
  green   fine
  magenta a ghost floor (named with the part it serves)
  grey    a SEAT face (lying on another part's face, facing back: unreachable once seated), set back 0.003 so the pair never flickers
It renders two views a step into <out>/review/ and saves <scene>_review.blend beside the build (never the build itself), and prints a report.

Run:  blender -b <scene>.blend --python Assets/Blender/scripts/review_proxies.py
"""
import bpy, bmesh, math, os
from mathutils import Vector

NARROW, TINY = 0.05, 0.0025          # reference units: a face narrower than 0.05 (≈ 7 mm at 0.14 m a unit), smaller than 0.05²
CAP_BAND, CHOPPED = 14.5, 4          # degrees off 45° (the rule: ≥ 15° — a face AT 15°, 30° or 60° of elevation, passes); faces on one plane

blend = bpy.data.filepath
out_dir = os.path.join(os.path.dirname(blend), "review")
os.makedirs(out_dir, exist_ok=True)
scene = bpy.context.scene
root = bpy.data.objects["YUP_ROOT"]
to_root = root.matrix_world.inverted()
bpy.context.view_layer.update()

parts = {o.name: o for o in bpy.data.objects if o.get("part_id")}
step_of = {o["part_id"]: int(o["step"]) for o in parts.values()}
part_of = lambda o: next((p for p in parts.values() if o.parent is p or (o.parent and o.parent.parent is p)), None)
proxies = [o for o in bpy.data.objects if o.type == "MESH" and o.get("role") == "ufm"]


from mathutils.geometry import tessellate_polygon
from mathutils.bvhtree import BVHTree
_trees = {}


def inner_points(pts):
    """Points INSIDE a polygon (its triangles' centroids) — a notched face is concave."""
    return [(pts[a] + pts[b] + pts[c]) / 3 for a, b, c in tessellate_polygon([pts])]


def face_tree(i):
    """⛔ not BVHTree.FromPolygons on the polygon: it FANS a concave face (triangles outside its outline). Triangulated by its outline."""
    if i not in _trees:
        pts = faces_now[i][0]
        _trees[i] = BVHTree.FromPolygons(pts, [list(t) for t in tessellate_polygon([pts])])
    return _trees[i]


def colour(name, rgb):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Emission"].default_value = (*rgb, 1)
    b.inputs["Emission Strength"].default_value = 0.4
    m.diffuse_color = (*rgb, 1)                  # the colour in the viewport's Solid mode too
    return m


MATS = [colour("REV_green", (0.1, 0.7, 0.2)), colour("REV_yellow", (0.95, 0.85, 0.1)), colour("REV_orange", (1.0, 0.45, 0.0)),
        colour("REV_red", (0.9, 0.05, 0.05)), colour("REV_ghost", (0.85, 0.1, 0.85))]
MATS.append(colour("REV_seat", (0.35, 0.35, 0.35)))
GREEN, YELLOW, ORANGE, RED, GHOST, SEAT = range(6)
CONTEXT = bpy.data.materials.new("REV_context")
CONTEXT.diffuse_color = (0.6, 0.6, 0.6, 0.25)
CONTEXT.blend_method = "BLEND"
CONTEXT.use_nodes = True
CONTEXT.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.6, 0.6, 0.6, 1)
CONTEXT.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.25

# hide everything; the review shows only its own objects (and the plinth's mesh for context)
for o in bpy.data.objects:
    if o.type == "MESH":
        o.hide_render = not o.name.endswith("plinth_mesh") and not o.name.startswith("PreviewFloor")

report = []
steps = sorted(set(step_of.values()))
for k in steps[1:]:
    placing = [pid for pid, st in step_of.items() if st == k]
    faces = []                                                            # (ref points, normal, area, perimeter, source, ghost)
    faces_now = faces
    _trees.clear()
    for o in proxies:
        p = part_of(o)
        if p is None:
            continue
        ghost = bool(o.get("ghost"))
        if ghost and o.get("for_part") not in placing:
            continue
        if not ghost and (step_of[p["part_id"]] >= k or "rest" in o.name):
            continue
        m = to_root @ o.matrix_world
        for f in o.data.polygons:
            pts = [m @ o.data.vertices[i].co for i in f.vertices]
            n = (m.to_3x3() @ f.normal).normalized()
            per = sum((pts[i] - pts[(i + 1) % len(pts)]).length for i in range(len(pts)))
            area = f.area * abs((m.to_3x3() @ Vector((1, 0, 0))).length) ** 2
            faces.append((pts, n, area, per, o.name, ghost, o.get("for_part")))
    # planes: faces sharing a normal (2°) and an offset (0.005)
    planes = []
    for j, (pts, n, *_r) in enumerate(faces):
        d = n.dot(pts[0])
        for pl in planes:
            if pl[0].dot(n) > math.cos(math.radians(2)) and abs(pl[1] - d) < 0.005:
                pl[2].append(j)
                break
        else:
            planes.append((n, d, [j]))
    # CHOPPED: a plane broken into separate ISLANDS (faces touching — a shared corner — are one island: a wall flush across parts is one surface)
    def islands(js):
        """Faces TOUCHING are one island — a corner of one ON another's edge too (a T-junction: strips meeting without sharing a corner)."""
        parent = {j: j for j in js}
        def find(j):
            while parent[j] != j:
                parent[j] = parent[parent[j]]
                j = parent[j]
            return j
        for j in js:
            for i in js:
                if i <= j:
                    continue
                if any(face_tree(i).find_nearest(p)[3] < 1e-4 for p in faces[j][0]) or \
                        any(face_tree(j).find_nearest(p)[3] < 1e-4 for p in faces[i][0]):
                    parent[find(i)] = find(j)
        roots = {}
        for j in js:
            roots.setdefault(find(j), []).append(j)
        return list(roots.values())
    chopped = set()
    # SEATS: a face lying on another, facing BACK (two parts pressed together): unreachable once seated — grey, set back 0.003 so it never flickers
    seat = set()
    for j, (pts, n, *_r) in enumerate(faces):
        for i, (pts2, n2, *_r2) in enumerate(faces):
            if i != j and n.dot(n2) < -0.999 and abs(n.dot(pts[0] - pts2[0])) < 1e-4 and \
                    all(face_tree(i).find_nearest(c)[3] < 1e-4 for c in inner_points(pts)):
                seat.add(j)
                break
    for n, d, js in planes:
        isl = islands(js)
        if len(isl) >= CHOPPED:
            chopped |= set(js)
            if os.environ.get("REVIEW_DEBUG"):
                print(f"  step {k} plane n {tuple(round(c, 2) for c in n)}: {len(isl)} islands —",
                      [[tuple(round(c, 3) for c in sum(faces[j][0], Vector()) / len(faces[j][0])) for j in g] for g in isl])
    cls = []
    for j, (pts, n, area, per, src, ghost, fp) in enumerate(faces):
        elev = math.degrees(math.asin(max(-1, min(1, n.y))))
        if ghost:
            c = GHOST
        elif j in seat:
            c = SEAT
        elif abs(abs(elev) - 45) < CAP_BAND:
            c = RED
        elif area < TINY or (per > 0 and 2 * area / per < NARROW / 2):
            c = ORANGE
        elif j in chopped:
            c = YELLOW
        else:
            c = GREEN
        cls.append(c)
    # the review's objects: one mesh a step, the faces coloured
    me = bpy.data.meshes.new(f"REVIEW_step_{k:02d}")
    verts, polys = [], []
    for j, (pts, n, *_r) in enumerate(faces):
        base = len(verts)
        # ⛔ a proxy lies ON its real surface by design: shown over the context mesh it would FLICKER everywhere (the owner, step 3) —
        # every face LIFTED 0.002 off it along its normal; a seat set BACK 0.003 (grey, unreachable once seated)
        verts += [tuple(p - n * 0.003) if j in seat else tuple(p + n * 0.002) for p in pts]
        polys.append(list(range(base, base + len(pts))))
    me.from_pydata(verts, [], polys)
    for mt in MATS:
        me.materials.append(mt)
    for f, c in zip(me.polygons, cls):
        f.material_index = c
    ob = bpy.data.objects.new(f"REVIEW_step_{k:02d}", me)
    scene.collection.objects.link(ob)
    ob.parent = root
    # the CONTEXT: the placed parts' real meshes, faint grey (the owner: a proxy shown alone looked floating — the crank's nose)
    ctx_v, ctx_p = [], []
    for o in bpy.data.objects:
        p = part_of(o)
        if o.type == "MESH" and o.get("role") == "render" and p is not None and step_of[p["part_id"]] < k and not o.name.endswith("plinth_mesh"):
            mm, base = to_root @ o.matrix_world, len(ctx_v)
            ctx_v += [tuple(mm @ v.co) for v in o.data.vertices]
            ctx_p += [[base + i for i in pl.vertices] for pl in o.data.polygons]
    cm = bpy.data.meshes.new(f"REVIEW_context_{k:02d}")
    cm.from_pydata(ctx_v, [], ctx_p)
    cm.materials.append(CONTEXT)
    co = bpy.data.objects.new(f"REVIEW_step_{k:02d}_context", cm)
    scene.collection.objects.link(co)
    co.parent = root
    count = [cls.count(c) for c in range(6)]
    worst = sorted({(faces[j][4], ["", "chopped", "narrow/tiny", "near 45°", ""][c]) for j, c in enumerate(cls) if c in (RED, ORANGE, YELLOW)})
    ghosts = sorted({f"{faces[j][4]}→{faces[j][6]}" for j, c in enumerate(cls) if c == GHOST})
    report.append(f"step {k} (placing {', '.join(placing)}): {len(faces)} faces — green {count[0]}, yellow {count[1]}, orange {count[2]}, "
                  f"red {count[3]}, ghost {count[4]}, seat {count[5]}" + (f"; flagged: {worst}" if worst else "") + (f"; ghosts: {ghosts}" if ghosts else ""))
    # two views
    for o in bpy.data.objects:
        if o.name.startswith("REVIEW_step_"):
            o.hide_render = not o.name.startswith(ob.name)
    cam = scene.camera
    target = Vector((0.05, 1.3, 0))
    for tag, d in (("front", Vector((-0.95, 0.62, 1))), ("rear", Vector((0.95, 0.62, -1)))):
        to_b = lambda p: root.matrix_world @ p
        cam.location = to_b(target + d.normalized() * 16)
        cam.rotation_euler = (to_b(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.data.ortho_scale = 5.0
        scene.render.filepath = os.path.join(out_dir, f"step_{k:02d}_{tag}.png")
        bpy.ops.render.render(write_still=True)

# ⭐ the review FILE holds ONLY the faces to review (the owner, 2026-11-13: *"display only the faces I need to review in the review blend file
# (not all the scene, as I cannot see the faces I need to see)"*): every other object deleted, one collection a step, the first step with a
# finding shown (the others a click away in the outliner)
flagged = [int(line.split()[1]) for line in report if "flagged:" in line] or [steps[-1]]
for o in list(bpy.data.objects):
    if not o.name.startswith("REVIEW_step_") and o.type != "CAMERA":
        bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)
for o in list(bpy.data.objects):
    if o.name.startswith("REVIEW_step_"):
        k = int(o.name.split("_")[2])
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
        col = bpy.data.collections.get(f"Step {k:02d}")                        # ONE collection a step: its faces and its parts' context
        if col is None:
            col = bpy.data.collections.new(f"Step {k:02d}")
            scene.collection.children.link(col)
        for c in o.users_collection:
            c.objects.unlink(o)
        col.objects.link(o)
        o.hide_render = False
        bpy.context.view_layer.layer_collection.children[col.name].exclude = (k != flagged[0])
review_path = blend.replace(".blend", "_review.blend")
bpy.ops.wm.save_as_mainfile(filepath=review_path, copy=True)
print("\n================ THE FACE PROXIES' REVIEW →", out_dir)
for line in report:
    print(line)
print("review file →", review_path)
