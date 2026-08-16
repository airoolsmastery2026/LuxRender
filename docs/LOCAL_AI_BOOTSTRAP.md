# LuxRender Local AI Bootstrap

LuxRender uses a cloud-first, local-fallback render path.

## Runtime contract

1. SketchUp plugin captures the source view.
2. LuxRender tries the configured cloud image provider.
3. On quota/provider exhaustion, the plugin starts the loopback Local Bridge.
4. Local Bridge calls ComfyUI at `127.0.0.1:8188`.
5. ComfyUI renders with an installed checkpoint and returns the image to SketchUp.

## Supported ComfyUI installation paths

The plugin detects common ComfyUI Desktop and Windows Portable locations. Users can also set `LUXRENDER_COMFY_LAUNCHER` explicitly.

Official setup references:
- Windows Desktop: https://docs.comfy.org/installation/desktop/windows
- Official repository / Windows Portable: https://github.com/Comfy-Org/ComfyUI

LuxRender never downloads model weights silently. Model files remain user-managed because they are large and hardware-dependent.

## Self-Test

The Studio Self-Test checks:
- Node.js runtime
- bundled Local Bridge
- GPU information when available
- ComfyUI installation / launcher
- ComfyUI API on port 8188
- installed checkpoints
- Local Bridge API on port 8787

A failed check should always include an actionable remediation instead of a generic network error.

## Checkpoint selection

The Local Bridge exposes the available checkpoint list. A render request may pass an explicit `checkpoint`; otherwise the bridge uses `LUXRENDER_COMFY_CHECKPOINT` or the first checkpoint returned by ComfyUI.
