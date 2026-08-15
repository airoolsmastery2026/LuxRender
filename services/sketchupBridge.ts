export type SketchUpScene = { name: string; index?: number };
export type SketchUpScenePreview = SketchUpScene & { dataUrl: string };
export type SketchUpStatus = {
  connected: boolean;
  running?: boolean;
  port?: number;
  host?: string;
  version?: string;
  error?: string;
};

const PORT_KEY = 'luxrender.sketchup.port';

export function readSketchUpPort(): number | null {
  const query = new URLSearchParams(window.location.search).get('syncPort');
  const stored = window.localStorage.getItem(PORT_KEY);
  const value = Number(query || stored || 0);
  if (!Number.isInteger(value) || value < 1024 || value > 65535) return null;
  if (query) window.localStorage.setItem(PORT_KEY, String(value));
  return value;
}

async function request<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const port = readSketchUpPort();
  if (!port) throw new Error('SketchUp chưa kết nối. Hãy mở LuxRender từ DHP SketchUp Plugin.');
  const response = await fetch(`http://127.0.0.1:${port}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });
  if (!response.ok) throw new Error(`SketchUp bridge HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error);
  return payload as T;
}

export async function getSketchUpStatus(): Promise<SketchUpStatus> {
  const port = readSketchUpPort();
  if (!port) return { connected: false };
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const status = await response.json();
    return { connected: true, port, ...status };
  } catch (error) {
    return { connected: false, port, error: error instanceof Error ? error.message : String(error) };
  }
}

export const sketchUpBridge = {
  status: getSketchUpStatus,
  scenes: () => request<SketchUpScene[]>('lux_get_scenes'),
  scenePreviews: () => request<SketchUpScenePreview[]>('lux_get_scene_previews'),
  captureScene: (name: string, aspectRatio?: string) => request<{ dataUrl: string }>('lux_capture_scene', { name, aspectRatio }),
  modelInfo: () => request<Record<string, unknown>>('lux_get_model_info'),
  camera: () => request<Record<string, unknown>>('lux_get_camera'),
  setAspectRatio: (value: string) => request<{ value: string }>('lux_set_aspect_ratio', { value }),
  setFieldOfView: (value: number) => request<{ value: number }>('lux_set_field_of_view', { value }),
  selection: () => request<unknown[]>('lux_get_selection'),
  materials: () => request<unknown[]>('lux_get_materials'),
  saveImage: (url: string, filename?: string) => request<{ path: string }>('lux_save_image', { url, filename }),
};
