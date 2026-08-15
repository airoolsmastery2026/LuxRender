export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    ok: true,
    service: 'luxrender-ai',
    imageProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'unconfigured',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
  });
}
