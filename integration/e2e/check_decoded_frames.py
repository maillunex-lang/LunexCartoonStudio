#!/usr/bin/env python3
"""Validate decoded frames contain both test colors (green 3D box, orange 2D sprite).
Usage: python3 integration/e2e/check_decoded_frames.py /tmp/lunex-frames/frame-*.png
Requires Pillow. Use ffmpeg -vsync 0 -i video.webm /tmp/lunex-frames/frame-%03d.png
"""
import glob
import sys
from PIL import Image

files = sorted(f for pattern in sys.argv[1:] for f in glob.glob(pattern))
if not files:
    raise SystemExit("FAIL: no decoded frames")
indices = sorted(set([0, len(files) // 2, len(files) - 1]))
for i in indices:
    im = Image.open(files[i]).convert("RGB")
    pixels = list(im.get_flattened_data())
    green = sum(g > r * 1.5 and g > b * 1.5 and g > 65 for r, g, b in pixels)
    orange = sum(r > 130 and g > 55 and g < r * .85 and b < g * .85 for r, g, b in pixels)
    print(f"{files[i]}: green_3d={green}, orange_2d={orange}")
    if green < 1000 or orange < 100:
        raise SystemExit("FAIL: expected 2D or 3D pixels missing")
print(f"PASS: {len(files)} decoded frames; both layers in sampled frames")
