# S02 procedural render demo

The first demo intentionally uses a procedural placeholder bear, not a Meshy asset and not rigged animation clips. This tests the Blender headless pipeline without blocking on licensing or Meshy API.

Run with Blender 4.3+:
```bash
blender -b -t 2 --python renderer/render_demo.py -- --output renders/bear_demo.mp4 --quality preview
ffprobe -v error -show_entries format=duration -of default=nw=1 renders/bear_demo.mp4
```

Expected: 360 frames at 24 fps (15 seconds), silent 640x360 H264 MP4. Final quality flag produces 1920x1080, at significantly higher cost.

Known limitations: procedural placeholder geometry, simple keyframe motions rather than five imported animation clips, no lip sync, no asset resolver. S02 is not DONE until the video is rendered, inspected, and the time/cost recorded. S03-S06 will replace placeholders with licensed character assets and rigged clips.
