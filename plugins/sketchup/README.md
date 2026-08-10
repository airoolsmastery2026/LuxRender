# LuxRender SketchUp Adapter

Source for the DHP SketchUp AI extension.

Current version: 0.3.0 migration baseline.

Responsibilities: model metadata, scenes/camera, selection/material context, viewport capture, loopback bridge and opening LuxRender.

The plugin defaults to `http://127.0.0.1:3000` for local development. The endpoint can later be persisted/configured by Design OS or LuxRender settings.

NBOX is not required by this migrated version.

To package as RBZ, zip `dhp_sketchup_ai.rb` and the `dhp_sketchup_ai/` directory and rename the archive extension to `.rbz`.
