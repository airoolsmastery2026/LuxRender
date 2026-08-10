# LuxRender

LuxRender is the single source of truth for the Dai Hai Phat spatial AI platform.

## Product direction

LuxRender combines the FormaVision workflow, AI rendering, SketchUp integration and future desktop/mobile adapters in one modular repository.

Core workflow:

`UPLOAD -> UNDERSTAND -> PROMPT -> CONTROL -> GENERATE -> EDIT -> VERSION -> VIDEO -> EXPORT`

SketchUp workflow:

`MODEL -> SCENE/CAMERA/SELECTION/MATERIAL -> GEOMETRY LOCK -> AI RENDER -> EDIT -> VERSION -> EXPORT/RETURN`

## Repository boundaries

- Existing React/Vite application: current LuxRender studio baseline.
- `plugins/sketchup`: SketchUp adapter and RBZ source.
- `docs`: product and architecture source of truth.
- `.ai`: immutable development rules and next task.

## Product roles

- **LuxRender Studio**: AI Spatial Design & Media Studio.
- **LuxRender Render Core**: provider-agnostic render/design engine.
- **DHP SketchUp Plugin**: CAD/geometry adapter.
- **DHP Design OS**: business operating system that can consume LuxRender; it is not duplicated inside the render core.
- **DHP Field**: future field/mobile client.

## Current stack

The existing application remains intact while the repository is migrated incrementally. Do not rewrite working UI solely to satisfy a folder layout.

## Development rule

One repository does not mean one code blob. Every module must have a narrow responsibility and communicate through explicit contracts.

See `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `.ai/CONSTITUTION.md` before major changes.
