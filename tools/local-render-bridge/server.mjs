import http from 'node:http';
import { randomUUID } from 'node:crypto';

const HOST = process.env.LUXRENDER_LOCAL_HOST || '127.0.0.1';
const PORT = Number(process.env.LUXRENDER_LOCAL_PORT || 8787);
const COMFY_URL = String(process.env.LUXRENDER_COMFY_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const CHECKPOINT = String(process.env.LUXRENDER_COMFY_CHECKPOINT || '').trim();
const MAX_BODY_BYTES = 18 * 1024 * 1024;
const POLL_MS = 750;
const RENDER_TIMEOUT_MS = Number(process.env.LUXRENDER_LOCAL_RENDER_TIMEOUT_MS || 300000);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function json(res, status, payload) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function parseDataUrl(value) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(value || ''));
  if (!match) throw new Error('sourceDataUrl must be a base64 data URL.');
  const mimeType = match[1].toLowerCase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) throw new Error('Unsupported source image type.');
  return { mimeType, bytes: Buffer.from(match[2], 'base64') };
}

async function comfyFetch(path, options = {}) {
  const response = await fetch(`${COMFY_URL}${path}`, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`ComfyUI HTTP ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`);
  }
  return response;
}

async function resolveCheckpoint() {
  if (CHECKPOINT) return CHECKPOINT;
  const response = await comfyFetch('/object_info/CheckpointLoaderSimple');
  const payload = await response.json();
  const names = payload?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
  if (!Array.isArray(names) || !names.length) {
    throw new Error('ComfyUI has no checkpoint. Put a compatible checkpoint in ComfyUI/models/checkpoints.');
  }
  return names[0];
}

async function uploadSource(source) {
  const extension = source.mimeType === 'image/jpeg' ? 'jpg' : source.mimeType === 'image/webp' ? 'webp' : 'png';
  const filename = `luxrender-input-${Date.now()}.${extension}`;
  const form = new FormData();
  form.append('image', new Blob([source.bytes], { type: source.mimeType }), filename);
  form.append('overwrite', 'true');
  form.append('type', 'input');
  const response = await comfyFetch('/upload/image', { method: 'POST', body: form });
  const payload = await response.json();
  return payload?.subfolder ? `${payload.subfolder}/${payload.name}` : payload?.name || filename;
}

function buildWorkflow({ checkpoint, uploadedImage, positive, negative }) {
  return {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['1', 1] } },
    '4': { class_type: 'LoadImage', inputs: { image: uploadedImage } },
    '5': { class_type: 'VAEEncode', inputs: { pixels: ['4', 0], vae: ['1', 2] } },
    '6': {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 2_147_483_647),
        steps: 24,
        cfg: 6.5,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 0.62,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['5', 0]
      }
    },
    '7': { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    '8': { class_type: 'SaveImage', inputs: { filename_prefix: 'LuxRender', images: ['7', 0] } }
  };
}

async function queueWorkflow(workflow) {
  const response = await comfyFetch('/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: `luxrender-${randomUUID()}` })
  });
  const payload = await response.json();
  if (!payload?.prompt_id) throw new Error(`ComfyUI did not return prompt_id: ${JSON.stringify(payload).slice(0, 500)}`);
  return payload.prompt_id;
}

async function waitForOutput(promptId) {
  const started = Date.now();
  while (Date.now() - started < RENDER_TIMEOUT_MS) {
    const response = await comfyFetch(`/history/${encodeURIComponent(promptId)}`);
    const payload = await response.json();
    const history = payload?.[promptId];
    if (history?.status?.status_str === 'error') throw new Error('ComfyUI workflow failed. Check the ComfyUI console.');
    const outputs = history?.outputs || {};
    for (const output of Object.values(outputs)) {
      const image = output?.images?.[0];
      if (image?.filename) return image;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error('Local render timed out.');
}

async function fetchOutputImage(image) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output'
  });
  const response = await comfyFetch(`/view?${params}`);
  const mimeType = response.headers.get('content-type') || 'image/png';
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

async function health() {
  await comfyFetch('/system_stats');
  const checkpoint = await resolveCheckpoint();
  return {
    ok: true,
    service: 'luxrender-local-bridge',
    provider: 'comfyui',
    comfyUrl: COMFY_URL,
    checkpoint,
    transport: 'localhost'
  };
}

async function render(body) {
  if (!body?.sourceDataUrl || !body?.imagePrompt) throw new Error('sourceDataUrl and imagePrompt are required.');
  const source = parseDataUrl(body.sourceDataUrl);
  const checkpoint = await resolveCheckpoint();
  const uploadedImage = await uploadSource(source);
  const positive = [
    body.imagePrompt,
    body.geometryInstruction ? `Geometry constraints: ${body.geometryInstruction}` : '',
    'Photorealistic architectural visualization, realistic materials, physically plausible lighting, preserve source camera and spatial proportions.'
  ].filter(Boolean).join('\n');
  const negative = [
    body.negativePrompt || '',
    'warped architecture, broken perspective, duplicate objects, floating objects, text, watermark'
  ].filter(Boolean).join(', ');
  const workflow = buildWorkflow({ checkpoint, uploadedImage, positive, negative });
  const promptId = await queueWorkflow(workflow);
  const output = await waitForOutput(promptId);
  const imageUrl = await fetchOutputImage(output);
  return {
    requestId: `local-${promptId}`,
    provider: 'comfyui',
    model: checkpoint,
    imageUrl,
    metadata: { transport: 'localhost', comfyUrl: COMFY_URL, checkpoint, promptId }
  };
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, await health());
    if (req.method === 'POST' && url.pathname === '/api/render') return json(res, 200, await render(await readJson(req)));
    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(res, 503, { error: message, service: 'luxrender-local-bridge' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[LuxRender Local Bridge] http://${HOST}:${PORT}`);
  console.log(`[ComfyUI] ${COMFY_URL}`);
  console.log(CHECKPOINT ? `[Checkpoint] ${CHECKPOINT}` : '[Checkpoint] auto-detect first installed checkpoint');
});
