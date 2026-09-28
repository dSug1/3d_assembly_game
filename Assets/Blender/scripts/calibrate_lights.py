"""Measures the two constants add_lights.py uses (K, F): how bright Blender renders a sun of strength 1,
and how much a spot's watt at 1 m lights in sun-strength units. Eevee, Standard view, a grey plane.
Run: blender -b --python Assets/Blender/scripts/calibrate_lights.py   (factory settings; saves nothing)"""
import bpy, math, os, tempfile
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene; s.render.engine = 'BLENDER_EEVEE'
s.view_settings.view_transform = 'Standard'; s.view_settings.look = 'None'
s.render.resolution_x = s.render.resolution_y = 16
w = bpy.data.worlds.new("W"); w.color = (0, 0, 0); s.world = w
bpy.ops.mesh.primitive_plane_add(size=4); p = bpy.context.object  # faces +Z
m = bpy.data.materials.new("M"); m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.5, 0.5, 0.5, 1); b.inputs["Specular"].default_value = 0; b.inputs["Roughness"].default_value = 1
p.data.materials.append(m)
cam = bpy.data.objects.new("C", bpy.data.cameras.new("C")); s.collection.objects.link(cam); cam.location = (0, 0, 1); s.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 0.5
def shot(obj):
    s.collection.objects.link(obj);
    bpy.ops.render.render()
    img = bpy.data.images["Render Result"]; path = os.path.join(tempfile.gettempdir(), "blender_light_calibration.exr")
    img.save_render(path); im = bpy.data.images.load(path); px = im.pixels[:]
    v = sum(px[i] for i in range(0, len(px), 4)) / (len(px) / 4)
    bpy.data.images.remove(im); s.collection.objects.unlink(obj); return v
sun = bpy.data.objects.new("S", bpy.data.lights.new("S", 'SUN')); sun.data.energy = 1.0
vs = shot(sun)
d, P = 10.0, 1000.0
spot = bpy.data.objects.new("P", bpy.data.lights.new("P", 'SPOT')); spot.data.energy = P; spot.location = (0, 0, d); spot.data.spot_size = math.radians(60); spot.data.spot_blend = 0; spot.data.shadow_soft_size = 0
vp = shot(spot)
print("CAL sun1", vs, "spot", vp, "irradiance per watt at 1 m (sun units):", vp / vs * d * d / P)
