# GDD-02 - Characters, 3D models, rigs and facial animation (DRAFT)

Status: APPROVED 2026-11-22. Six choices below are canonical. Other implementation details remain proposals.

## Goal
A reusable character library with stable visual identity, versioned 3D models, rig profiles, facial controls, animation compatibility and validated imports. Meshy AI is the selected model-generation source (ASSET-001 C), supplemented by licensed ready-made assets.

## Proposed character pipeline
1. Character brief and style bible (silhouette, proportions, palette, reference).
2. Generate or import source 3D model; store source metadata, rights, version and checksums.
3. Inspect mesh: topology, UV, materials, scale, orientation, poly budget and missing textures.
4. Rig or adapt skeleton; classify humanoid/quadruped/robot/custom.
5. Add face controls (blendshapes, bones, or modular expressions) with explicit compatibility.
6. Retarget compatible animation clips; test root motion, foot contact, IK and transitions.
7. Generate thumbnails and turntable preview; approve asset.
8. Publish immutable character version; preserve previous versions for old episodes.

## Required character manifest (concept)
id, version, display_name, source, license, attribution, mesh_files, texture_files, rig_profile, animation_compatibility, facial_profile, scale_meters, up_axis, forward_axis, material_profile, polycount, checksum, approval_state.

## Engineering notes
Meshy output is not assumed to have production-ready skeletons or facial blendshapes. Automate validation first; offer Blender-based cleanup and manual fallback. Never promise universal retargeting across unrelated rigs. Facial animation and prop interaction may require custom rigs. Keep an editable source file and a stable exported format.

## GDD-02 approved decisions
- CHAR-001: A - one shared style for all series; B - multiple series with separate style bibles (recommended); C - arbitrary style per episode.
- MODEL-001: A - Meshy only; B - Meshy plus import of external/licensed models (recommended); C - manual Blender models only.
- RIG-001: A - one humanoid rig; B - rig families (humanoid, quadruped, robot/custom) and retargeting within compatible families (recommended); C - unique rig per character.
- FACE-001: A - static expressions only; B - blendshapes or face bones with standard expression set and optional lip sync (recommended); C - advanced facial performance capture in MVP.
- QUALITY-001: A - automatic import without review; B - automated technical validation plus manual visual approval (recommended); C - full manual modeling QA.
- VARIANT-001: A - fixed appearance; B - reusable outfit/material/accessory variants per character (recommended); C - independently generated model for each appearance.

## Acceptance criteria for the eventual implementation
Import two character types, inspect and version their assets, preview a shared compatible clip, reject an incompatible clip with a readable reason, test at least three facial expressions, preserve license records, and reproduce an approved character appearance in a second episode.

Approved selections: CHAR-001 B, MODEL-001 B, RIG-001 B, FACE-001 B, QUALITY-001 B, VARIANT-001 B.
