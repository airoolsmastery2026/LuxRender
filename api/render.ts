type RenderBody = {
  sourceDataUrl: string;
  imagePrompt: string;
  geometryInstruction?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: '1K' | '2K';
};

const DEFAULT_MODEL = 'gemini-3.1-flash-image';
const ALLOWED_RATIOS = new Set(['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_PROMPT_CHARS = 16_000;
const PROVIDER_TIMEOUT_MS = 220_000;

function applyCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(value || '');
  if (!match) throw new Error('sourceDataUrl must be a base64 data URL.');
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new Error('Unsupported source image type.');
  const data = match[2];
  const estimatedBytes = Math.floor(data.length * 0.75);
  if (estimatedBytes > MAX_SOURCE_BYTES) throw new Error('Source image is too large. Maximum is 12 MB.');
  return { mimeType, data };
}

function extractImage(payload: any): { data: string; mimeType: string } | null {
  const direct = payload?.output_image;
  if (direct?.data) return { data: direct.data, mimeType: direct.mime_type || 'image/png' };

  for (const step of payload?.steps || []) {
    for (const block of step?.content || []) {
      if (block?.type === 'image' && block?.data) {
        return { data: block.data, mimeType: block.mime_type || 'image/png' };
      }
    }
  }
  return null;
}

function buildInstruction(body: RenderBody) {
  return [
    body.imagePrompt,
    body.geometryInstruction ? `GEOMETRY LOCK: ${body.geometryInstruction}` : '',
    body.negativePrompt ? `AVOID: ${body.negativePrompt}` : '',
    'Use the supplied SketchUp viewport as the spatial source. Preserve perspective, camera framing, architectural proportions and all geometry required by the geometry lock. Improve only design, materials, lighting and realism as requested. Return one finished photorealistic architectural visualization.'
  ].filter(Boolean).join('\n\n');
}

function isAuthorized(req: any) {
  const expected = process.env.LUXRENDER_CLIENT_TOKEN?.trim();
  if (!expected) return true;
  const auth = String(req.headers?.authorization || '');
  return auth === `Bearer ${expected}`;
}

export default async function handler(req: any, res: any) {
  applyCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  const requestId = `lux-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = (req.body || {}) as RenderBody;
    if (!body.sourceDataUrl || !body.imagePrompt) {
      return res.status(400).json({ error: 'sourceDataUrl and imagePrompt are required.', requestId });
    }
    if (body.imagePrompt.length > MAX_PROMPT_CHARS) {
      return res.status(400).json({ error: 'imagePrompt is too long.', requestId });
    }

    const source = parseDataUrl(body.sourceDataUrl);
    const aspectRatio = ALLOWED_RATIOS.has(body.aspectRatio || '') ? body.aspectRatio : '16:9';
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const imageSize = body.imageSize === '2K' ? '2K' : '1K';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          input: [
            { type: 'image', mime_type: source.mimeType, data: source.data },
            { type: 'text', text: buildInstruction(body) },
          ],
          response_format: {
            type: 'image',
            aspect_ratio: aspectRatio,
            image_size: imageSize,
          },
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || `Gemini HTTP ${response.status}`;
      return res.status(response.status).json({ error: message, requestId });
    }

    const image = extractImage(payload);
    if (!image) return res.status(502).json({ error: 'Gemini returned no image.', requestId });

    return res.status(200).json({
      requestId,
      provider: 'gemini',
      model,
      aspectRatio,
      imageUrl: `data:${image.mimeType};base64,${image.data}`,
      metadata: { imageSize, sourceMimeType: source.mimeType, transport: 'https-browser' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('too large') || message.includes('Unsupported') || message.includes('base64 data URL') ? 400 : 500;
    return res.status(status).json({ error: message, requestId });
  }
}
