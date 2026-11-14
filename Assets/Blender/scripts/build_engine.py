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
# ⭐ `--rev N`: a REVISION beside the file, never over it (the owner, 2026-11-14: *"creating a revision2 file (do not overwrite the file) … I shall
# authorize an export then only if I am satisfied"*) — `world0_scene_2_engine_revisionN.blend`, its previews in `previews/revisionN/`, the
# animation's golden file untouched, and NO export (step 10 refused)
REV = argv[argv.index("--rev") + 1] if "--rev" in argv else ""
if REV and STEP >= 10:
    sys.exit("--rev builds a revision for the owner's look: the export (step 10) waits for the owner's go — run --step 9")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, "..", "World0_Scene2_engine"))
BLEND = os.path.join(OUT_DIR, f"world0_scene_2_engine{'_revision' + REV if REV else ''}.blend")
PREVIEW_DIR = os.path.join(OUT_DIR, "previews", *(["revision" + REV] if REV else []))
# ⭐ (2026-11-14) the outputs beside the .blend named from ITS stem (`os.path.splitext`) — ⛔ `BLEND.replace(".blend", …)` rewrote every
# ".blend" in the whole absolute path (a parent folder named with ".blend" would have moved the .glb and the contact file)
BLEND_STEM = os.path.splitext(BLEND)[0]

# ---------------------------------------------------------------- the reference's numbers (Appendix B at 120°, §2.9 / §2.10 / §6)
UNIT_M = 0.14
PLINTH_H = 0.26 * 1.2 * 1.2 * 1.1   # 0.412: the plinth's height (the owner, 2026-11-13: ×1.2 twice, then the whole plinth ×1.1 — *"sturdier"*)
CASE_H = 0.55 * 1.2 * 1.15      # 0.759: the lower case's height (the owner, 2026-11-13: ×1.2, then ×1.15 — 0.55 first) — the crank axis on its top
YC = PLINTH_H + CASE_H          # 1.133 (1.034, 0.862, 0.81 before): the crank axis's height — ⭐ every height above follows it
RC = 0.15                       # the crank's throw (0.2 before — the owner, 2026-11-13: *"the piston shall remain in the cylinder"*)
PISTON_R, PISTON_H, PISTON_Y = 0.28, 0.32, 0.07      # body r, height, centre above the wrist pin (Appendix B, §2.9's radius)
PISTON_RIM, PISTON_CEIL = 0.026, 0.10                # its skirt's wall (the owner's inset: 0.28 → 0.254), its inner ceiling above the wrist pin
# the rod, STURDIER twice from the owner's file (2026-11-13: *"I made the rod sturdier and the rod connection sturdier again"*):
BIG_R, BIG_IN, BIG_W = 0.14, 0.06, 0.09              # the big end: outer r (0.12, 0.085 before), inner r (the pin), width along x (0.08 before)
SMALL_R, SMALL_W = 0.06, 0.09                        # the small end (the wrist), width (0.08 before)
SHANK = (0.0675, 0.10)                               # the rod's shank: x (0.06 before), z
SHANK_CHAMFER = 0.0033                               # its twelve edges chamfered (the owner's)
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
    # ⭐ (2026-11-14) a revision writes its own copy (`wood_v_revisionN.png`), never over the shared file the build packs (seeded: the same image)
    im.filepath_raw = os.path.join(OUT_DIR, "textures", f"wood_v{'_revision' + REV if REV else ''}.png")
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
    "glass": material("Glass", (1, 1, 1), metallic=1.0, roughness=0.75, alpha=0.43),   # ⭐ the owner's file, 2026-11-13 (*"I have changed
        # the material of the glass. see my world0_scene_2_engine_owner.blend file. apply the same"*, after *"too transparent"*): metallic 1,
        # roughness 0.3025, alpha 0.43 (0, 0.03, 0.26 before) — then *"INCREASE the roughness of the glass material to 0.75"*: a frosted,
        # reflecting glass; its sheen tint and specular 0.507 are not glTF's
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


def split_holes(bm, xs):
    """No BRIDGES (the owner, 2026-11-13: *"upper case: what are these edges for ? clean the geometry"*): a face cannot hold a hole, so a flat face
    cut by holes kept arbitrary edges linking each hole to its outline; the part split by planes x = const through every hole's centre leaves each
    hole two half-holes — notches in two faces' outlines — then every edge left splitting a flat face, off those planes, is dissolved."""
    for x in xs:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(x, 0, 0), plane_no=(1, 0, 0))
    bm.normal_update()
    on_plane = lambda e: any(all(abs(v.co.x - x) < 1e-6 for v in e.verts) for x in xs)
    flat = [e for e in bm.edges if len(e.link_faces) == 2 and e.link_faces[0].normal.dot(e.link_faces[1].normal) > 0.99999 and not on_plane(e)]
    if flat:
        bmesh.ops.dissolve_edges(bm, edges=flat, use_verts=True)
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


def mesh_object(name, bm, mat, part, coll, role="render", origin=None, smooth=None, extra_mats=()):
    """A mesh child of `part`; `bm` is in REFERENCE coordinates and is brought into the part's frame — or, with `origin` (a reference
    matrix), into that frame, the object then standing there (a hinged piece's pivot)."""
    to_local = (origin or part.matrix_basis).inverted()
    bmesh.ops.transform(bm, matrix=to_local, verts=bm.verts)
    if role == "ufm":
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)       # welded only: built minimal (a general dissolve makes bridges)
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
    if extra_mats:
        for m in extra_mats:
            me.materials.append(m)
    if smooth is None:                           # ⭐ EVERY visible part auto smooth (the owner, 2026-11-13: *"shade auto smooth all the parts in the scene"*)
        smooth = role == "render"
    if smooth:                                   # shade smooth, AUTO SMOOTH 30° (Blender's own): a round piece needs > 12 sides to read round under it;
        for poly in me.polygons:                 # a real 90° edge (a lip, a flange's rim, a bar's end) stays crisp
            poly.use_smooth = True
        me.use_auto_smooth, me.auto_smooth_angle = True, (math.pi if smooth == "all" else math.radians(30))
    if role != "render":
        o.display_type = "WIRE" if role == "ucx" else "SOLID"
        o.hide_render = True
        o.show_wire = True
    return o


GLASS_BEVEL = 0.01      # the glass edges' bevel (the build sheet's 0.01)


def bevel_outer(bm, width=GLASS_BEVEL, segments=4, keep=None):
    """The OUTER edges bevelled, before any cut (the owner, 2026-11-13: *"revert your 3 segment modifier on the cases and banks. Just bevel the
    outer edges of the cases and banks (not the inside geometry). apply shade auto smooth"*): every edge of the outer solid, applied in the mesh;
    4 segments — their faces 22.5° apart, round under auto smooth 30° (3 would be exactly 30°)."""
    edges = [e for e in bm.edges if not (keep and keep(e))]     # `keep`: the edges left SHARP (a seat face's, flush on its host)
    bmesh.ops.bevel(bm, geom=edges, offset=width, segments=segments, affect="EDGES", profile=0.5)
    return bm


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
    pm = mesh_object("E01_plinth_mesh", bm, MAT["woodV"], part, coll)
    pm.data.auto_smooth_angle = math.radians(35)   # its bevel's 3 steps are 30° each — ON Blender's 30°, faceted by float noise: its own 35°
    box_uv(pm)
    # collision: the outline with 2 steps a corner (24 vertices — the drawn 8 a corner gave 36-gon caps, 140 triangles: COLLISION SIMPLICITY)
    mesh_object("UCX_E01_00", prism_y(rounded_rect(PLINTH_W, PLINTH_D, PLINTH_R, seg=2), 0.0, PLINTH_H), MAT["ucx"], part, coll, "ucx")
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


def mark_plunge(g, into, depth, seat):
    """⭐ A part going INTO a hole / recess (the owner, 2026-11-13: *"the ghost face shall be aligned with the outer face … Then, we will create a
    special snap to plunge the pistons inside the cylinder hole"*): its ghost floor lies IN THE PLANE WHERE THE HOLE EXITS (flush with the host's
    outer face, filling the opening); the part rests there, then the PLUNGE snap (to build — QUEUE.md) carries it `depth` along `into` onto its
    seat `seat`. Read by the game from the ghost's custom properties."""
    g["plunge_axis"] = [round(c, 6) for c in Vector(into).normalized()]
    g["plunge"] = round(depth, 6)
    g["plunge_to"] = seat
    return g


def bore_disc(M, x, y, r=None, seg=24):
    """A bore's mouth as a polygon (bank frame M, the bore at x, the plane y′): the SAME 24 corners as the deck proxy's round hole (holed_strips)."""
    r = BORE_R if r is None else r
    return [M @ Vector((x + r * math.cos(2 * math.pi * k / seg), y, r * math.sin(2 * math.pi * k / seg))) for k in range(seg)]


def build_lower_case():
    part, coll = new_part("E02", "lower_case", 2, (0, CASE_Y0, 0), symmetry="yawHalfTurn")
    xi, zi, yf = CASE_X - WALL, CASE_Z - WALL, CASE_Y0 + WALL
    # ONE solid (separate touching boxes left their touching faces visible inside the glass): the outer box minus its three compartments
    # (between the end walls and the two bulkheads) and the saddles' cylinder along the crank axis
    hw = WALL / 2
    rooms = [(-xi, -BULKHEAD_X - hw), (-BULKHEAD_X + hw, BULKHEAD_X - hw), (BULKHEAD_X + hw, xi)]
    cutters = [box(a, b, yf, SPLIT + 0.1, -zi, zi) for a, b in rooms]
    cutters.append(cyl_between((-CASE_X - 0.1, SPLIT, 0), (CASE_X + 0.1, SPLIT, 0), SADDLE_R, 24))
    # its SEAT faces' edges sharp (the owner: *"same for the edges of the upper case which snap with the edges of the lower case and vice versa"*):
    # its top (the split: the upper case and the banks on it) and its bottom (on the plinth)
    on_seat = lambda e: all(abs(v.co.y - SPLIT) < 1e-6 for v in e.verts) or all(abs(v.co.y - CASE_Y0) < 1e-6 for v in e.verts)
    lower = boolean_cut(bevel_outer(box(-CASE_X, CASE_X, CASE_Y0, SPLIT, -CASE_Z, CASE_Z), keep=on_seat), cutters)
    mesh_object("E02_lower_case_mesh", split_holes(lower, [(a + b) / 2 for a, b in rooms]), MAT["glass"], part, coll)

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
    for bx in (-BULKHEAD_X, BULKHEAD_X):                                       # the bulkheads' tops (the coverage check: real, no proxy)
        for zs in (-1, 1):
            za, zb2 = sorted((zs * SADDLE_R, zs * zi))
            quad(bm, [(bx - WALL / 2, y1, za), (bx + WALL / 2, y1, za), (bx + WALL / 2, y1, zb2), (bx - WALL / 2, y1, zb2)])
    mesh_object("UFM_E02_outer", bm, MAT["ufm"], part, coll, "ufm")
    # ⭐ the GHOST at the tub's MOUTH — the split's plane, where the recess exits (the owner, 2026-11-13: *"the ghost face shall always be a face
    # aligned with the assembly face where the hole exits"*; it lay 0.18 down at the crank's resting depth before): the three rooms and the
    # saddles' notches in the bulkheads and end walls — the openings the rim's proxy leaves, filled; the crank PLUNGES from it onto its saddles
    gb = bmesh.new()
    for a, b in rooms:
        quad(gb, [(a, y1, -zi), (b, y1, -zi), (b, y1, zi), (a, y1, zi)])
    for a, b in [(bx - hw, bx + hw) for bx in (-BULKHEAD_X, BULKHEAD_X)] + [(-X, -xi), (xi, X)]:
        quad(gb, [(a, y1, -SADDLE_R), (b, y1, -SADDLE_R), (b, y1, SADDLE_R), (a, y1, SADDLE_R)])
    mark_plunge(mesh_object("UFM_E02_GHOST_crank", gb, MAT["ghost"], part, coll, "ufm"), (0, -1, 0), SPLIT - CRANK_REST_Y, "MC_E02_crank")
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
# ⭐ the FLYWHEEL at the FRONT and the PULLEY at the REAR (the owner, 2026-11-13: *"extend the crankshaft and move the flywheel to the other side
# of the crankshaft (I thought it was the pulley)"*): the bar runs FLY_GAP past each end face of the case
FLY_GAP = 0.094
FLY_FRONT_GAP = 0.057                                         # the flywheel's inner face this far in front of the case (the owner's file)
FLYWHEEL = (0.179, 0.084, -(CASE_X + FLY_FRONT_GAP))          # r, thickness, its inner face's x — in FRONT; the owner's file, 2026-11-13: *"I
                                                              # modified the wheel at the end of the cranskshaft"*: smaller, closer (0.277 × 0.12
                                                              # at 0.094 before; sturdier three times before that)
NOSE_X = CASE_X + FLY_GAP                                     # the bar's REAR end: the pulley's shoulder (the front end was the nose before)
# ⭐ the crank's RESTING proxy (and the lower case's ghost floor) at the crank's LOWEST point at the goal — its hull's extreme along its way in,
# what the orbit's lift measures: since the flywheel, the flywheel's bottom (the lowest pin's before)
CRANK_REST_Y = min(YC - FLYWHEEL[0], min(YC + RC * math.cos(o) - SR for o in [i * 2 * math.pi / N_CYL for i in range(N_CYL)]))
BAR_START_X = FLYWHEEL[2] - 0.01                              # the bar starts inside the flywheel


def bank_frame(side):
    """A bank's frame (side −1 = bank A, +1 = bank B): at the crank axis, turned side × 60° about x."""
    return Matrix.Translation((0, YC, 0)) @ Matrix.Rotation(side * ALPHA, 4, "X")


CYLS = [(side, i, PX[i] + side * ROD_X, f"{'A' if side < 0 else 'B'}{i + 1}") for side in (-1, 1) for i in range(N_CYL)]  # (side, pin, x, name)


def pin_centre(i):
    return Vector((0, YC + RC * math.cos(OFF[i]), RC * math.sin(OFF[i])))


KNEE_R, KNEE_STEPS, BAR_SEG = 0.075, 4, 16   # the bar's bends: centre-line radius (> the bar's 0.06), 4 steps of 22.5°; 16 sides — round under
                                            # auto smooth 30°


SUPPORT = 0.004     # a SUPPORT ring on a straight this close to its bend (the owner's file, 2026-11-13: *"add bevels just next to the last
                    # sections before a curve so that the turn is crisper"* — his two at 0.0033 and 0.0042)


def filleted(corners, radius, steps):
    """A polyline's corners rounded by arcs of `radius` (each in `steps` steps) — the centre line of a bent bar, as (points, TANGENTS): each
    point's exact direction (a straight's own, an arc's own at that angle) — the rings then stand square to the curve."""
    out, tan = [corners[0]], [(corners[1] - corners[0]).normalized()]
    for A, P, B in zip(corners, corners[1:], corners[2:]):
        d1, d2 = (P - A).normalized(), (B - P).normalized()
        theta = math.acos(max(-1.0, min(1.0, d1.dot(d2))))
        if theta < 1e-6:
            out.append(P)
            tan.append(d1)
            continue
        t = radius * math.tan(theta / 2)
        S = P - d1 * t
        n = (d2 - d1 * d1.dot(d2)).normalized()
        C = S + n * radius
        if (S - out[-1]).length > 2 * SUPPORT + 1e-6:        # a straight comes in: its support ring just before the bend
            out.append(S - d1 * SUPPORT)
            tan.append(d1)
        for k in range(steps + 1):
            phi = theta * k / steps
            q = C + radius * (-n * math.cos(phi) + d1 * math.sin(phi))
            if (q - out[-1]).length > 1e-6:      # ⛔ two bends meeting (an arm exactly two bends long) gave the SAME point twice: a doubled ring
                out.append(q)
                tan.append((d1 * math.cos(phi) + n * math.sin(phi)).normalized())
        E = out[-1]                                          # a straight goes out: its support ring just after the bend (if it is a straight —
        nxt_t = radius if B is not corners[-1] else 0.0      # the arm between two bends has none)
        if (B - E).length - nxt_t > 2 * SUPPORT + 1e-6:
            out.append(E + d2 * SUPPORT)
            tan.append(d2)
    if (corners[-1] - out[-1]).length > 1e-6:
        out.append(corners[-1])
        tan.append((corners[-1] - corners[-2]).normalized())
    return out, tan


def build_crankshaft():
    part, coll = new_part("E03", "crankshaft", 3, (0, YC, 0))
    ucx = []
    c = lambda x, y=0.0, z=0.0: Vector((x, YC + y, z))
    corners, x0 = [c(BAR_START_X)], BAR_START_X
    for i, x in enumerate(PX):
        py, pz = RC * math.cos(OFF[i]), RC * math.sin(OFF[i])
        a, b = x - HW, x + HW
        corners += [c(a), c(a, py, pz), c(b, py, pz), c(b)]                    # down the journal, up the arm, along the pin, down the arm
        ucx.append(cyl_between(c(x0), c(a), SR, 8, circumscribed=True))        # collision: the journal, the pin, each arm with its knees
        ucx.append(cyl_between(c(a, py, pz), c(b, py, pz), SR, 8, circumscribed=True))
        for xx in (a, b):        # each arm ONE 8-sided cylinder knee to knee, SR / 2 past each (a hull of two balls before: 48 – 72 triangles)
            k0, k1 = c(xx), c(xx, py, pz)
            d = (k1 - k0).normalized()
            ucx.append(cyl_between(k0 - d * SR / 2, k1 + d * SR / 2, SR, 8, circumscribed=True))
        x0 = b
    corners.append(c(NOSE_X))
    ucx.append(cyl_between(c(x0), c(NOSE_X), SR, 8, circumscribed=True))
    # ⭐ the bar ONE continuous tube along its bent centre line, its knees rounded bends (the owner, 2026-11-13: *"make the crankshaft curves'
    # geometry simpler: too many vertices here"* — 12 UV spheres and a cylinder a piece before, 3,040 vertices)
    centre, tangents = filleted(corners, KNEE_R, KNEE_STEPS)
    bar = tube(centre, SR, seg=BAR_SEG, tangents=tangents)
    o = mesh_object("E03_crankshaft_mesh", bar, MAT["chrome"], part, coll)
    # its shading: smooth EVERYWHERE but the two flat end caps (marked sharp) — a bend's inner side turns about 0.01 only, its faces slivers whose
    # normals passed auto smooth's 30° and split into creases; so auto smooth at 180° (no split by angle) with the caps' rims sharp by hand
    me = o.data
    me.auto_smooth_angle = math.pi
    edge_of = {tuple(sorted(e.vertices)): e for e in me.edges}
    for poly in me.polygons:
        if poly.loop_total == BAR_SEG:
            for k in poly.edge_keys:
                edge_of[tuple(sorted(k))].use_edge_sharp = True
    r, ln, x0f = FLYWHEEL
    xc = x0f - ln / 2                                                          # in front: from its inner face toward −x
    mesh_object("E03_flywheel", cyl_between(c(xc - ln / 2), c(xc + ln / 2), r, 32), MAT["chrome"], part, coll)   # its own object
    ucx.append(cyl_between(c(xc - ln / 2), c(xc + ln / 2), r, 8, circumscribed=True))
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_E03_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # face proxy: the RESTING proxy (facing down, the same place as the lower case's ghost floor) and the nose's shoulder (the pulley's seat)
    gx, gz = GHOST_CRANK
    mesh_object("UFM_E03_rest", quad(bmesh.new(), [(-gx, CRANK_REST_Y, -gz), (-gx, CRANK_REST_Y, gz), (gx, CRANK_REST_Y, gz),
                                                   (gx, CRANK_REST_Y, -gz)]), MAT["ufm"], part, coll, "ufm")
    mesh_object("UFM_E03_nose", disc(c(NOSE_X), (1, 0, 0), SR), MAT["ufm"], part, coll, "ufm")

    seat_marker("MC_E03_saddles", part, coll, (0, CRANK_REST_Y, 0), (0, -1, 0), (1, 0, 0))
    seat_marker("MC_E03_nose", part, coll, c(NOSE_X), (1, 0, 0), (0, 1, 0))
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


def half_ring(F, half):
    """A big end's half ring in the rod's frame F (its origin the pin): half +1 the rod's own (toward the small end), −1 its CAP (toward the
    crank); r BIG_IN – BIG_R, BIG_W wide along x."""
    bm, seg = bmesh.new(), 20
    pts = [(BIG_R * math.cos(math.pi * k / seg), half * BIG_R * math.sin(math.pi * k / seg)) for k in range(seg + 1)] + \
          [(BIG_IN * math.cos(math.pi * (seg - k) / seg), half * BIG_IN * math.sin(math.pi * (seg - k) / seg)) for k in range(seg + 1)]
    a = [bm.verts.new(F @ Vector((-BIG_W / 2, py, pz))) for pz, py in pts]
    b = [bm.verts.new(F @ Vector((BIG_W / 2, py, pz))) for pz, py in pts]
    n = len(pts)
    fs = [bm.faces.new(a[::-1]), bm.faces.new(b)] + [bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k])) for k in range(n)]
    bmesh.ops.recalc_face_normals(bm, faces=fs)
    return bm


def rod_outline_points(side, i, x, seg=16, theta=0.0, cap=False):
    """The rod's solid in points (reference coordinates): the big end's half ring (open toward the crank), the small end — their hull holds
    the shank."""
    F, pts = rod_frame(side, i, x, theta), []
    for k in range(seg + 1):
        t = math.pi * k / seg
        for dx in (-BIG_W / 2, BIG_W / 2):
            pts.append(F @ Vector((dx, BIG_R * math.sin(t), BIG_R * math.cos(t))))
            if cap:                                       # its cap, once seated (the crank turned): the lower half too
                pts.append(F @ Vector((dx, -BIG_R * math.sin(t), BIG_R * math.cos(t))))
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
    # its SEAT faces' edges sharp: its bottom (on the lower case) and its two slopes (the banks' feet on them, flush to the top's edge)
    on_slope = lambda p: any(abs((bank_frame(sd).inverted() @ p).y - FOOT) < 1e-6 for sd in (-1, 1))
    on_seat = lambda e: all(abs(v.co.y - SPLIT) < 1e-6 for v in e.verts) or all(on_slope(v.co) for v in e.verts)
    upper = boolean_cut(bevel_outer(outer, keep=on_seat), cutters)
    mesh_object("E04_upper_case_mesh", split_holes(upper, sorted({x for side, i, x, n in CYLS})), MAT["glass"], part, coll)

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
        Ms = bank_frame(s)                                                     # each SLOPE in its bank's frame, its bores ROUND
        zl, zh = sorted(((Ms.inverted() @ Vector((0, SPLIT, s * zb))).z, (Ms.inverted() @ Vector((0, UC_TOP, s * zt))).z))
        for poly in holed_strips(X, zl, zh, bore_xs(s), BORE_R):
            bm.faces.new([bm.verts.new(Ms @ Vector((px, FOOT, pz))) for px, pz in poly])
        bm.faces.new([bm.verts.new((s * X, y, z)) for z, y in
                      [(-zb, SPLIT), (-SADDLE_R, SPLIT)] + [(SADDLE_R * math.cos(math.pi - math.pi * i / 12), SPLIT + SADDLE_R * math.sin(math.pi - math.pi * i / 12)) for i in range(13)]
                      + [(zb, SPLIT), (zt, UC_TOP), (-zt, UC_TOP)]])
        for zs in (-1, 1):
            za, zb2 = sorted((zs * SADDLE_R, zs * zb))
            xa, xb = sorted((s * xi, s * X))
            quad(bm, [(xa, SPLIT, za), (xb, SPLIT, za), (xb, SPLIT, zb2), (xa, SPLIT, zb2)])
    # the TOP to its OUTER edges (the owner, 2026-11-13: *"in step 5, why there is a gap"* — the collision's boxes stop at the plate's INNER
    # width, and the proxy had reused them: a strip open along each top edge, between the top and its slope); the rods' slots stay open
    widen = lambda z: (-zt if abs(z + zti) < 1e-6 else zt if abs(z - zti) < 1e-6 else z)
    widen_x = lambda x: (-X if abs(x + xi) < 1e-6 else X if abs(x - xi) < 1e-6 else x)   # and along the crank (*"there is still a gap on
    for a, b, za, zb2 in top_boxes:                                                       # the top surface"*: 0.05 open at each end)
        za, zb2, a, b = widen(za), widen(zb2), widen_x(a), widen_x(b)
        quad(bm, [(a, UC_TOP, za), (a, UC_TOP, zb2), (b, UC_TOP, zb2), (b, UC_TOP, za)])
    zbi_ = slope_z(SPLIT, FOOT - WALL)                                         # the slopes' bottoms, on the split (the coverage check)
    for sd in (-1, 1):
        za, zb2 = sorted((sd * zbi_, sd * zb))
        quad(bm, [(-xi, SPLIT, za), (xi, SPLIT, za), (xi, SPLIT, zb2), (-xi, SPLIT, zb2)])
    mesh_object("UFM_E04_outer", bm, MAT["ufm"], part, coll, "ufm")
    # ⭐ each SLOPE whole, a GHOST for its bank (the review, step 5: four strips 0.1 wide between the bore openings — the gizmo would stutter):
    # the slope's plane edge to edge, bridging the openings; read only while that bank is held
    for sd, bank_id in ((-1, "E05"), (1, "E06")):
        # only the OPENINGS (the owner: *"ghost and real surface overlap: will it be a problem in the babylon/ts pipeline ?"* — a ghost fills
        # the opening it bridges, edge to edge with the real rim, never over a real face: the face map would count the overlap twice)
        Ms = bank_frame(sd)
        holes = bmesh.new()
        for xb in bore_xs(sd):
            merge_into(holes, disc(Ms @ Vector((xb, FOOT, 0)), Ms.to_3x3() @ Vector((0, 1, 0)), BORE_R, 24))
        g = mesh_object(f"UFM_E04_GHOST_slope_{bank_id}", holes, MAT["ghost"], part, coll, "ufm")
        g["ghost"], g["for_part"] = True, bank_id

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
# ⭐ each ring RESTS ON the bank's top face at the bore's (sharp) edge (the owner, 2026-11-13: *"make the rings level with the bank face (gap
# in red shall be zero)"*)
RING_R = BORE_R + RING[0]                         # 0.312: its centre circle — its inside on the bore's edge
RING_TOP = 2 * RING[0]                            # its top above the bank's top face
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


def torus(centre_frame, R, r, seg=32, rseg=8):      # LIGHT, shaded smooth ALL OVER (smooth="all"): a torus has no real edge, so few sides
                                                    # read round (the owner, 2026-11-13: *"bad blender geometries in the hidden faces … less vertices"*)
    bm = bmesh.new()
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        rings.append([bm.verts.new(centre_frame @ Vector(((R + r * math.cos(b)) * math.cos(a), r * math.sin(b), (R + r * math.cos(b)) * math.sin(a))))
                      for b in [-math.pi / 2 + 2 * math.pi * j / rseg for j in range(rseg)]])
    for i in range(seg):
        for j in range(rseg):
            a, b = rings[i], rings[(i + 1) % seg]
            bm.faces.new((a[j], b[j], b[(j + 1) % rseg], a[(j + 1) % rseg]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)   # ⛔ its faces were wound INWARD: every ring was inside out (invisible in a game engine)
    return bm


def holed_strips(X, zlo, zhi, centres, r, seg=12):
    """A plane's rectangle [−X, X] × [zlo, zhi] (in a part's frame: x along the crank, z across) with ROUND holes of radius r at x = centres,
    as polygons cut straight through each hole's centre — each hole two half-circle notches, no bridge (PART_AUTHORING.md §3: a proxy as close
    to the real surface as it can be: the real bores are round)."""
    cuts = sorted([-X, X] + list(centres))
    arc = lambda c, t0, t1: [(c + r * math.cos(math.radians(t0 + (t1 - t0) * k / seg)), r * math.sin(math.radians(t0 + (t1 - t0) * k / seg)))
                             for k in range(seg + 1)]
    polys = []
    for a, b in zip(cuts, cuts[1:]):
        poly = [(a, zlo), (b, zlo)]
        poly += arc(b, -90, -270) if b in centres else []       # the hole at the right: its left half
        poly += [(b, zhi), (a, zhi)]
        poly += arc(a, 90, -90) if a in centres else []         # the hole at the left: its right half
        polys.append(poly)
    return polys


def build_bank(side):
    pid, tag = ("E05", "A") if side < 0 else ("E06", "B")
    M = bank_frame(side)
    part, coll = new_part(pid, f"bank_{tag}", 5, (0, 0, 0), frame=M @ Matrix.Translation((0, FOOT, 0)), kind="bank")
    X = CASE_X
    zlo, zhi = bank_z(side)
    xs = bore_xs(side)

    body = transformed(box(-X, X, FOOT, BANK_TOP, zlo, zhi), M)
    bores = [transformed(cyl_between((x, FOOT - 0.2, 0), (x, BANK_TOP + 0.2, 0), BORE_R, 48), M) for x in xs]
    # its FOOT's edges not bevelled (the owner, 2026-11-13: *"no need for bevel at the edges of the banks which snap with the surface of the
    # upper case"*): the foot sits flush on the slope — a rounded edge there left a groove along the joint
    inv_m = M.inverted()
    on_foot = lambda e: all(abs((inv_m @ v.co).y - FOOT) < 1e-6 for v in e.verts)
    bank = boolean_cut(bevel_outer(body, keep=on_foot), bores)
    mesh_object(f"{pid}_bank_{tag}_mesh", split_holes(bank, xs), MAT["glass"], part, coll)   # (no cut at the split: the
    # foot's outer edge lies ON the lower case's top edge since the cases' widening)
    rings = bmesh.new()
    for x in xs:
        tb = torus(M @ Matrix.Translation((x, BANK_TOP + RING[0], 0)), RING_R, RING[0])
        me = bpy.data.meshes.new("_t"); tb.to_mesh(me); tb.free(); rings.from_mesh(me); bpy.data.meshes.remove(me)
    mesh_object(f"{pid}_bank_{tag}_rings", rings, MAT["chrome"], part, coll, smooth="all")

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
    for poly in holed_strips(X, zlo, zhi, xs, BORE_R):                         # the DECK, its bores ROUND (squares 0.6 before: glass left out)
        face([(px, BANK_TOP, pz) for px, pz in poly])
    for z in (zhi, zlo):
        face([(-X, FOOT, z), (X, FOOT, z), (X, BANK_TOP, z), (-X, BANK_TOP, z)])
    for x in (-X, X):
        face([(x, FOOT, zlo), (x, FOOT, zhi), (x, BANK_TOP, zhi), (x, BANK_TOP, zlo)])
    for poly in holed_strips(X, zlo, zhi, xs, BORE_R):                         # the FOOT, the same
        face([(px, FOOT, pz) for px, pz in poly])
    bm.normal_update()
    mesh_object(f"UFM_{pid}_outer", bm, MAT["ufm"], part, coll, "ufm")

    # the GHOST floors: one per bore, ⭐ its MOUTH on the deck — flush with the bank's top, filling the deck proxy's round hole (the owner,
    # 2026-11-13: *"the ghost face shall be aligned with the outer face"*; it lay 0.6 – 0.8 down the bore at the piston's resting depth before,
    # floating); the piston rests there, then PLUNGES down its bore onto its seat
    into = M.to_3x3() @ Vector((0, -1, 0))
    for side_, i, x, name in CYLS:
        if side_ != side:
            continue
        yr = piston_rest_y(side, i, x)
        g = M @ Vector((x, yr, 0))
        gb = bmesh.new()
        gb.faces.new([gb.verts.new(q) for q in bore_disc(M, x, BANK_TOP)])
        o = mesh_object(f"UFM_{pid}_GHOST_{name}", gb, MAT["ghost"], part, coll, "ufm")
        o["ghost"], o["for_part"] = True, PISTON_IDS[name]
        mark_plunge(o, into, BANK_TOP - yr, f"MC_{pid}_bore_{name}")
        seat_marker(f"MC_{pid}_bore_{name}", part, coll, g, M.to_3x3() @ Vector((0, 1, 0)), (1, 0, 0))

    # the VALVE SET's ghost floor (step 7): at its valve heads' lowest point, under its centre (x 0 — inside the middle bore's mouth)
    yv, hid = valves_rest_y(side), ("E13" if side < 0 else "E14")
    # ⭐ FULL-DECK (the owner, 2026-11-13: *"ghost floors shall be connected to real surfaces (not single small surfaces floating in the air).
    # Then correct to full-deck ghost"*): the whole bank's outline at the valve heads' depth, its edges ON the bank's outer faces — the gizmo
    # lands on it anywhere along the bank (a 0.2 square in the middle bore's mouth before: it needed the mouth capture)
    # ⭐⭐ then AT THE MOUTHS (the owner, 2026-11-13: *"the ghost face shall always be a face aligned with the assembly face where the hole
    # exits"*): its valves go INTO the bores — the three bores' mouths on the deck, the set PLUNGING from them onto its seat
    gb = bmesh.new()
    for s_, i_, x_, n_ in CYLS:
        if s_ == side:
            gb.faces.new([gb.verts.new(q) for q in bore_disc(M, x_, BANK_TOP)])
    o = mesh_object(f"UFM_{pid}_GHOST_valves", gb, MAT["ghost"], part, coll, "ufm")
    o["ghost"], o["for_part"] = True, hid
    mark_plunge(o, M.to_3x3() @ Vector((0, -1, 0)), BANK_TOP - yv, f"MC_{pid}_valves")
    seat_marker(f"MC_{pid}_valves", part, coll, M @ Vector((0, yv, 0)), M.to_3x3() @ Vector((0, 1, 0)), (1, 0, 0))

    up = M.to_3x3() @ Vector((0, 1, 0))
    seat_marker(f"MC_{pid}_upper", part, coll, M @ Vector((0, FOOT, 0)), -up, (1, 0, 0))
    seat_marker(f"MC_{pid}_head", part, coll, M @ Vector((0, BANK_TOP, 0)), up, (1, 0, 0))   # the valve set's discs on the bank's top face, inside the rings


def build_banks():
    build_bank(-1)
    build_bank(1)


# ================================================================ STEP 6 — E07 – E12 the pistons + rods (each its own bore, D2), ONE HINGE each
PISTON_IDS = {name: f"E{7 + k:02d}" for k, (side, i, x, name) in enumerate(CYLS)}    # A1 A2 A3 → E07 E08 E09, B1 B2 B3 → E10 E11 E12
ROD_FIT = 0.07      # the rod's collision piece starts this far up from the big end's centre: clear of the pin's (0.065)


POCKET_MARGIN = 0.006      # a valve pocket's margin round the head's sweep
NUMBER_X, NUMBER_SIZE = 0.175, 0.11   # the crown's name beside the pockets (it was centred, 0.2)


def crown_number(text, frame, size=0.2):
    """The cylinder's name in relief on the crown (D2: told apart), as a mesh in reference coordinates; `frame`: its centre, +y its normal."""
    cu = bpy.data.curves.new("_num", "FONT")
    cu.body, cu.size, cu.extrude, cu.align_x, cu.align_y = text, size, 0.004, "CENTER", "CENTER"
    cu.resolution_u = 3                            # light letters (Blender's 12 gave up to 1,000 vertices a crown)
    tmp = bpy.data.objects.new("_num", cu)
    scene.collection.objects.link(tmp)
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.curves.remove(cu)
    bpy.data.meshes.remove(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)   # the text's conversion leaves its letters' outlines doubled
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


PISTON_SEG = 48     # the piston's round: its revolve and its crown's edge (a multiple of 4: the crown's patches meet on its axes and at one step)
CROWN_ROWS = 4      # the crown's rows of quads between a pocket's rim and the piston's edge
FLOOR_GROUPS = (3, 1, 3, 3, 1)   # a pocket floor's rim steps (run-out → tip) taken onto ONE step of its inner rectangle each: 3 = a 3-to-1 reduction
FLOOR_SIDE = 3      # of those groups, how many face the rectangle's flank (along u); the rest its end (along v)
FLOOR_INNER = 0.8   # the inner rectangle's corner K at this share of the floor's radius, toward the rim's 45°
FLOOR_WEIGHT = 0.0  # the rectangle's steps ∝ (the rim steps they face) ** this — 1: as the rim, 0: equal
FLOOR_REDUCE_T = 0.65   # a 3-to-1 reduction's two inner vertices this far from the rim toward the rectangle
# (the FLOOR_ values swept over every layout of five groups — the quads' corners and their longest / shortest edge: 41° – 145°, 3.0;
#  (3, 1, 3, 1, 3) at 0.7, halfway: 29° – 163°; steps sized like the rim: thin strips, 4.2)


def crown_quads(P, pockets, yc, name):
    """⭐ REVISION 2 — THE CROWN IN QUADS (the owner, 2026-11-14: *"the top of the piston is not properly drawn in blender and does not follow the
    state of the art quad drawing, as a result, the rendering is poor and shows fake facets"*). Revision 1 cut the pockets with a boolean out of a
    flat cap: the crown became two 46-sided faces, each floor an 11-sided one, every wall's steps uneven (0.0012 beside 0.025) — long slivers
    once triangulated. Here every surface is drawn from its own equation in the piston's frame `P` (x the crank's, y the bore's, z across the
    bank), the half x ≥ 0, then mirrored onto x ≤ 0 (the valves' axes lie in the mid plane x = 0):
    * each POCKET — its cylinder (the valve's axis `d`, radius `rad`) between the crown (y = yc) and its floor (square to d, at y_lo along it):
      its WALL one quad per even step of the cylinder's angle φ, from the deep TIP (φ 0, on x = 0) to the RUN-OUT (φ0, where the floor rises
      through the crown: the wall's height 0 there — that last step a TRIANGLE, the one point where three surfaces meet); its FLOOR a band of
      quads along its rim round an inner rectangle (a circle's square-in-a-circle layout — a ladder parallel to the chord was tried first: its
      rows thinned to slivers toward the tip, where the rim runs parallel to them);
    * the CROWN, each side: the BAND between the two pockets (one row from the chord to the edge's first step) and, round each pocket, a RULED
      patch from its rim to the edge (90° → one step: PISTON_SEG / 4 − 1 steps, as many as the rim's) in CROWN_ROWS rows.
    Returns a bmesh in reference coordinates with a face layer "surface": 1 the crown, 2 a pocket's wall, 3 a pocket's floor."""
    m, k, R = PISTON_SEG // 4 - 1, CROWN_ROWS, PISTON_R
    step = 2 * math.pi / PISTON_SEG
    Pinv = P.inverted()
    faces, band_tops = [], {}
    for V0, rad, y_lo in pockets:
        L = Pinv @ V0
        a0, d = L.translation.copy(), (L.to_3x3() @ Vector((0, 1, 0))).normalized()
        assert abs(d.x) < 1e-6 and abs(a0.x) < 1e-6, f"piston {name}: a valve's axis off the piston's mid plane — the crown cannot be mirrored"
        d.x = a0.x = 0.0
        e2 = Vector((1, 0, 0))
        e1 = e2.cross(d)                                   # square to d, in the mid plane …
        if e1.y > 0:
            e1 = -e1                                       # … toward the DEEP side (the wall tallest there): the tip at φ = 0
        c = a0 + y_lo * d                                  # the floor's centre
        cos0 = (yc - c.y) / (rad * e1.y)
        assert -1 < cos0 < 1, f"piston {name}: a pocket's floor does not cross the crown"
        phi0 = math.acos(cos0)
        phis = [phi0 * (1 - j / m) for j in range(m + 1)]               # j = 0 the run-out … j = m the tip
        fl = lambda u, v: c + u * e1 + v * e2                           # the floor's plane: u toward the tip, v along x
        B = [fl(rad * math.cos(f), rad * math.sin(f)) for f in phis]    # the floor's rim
        T = [b + ((yc - b.y) / d.y) * d for b in B]                     # the crown's rim: up the cylinder's line from the floor's
        T[0] = B[0]                                                     # the run-out: one vertex, the wall's height 0
        for p in T:
            p.y = yc
        faces.append((2, [B[0], T[1], B[1]]))                           # the WALL: the run-out's triangle …
        faces += [(2, [B[j], T[j], T[j + 1], B[j + 1]]) for j in range(1, m)]      # … then quads to the tip
        # the FLOOR as a circle is drawn in quads: a BAND along its rim round an inner RECTANGLE on the chord and the mid line, its corner K
        # toward the rim's 45° (the square-in-a-circle layout: no corner on a smooth curve). ⭐ LIGHTER (the owner, 2026-11-14: *"can you
        # optimize the count of vertices in the flat recesses (for example by merging quads)"*): the band REDUCES — each group of FLOOR_GROUPS
        # takes its rim steps onto ONE step of the rectangle, a group of 3 by the 3-to-1 quad reduction (4 quads, 2 inner vertices) — so the
        # rectangle is len(FLOOR_GROUPS) steps round, not m (a 6 × 5 grid at first, 54 vertices a half floor; now 3 × 2, 30)
        assert sum(FLOOR_GROUPS) == m and set(FLOOR_GROUPS) <= {1, 3}, "FLOOR_GROUPS: steps of 1 or 3, as many in all as the rim's"
        u0 = rad * cos0                                                 # the chord (where the floor rises through the crown)
        na, nb = FLOOR_SIDE, len(FLOOR_GROUPS) - FLOOR_SIDE             # the rectangle: na steps along u (the rim's flank), nb along v
        jK = sum(FLOOR_GROUPS[:na])                                     # the rim step facing K
        uK, vR = FLOOR_INNER * rad * math.cos(phis[jK]), FLOOR_INNER * rad * math.sin(phis[jK])
        assert uK > u0 + 0.01 * rad, f"piston {name}: a pocket's floor too shallow for its inner rectangle"
        # the rectangle's steps sized like the rim groups they face (equal steps sheared the 3-to-1 quads: corners 29° – 163°)
        cum = lambda ws: [sum(ws[:i]) / sum(ws) for i in range(len(ws) + 1)]
        fu = cum([n ** FLOOR_WEIGHT for n in FLOOR_GROUPS[:na]])
        fv = cum([n ** FLOOR_WEIGHT for n in FLOOR_GROUPS[na:]][::-1])      # along v from the mid line: the end's groups reversed
        G = [[fl(u0 + (uK - u0) * fu[p_], vR * fv[q_]) for q_ in range(nb + 1)] for p_ in range(na + 1)]   # [along u][along v]
        for row in G:
            row[0].x = 0.0                                              # the mid line, exact
        I = [G[g][nb] for g in range(na + 1)] + [G[na][nb - g] for g in range(1, nb + 1)]   # the rectangle's outline facing the rim
        j0 = 0
        for g, n in enumerate(FLOOR_GROUPS):
            if n == 1:
                faces.append((3, [B[j0], B[j0 + 1], I[g + 1], I[g]]))
            else:                                                       # 3 to 1: two inner vertices between the rim and the step
                p1 = B[j0 + 1].lerp(I[g].lerp(I[g + 1], 1 / 3), FLOOR_REDUCE_T)
                p2 = B[j0 + 2].lerp(I[g].lerp(I[g + 1], 2 / 3), FLOOR_REDUCE_T)
                faces += [(3, [B[j0], B[j0 + 1], p1, I[g]]), (3, [B[j0 + 1], B[j0 + 2], p2, p1]),
                          (3, [B[j0 + 2], B[j0 + 3], I[g + 1], p2]), (3, [p1, p2, I[g + 1], I[g]])]
            j0 += n
        chord = [G[0][q_] for q_ in range(nb + 1)] + [B[0]]            # mid line → run-out
        for p in chord:
            p.y = yc
        faces += [(3, [G[p_][q_], G[p_ + 1][q_], G[p_ + 1][q_ + 1], G[p_][q_ + 1]]) for p_ in range(na) for q_ in range(nb)]
        for p in (T[m], B[m]):
            p.x = 0.0
        sg = 1 if T[m].z > 0 else -1                                    # this pocket's side of the crown
        rim = T[::-1]                                                   # the crown round the pocket: tip → run-out …
        edge = [Vector((R * math.cos(math.pi / 2 - step * i), yc, sg * R * math.sin(math.pi / 2 - step * i))) for i in range(m + 1)]
        edge[0].x = 0.0                                                 # … to the edge, 90° → one step
        grid = [[rim[i].lerp(edge[i], r / k) for i in range(m + 1)] for r in range(k + 1)]
        faces += [(1, [grid[r][i], grid[r][i + 1], grid[r + 1][i + 1], grid[r + 1][i]]) for r in range(k) for i in range(m)]
        band_tops[sg] = chord + [grid[r][m] for r in range(1, k + 1)]  # the chord (mid line → run-out), then out to the edge at one step
    assert set(band_tops) == {1, -1}, f"piston {name}: the crown expects one pocket each side of its mid line"
    assert len(band_tops[1]) == len(band_tops[-1]), f"piston {name}: the two pockets' chords drawn in different steps"
    mid = [Vector(((a.x + b.x) / 2, yc, 0.0)) for a, b in zip(band_tops[1], band_tops[-1])]   # the band's middle line, z = 0
    mid[0].x, mid[-1].x = 0.0, R
    for sg in (1, -1):
        top = band_tops[sg]
        faces += [(1, [mid[i], mid[i + 1], top[i + 1], top[i]]) for i in range(len(top) - 1)]
    faces += [(s_, [Vector((-p.x, p.y, p.z)) for p in reversed(pts)]) for s_, pts in faces]   # the half x ≤ 0
    bm = bmesh.new()
    lay = bm.faces.layers.int.new("surface")
    verts = {}
    def vert(p):
        key = tuple(round(c_, 8) for c_ in p)
        if key not in verts:
            verts[key] = bm.verts.new(P @ p)
        return verts[key]
    for s_, pts in faces:
        bm.faces.new([vert(p) for p in pts])[lay] = s_
    return bm


def build_piston(side, i, x, name):
    pid = PISTON_IDS[name]
    ly, lz, s, r = kinematics(side, i)
    M = bank_frame(side)
    part, coll = new_part(pid, f"piston_{name}", 6, (0, 0, 0), frame=M @ Matrix.Translation((x, s, 0)))
    up = M.to_3x3() @ Vector((0, 1, 0))

    # the PISTON: its body, its dark ring, its number on the crown
    y0, y1 = s + PISTON_Y - PISTON_H / 2, s + PISTON_Y + PISTON_H / 2
    # ⭐ HOLLOW from below (the owner's file, 2026-11-13: *"I modified the lower face of one of the pistons to inset it so we can see the end of the
    # rod inside the piston. Make something similar, but limiting the number of vertices inside the piston interior"*): ONE revolved profile —
    # the outer wall, the crown, the bottom rim, ONE inner band up to a ceiling clear of the small end (the interior: one ring and a pole)
    yi = s + PISTON_CEIL
    # ⭐ REVISION 2 (the owner, 2026-11-14): the CROWN is no longer part of the revolve — it is drawn in QUADS with its pockets (`crown_quads`,
    # below) and welded onto the revolve's top ring
    prof = [(y1, PISTON_R, 0), (y0, PISTON_R, 0), (y0, PISTON_R - PISTON_RIM, 0), (yi, PISTON_R - PISTON_RIM, 0), (yi, 0.0, 0)]
    along_y = M @ Matrix.Translation((x, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Z")   # revolve_x's axis turned onto the bore's (y′)
    body = revolve_x([(-yy, r, m) for yy, r, m in prof], along_y @ Matrix.Rotation(math.pi, 4, "Z"), seg=PISTON_SEG)
    # ⭐ VALVE POCKETS (the owner, 2026-11-13: *"Valve pockets in crowns"* — the reference's valves open 0.07 at the piston's top dead centre,
    # 0.007 above its crown: the engine's run found every valve in its piston): per valve, the space its head sweeps RELATIVE TO THE PISTON over
    # the 720° cycle, POCKET_MARGIN bigger, cut from the crown
    P0inv = (M @ Matrix.Translation((x, s, 0))).inverted()
    rt, rb, hh, hc = VALVE_HEAD
    pockets = []
    for vs, which in ((-1, "1"), (1, "2")):
        pts = []
        for k in range(0, 720, 6):
            lift = valve_lift(k, name, which)
            if lift <= 0:
                continue
            Pk = M @ Matrix.Translation((x, kinematics(side, i, math.radians(k))[2], 0))
            V = valve_frame(side, x, vs) @ Matrix.Translation((0, -lift, 0))
            for yy, rr in ((hc - hh / 2 - POCKET_MARGIN, rb + POCKET_MARGIN), (hc + hh / 2, rt + POCKET_MARGIN)):
                for t in [2 * math.pi * j / 16 for j in range(16)]:
                    q = V @ Vector((rr * math.cos(t), yy, rr * math.sin(t)))
                    pts.append((M @ Matrix.Translation((x, s, 0)) @ (Pk.inverted() @ q), kinematics(side, i, math.radians(k))[2]))
                    # (into the piston's frame, back at its goal; with the piston's travel then)
        if pts:
            # ⭐ a CLEAN CYLINDER along the valve's axis, containing the whole sweep (the owner, 2026-11-13: *"bad geometry in blender for the
            # recesses: the surface is not flat any longer"* — the sweep's convex hull had facets at every angle, bending the crown's shading)
            Minv = M.inverted()
            near = [(q, sk) for q, sk in pts if (Minv @ q).y < y1 + POCKET_MARGIN]   # only where the head REACHES the crown
            if not near:
                continue
            # the valve's axis AS THE PISTON SEES IT then: carried by the piston's travel along the bore (its goal is not where it meets the
            # valve — at the deck the axis was 0.16 aside for a piston whose goal is at the bottom of its stroke: r 0.178)
            s_ref = sum(sk for q, sk in near) / len(near)
            V0 = M @ Matrix.Translation((0, s - s_ref, 0)) @ Minv @ valve_frame(side, x, vs)
            loc = [V0.inverted() @ q for q, sk in near]
            rad = max(math.hypot(q.x, q.z) for q in loc) + 0.004
            y_lo = min(q.y for q in loc) - 0.004
            pockets.append((V0, rad, y_lo))      # the pocket's cylinder: the valve's axis as the piston sees it, its radius, its floor (along it)
            if name == "A1" and which == "1":
                print(f"valve pockets (each alike): r {rad:.3f}, the floor {-y_lo:.3f} below the valve's seat")
    P = M @ Matrix.Translation((x, s, 0))                    # the piston's own frame: x the crank's, y the bore's, its wrist pin at 0
    body.faces.layers.int.new("surface")                     # the revolve's faces: surface 0
    merge_into(body, crown_quads(P, pockets, PISTON_Y + PISTON_H / 2, name))
    bmesh.ops.remove_doubles(body, verts=body.verts, dist=1e-6)   # the crown's rim ON the revolve's top ring: welded
    assert all(len(e.link_faces) == 2 for e in body.edges), f"piston {name}: the body is not closed after the crown's weld"
    bmesh.ops.recalc_face_normals(body, faces=body.faces)
    lay = body.faces.layers.int.get("surface")
    for e in body.edges:                                     # every edge between two SURFACES (the revolve, the crown, a pocket's wall, its floor)
        if len(e.link_faces) == 2 and e.link_faces[0][lay] != e.link_faces[1][lay]:   # CRISP — the crown meets each floor at 17°, under
            e.smooth = False                                                            # the 30° smoothing: unmarked it would lean
    body.faces.layers.int.remove(lay)
    mesh_object(f"{pid}_piston_mesh", body, MAT["chrome"], part, coll)
    mesh_object(f"{pid}_piston_ring", torus(M @ Matrix.Translation((x, s + 0.18, 0)), PISTON_R + 0.001, 0.007, rseg=6), MAT["dark"], part, coll,
                smooth="all")
    # its name BESIDE the pockets (they take the crown's middle, across the bank): toward the crank's rear, smaller
    num = mesh_object(f"{pid}_piston_number", crown_number(name, M @ Matrix.Translation((x + NUMBER_X, y1, 0)), size=NUMBER_SIZE), MAT["dark"], part, coll)
    num["metadata"] = True       # ⭐ METADATA, its own object (the owner, 2026-11-13: *"make it separate objects so we can hide them in the game later
                                 # on"*): the game may hide it; never merged into a part's mesh, no collision, no proxy (PART_AUTHORING.md §3 item 1bis)

    # the ROD: its own object, its origin ON THE HINGE (the small end = the wrist pin), turning about x — LOCKED at the goal's angle in play
    F = rod_frame(side, i, x)
    hinge = F @ Matrix.Translation((0, ROD_L, 0))
    rod = cyl_between(F @ Vector((-SMALL_W / 2, ROD_L, 0)), F @ Vector((SMALL_W / 2, ROD_L, 0)), SMALL_R, 24)
    # the shank's edges CHAMFERED (the owner's file, 2026-11-13: *"I bevelled part of the rod. reapply for all rods"*: all twelve, 0.0033, one
    # segment)
    shank = bevel_outer(box(-SHANK[0] / 2, SHANK[0] / 2, 0.06, ROD_L, -SHANK[1] / 2, SHANK[1] / 2), width=SHANK_CHAMFER, segments=1)
    merge_into(rod, transformed(shank, F))
    merge_into(rod, half_ring(F, +1))                     # the big end: a half ring OPEN toward the crank (−y in the rod's frame)
    rod_obj = mesh_object(f"{pid}_rod_mesh", rod, MAT["chrome"], part, coll, origin=hinge)
    # ⭐ its COUNTER CLOSURE, the rod CAP (the owner's file, 2026-11-13: *"create the counter closure of the rod connections … make the counter
    # closure appear in the game when the piston-rod is seated in its position"*): the other half ring, closing the big end round the pin from the
    # crank's side — a child of the rod (it turns with it on the hinge), NO collision piece (the way in needs the big end open), and marked to
    # APPEAR only once the part is seated (PART_AUTHORING.md §3: `appears_when_seated`)
    cap = mesh_object(f"{pid}_rod_cap", half_ring(F, -1), MAT["chrome"], part, coll, origin=hinge)
    cap.parent, cap.matrix_basis = rod_obj, Matrix()
    cap["appears_when_seated"] = True
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
VALVE_LIFT = 0.07                               # a valve's lift (Appendix B)
VALVES_GHOST_HALF = 0.1                         # the valve set's ghost floor: a 0.2 square inside the middle bore's mouth
# ⭐ a GLASS DISC per bore (the owner, 2026-11-13: *"A glass disc per bore"* — the bores open at the bank's top for the pistons, the valves need a
# seat): in the bore's mouth, its rim ON the chrome ring, the valves through it, the grommets on it — part of the valve set
DISC_R, DISC_T = BORE_R, RING_TOP               # INSIDE its ring, LEVEL with it (the owner, 2026-11-13: *"these yellow volumes shall be level
                                                # with the rings"*): r 0.30, on the bank's top face, 0.024 thick (it sat on the ring's top before)
DISC_SINK = 0.0055                              # the disc LOWERED into its ring (the owner's file, 2026-11-13: *"I grabbed the closure of the
                                                # cylinder to lower it inside the ring"*): its top under the ring's top, the ring a rim round it
DISC_TOP = HEAD_TOP + DISC_T - DISC_SINK        # the disc's top above the deck


def grommet_along():
    """How far along its valve's axis the grommet sits: where the stem crosses the plane of the grommet's centre — the grommet lying FLAT on its
    disc (the owner's file: *"I also modified the rotation and position of three of the rings for the valves. do the same for the other rings so
    they match the closures of the cylinders"*), its tube's radius above the disc's top."""
    return (DISC_TOP + GROMMET[1]) / math.cos(VALVE_TILT)


def valves_rest_y(side):
    """The valve set's lowest point along −y′ (bank frame): its valve heads' rims — its resting proxy and its ghost floor."""
    inv, rt, rb, hh, hc = bank_frame(side).inverted(), *VALVE_HEAD
    pts = [inv @ (valve_frame(side, x, vs) @ Vector((rb * math.cos(t), hc - hh / 2, rb * math.sin(t))))
           for s_, i, x, n in CYLS if s_ == side for vs in (-1, 1) for t in [2 * math.pi * k / 24 for k in range(24)]]
    return min(p.y for p in pts)


def valve_fire():
    """Appendix B's firing order: each cylinder's cycle starts at its top dead centre, the TDCs spread over 720°."""
    tdc = {name: ((side * math.degrees(ALPHA) - math.degrees(OFF[i])) % 360 + 360) % 360 for side, i, x, name in CYLS}
    order = sorted(CYLS, key=lambda c: tdc[c[3]])
    return {c[3]: (tdc[c[3]] + (k % 2) * 360) % 720 for k, c in enumerate(order)}


def valve_lift(theta_deg, name, which):
    """Appendix B: a cylinder's first valve opens over its first 180° (its piston going down), its second over its last 180°; 0.07 at most."""
    ps = ((theta_deg - valve_fire()[name]) % 720 + 720) % 720
    if which == "1" and ps < 180:
        return VALVE_LIFT * math.sin(math.pi * ps / 180)
    if which == "2" and ps > 540:
        return VALVE_LIFT * math.sin(math.pi * (ps - 540) / 180)
    return 0.0


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
            gc = V @ Vector((0, ga, 0))                               # flat on the disc: the torus square to the BANK's axis, not the valve's
            merge_into(grommets, torus(Matrix.Translation(gc) @ M.to_3x3().to_4x4(), GROMMET[0], GROMMET[1], seg=12, rseg=6))
            # ONE revolved profile (a head and a stem pushed into it before): the stem's top inside its cap, down to the head, the head's
            # top, its rim, its seat face — 16 sides (the head 28 and the stem 14 before)
            prof = [(cc, 0.0, 0), (cc, sr, 0), (hc + hh / 2, sr, 0), (hc + hh / 2, rt, 0), (hc - hh / 2, rb, 0), (hc - hh / 2, 0.0, 0)]
            on_axis = V @ Matrix.Rotation(math.pi / 2, 4, "Z")          # revolve_x's axis turned onto the valve's (its local y)
            v = revolve_x([(-yy, r, m) for yy, r, m in prof], on_axis @ Matrix.Rotation(math.pi, 4, "Z"), seg=16)
            vo = mesh_object(f"{pid}_valve_{name}_{which}", v, MAT["chrome"], part, coll, origin=V)
            mesh_object(f"{pid}_valve_{name}_{which}_cap", cyl_between(V @ Vector((0, cc - ch / 2, 0)), V @ Vector((0, cc + ch / 2, 0)), cr, 16),
                        MAT["chromeH"], part, coll, origin=V)
            vo["axis"], vo["lift"] = "local −Y (it opens down its own axis)", 0.07
            # collision per valve above the bank: ⭐ TWO CYLINDERS — its cap, and its stem from the grommet up into the cap (the owner, 2026-11-13:
            # *"same for E13_valve_A1_1_cap"* — one hull of the cap's rims and the stem's ring before: a cone of 60 slivers round the stem);
            # the gaps between the caps open for the exhaust
            ucx.append(cyl_between(V @ Vector((0, cc - ch / 2, 0)), V @ Vector((0, cc + ch / 2, 0)), cr, 12, circumscribed=True))
            ucx.append(cyl_between(V @ Vector((0, ga, 0)), V @ Vector((0, cc - ch / 2, 0)), sr, 8, circumscribed=True))
    mesh_object(f"{pid}_head_{tag}_grommets", grommets, MAT["chrome"], part, coll, smooth="all")
    discs = bmesh.new()
    for s_, i, x, name in CYLS:
        if s_ == side:
            a, b = M @ Vector((x, DECK + DISC_TOP - DISC_T, 0)), M @ Vector((x, DECK + DISC_TOP, 0))   # the look: sunk DISC_SINK into the bore
            merge_into(discs, cyl_between(a, b, DISC_R, 32))
            ucx.append(cyl_between(M @ Vector((x, BANK_TOP, 0)), b, DISC_R, 12, circumscribed=True))   # its collision ON the bank's top face
            # (its rim over the glass: what the valve set rests on — the look sinks, the seat does not)
    mesh_object(f"{pid}_head_{tag}_discs", discs, MAT["glass"], part, coll)
    tops = bmesh.new()
    for s_, i, x, name in CYLS:
        if s_ == side:
            merge_into(tops, disc(M @ Vector((x, DECK + DISC_TOP, 0)), M.to_3x3() @ Vector((0, 1, 0)), DISC_R, 24))
    mesh_object(f"UFM_{pid}_discs", tops, MAT["ufm"], part, coll, "ufm")      # the exhaust's route and seat
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_{pid}_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")

    # its RESTING proxy at its lowest point (the valve heads' rims), square to the bank's axis, under its centre — on the bank's ghost floor
    yv, q = valves_rest_y(side), VALVES_GHOST_HALF
    mesh_object(f"UFM_{pid}_rest", quad(bmesh.new(), [M @ Vector((-q, yv, -q)), M @ Vector((q, yv, -q)), M @ Vector((q, yv, q)),
                                                     M @ Vector((-q, yv, q))]), MAT["ufm"], part, coll, "ufm")
    up = M.to_3x3() @ Vector((0, 1, 0))
    seat_marker(f"MC_{pid}_rest", part, coll, M @ Vector((0, yv, 0)), -up, (1, 0, 0))
    seat_marker(f"MC_{pid}_deck", part, coll, M @ Vector((0, BANK_TOP, 0)), -up, (1, 0, 0))   # its discs on the bank's top face
    seat_marker(f"MC_{pid}_exhaust", part, coll, M @ Vector((0, DECK + DISC_TOP, side * 0.15)), up, (1, 0, 0))   # the exhaust's seat (step 8)


def build_heads():
    build_head(-1)
    build_head(1)


# ================================================================ STEP 8 — E15, E16 the exhausts (each its own), on the valve sets' discs
# the 120° preview's revision, the owner's sketches (§6.2): per cylinder a FLANGE on the disc next to the outer (lower) valve, on its FRONT side, a
# STUB slightly bent halfway rising off it and running out and a little down into the COLLECTOR; the collector's dead end short, its rear end open
EXH_DX, EXH_ZS = 0.17, 0.15                     # a flange's centre from its bore's axis: along x (−side × it: bank A's BEHIND its valves, bank B's in
                                                # front — the owner's file, 2026-11-13: the two exhausts mirror images, as the banks), across (z′)
FLANGE = (0.065, 0.02)                          # r, thickness
FLANGE_CHAMFER = 0.004                          # its rims' chamfer
STUB_PIECES = 4                                 # a stub's collision: a chain of cylinders along its path
STUB_R, COLL_R, COLL_LIP = 0.05, 0.085, 0.014   # the stub's r, the collector's r, its wall at the open end
COLL_UP, COLL_Z = 0.10, 0.65                    # the collector's axis above the disc tops (y′), and out (z′)
DEAD_END = 0.14                                 # the collector's closed REAR past the last stub
OPEN_PAST = 0.165                               # its OPEN FRONT past the case's front face (the owner's file: *"reverse the opening and closing"*)
EXH_SEG, EXH_PATH = 14, 5                       # LIGHT (*"less vertex-intensive"*) yet ROUND under Blender's auto smooth 30° (*"increase the vertex
                                                # number slightly … so that the shade auto smooth can toggle"*): 14 sides (26° apart; 8 were 45°), 5 steps


def catmull_rom(points, per_seg=12, alpha=0.5):
    """three.js's CatmullRomCurve3 (open, 'centripetal'): the end tangents from mirrored points."""
    P = [Vector(p) for p in points]
    P = [2 * P[0] - P[1]] + P + [2 * P[-1] - P[-2]]
    out = []
    for k in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[k - 1], P[k], P[k + 1], P[k + 2]
        t0 = 0.0
        t1 = t0 + max((p1 - p0).length ** alpha, 1e-6)
        t2 = t1 + max((p2 - p1).length ** alpha, 1e-6)
        t3 = t2 + max((p3 - p2).length ** alpha, 1e-6)
        for j in range(per_seg + (1 if k == len(P) - 3 else 0)):
            t = t1 + (t2 - t1) * j / per_seg
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            out.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    return out


def tube(path, r, seg=16, start=None, tangents=None):
    """A closed tube of radius r along a path (parallel-transported rings, both ends capped); `start`: the first ring's exact normal (a pipe
    leaving a flange square to it); `tangents`: every ring's exact normal (a bent bar's — `filleted`)."""
    bm = bmesh.new()
    tangent = (path[1] - path[0]).normalized()
    u = tangent.orthogonal().normalized()
    rings = []
    for k, p in enumerate(path):
        nxt = (path[min(k + 1, len(path) - 1)] - p) if k < len(path) - 1 else (p - path[k - 1])
        prv = (p - path[k - 1]) if k > 0 else nxt
        # the ring square to the BISECTOR of its two segments (the chord between its neighbours tilted it where the spacing is uneven — the
        # crank's short arm between two bends: the rings crossed on the inside, a crease)
        t = (nxt.normalized() + prv.normalized()).normalized() if (k or start is None) else Vector(start).normalized()
        if tangents is not None:                 # ⭐ exact: the bisector tilted the ring where two bends meet in an S (11°: a stubby pinch)
            t = Vector(tangents[k]).normalized()
        u = (u - t * u.dot(t)).normalized()
        v = t.cross(u)
        rings.append([bm.verts.new(p + r * (math.cos(2 * math.pi * i / seg) * u + math.sin(2 * math.pi * i / seg) * v)) for i in range(seg)])
    faces = [bm.faces.new(rings[0][::-1]), bm.faces.new(rings[-1])]
    for a, b in zip(rings, rings[1:]):
        faces += [bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i])) for i in range(seg)]
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return bm


def exhaust_layout(side):
    """Per cylinder of the bank: its stub's path (reference coordinates) and its flange's centre (bank frame)."""
    M, top = bank_frame(side), DECK + DISC_TOP
    yc2, zc, zs = top + COLL_UP, side * COLL_Z, EXH_ZS
    out = []
    for s_, i, x0, name in CYLS:
        if s_ != side:
            continue
        x = x0 - side * EXH_DX
        pts = [(x, top + FLANGE[1], side * zs), (x, top + FLANGE[1] + 0.03, side * zs), (x, top + 0.08, side * (zs + 0.03)),          # from the flange's TOP: the tube's first ring
               # is square to its leaning start and dipped 0.018 below the flange's bottom, into the disc, from its bottom
               (x, top + 0.14, side * (zs + 0.2)), (x, yc2 + 0.01, side * (COLL_Z - 0.12)),
               (x, yc2, zc)]
        out.append((name, [M @ q for q in catmull_rom(pts, per_seg=EXH_PATH)], Vector((x, top, side * zs))))
    return out


def revolve_x(profile, frame, seg=12):
    """A surface of revolution about the frame's x axis from a profile [(x, r, material index)] — one clean mesh, every ring shared, a single
    pole where r = 0 (a dome's tip, a disc's centre). Each face takes the material index of the profile segment it comes from."""
    bm = bmesh.new()
    rings = []
    for x, r, m in profile:
        if r < 1e-9:
            rings.append([bm.verts.new(frame @ Vector((x, 0, 0)))])
        else:
            rings.append([bm.verts.new(frame @ Vector((x, r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg))))
                          for i in range(seg)])
    for k in range(len(rings) - 1):
        a, b, m = rings[k], rings[k + 1], profile[k][2]
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1:
                f = bm.faces.new((a[0], b[j], b[i]))
            elif len(b) == 1:
                f = bm.faces.new((a[i], a[j], b[0]))
            else:
                f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.material_index = m
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def build_exhaust(side):
    pid, tag = ("E15", "A") if side < 0 else ("E16", "B")
    M = bank_frame(side)
    top = DECK + DISC_TOP
    yc2, zc = top + COLL_UP, side * COLL_Z
    layout = exhaust_layout(side)
    fx = sum(f.x for n, p, f in layout) / len(layout)
    part, coll = new_part(pid, f"exhaust_{tag}", 8, (0, 0, 0), frame=M @ Matrix.Translation((fx, top, side * EXH_ZS)))
    flanges, ucx, rest = bmesh.new(), [], bmesh.new()
    fr, ft = FLANGE
    for name, path, f in layout:
        # ONE revolved profile, 24 sides, its two rims CHAMFERED (the owner: *"Shade auto smooth not latching on E15_exhaust_A_flanges. do
        # better"* — a 14-sided coin 0.02 thick: one band of faces between two hard edges, nothing for the smoothing to work with)
        b = FLANGE_CHAMFER
        prof = [(0.0, 0.0, 0), (0.0, fr - b, 0), (b, fr, 0), (ft - b, fr, 0), (ft, fr - b, 0), (ft, 0.0, 0)]
        merge_into(flanges, revolve_x(prof, M @ Matrix.Translation(f) @ Matrix.Rotation(math.pi / 2, 4, "Z"), seg=24))
        # ⭐ each stub its OWN object, smooth (the owner, 2026-11-13: *"make the exhaust curved parts separate objects so they can be smooth
        # shaded"*): it runs into the collector and onto its flange without being welded to either
        up_b = M.to_3x3() @ Vector((0, 1, 0))
        mesh_object(f"{pid}_exhaust_{tag}_stub_{name}", tube(path, STUB_R, seg=EXH_SEG, start=up_b), MAT["chrome"], part, coll, smooth=True)
        merge_into(rest, disc(M @ f, -(M.to_3x3() @ Vector((0, 1, 0))), fr, 12))
        # collision: ⭐ the flange a short cylinder, the stub a CHAIN of STUB_PIECES cylinders along its path (the owner, 2026-11-13: *"the
        # UCX_E16_00 of the exhaust connectors is very bad geometry … make a series of cylinders appended together"* — one hull of the flange
        # and every vertex of the bent tube before: hundreds of slivers); each joint overlapped by STUB_R / 2 so no gap opens at a bend, the
        # first starting ON the flange's top (never into the disc below: another part)
        ucx.append(cyl_between(M @ f, M @ (f + Vector((0, ft, 0))), fr, 12, circumscribed=True))
        ks = [round(j * (len(path) - 1) / STUB_PIECES) for j in range(STUB_PIECES + 1)]
        for j, (ka, kb) in enumerate(zip(ks, ks[1:])):
            pa, pb = path[ka].copy(), path[kb].copy()
            d = (pb - pa).normalized()
            ucx.append(cyl_between(pa - (d * STUB_R / 2 if j else Vector()), pb + d * STUB_R / 2, STUB_R, 8, circumscribed=True))
    mesh_object(f"{pid}_exhaust_{tag}_flanges", flanges, MAT["chrome"], part, coll, smooth=True)
    # ⭐ the collector, ONE revolved profile (*"make it a regola d'arte"*): a dark bore inside the open front, the lip, the outer wall, and a
    # flattened DOME closing the rear on the wall's own last ring — no sphere pushed into a cylinder
    x0 = -CASE_X - OPEN_PAST
    x1 = max(f.x for n, p, f in layout) + DEAD_END
    a, b = M @ Vector((x0, yc2, zc)), M @ Vector((x1, yc2, zc))
    ri, depth = COLL_R - COLL_LIP, 0.25
    prof = [(x0 + depth, 0.0, 1), (x0 + depth, ri, 1), (x0, ri, 0), (x0, COLL_R, 0)]          # the dark inside (material 1), the lip
    prof += [(x0 + (x1 - x0) * k / 4, COLL_R, 0) for k in range(1, 5)]                       # the wall, a few rings (smooth along it)
    prof += [(x1 + 0.6 * COLL_R * math.sin(t), COLL_R * math.cos(t), 0) for t in [math.pi / 2 * k / 4 for k in range(1, 5)]]   # the dome
    frame = M @ Matrix.Translation((0, yc2, zc))
    mesh_object(f"{pid}_exhaust_{tag}_collector", revolve_x(prof, frame, seg=EXH_SEG), MAT["chrome"], part, coll, smooth=True, extra_mats=(MAT["dark"],))
    ucx.append(cyl_between(a, b + Vector((COLL_R * 0.6, 0, 0)), COLL_R, 8, circumscribed=True))
    for k, piece in enumerate(ucx):
        mesh_object(f"UCX_{pid}_{k:02d}", piece, MAT["ucx"], part, coll, "ucx")
    mesh_object(f"UFM_{pid}_rest", rest, MAT["ufm"], part, coll, "ufm")      # its resting face: the flanges' bottoms, on the discs (real faces)
    up = M.to_3x3() @ Vector((0, 1, 0))
    seat_marker(f"MC_{pid}_head", part, coll, M @ Vector((0, top, side * EXH_ZS)), -up, (1, 0, 0))


def build_exhausts():
    build_exhaust(-1)
    build_exhaust(1)


# ================================================================ STEP 9 — E17 the pulley (any turn about its axis), on the crank's REAR end
PULLEY = (0.34, 0.10, 0.006)        # Appendix B's hammered pulley: r, thickness; its rims' chamfer
PULLEY_DISC = (0.24, 0.01)          # its dark inner disc: r, how far it stands proud of the pulley's outer face
PULLEY_HUB = (0.08, 0.015)          # its hub: r, how far proud
PULLEY_PIN = (0.04, 0.15, 0.03)     # its pin: r, its distance off the axis (the turn shows), how far proud


def build_pulley():
    part, coll = new_part("E17", "pulley", 9, (NOSE_X, YC, 0), symmetry="spinFree")
    c = lambda x, y=0.0, z=0.0: Vector((x, YC + y, z))
    r, t, b = PULLEY
    x0, x1 = NOSE_X, NOSE_X + t                                                # its inner face on the crank's end, its outer face behind
    along_x = Matrix.Translation(c(0))                                          # revolve_x turns about x: the crank's axis
    prof = [(x0, 0.0, 0), (x0, r - b, 0), (x0 + b, r, 0), (x1 - b, r, 0), (x1, r - b, 0), (x1, 0.0, 0)]
    mesh_object("E17_pulley_mesh", revolve_x(prof, along_x, seg=48), MAT["chromeH"], part, coll)
    dr, dp = PULLEY_DISC
    mesh_object("E17_pulley_disc", cyl_between(c(x1 - 0.02), c(x1 + dp), dr, 40), MAT["dark"], part, coll)
    hr, hp = PULLEY_HUB
    mesh_object("E17_pulley_hub", cyl_between(c(x1 - 0.02), c(x1 + dp + hp), hr, 20), MAT["chrome"], part, coll)
    pr, po, pp = PULLEY_PIN
    mesh_object("E17_pulley_pin", cyl_between(c(x1 - 0.02, po), c(x1 + dp + pp, po), pr, 14), MAT["chrome"], part, coll)
    # collision: one piece, the whole pulley (its hull: a cylinder to its hub's face)
    mesh_object("UCX_E17_00", cyl_between(c(x0), c(x1 + dp + hp), r, 12, circumscribed=True), MAT["ucx"], part, coll, "ucx")
    # face proxy: its inner face (its seat on the crank's end) and its outer face (round: a disc each)
    faces = disc(c(x0), (-1, 0, 0), r, 24)
    merge_into(faces, disc(c(x1 + dp), (1, 0, 0), dr, 24))
    mesh_object("UFM_E17_faces", faces, MAT["ufm"], part, coll, "ufm")
    seat_marker("MC_E17_nose", part, coll, c(x0), (-1, 0, 0), (0, 1, 0))


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
for _side, _pid, _head, _tag in ((-1, "E15", "E13", "A"), (1, "E16", "E14", "B")):     # each exhaust straight down onto its valve set's discs
    SEAT_PAIRS.append((8, f"MC_{_head}_exhaust", f"MC_{_pid}_head"))
    INSERTIONS.append((8, f"{_pid}_exhaust_{_tag}", tuple(bank_frame(_side).to_3x3() @ Vector((0, 1, 0))), 0.8))
SEAT_PAIRS.append((9, "MC_E03_nose", "MC_E17_nose"))          # the pulley along the crank's axis, from behind, onto its end
INSERTIONS.append((9, "E17_pulley", (1, 0, 0), 0.8))

STEPS = [(1, build_plinth), (2, build_lower_case), (3, build_crankshaft), (4, build_upper_case), (5, build_banks), (6, build_pistons), (7, build_heads), (8, build_exhausts), (9, build_pulley)]
for n, fn in STEPS:
    if n <= STEP:
        fn()


# ================================================================ THE FINISH PASS — every visible object, once built (PART_AUTHORING.md §4.1)
# (the owner, 2026-11-13: *"once the object is built, clean the geometry (remove duplicate vertices, reduce the number of vertices where possible
# in particular hidden faces and hidden objects or hidden object parts, etc.), apply shade auto smooth. do that for all the objects"*)
from mathutils.bvhtree import BVHTree as _BVH
from mathutils.geometry import tessellate_polygon as _tess
_TRI_SRC = {}


def tri_bvh(verts, polys):
    """⛔ BVHTree.FromPolygons FANS an n-gon from its first corner: a CONCAVE face (a notched end, a holed strip) gets triangles OUTSIDE its
    outline — phantom surface over the notch (2026-11-13: 34 'duplicate' faces found that were not there; the owner's superposed faces missed).
    Here each polygon triangulated by its outline; tri_src(tree, i) gives the polygon of the tree's triangle i."""
    tris, src = [], []
    for k, pl in enumerate(polys):
        if len(pl) == 3:
            tris.append(list(pl))
            src.append(k)
            continue
        for t in _tess([[verts[i] for i in pl]]):
            tris.append([pl[i] for i in t])
            src.append(k)
    tree = _BVH.FromPolygons(verts, tris)
    _TRI_SRC[id(tree)] = (tree, src)
    return tree


def tri_src(tree, i):
    return _TRI_SRC[id(tree)][1][i]


def _inside(tree, p, direction=Vector((0.5773, 0.5774, 0.5774)), eps=1e-5):
    """p inside the closed mesh of `tree`: the crossings of a ray from p, counted (odd = inside); a point ON the surface is not inside."""
    near = tree.find_nearest(p)
    if near[0] is not None and near[3] < 1e-4:
        return False
    hits, o = 0, p.copy()
    for _ in range(64):
        loc, nrm, idx, dist = tree.ray_cast(o, direction)
        if loc is None:
            break
        hits += 1
        o = loc + direction * eps
    return hits % 2 == 1


def finish_pass():
    bpy.context.view_layer.update()            # ⛔ the world matrices are stale until refreshed (a child read its parent's old place)
    to_root = YUP_ROOT.matrix_world.inverted()
    report, total0, total1 = [], 0, 0
    for part, coll in PARTS:
        meshes = [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render"]
        # ⛔ `is` never matched (Blender hands a new wrapper each access): the glass had counted as opaque
        opaque = [o for o in meshes if o.active_material != MAT["glass"]]
        trees = {}
        for o in opaque:                                    # each opaque piece as a closed volume, in the reference's coordinates
            m = to_root @ o.matrix_world
            trees[o.name] = tri_bvh([m @ v.co for v in o.data.vertices], [list(pl.vertices) for pl in o.data.polygons])
        for o in meshes:
            me = o.data
            v0 = len(me.vertices)
            bm = bmesh.new()
            bm.from_mesh(me)
            # 1. HIDDEN faces: an opaque piece's faces wholly inside ANOTHER opaque piece of the same part (glass hides nothing)
            hidden = []
            if o in opaque:
                m = to_root @ o.matrix_world
                others = [trees[q.name] for q in opaque if q is not o]
                for f in bm.faces:
                    pts = [m @ v.co for v in f.verts] + [m @ f.calc_center_median()]
                    if others and any(all(_inside(t, q) for q in pts) for t in others):
                        hidden.append(f)
            if hidden:
                bmesh.ops.delete(bm, geom=hidden, context="FACES")
            # 2. duplicates welded, loose geometry gone, and the NEEDLESS vertex — a flat fan's pole (a cap's centre) — dissolved into one face;
            #    ⛔ never a general "limited dissolve": it took out the crank's SUPPORT rings (their two sides are coplanar on a straight)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
            bm.normal_update()
            poles = [v for v in bm.verts if len(v.link_faces) >= 5 and all(len(f.verts) == 3 for f in v.link_faces)
                     and all(f.normal.dot(v.link_faces[0].normal) > 0.99999 for f in v.link_faces)
                     and len({f.material_index for f in v.link_faces}) == 1]
            if poles:
                bmesh.ops.dissolve_verts(bm, verts=poles)
            loose = [v for v in bm.verts if not v.link_faces]
            if loose:
                bmesh.ops.delete(bm, geom=loose, context="VERTS")
            smooth_angle = me.auto_smooth_angle if me.use_auto_smooth else math.radians(30)
            bm.to_mesh(me)
            bm.free()
            # 3. AUTO SMOOTH: every face smooth, the object's own angle (30° unless it set its own: a torus, the crank); an edge meant CRISP (a
            #    chamfer, 40° and more) marked sharp, so the smoothing never softens it and the review never counts it as faceted
            for pl in me.polygons:
                pl.use_smooth = True
            bmc = bmesh.new()
            bmc.from_mesh(me)
            bmc.normal_update()
            for e in bmc.edges:
                if len(e.link_faces) == 2 and e.calc_face_angle(0) >= math.radians(35):   # a chamfer's (45°) and its corners' (35.3°)
                    e.smooth = False
                # ⭐ a FLAT CAP (a face of more than 4 sides: a crown, a deck, a disc) keeps EVERY edge sharp where its neighbour is not
                # coplanar — it shades FLAT (the owner, 2026-11-13: *"some of the pistons' top face are still not flat"*: the crown met each
                # valve pocket's floor at 17°, under the 30° smoothing, and its normals leaned 8.6° toward it — a gradient on a flat face)
                elif len(e.link_faces) == 2 and any(len(f.verts) > 4 for f in e.link_faces) and e.calc_face_angle(0) > math.radians(1):
                    e.smooth = False
            bmc.to_mesh(me)
            bmc.free()
            me.use_auto_smooth, me.auto_smooth_angle = True, smooth_angle
            v1 = len(me.vertices)
            total0, total1 = total0 + v0, total1 + v1
            if v1 != v0 or hidden:
                report.append(f"{o.name} {v0}→{v1}" + (f" ({len(hidden)} hidden faces)" if hidden else ""))
    print(f"finish pass: {total0} → {total1} vertices; " + ("; ".join(report) if report else "nothing to clean"))


finish_pass()


def geometry_review():
    """Every visible object, once finished (the owner, 2026-11-13: *"once a visible object is drawn, do a check of the geometry to clean it …
    especially on objects or object's portions which are mostly hidden during game, shade auto smooth latches"*): ① does auto smooth LATCH — on
    a smooth object, the edges whose faces meet at 30° – 60° stay hard under 30° and look faceted (real crisp edges, ≥ 60° or marked sharp, are
    not counted); ② how much of it can be SEEN in the assembled engine — rays from each face in 26 directions, the opaque parts blocking (glass
    does not): an object mostly unseen is a candidate for lighter geometry (never deleted: the parts appear one by one, earlier steps see more)."""
    bpy.context.view_layer.update()            # ⛔ stale world matrices had put the caps where they were not: "95 % unseen"
    to_root = YUP_ROOT.matrix_world.inverted()
    vis = [o for o in bpy.data.objects if o.type == "MESH" and o.get("role") == "render"]
    occl_v, occl_p = [], []
    for o in vis:
        if o.active_material == MAT["glass"]:
            continue
        m, base = to_root @ o.matrix_world, len(occl_v)
        occl_v += [m @ v.co for v in o.data.vertices]
        occl_p += [[base + i for i in pl.vertices] for pl in o.data.polygons]
    tree = tri_bvh(occl_v, occl_p)
    dirs = [Vector((x, y, z)).normalized() for x in (-1, 0, 1) for y in (-1, 0, 1) for z in (-1, 0, 1) if (x, y, z) != (0, 0, 0)]
    faceted, hidden, inside_out = [], [], []
    for o in vis:
        me = o.data
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.normal_update()
        # ⓪ INSIDE OUT: a closed mesh's signed volume must be positive (a game engine draws a face's front only — an inverted mesh is invisible)
        if all(len(e.link_faces) == 2 for e in bm.edges) and bm.calc_volume(signed=True) < 0:
            inside_out.append(o.name)
        if me.use_auto_smooth:
            lim = me.auto_smooth_angle
            soft = [e for e in bm.edges if len(e.link_faces) == 2 and e.smooth]
            bad = [e for e in soft if lim < e.calc_face_angle(0) < math.radians(35)]
            if soft and len(bad) > 0.1 * len(soft):
                faceted.append(f"{o.name} ({len(bad)} of {len(soft)} edges 30–35°)")
        m = to_root @ o.matrix_world
        n3 = m.to_3x3()
        seen = 0
        for f in bm.faces:
            c, nrm = m @ f.calc_center_median(), (n3 @ f.normal).normalized()
            if any(d.dot(nrm) > 0.05 and tree.ray_cast(c + nrm * 1e-4 + d * 1e-4, d)[0] is None for d in dirs):
                seen += 1
        bm.free()
        if me.polygons and seen < 0.3 * len(me.polygons):
            hidden.append(f"{o.name} ({100 - 100 * seen // len(me.polygons)} % unseen, {len(me.vertices)} vertices)")
    print("inside out (a game engine would not draw them):", "✅ none" if not inside_out else "⛔ " + ", ".join(inside_out))
    print("auto smooth LATCHES:", "✅ every smooth object" if not faceted else "⚠ faceted — " + "; ".join(faceted))
    print("mostly UNSEEN in the assembled engine (candidates for lighter geometry):", "none" if not hidden else "; ".join(hidden))


geometry_review()


# ================================================================ THE CHECKS' CONTROLS — CHECK_CONTROLS=1 plants one defect per mistake met (PART_AUTHORING.md
# §4.2): each must be CAUGHT, else the check is blind. Never in a normal run (the file is then a broken one: rebuild without it)
if os.environ.get("CHECK_CONTROLS") and STEP >= 7:
    print("CHECK_CONTROLS: planting the defects (this file is NOT a build to keep)")
    to_root_c = YUP_ROOT.matrix_world.inverted()
    def _edit(name, fn):
        o = bpy.data.objects[name]
        bm = bmesh.new(); bm.from_mesh(o.data); fn(o, bm); bm.to_mesh(o.data); bm.free()
    def _shrink_top(o, bm):                                   # ⓐ the upper case's top 2 % short along x (its ends open)
        top = max(v.co.y for v in bm.verts)
        for v in bm.verts:
            if abs(v.co.y - top) < 1e-6:
                v.co.x *= 0.98
    _edit("UFM_E04_outer", _shrink_top)
    def _drop_bulkheads(o, bm):                               # ⓒ a seat face forgotten: the bulkheads' tops
        m = to_root_c @ o.matrix_world
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(abs(abs((m @ v.co).x) - BULKHEAD_X) < WALL for v in f.verts)], context="FACES")
    _edit("UFM_E02_outer", _drop_bulkheads)
    def _flip_one(o, bm):                                     # ⓓ a face turned the wrong way
        bm.faces.ensure_lookup_table(); bmesh.ops.reverse_faces(bm, faces=[bm.faces[0]])
    CONTROL_FLIP = _flip_one                                   # planted AFTER the orientation pass (it would turn it back)
    def _open_crack(o, bm):                                   # ③ a crack: a deck strip's edge on an inner cut pulled back 0.02 (in its plane)
        bm.normal_update()
        c = sorted(bore_xs(1))[1]                               # the middle bore's cut (bank frame x = reference x)
        m = to_root_c @ o.matrix_world
        deck_n = bank_frame(1).to_3x3() @ Vector((0, 1, 0))
        f = next(f for f in bm.faces if abs((bank_frame(1).inverted() @ (m @ f.calc_center_median())).y - BANK_TOP) < 1e-4 and f.calc_center_median().x < c
                 and any(abs((m @ v.co).x - c) < 1e-5 for v in f.verts))
        bmesh.ops.split_edges(bm, edges=list(f.edges))
        for v in f.verts:
            if abs((m @ v.co).x - c) < 1e-5:
                v.co.x -= 0.02
    _edit("UFM_E06_outer", _open_crack)
    part = bpy.data.objects["E04_upper_case"]; coll = part.users_collection[0]
    mesh_object("UFM_E04_CONTROL_floating", quad(bmesh.new(), [(0.2, UC_TOP + 0.1, -0.05), (0.3, UC_TOP + 0.1, -0.05), (0.3, UC_TOP + 0.1, 0.05),
                                                              (0.2, UC_TOP + 0.1, 0.05)]), MAT["ufm"], part, coll, "ufm")   # ⓔ a patch in the air
    part = bpy.data.objects["E01_plinth"]; coll = part.users_collection[0]
    g = mesh_object("UFM_E01_CONTROL_GHOST_over", quad(bmesh.new(), [(1.4, PLINTH_H, 1.4), (1.6, PLINTH_H, 1.4), (1.6, PLINTH_H, 1.6), (1.4, PLINTH_H, 1.6)]),
                    MAT["ghost"], part, coll, "ufm")                                                       # ⓑ a ghost over a real face
    g["ghost"], g["for_part"] = True, "E02"
    sph = [Vector((0.1 * math.cos(a) * math.cos(b), -1 + 0.1 * math.sin(b), 0.1 * math.sin(a) * math.cos(b)))
           for a in [2 * math.pi * k / 16 for k in range(16)] for b in [math.pi * (j / 8 - 0.5) for j in range(1, 8)]]
    mesh_object("UCX_E01_CONTROL_hull", hull(sph), MAT["ucx"], part, coll, "ucx")       # ⑫ a collision piece a dense hull
    me_c = bpy.data.objects["E07_piston_mesh"].data                                          # ⑬ a crown's sharp edges cleared (→ CROWNS IN QUADS)
    for e in me_c.edges:
        e.use_edge_sharp = False
    src = bpy.data.objects["UFM_E05_GHOST_A1"]                                                              # ⑩ a ghost RECESSED 0.1 down its bore
    rc = src.copy(); rc.data = src.data.copy(); rc.name = "UFM_E05_CONTROL_GHOST_recessed"; src.users_collection[0].objects.link(rc)
    rc.data.transform(Matrix.Translation(src.matrix_world.inverted().to_3x3() @ (YUP_ROOT.matrix_world.to_3x3() @ (bank_frame(-1).to_3x3() @ Vector((0, -0.1, 0))))))
    part = bpy.data.objects["E01_plinth"]; coll = part.users_collection[0]
    src = bpy.data.objects["UFM_E01_top"]                                                                   # ⑨ a face doubled (same way)
    dup = src.copy(); dup.data = src.data.copy(); dup.name = "UFM_E01_CONTROL_duplicate"; coll.objects.link(dup)


# ================================================================ THE PROXIES' ORIENTATION (⛔ BEFORE the save: it ran after it, its turns lost) — every face the right way (the face map reads normals)
# (2026-11-13: the lower case's rim strips faced DOWN or UP by the order their corners were listed — the review counted them as separate planes;
# the game's face map would have read an upside-down top): a real proxy face OUT of its part (a point just in front of it outside the part's
# solid), a ghost floor TOWARD where its part arrives from


def inner_point(f):
    """A point INSIDE a bmesh face (one of its triangles' centroid): a notched strip is concave — its centre can fall in the hole."""
    c = f.calc_center_median()                     # a CONVEX face: its centre, well inside (a fan's first triangle sits at a disc's RIM — the
    if bmesh.geometry.intersect_face_point(f, c):  # pulley's inner face tested in its chamfer, 2026-11-13: left facing in)
        return c
    pts = [v.co for v in f.verts]
    tris = sorted(_tess([pts]), key=lambda t: -((pts[t[1]] - pts[t[0]]).cross(pts[t[2]] - pts[t[0]])).length)
    return sum((pts[i] for i in tris[0]), Vector()) / 3 if tris else c


def _inside_tree(tree, p, dirs=(Vector((0.3127, 0.9214, 0.2309)), Vector((-0.7071, 0.1, 0.7)).normalized(), Vector((0.55, -0.6, -0.58)).normalized())):
    """Inside by the crossings' parity — THREE rays, the majority (one ray grazing a seam counts it twice: the pulley's inner face, 2026-11-13)."""
    votes = 0
    for d in dirs:
        hits, o = 0, p.copy()
        for _ in range(64):
            loc = tree.ray_cast(o, d)[0]
            if loc is None:
                break
            hits, o = hits + 1, loc + d * 1e-5
        votes += hits % 2
    return votes >= 2


def orient_proxies():
    bpy.context.view_layer.update()
    to_root = YUP_ROOT.matrix_world.inverted()
    arrives = {name.split("_")[0]: Vector(way) for st, name, way, dist in INSERTIONS}
    report = []
    for part, coll in PARTS:
        meshes = [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render"]
        tv, tp = [], []
        for o in meshes:
            m, base = to_root @ o.matrix_world, len(tv)
            tv += [m @ v.co for v in o.data.vertices]
            tp += [[base + i for i in pl.vertices] for pl in o.data.polygons]
        solid = tri_bvh(tv, tp) if tp else None
        for o in [q for q in coll.objects if q.get("role") == "ufm"]:
            m = to_root @ o.matrix_world
            bm = bmesh.new()
            bm.from_mesh(o.data)
            bm.normal_update()
            flip = []
            for f in bm.faces:
                c, n = m @ inner_point(f), (m.to_3x3() @ f.normal).normalized()
                if o.get("ghost"):
                    way = arrives.get(o.get("for_part"))
                    if way is not None and n.dot(way) < 0:
                        flip.append(f)
                elif "_rest" in o.name:
                    continue                                  # a resting proxy faces down its own way in: built so
                elif solid is not None and _inside_tree(solid, c + n * 0.002) and not _inside_tree(solid, c - n * 0.002):
                    flip.append(f)
            if flip:
                bmesh.ops.reverse_faces(bm, faces=flip)
                bm.to_mesh(o.data)
                report.append(f"{o.name} ({len(flip)})")
            bm.free()
    print("proxies' ORIENTATION (faces turned to face out / toward their part's arrival):", "; ".join(report) if report else "all were right")


orient_proxies()
if os.environ.get("CHECK_CONTROLS") and STEP >= 7:
    o_ = bpy.data.objects["UFM_E05_outer"]
    bm_ = bmesh.new(); bm_.from_mesh(o_.data); bm_.faces.ensure_lookup_table()
    bmesh.ops.reverse_faces(bm_, faces=[bm_.faces[0]]); bm_.to_mesh(o_.data); bm_.free()       # ⓓ the wrong-way face, after the pass

# proxies and collision hidden in the viewport (Alt+H or the outliner's eye shows them)
bpy.context.view_layer.update()
for o in bpy.data.objects:
    if o.get("role") in ("ucx", "ufm"):
        o.hide_set(True)

# ---------------------------------------------------------------- the preview (not exported): floor, light, camera as Appendix B
def ref_to_blender(p):
    return Vector((p[0], -p[2], p[1]))


# ⭐⭐ THE SCENE'S FLOOR, DESIGNED HERE and EXPORTED (the owner, 2026-11-13: *"make it the attributes of the scene (yellow material, invisible from
# below, with just a highlight of its contour when the camera sees it from below …) bevel the corners of the floor with a radius half of the radius
# of the bevel of the plinth corners"*): `FLOOR`, a child of the root (no part: never placed), role `floor` — the game's floor (2 m × 2 m: Scene_1's
# size; its "sand yellow" MAT_F, linear), its top at y 0 (the plinth stands on it), the corners r = PLINTH_R / 2.
# ⭐ ONE FACE, facing up, its material ONE-SIDED: invisible from below by itself — in Blender (backface culling) and in the game. ⛔ The contour seen
# from below cannot be a material: the game draws it (`D196`, `render/model_import.ts` — the top face's outline from this mesh's own vertices).
FLOOR_HALF, FLOOR_R = 1.0 / UNIT_M, PLINTH_R / 2         # 7.143 (1 m), 0.165
# ⛔ THE SCALE CHECKED against the GAME's own floor (read from src/content/scene_1.ts, not retyped — the preview's 24-unit floor had been 1.7× the
# game's, unseen until the owner compared the two): its dims × its unitM = this floor's 2 × FLOOR_HALF × UNIT_M
import re as _re
with open(os.path.join(HERE, "..", "..", "..", "src", "content", "scene_1.ts"), encoding="utf-8") as _fh:
    _s1 = _fh.read()
_game_m = float(_re.search(r'id: "Floor",[\s\S]*?dims: \[([\d.]+),', _s1).group(1)) * float(_re.search(r"unitM: ([\d.]+)", _s1).group(1))
print(f"the FLOOR at the game's scale: {2 * FLOOR_HALF * UNIT_M:.3f} m here, {_game_m:.3f} m in the game (Scene_1's floor) — "
      + ("✅" if abs(2 * FLOOR_HALF * UNIT_M - _game_m) < 1e-6 else "⛔ NOT THE GAME'S SIZE"))
MAT["floor"] = material("Floor", (0.864, 0.785, 0.629), roughness=1.0)   # ⭐ IVORY (sRGB EFE5D0 — the owner: render C "is the setup I want": halfway,
                                                                          # in linear light, between Scene_1's sand yellow and the reference's cream)
MAT["floor"].use_backface_culling = True
_floor_bm = flat_face(rounded_rect(2 * FLOOR_HALF, 2 * FLOOR_HALF, FLOOR_R), 0.0)
_floor_bm.normal_update()
_floor_bm.faces.ensure_lookup_table()
if _floor_bm.faces[0].normal.y < 0:
    bmesh.ops.reverse_faces(_floor_bm, faces=list(_floor_bm.faces))
_floor_me = bpy.data.meshes.new("FLOOR")                  # ⛔ not mesh_object: it brings reference coordinates into a PART's frame (a child of the
_floor_bm.to_mesh(_floor_me)                              # root) — the root's own frame IS the reference: the floor stood on its edge
_floor_bm.free()
_floor_me.materials.append(MAT["floor"])
FLOOR = bpy.data.objects.new("FLOOR", _floor_me)
collection("FLOOR (the scene's, exported)", ENGINE).objects.link(FLOOR)
FLOOR.parent = YUP_ROOT
FLOOR["role"] = "floor"
assert (YUP_ROOT.matrix_basis.to_3x3() @ FLOOR.data.polygons[0].normal).z > 0.999, "the floor's face does not face up"

# ⭐⭐ THE GAME'S LIGHTING, MIRRORED — never authored here (the owner, 2026-11-13: *"do we need to work the environment, the lighting, etc. directly in
# blender …, or does it need to be made in the babylon/ts pipeline ?"* → *"do it"*; `SCENE_WORKFLOW.md` §6.3 item 1). The SOURCE is the game's data:
# the SCENE's `lighting` (src/content/scene_2.ts since 2026-11-13 — the cream studio: its key, ambient, background, panorama, tone mapping, contact
# shadows; Scene_1's before) and the environment's strength (`envIntensity`, src/input/gestureConfig.ts), READ here (never retyped) and converted
# to what Babylon does with them on the .glb's PBR materials (`SCENE_SETUP.md`):
#   - positions: the game's metres = authored × Scene_1's unitM, in Babylon's LEFT-handed world; Babylon's glTF reader shows the file's (x, y, z) at
#     (−x, y, z) (its root: 180° about y, z × −1) → reference = (−X, Y, Z) / UNIT_M;
#   - a DIRECTIONAL of intensity I is an illuminance on a PBR material, Lambert's 1/π applied — as Blender's sun → a Blender SUN of strength I
#     (⛔ π·I before: the game's key then read π times darker than Blender showed — the owner's first look at the studio);
#   - a SPOT: Babylon gives it the intensity URP's falloff delivers at the bodies' mean (`illuminanceAt`) and, on a PBR material, its own physical
#     falloff I/d² (d in metres, a luminous intensity) → a Blender SPOT of power 4π·I / UNIT_M² (Blender: P / (4π·d²), d in this file's units);
#   - the ambient fill (a hemispheric light: white above, (0.25, 0.25, 0.28) below) and the sky (×envIntensity) → the WORLD's light; the CAMERA sees
#     the game's background colour (its clear colour), not the sky — as the game shows it;
#   - the sky's panorama MIRRORED (Mapping y × −1): Babylon reads an equirectangular image as u = atan2(z, x) in its world, Blender as its mirror.
# ⚠ An APPROXIMATION of Babylon's renderer by Eevee (soft shadows, reflections differ): the look here is close, the game's is the judge.
import re as _re2
with open(os.path.join(HERE, "..", "..", "..", "src", "content", "scene_1.ts"), encoding="utf-8") as _fh:
    _s1 = _fh.read()                                      # the units (Scene_2 carries Scene_1's unitM)
with open(os.path.join(HERE, "..", "..", "..", "src", "content", "scene_2.ts"), encoding="utf-8") as _fh:
    _s2 = _fh.read()                                      # ⭐ the lighting: the scene's own
with open(os.path.join(HERE, "..", "..", "..", "src", "input", "gestureConfig.ts"), encoding="utf-8") as _fh:
    _gc = _fh.read()
_lit = _s2[_s2.index("lighting: {"):]
_lit = _lit[:_lit.index("\n  },")]
_num = lambda key, txt: float(_re2.search(key + r":\s*(-?[\d.]+)", txt).group(1))
_tri = lambda key, txt: [float(v) for v in _re2.search(key + r":\s*\[([^\]]+)\]", txt).group(1).split(",")]
G_UNIT = _num(r"\n  unitM", _s1)
G_BG, G_AMBIENT = _tri("background", _lit), _num("ambient", _lit)
G_ENV = _num(r"\n  envIntensity", _gc)
_envvar = _re2.search(r"environment: (\w+)", _lit)
G_PANORAMA = (os.path.basename(_re2.search(r"import " + _envvar.group(1) + r' from "([^"]+)\?url"', _s2).group(1)) if _envvar else "sky_sand.hdr")
_tm = _re2.search(r"toneMapping: \{ exposure: ([\d.]+), contrast: ([\d.]+) \}", _lit)
G_TONE = (float(_tm.group(1)), float(_tm.group(2))) if _tm else None
G_AO = bool(_re2.search(r"ambientOcclusion: true", _lit))
G_LIGHTS = []
for _blk in _re2.split(r"\n      \{", _lit)[1:]:
    _l = {"name": _re2.search(r'name: "([^"]+)"', _blk).group(1), "type": _re2.search(r'type: "([^"]+)"', _blk).group(1),
          "position": _tri("position", _blk), "eulerDeg": _tri("eulerDeg", _blk), "intensity": _num("intensity", _blk),
          "kelvin": _num("kelvin", _blk), "filter": _tri("filter", _blk)}
    for _k in ("range", "spotOuterDeg", "spotInnerDeg", "softnessDeg"):
        if _re2.search(_k + r":", _blk):
            _l[_k] = _num(_k, _blk)
    G_LIGHTS.append(_l)
assert G_LIGHTS, "the scene's lights not read"


def unity_forward(e):                                     # core/lighting.ts unityForward
    x, y = math.radians(e[0]), math.radians(e[1])
    return Vector((math.sin(y) * math.cos(x), -math.sin(x), math.cos(y) * math.cos(x)))


def kelvin_rgb(k):                                        # core/lighting.ts kelvinToRgb
    t = min(40000, max(1000, k)) / 100
    cl = lambda v: min(255, max(0, v)) / 255
    r = 255 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    rgb = [cl(r), cl(g), cl(b)]
    m = max(rgb)
    return [c / m for c in rgb]


def illuminance_at(l, p):                                 # core/lighting.ts illuminanceAt (URP's falloff, authored units)
    if l["type"] == "DIRECTIONAL":
        return max(0.0, l["intensity"])
    d = Vector(p) - Vector(l["position"])
    d2, rng = d.length_squared, l.get("range", math.inf)
    if not d2 > 0 or d2 >= rng * rng:
        return 0.0
    win = (1 - (d2 / (rng * rng)) ** 2) ** 2 if math.isfinite(rng) else 1
    cone = 1
    if "spotOuterDeg" in l:
        ca = d.normalized().dot(unity_forward(l["eulerDeg"]).normalized())
        co, ci = math.cos(math.radians(l["spotOuterDeg"] / 2)), math.cos(math.radians(l.get("spotInnerDeg", l["spotOuterDeg"]) / 2))
        if ca <= co:
            return 0.0
        cone = min(1, (ca - co) / (ci - co)) ** 2 if ci > co else 1
    return max(0.0, l["intensity"]) / d2 * win * cone


def game_to_ref(v, point=True):                           # Babylon's world (metres, left-handed) → this file's reference units (y up)
    return Vector((-v[0], v[1], v[2])) / (UNIT_M if point else 1)


_target = (0.0, 0.0, 0.0)                                 # the bodies' mean (scene.ts: the non-frozen bodies; Scene_2 has none → the origin)
_mirrored = []
for _l in G_LIGHTS:
    _col = [k * f for k, f in zip(kelvin_rgb(_l["kelvin"]), _l["filter"])]
    _e = illuminance_at(_l, _target)
    _dir = game_to_ref(unity_forward(_l["eulerDeg"]), point=False).normalized()
    _ld = bpy.data.lights.new(_l["name"], "SUN" if _l["type"] == "DIRECTIONAL" else "SPOT")
    _ld.color = _col
    if _l["type"] == "DIRECTIONAL":
        _ld.energy, _ld.angle = _e, math.radians(_l.get("softnessDeg", 2))     # its SIZE: the shadows' softness
    else:
        _ld.energy = 4 * math.pi * _e / UNIT_M ** 2
        _ld.spot_size = math.radians(_l["spotOuterDeg"])
        _ld.spot_blend = 1 - _l.get("spotInnerDeg", _l["spotOuterDeg"]) / _l["spotOuterDeg"]
        _ld.shadow_soft_size = 0.05
    _lo = bpy.data.objects.new(_l["name"], _ld)
    _lo.location = ref_to_blender(game_to_ref([c * G_UNIT for c in _l["position"]]))
    _lo.rotation_euler = ref_to_blender(_dir).to_track_quat("-Z", "Y").to_euler()
    _lo["about"] = "the GAME's light, mirrored from src/content/scene_1.ts (never edited here)"
    PREVIEW.objects.link(_lo)
    _mirrored.append(f"{_l['name']} ({_l['type'].lower()}, game {_e:.3f} → Blender {_ld.energy:.2f})")

world = bpy.data.worlds.new("GameWorld")
world.use_nodes = True
_nt = world.node_tree
_out = _nt.nodes["World Output"]
_tc = _nt.nodes.new("ShaderNodeTexCoord")
_map = _nt.nodes.new("ShaderNodeMapping")
_map.inputs["Scale"].default_value = (1, -1, 1)
_env = _nt.nodes.new("ShaderNodeTexEnvironment")
_env.image = bpy.data.images.load(os.path.abspath(os.path.join(HERE, "..", "..", "Environment", G_PANORAMA)))
_nt.links.new(_tc.outputs["Generated"], _map.inputs["Vector"])
_nt.links.new(_map.outputs["Vector"], _env.inputs["Vector"])
_bg_env = _nt.nodes["Background"]
_nt.links.new(_env.outputs["Color"], _bg_env.inputs["Color"])
_bg_env.inputs["Strength"].default_value = G_ENV
_sep = _nt.nodes.new("ShaderNodeSeparateXYZ")
_nt.links.new(_tc.outputs["Generated"], _sep.inputs["Vector"])
_mr = _nt.nodes.new("ShaderNodeMapRange")
_mr.inputs["From Min"].default_value, _mr.inputs["From Max"].default_value = -1.0, 1.0
_nt.links.new(_sep.outputs["Z"], _mr.inputs["Value"])
_mix = _nt.nodes.new("ShaderNodeMixRGB")
_mix.inputs["Color1"].default_value = (0.25, 0.25, 0.28, 1)
_mix.inputs["Color2"].default_value = (1, 1, 1, 1)
_nt.links.new(_mr.outputs["Result"], _mix.inputs["Fac"])
_bg_hemi = _nt.nodes.new("ShaderNodeBackground")
_nt.links.new(_mix.outputs["Color"], _bg_hemi.inputs["Color"])
_bg_hemi.inputs["Strength"].default_value = G_AMBIENT
_add = _nt.nodes.new("ShaderNodeAddShader")
_nt.links.new(_bg_env.outputs["Background"], _add.inputs[0])
_nt.links.new(_bg_hemi.outputs["Background"], _add.inputs[1])
_bg_cam = _nt.nodes.new("ShaderNodeBackground")
_bg_cam.inputs["Color"].default_value = (*G_BG, 1)
_lp = _nt.nodes.new("ShaderNodeLightPath")
_ms = _nt.nodes.new("ShaderNodeMixShader")
_nt.links.new(_lp.outputs["Is Camera Ray"], _ms.inputs["Fac"])
_nt.links.new(_add.outputs["Shader"], _ms.inputs[1])
_nt.links.new(_bg_cam.outputs["Background"], _ms.inputs[2])
_nt.links.new(_ms.outputs["Shader"], _out.inputs["Surface"])
scene.world = world
print("the GAME's lighting mirrored (src/content/scene_2.ts, gestureConfig.ts): " + ", ".join(_mirrored) +
      f"; the ambient fill {G_AMBIENT}, the panorama {G_PANORAMA} ×{G_ENV}, the background {G_BG}, tone mapping {G_TONE}, contact shadows {G_AO}")
for _scr in bpy.data.screens:                      # the viewport's Material Preview WITH the scene's world and lights (its own studio image hid them)
    for _area in _scr.areas:
        for _sp in _area.spaces:
            if _sp.type == "VIEW_3D":
                _sp.shading.type = "MATERIAL"
                _sp.shading.use_scene_world = True
                _sp.shading.use_scene_lights = True

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
# ⭐ the game's TONE MAPPING mirrored: ACES there → Filmic here (Blender 3.4 has no ACES; Filmic "Medium Contrast" its nearest — render C's look);
# none there → Standard (Filmic would wash the colours the game shows raw)
if G_TONE is not None:
    scene.view_settings.view_transform, scene.view_settings.look = "Filmic", "Medium Contrast"
    scene.view_settings.exposure = math.log2(G_TONE[0])
else:
    scene.view_settings.view_transform, scene.view_settings.look = "Standard", "None"
scene.eevee.use_gtao = G_AO                          # the game's contact shadows (SSAO2) ↔ Eevee's ambient occlusion
scene.eevee.gtao_distance, scene.eevee.gtao_factor = 0.6, 1.2

# ================================================================ THE ENGINE RUNNING — Appendix B's update(θ), the ONE formula the game ports
# (the owner, 2026-11-13: *"how can we check that the animation will be ok in babylon/ts pipeline ? for example I want to see there is no
# interference of the pieces when the crankshaft is rotated over 360 degrees"*): ① every 6° over the 720° cycle, every moving piece posed and its
# MESH tested against every other part's; ② the same poses baked as keyframes (a preview to scrub — the game computes its own); ③ the poses at
# every 30° written to animation_golden.json — the TypeScript port (src/core) must reproduce them: then what is checked here holds in Babylon
import json


def engine_pose(theta_deg, valves_closed=False):
    """{object name: its matrix_basis} at the crank angle θ — every moving piece; the rest stays at its goal.
    ⭐ valves_closed: THE GOAL (the export, the checks after the run): at θ 0 the crank and pistons are at their goal but two valves are part
    open (each valve opens over 180° of the 720°: at every θ some are) — the valve set is SEATED closed, its collision built closed (the owner,
    2026-11-13: *"collision layer has two valves cap misaligned"* — B1's second and B2's first, 0.06 down their axes off their cylinders)."""
    th, poses, fire = math.radians(theta_deg), {}, valve_fire()
    poses["E03_crankshaft"] = Matrix.Translation((0, YC, 0)) @ Matrix.Rotation(th, 4, "X")
    if STEP >= 9:
        poses["E17_pulley"] = Matrix.Translation((NOSE_X, YC, 0)) @ Matrix.Rotation(th, 4, "X")
    for side, i, x, name in CYLS:
        pid = PISTON_IDS[name]
        if STEP >= 6:
            ly, lz, s_, r_ = kinematics(side, i, th)
            poses[f"{pid}_piston_{name}"] = bank_frame(side) @ Matrix.Translation((x, s_, 0))
            poses[f"{pid}_rod_mesh"] = Matrix.Rotation(r_, 4, "X")          # about its hinge (the wrist), in its piston's frame
        if STEP >= 7:
            hid = "E13" if side < 0 else "E14"
            part = bpy.data.objects[f"{hid}_head_{'A' if side < 0 else 'B'}"]
            for vs, which in ((-1, "1"), (1, "2")):
                lift = 0.0 if valves_closed else valve_lift(theta_deg, name, which)
                m = part.matrix_basis.inverted() @ valve_frame(side, x, vs) @ Matrix.Translation((0, -lift, 0))
                poses[f"{hid}_valve_{name}_{which}"] = m
                poses[f"{hid}_valve_{name}_{which}_cap"] = m
    return poses


def apply_pose(poses):
    for n, m in poses.items():
        o = bpy.data.objects.get(n)
        if o:
            o.matrix_basis = m
    bpy.context.view_layer.update()


def owner_part(o):
    while o.parent is not None and o.parent is not YUP_ROOT:
        o = o.parent
    return o


def mesh_tree(o):
    m = YUP_ROOT.matrix_world.inverted() @ o.matrix_world
    vs = [m @ v.co for v in o.data.vertices]
    return tri_bvh(vs, [list(pl.vertices) for pl in o.data.polygons]), vs, o


def contact_ok(a, b, pairs, ta, tb):
    """A KNOWN contact, named: a big end or its cap ON its crank pin (the triangles at the pin's radius), the pulley ON the crank's end."""
    names = {a.name, b.name}
    if any(n.endswith(("_rod_mesh", "_rod_cap")) for n in names) and any(n.startswith("E03_crankshaft") for n in names):
        rod = a if a.name.endswith(("_rod_mesh", "_rod_cap")) else b
        F = YUP_ROOT.matrix_world.inverted() @ (rod.matrix_world if rod.name.endswith("_rod_mesh") else rod.parent.matrix_world)
        pin_axis_pt = F @ Vector((0, -ROD_L, 0))          # the big end's centre (the hinge is the small end)
        return all(abs(math.hypot(((ta if rod is a else tb)[k][1] - pin_axis_pt).y, ((ta if rod is a else tb)[k][1] - pin_axis_pt).z)) < BIG_R + 0.01
                   for k in [p[0] if rod is a else p[1] for p in pairs])
    if names & {"E17_pulley_mesh", "E17_pulley_disc", "E17_pulley_hub", "E17_pulley_pin"} and "E03_crankshaft_mesh" in names:
        return True
    return False


# ⭐ THE BUILT POSE, every part's every object (reference units, relative to YUP_ROOT) — before anything moves them: the export must put each
# where it was built, the look, its collision and its proxies together (⑫ in check_glb; PART_AUTHORING.md §4.4)
bpy.context.view_layer.update()
BUILT = {o.name: YUP_ROOT.matrix_world.inverted() @ o.matrix_world for p, c in PARTS for o in c.objects}

if STEP >= 6:
    movers = [o for o in bpy.data.objects if o.type == "MESH" and o.get("role") == "render" and
              (owner_part(o).name in {"E03_crankshaft", "E17_pulley"} or owner_part(o).name.startswith(tuple(PISTON_IDS.values())) or "_valve_" in o.name)]
    statics = [o for o in bpy.data.objects if o.type == "MESH" and o.get("role") == "render" and o not in movers]
    static_trees = [mesh_tree(o) for o in statics]
    hits, golden = {}, {}
    for k in range(120):                                    # every 6° over the 720° cycle
        theta = 6 * k
        apply_pose(engine_pose(theta))
        trees = [mesh_tree(o) for o in movers]
        if theta % 30 == 0:
            golden[str(theta)] = {o.name: [list(r) for r in (YUP_ROOT.matrix_world.inverted() @ o.matrix_world)] for o in movers}
        for i, (ta, va, a) in enumerate(trees):
            for tb, vb, b in trees[i + 1:] + static_trees:
                if owner_part(a) is owner_part(b):
                    continue
                pairs = ta.overlap(tb)
                if pairs:
                    pa_ = lambda p: a.data.polygons[tri_src(ta, p)].vertices
                    pb_ = lambda q: b.data.polygons[tri_src(tb, q)].vertices
                    tri_a = [(None, sum((va[v] for v in pa_(p)), Vector()) / len(pa_(p))) for p, q in pairs]
                    tri_b = [(None, sum((vb[v] for v in pb_(q)), Vector()) / len(pb_(q))) for p, q in pairs]
                    cen_a = {p: tri_a[j] for j, (p, q) in enumerate(pairs)}
                    cen_b = {q: tri_b[j] for j, (p, q) in enumerate(pairs)}
                    if contact_ok(a, b, pairs, cen_a, cen_b):
                        continue
                    key = tuple(sorted((a.name, b.name)))
                    hits.setdefault(key, []).append(theta)
    apply_pose(engine_pose(0, valves_closed=True))          # back to the goal (the valves closed)
    if hits:
        print(f"the engine RUNNING (720°, every 6°, the meshes): ⛔ {len(hits)} interferences — " +
              "; ".join(f"{a} × {b} at {v[0]}°–{v[-1]}° ({len(v)} poses)" for (a, b), v in sorted(hits.items())))
    else:
        print("the engine RUNNING (720°, every 6°, the meshes): ✅ no interference (known contacts: big ends and caps on their pins, the pulley on the crank)")
    with open(os.path.join(OUT_DIR, "animation_golden.json") if not REV else os.devnull, "w", encoding="utf-8") as fh:   # a revision: untouched
        json.dump({"about": "Scene_2's poses (reference units, y up, relative to YUP_ROOT) at every 30° of the 720° cycle — Appendix B's update(θ); "
                            "the TypeScript port must reproduce them", "unitM": UNIT_M, "poses": golden}, fh, indent=0)
    # the PREVIEW: the same poses baked as keyframes, 96 frames = 720° (scrub the timeline; the game computes its own)
    scene.frame_start, scene.frame_end, scene.render.fps = 1, 96, 24
    for f in range(1, 97):
        for n, m in engine_pose(720 * (f - 1) / 96).items():
            o = bpy.data.objects.get(n)
            if o:
                o.matrix_basis = m
                o.keyframe_insert("location", frame=f)
                o.keyframe_insert("rotation_euler", frame=f)
    for o in bpy.data.objects:
        if o.animation_data and o.animation_data.action:
            for fc in o.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
    scene.frame_set(1)


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
        if o.type == "MESH" and o.get("role") in ("ufm", "render"):      # EVERY visible mesh (the crank's doubled rings passed a glass-only check)
            d, z, l = redundancy(o)
            if d or z or l:
                bad.append(f"{o.name} ({d} duplicate vertices, {z} zero-area faces, {l} loose edges)")
ghosts = [(o.name, o.get("for_part")) for o in bpy.data.objects if o.get("ghost")]
print("ghost floors, each for ONE part:", ", ".join(f"{n}→{f}" for n, f in ghosts),
      "✅" if all(f and bpy.data.objects.get(next((p.name for p, _ in PARTS if p["part_id"] == f), "")) for n, f in ghosts) else "⛔ a ghost names no built part")


# ================================================================ THE PROXY SANITY (PART_AUTHORING.md §3 item 3) — the gizmo's surfaces checked
# against the real ones: ① fidelity ② coverage ③ continuity ④ floating islands ⑤ reachability ⑥ simplicity — every failure named
SANE_TOL, SANE_CRACK, SANE_NARROW, SANE_TINY = 0.005, 0.05, 0.025, 0.0025


def _closest_on_seg(q, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (q - a).dot(ab) / ab.length_squared)) if ab.length_squared > 0 else 0.0
    return a + ab * t


def superposed(objs, out, key, same_only=False, tol=1e-4):
    """Faces lying ON another face (inside each triangle sampled, a face of ANOTHER polygon within tol, parallel): same-facing → out[key]
    (a duplicate); opposite-facing → returned {(covered object, other object): faces} (a seat). Concave-safe (tri_bvh)."""
    to_root = YUP_ROOT.matrix_world.inverted()
    tv, tp, key_of = [], [], []
    for o in objs:
        m, base = to_root @ o.matrix_world, len(tv)
        tv += [m @ v.co for v in o.data.vertices]
        for pl in o.data.polygons:
            tp.append([base + i for i in pl.vertices])
            key_of.append((o, pl.index, (m.to_3x3() @ pl.normal).normalized()))
    if not tp:
        out.setdefault(key, [])
        return {}
    tree = tri_bvh(tv, tp)
    dup, seats = {}, {}
    for k, pl in enumerate(tp):
        o, pi, n = key_of[k]
        cover = None
        ring = [tv[i] for i in pl]
        for t in _tess([ring]):
            a, b, c = (tv[pl[i]] for i in t)
            for q in ((a + b + c) / 3, a.lerp((b + c) / 2, 0.2), b.lerp((a + c) / 2, 0.2), c.lerp((a + b) / 2, 0.2)):
                if min((q - _closest_on_seg(q, ring[i], ring[i - 1])).length for i in range(len(ring))) < 5 * tol:
                    continue                                  # by its own outline: a coplanar NEIGHBOUR is there by right
                for h in tree.find_nearest_range(q, tol):
                    j = tri_src(tree, h[2])
                    if j == k:
                        continue
                    d = key_of[j][2].dot(n)
                    if abs(d) > 0.999:
                        cover = (key_of[j][0], d > 0)
                        break
                if cover:
                    break
            if cover:
                break
        if cover is None:
            continue
        other, same = cover
        if same:
            dup[tuple(sorted((o.name, other.name)))] = dup.get(tuple(sorted((o.name, other.name))), 0) + 1
        elif not same_only:
            seats[(o.name, other.name)] = seats.get((o.name, other.name), 0) + 1
    out.setdefault(key, []).extend(f"{a} × {b} ({n} faces)" for (a, b), n in sorted(dup.items()))
    return seats


def proxy_sanity():
    bpy.context.view_layer.update()
    to_root = YUP_ROOT.matrix_world.inverted()

    def tree_of(objs):
        tv, tp = [], []
        for o in objs:
            m, base = to_root @ o.matrix_world, len(tv)
            tv += [m @ v.co for v in o.data.vertices]
            tp += [[base + i for i in pl.vertices] for pl in o.data.polygons]
        return tri_bvh(tv, tp) if tp else None

    def faces_of(o):
        m = to_root @ o.matrix_world
        return [([m @ o.data.vertices[i].co for i in pl.vertices], (m.to_3x3() @ pl.normal).normalized()) for pl in o.data.polygons]

    def samples(pts):
        c = sum(pts, Vector()) / len(pts)
        return [c] + [p.lerp(c, 0.02) for p in pts] + [(pts[i] + pts[(i + 1) % len(pts)]) / 2 for i in range(len(pts))]

    real_proxies = [o for o in bpy.data.objects if o.get("role") == "ufm" and not o.get("ghost") and "_rest" not in o.name]
    part_trees = {p.name: tree_of([o for o in c.objects if o.type == "MESH" and o.get("role") == "render"]) for p, c in PARTS}
    all_real_tree = tree_of(real_proxies)
    out = {k: [] for k in ("fidelity", "coverage", "continuity", "floating", "reachability", "simplicity", "steps", "alone")}
    for part, coll in PARTS:
        meshes = [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render"]
        mine = [o for o in real_proxies if o.parent is part]
        if not mine or not meshes:
            continue
        real = tree_of(meshes)
        proxy = tree_of(mine)
        # ① FIDELITY: every point of the proxy ON the real surface
        off = 0.0
        for o in mine:                                                  # sampled INSIDE each face's triangles (a notched strip is concave:
            m = to_root @ o.matrix_world                                # its centroid can fall in the bore)
            o.data.calc_loop_triangles()
            for tri in o.data.loop_triangles:
                a, b, c = (m @ o.data.vertices[i].co for i in tri.vertices)
                for q in ((a + b + c) / 3, a.lerp((b + c) / 2, 0.1), b.lerp((a + c) / 2, 0.1), c.lerp((a + b) / 2, 0.1)):
                    off = max(off, real.find_nearest(q)[3])
        if off > SANE_TOL:
            out["fidelity"].append(f"{part.name} ({off:.3f} off)")
        # ② COVERAGE (a part with an OUTER proxy): every real outer face — facing out of the part itself — near a proxy face
        if any(o.name.endswith("_outer") for o in mine):
            gaps, where = 0, []
            body = [o for o in meshes if o.name.endswith("_mesh")]       # the part's body (its rings, grommets: decoration, no route)
            hp = hull([to_root @ o.matrix_world @ v.co for o in body for v in o.data.vertices])
            hv = [v.co.copy() for v in hp.verts]
            hf = [[v.index for v in f.verts] for f in hp.faces]
            hp.free()
            shell = _BVH.FromPolygons(hv, hf)
            for o in body:
                m = to_root @ o.matrix_world
                o.data.calc_loop_triangles()
                for tri in o.data.loop_triangles:                          # INSIDE each triangle (a big face's corners touch other proxies:
                    a, b, c3 = (m @ o.data.vertices[i].co for i in tri.vertices)   # its centroid and corners missed a strip at its end)
                    tn = (m.to_3x3() @ tri.normal).normalized()
                    for q in ((a + b + c3) / 3, a.lerp((b + c3) / 2, 0.15), b.lerp((a + c3) / 2, 0.15), c3.lerp((a + b) / 2, 0.15)):
                        hit = shell.find_nearest(q)
                        # on its OUTER shell AND facing as the shell does there (an inner wall just under the rim is near the shell, not on it)
                        if hit[3] > 0.006 or hit[1].normalized().dot(tn) < 0.9:
                            continue
                        if proxy.find_nearest(q)[3] > SANE_TOL:
                            gaps += 1
                            where.append(q)
                            break
            if gaps:
                xs_ = sorted({round(q.x, 2) for q in where}); ys_ = sorted({round(q.y, 2) for q in where}); zs_ = sorted({round(q.z, 2) for q in where})
                out["coverage"].append(f"{part.name} ({gaps} real outer faces off every proxy, at x {xs_[:6]}… y {ys_[:6]}… z {zs_[:6]}…)")
        for o in mine:
            bm = bmesh.new()
            bm.from_mesh(o.data)
            m = to_root @ o.matrix_world
            other_objs = [q for q in real_proxies if q is not o]
            others = tree_of(other_objs)
            all_tree = tree_of(real_proxies)                  # EVERY proxy face, this object's too (a crack between two strips of one proxy)
            face_key = [(q.name, pl.index) for q in real_proxies for pl in q.data.polygons]
            face_owner = [q.parent.name for q in real_proxies for _ in q.data.polygons]
            # ③ CONTINUITY: a boundary edge with another proxy face NEARLY touching it — a crack
            cracks, steps = [], []
            for e in bm.edges:
                if len(e.link_faces) == 1 and all_tree is not None:
                    mid = m @ ((e.verts[0].co + e.verts[1].co) / 2)
                    own = (o.name, e.link_faces[0].index)
                    rng = [h for h in all_tree.find_nearest_range(mid, SANE_CRACK) if face_key[tri_src(all_tree, h[2])] != own]
                    if any(h[3] < SANE_TOL for h in rng):             # TOUCHING another face (a T-junction, a fold): connected — no crack
                        continue
                    near = rng
                    if not near:
                        continue
                    loc, nrm, idx, d = min(near, key=lambda h: h[3])
                    # a CRACK only over real material OF THE TWO PARTS: the gap's middle on one of them (over an opening — a half-hole, a cavity —
                    # or another part passing through it, the proxy is right to stop)
                    probe = (mid + loc) / 2
                    if not (0.01 < d < SANE_CRACK):                   # under 0.01 (≈ 1.4 mm): two polygons' tessellation at a round rim, no gap
                        continue
                    fn = (m.to_3x3() @ e.link_faces[0].normal).normalized()
                    if nrm.normalized().dot(fn) < 0.99:               # not facing the SAME way (a side at a corner; a SEAT's other face, facing
                                                                      # back in the same plane — two parts pressed together): no crack
                        continue
                    ed = (m @ e.verts[1].co - m @ e.verts[0].co).normalized()
                    gap = loc - mid
                    if (gap - ed * gap.dot(ed)).length < 0.01:        # ALONG the edge (the next strip after a cut, the line carrying on): no crack
                        continue
                    if abs((loc - mid).dot(fn)) > SANE_TOL:          # off the plane: a STEP (a disc on its ring), not a gap to fall into
                        steps.append(abs((loc - mid).dot(fn)))
                        continue
                    def on_plane(t):                                  # real material IN THE PROXY'S PLANE (a hole's own wall is not)
                        if t is None:
                            return False
                        hit = t.find_nearest(probe)
                        return hit[3] < 0.001 and abs(hit[1].normalized().dot(fn)) > 0.95   # IN the plane (a hole's rim is 0.003 off)
                    if on_plane(part_trees[part.name]) or on_plane(part_trees[face_owner[tri_src(all_tree, idx)]]):
                        cracks.append((d, mid))
            if steps:
                out["steps"].append(f"{o.name} (up to {max(steps):.4f})")
            if cracks:
                d, mid = max(cracks, key=lambda c: c[0])
                out["continuity"].append(f"{o.name} ({len(cracks)} edges a crack off another proxy, the widest {d:.3f} at "
                                         f"({mid.x:+.3f}, {mid.y:.3f}, {mid.z:+.3f}))")
            # ④ FLOATING islands and ⑤ REACHABILITY (narrow, tiny)
            seen, islands = set(), []
            for f in bm.faces:
                if f.index in seen:
                    continue
                stack, isl = [f], []
                while stack:
                    g = stack.pop()
                    if g.index in seen:
                        continue
                    seen.add(g.index)
                    isl.append(g)
                    stack += [h for e in g.edges for h in e.link_faces if h.index not in seen]
                islands.append(isl)
            for isl in islands:
                area = sum(f.calc_area() for f in isl)
                alone = others is None or min(others.find_nearest(m @ v.co)[3] for f in isl for v in f.verts) > SANE_TOL
                if alone and area < 0.05:                     # a SMALL proxy touching no other: named for a person to confirm (a crank's nose
                    out["alone"].append(f"{o.name} ({area:.4f})")          # is meant; a stray patch is not — fidelity cannot tell them apart)
            for f in bm.faces:
                a, per = f.calc_area(), f.calc_perimeter()
                if a < SANE_TINY or (per > 0 and 2 * a / per < SANE_NARROW):
                    out["reachability"].append(f"{o.name} (a face {a:.4f} / {2 * a / per if per else 0:.3f} wide)")
                    break
            # ⑥ SIMPLICITY: coplanar faces sharing an edge, off a deliberate cut (x = const through a hole) — needless splits
            needless = sum(1 for e in bm.edges if len(e.link_faces) == 2 and e.link_faces[0].normal.dot(e.link_faces[1].normal) > 0.99999
                           and abs(e.verts[0].co.x - e.verts[1].co.x) > 1e-6)
            if needless:
                out["simplicity"].append(f"{o.name} ({needless} needless splits)")
            bm.free()
    for part, coll in PARTS:                                                # ⑧ ORIENTATION VERIFIED: every real proxy faces OUT of its part
        meshes = [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render"]
        solid = tree_of(meshes) if meshes else None
        for o in [q for q in coll.objects if q.get("role") == "ufm" and not q.get("ghost") and "_rest" not in q.name]:
            m = to_root @ o.matrix_world
            bmo = bmesh.new()
            bmo.from_mesh(o.data)
            bmo.normal_update()
            wrong = sum(1 for f in bmo.faces
                        if solid is not None and _inside_tree(solid, m @ inner_point(f) + (m.to_3x3() @ f.normal).normalized() * 0.002)
                        and not _inside_tree(solid, m @ inner_point(f) - (m.to_3x3() @ f.normal).normalized() * 0.002))
            bmo.free()
            if wrong:
                out.setdefault("orientation", []).append(f"{o.name} ({wrong} facing in)")
    out.setdefault("orientation", [])
    for g in [o for o in bpy.data.objects if o.get("ghost")]:              # ⑦ no ghost OVER a real face (it fills openings only)
        t = tree_of(real_proxies)
        m = to_root @ g.matrix_world
        g.data.calc_loop_triangles()
        over = sum(1 for tri in g.data.loop_triangles
                   if t.find_nearest(m @ ((g.data.vertices[tri.vertices[0]].co + g.data.vertices[tri.vertices[1]].co + g.data.vertices[tri.vertices[2]].co) / 3))[3] < 1e-4)
        if over:
            out.setdefault("ghost overlap", []).append(f"{g.name} ({over} triangles over a real face)")
    out.setdefault("ghost overlap", [])
    dives, plunges = [], []
    route = tree_of(real_proxies)
    for g in [o for o in bpy.data.objects if o.get("ghost")]:
        m = to_root @ g.matrix_world
        edge_pts = [m @ v.co for v in g.data.vertices]
        d = min(route.find_nearest(q)[3] for q in edge_pts)
        dives.append(f"{g.name} {d:.3f}")
        if d > SANE_TOL:          # ⑩ FLUSH: a ghost IN THE PLANE WHERE ITS HOLE EXITS (the owner, 2026-11-13: *"the ghost face shall always be a
            out.setdefault("ghost flush", []).append(f"{g.name} ({d:.3f} recessed)")   # face aligned with the assembly face where the hole exits"*)
        if g.get("plunge") is not None:
            plunges.append(f"{g.name} → {g['plunge_to']} {g['plunge']:.3f}")
    out.setdefault("ghost flush", [])
    out["dives"] = []
    # ⑨ SUPERPOSED faces (the owner, 2026-11-13: *"you have a lot of superposed faces. check for example step 3. this is not caught by your
    # checks"*): a face lying ON another (same plane, its inside covered). SAME-facing = a duplicate (⛔ z-fighting, two faces for one route);
    # OPPOSITE-facing = a SEAT (two parts pressed together: the covered face unreachable once seated — listed, the game must skip it)
    seats = superposed(real_proxies, out, "superposed (proxies)")
    superposed([o for o in bpy.data.objects if o.type == "MESH" and o.get("role") == "render"], out, "superposed (meshes)", same_only=True)
    steps, alone = out.pop("steps"), out.pop("alone")
    out.pop("dives", None)
    print("PROXY SANITY: " + " · ".join(f"{k} {'✅' if not v else '⚠ ' + '; '.join(v)}" for k, v in out.items()))
    print("   real STEPS between proxies (climbed, not fallen into — information):", "; ".join(steps) if steps else "none")
    print("   small proxies ALONE (touching no other — confirm each is meant):", "; ".join(alone) if alone else "none")
    print("   SEATS (a proxy face pressed on another part's, facing back — unreachable once seated, the game skips it):",
          "; ".join(f"{a} on {b} ({n} faces)" for (a, b), n in sorted(seats.items())) if seats else "none")
    print("   PLUNGES (a ghost at a hole's mouth: the part rests there, the plunge snap carries it onto its seat — to build, QUEUE.md):",
          "; ".join(plunges) if plunges else "none")


proxy_sanity()


# ⭐ every ghost floor CONNECTED to its host's real surface (the owner, 2026-11-13: *"ghost floors shall be connected to real surfaces (not single
# small surfaces floating in the air)"*): each of its corners within 0.005 of the host part's own meshes
floating = []
for g in [o for o in bpy.data.objects if o.get("ghost")]:
    host = g.parent
    tv, tp = [], []
    for o in host.children:
        if o.type == "MESH" and o.get("role") == "render":
            m, base = YUP_ROOT.matrix_world.inverted() @ o.matrix_world, len(tv)
            tv += [m @ v.co for v in o.data.vertices]
            tp += [[base + i for i in pl.vertices] for pl in o.data.polygons]
    t = tri_bvh(tv, tp)
    gm = YUP_ROOT.matrix_world.inverted() @ g.matrix_world
    gap = max(t.find_nearest(gm @ v.co)[3] for v in g.data.vertices)
    if gap > 0.005:
        floating.append(f"{g.name} ({gap:.3f} off)")
print("ghost floors CONNECTED to real surfaces:", "✅ every one" if not floating else "⚠ floating — " + "; ".join(floating))
print("redundant geometry (every visible mesh and proxy):", "✅ none" if not bad else "⛔ " + "; ".join(bad))
# ⭐ FLAT CAPS SHADED FLAT (the owner, 2026-11-13: the pistons' crowns): every face of more than 4 sides on a smooth object — its shading
# normals (auto smooth's split normals) within 1° of the face's own
leaning = []
for o in bpy.data.objects:
    if o.type == "MESH" and o.get("role") == "render" and o.data.use_auto_smooth:
        me = o.data
        me.calc_normals_split()
        worst = max((math.degrees(me.loops[li].normal.angle(pl.normal, 0)) for pl in me.polygons if len(pl.vertices) > 4 for li in pl.loop_indices),
                    default=0)
        if worst > 1:
            leaning.append(f"{o.name} ({worst:.1f}°)")
print("FLAT CAPS shaded flat (every face of more than 4 sides, its normals within 1°):",
      "✅ every one" if not leaning else f"⛔ {len(leaning)} — " + "; ".join(sorted(leaning)))
# ⭐ THE CROWNS IN QUADS (revision 2, the owner, 2026-11-14: *"does not follow the state of the art quad drawing … shows fake facets"*): FLAT CAPS
# reads only faces of more than 4 sides — blind to a crown drawn in quads. Each piston's top (the faces within PISTON_H / 4 of its crown): no
# face of more than 4 sides; triangles only at the pockets' run-outs (2 a pocket); every FLAT face there (the crown, the floors: normal within 20°
# of the bore's) shaded flat (its split normals within 1°); every quad's corners between 30° and 150°, planar (1e-6)
crown_bad, crown_stats = [], []
if STEP >= 6:
    for side_, i_, x_, name_ in CYLS:
        o = bpy.data.objects[f"{PISTON_IDS[name_]}_piston_mesh"]
        me = o.data
        me.calc_normals_split()
        yc = PISTON_Y + PISTON_H / 2
        top = [pl for pl in me.polygons if all(me.vertices[v].co.y > yc - PISTON_H / 4 for v in pl.vertices)]
        ngons = sum(1 for pl in top if len(pl.vertices) > 4)
        tris = sum(1 for pl in top if len(pl.vertices) == 3)
        flat = [pl for pl in top if pl.normal.y > math.cos(math.radians(20))]
        folded = sum(1 for pl in top if pl.normal.y < -0.5)             # a quad folded over its neighbours faces DOWN once the normals agree
        lean = max((math.degrees(me.loops[li].normal.angle(pl.normal, 0)) for pl in flat for li in pl.loop_indices), default=0)
        angles, skew = [], 0.0
        for pl in top:
            if len(pl.vertices) != 4:
                continue
            q = [me.vertices[v].co for v in pl.vertices]
            angles += [math.degrees((q[(a + 1) % 4] - q[a]).angle(q[(a - 1) % 4] - q[a], 0)) for a in range(4)]
            skew = max(skew, abs((q[3] - q[0]).dot((q[1] - q[0]).cross(q[2] - q[0]).normalized())))
        lo_a, hi_a = min(angles), max(angles)
        crown_stats.append(f"{name_} {len(top)} faces ({tris} triangles), corners {lo_a:.0f}°–{hi_a:.0f}°, lean {lean:.2f}°")
        if ngons or folded or tris != 4 or lean > 1 or lo_a < 30 or hi_a > 150 or skew > 1e-6:
            crown_bad.append(f"{name_} ({ngons} n-gons, {folded} folded, {tris} triangles, lean {lean:.1f}°, corners {lo_a:.0f}°–{hi_a:.0f}°, off plane {skew:.1e})")
    print("CROWNS IN QUADS (no n-gon, a triangle only at each pocket's run-out, flat faces shaded flat, corners 30°–150°, planar):",
          "✅ every piston" if not crown_bad else f"⛔ {len(crown_bad)} — " + "; ".join(crown_bad))
    print("  " + " · ".join(crown_stats))
# ⭐ COLLISION SIMPLICITY (the owner, 2026-11-13: *"check the md files why these exhaust connectors and valve caps faces have failed the checks for
# simplification"* — no check read a collision piece's SHAPE: the exhausts' hulls were 216 triangles, slivers 0.9° wide): every UCX_ piece a simple
# shape — at most UCX_MAX_VERTS vertices and UCX_MAX_TRIS triangles (a 12-sided cylinder: 24, 44; a box: 8, 12)
UCX_MAX_VERTS, UCX_MAX_TRIS = 24, 48
heavy = []
for o in bpy.data.objects:
    if o.get("role") == "ucx":
        o.data.calc_loop_triangles()
        nv, nt = len(o.data.vertices), len(o.data.loop_triangles)
        if nv > UCX_MAX_VERTS or nt > UCX_MAX_TRIS:
            heavy.append(f"{o.name} ({nv} vertices, {nt} triangles)")
print(f"COLLISION SIMPLICITY (every UCX_ piece ≤ {UCX_MAX_VERTS} vertices, ≤ {UCX_MAX_TRIS} triangles):",
      "✅ every piece" if not heavy else f"⛔ {len(heavy)} — " + "; ".join(sorted(heavy)))


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
                for pts in (rod_outline_points(side, i, x, theta=th, cap=True), piston_body_points(side, i, x, theta=th)):
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

# ================================================================ STEP 10 — THE EXPORT: one .glb beside the .blend (W4; PART_AUTHORING.md §4.4)
# Every part's subtree under YUP_ROOT — render meshes, UCX_ collision pieces, UFM_ face proxies and ghosts, MC_ seat markers, HINGE_ pivots —
# with their custom properties as glTF `extras`; +Y up; textures embedded; at the GOAL pose (θ = 0); ⛔ no PREVIEW, no keyframes (the game
# computes the motion, §5), no camera, no light. Then the file READ BACK and checked: names, extras, the markers' places and axes.
GLB = BLEND_STEM + ".glb"


def export_glb(path, yup=True, valves_closed=True):
    # ⛔ the preview's KEYFRAMES drive the movers: each update re-evaluates them at the current frame (frame 1 = θ 0, two valves open) and
    # overwrites any pose set by hand — the first run of ⑫ found the valves still open after apply_pose. Detached for the export, then back.
    actions = {o.name: o.animation_data.action for o in bpy.data.objects if o.animation_data and o.animation_data.action}
    for n in actions:
        bpy.data.objects[n].animation_data.action = None
    apply_pose(engine_pose(0, valves_closed))                    # the goal (the valves closed)
    to_root = YUP_ROOT.matrix_world.inverted()
    bpy.context.view_layer.update()
    preview = {o.name for o in PREVIEW.all_objects}
    keep = [YUP_ROOT] + [o for o in YUP_ROOT.children_recursive if o.name not in preview]
    for o in keep:                                               # each marker and hinge says its frame IN REFERENCE UNITS (y up):
        if o.get("role") == "seat" or o.name.startswith("HINGE_"):  # the game never undoes Blender's axis conversion
            m = to_root @ o.matrix_world
            o["position"] = [round(c, 6) for c in m.translation]
            o["normal" if o.get("role") == "seat" else "axis_dir"] = [round(c, 6) for c in (m.to_3x3() @ Vector((0, 0, 1) if o.get("role") == "seat" else (1, 0, 0))).normalized()]
            o["twist"] = [round(c, 6) for c in (m.to_3x3() @ Vector((1, 0, 0))).normalized()]
    for m in MAT.values():                                       # each material as defined (a step's close-up preview raises the glass to 0.6)
        if m.use_nodes:
            m.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = m.diffuse_color[3]
        m.use_backface_culling = True                            # ⭐ ONE-SIDED (glTF doubleSided false): the game draws front faces only — the
                                                                 # inside-out check's premise; the glass's back faces hidden as in Blender's preview
    for o in keep:                                               # the collision pieces SMOOTH: never drawn, so their faces share vertices
        if o.get("role") == "ucx":                               # (flat, every face its own: 10,346 vertices for 4,136 triangles)
            for pl in o.data.polygons:
                pl.use_smooth = True
            o.data.use_auto_smooth = False
    hidden = {o.name: o.hide_get() for o in keep}
    for o in bpy.data.objects:
        o.select_set(False)
    for o in keep:
        o.hide_set(False)
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_extras=True, export_yup=yup,
                              export_apply=False, export_animations=False, export_cameras=False, export_lights=False)
    for o in keep:
        o.select_set(False)
        o.hide_set(hidden[o.name])
    for n, act in actions.items():
        bpy.data.objects[n].animation_data.action = act
    return keep


def read_glb(path):
    import struct
    with open(path, "rb") as fh:
        data = fh.read()
    n = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20:20 + n].decode("utf-8")), len(data)


def glb_world(gl):
    """Each node's world matrix (glTF's own: TRS down the tree)."""
    from mathutils import Quaternion
    nodes, parent = gl["nodes"], {}
    for i, nd in enumerate(nodes):
        for c in nd.get("children", []):
            parent[c] = i
    def local(nd):
        if "matrix" in nd:
            return Matrix([nd["matrix"][r::4] for r in range(4)])
        t = Matrix.Translation(nd.get("translation", (0, 0, 0)))
        x, y, z, w = nd.get("rotation", (0, 0, 0, 1))
        sc = nd.get("scale", (1, 1, 1))
        return t @ Quaternion((w, x, y, z)).to_matrix().to_4x4() @ Matrix.Diagonal((*sc, 1))
    out = {}
    def world(i):
        if i not in out:
            out[i] = (world(parent[i]) if i in parent else Matrix()) @ local(nodes[i])
        return out[i]
    return {nodes[i]["name"]: world(i) for i in range(len(nodes))}


def check_glb(path, keep, label="the export"):
    gl, size = read_glb(path)
    by_name = {nd["name"]: nd for nd in gl["nodes"]}
    W = glb_world(gl)
    to_root = YUP_ROOT.matrix_world.inverted()
    bad = []
    # ⛔ the expected set INDEPENDENT of the export's list (its first run exported the root alone, and a check against that list passed it):
    # every object of every part's collection, and the root
    expected = {"YUP_ROOT", "FLOOR"} | {o.name for p, c in PARTS for o in c.objects}
    missing = sorted(expected - set(by_name))
    extra = sorted(set(by_name) - expected)
    if missing or extra:
        bad.append(f"nodes missing {missing[:5]} / unexpected {extra[:5]}")
    if sum(1 for nm in by_name if bpy.data.objects.get(nm) and bpy.data.objects[nm].get("part_id")) != len(PARTS):
        bad.append(f"parts exported ≠ the {len(PARTS)} built")
    lost = [f"{o.name}.{k}" for o in keep for k in o.keys() if k not in by_name.get(o.name, {}).get("extras", {})]
    if lost:
        bad.append(f"{len(lost)} custom properties not carried: {lost[:5]}")
    # ⭐ the AXES: each marker's glTF world place and its normal (glTF local +Y = Blender's local +Z) = the reference's — y up, the same units
    off = 0.0
    for o in keep:
        if o.get("role") == "seat" and o.name in W:
            m = to_root @ o.matrix_world
            off = max(off, (W[o.name].translation - m.translation).length,
                      ((W[o.name].to_3x3() @ Vector((0, 1, 0))) - (m.to_3x3() @ Vector((0, 0, 1)))).length)
    if off > 1e-4:
        bad.append(f"the markers' places / normals off the reference by {off:.4f} (the axes)")
    # ⭐ ⑫ THE BUILT POSE: every exported node where it was BUILT — its place and its axes (glTF local x, y, z = Blender's x, z, −y). A piece
    # exported in another pose leaves its collision pieces and proxies behind (the valves exported part open: their caps off their cylinders)
    moved = []
    for nm, m in BUILT.items():
        if nm not in W:
            continue
        g = W[nm]
        d = max((g @ Vector(a) - m @ Vector(b)).length for a, b in (((0, 0, 0), (0, 0, 0)), ((1, 0, 0), (1, 0, 0)), ((0, 1, 0), (0, 0, 1)),
                                                                   ((0, 0, 1), (0, -1, 0))))
        if d > 1e-4:
            moved.append((d, nm))
    if moved:
        moved.sort(reverse=True)
        bad.append(f"{len(moved)} nodes NOT where they were built (the look off its collision and proxies): " +
                   ", ".join(f"{nm} {d:.3f}" for d, nm in moved[:6]))
    _baked = [o.name for o in keep if o.type == "MESH" and o.data.color_attributes.get("AO") is not None]
    _no_color = [n for n in _baked if not any("COLOR_0" in pr["attributes"] for pr in gl["meshes"][by_name[n]["mesh"]]["primitives"])]
    if _no_color:
        bad.append(f"{len(_no_color)} baked meshes exported WITHOUT their contact shadows (COLOR_0): {_no_color[:4]}")
    if by_name.get("FLOOR", {}).get("extras", {}).get("role") != "floor":
        bad.append("the FLOOR not exported with its role floor")
    for k in ("animations", "cameras"):
        if gl.get(k):
            bad.append(f"{len(gl[k])} {k} exported")
    if any(m.get("doubleSided") for m in gl.get("materials", [])):
        bad.append("a material double-sided")
    if any("uri" in im for im in gl.get("images", [])):
        bad.append("an image NOT embedded")
    verts = sum(gl["accessors"][pr["attributes"]["POSITION"]]["count"] for me in gl.get("meshes", []) for pr in me["primitives"])
    kinds = {r: sum(1 for o in keep if (o.get("role") == r)) for r in ("render", "ucx", "ufm", "seat")}
    print(f"{label} → {os.path.basename(path)}: {size / 1e6:.2f} MB, {len(gl['nodes'])} nodes ({sum(1 for o in keep if o.get('part_id'))} parts, "
          f"{kinds['render']} render meshes, {kinds['ucx']} UCX, {kinds['ufm']} UFM incl. {sum(1 for o in keep if o.get('ghost'))} ghosts, "
          f"{kinds['seat']} seat markers, {sum(1 for o in keep if o.name.startswith('HINGE_'))} hinges), {verts} vertices as exported, "
          f"{len(gl.get('materials', []))} materials, {len(gl.get('images', []))} images embedded — "
          + ("✅ read back: every node, every custom property, the markers' places and normals in reference units (y up)" if not bad
             else "⛔ " + "; ".join(bad)))
    return not bad


# ================================================================ ⭐⭐ THE CONTACT SHADOWS, BAKED — per part and per PAIR (`SCENE_SETUP.md` §6.3)
# (the owner, 2026-11-13: *"we will need a strategy to manage shadows as the assembly gets built by the player as baking from final assembly will not
# work during the steps of assembly"* · *"we may need to bake at each step of assembly to trigger when a part is seated"*). The plan is a PARTIAL order
# (several orders valid), so no bake per step: each part's OWN occlusion → its vertex colours (`AO`, exported as COLOR_0, always on), and per PAIR
# (A, B) the term bake(A + B) / bake(A alone) on A's vertices → `<scene>_contact.json`; the game multiplies the terms of the pairs whose two parts
# are SEATED (any order: a product). Ambient occlusion fields (Kontkanen & Laine 2005), proximity shadows (Malmer et al. 2007), occluders accumulated
# (Iwanicki 2013) — here at the KNOWN goal places, so no field.
# ⚠ OPAQUE meshes only: the glass neither receives nor occludes (Cycles' AO counts it solid — the cases would blacken all inside them). The floor:
# one face (its outline is the D196 contour) — no vertices to carry a contact shadow; the key light's shadow does it.
AO_DIST = 0.3                                    # the reach of a contact shadow, reference units (4.2 cm)
AO_SAMPLES = 128
CONTACT_JSON = BLEND_STEM + "_contact.json"
TERM_KEEP = 0.97                                 # a factor kept below it: a darkening under 3 % is not seen (0.995 first: 283 terms, 476 kB)
AO_NOISE = 0.06                                  # a bake's own noise (128 samples): an occluder added may not BRIGHTEN a vertex by more
CONTACT_TOL = 0.08                               # self × Π terms vs a true full bake: the mean error over EACH term's vertices (⛔ a p95 over all the
                                                 # vertices first: blind — its control, one term dropped, moved it 0.034 → 0.037)


def opaque_render(coll):
    return [o for o in coll.objects if o.type == "MESH" and o.get("role") == "render" and not o.get("metadata")
            and o.material_slots and all(s.material is not None and s.material.diffuse_color[3] >= 1 for s in o.material_slots)]


def bake_ao(receivers, occluders):
    """Cycles' AO baked into each receiver's `AO` colour attribute (per vertex), with only `occluders` (and the receivers) seen. Returns {name: [v]}."""
    seen = set(occluders) | set(receivers)
    saved = {o.name: o.hide_render for o in bpy.data.objects if o.type == "MESH"}
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.hide_render = o not in seen
    for o in bpy.data.objects:
        o.select_set(False)
    for o in receivers:
        me = o.data
        attr = me.color_attributes.get("AO") or me.color_attributes.new("AO", "FLOAT_COLOR", "POINT")
        me.color_attributes.active_color = attr
        me.color_attributes.render_color_index = list(me.color_attributes).index(attr)
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = receivers[0]
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS", use_clear=True)
    out = {o.name: [c.color[0] for c in o.data.color_attributes["AO"].data] for o in receivers}
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.hide_render = saved[o.name]
    return out


def world_box(objs):
    to_root = YUP_ROOT.matrix_world.inverted()
    pts = [to_root @ o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)])


def box_gap(a, b):
    return max(0.0, max(max(a[0][i] - b[1][i], b[0][i] - a[1][i]) for i in range(3)))


def bake_contact(drop_one=False):
    """The bake, its terms, the sidecar, the checks. `drop_one`: the control — the largest term left out must FAIL the product check."""
    actions = {o.name: o.animation_data.action for o in bpy.data.objects if o.animation_data and o.animation_data.action}
    for n in actions:                                       # ⛔ the preview's keyframes would re-pose the valves (PART_AUTHORING.md §4.4 item 5)
        bpy.data.objects[n].animation_data.action = None
    apply_pose(engine_pose(0, valves_closed=True))
    engine_was = scene.render.engine
    scene.render.engine = "CYCLES"
    scene.cycles.samples = AO_SAMPLES
    scene.world.light_settings.distance = AO_DIST
    parts = [(p, opaque_render(c)) for p, c in PARTS]
    parts = [(p, ms) for p, ms in parts if ms]
    floor = [bpy.data.objects["FLOOR"]]
    self_ao = {}
    for p, ms in parts:
        self_ao.update(bake_ao(ms, ms + floor))
    boxes = {p.name: world_box(ms) for p, ms in parts}
    terms, raw_max = [], 0.0
    for pa, ma in parts:
        for pb, mb in parts:
            if pa is pb or box_gap(boxes[pa.name], boxes[pb.name]) > AO_DIST:
                continue
            both = bake_ao(ma, ma + mb + floor)
            for o in ma:
                fs = []
                for i, (vs, vb) in enumerate(zip(self_ao[o.name], both[o.name])):
                    raw_max = max(raw_max, vb - vs)              # ⚠ in ABSOLUTE terms: the ratio inflates the noise where vs is small (1.458 seen)
                    f = min(1.0, vb / max(vs, 1e-3))
                    if f < TERM_KEEP and vs - vb >= 1 - TERM_KEEP:   # ⚠ AND darker in absolute terms: on a dark vertex the noise alone makes ratios
                                                                     # below 0.97 (251 terms, 346 kB of mostly noise)
                        fs.append((i, f))
                if fs:
                    terms.append({"mesh": o.name, "part": pa["part_id"], "by": pb["part_id"], "idx": fs})
    # ⭐ the CHECK: self × Π terms at the full assembly = a TRUE full bake
    allm = [o for p, ms in parts for o in ms]
    full = bake_ao(allm, allm + floor)
    used = terms
    if drop_one and terms:
        worst = max(terms, key=lambda t: sum(1 - f for i, f in t["idx"]) / len(t["idx"]))      # the darkest term on average
        used = [t for t in terms if t is not worst]
    pred = {n: list(v) for n, v in self_ao.items()}
    for t in used:
        for i, f in t["idx"]:
            pred[t["mesh"]][i] *= f
    # ⭐ LOCAL: per term, the mean error over its own vertices — a missing pair shows as its whole darkening
    per_term = [(sum(abs(pred[t["mesh"]][i] - full[t["mesh"]][i]) for i, f in t["idx"]) / len(t["idx"]), t) for t in terms]
    p95, worst_t = max(per_term, key=lambda e: e[0]) if per_term else (0.0, None)
    errs = per_term
    # the self AO left in the attribute: what the .glb exports as COLOR_0
    for o in allm:
        for c, v in zip(o.data.color_attributes["AO"].data, self_ao[o.name]):
            c.color = (v, v, v, 1.0)
    scene.render.engine = engine_was
    for n, act in actions.items():
        bpy.data.objects[n].animation_data.action = act
    return terms, raw_max, p95, len(errs), allm


def write_contact(terms, allm):
    """The sidecar: each term's receiver mesh, its part, its occluder part, and per vertex its glTF-local position (Blender's (x, y, z) → (x, z, −y))
    and factor. The game finds the vertices by position (the exporter splits and reorders vertices)."""
    by_name = {o.name: o for o in allm}
    out = []
    for t in terms:
        vs = by_name[t["mesh"]].data.vertices
        out.append({"mesh": t["mesh"], "part": t["part"], "by": t["by"],
                    "points": [[round(vs[i].co.x, 4), round(vs[i].co.z, 4), round(-vs[i].co.y, 4), round(f, 3)] for i, f in t["idx"]]})
    with open(CONTACT_JSON, "w", encoding="utf-8") as fh:
        json.dump({"about": "Scene_2's contact shadows per PAIR (SCENE_SETUP.md §6.3): a term applies when both its parts are seated; factors multiply",
                   "version": 1, "aoDistance": AO_DIST, "terms": out}, fh, separators=(",", ":"))
    return os.path.getsize(CONTACT_JSON)


if STEP >= 10:
    _terms, _raw, _p95, _n, _allm = bake_contact()
    _size = write_contact(_terms, _allm)
    print(f"CONTACT SHADOWS baked (opaque meshes: {len(_allm)}; reach {AO_DIST}): {len(_terms)} pair terms, {_size / 1000:.1f} kB; every term darkens "
          f"only: {'✅' if _raw <= AO_NOISE else '⛔'} (the most an occluder brightened a vertex: {_raw:+.3f}, noise {AO_NOISE}); self × Π terms vs a full "
          f"bake, the worst term's mean error {_p95:.3f} over {_n} terms: " + ("✅" if _p95 <= CONTACT_TOL else f"⛔ over {CONTACT_TOL}"))
    if os.environ.get("CHECK_CONTROLS"):                         # ⑬ the control: the largest term dropped must FAIL the product check
        _t2, _r2, _p2, _n2, _a2 = bake_contact(drop_one=True)
        print("the contact shadows' CONTROL (the darkest term dropped): " + (f"caught ✅ ({_p2:.3f})" if _p2 > CONTACT_TOL else f"⛔ NOT caught ({_p2:.3f})"))
        _terms, _raw, _p95, _n, _allm = bake_contact()             # the file's own bake back
        write_contact(_terms, _allm)
    kept = export_glb(GLB)
    check_glb(GLB, kept)
    if os.environ.get("CHECK_CONTROLS"):                         # ⑪ the control: the same export WITHOUT the +Y-up conversion must FAIL
        ctl = os.path.join(os.environ.get("TEMP", OUT_DIR), "scene2_control_zup.glb")
        export_glb(ctl, yup=False)
        print("the export's CONTROL (z up): " + ("⛔ NOT caught — the axes check is blind" if check_glb(ctl, kept, "  control")
                                                 else "caught ✅"))
        os.remove(ctl)
        ctl = os.path.join(os.environ.get("TEMP", OUT_DIR), "scene2_control_open_valves.glb")   # ⑫'s control: exported at θ 0 as it was
        export_glb(ctl, valves_closed=False)
        print("the built pose's CONTROL (the valves as at θ 0): " + ("⛔ NOT caught — the pose check is blind" if check_glb(ctl, kept, "  control")
                                                                     else "caught ✅"))
        os.remove(ctl)
        export_glb(GLB)                                          # the file's own pose back (the controls' exports moved the valves)

