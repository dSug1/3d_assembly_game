"""Scene_2 — the glass V6 at 120°: the W3 build, STEP BY STEP (Claude/30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md §6).

Each run rebuilds the .blend FROM SCRATCH up to the step asked, saves it, renders one preview PNG and prints a report — so the owner
reviews each part in Blender before the next one is added.

Run (from the repo root):
  "C:/Program Files/Blender Foundation/Blender 3.4/blender.exe" -b --python Assets/Blender/scripts/build_engine.py -- --step 1

Steps: 1 plinth E01 · 2 lower case E02 · 3 crankshaft E03 · 4 upper case E04 · 5 banks E05 E06 · 6 pistons E07–E12 · 7 heads E13 E14 ·
       8 exhausts E15 E16 · 9 pulley E17 · 10 the .glb export

Conventions (Claude/30_OBJECTS_3D/spec/PART_AUTHORING.md §3):
* REFERENCE UNITS, Y UP: every number is the reference's (× 0.14 m in the game, `unitM`). `YUP_ROOT` (rotation x 90°) maps reference Y to
  Blender Z and reference Z to Blender −Y — read the numbers inside it unchanged.
* A PART = an empty `E0x_<name>` (its origin and frame; its goal pose IS where it stands) with children:
    the render meshes · `UCX_<part>_NN` convex collision pieces (wire, hidden) · `UFM_<part>_<face>` flat face proxies (wire, hidden),
    `UFM_<part>_GHOST_<name>` ghost faces (never drawn, never collided) · `MC_<part>_<seat>` seat markers (single arrow = the OUTWARD
    normal, the empty's local X = the twist reference) · `HINGE_<part>_<name>` pivots (the empty's local X = the axis).
* Custom properties on the part empty: `part_id`, `kind`, `frozen`, `symmetry`, `step`.
"""
import bpy, bmesh, math, os, sys
from mathutils import Matrix, Vector

# ---------------------------------------------------------------- arguments, paths
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
STEP = int(argv[argv.index("--step") + 1]) if "--step" in argv else 1
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, "..", "World0_Scene2_engine"))
BLEND = os.path.join(OUT_DIR, "world0_scene_2_engine.blend")
PREVIEW_DIR = os.path.join(OUT_DIR, "previews")

# ---------------------------------------------------------------- the reference's numbers (Appendix B at 120°, §2.9 / §2.10 / §6)
UNIT_M = 0.14
YC = 0.81                       # the crank axis's height
RC, ROD_L = 0.2, 0.75           # throw, rod length
DECK = ROD_L + RC + 0.27        # 1.22
ALPHA = math.pi / 3             # each bank 60° from the vertical (the V at 120°)
PITCH, N_CYL = 0.7, 3
LEN = N_CYL * PITCH + 0.35      # 2.45
PLINTH_W, PLINTH_D, PLINTH_R, PLINTH_H, PLINTH_BEVEL = LEN + 0.9, 3.5, 0.3, YC - 0.55, 0.015

# ---------------------------------------------------------------- a fresh file
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.unit_settings.system = "NONE"


def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c


ENGINE = collection("ENGINE")
PREVIEW = collection("PREVIEW (not exported)")


def empty(name, coll, parent=None, matrix=Matrix(), display="PLAIN_AXES", size=0.1):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type, e.empty_display_size = display, size
    coll.objects.link(e)
    if parent is not None:
        e.parent = parent
    e.matrix_parent_inverse = Matrix()
    e.matrix_basis = matrix
    return e


YUP_ROOT = empty("YUP_ROOT", ENGINE, matrix=Matrix.Rotation(math.radians(90), 4, "X"), size=0.5)
YUP_ROOT["unitM"] = UNIT_M

# ---------------------------------------------------------------- materials (Principled; the .glb keeps colour, metal, roughness, alpha)
def material(name, rgb, metallic=0.0, roughness=0.5, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Alpha"].default_value = alpha
    m.diffuse_color = (*rgb, alpha)
    if alpha < 1:
        m.blend_method, m.shadow_method, m.show_transparent_back = "BLEND", "HASHED", False
    return m


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


MAT = {
    "glass": material("Glass", (1, 1, 1), roughness=0.03, alpha=0.26),
    "chrome": material("Chrome", srgb("C9CDD2"), metallic=1, roughness=0.14),
    "chromeH": material("ChromeHammered", srgb("C9CDD2"), metallic=1, roughness=0.2),
    "dark": material("Dark", srgb("55595F"), metallic=0.5, roughness=0.45),
    "woodV": material("WoodV", srgb("D59A5C"), roughness=0.5),
    "ucx": material("_UCX", (1.0, 0.45, 0.0), alpha=0.3),
    "ufm": material("_UFM", (0.0, 0.8, 1.0), alpha=0.35),
    "ghost": material("_UFM_GHOST", (1.0, 0.0, 1.0), alpha=0.35),
}

# ---------------------------------------------------------------- geometry helpers (bmesh, reference coordinates)
def rounded_rect(w, d, r, seg=8):
    """The outline (x, z) of a w × d rectangle with corner radius r, counter-clockwise seen from +y."""
    pts, x, z = [], w / 2 - r, d / 2 - r
    for cx, cz, a0 in ((x, -z, -90), (x, z, 0), (-x, z, 90), (-x, -z, 180)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def prism_y(outline, y0, y1):
    """An outline in (x, z) extruded from y0 to y1 — a closed mesh, outward normals."""
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y0, z)) for x, z in outline]
    top = [bm.verts.new((x, y1, z)) for x, z in outline]
    n = len(outline)
    bm.faces.new(bottom[::-1])
    bm.faces.new(top)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bottom[i], bottom[j], top[j], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def prism_x(outline_zy, x0, x1, bm=None):
    """An outline in (z, y) extruded along x from x0 to x1 — closed, outward normals; added to `bm` when given."""
    bm = bm or bmesh.new()
    a = [bm.verts.new((x0, y, z)) for z, y in outline_zy]
    b = [bm.verts.new((x1, y, z)) for z, y in outline_zy]
    n = len(outline_zy)
    faces = [bm.faces.new(a[::-1]), bm.faces.new(b)]
    faces += [bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i])) for i in range(n)]
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return bm


def box(x0, x1, y0, y1, z0, z1, bm=None):
    return prism_x([(z0, y0), (z1, y0), (z1, y1), (z0, y1)], x0, x1, bm)


def quad(bm, corners):
    """One flat face from its corners (reference coordinates), in order."""
    bm.faces.new([bm.verts.new(c) for c in corners])
    return bm


def saddle_outline(zw, y0, y1, r, seg=12):
    """A wall's (z, y) outline, z ±zw, y0..y1, with a half-round notch of radius r at its top centre (the saddle)."""
    pts = [(-zw, y0), (zw, y0), (zw, y1)]
    pts += [(r * math.cos(-math.pi * i / seg), y1 + r * math.sin(-math.pi * i / seg)) for i in range(seg + 1)]
    pts.append((-zw, y1))
    return pts


def cyl_between(p0, p1, r, seg=24, bm=None, circumscribed=False):
    """A closed cylinder of radius r from p0 to p1 (reference coordinates); `circumscribed`: the polygon holds the circle (collision)."""
    bm = bm or bmesh.new()
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    u = ax.orthogonal().normalized()
    v = ax.cross(u)
    rr = r / math.cos(math.pi / seg) if circumscribed else r
    ring = lambda p: [bm.verts.new(p + rr * (math.cos(2 * math.pi * i / seg) * u + math.sin(2 * math.pi * i / seg) * v)) for i in range(seg)]
    a, b = ring(p0), ring(p1)
    faces = [bm.faces.new(a[::-1]), bm.faces.new(b)]
    faces += [bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i])) for i in range(seg)]
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return bm


def sphere(c, r, bm=None):
    bm = bm or bmesh.new()
    res = bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=12, radius=r)
    bmesh.ops.translate(bm, vec=Vector(c), verts=res["verts"])
    return bm


def hull(points):
    """The convex hull of points (reference coordinates) — a collision piece."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in points]
    res = bmesh.ops.convex_hull(bm, input=vs)
    loose = list({v for v in res["geom_interior"] + res["geom_unused"] if isinstance(v, bmesh.types.BMVert)})
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    centre = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
    bm.normal_update()
    bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces if (f.calc_center_median() - centre).dot(f.normal) < 0])
    open_edges = sum(1 for e in bm.edges if len(e.link_faces) != 2)
    assert open_edges == 0, f"a hull is not a closed solid: {open_edges} edges without two faces"
    return bm


def ball_points(c, r, n=26):
    """Points ON a sphere (a hull of them holds it within 3 %)."""
    pts = [Vector((math.cos(t) * math.cos(p), math.sin(p), math.sin(t) * math.cos(p))) for p in (-1.0, -0.4, 0.4, 1.0)
           for t in [2 * math.pi * i / 6 for i in range(6)]] + [Vector((0, 1, 0)), Vector((0, -1, 0))]
    return [Vector(c) + r * q for q in pts]


def disc(center, normal, r, seg=16):
    """One flat round face (a proxy), its normal `normal`."""
    bm = bmesh.new()
    n = Vector(normal).normalized()
    u = n.orthogonal().normalized()
    v = n.cross(u)
    bm.faces.new([bm.verts.new(Vector(center) + r * (math.cos(2 * math.pi * i / seg) * u + math.sin(2 * math.pi * i / seg) * v))
                  for i in range(seg)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bm.faces[0].normal.dot(n) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm


def boolean_cut(base, cutters):
    """base − cutters (bmeshes, reference coordinates) by Blender's EXACT boolean; returns a new bmesh. The inputs are freed."""
    def obj(bm, name):
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(name, me)
        scene.collection.objects.link(o)
        return o
    b = obj(base, "_bool_base")
    tmp = [obj(c, f"_bool_cut_{i}") for i, c in enumerate(cutters)]
    for i, t in enumerate(tmp):
        m = b.modifiers.new(f"cut{i}", "BOOLEAN")
        m.operation, m.solver, m.object = "DIFFERENCE", "EXACT", t
    if os.environ.get("BOOL_DEBUG"):
        for k in range(len(tmp)):
            for j, m in enumerate(b.modifiers):
                m.show_viewport = j <= k
            ev = b.evaluated_get(bpy.context.evaluated_depsgraph_get())
            print(f"  boolean after cutter {k} ({len(tmp[k].data.vertices)} verts): {len(ev.data.vertices)} verts")
        for m in b.modifiers:
            m.show_viewport = True
    me = bpy.data.meshes.new_from_object(b.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    out = bmesh.new()
    out.from_mesh(me)
    for o in [b] + tmp:
        m = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.meshes.remove(m)
    bpy.data.meshes.remove(me)
    return out


def transformed(bm, matrix):
    bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return bm


def flat_face(outline, y):
    """One flat face (a proxy) on the plane y, its normal +y."""
    bm = bmesh.new()
    bm.faces.new([bm.verts.new((x, y, z)) for x, z in outline])
    return bm


def mesh_object(name, bm, mat, part, coll, role="render"):
    """A mesh child of `part`; `bm` is in REFERENCE coordinates and is brought into the part's frame."""
    to_local = part.matrix_basis.inverted()
    bmesh.ops.transform(bm, matrix=to_local, verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    o.parent = part
    o["role"] = role
    if role != "render":
        o.display_type = "WIRE" if role == "ucx" else "SOLID"
        o.hide_render = True
        o.show_wire = True
    return o


def seat_marker(name, part, coll, position, normal, tangent):
    """MC_: a seat marker — its single arrow (local Z) the OUTWARD normal, its local X the twist reference; reference coordinates in."""
    n, t = Vector(normal).normalized(), Vector(tangent).normalized()
    b = n.cross(t)
    rot = Matrix((t, b, n)).transposed().to_4x4()
    world = Matrix.Translation(position) @ rot
    e = empty(name, coll, parent=part, matrix=part.matrix_basis.inverted() @ world, display="SINGLE_ARROW", size=0.25)
    e["role"] = "seat"
    return e


PARTS = []


def new_part(pid, name, step, origin, frame=Matrix(), kind="", frozen=False, symmetry=""):
    coll = collection(f"{pid}_{name}", ENGINE)
    e = empty(f"{pid}_{name}", coll, parent=YUP_ROOT, matrix=Matrix.Translation(origin) @ frame, display="ARROWS", size=0.15)
    e["part_id"], e["kind"], e["frozen"], e["symmetry"], e["step"] = pid, kind, frozen, symmetry, step
    PARTS.append((e, coll))
    return e, coll


# ================================================================ STEP 1 — E01 the plinth (pre-placed, frozen)
def build_plinth():
    part, coll = new_part("E01", "plinth", 1, (0, 0, 0), frozen=True)
    outline = rounded_rect(PLINTH_W, PLINTH_D, PLINTH_R)
    bm = prism_y(outline, 0.0, PLINTH_H)
    top_edges = [e for e in bm.edges if all(abs(v.co.y - PLINTH_H) < 1e-9 for v in e.verts)]
    bmesh.ops.bevel(bm, geom=top_edges, offset=PLINTH_BEVEL, segments=3, affect="EDGES", profile=0.5)
    mesh_object("E01_plinth_mesh", bm, MAT["woodV"], part, coll)
    mesh_object("UCX_E01_00", prism_y(outline, 0.0, PLINTH_H), MAT["ucx"], part, coll, "ucx")
    inset = rounded_rect(PLINTH_W - 2 * PLINTH_BEVEL, PLINTH_D - 2 * PLINTH_BEVEL, PLINTH_R - PLINTH_BEVEL)
    mesh_object("UFM_E01_top", flat_face(inset, PLINTH_H), MAT["ufm"], part, coll, "ufm")
    seat_marker("MC_E01_case", part, coll, (0, PLINTH_H, 0), (0, 1, 0), (1, 0, 0))


# ================================================================ STEP 2 — E02 the lower case (a hollow glass tub, four saddles)
CASE_X, CASE_Z, WALL = LEN / 2, 0.625, 0.05      # x ±1.225, z ±0.625, walls 0.05
CASE_Y0, SPLIT = PLINTH_H, YC                    # 0.26 .. 0.81 (the split at the crank axis)
BULKHEAD_X, SADDLE_R = 0.35, 0.065
CRANK_REST_Y = YC + RC * math.cos(math.radians(120)) - 0.06   # 0.65: the lowest pin's bottom at the goal (θ = 0)
GHOST_CRANK = (1.10, 0.20)                       # the crank's resting proxy / ghost floor: x ±1.10, z ±0.20


def build_lower_case():
    part, coll = new_part("E02", "lower_case", 2, (0, CASE_Y0, 0), symmetry="yawHalfTurn")
    xi, zi, yf = CASE_X - WALL, CASE_Z - WALL, CASE_Y0 + WALL
    bm = box(-xi, xi, CASE_Y0, yf, -zi, zi)                                    # the floor
    for s in (-1, 1):
        box(-xi, xi, CASE_Y0, SPLIT, s * zi, s * CASE_Z, bm)                   # the long walls
        prism_x(saddle_outline(CASE_Z, CASE_Y0, SPLIT, SADDLE_R), s * xi, s * CASE_X, bm)   # the end walls, each a saddle
        prism_x(saddle_outline(zi, yf, SPLIT, SADDLE_R), s * BULKHEAD_X - WALL / 2, s * BULKHEAD_X + WALL / 2, bm)  # bulkheads
    mesh_object("E02_lower_case_mesh", bm, MAT["glass"], part, coll)

    # collision: 15 convex pieces — each saddle wall in three (either side of the saddle, and a block squared under it)
    pieces = [(-xi, xi, CASE_Y0, yf, -zi, zi)]
    for s in (-1, 1):
        pieces.append((-xi, xi, CASE_Y0, SPLIT, *sorted((s * zi, s * CASE_Z))))
        for xa, xb, ya, zw in ((s * xi, s * CASE_X, CASE_Y0, CASE_Z), (s * BULKHEAD_X - WALL / 2, s * BULKHEAD_X + WALL / 2, yf, zi)):
            xa, xb = sorted((xa, xb))
            pieces += [(xa, xb, ya, SPLIT, -zw, -SADDLE_R), (xa, xb, ya, SPLIT, SADDLE_R, zw),
                       (xa, xb, ya, SPLIT - SADDLE_R, -SADDLE_R, SADDLE_R)]
    for i, p in enumerate(pieces):
        mesh_object(f"UCX_E02_{i:02d}", box(*p), MAT["ucx"], part, coll, "ucx")

    # face proxy: the bottom (its seat on the plinth), the four outer sides, the top rim (the split face) — and the GHOST floor
    bm = bmesh.new()
    X, Z, y0, y1 = CASE_X, CASE_Z, CASE_Y0, SPLIT
    quad(bm, [(-X, y0, -Z), (X, y0, -Z), (X, y0, Z), (-X, y0, Z)])
    for s in (-1, 1):
        quad(bm, [(-X, y0, s * Z), (X, y0, s * Z), (X, y1, s * Z), (-X, y1, s * Z)])            # long sides
        bm.faces.new([bm.verts.new((s * X, y, z)) for z, y in saddle_outline(Z, y0, y1, SADDLE_R)])   # end faces
        quad(bm, [(-xi, y1, s * zi), (xi, y1, s * zi), (xi, y1, s * Z), (-xi, y1, s * Z)])      # rim: long walls' tops
        for zs in (-1, 1):                                                                     # rim: end walls' tops
            za, zb = sorted((zs * SADDLE_R, zs * Z))
            quad(bm, [(s * xi, y1, za), (s * X, y1, za), (s * X, y1, zb), (s * xi, y1, zb)])
    mesh_object("UFM_E02_outer", bm, MAT["ufm"], part, coll, "ufm")
    gx, gz = GHOST_CRANK
    mesh_object("UFM_E02_GHOST_crank", quad(bmesh.new(), [(-gx, CRANK_REST_Y, -gz), (gx, CRANK_REST_Y, -gz), (gx, CRANK_REST_Y, gz),
                                                          (-gx, CRANK_REST_Y, gz)]), MAT["ghost"], part, coll, "ufm")
    coll.objects["UFM_E02_GHOST_crank"]["ghost"] = True

    seat_marker("MC_E02_plinth", part, coll, (0, CASE_Y0, 0), (0, -1, 0), (1, 0, 0))
    seat_marker("MC_E02_crank", part, coll, (0, CRANK_REST_Y, 0), (0, 1, 0), (1, 0, 0))
    seat_marker("MC_E02_upper", part, coll, (0, SPLIT, 0), (0, 1, 0), (1, 0, 0))


# ================================================================ STEP 3 — E03 the crankshaft (at the goal's crank angle θ = 0)
SR, HW = 0.06, 0.2                                            # the bar's radius, a throw's half width
PX = [(i - (N_CYL - 1) / 2) * PITCH for i in range(N_CYL)]    # the throws at x −0.7, 0, +0.7
OFF = [i * 2 * math.pi / N_CYL for i in range(N_CYL)]         # the pins at 0°, 120°, 240°
NOSE_X, BAR_END_X = -LEN / 2 - 0.15, LEN / 2 + 0.1            # −1.375 (the pulley's shoulder), +1.325
REAR_CAP = (0.12, 0.06, LEN / 2 + 0.12)                       # r, length, x


def bank_frame(side):
    """A bank's frame (side −1 = bank A, +1 = bank B): at the crank axis, turned side × 60° about x."""
    return Matrix.Translation((0, YC, 0)) @ Matrix.Rotation(side * ALPHA, 4, "X")


CYLS = [(side, i, PX[i] + side * 0.1, f"{'A' if side < 0 else 'B'}{i + 1}") for side in (-1, 1) for i in range(N_CYL)]  # (side, pin, x, name)


def pin_centre(i):
    return Vector((0, YC + RC * math.cos(OFF[i]), RC * math.sin(OFF[i])))


def build_crankshaft():
    part, coll = new_part("E03", "crankshaft", 3, (0, YC, 0))
    bm, ucx = bmesh.new(), []
    c = lambda x, y=0.0, z=0.0: Vector((x, YC + y, z))
    x0 = NOSE_X
    for i, x in enumerate(PX):
        py, pz = RC * math.cos(OFF[i]), RC * math.sin(OFF[i])
        a, b = x - HW, x + HW
        cyl_between(c(x0), c(a), SR, 24, bm)                                   # the journal before the throw
        ucx.append(cyl_between(c(x0), c(a), SR, 8, circumscribed=True))
        cyl_between(c(a, py, pz), c(b, py, pz), SR, 24, bm)                    # the pin
        ucx.append(cyl_between(c(a, py, pz), c(b, py, pz), SR, 8, circumscribed=True))
        for xx in (a, b):                                                      # the two arms and their knees
            cyl_between(c(xx), c(xx, py, pz), SR, 20, bm)
            sphere(c(xx), SR, bm)
            sphere(c(xx, py, pz), SR, bm)
            ucx.append(hull(ball_points(c(xx), SR) + ball_points(c(xx, py, pz), SR)))
        x0 = b
    cyl_between(c(x0), c(BAR_END_X), SR, 24, bm)                               # the last journal
    ucx.append(cyl_between(c(x0), c(BAR_END_X), SR, 8, circumscribed=True))
    r, ln, xc = REAR_CAP
    cyl_between(c(xc - ln / 2), c(xc + ln / 2), r, 32, bm)                     # the rear cap
    ucx.append(cyl_between(c(xc - ln / 2), c(xc + ln / 2), r, 8, circumscribed=True))
    mesh_object("E03_crankshaft_mesh", bm, MAT["chrome"], part, coll)
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_E03_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # face proxy: the RESTING proxy (facing down, the same place as the lower case's ghost floor) and the nose's shoulder (the pulley's seat)
    gx, gz = GHOST_CRANK
    mesh_object("UFM_E03_rest", quad(bmesh.new(), [(-gx, CRANK_REST_Y, -gz), (-gx, CRANK_REST_Y, gz), (gx, CRANK_REST_Y, gz),
                                                   (gx, CRANK_REST_Y, -gz)]), MAT["ufm"], part, coll, "ufm")
    mesh_object("UFM_E03_nose", disc(c(NOSE_X), (-1, 0, 0), SR), MAT["ufm"], part, coll, "ufm")

    seat_marker("MC_E03_saddles", part, coll, (0, CRANK_REST_Y, 0), (0, -1, 0), (1, 0, 0))
    seat_marker("MC_E03_nose", part, coll, c(NOSE_X), (-1, 0, 0), (0, 1, 0))
    for side, i, x, name in CYLS:                                              # each rod's seat on its pin: the bank's axis outward
        up = bank_frame(side).to_3x3() @ Vector((0, 1, 0))
        seat_marker(f"MC_E03_pin_{name}", part, coll, pin_centre(i) + Vector((x, 0, 0)), up, (1, 0, 0))


# ================================================================ THE PISTONS' KINEMATICS (shared: step 4 cuts along their way, step 6 builds them)
PISTON_R, PISTON_H, PISTON_Y = 0.28, 0.32, 0.07      # body r, height, centre above the wrist pin (Appendix B, §2.9's radius)
BIG_R, BIG_IN, BIG_W = 0.085, 0.06, 0.08             # the big end: outer r, inner r (the pin), width along x
SMALL_R, SMALL_W = 0.06, 0.08                        # the small end (the wrist)
SHANK = (0.06, 0.10)                                 # the rod's shank: x, z


def kinematics(side, i, theta=0.0):
    """Appendix B's update() for one cylinder at the crank angle θ: the pin in the bank (ly, lz), the piston's travel s, the rod's angle."""
    a = theta + OFF[i]
    cy, cz = RC * math.cos(a), RC * math.sin(a)
    phi = side * ALPHA
    ly = cy * math.cos(phi) + cz * math.sin(phi)
    lz = -cy * math.sin(phi) + cz * math.cos(phi)
    s = ly + math.sqrt(ROD_L ** 2 - lz ** 2)
    return ly, lz, s, math.atan2(-lz, s - ly)


def rod_frame(side, i, x):
    """The rod's frame (reference coordinates): its origin the big end's centre (the pin), its local y toward the small end."""
    ly, lz, s, r = kinematics(side, i)
    return bank_frame(side) @ Matrix.Translation((x, ly, lz)) @ Matrix.Rotation(r, 4, "X")


def rod_outline_points(side, i, x, seg=16):
    """The rod's solid in points (reference coordinates): the big end's half ring (open toward the crank), the small end — their hull holds
    the shank."""
    F, pts = rod_frame(side, i, x), []
    for k in range(seg + 1):
        t = math.pi * k / seg
        for dx in (-BIG_W / 2, BIG_W / 2):
            pts.append(F @ Vector((dx, BIG_R * math.sin(t), BIG_R * math.cos(t))))
    for k in range(2 * seg):
        t = 2 * math.pi * k / (2 * seg)
        for dx in (-SMALL_W / 2, SMALL_W / 2):
            pts.append(F @ Vector((dx, ROD_L + SMALL_R * math.sin(t), SMALL_R * math.cos(t))))
    return pts


WAY_IN_LEN = 0.9    # how far back along the bore a piston's way in is swept (it starts above the deck)


def rod_sweep_points(side, i, x, steps=90):
    """The rod's way in: its points moved back along the bank's axis from its goal to WAY_IN_LEN."""
    up = bank_frame(side).to_3x3() @ Vector((0, 1, 0))
    base = rod_outline_points(side, i, x)
    return [p + up * (WAY_IN_LEN * k / steps) for k in range(steps + 1) for p in base]


# ================================================================ STEP 4 — E04 the upper case (a hollow glass trapezoid, cut where the rods pass)
FOOT = 0.45                     # a bank's foot plane, y′ = 0.45 in its frame: the upper case's slope
BORE_R = 0.30
BORE_HOLE = (0.36, 0.60)        # a bore's hole through the slope, y′ (the slope's glass is y′ 0.40 – 0.45)


def slope_z(y, offset):
    """|z| of the plane y′ = offset of bank B (the mirror for A) at the height y — the upper case's slopes."""
    return (offset - math.cos(ALPHA) * (y - YC)) / math.sin(ALPHA)


UC_TOP = 1.16


def bore_cutter(side, x, r=BORE_R, seg=48, squared=False):
    """A bore's hole through the slope, in reference coordinates: round (the look) or squared 2r (the collision)."""
    y0, y1 = BORE_HOLE
    bm = box(x - r, x + r, y0, y1, -r, r) if squared else cyl_between((x, y0, 0), (x, y1, 0), r, seg)
    return transformed(bm, bank_frame(side))


def bore_points(side, x):
    M, y0, y1 = bank_frame(side), *BORE_HOLE
    return [M @ Vector((x + dx, y, dz)) for dx in (-BORE_R, BORE_R) for dz in (-BORE_R, BORE_R)
            for y in [y0 + (y1 - y0) * k / 24 for k in range(25)]]


def footprint(points, y_lo, y_hi, margin=0.01):
    """The (x, z) box of the points between the heights y_lo and y_hi — None when none are there."""
    inside = [p for p in points if y_lo - margin <= p.y <= y_hi + margin]
    if not inside:
        return None
    return (min(p.x for p in inside) - margin, max(p.x for p in inside) + margin,
            min(p.z for p in inside) - margin, max(p.z for p in inside) + margin)


def bore_xs(side):
    return [x for s, i, x, n in CYLS if s == side]


def build_upper_case():
    part, coll = new_part("E04", "upper_case", 4, (0, SPLIT, 0), symmetry="yawHalfTurn")
    X, xi = CASE_X, CASE_X - WALL
    zb, zt = slope_z(SPLIT, FOOT), slope_z(UC_TOP, FOOT)                         # 0.520, 0.318
    yb, yt = SPLIT - 0.01, UC_TOP - WALL
    zbi, zti = slope_z(yb, FOOT - WALL), slope_z(yt, FOOT - WALL)
    outer = prism_x([(-zb, SPLIT), (zb, SPLIT), (zt, UC_TOP), (-zt, UC_TOP)], -X, X)
    inner = prism_x([(-zbi, yb), (zbi, yb), (zti, yt), (-zti, yt)], -xi, xi)
    cutters = [inner, cyl_between((-X - 0.1, SPLIT, 0), (X + 0.1, SPLIT, 0), SADDLE_R, 24)]
    cutters += [bore_cutter(side, x) for side, i, x, n in CYLS]
    cutters += [hull(rod_sweep_points(side, i, x, steps=1)) for side, i, x, n in CYLS]   # (b): only where the rods really pass
    mesh_object("E04_upper_case_mesh", boolean_cut(outer, cutters), MAT["glass"], part, coll)

    # collision — the end walls in three (either side of the half-hole, a block over it), each slope's strips between the bores (squared),
    # the top plate's boxes where no bore's line of descent (squared) passes
    ucx = []
    for s in (-1, 1):
        xa, xb = sorted((s * xi, s * X))
        for zs in (-1, 1):
            ucx.append(prism_x([(zs * SADDLE_R, SPLIT), (zs * zb, SPLIT), (zs * zt, UC_TOP), (zs * SADDLE_R, UC_TOP)], xa, xb))
        ucx.append(box(xa, xb, SPLIT + SADDLE_R, UC_TOP, -SADDLE_R, SADDLE_R))
        edges = sorted([-xi, xi] + [x - BORE_R for x in bore_xs(s)] + [x + BORE_R for x in bore_xs(s)])
        for a, b in zip(edges[0::2], edges[1::2]):
            if b - a > 1e-6:
                ucx.append(prism_x([(s * zb, SPLIT), (s * zt, UC_TOP), (s * slope_z(UC_TOP, FOOT - WALL), UC_TOP),
                                    (s * slope_z(SPLIT, FOOT - WALL), SPLIT)], a, b))
    cuts = []
    for side, i, x, n in CYLS:
        for pts in (bore_points(side, x), rod_sweep_points(side, i, x)):
            f = footprint(pts, yt, UC_TOP)
            if f:
                cuts.append((f[0], f[1], (f[2], f[3])))
    xs = sorted({-xi, xi} | {c for a, b, f in cuts for c in (a, b) if -xi < c < xi})
    top_boxes = []
    for a, b in zip(xs, xs[1:]):
        busy = sorted(f for ca, cb, f in cuts if f and ca < (a + b) / 2 < cb)
        free, z = [], -zti
        for lo, hi in busy:
            if lo > z:
                free.append((z, min(lo, zti)))
            z = max(z, hi)
        if z < zti:
            free.append((z, zti))
        for za, zb2 in free:
            if zb2 - za > 0.01:
                last = top_boxes[-1] if top_boxes else None
                if last and abs(last[1] - a) < 1e-9 and abs(last[2] - za) < 1e-6 and abs(last[3] - zb2) < 1e-6:
                    top_boxes[-1] = (last[0], b, za, zb2)          # the same free band as its neighbour: one box
                else:
                    top_boxes.append((a, b, za, zb2))
    for a, b, za, zb2 in top_boxes:
        ucx.append(box(a, b, yt, UC_TOP, za, zb2))
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_E04_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # face proxy: each slope's strips between the bores' squares (the banks' route and seat), the top's free boxes, the front and rear faces,
    # the end walls' bottoms (the seat on the lower case)
    bm = bmesh.new()
    for s in (-1, 1):
        edges = sorted([-X, X] + [x - BORE_R for x in bore_xs(s)] + [x + BORE_R for x in bore_xs(s)])
        for a, b in zip(edges[0::2], edges[1::2]):
            quad(bm, [(a, SPLIT, s * zb), (b, SPLIT, s * zb), (b, UC_TOP, s * zt), (a, UC_TOP, s * zt)])
        bm.faces.new([bm.verts.new((s * X, y, z)) for z, y in
                      [(-zb, SPLIT), (-SADDLE_R, SPLIT)] + [(SADDLE_R * math.cos(math.pi - math.pi * i / 12), SPLIT + SADDLE_R * math.sin(math.pi - math.pi * i / 12)) for i in range(13)]
                      + [(zb, SPLIT), (zt, UC_TOP), (-zt, UC_TOP)]])
        for zs in (-1, 1):
            za, zb2 = sorted((zs * SADDLE_R, zs * zb))
            xa, xb = sorted((s * xi, s * X))
            quad(bm, [(xa, SPLIT, za), (xb, SPLIT, za), (xb, SPLIT, zb2), (xa, SPLIT, zb2)])
    for a, b, za, zb2 in top_boxes:
        quad(bm, [(a, UC_TOP, za), (a, UC_TOP, zb2), (b, UC_TOP, zb2), (b, UC_TOP, za)])
    mesh_object("UFM_E04_outer", bm, MAT["ufm"], part, coll, "ufm")

    seat_marker("MC_E04_lower", part, coll, (0, SPLIT, 0), (0, -1, 0), (1, 0, 0))
    for side, tag in ((-1, "bankA"), (1, "bankB")):
        M = bank_frame(side)
        seat_marker(f"MC_E04_{tag}", part, coll, M @ Vector((0, FOOT, 0)), M.to_3x3() @ Vector((0, 1, 0)), (1, 0, 0))


# each seat: (the step, the host's marker, the part's marker) — anti-parallel and coincident at the goal (the check below)
SEAT_PAIRS = [(2, "MC_E01_case", "MC_E02_plinth"), (3, "MC_E02_crank", "MC_E03_saddles"),
              (4, "MC_E02_upper", "MC_E04_lower")]
# each insertion: (the step, the part, its way in — the reference direction it comes FROM, how far) — swept against the parts before it
INSERTIONS = [(2, "E02_lower_case", (0, 1, 0), 0.8), (3, "E03_crankshaft", (0, 1, 0), 0.8),
              (4, "E04_upper_case", (0, 1, 0), 0.8)]

STEPS = [(1, build_plinth), (2, build_lower_case), (3, build_crankshaft), (4, build_upper_case)]
for n, fn in STEPS:
    if n <= STEP:
        fn()

# proxies and collision hidden in the viewport (Alt+H or the outliner's eye shows them)
bpy.context.view_layer.update()
for o in bpy.data.objects:
    if o.get("role") in ("ucx", "ufm"):
        o.hide_set(True)

# ---------------------------------------------------------------- the preview (not exported): floor, light, camera as Appendix B
def ref_to_blender(p):
    return Vector((p[0], -p[2], p[1]))


floor_me = bpy.data.meshes.new("PreviewFloor")
s = 12
floor_me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
floor_me.materials.append(material("PreviewFloor", srgb("ECEAE6"), roughness=1))
PREVIEW.objects.link(bpy.data.objects.new("PreviewFloor", floor_me))

sun_data = bpy.data.lights.new("PreviewSun", "SUN")
sun_data.energy, sun_data.angle, sun_data.color = 3.0, math.radians(3), srgb("FFF4E8")
sun = bpy.data.objects.new("PreviewSun", sun_data)
sun.rotation_euler = (-ref_to_blender((-3, 8, 4.5))).to_track_quat("-Z", "Y").to_euler()
PREVIEW.objects.link(sun)
world = bpy.data.worlds.new("PreviewWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (1, 1, 1, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
scene.world = world

target = Vector((0.05, 0.95, 0))
direction = Vector((-0.95, 0.62, 1)).normalized()
cam_data = bpy.data.cameras.new("PreviewCamera")
cam_data.type, cam_data.ortho_scale, cam_data.clip_end = "ORTHO", 2 * 2.7, 80
cam = bpy.data.objects.new("PreviewCamera", cam_data)
cam.location = ref_to_blender(target + direction * 16)
cam.rotation_euler = (ref_to_blender(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
PREVIEW.objects.link(cam)
scene.camera = cam

scene.render.engine = "BLENDER_EEVEE"
scene.eevee.taa_render_samples = 32
scene.eevee.use_ssr = True
scene.eevee.use_soft_shadows = True
scene.render.resolution_x = scene.render.resolution_y = 900
scene.view_settings.view_transform = "Filmic"
scene.view_settings.look = "Medium High Contrast"

# ---------------------------------------------------------------- save, render, report
os.makedirs(PREVIEW_DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
scene.render.filepath = os.path.join(PREVIEW_DIR, f"step_{STEP:02d}.png")
bpy.ops.render.render(write_still=True)

# the CLOSE-UP (render only, after the save): this step's parts alone, the glass less clear, framed on their box
focus = [(p, c) for p, c in PARTS if p["step"] == STEP]
if focus:
    for p, c in PARTS:
        for o in c.objects:
            o.hide_render = o.hide_render or (p["step"] != STEP)
    MAT["glass"].node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.6
    pts = [YUP_ROOT.matrix_world.inverted() @ o.matrix_world @ Vector(k) for p, c in focus for o in c.objects
           if o.type == "MESH" and o.get("role") == "render" for k in o.bound_box]
    centre = sum(pts, Vector()) / len(pts)
    extent = max((q - centre).length for q in pts)
    cam.location = ref_to_blender(centre + direction * 16)
    cam.rotation_euler = (ref_to_blender(centre) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam_data.ortho_scale = 2.2 * extent
    scene.render.filepath = os.path.join(PREVIEW_DIR, f"step_{STEP:02d}_part.png")
    bpy.ops.render.render(write_still=True)

print("\n================ BUILT up to step", STEP, "→", BLEND)
for part, coll in PARTS:
    meshes = [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render"]
    corners = [part.matrix_basis @ o.matrix_basis @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(c[i] for c in corners) for i in range(3)]
    hi = [max(c[i] for c in corners) for i in range(3)]
    size = [hi[i] - lo[i] for i in range(3)]
    count = lambda r: sum(1 for o in coll.objects if o.get("role") == r)
    print(f"{part.name:16s} x {lo[0]:+.3f}..{hi[0]:+.3f}  y {lo[1]:+.3f}..{hi[1]:+.3f}  z {lo[2]:+.3f}..{hi[2]:+.3f}"
          f"  = {size[0]:.3f} × {size[1]:.3f} × {size[2]:.3f} units"
          f" ({size[0] * UNIT_M:.3f} × {size[1] * UNIT_M:.3f} × {size[2] * UNIT_M:.3f} m)"
          f"  render {len(meshes)} · UCX {count('ucx')} · UFM {count('ufm')} · seats {count('seat')}")
def ref_pose(o):
    m = YUP_ROOT.matrix_world.inverted() @ o.matrix_world
    return m.to_translation(), (m.to_3x3() @ Vector((0, 0, 1))).normalized()


for step, host, guest in SEAT_PAIRS:
    if step <= STEP:
        (pa, na), (pb, nb) = ref_pose(bpy.data.objects[host]), ref_pose(bpy.data.objects[guest])
        ok = (pa - pb).length < 1e-6 and na.dot(nb) < -1 + 1e-9
        print(f"seat {host} ↔ {guest}: gap {(pa - pb).length:.6f}, normals' dot {na.dot(nb):+.6f}  {'✅' if ok else '⛔'}")
from mathutils.bvhtree import BVHTree


def ucx_tree(objs, shift=Vector()):
    verts, polys, owner = [], [], []
    to_ref = YUP_ROOT.matrix_world.inverted()
    for o in objs:
        m = to_ref @ o.matrix_world
        base = len(verts)
        verts += [m @ v.co + shift for v in o.data.vertices]
        for p in o.data.polygons:
            polys.append([base + i for i in p.vertices])
            owner.append(o.name)
    return BVHTree.FromPolygons(verts, polys), owner


def ucx_of(part_name):
    return [o for o in bpy.data.objects[part_name].children if o.get("role") == "ucx"]


# THE WAY IN: the part's collision pieces moved back along its way in, from 2 mm off its goal to `dist`, against every earlier part's
for step, name, way, dist in INSERTIONS:
    if step > STEP:
        continue
    earlier = [o for p, _ in PARTS if p["step"] < step for o in ucx_of(p.name)]
    host, host_owner = ucx_tree(earlier)
    hits, d = [], 0.002 / UNIT_M
    while d <= dist:
        moving, moving_owner = ucx_tree(ucx_of(name), Vector(way) * d)
        pairs = moving.overlap(host)
        if pairs:
            hits.append((d, sorted({(moving_owner[a], host_owner[b]) for a, b in pairs})))
        d += 0.01
    pushed, pushed_owner = ucx_tree(ucx_of(name), Vector(way) * -0.05)     # the control: 0.05 PAST the goal, into the host
    control = "the control (0.05 past the goal) BLOCKED ✅" if pushed.overlap(host) else "⛔ the control (0.05 past the goal) NOT blocked: the check is blind"
    print(f"way in {name}: {control}")
    if hits:
        print(f"way in {name}: ⛔ BLOCKED at {len(hits)} of the positions — first at {hits[0][0]:.3f} units off its goal: {hits[0][1][:4]}")
    else:
        print(f"way in {name}: ✅ clear along {tuple(way)} from 2 mm to {dist} units off its goal")
print("preview →", scene.render.filepath)
