# LuxRender AI Render Backend

LuxRender v0.5 keeps provider credentials outside SketchUp. The SketchUp adapter sends a captured viewport and structured prompt bundle to the LuxRender backend; the backend calls the image provider and returns the generated image.

## End-to-end flow

```text
SketchUp viewport
  -> LuxRender Local Studio
  -> RenderBackendClient (background network thread)
  -> POST /api/render
  -> Gemini image provider (server-side key)
  -> generated image data URL
  -> Local Studio result panel
  -> Save back to disk / project
```

## Server environment

Required:

```text
GEMINI_API_KEY=<server-side secret>
```

Optional:

```text
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
LUXRENDER_CLIENT_TOKEN=<deployment access token>
```

Never place `GEMINI_API_KEY` inside the `.rbz`, browser bundle, or committed source.

## Endpoints

`GET /api/health`

Returns backend/provider readiness without exposing credentials.

`POST /api/render`

Request:

```json
{
  "sourceDataUrl": "data:image/png;base64,...",
  "imagePrompt": "...",
  "geometryInstruction": "...",
  "negativePrompt": "...",
  "aspectRatio": "16:9",
  "imageSize": "1K"
}
```

Response:

```json
{
  "provider": "gemini",
  "model": "gemini-3.1-flash-image",
  "aspectRatio": "16:9",
  "imageUrl": "data:image/png;base64,..."
}
```

## SketchUp configuration

Open **LuxRender Local Studio -> AI Backend**, enter the deployed LuxRender origin, for example:

```text
https://your-luxrender-domain.example
```

The URL is stored in SketchUp preferences. Provider credentials remain server-side.

If `LUXRENDER_CLIENT_TOKEN` is enabled on the backend, set the same token only as a machine environment variable for the adapter runtime. It is not stored in the RBZ source.
