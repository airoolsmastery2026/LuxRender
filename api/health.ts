function applyCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req: any, res: any) {
  applyCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    ok: true,
    service: 'luxrender-ai',
    imageProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'unconfigured',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
    transport: 'https-browser',
  });
}
