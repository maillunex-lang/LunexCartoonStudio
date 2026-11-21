# GDD-01 technical milestone 07: verified mixed WebM and start of long-render architecture

## Verified on VPS Lunex, 2026-11-22
- Browser: headless Chromium + Playwright, patched upstream MyMotionStudio.
- Regression: native Dexie project creation, 3D green cube, add orange Konva 2D sprite via editor UI, wait autosave, read IndexedDB, reload, assert persisted sprite and single overlay.
- Export: use editor's own Export modal, select WebM + 480p, download output.
- Result: 37,365 bytes, VP8 WebM 853x480, approximately 2.16 seconds.
- Decoder: Playwright-provided FFmpeg executable; decoded 44 original frames using `-vsync 0`. Sampled first, middle, last frames. Green 3D pixels >20k and orange 2D pixels >1.4k in each.
- Browser JS pageerrors: none.
- The former E2E hang came from opening IndexedDB directly with the wrong version and/or blocked transaction. New test uses the app's own Dexie db and has explicit timeouts.
- Upstream unit tests: 89/89; typecheck and Vite production build passed after patch.
- Fix: repeated integration patch application now deduplicates HybridOverlay2D.

## Reproduce
1. Apply `node integration/apply.mjs /path/to/upstream`, start upstream Vite on localhost:4183.
2. Run `LUNEX_PLAYWRIGHT_PATH=/path/to/upstream/node_modules/playwright LUNEX_CHROME_PATH=/path/to/chrome-headless-shell node integration/e2e/mixed-export.cjs`.
3. Decode: `ffmpeg -y -vsync 0 -i /tmp/lunex-mixed-e2e.webm /tmp/lunex-frames/frame-%03d.png`.
4. Verify: `python3 integration/e2e/check_decoded_frames.py '/tmp/lunex-frames/frame-*.png'`.

## Long-form export: started, not production ready
- `integration/long-render/manifest.mjs` creates deterministic frame-exact segments, records attempts, checksum-verified completion and assembly eligibility.
- 4/4 tests pass including 60-minute 30fps manifest (120 × 30-second segments, 108,000 frames) and fractional final segments.
- Next implementation: dedicated render worker + headless browser scene capture, isolated FFmpeg encoder, persistent job queue, segment file checksums, restart/retry, concat with timestamps and codec validation, audio sync, progress, cancel, crash recovery, disk quotas and cleanup.
- Do not use browser MediaRecorder for unattended long-form rendering. The verified short video does not prove hour-long reliability.
- Keep GDD-01 open, DEMO-001 C unaccepted, do not start GDD-02.
