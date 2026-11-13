"""
⭐ AN ATMOSPHERE PROPOSAL for Scene_2 — renders only, the .blend NOT saved (the owner, 2026-11-13: *"can you recreate this atmosphere for the scene
(lights, shadows of the objects and parts, environment) except the shadows coming from the light source (there is an effect of shadow from a curtain
which I do not want to replicate in our scene). Propose an image of our scene with such atmosphere so I can check if you got my point."*).

The reference (a pasta machine on a cream sculpted plinth): a HIGH-KEY studio —
  - ONE large, soft, warm KEY light, high and behind-left of the camera's view: long, soft shadows falling toward the front-right (no curtain gobo);
  - a bright CREAM surround: the background and the fill are the same warm off-white — no horizon, no dark sky;
  - soft CONTACT shadows (ambient occlusion) where a part meets another or the floor;
  - low contrast; the metal reflecting that soft white room.

Run:  blender -b Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.blend --python Assets/Blender/scripts/atmosphere_proposal.py
→ previews/atmosphere_A_yellow_floor.png, previews/atmosphere_B_cream_floor.png
"""
import math
import os

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "World0_Scene2_engine", "previews"))
scene = bpy.context.scene


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def ref_to_blender(p):
    return Vector((p[0], -p[2], p[1]))


CREAM = srgb("F2EBDF")          # the reference's backdrop

# ---- the game's mirrored lights OFF (the proposal replaces them)
for o in bpy.data.objects:
    if o.type == "LIGHT":
        o.hide_render = True

# ---- the KEY: one large, soft, warm area light, high, behind-left of the view
key_data = bpy.data.lights.new("Atmosphere_Key", "AREA")
key_data.shape, key_data.size = "DISK", 6.0
key_data.energy = 14000
key_data.color = (1.0, 0.93, 0.84)
key = bpy.data.objects.new("Atmosphere_Key", key_data)
target = Vector((0.0, 1.0, 0.0))                                   # reference units: the engine's middle
key_pos = Vector((-6.0, 6.5, -8.0))
key.location = ref_to_blender(key_pos)
key.rotation_euler = (ref_to_blender(target) - key.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(key)

# ---- the WORLD: the cream room — its light the fill, the camera sees the same cream
world = bpy.data.worlds.new("Atmosphere")
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes["Background"]
bg.inputs["Color"].default_value = (*CREAM, 1)
bg.inputs["Strength"].default_value = 0.45
cam_bg = nt.nodes.new("ShaderNodeBackground")
cam_bg.inputs["Color"].default_value = (*CREAM, 1)
cam_bg.inputs["Strength"].default_value = 1.0
lp = nt.nodes.new("ShaderNodeLightPath")
mix = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
nt.links.new(bg.outputs["Background"], mix.inputs[1])
nt.links.new(cam_bg.outputs["Background"], mix.inputs[2])
nt.links.new(mix.outputs["Shader"], nt.nodes["World Output"].inputs["Surface"])
scene.world = world

# ---- Eevee: soft shadows, contact shadows (AO), reflections; low contrast
ee = scene.eevee
ee.taa_render_samples = 96
ee.use_soft_shadows = True
ee.shadow_cube_size, ee.shadow_cascade_size = "2048", "2048"
ee.use_gtao, ee.gtao_distance, ee.gtao_factor = True, 0.6, 1.2
ee.use_ssr, ee.use_ssr_refraction = True, False
ee.use_bloom = False
key_data.use_contact_shadow = True
scene.view_settings.view_transform = "Filmic"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = 0.0

# ---- the camera: perspective, a high three-quarter view as the reference's
cam = scene.camera
cam.data.type, cam.data.lens = "PERSP", 55
direction = Vector((-0.95, 0.75, 1.0)).normalized()
cam.location = ref_to_blender(target + direction * 13.0)
cam.rotation_euler = (ref_to_blender(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.resolution_x, scene.render.resolution_y = 1400, 950

# ---- hide the debug layers (collision, proxies, markers) — the look only
for o in bpy.data.objects:
    if o.get("role") in ("ucx", "ufm", "seat", "hinge"):
        o.hide_render = True

# ⭐ the WOOD a little paler and less orange, the grain kept (the owner: *"render C with this new wood texture"* — the reference's light beech): a
# Hue/Saturation/Value between the texture and the base colour — saturation × 0.8, value × 1.12
if os.environ.get("ATMOSPHERE_WOOD") == "lighter":
    wm = bpy.data.materials["WoodV"]
    wn = wm.node_tree
    bsdf = wn.nodes["Principled BSDF"]
    link = bsdf.inputs["Base Color"].links[0]
    src = link.from_socket
    wn.links.remove(link)
    hsv = wn.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value, hsv.inputs["Value"].default_value = 0.8, 1.12
    wn.links.new(src, hsv.inputs["Color"])
    wn.links.new(hsv.outputs["Color"], bsdf.inputs["Base Color"])
WOOD_TAG = "_lighter_wood" if os.environ.get("ATMOSPHERE_WOOD") == "lighter" else ""

floor = bpy.data.objects.get("FLOOR")
# C: halfway between the two, in linear light (the owner: *"propose a color in-between the two"*) — sRGB EFE5D0 (the yellow ECDFBF, the cream F2EBDF)
BETWEEN = tuple((a + b) / 2 for a, b in zip((0.84, 0.74, 0.52), CREAM))
ONLY = os.environ.get("ATMOSPHERE_ONLY")
for tag, colour in (("A_yellow_floor", None), ("B_cream_floor", CREAM), ("C_between_floor", BETWEEN)):
    if ONLY and ONLY not in tag:
        continue
    if floor is not None and colour is not None:
        floor.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*colour, 1)
    scene.render.filepath = os.path.join(OUT, f"atmosphere_{tag}{WOOD_TAG}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", scene.render.filepath)
