function applyCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

function imageModels() {
  const configured = process.env.LUXRENDER_GEMINI_IMAGE_MODELS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) || [];
  const preferred = process.env.GEMINI_IMAGE_MODEL?.trim();
  const defaults = ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image'];
  const ordered = configured.length ? configured : [preferred || '', ...defaults];
  return [...new Set(ordered.filter(Boolean))];
}

export default async function handler(req: any, res: any) {
  applyCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const models = imageModels();
  return res.status(200).json({
    ok: true,
    service: 'luxrender-ai',
    imageProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'unconfigured',
    imageModel: models[0] || 'unconfigured',
    imageModels: models,
    failover: true,
    transport: 'https-browser',
  });
}
