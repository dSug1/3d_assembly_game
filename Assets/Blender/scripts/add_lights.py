"""Scene_1's three lights, the ambient fill and background, and the frozen plate — from lights.json,
which the game's own core/lighting.ts computed (direction, Kelvin x filter colour, URP illuminance at
the scene's centre). Unity/Babylon (x, y up, z depth) -> Blender (x, z, y), as for the pieces.
Run: npx vite-node Assets/Blender/scripts/scene_1_lights.ts > <tmp>/lights.json
     LIGHTS_JSON=<tmp>/lights.json blender -b Assets/Blender/scene_2.blend --python Assets/Blender/scripts/add_lights.py
K and F were MEASURED in Blender 3.4 Eevee by calibrate_lights.py; re-measure on another Blender version.
See Claude/30_OBJECTS_3D/spec/BLENDER_ASSETS.md."""
import bpy, json, math, os
from mathutils import Vector
J = json.load(open(os.environ["LIGHTS_JSON"]))
K = 0.5 / 0.4371170678641647          # measured: a sun of strength 1 renders a surface at 0.874 x its albedo
F = 0.08894340434628066               # measured: a spot's watt at 1 m, in sun-strength units
to_b = lambda v: Vector((v[0], v[2], v[1]))
bpy.context.preferences.filepaths.save_version = 0
s = bpy.context.scene
env = bpy.data.collections["Environment"]

old = bpy.data.objects.get("Light")          # the preview lamp goes; the scene's own lights replace it
if old:
    d = old.data; bpy.data.objects.remove(old, do_unlink=True)
    if d.users == 0: bpy.data.lights.remove(d)

target = to_b(J["target"])
for l in J["lights"]:
    o = bpy.data.objects.get(l["name"])
    if o: bpy.data.objects.remove(o, do_unlink=True)
    kind = "SPOT" if l["type"] == "SPOT" else "SUN"
    data = bpy.data.lights.new(l["name"], kind)
    o = bpy.data.objects.new(l["name"], data)
    env.objects.link(o)
    o.location = to_b(l["position"])
    fwd = to_b(l["forward"]).normalized()
    o.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()   # a Blender light shines along -Z
    data.color = l["colour"]
    e = l["illuminance"] * K
    if kind == "SUN":
        data.energy = e
        data.angle = math.radians(2.0)
    else:
        dist = (target - o.location).length
        data.energy = e * dist * dist / F
        data.spot_size = math.radians(l["spotOuterDeg"])
        data.spot_blend = (l["spotOuterDeg"] - l["spotInnerDeg"]) / l["spotOuterDeg"]
        data.shadow_soft_size = 1.0
        data.use_custom_distance = True; data.cutoff_distance = l["range"]
    data.use_shadow = True
    # ⭐ The owner's Unity values ride along, so the light can be traced back to the table.
    for k in ("intensity", "range", "spotOuterDeg", "spotInnerDeg", "kelvin"):
        if k in l: o[f"unity_{k}"] = l[k]
    o["unity_eulerDeg"] = l["eulerDeg"]; o["unity_filter"] = l["filter"]

# The background the camera sees, and the ambient FILL standing in for Unity's environment lighting.
# ⚠ Babylon's hemispheric fill lights a VERTICAL face at half its strength, so the uniform world is 0.5 x.
w = s.world or bpy.data.worlds.new("World"); s.world = w; w.use_nodes = True
nt = w.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputWorld")
bg_cam = nt.nodes.new("ShaderNodeBackground"); bg_cam.inputs["Color"].default_value = (*J["background"], 1)
bg_fill = nt.nodes.new("ShaderNodeBackground"); bg_fill.inputs["Color"].default_value = (1, 1, 1, 1)
bg_fill.inputs["Strength"].default_value = J["ambient"] * 0.5 * K
path = nt.nodes.new("ShaderNodeLightPath"); mix = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
nt.links.new(bg_fill.outputs["Background"], mix.inputs[1]); nt.links.new(bg_cam.outputs["Background"], mix.inputs[2])
nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
w.color = J["background"]

# The game has no tone mapping (SCENE_1.md §5): Standard, not Filmic.
s.view_settings.view_transform = "Standard"; s.view_settings.look = "None"
s.eevee.use_soft_shadows = True; s.eevee.shadow_cube_size = "1024"; s.eevee.shadow_cascade_size = "1024"

# ⭐ The frozen plate: the game's `frozen: true`, as a custom property (a .glb export can carry it as extras).
fl = bpy.data.objects["Floor"]; fl["frozen"] = True
bpy.ops.wm.save_mainfile()
for o in env.objects:
    if o.type == "LIGHT": print("LIGHT", o.name, o.data.type, "energy", round(o.data.energy, 2), "loc", tuple(round(v, 2) for v in o.location))
print("FROZEN", fl.name, fl.get("frozen"))
