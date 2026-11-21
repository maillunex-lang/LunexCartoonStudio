# Rules for Codex and other development agents

1. Read docs/GDD_DECISIONS.md, ROADMAP.md and docs/STATUS.md before changing anything.
2. Work sequentially from S01 to S14; never claim DONE without the stage's acceptance evidence.
3. Keep source, tests and docs synchronized; update docs/STATUS.md after each stage.
4. Never change approved GDD decisions without owner approval.
5. Use deterministic scene specifications, versioned asset manifests and reproducible builds.
6. Check third-party model/animation licenses and record provenance; do not assume free means commercial use.
7. Never commit API keys, tokens, large 3D binaries, renders or caches. Use environment variables and external asset storage.
8. Prefer a low-cost preview before high-resolution rendering; log render time and resource use.
9. Separate automatic validation from manual artistic approval; never assert that motion quality was verified automatically.
10. Make focused commits with stage IDs and report tests, artifacts, limitations and next stage.
