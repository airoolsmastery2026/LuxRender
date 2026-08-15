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

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(value || '');
  if (!match) throw new Error('sourceDataUrl must be a base64 data URL.');
  return { mimeType: match[1], data: match[2] };
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  try {
    const body = (req.body || {}) as RenderBody;
    if (!body.sourceDataUrl || !body.imagePrompt) {
      return res.status(400).json({ error: 'sourceDataUrl and imagePrompt are required.' });
    }

    const source = parseDataUrl(body.sourceDataUrl);
    const aspectRatio = ALLOWED_RATIOS.has(body.aspectRatio || '') ? body.aspectRatio : '16:9';
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const imageSize = body.imageSize === '2K' ? '2K' : '1K';

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
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

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || `Gemini HTTP ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const image = extractImage(payload);
    if (!image) return res.status(502).json({ error: 'Gemini returned no image.' });

    return res.status(200).json({
      provider: 'gemini',
      model,
      aspectRatio,
      imageUrl: `data:${image.mimeType};base64,${image.data}`,
      metadata: { imageSize, sourceMimeType: source.mimeType },
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
