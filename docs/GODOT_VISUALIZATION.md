# Godot Visualization Integration

## Decision
Godot is an optional visualization/configurator capability behind LuxRender and DHP-AIOS. It is not a dependency of the core Vite/React app and does not replace the Dai Hai Phat Next.js website.

## Placement

```text
DHP Web / DHP-AIOS / Contractor AI OS
        -> capability API / configuration contract
        -> Godot Visualization Service
        -> Web/Desktop interactive artifact

SketchUp / LuxRender
        -> model/context/media
        -> optional Godot visualization handoff
```

## Primary DHP use case: AI Product Configurator

```text
AI Chat
  -> PRODUCT_DB
  -> MATERIAL_DB
  -> PRICE_DB
  -> IMAGE_DB
  -> ProductConfiguration
  -> Godot 3D Configurator
  -> customer changes model/color/material/dimensions/accessories
  -> ConfigurationDelta
  -> ESTIMATION_DB
  -> Proposal
  -> Survey
  -> Quote
  -> Contract
```

## Contract
The canonical business data remains outside Godot. Godot receives a configuration payload and emits user changes/events.

Example input:

```json
{
  "projectId": "DHP-2026-00128",
  "productType": "gate",
  "dimensionsMm": { "width": 4000, "height": 2200 },
  "variantId": "gate-modern-01",
  "materials": [
    { "slot": "frame", "materialId": "steel-box-40x40", "finishId": "powder-black" }
  ],
  "accessories": ["hinge-heavy-01", "handle-01"],
  "pricingContextId": "price-vietnam-2026-08",
  "locale": "vi-VN"
}
```

Example output event:

```json
{
  "type": "configuration.changed",
  "projectId": "DHP-2026-00128",
  "changes": {
    "variantId": "gate-modern-02",
    "finishId": "powder-charcoal"
  }
}
```

## Integration rules
1. Godot never owns PRODUCT_DB, MATERIAL_DB, PRICE_DB, ESTIMATION_DB, CUSTOMER_DB, or PROJECT_DB.
2. Do not copy pricing logic into GDScript. Request estimates through DHP services.
3. Web export is lazy-loaded only when the interactive configurator is opened.
4. The host website keeps Next.js/TypeScript; no architecture migration for Godot.
5. The Godot project must remain independently testable/exportable.
6. Third-party Godot addons require an explicit whitelist and license review.
7. Keep an engine-neutral configuration schema so a future WebGL/Three.js/Unity/other adapter can consume the same contract.
8. Console publishing is not part of the default pipeline; platform SDK/licensing requirements are handled separately.

## LuxRender relationship
LuxRender remains the AI spatial media/render engine. Godot complements it with real-time interaction, simulation and product configuration.

Recommended flow:

```text
SketchUp model/context
 -> LuxRender AI render / material concept
 -> approved configuration data
 -> Godot real-time configurator
 -> customer edits
 -> DHP estimation/proposal
```

Do not attempt to reproduce LuxRender image generation inside Godot. Use Godot for interaction and deterministic real-time visualization; use LuxRender for generative image/video workflows.

## Zero-Dollar Agent Fabric
The local GodotAdapter is the execution layer for agent automation:
- create_project()
- generate_scene()
- import_assets()
- attach_scripts()
- test_project()
- render_preview()
- export_web()
- export_desktop()
- package_artifact()

## Initial milestone
Build one vertical slice only: **DHP Gate Configurator**.

Scope:
- width/height
- gate variant
- frame/slat material
- finish/color
- accessory toggles
- realtime 3D preview
- configuration JSON output
- estimate request handoff
- Web export artifact

Out of scope for the first slice: full BIM, structural analysis, game mechanics, multiplayer, console export, or replacing SketchUp.