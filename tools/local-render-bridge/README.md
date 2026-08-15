# LuxRender Local Render Bridge

Zero-dollar local fallback for LuxRender when cloud image quota is unavailable.

## Architecture

SketchUp LuxRender Studio → `http://127.0.0.1:8787` → ComfyUI `http://127.0.0.1:8188` → local checkpoint → rendered image → SketchUp.

The RBZ contains no model weights and no cloud API key. The bridge listens on loopback only by default.

## Requirements

- Node.js 18+
- ComfyUI running locally
- At least one compatible checkpoint installed in `ComfyUI/models/checkpoints`

The bridge uses only ComfyUI core nodes: CheckpointLoaderSimple, LoadImage, VAEEncode, CLIPTextEncode, KSampler, VAEDecode and SaveImage. No custom node is required.

## Start

1. Start ComfyUI on its default address `http://127.0.0.1:8188`.
2. From the LuxRender repository run:

```bash
node tools/local-render-bridge/server.mjs
```

3. Health check:

```text
http://127.0.0.1:8787/api/health
```

If `LUXRENDER_COMFY_CHECKPOINT` is not set, the bridge uses the first checkpoint reported by ComfyUI.

## Optional environment variables

- `LUXRENDER_COMFY_URL` — default `http://127.0.0.1:8188`
- `LUXRENDER_COMFY_CHECKPOINT` — exact checkpoint filename
- `LUXRENDER_LOCAL_HOST` — default `127.0.0.1`
- `LUXRENDER_LOCAL_PORT` — default `8787`
- `LUXRENDER_LOCAL_RENDER_TIMEOUT_MS` — default `300000`

Example PowerShell:

```powershell
$env:LUXRENDER_COMFY_CHECKPOINT="your-checkpoint.safetensors"
node tools/local-render-bridge/server.mjs
```

## Failover behavior

LuxRender Studio first calls the production backend. If the backend reports that all Gemini image models are unavailable due to quota/rate limits, Studio automatically tries the local bridge on `127.0.0.1:8787`.

If the local bridge is not running, Studio keeps the cloud error and adds a concise local-fallback diagnostic. It does not silently install software or download model files.

## Security

The default bridge binds only to `127.0.0.1`. Do not expose it to the public internet. Pricing/business data is not handled by this bridge.