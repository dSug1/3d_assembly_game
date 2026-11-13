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
PLINTH_H = 0.26 * 1.2 * 1.2 * 1.1   # 0.412: the plinth's height (the owner, 2026-11-13: ×1.2 twice, then the whole plinth ×1.1 — *"sturdier"*)
CASE_H = 0.55 * 1.2 * 1.15      # 0.759: the lower case's height (the owner, 2026-11-13: ×1.2, then ×1.15 — 0.55 first) — the crank axis on its top
YC = PLINTH_H + CASE_H          # 1.133 (1.034, 0.862, 0.81 before): the crank axis's height — ⭐ every height above follows it
RC = 0.15                       # the crank's throw (0.2 before — the owner, 2026-11-13: *"the piston shall remain in the cylinder"*)
PISTON_R, PISTON_H, PISTON_Y = 0.28, 0.32, 0.07      # body r, height, centre above the wrist pin (Appendix B, §2.9's radius)
# the rod, STURDIER twice from the owner's file (2026-11-13: *"I made the rod sturdier and the rod connection sturdier again"*):
BIG_R, BIG_IN, BIG_W = 0.14, 0.06, 0.09              # the big end: outer r (0.12, 0.085 before), inner r (the pin), width along x (0.08 before)
SMALL_R, SMALL_W = 0.06, 0.09                        # the small end (the wrist), width (0.08 before)
SHANK = (0.0675, 0.10)                               # the rod's shank: x (0.06 before), z
ROD_X = 0.1                                          # each rod's offset along x from its throw's centre (bank A −, bank B +: two rods a pin)
THROW_GAP = 0.01                                     # between a big end and its throw's arm
ALPHA = math.pi / 3             # each bank 60° from the vertical (the V at 120°)
PITCH, N_CYL = 0.8, 3          # the cylinders' spacing along the crank (0.7 before — the owner, 2026-11-13: *"spread the pistons 1 and 3 further apart"*)
PLINTH_W, PLINTH_D, PLINTH_R, PLINTH_BEVEL = 3.35 * 1.1, 3.5 * 1.1, 0.3 * 1.1, 0.015   # 3.685 × 3.85, r 0.33 (the owner's ×1.1); the bevel kept

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


def wood_v_image(n=1024):
    """The preview HTML's `woodV` canvas (glass-v6-engine-preview-120deg.html, makeMats): the same seeded draws (seed 11, after the 70 lines
    of `wood`), base #C98A4E, 90 wavy vertical grain lines rgba(125, 70, 30, a) — drawn at n px for the HTML's 256 (one tile = one unit)."""
    import numpy as np
    state = [11]
    def r():
        state[0] = (state[0] * 16807) % 2147483647
        return (state[0] - 1) / 2147483646
    for _ in range(70 * 5):                       # the `wood` canvas draws first, from the same generator
        r()
    k = n / 256
    img = np.empty((n, n, 3))
    img[:] = [0xC9 / 255, 0x8A / 255, 0x4E / 255]
    stroke = np.array([125, 70, 30]) / 255
    cols = (np.arange(n) + 0.5) / k
    rows = (np.arange(n) + 0.5) / k
    for _ in range(90):
        x, a, w, f, ph = r() * 256, 0.06 + r() * 0.2, 0.6 + r() * 3, 0.5 + r() * 2, r() * 2 * math.pi
        xx = x + np.sin(rows / 256 * 2 * math.pi * f + ph) * 4
        cover = np.clip((w / 2 - np.abs(cols[None, :] - xx[:, None])) * k + 0.5, 0, 1) * a
        img = img * (1 - cover[..., None]) + stroke * cover[..., None]
    im = bpy.data.images.new("WoodV", n, n)
    rgba = np.concatenate([img[::-1], np.ones((n, n, 1))], axis=2)   # the canvas's rows top-down, Blender's bottom-up
    im.pixels = rgba.ravel().tolist()
    os.makedirs(os.path.join(OUT_DIR, "textures"), exist_ok=True)
    im.filepath_raw = os.path.join(OUT_DIR, "textures", "wood_v.png")
    im.file_format = "PNG"
    im.save()
    im.pack()
    return im


def textured(m, image):
    nodes, links = m.node_tree.nodes, m.node_tree.links
    t = nodes.new("ShaderNodeTexImage")
    t.image = image
    links.new(t.outputs["Color"], nodes["Principled BSDF"].inputs["Base Color"])
    return m


MAT = {
    "glass": material("Glass", (1, 1, 1), roughness=0.03, alpha=0.26),
    "chrome": material("Chrome", srgb("C9CDD2"), metallic=1, roughness=0.14),
    "chromeH": material("ChromeHammered", srgb("C9CDD2"), metallic=1, roughness=0.2),
    "dark": material("Dark", srgb("55595F"), metallic=0.5, roughness=0.45),
    "woodV": textured(material("WoodV", srgb("C98A4E"), roughness=0.5), wood_v_image()),
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


def cyl_between(p0, p1, r, seg=24, bm=None, circumscribed=False, r_end=None):
    """A closed cylinder of radius r from p0 to p1 (reference coordinates) — a frustum to r_end at p1; `circumscribed`: the polygon holds
    the circle (collision)."""
    bm = bm or bmesh.new()
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    u = ax.orthogonal().normalized()
    v = ax.cross(u)
    rr = r / math.cos(math.pi / seg) if circumscribed else r
    ring = lambda p, q: [bm.verts.new(p + q * (math.cos(2 * math.pi * i / seg) * u + math.sin(2 * math.pi * i / seg) * v)) for i in range(seg)]
    a, b = ring(p0, rr), ring(p1, rr if r_end is None else r_end * rr / r)
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


def tidy(bm):
    """No redundant geometry (the owner, 2026-11-13: *"be careful … you have redundant edges"*): coincident vertices welded, the extra
    edges splitting a FLAT face dissolved (a boolean's slivers and fans), zero-area faces removed."""
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.05), verts=bm.verts, edges=bm.edges, delimit=set())
    bmesh.ops.dissolve_degenerate(bm, dist=1e-7, edges=bm.edges)
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
    tidy(out)
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


def mesh_object(name, bm, mat, part, coll, role="render", origin=None):
    """A mesh child of `part`; `bm` is in REFERENCE coordinates and is brought into the part's frame — or, with `origin` (a reference
    matrix), into that frame, the object then standing there (a hinged piece's pivot)."""
    to_local = (origin or part.matrix_basis).inverted()
    bmesh.ops.transform(bm, matrix=to_local, verts=bm.verts)
    if role == "ufm":
        tidy(bm)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    o.parent = part
    if origin is not None:
        o.matrix_basis = part.matrix_basis.inverted() @ origin
    o["role"] = role
    if role != "render":
        o.display_type = "WIRE" if role == "ucx" else "SOLID"
        o.hide_render = True
        o.show_wire = True
    return o


def box_uv(o):
    """UVs in reference units, one texture tile per unit: a face along y gets (x, z), along x gets (z, y), along z gets (x, y)."""
    me = o.data
    uv = me.uv_layers.new(name="UVMap")
    to_ref = o.parent.matrix_basis @ o.matrix_basis if o.parent else o.matrix_basis
    for poly in me.polygons:
        n = to_ref.to_3x3() @ poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            p = to_ref @ me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (p.x, p.z) if ax == 1 else ((p.z, p.y) if ax == 0 else (p.x, p.y))


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
    top_edges = [e for e in bm.edges if all(abs(v.co.y - PLINTH_H) < 1e-6 for v in e.verts)]   # ⛔ 1e-9 caught NO edge (float32): no bevel, silently
    assert top_edges, "the plinth's top edges were not found: no bevel"
    bmesh.ops.bevel(bm, geom=top_edges, offset=PLINTH_BEVEL, segments=3, affect="EDGES", profile=0.5)
    box_uv(mesh_object("E01_plinth_mesh", bm, MAT["woodV"], part, coll))
    mesh_object("UCX_E01_00", prism_y(outline, 0.0, PLINTH_H), MAT["ucx"], part, coll, "ucx")
    inset = rounded_rect(PLINTH_W - 2 * PLINTH_BEVEL, PLINTH_D - 2 * PLINTH_BEVEL, PLINTH_R - PLINTH_BEVEL)
    mesh_object("UFM_E01_top", flat_face(inset, PLINTH_H), MAT["ufm"], part, coll, "ufm")
    seat_marker("MC_E01_case", part, coll, (0, PLINTH_H, 0), (0, 1, 0), (1, 0, 0))


# ================================================================ STEP 2 — E02 the lower case (a hollow glass tub, four saddles)
# ⭐ the owner's file (2026-11-13, world0_scene_2_engine_owner.blend): the cases LONGER and a little deeper, the upper case LOWER — and the banks
# then follow the cases' edges (*"modify the bank outer dimensions so that the edges match with the edges of the upper and lower cases"*)
CASE_X, WALL = 1.281, 0.05                       # x ±1.281 (±1.225 before: LEN / 2), walls 0.05
CASE_Z = 0.787                                   # z ±0.787 (±0.78, ±0.625 before)
CASE_Y0, SPLIT = PLINTH_H, YC                    # 0.312 .. 0.862 (the split at the crank axis)
BULKHEAD_X, SADDLE_R = PITCH / 2, 0.065            # the two inner bulkheads mid-way between the throws (±0.35 before, now ±0.4)
GHOST_CRANK = (1.10, 0.20)                       # the crank's resting proxy / ghost floor: x ±1.10, z ±0.20


def build_lower_case():
    part, coll = new_part("E02", "lower_case", 2, (0, CASE_Y0, 0), symmetry="yawHalfTurn")
    xi, zi, yf = CASE_X - WALL, CASE_Z - WALL, CASE_Y0 + WALL
    # ONE solid (separate touching boxes left their touching faces visible inside the glass): the outer box minus its three compartments
    # (between the end walls and the two bulkheads) and the saddles' cylinder along the crank axis
    hw = WALL / 2
    rooms = [(-xi, -BULKHEAD_X - hw), (-BULKHEAD_X + hw, BULKHEAD_X - hw), (BULKHEAD_X + hw, xi)]
    cutters = [box(a, b, yf, SPLIT + 0.1, -zi, zi) for a, b in rooms]
    cutters.append(cyl_between((-CASE_X - 0.1, SPLIT, 0), (CASE_X + 0.1, SPLIT, 0), SADDLE_R, 24))
    mesh_object("E02_lower_case_mesh", boolean_cut(box(-CASE_X, CASE_X, CASE_Y0, SPLIT, -CASE_Z, CASE_Z), cutters), MAT["glass"], part, coll)

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
    coll.objects["UFM_E02_GHOST_crank"]["for_part"] = "E03"      # ⭐ a ghost floor serves ONE part: the game reads it only while that part is held

    seat_marker("MC_E02_plinth", part, coll, (0, CASE_Y0, 0), (0, -1, 0), (1, 0, 0))
    seat_marker("MC_E02_crank", part, coll, (0, CRANK_REST_Y, 0), (0, 1, 0), (1, 0, 0))
    seat_marker("MC_E02_upper", part, coll, (0, SPLIT, 0), (0, 1, 0), (1, 0, 0))


# ================================================================ STEP 3 — E03 the crankshaft (at the goal's crank angle θ = 0)
SR = 0.06                                                     # the bar's radius
# ⭐ the rods' connection WITHIN the throw (the owner: *"modify the crankshaft so the rod connection stays within the crankshaft offset"*): the arms'
# inner faces clear both big ends on the pin by THROW_GAP
HW = ROD_X + BIG_W / 2 + THROW_GAP + SR                       # 0.215 (0.2 before): a throw's half width, to its arms' centres
PX = [(i - (N_CYL - 1) / 2) * PITCH for i in range(N_CYL)]    # the throws at x −0.8, 0, +0.8
OFF = [i * 2 * math.pi / N_CYL for i in range(N_CYL)]         # the pins at 0°, 120°, 240°
NOSE_X = -CASE_X - 0.15                                      # −1.431: the bar's front end (the pulley's shoulder)
FLYWHEEL = (0.277, 0.12, CASE_X + 0.094)                      # r, thickness, its inner face's x — the owner's, sturdier three times (0.277 × 0.094, 0.234 × 0.082,
                                                              # a 0.12 × 0.06 cap before)
# ⭐ the crank's RESTING proxy (and the lower case's ghost floor) at the crank's LOWEST point at the goal — its hull's extreme along its way in,
# what the orbit's lift measures: since the flywheel, the flywheel's bottom (the lowest pin's before)
CRANK_REST_Y = min(YC - FLYWHEEL[0], min(YC + RC * math.cos(o) - SR for o in [i * 2 * math.pi / N_CYL for i in range(N_CYL)]))
BAR_END_X = FLYWHEEL[2] + 0.01                                # the bar ends inside the flywheel


def bank_frame(side):
    """A bank's frame (side −1 = bank A, +1 = bank B): at the crank axis, turned side × 60° about x."""
    return Matrix.Translation((0, YC, 0)) @ Matrix.Rotation(side * ALPHA, 4, "X")


CYLS = [(side, i, PX[i] + side * ROD_X, f"{'A' if side < 0 else 'B'}{i + 1}") for side in (-1, 1) for i in range(N_CYL)]  # (side, pin, x, name)


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
    r, ln, x0f = FLYWHEEL
    xc = x0f + ln / 2
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


def kinematics(side, i, theta=0.0):
    """Appendix B's update() for one cylinder at the crank angle θ: the pin in the bank (ly, lz), the piston's travel s, the rod's angle."""
    a = theta + OFF[i]
    cy, cz = RC * math.cos(a), RC * math.sin(a)
    phi = side * ALPHA
    ly = cy * math.cos(phi) + cz * math.sin(phi)
    lz = -cy * math.sin(phi) + cz * math.cos(phi)
    s = ly + math.sqrt(ROD_L ** 2 - lz ** 2)
    return ly, lz, s, math.atan2(-lz, s - ly)


def rod_frame(side, i, x, theta=0.0):
    """The rod's frame (reference coordinates): its origin the big end's centre (the pin), its local y toward the small end."""
    ly, lz, s, r = kinematics(side, i, theta)
    return bank_frame(side) @ Matrix.Translation((x, ly, lz)) @ Matrix.Rotation(r, 4, "X")


def rod_outline_points(side, i, x, seg=16, theta=0.0):
    """The rod's solid in points (reference coordinates): the big end's half ring (open toward the crank), the small end — their hull holds
    the shank."""
    F, pts = rod_frame(side, i, x, theta), []
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


def piston_body_points(side, i, x, seg=32, theta=0.0):
    """The piston's body (a cylinder r 0.28 about the bore's axis) in points, reference coordinates."""
    ly, lz, s, r = kinematics(side, i, theta)
    M = bank_frame(side)
    return [M @ Vector((x + PISTON_R * math.cos(2 * math.pi * k / seg), y, PISTON_R * math.sin(2 * math.pi * k / seg)))
            for k in range(seg) for y in (s + PISTON_Y - PISTON_H / 2, s + PISTON_Y + PISTON_H / 2)]


def body_sweep_points(side, i, x, steps=90):
    up = bank_frame(side).to_3x3() @ Vector((0, 1, 0))
    base = piston_body_points(side, i, x)
    return [p + up * (WAY_IN_LEN * k / steps) for k in range(steps + 1) for p in base]


def rod_sweep_points(side, i, x, steps=90):
    """The rod's way in: its points moved back along the bank's axis from its goal to WAY_IN_LEN."""
    up = bank_frame(side).to_3x3() @ Vector((0, 1, 0))
    base = rod_outline_points(side, i, x)
    return [p + up * (WAY_IN_LEN * k / steps) for k in range(steps + 1) for p in base]


# ================================================================ STEP 4 — E04 the upper case (a hollow glass trapezoid, cut where the rods pass)
FOOT = CASE_Z * math.sin(ALPHA) # a bank's foot plane, y′ 0.675 (0.45 before): the upper case's slope, its bottom FLUSH with the lower case
# ⭐ THE PISTON STAYS IN ITS CYLINDER over the whole turn (the owner, 2026-11-13: *"when the crank rotates, the piston shall remain in the
# cylinder … adapt the length of the rods and the depth of the crank axis offset"*): at the bottom dead centre the wrist pin is at ROD_L − RC and the
# body's bottom (its skirt, PISTON_H / 2 − PISTON_Y below the pin) must stay CYL_MARGIN above the bank's foot — so the rod's length follows
SKIRT, CYL_MARGIN = 0.32 / 2 - 0.07, 0.01
ROD_L = FOOT + SKIRT + CYL_MARGIN + RC          # 0.93 (0.75 before)
DECK = ROD_L + RC + 0.27                        # 1.35 (1.22 before): the crown 0.04 under it at the top dead centre (Appendix B's relation)
VALVE_DIP = 0.018 + 0.015                       # a valve's head reaches this far below the deck (its seat)
if os.environ.get("ENGINE_CONTROL_OLD_STROKE"):    # the control (never in a normal run): the old stroke must read OUT OF ITS CYLINDER
    RC, ROD_L = 0.2, 0.75
    DECK = ROD_L + RC + 0.27
BORE_R = 0.30
BORE_HOLE = (FOOT - 0.09, FOOT + 0.15)   # a bore's hole through the slope, y′ (the slope's glass is FOOT − 0.05 … FOOT)


def slope_z(y, offset):
    """|z| of the plane y′ = offset of bank B (the mirror for A) at the height y — the upper case's slopes."""
    return (offset - math.cos(ALPHA) * (y - YC)) / math.sin(ALPHA)


# ⭐ the bank SYMMETRIC about its bores' axis (the owner, 2026-11-13: *"the cylinder hole was not centered on the bank top face. I therefore moved the
# left face of the bank higher up, also the top of the upper case to match"*): ±0.393 — its outer bottom edge ON the lower case's top outer edge,
# its inner bottom edge ON the upper case's top edge, which rises to meet it
BANK_OUT = FOOT * math.cos(ALPHA) / math.sin(ALPHA)                # 0.393
BANK_IN = BANK_OUT                                                 # 0.393 (0.327 before: the bore off centre)
UC_TOP = YC + FOOT * math.cos(ALPHA) + BANK_IN * math.sin(ALPHA)   # the crank axis + 0.681 (+ 0.624 before)


def bank_z(side):
    """A bank's z′ range: its outer side is side × z′ (bank A's outer is −z′, bank B's +z′)."""
    return (-BANK_IN, BANK_OUT) if side > 0 else (-BANK_OUT, BANK_IN)


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
    zb, zt = slope_z(SPLIT, FOOT), slope_z(UC_TOP, FOOT)                         # the lower case's edge, the top's (the slopes kept at 60°)
    yb, yt = SPLIT - 0.01, UC_TOP - WALL
    zbi, zti = slope_z(yb, FOOT - WALL), slope_z(yt, FOOT - WALL)
    outer = prism_x([(-zb, SPLIT), (zb, SPLIT), (zt, UC_TOP), (-zt, UC_TOP)], -X, X)
    inner = prism_x([(-zbi, yb), (zbi, yb), (zti, yt), (-zti, yt)], -xi, xi)
    cutters = [inner, cyl_between((-X - 0.1, SPLIT, 0), (X + 0.1, SPLIT, 0), SADDLE_R, 24)]
    cutters += [bore_cutter(side, x) for side, i, x, n in CYLS]
    cutters += [hull(rod_sweep_points(side, i, x, steps=1)) for side, i, x, n in CYLS]   # (b): only where the rods really pass
    cutters += [hull(body_sweep_points(side, i, x, steps=1)) for side, i, x, n in CYLS]  # … and the pistons' bodies, below the feet now
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
        for pts in (bore_points(side, x), rod_sweep_points(side, i, x), body_sweep_points(side, i, x)):
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


# ================================================================ STEP 5 — E05, E06 the banks (kind `bank`), cut at the case's split
# ⭐ the bank runs UP PAST THE DECK and the head's glass block is gone (the owner, 2026-11-13: *"the block E14_head_B_mesh.001 should not exist
# and the bank should extend up to the position of this block … The rings of the cylinder should be relocated up to this position as well, as for the
# rings of the valves"*): the bores open at the bank's new top, their rings there, the valves' grommets resting on it
HEAD_TOP = 0.068                # the bank's top above the deck (the owner's file; the head's glass ran to 0.16)
BANK_TOP = DECK + HEAD_TOP      # 1.418
RING = (0.012,)                 # the chrome ring's tube radius at each bore's top
GHOST_HALF = 0.20               # a bore's ghost floor (and its piston's resting proxy): a 0.40 square on the bore's axis


def keep_above_split(poly):
    """Sutherland–Hodgman: the part of a polygon (reference points) with y ≥ the case's split."""
    out = []
    for k, p in enumerate(poly):
        q = poly[(k + 1) % len(poly)]
        pin, qin = p.y >= SPLIT - 1e-9, q.y >= SPLIT - 1e-9
        if pin:
            out.append(p)
        if pin != qin:
            t = (SPLIT - p.y) / (q.y - p.y)
            out.append(p + (q - p) * t)
    return out


def clipped_box_hull(side, x0, x1, y0, y1, z0, z1):
    """A box in the bank's frame, cut at the case's split — a convex collision piece."""
    M = bank_frame(side)
    corners = [M @ Vector((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    pts = [c for c in corners if c.y >= SPLIT - 1e-9]
    for a in corners:
        for b in corners:
            if sum(abs(a[k] - b[k]) > 1e-9 for k in range(3)) and (a.y - SPLIT) * (b.y - SPLIT) < 0:
                pts.append(a + (b - a) * ((SPLIT - a.y) / (b.y - a.y)))
    return hull(pts)


def piston_rest_y(side, i, x):
    """The piston + rod's lowest point along −y′ at its goal (bank frame) — its resting proxy and its bore's ghost floor."""
    inv = bank_frame(side).inverted()
    return min((inv @ p).y for p in rod_outline_points(side, i, x))


def torus(centre_frame, R, r, seg=40, rseg=8):
    bm = bmesh.new()
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        rings.append([bm.verts.new(centre_frame @ Vector(((R + r * math.cos(b)) * math.cos(a), r * math.sin(b), (R + r * math.cos(b)) * math.sin(a))))
                      for b in [2 * math.pi * j / rseg for j in range(rseg)]])
    for i in range(seg):
        for j in range(rseg):
            a, b = rings[i], rings[(i + 1) % seg]
            bm.faces.new((a[j], b[j], b[(j + 1) % rseg], a[(j + 1) % rseg]))
    bm.normal_update()
    return bm


def build_bank(side):
    pid, tag = ("E05", "A") if side < 0 else ("E06", "B")
    M = bank_frame(side)
    part, coll = new_part(pid, f"bank_{tag}", 5, (0, 0, 0), frame=M @ Matrix.Translation((0, FOOT, 0)), kind="bank")
    X = CASE_X
    zlo, zhi = bank_z(side)
    xs = bore_xs(side)

    body = transformed(box(-X, X, FOOT, BANK_TOP, zlo, zhi), M)
    below = box(-X - 1, X + 1, -2, SPLIT, -3, 3)
    bores = [transformed(cyl_between((x, FOOT - 0.2, 0), (x, BANK_TOP + 0.2, 0), BORE_R, 48), M) for x in xs]
    mesh_object(f"{pid}_bank_{tag}_mesh", boolean_cut(body, [below] + bores), MAT["glass"], part, coll)
    rings = bmesh.new()
    for x in xs:
        tb = torus(M @ Matrix.Translation((x, BANK_TOP, 0)), BORE_R, RING[0])
        me = bpy.data.meshes.new("_t"); tb.to_mesh(me); tb.free(); rings.from_mesh(me); bpy.data.meshes.remove(me)
    mesh_object(f"{pid}_bank_{tag}_rings", rings, MAT["chrome"], part, coll)

    # collision: the two long walls beside the bores, the ends and the partitions between them (every bore SQUARED), each cut at the split
    ucx = [clipped_box_hull(side, -X, X, FOOT, BANK_TOP, BORE_R, zhi), clipped_box_hull(side, -X, X, FOOT, BANK_TOP, zlo, -BORE_R)]
    edges = sorted([-X, X] + [x - BORE_R for x in xs] + [x + BORE_R for x in xs])
    for a, b in zip(edges[0::2], edges[1::2]):
        ucx.append(clipped_box_hull(side, a, b, FOOT, BANK_TOP, -BORE_R, BORE_R))
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_{pid}_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # face proxy: the DECK with its three SQUARE openings (strips), the outer and inner faces, the ends, the foot — each cut at the split
    bm = bmesh.new()
    def face(pts_local):
        poly = keep_above_split([M @ Vector(p) for p in pts_local])
        if len(poly) >= 3:
            bm.faces.new([bm.verts.new(p) for p in poly])
    for a, b in zip(edges[0::2], edges[1::2]):
        face([(a, BANK_TOP, zlo), (a, BANK_TOP, zhi), (b, BANK_TOP, zhi), (b, BANK_TOP, zlo)])
    for x in xs:
        for z0, z1 in ((BORE_R, zhi), (zlo, -BORE_R)):
            face([(x - BORE_R, BANK_TOP, z0), (x - BORE_R, BANK_TOP, z1), (x + BORE_R, BANK_TOP, z1), (x + BORE_R, BANK_TOP, z0)])
    for z in (zhi, zlo):
        face([(-X, FOOT, z), (X, FOOT, z), (X, BANK_TOP, z), (-X, BANK_TOP, z)])
    for x in (-X, X):
        face([(x, FOOT, zlo), (x, FOOT, zhi), (x, BANK_TOP, zhi), (x, BANK_TOP, zlo)])
    for a, b in zip(edges[0::2], edges[1::2]):
        face([(a, FOOT, zlo), (b, FOOT, zlo), (b, FOOT, zhi), (a, FOOT, zhi)])
    for x in xs:
        for z0, z1 in ((BORE_R, zhi), (zlo, -BORE_R)):
            face([(x - BORE_R, FOOT, z0), (x + BORE_R, FOOT, z0), (x + BORE_R, FOOT, z1), (x - BORE_R, FOOT, z1)])
    bm.normal_update()
    mesh_object(f"UFM_{pid}_outer", bm, MAT["ufm"], part, coll, "ufm")

    # the GHOST floors: one per bore, at its piston's resting proxy at the goal
    for side_, i, x, name in CYLS:
        if side_ != side:
            continue
        yr = piston_rest_y(side, i, x)
        g = M @ Vector((x, yr, 0))
        o = mesh_object(f"UFM_{pid}_GHOST_{name}", quad(bmesh.new(), [M @ Vector((x - GHOST_HALF, yr, -GHOST_HALF)), M @ Vector((x - GHOST_HALF, yr, GHOST_HALF)),
                                                                       M @ Vector((x + GHOST_HALF, yr, GHOST_HALF)), M @ Vector((x + GHOST_HALF, yr, -GHOST_HALF))]),
                        MAT["ghost"], part, coll, "ufm")
        o["ghost"], o["for_part"] = True, PISTON_IDS[name]
        seat_marker(f"MC_{pid}_bore_{name}", part, coll, g, M.to_3x3() @ Vector((0, 1, 0)), (1, 0, 0))

    # the VALVE SET's ghost floor (step 7): at its valve heads' lowest point, under its centre (x 0 — inside the middle bore's mouth)
    yv, hid = valves_rest_y(side), ("E13" if side < 0 else "E14")
    q = VALVES_GHOST_HALF
    o = mesh_object(f"UFM_{pid}_GHOST_valves", quad(bmesh.new(), [M @ Vector((-q, yv, -q)), M @ Vector((-q, yv, q)), M @ Vector((q, yv, q)),
                                                                M @ Vector((q, yv, -q))]), MAT["ghost"], part, coll, "ufm")
    o["ghost"], o["for_part"] = True, hid
    seat_marker(f"MC_{pid}_valves", part, coll, M @ Vector((0, yv, 0)), M.to_3x3() @ Vector((0, 1, 0)), (1, 0, 0))

    up = M.to_3x3() @ Vector((0, 1, 0))
    seat_marker(f"MC_{pid}_upper", part, coll, M @ Vector((0, FOOT, 0)), -up, (1, 0, 0))
    seat_marker(f"MC_{pid}_head", part, coll, M @ Vector((0, BANK_TOP + RING[0], 0)), up, (1, 0, 0))   # the valve set's discs on the rings' tops


def build_banks():
    build_bank(-1)
    build_bank(1)


# ================================================================ STEP 6 — E07 – E12 the pistons + rods (each its own bore, D2), ONE HINGE each
PISTON_IDS = {name: f"E{7 + k:02d}" for k, (side, i, x, name) in enumerate(CYLS)}    # A1 A2 A3 → E07 E08 E09, B1 B2 B3 → E10 E11 E12
ROD_FIT = 0.07      # the rod's collision piece starts this far up from the big end's centre: clear of the pin's (0.065)


def crown_number(text, frame):
    """The cylinder's name in relief on the crown (D2: told apart), as a mesh in reference coordinates; `frame`: its centre, +y its normal."""
    cu = bpy.data.curves.new("_num", "FONT")
    cu.body, cu.size, cu.extrude, cu.align_x, cu.align_y = text, 0.2, 0.004, "CENTER", "CENTER"
    tmp = bpy.data.objects.new("_num", cu)
    scene.collection.objects.link(tmp)
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.curves.remove(cu)
    bpy.data.meshes.remove(me)
    # read UPRIGHT (the owner: *"rotate the annotations A1 to A3 so they are not upside down"*): the text's up is the world's up seen on the crown
    n = Vector((0, 1, 0))
    u = frame.to_3x3().inverted() @ Vector((0, 1, 0))
    u = (u - n * u.dot(n)).normalized()
    turn = Matrix((u.cross(n), u, n)).transposed().to_4x4()          # text X → right, text Y → up, text Z → the crown's normal
    ys = [v.co.y for v in bm.verts]
    tops = [v for v in bm.verts if v.co.y > max(ys) - 0.01]          # the letters' tops and bottoms, in the text's own frame
    bottoms = [v for v in bm.verts if v.co.y < min(ys) + 0.01]
    bmesh.ops.transform(bm, matrix=frame @ Matrix.Translation((0, 0.004, 0)) @ turn, verts=bm.verts)
    rise = sum(v.co.y for v in tops) / len(tops) - sum(v.co.y for v in bottoms) / len(bottoms)
    print(f"crown {text}: the letters' top {'ABOVE ✅' if rise > 0 else 'BELOW ⛔ (upside down)'} their bottom in the world ({rise:+.3f})")
    return bm


def merge_into(target, bm):
    me = bpy.data.meshes.new("_m")
    bm.to_mesh(me)
    bm.free()
    target.from_mesh(me)
    bpy.data.meshes.remove(me)


def build_piston(side, i, x, name):
    pid = PISTON_IDS[name]
    ly, lz, s, r = kinematics(side, i)
    M = bank_frame(side)
    part, coll = new_part(pid, f"piston_{name}", 6, (0, 0, 0), frame=M @ Matrix.Translation((x, s, 0)))
    up = M.to_3x3() @ Vector((0, 1, 0))

    # the PISTON: its body, its dark ring, its number on the crown
    y0, y1 = s + PISTON_Y - PISTON_H / 2, s + PISTON_Y + PISTON_H / 2
    mesh_object(f"{pid}_piston_mesh", cyl_between(M @ Vector((x, y0, 0)), M @ Vector((x, y1, 0)), PISTON_R, 48), MAT["chrome"], part, coll)
    mesh_object(f"{pid}_piston_ring", torus(M @ Matrix.Translation((x, s + 0.18, 0)), PISTON_R + 0.001, 0.007), MAT["dark"], part, coll)
    mesh_object(f"{pid}_piston_number", crown_number(name, M @ Matrix.Translation((x, y1, 0))), MAT["dark"], part, coll)

    # the ROD: its own object, its origin ON THE HINGE (the small end = the wrist pin), turning about x — LOCKED at the goal's angle in play
    F = rod_frame(side, i, x)
    hinge = F @ Matrix.Translation((0, ROD_L, 0))
    rod = cyl_between(F @ Vector((-SMALL_W / 2, ROD_L, 0)), F @ Vector((SMALL_W / 2, ROD_L, 0)), SMALL_R, 24)
    merge_into(rod, transformed(box(-SHANK[0] / 2, SHANK[0] / 2, 0.06, ROD_L, -SHANK[1] / 2, SHANK[1] / 2), F))
    big = bmesh.new()                                      # the big end: a half ring OPEN toward the crank (−y in the rod's frame)
    seg = 20
    ring_pts = [(BIG_R * math.cos(math.pi * k / seg), BIG_R * math.sin(math.pi * k / seg)) for k in range(seg + 1)] + \
               [(BIG_IN * math.cos(math.pi * (seg - k) / seg), BIG_IN * math.sin(math.pi * (seg - k) / seg)) for k in range(seg + 1)]
    a = [big.verts.new(F @ Vector((-BIG_W / 2, py, pz))) for pz, py in ring_pts]
    b = [big.verts.new(F @ Vector((BIG_W / 2, py, pz))) for pz, py in ring_pts]
    n = len(ring_pts)
    fs = [big.faces.new(a[::-1]), big.faces.new(b)] + [big.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k])) for k in range(n)]
    bmesh.ops.recalc_face_normals(big, faces=fs)
    merge_into(rod, big)
    rod_obj = mesh_object(f"{pid}_rod_mesh", rod, MAT["chrome"], part, coll, origin=hinge)
    h = empty(f"HINGE_{pid}_wrist", coll, parent=part, matrix=part.matrix_basis.inverted() @ hinge, display="SINGLE_ARROW", size=0.2)
    h["role"], h["axis"], h["locked_at_deg"] = "hinge", "local X (the crank's direction)", math.degrees(r)
    rod_obj["hinge"] = h.name

    # collision: the piston's body; the rod from ROD_FIT up (the big end's open half has none: it sits round the pin)
    mesh_object(f"UCX_{pid}_00", cyl_between(M @ Vector((x, y0, 0)), M @ Vector((x, y1, 0)), PISTON_R, 12, circumscribed=True),
                MAT["ucx"], part, coll, "ucx")
    zc = math.sqrt(BIG_R ** 2 - ROD_FIT ** 2)
    pts = [F @ Vector((dx, ROD_L + SMALL_R * math.sin(t), SMALL_R * math.cos(t))) for dx in (-SMALL_W / 2, SMALL_W / 2)
           for t in [2 * math.pi * k / 16 for k in range(16)]]
    pts += [F @ Vector((dx, ROD_FIT, dz)) for dx in (-BIG_W / 2, BIG_W / 2) for dz in (-zc, zc)]
    pts += [F @ Vector((dx, BIG_R * math.sin(t), BIG_R * math.cos(t))) for dx in (-BIG_W / 2, BIG_W / 2)
            for t in [math.pi * k / 16 for k in range(17)] if BIG_R * math.sin(t) >= ROD_FIT]
    mesh_object(f"UCX_{pid}_01", hull(pts), MAT["ucx"], part, coll, "ucx")

    # the RESTING proxy: square to the bore's axis, centred on it, at the part's lowest point along it — on its bore's ghost floor at the goal
    yr = piston_rest_y(side, i, x)
    g = GHOST_HALF
    mesh_object(f"UFM_{pid}_rest", quad(bmesh.new(), [M @ Vector((x - g, yr, -g)), M @ Vector((x + g, yr, -g)), M @ Vector((x + g, yr, g)),
                                                     M @ Vector((x - g, yr, g))]), MAT["ufm"], part, coll, "ufm")
    seat_marker(f"MC_{pid}_rest", part, coll, M @ Vector((x, yr, 0)), -up, (1, 0, 0))
    seat_marker(f"MC_{pid}_pin", part, coll, F @ Vector((0, 0, 0)), -up, (1, 0, 0))


def build_pistons():
    for side, i, x, name in CYLS:
        build_piston(side, i, x, name)


# ================================================================ STEP 7 — E13, E14 the heads (kind `head`), each with its six valves
VALVE_Z, VALVE_TILT = 0.1, 0.3                  # each cylinder's two valves ACROSS the bank at z′ ±0.1, tilted ±0.3 rad (a small V)
VALVE_HEAD = (0.08, 0.065, 0.03, -0.018)        # the valve's head: top r, bottom r, height, centre along its axis
VALVE_STEM = (0.018, -0.01)                     # stem: r, its bottom along the axis — it runs INTO its cap's centre
VALVE_CAP = (0.085, 0.045, 0.32)                # the hammered cap: r, height, centre along the axis (0.49 before — the owner's file: the stems shorter)
GROMMET = (0.035, 0.01)                         # where the stem leaves the bank's top: R, r — it RESTS on the top (below)
VALVES_GHOST_HALF = 0.1                         # the valve set's ghost floor: a 0.2 square inside the middle bore's mouth
# ⭐ a GLASS DISC per bore (the owner, 2026-11-13: *"A glass disc per bore"* — the bores open at the bank's top for the pistons, the valves need a
# seat): in the bore's mouth, its rim ON the chrome ring, the valves through it, the grommets on it — part of the valve set
DISC_R, DISC_T = BORE_R + 0.012, 0.02           # out to the ring's outer edge, 0.02 thick
DISC_TOP = HEAD_TOP + 0.012 + DISC_T            # the disc's top above the deck (on the ring's top, RING's tube 0.012)


def grommet_along():
    """How far along its valve's axis a grommet's centre is so that the grommet rests ON its disc (its lowest point on it)."""
    return (DISC_TOP + GROMMET[0] * math.sin(VALVE_TILT) + GROMMET[1] * math.cos(VALVE_TILT)) / math.cos(VALVE_TILT)


def valves_rest_y(side):
    """The valve set's lowest point along −y′ (bank frame): its valve heads' rims — its resting proxy and its ghost floor."""
    inv, rt, rb, hh, hc = bank_frame(side).inverted(), *VALVE_HEAD
    pts = [inv @ (valve_frame(side, x, vs) @ Vector((rb * math.cos(t), hc - hh / 2, rb * math.sin(t))))
           for s_, i, x, n in CYLS if s_ == side for vs in (-1, 1) for t in [2 * math.pi * k / 24 for k in range(24)]]
    return min(p.y for p in pts)


def valve_frame(side, x, vs):
    """A valve's frame (reference coordinates): on the deck at the bore's axis ± VALVE_Z, its +y along the valve (it lifts along −y)."""
    return bank_frame(side) @ Matrix.Translation((x, DECK, vs * VALVE_Z)) @ Matrix.Rotation(vs * VALVE_TILT, 4, "X")


def build_head(side):
    """The VALVE SET (E13, E14 — the 'head' kind kept): six valves, their caps and grommets, placed in one move along the bank's axis."""
    pid, tag = ("E13", "A") if side < 0 else ("E14", "B")
    M = bank_frame(side)
    part, coll = new_part(pid, f"head_{tag}", 7, (0, 0, 0), frame=M @ Matrix.Translation((0, BANK_TOP, 0)), kind="head")
    grommets, ucx = bmesh.new(), []
    rt, rb, hh, hc = VALVE_HEAD
    sr, s0 = VALVE_STEM
    cr, ch, cc = VALVE_CAP
    ga = grommet_along()
    for s_, i, x, name in CYLS:
        if s_ != side:
            continue
        for vs, which in ((-1, "1"), (1, "2")):
            V = valve_frame(side, x, vs)
            merge_into(grommets, torus(V @ Matrix.Translation((0, ga, 0)), GROMMET[0], GROMMET[1], seg=20, rseg=8))
            v = cyl_between(V @ Vector((0, hc - hh / 2, 0)), V @ Vector((0, hc + hh / 2, 0)), rb, 28, r_end=rt)
            merge_into(v, cyl_between(V @ Vector((0, s0, 0)), V @ Vector((0, cc, 0)), sr, 10))
            vo = mesh_object(f"{pid}_valve_{name}_{which}", v, MAT["chrome"], part, coll, origin=V)
            mesh_object(f"{pid}_valve_{name}_{which}_cap", cyl_between(V @ Vector((0, cc - ch / 2, 0)), V @ Vector((0, cc + ch / 2, 0)), cr, 32),
                        MAT["chromeH"], part, coll, origin=V)
            vo["axis"], vo["lift"] = "local −Y (it opens down its own axis)", 0.07
            # collision: one piece per valve above the bank (its stem from the grommet, its cap) — the gaps between the caps open for the exhaust
            pts = [V @ Vector((cr * math.cos(t), y, cr * math.sin(t))) for y in (cc - ch / 2, cc + ch / 2) for t in [2 * math.pi * k / 12 for k in range(12)]]
            pts += [V @ Vector((sr * math.cos(t), ga, sr * math.sin(t))) for t in [2 * math.pi * k / 8 for k in range(8)]]
            ucx.append(hull(pts))
    mesh_object(f"{pid}_head_{tag}_grommets", grommets, MAT["chrome"], part, coll)
    discs = bmesh.new()
    for s_, i, x, name in CYLS:
        if s_ == side:
            a, b = M @ Vector((x, DECK + DISC_TOP - DISC_T, 0)), M @ Vector((x, DECK + DISC_TOP, 0))
            merge_into(discs, cyl_between(a, b, DISC_R, 48))
            ucx.append(cyl_between(a, b, DISC_R, 12, circumscribed=True))    # its rim over the bank's glass: what the valve set rests on
    mesh_object(f"{pid}_head_{tag}_discs", discs, MAT["glass"], part, coll)
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_{pid}_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # its RESTING proxy at its lowest point (the valve heads' rims), square to the bank's axis, under its centre — on the bank's ghost floor
    yv, q = valves_rest_y(side), VALVES_GHOST_HALF
    mesh_object(f"UFM_{pid}_rest", quad(bmesh.new(), [M @ Vector((-q, yv, -q)), M @ Vector((q, yv, -q)), M @ Vector((q, yv, q)),
                                                     M @ Vector((-q, yv, q))]), MAT["ufm"], part, coll, "ufm")
    up = M.to_3x3() @ Vector((0, 1, 0))
    seat_marker(f"MC_{pid}_rest", part, coll, M @ Vector((0, yv, 0)), -up, (1, 0, 0))
    seat_marker(f"MC_{pid}_deck", part, coll, M @ Vector((0, BANK_TOP + RING[0], 0)), -up, (1, 0, 0))   # its discs on the rings' tops
    seat_marker(f"MC_{pid}_exhaust", part, coll, M @ Vector((0, DECK + DISC_TOP, side * 0.15)), up, (1, 0, 0))   # the exhaust's seat (step 8)


def build_heads():
    build_head(-1)
    build_head(1)


# each seat: (the step, the host's marker, the part's marker) — anti-parallel and coincident at the goal (the check below)
SEAT_PAIRS = [(2, "MC_E01_case", "MC_E02_plinth"), (3, "MC_E02_crank", "MC_E03_saddles"),
              (4, "MC_E02_upper", "MC_E04_lower"), (5, "MC_E04_bankA", "MC_E05_upper"), (5, "MC_E04_bankB", "MC_E06_upper")]
# each insertion: (the step, the part, its way in — the reference direction it comes FROM, how far) — swept against the parts before it
INSERTIONS = [(2, "E02_lower_case", (0, 1, 0), 0.8), (3, "E03_crankshaft", (0, 1, 0), 0.8),
              (4, "E04_upper_case", (0, 1, 0), 0.8),
              (5, "E05_bank_A", tuple(bank_frame(-1).to_3x3() @ Vector((0, 1, 0))), 0.8),
              (5, "E06_bank_B", tuple(bank_frame(1).to_3x3() @ Vector((0, 1, 0))), 0.8)]
for _side, _i, _x, _name in CYLS:     # each piston DOWN ITS BORE: on its bore's ghost floor, its big end onto its pin
    _pid, _bank = PISTON_IDS[_name], "E05" if _side < 0 else "E06"
    SEAT_PAIRS += [(6, f"MC_{_bank}_bore_{_name}", f"MC_{_pid}_rest"), (6, f"MC_E03_pin_{_name}", f"MC_{_pid}_pin")]
    INSERTIONS.append((6, f"{_pid}_piston_{_name}", tuple(bank_frame(_side).to_3x3() @ Vector((0, 1, 0))), WAY_IN_LEN))
for _side, _pid, _bank, _tag in ((-1, "E13", "E05", "A"), (1, "E14", "E06", "B")):     # each head along its bank's axis onto the deck
    SEAT_PAIRS += [(7, f"MC_{_bank}_head", f"MC_{_pid}_deck"), (7, f"MC_{_bank}_valves", f"MC_{_pid}_rest")]
    INSERTIONS.append((7, f"{_pid}_head_{_tag}", tuple(bank_frame(_side).to_3x3() @ Vector((0, 1, 0))), 0.8))

STEPS = [(1, build_plinth), (2, build_lower_case), (3, build_crankshaft), (4, build_upper_case), (5, build_banks), (6, build_pistons), (7, build_heads)]
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

target = Vector((0.05, YC + 0.14, 0))
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
    corners = [part.matrix_basis @ o.matrix_basis @ v.co for o in meshes for v in o.data.vertices]
    lo = [min(c[i] for c in corners) for i in range(3)]
    hi = [max(c[i] for c in corners) for i in range(3)]
    size = [hi[i] - lo[i] for i in range(3)]
    count = lambda r: sum(1 for o in coll.objects if o.get("role") == r)
    print(f"{part.name:16s} x {lo[0]:+.3f}..{hi[0]:+.3f}  y {lo[1]:+.3f}..{hi[1]:+.3f}  z {lo[2]:+.3f}..{hi[2]:+.3f}"
          f"  = {size[0]:.3f} × {size[1]:.3f} × {size[2]:.3f} units"
          f" ({size[0] * UNIT_M:.3f} × {size[1] * UNIT_M:.3f} × {size[2] * UNIT_M:.3f} m)"
          f"  render {len(meshes)} · UCX {count('ucx')} · UFM {count('ufm')} · seats {count('seat')}")
def redundancy(o):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    dup = len(bmesh.ops.find_doubles(bm, verts=bm.verts, dist=1e-5)["targetmap"])
    zero = sum(1 for f in bm.faces if f.calc_area() < 1e-9)
    loose = sum(1 for e in bm.edges if not e.link_faces)
    bm.free()
    return dup, zero, loose


bad = []
for part, coll in PARTS:
    for o in coll.objects:
        if o.type == "MESH" and (o.get("role") == "ufm" or (o.get("role") == "render" and o.active_material == MAT["glass"])):
            d, z, l = redundancy(o)
            if d or z or l:
                bad.append(f"{o.name} ({d} duplicate vertices, {z} zero-area faces, {l} loose edges)")
ghosts = [(o.name, o.get("for_part")) for o in bpy.data.objects if o.get("ghost")]
print("ghost floors, each for ONE part:", ", ".join(f"{n}→{f}" for n, f in ghosts),
      "✅" if all(f and bpy.data.objects.get(next((p.name for p, _ in PARTS if p["part_id"] == f), "")) for n, f in ghosts) else "⛔ a ghost names no built part")
print("redundant geometry (glass and proxies):", "✅ none" if not bad else "⛔ " + "; ".join(bad))


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
# ⭐ THE CRANK TURNED (the level end's motion, Appendix B's update()): every 6°, each piston's body against its cylinder's two ends, and the
# piston + rod against the cases' and banks' collision pieces
if STEP >= 6:
    ends, hits = [], []
    hosts = [o for p, _ in PARTS if p["part_id"] in ("E02", "E04", "E05", "E06") for o in ucx_of(p.name)]
    host_tree, host_owner = ucx_tree(hosts)
    for side, i, x, name in CYLS:
        lo, hi = 9.0, 9.0
        first = None
        for k in range(60):
            th = 2 * math.pi * k / 60
            ly, lz, s_, r_ = kinematics(side, i, th)
            lo = min(lo, s_ - SKIRT - FOOT)                                  # the body's bottom above the cylinder's end (≥ 0)
            hi = min(hi, DECK - VALVE_DIP - (s_ + PISTON_Y + PISTON_H / 2))   # the crown below the valves' heads (≥ 0)
            if first is None:
                for pts in (rod_outline_points(side, i, x, theta=th), piston_body_points(side, i, x, theta=th)):
                    bm = hull(pts)
                    vs = [v.co.copy() for v in bm.verts]
                    fs = [[v.index for v in f.verts] for f in bm.faces]
                    bm.free()
                    pairs = BVHTree.FromPolygons(vs, fs).overlap(host_tree)
                    if pairs:
                        first = (round(math.degrees(th)), sorted({host_owner[b] for a, b in pairs})[:3])
                        break
        ends.append((name, lo, hi))
        if first:
            hits.append((name, first))
        print(f"crank turned, {name}: the skirt ≥ {lo:+.3f} above the cylinder's end, the crown ≥ {hi:+.3f} under the valves  "
              f"{'✅' if lo >= -1e-9 and hi >= -1e-9 else '⛔ OUT OF ITS CYLINDER'}"
              f"   {'collision ⛔ at ' + str(first[0]) + '° with ' + ', '.join(first[1]) if first else 'no collision ✅'}")
if STEP >= 3:
    gap = (HW - SR) - (ROD_X + BIG_W / 2)
    print(f"the rods' big ends within their throws: {gap:+.3f} clear of each arm  {'✅' if gap > 0 else '⛔'}")
print("preview →", scene.render.filepath)
