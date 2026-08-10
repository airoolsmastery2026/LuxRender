export type SketchUpScene = { name: string; index?: number };
export type SketchUpStatus = {
  connected: boolean;
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
  if (!port) throw new Error('SketchUp bridge chưa được kết nối. Hãy mở LuxRender từ plugin SketchUp.');

  const response = await fetch(`http://127.0.0.1:${port}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });

  if (!response.ok) throw new Error(`SketchUp bridge HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.ok === false) throw new Error(payload?.error || payload?.message || 'SketchUp bridge request failed');
  return (payload?.result ?? payload?.payload ?? payload) as T;
}

export async function getSketchUpStatus(): Promise<SketchUpStatus> {
  const port = readSketchUpPort();
  if (!port) return { connected: false };
  try {
    const status = await request<Record<string, unknown>>('status');
    return { connected: true, port, ...status } as SketchUpStatus;
  } catch (error) {
    return { connected: false, port, error: error instanceof Error ? error.message : String(error) };
  }
}

export const sketchUpBridge = {
  status: getSketchUpStatus,
  scenes: () => request<SketchUpScene[]>('get_scenes'),
  captureScene: (name: string) => request<{ dataUrl?: string } | string>('capture_scene', { name }),
  modelInfo: () => request<Record<string, unknown>>('get_model_info'),
};
