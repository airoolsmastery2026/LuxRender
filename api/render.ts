type RenderBody = {
  sourceDataUrl: string;
  imagePrompt: string;
  geometryInstruction?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  imageSize?: '1K' | '2K';
};

type Attempt = {
  model: string;
  status: number;
  reason: string;
};

const DEFAULT_MODELS = [
  'gemini-3.1-flash-lite-image',
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
];
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

function modelCandidates() {
  const configuredList = process.env.LUXRENDER_GEMINI_IMAGE_MODELS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) || [];
  const preferred = process.env.GEMINI_IMAGE_MODEL?.trim();
  const ordered = configuredList.length
    ? configuredList
    : [preferred || '', ...DEFAULT_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

function errorMessage(payload: any, status: number) {
  return payload?.error?.message || payload?.message || `Gemini HTTP ${status}`;
}

function shouldFailover(status: number, message: string) {
  const text = message.toLowerCase();
  if (status === 429) return true;
  if (status === 404) return true;
  if (text.includes('resource_exhausted') || text.includes('quota') || text.includes('rate limit')) return true;
  if (text.includes('model') && (text.includes('not found') || text.includes('unsupported') || text.includes('not available'))) return true;
  return false;
}

async function callGemini(apiKey: string, model: string, source: { mimeType: string; data: string }, body: RenderBody, aspectRatio: string, imageSize: '1K' | '2K') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
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
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timeout);
  }
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
    const aspectRatio = ALLOWED_RATIOS.has(body.aspectRatio || '') ? body.aspectRatio! : '16:9';
    const imageSize: '1K' | '2K' = body.imageSize === '2K' ? '2K' : '1K';
    const candidates = modelCandidates();
    const attempts: Attempt[] = [];

    for (const model of candidates) {
      let response: Response;
      let payload: any;
      try {
        ({ response, payload } = await callGemini(apiKey, model, source, body, aspectRatio, imageSize));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attempts.push({ model, status: 0, reason: message });
        return res.status(502).json({ error: `Gemini transport failed: ${message}`, requestId, attemptedModels: attempts });
      }

      if (!response.ok) {
        const message = errorMessage(payload, response.status);
        attempts.push({ model, status: response.status, reason: message });
        if (shouldFailover(response.status, message)) continue;
        return res.status(response.status).json({ error: message, requestId, attemptedModels: attempts });
      }

      const image = extractImage(payload);
      if (!image) {
        attempts.push({ model, status: 502, reason: 'Gemini returned no image.' });
        continue;
      }

      return res.status(200).json({
        requestId,
        provider: 'gemini',
        model,
        aspectRatio,
        imageUrl: `data:${image.mimeType};base64,${image.data}`,
        attemptedModels: attempts,
        metadata: {
          imageSize,
          sourceMimeType: source.mimeType,
          transport: 'https-browser',
          failoverCount: attempts.length,
        },
      });
    }

    const summary = attempts.map((attempt) => `${attempt.model}: HTTP ${attempt.status || 'ERR'}`).join(' → ');
    return res.status(429).json({
      error: `Không còn Gemini image model khả dụng trong quota hiện tại. ${summary}`,
      requestId,
      attemptedModels: attempts,
      quotaExhausted: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('too large') || message.includes('Unsupported') || message.includes('base64 data URL') ? 400 : 500;
    return res.status(status).json({ error: message, requestId });
  }
}
