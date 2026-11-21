# Lunex GDD-01: MyMotionStudio integration slice

This is a reproducible patch for upstream MyMotionStudio pinned at commit `161414bc8e7ed45f5fc3e7a278d1759e243e33f4`. Keep upstream MIT license and copyright notices.

```bash
node integration/apply.mjs /path/to/my-motion-studio
cd /path/to/my-motion-studio
npm run typecheck && npm run test && npm run build
```

In an existing **3D project** the editor shows a Konva 2D overlay above the existing Three/R3F viewport. The `+ 2D слой` button inserts a simple animated sprite into the scene, stored as `scene.lunex2d` through the existing Zustand scene update. Existing IndexedDB autosave, JSON project backup and timeline currentTime are reused. The sprite position is driven by the existing timeline.

Scope: initial integration only. Does **not** yet add mixed layers to the standard layer inspector, drag-and-drop, export compositing, full cloud versions, or long-video export. The 2D overlay currently renders above 3D and does not provide arbitrary depth interleaving. Existing 2D-only and 3D-only projects are preserved. Run browser visual and export smoke before claiming full functionality.
