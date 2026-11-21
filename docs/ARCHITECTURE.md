# Architecture v0.1

Pipeline: scenario -> validated episode.json -> asset resolution -> Blender scene compiler -> low-cost preview -> QC -> approval -> final render -> FFmpeg MP4.

Contracts:
- schemas/episode.schema.json: frame-based timeline and shot actions.
- schemas/asset.schema.json: provenance and license for every resource.
- Frame-based timing avoids floating point drift.
- IDs are stable; files are referenced via asset IDs, never absolute host paths.
- Renderer and API are not implemented yet. Schema validation is only structural; future semantic checks must detect overlapping shots, missing assets, clip incompatibility and out-of-range actions.

Security: Meshy API keys only from environment; third-party assets require verified license and provenance. Render workers must not execute arbitrary user-provided Python.
