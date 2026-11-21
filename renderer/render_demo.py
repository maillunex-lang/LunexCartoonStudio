"""S02: deterministic 15-second procedural Blender preview, no external assets required.

Run: blender -b -t 2 --python renderer/render_demo.py -- --output renders/bear_demo.mp4
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    return m

def sphere(name, pos, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=pos)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    ob.data.materials.append(mat)
    return ob

def cube(name, pos, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    ob.data.materials.append(mat)
    return ob

def animate(ob, path, frames):
    for frame, value in frames:
        setattr(ob, path, value)
        ob.keyframe_insert(data_path=path, frame=frame)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--output", default="renders/bear_demo.mp4")
    p.add_argument("--quality", choices=["preview", "final"], default="preview")
    args = p.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 640 if args.quality == "preview" else 1920
    scene.render.resolution_y = 360 if args.quality == "preview" else 1080
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 360
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    cream = material("cream_wall", (0.75, 0.88, 0.95))
    floor = material("floor", (0.93, 0.76, 0.55))
    brown = material("bear_brown", (0.42, 0.22, 0.12))
    tan = material("muzzle", (0.85, 0.62, 0.40))
    black = material("eyes", (0.015, 0.012, 0.01))
    blue = material("block_blue", (0.1, 0.4, 0.9))
    red = material("block_red", (0.9, 0.17, 0.15))
    yellow = material("block_yellow", (0.98, 0.8, 0.1))
    cube("floor", (0, 0, -0.15), (12, 12, 0.3), floor)
    cube("back_wall", (0, 3, 2.5), (12, 0.2, 5), cream)
    bpy.ops.object.empty_add(location=(0, 0, 0))
    root = bpy.context.object
    root.name = "bear_root"
    parts = [
        sphere("body", (0, 0, 1.1), (0.7, 0.5, 0.8), brown),
        sphere("head", (0, -0.08, 2.15), (0.65, 0.55, 0.55), brown),
        sphere("ear_left", (-0.5, 0, 2.55), (0.25, 0.18, 0.27), brown),
        sphere("ear_right", (0.5, 0, 2.55), (0.25, 0.18, 0.27), brown),
        sphere("muzzle", (0, -0.58, 2.0), (0.3, 0.16, 0.22), tan),
        sphere("nose", (0, -0.74, 2.12), (0.1, 0.08, 0.07), black),
        sphere("eye_left", (-0.23, -0.56, 2.3), (0.09, 0.06, 0.1), black),
        sphere("eye_right", (0.23, -0.56, 2.3), (0.09, 0.06, 0.1), black),
        sphere("leg_left", (-0.35, -0.02, 0.4), (0.25, 0.35, 0.4), brown),
        sphere("leg_right", (0.35, -0.02, 0.4), (0.25, 0.35, 0.4), brown),
    ]
    for ob in parts:
        ob.parent = root
        ob.matrix_parent_inverse = root.matrix_world.inverted()
    left = sphere("arm_left", (-0.8, 0, 1.5), (0.24, 0.28, 0.48), brown)
    right = sphere("arm_right", (0.8, 0, 1.5), (0.24, 0.28, 0.48), brown)
    for ob in (left, right):
        ob.parent = root
        ob.matrix_parent_inverse = root.matrix_world.inverted()
    # Five procedural motions: idle, wave, step, point, jump.
    for frame, z in [(1, 0), (72, 0.05), (144, 0), (216, 0), (288, 0.55), (324, 0), (360, 0)]:
        root.location.z = z
        root.keyframe_insert(data_path="location", frame=frame)
    for frame, angle in [(1, 0), (72, 0), (110, 0.6), (130, -0.5), (150, 0), (216, -0.35), (260, 0.45), (360, 0)]:
        right.rotation_euler.y = angle
        right.keyframe_insert(data_path="rotation_euler", frame=frame)
    for frame, x in [(1, 0), (150, 0), (190, 0.45), (230, 0.45), (270, 0), (360, 0)]:
        root.location.x = x
        root.keyframe_insert(data_path="location", frame=frame)
    for i, mat in enumerate([red, blue, yellow]):
        cube("count_block_" + str(i + 1), (1.5 + i * 0.65, -0.3, 0.35), (0.55, 0.55, 0.7), mat)
    bpy.ops.object.camera_add(location=(4, -9, 4))
    camera = bpy.context.object
    direction = Vector((0.4, 0, 1.3)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 7.5
    bpy.ops.object.light_add(type="AREA", location=(1, -4, 7))
    bpy.context.object.data.energy = 900
    bpy.context.object.data.shape = "DISK"
    bpy.context.object.data.size = 7
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(output.with_suffix("")) + "_"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.filepath = str(output)
    bpy.ops.render.render(animation=True)
    print("S02_RENDER_OUTPUT=" + str(output))

if __name__ == "__main__":
    main()
