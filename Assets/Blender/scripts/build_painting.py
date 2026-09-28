"""Rebuild Scene_1's painting (the goal table) in the open .blend, from src/content/scene_1.ts.
Idempotent: the Painting collection and the Floor are rebuilt from scratch each run.
Run: blender -b Assets/Blender/scene_2.blend --python Assets/Blender/scripts/build_painting.py
See Claude/30_OBJECTS_3D/spec/BLENDER_ASSETS.md."""
import bpy, bmesh, re, math, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC = os.path.join(ROOT, "src", "content", "scene_1.ts")
ts = open(SRC, encoding="utf-8").read()
num = r"(-?\d+(?:\.\d+)?)"
rows = re.findall(r'\["(Piece\d+)", "(MAT_[A-F])", ' + ", ".join([num] * 6) + r"\]", ts)
pal = {m[0]: tuple(float(v) for v in m[1:]) for m in re.findall(r"(MAT_[A-F]): \[" + ", ".join([num] * 3) + r"\]", ts)}
margin = 0.03 / 2
assert re.search(r"SCENE_1_CONTOUR_MARGIN = 0\.03 / 2", ts), "the contour margin changed in scene_1.ts: update `margin`"
assert len(rows) == 41 and len(pal) == 6, (len(rows), len(pal))
NAMES = {"MAT_A": "White", "MAT_B": "Black", "MAT_C": "Yellow", "MAT_D": "Red", "MAT_E": "Blue", "MAT_F": "Sand"}

bpy.context.preferences.filepaths.save_version = 0
# ⛔ Rebuild from scratch: the Painting collection's objects and the Floor go first.
for c in ("Painting",):
    col = bpy.data.collections.get(c)
    for o in list(col.objects) if col else []:
        bpy.data.objects.remove(o, do_unlink=True)
if bpy.data.objects.get("Floor"):
    bpy.data.objects.remove(bpy.data.objects["Floor"], do_unlink=True)
for me in list(bpy.data.meshes):
    if me.users == 0: bpy.data.meshes.remove(me)

scene = bpy.context.scene
root = scene.collection
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in root.children: root.children.link(c)
    return c
painting, env = coll("Painting"), coll("Environment")
old = bpy.data.collections.get("Collection")
if old:
    for o in list(old.objects):
        old.objects.unlink(o); env.objects.link(o)
    bpy.data.collections.remove(old)

def material(name, rgb, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = 0.6
    b.inputs["Specular"].default_value = 0.0 if alpha < 1 else 0.3
    b.inputs["Alpha"].default_value = alpha
    m.diffuse_color = (*rgb, alpha)
    if alpha < 1:
        m.blend_method = "BLEND"; m.shadow_method = "NONE"; m.show_transparent_back = False
    return m

def box(name, dims, mat):
    """A box mesh baked at `dims`, centred on its origin — the object's scale stays 1."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = (v.co.x * dims[0], v.co.y * dims[1], v.co.z * dims[2])
    bm.to_mesh(me); bm.free()
    me.materials.append(mat)
    return bpy.data.objects.new(name, me)

# Unity/Babylon (x, y up, z depth) → Blender (x, depth, up): the swap a .glb export + Babylon's loader undoes.
to_b = lambda x, y, z: (x, z, y)
for pid, slot, x, y, z, sx, sy, sz in rows:
    x, y, z, sx, sy, sz = map(float, (x, y, z, sx, sy, sz))
    name = NAMES[slot]
    core_mat = material(f"Mat_{name}", pal[slot])
    shell_mat = material(f"Mat_{name}_Contour", pal[slot], 0.1)
    shell = box(pid, to_b(sx + 2 * margin, sy + 2 * margin, sz + 2 * margin), shell_mat)
    shell.location = to_b(x, y, z)
    painting.objects.link(shell)
    core = box(f"{pid}_core", to_b(sx, sy, sz), core_mat)
    core.parent = shell
    painting.objects.link(core)

fm = re.search(r"const FLOOR: BodySpec = \{[^}]*?position: \[0, (-?[\d.]+) - ([\d.]+), 0\][^}]*?dims: \[([\d.]+), ([\d.]+), ([\d.]+)\]", ts, re.S)
assert fm, "the FLOOR block changed shape in scene_1.ts"
top, half, fx, fy, fz = map(float, fm.groups())
floor = box("Floor", to_b(fx, fy, fz), material("Mat_Sand", pal["MAT_F"]))
floor.location = to_b(0, top - half, 0)  # the slab's TOP is the plane
floor["frozen"] = True  # the game's `frozen: true`; a .glb export carries it with Custom Properties ticked
env.objects.link(floor)

# Preview only (an asset ships no lights and the game has its own camera): face the painting.
cam = bpy.data.objects.get("Camera")
if cam:
    cam.location = (0.025, -13.0, 0.27); cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

bpy.ops.wm.save_mainfile()
print("BUILT", len(rows), "pieces;", len([o for o in painting.objects]), "objects in Painting")
