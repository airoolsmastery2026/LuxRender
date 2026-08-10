# Imported DHP SketchUp Extension Reference

Source migrated from `airoolsmastery2026/dhp-sketchup-extension` so the standalone repository can be retired without losing code.

Original scope: local-first SketchUp extension for Đại Hải Phát with compact drawer UI and authenticated DHP Agent Control Plane integration.

## Preserved capabilities

- SketchUp extension bootstrap and toolbar/menu entry.
- HtmlDialog Ruby ↔ JavaScript command bridge.
- Model summary/context extraction.
- DHP Control Plane health, skill listing/execution.
- Media-job create/get/run/approve flow.
- Environment-only control-plane secret handling.
- Reference drawer UI for image input, parametric width and render workflow.

## Status

This directory is **reference/migration source**, not a second production plugin. Production development remains in `plugins/sketchup/dhp_sketchup_ai/` and useful capabilities from this reference should be merged into that adapter deliberately to avoid duplicate extensions.

Imported 2026-08-10 from the standalone repository's `main` branch.