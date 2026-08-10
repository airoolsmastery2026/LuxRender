# LuxRender Architecture

## Principle

LuxRender is one repository with explicit module boundaries.

## Target shape

```text
LuxRender
├── current React/Vite studio       # preserved during incremental migration
├── plugins/
│   └── sketchup/                   # SketchUp Ruby + HtmlDialog adapter
├── apps/                           # future app surfaces when migration is justified
├── packages/                       # future shared domain/render contracts
├── services/                       # future API/workers
├── docs/
└── .ai/
```

Do not move existing working files merely for cosmetic monorepo compliance. Introduce `apps/packages/services` only as real modules appear.

## Logical architecture

```text
SketchUp / future CAD adapters
          |
          v
   Adapter Protocol
          |
          v
    LuxRender Studio
          |
          v
 Render Job / AI Router
          |
   +------+------+------+
   |      |      |      |
 Vision  Image  Edit   Video
          |
          v
 Storage / Versions / Export
```

## SketchUp adapter contract

The plugin owns only host-specific responsibilities:

- model metadata
- scene/camera
- selection
- materials
- viewport capture
- local save/open operations
- transport to LuxRender

It must not contain AI provider credentials, pricing/business databases or duplicated render logic.

## Local-first direction

DHP Design OS may later operate local-first and consume LuxRender. LuxRender must therefore support a local endpoint as well as a hosted endpoint without changing plugin domain logic.

## Security

- Local bridge binds only to loopback.
- Restrict CORS to configured LuxRender origins.
- External URLs must use HTTPS except explicit loopback development endpoints.
- Never ship provider secrets inside SketchUp Ruby/JavaScript assets.
- Treat uploaded documents/media as untrusted input.

## Upstream references

`sketchup-ruby-api-tutorials` and `sketchup-bridge` remain reference/upstream sources. Production code lives here. NBOX is compatibility/reference only and must not be a required runtime dependency.
