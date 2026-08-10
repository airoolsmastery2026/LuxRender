# Next Task

## P0 - unify the first working vertical slice

Connect the existing LuxRender studio to the migrated SketchUp adapter without NBOX as a required runtime dependency.

Acceptance criteria:

- LuxRender defines a stable adapter protocol for handshake, scenes, viewport capture and save/result return.
- SketchUp plugin defaults to a local LuxRender endpoint and allows endpoint configuration.
- LuxRender UI can detect a SketchUp bridge session.
- A scene can be selected and captured from SketchUp.
- Captured image appears in LuxRender as a source asset.
- No AI provider key is stored in the plugin.
- Existing LuxRender UI remains runnable.

Do not start PostgreSQL/auth/queue migration until this vertical slice is proven end-to-end.
