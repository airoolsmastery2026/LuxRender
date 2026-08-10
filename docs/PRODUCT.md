# LuxRender Product Definition

## Mission

Build an AI Spatial Design & Media Studio that turns images, sketches, plans, documents and 3D design context into professional design outputs through simple natural-language commands.

## Canonical workflow

UPLOAD -> UNDERSTAND -> PROMPT -> CONTROL -> GENERATE -> EDIT -> VERSION -> VIDEO -> EXPORT

## Inputs

JPG, PNG, WebP, PDF, DOCX, MP4, WebM, sketches, floor plans, reference renders, prompts and workflow references.

## Command Studio

Three primary modes:

1. IMAGE - source image/sketch to render.
2. VIDEO - image/render to cinematic motion.
3. REGION EDIT - mask/region-specific modification without regenerating the entire image.

## Prompt system

Prompt Builder composes structured design parameters:

SPACE + STYLE + MATERIAL + LIGHTING + COLOR + CAMERA + GEOMETRY + QUALITY + NEGATIVE PROMPT

One request may produce image, video, negative and region-edit prompts.

## Geometry Lock

- STRICT: preserve walls, doors, windows, object positions, camera and proportions as strongly as possible.
- BALANCED: preserve structure while allowing design improvement.
- CREATIVE: allow broader redesign.

## Media model

PROJECT
- Sources
- Documents
- References
- Prompts
- Renders
- Videos
- Masks
- Versions

## Render jobs

queued -> analyzing -> generating -> completed

Terminal alternatives: failed, cancelled.

Long AI work must be represented as jobs rather than blocking UI requests.

## Provider architecture

LuxRender must not be locked to one model provider. Provider capabilities are routed by role: vision, prompt, image, inpainting and video.

## SketchUp integration

SketchUp is an adapter source for model context: scene, camera, selection, materials, viewport and later geometry/BOQ metadata. SketchUp is not the system database and is not the AI core.
