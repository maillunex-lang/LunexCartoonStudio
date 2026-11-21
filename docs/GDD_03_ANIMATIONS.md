# GDD-03 - Animation library, sources, licensing and retargeting (DRAFT)

Date: 2026-11-22. Status: APPROVED 2026-11-22 for seven choices below. Implementation notes and exact source providers remain proposals.

## Purpose
A searchable, reusable library of animation clips for many cartoon series and rig families, with clear provenance, compatible retargeting, preview, blending and approval. Codex chooses semantic actions; the deterministic scene compiler translates them into Blender Actions/NLA strips and validates them.

## Design
- AnimationClip: id, semantic_tags, action_category, rig_family, source_rig_profile, fps, duration_frames, loop, root_motion_mode, contact_markers, event_markers, facial_channels, license_id, attribution, source_uri, source_version, checksum, preview_uri, approval_state.
- RigMapping: source/target bones, rest pose, axis conventions, scale, root motion, IK targets, exclusions and test status.
- LicenseRecord: origin, rights holder, license identifier, commercial use allowed, redistribution constraints, attribution, proof, expiry/changes, prohibited uses.
- AnimationVariation: speed range, mirrored option, offsets, pose variants and parameterization. Variations remain derived from a canonical source clip and retain provenance.
- Sequence: actor, clip, start/end frames, blend frames, upper/lower body masks, target object, IK and look-at targets, event markers.
- Avoid unrestricted cross-family retargeting. Human-to-bear is possible only with compatible skeletal mapping and visual QA; non-humanoid robots may need bespoke motion.
- NLA Actions and strips are the planned Blender composition primitive; confirm compatibility with the pinned Blender version before implementation.
- Source assets are stored outside Git, with immutable versioning; manifest and tests in Git.

## Candidate sources for evaluation (no source yet approved)
Licensed animation libraries (e.g. Mixamo, actor-specific marketplaces, open-source motion capture), Blender-created procedural motions and custom authored clips. Evaluate each actual license and redistribution terms before importing. Meshy is a model source under ASSET-001 C; do not assume its output automatically contains a reusable animation rig.

## Initial proposed target
50 approved base clips: locomotion 8; dance 10; emotion 10; education/gesture 8; prop interaction 8; misc 6. This is a target, not existing inventory. Add rig-specific variants when required.

## Automated validation
Asset file opens; action is non-empty; frame range valid; rig family/mapping compatible; missing bone/IK constraints reported; root motion checked; no severe foot sliding or mesh clipping in preview; source license recorded; preview renders. Some checks (expressiveness, collisions, foot contact) require human visual approval.

## GDD-03 approved choices
**SOURCE-001**
A - only free libraries.
B - free and paid licensed libraries plus our own animations (recommended).
C - generate every animation from scratch.

**LIBRARY-001**
A - fixed 50 clips only.
B - start with 50 and expand with tagging, variants and versioning (recommended).
C - import unlimited clips without moderation.

**RETARGET-001**
A - all rigs automatically, without review.
B - compatible rig families, automated checks and manual approval for new mappings (recommended).
C - no retargeting, unique animations for each character.

**BLEND-001**
A - only one clip at a time.
B - NLA blending, layered gestures, transitions, IK and procedural look-at where supported (recommended).
C - fully generative per-frame animation.

**LICENSE-001**
A - track only source URLs.
B - require proof of rights, commercial use check, attribution and reuse/redistribution limits before approval (recommended).
C - import without rights validation.

**AUTHOR-001**
A - import clips only.
B - import + Blender manual/procedural authoring + clip editing and versioning (recommended).
C - AI-only clip creation.

**PREVIEW-001**
A - technical file validation only.
B - automated thumbnail/video preview and mandatory visual approval before publishing to shared library (recommended).
C - skip preview.

Approved: SOURCE-001 B, LIBRARY-001 B, RETARGET-001 B, BLEND-001 B, LICENSE-001 B, AUTHOR-001 B, PREVIEW-001 B.

## Acceptance criteria after approval
- Import at least two legitimately licensed clips with evidence and one original clip.
- Demonstrate a loop and a blended transition in a Blender preview.
- Apply a clip to two compatible characters and reject an incompatible target.
- Confirm provenance is retained for derived variants.
- Show searchable catalog by action, mood, rig family, and approved status.
- Confirm a clip update does not silently alter previously published episodes.

## Deferred
Exact source providers, paid subscriptions, motion-capture options, licensing legal review, performance budgets and interface layout will be decided later. Do not infer that any source is licensed for redistribution merely because its download is free.
