import { PromptBundle } from './promptBuilder';

export type RenderProviderId = 'mock-local' | 'server';

export type RenderRequest = {
  sourceUrl: string;
  prompt: PromptBundle;
  width?: number;
  height?: number;
  aspectRatio?: string;
  imageSize?: '1K' | '2K';
};

export type RenderResult = {
  provider: RenderProviderId;
  imageUrl: string;
  metadata?: Record<string, unknown>;
};

export interface RenderProvider {
  id: RenderProviderId;
  generateImage(request: RenderRequest): Promise<RenderResult>;
}

const mockLocalProvider: RenderProvider = {
  id: 'mock-local',
  async generateImage(request) {
    await new Promise(resolve => setTimeout(resolve, 650));
    return {
      provider: 'mock-local',
      imageUrl: request.sourceUrl,
      metadata: {
        simulated: true,
        geometryInstruction: request.prompt.geometryInstruction,
      },
    };
  },
};

const serverProvider: RenderProvider = {
  id: 'server',
  async generateImage(request) {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDataUrl: request.sourceUrl,
        imagePrompt: request.prompt.imagePrompt,
        geometryInstruction: request.prompt.geometryInstruction,
        negativePrompt: request.prompt.negativePrompt,
        aspectRatio: request.aspectRatio || '16:9',
        imageSize: request.imageSize || '1K',
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Render API HTTP ${response.status}`);
    if (!payload?.imageUrl) throw new Error('Render API returned no image.');

    return {
      provider: 'server',
      imageUrl: payload.imageUrl,
      metadata: {
        model: payload.model,
        aspectRatio: payload.aspectRatio,
        ...(payload.metadata || {}),
      },
    };
  },
};

const providers: Record<RenderProviderId, RenderProvider> = {
  'mock-local': mockLocalProvider,
  server: serverProvider,
};

export function getRenderProvider(id: RenderProviderId = 'mock-local'): RenderProvider {
  return providers[id];
}
