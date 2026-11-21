# GDD-04 - Locations, sets, props, cameras and lighting (DRAFT)

Date: 2026-11-22. Status: PENDING OWNER APPROVAL.

## Purpose
Build a reusable 3D set library for multiple series, allowing Codex to compose shots without manually remodeling environments each episode. Each series retains its style bible (CHAR-001 B). Assets may originate from Meshy or properly licensed external sources (MODEL-001 B, LICENSE-001 B).

## Proposed pipeline
1. Set brief: narrative purpose, style bible, scale, mood, required props, staging zones.
2. Generate/import geometry; validate materials, texture paths, normals, scale, polygon budgets and licenses.
3. Divide a location into reusable modules and set dressing presets; keep immutable asset versions.
4. Mark actor walkable/staging zones, collision proxies, interaction anchors, safe camera positions and visibility constraints.
5. Define prop interaction anchors and grip presets; validate character/rig compatibility.
6. Define shot templates: establishing, medium, close-up, tracking, overhead and portrait safe framing.
7. Define lighting rigs for daylight, evening, night, studio and moods; support per-shot overrides.
8. Render previews in 16:9 and 9:16; check framing, occlusion, clipping and lighting consistency.
9. Owner approval before shared catalog publication.

## Proposed manifests
Environment: id, version, series_style_id, origin, license_id, blend_source, glb_export, modular_parts, scale, bounds, staging_zones, camera_anchors, lighting_presets, render_profiles, checksum, approval_state.
Prop: id, version, scale, rig_interaction_profile, grip_anchors, collision_proxy, material_variants, license_id, checksum, approval_state.
ShotTemplate: id, camera_type, lens/ortho_scale, framing, target_actor, motion_path, safe_area_16_9, safe_area_9_16.
LightingPreset: id, world_settings, key/fill/rim lights, color_management, quality_profile.

## Technical boundaries
A generated mesh is not assumed to be collision-safe or animation-ready. Automatic camera selection must offer fallback and human review. A single shot may need separate framing for 16:9 and 9:16; do not assume center-cropping always works. High-resolution textures and heavy geometry must be capped for VPS previews.

## GDD-04 choices for approval
**WORLD-001 - Location sources**
A: only procedurally generated Blender environments.
B: Meshy/generated environments + imported licensed asset packs + manual Blender edits (recommended).
C: only handcrafted environments.

**MODULAR-001 - Reuse**
A: one unique complete environment per episode.
B: modular reusable locations, furniture, set dressing and variants (recommended).
C: one universal room for all series.

**PROP-001 - Interactive props**
A: props are purely decorative.
B: reusable props with grip anchors, interaction presets and character compatibility (recommended).
C: fully simulated physical interactions everywhere.

**CAMERA-001 - Cinematography**
A: fixed camera templates only.
B: automatic shot templates plus editable paths, targets and manual overrides (recommended).
C: AI free-camera movement with no restrictions.

**FRAME-001 - 16:9 and 9:16**
A: automatic crop of the same image.
B: separate safe-area rules and shot reframing for each aspect ratio (recommended).
C: produce two entirely separate scene projects.

**LIGHT-001 - Lighting**
A: one static lighting setup per location.
B: reusable lighting presets, time of day and per-shot overrides (recommended).
C: physically accurate path-traced lighting for every preview.

**SCENE-QA-001 - Validation**
A: only render and inspect final output.
B: automated geometry/occlusion/framing/performance checks plus visual approval (recommended).
C: no scene validation.

## Future implementation acceptance
- Reuse one approved nursery environment in two distinct shots without duplicating its source geometry.
- Place at least three props, one with a working interaction anchor.
- Render both 16:9 and 9:16 framing previews.
- Show two lighting presets and a camera transition.
- Reject a missing/unlicensed asset and report it.
- Preserve reproducibility by pinning environment/prop versions.

These are proposed acceptance criteria; no environment library is claimed to exist.
