import { PromptBundle } from './promptBuilder';

export type RenderProviderId = 'mock-local' | 'server';

export type RenderRequest = {
  sourceUrl: string;
  prompt: PromptBundle;
  width?: number;
  height?: number;
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

const providers: Record<RenderProviderId, RenderProvider> = {
  'mock-local': mockLocalProvider,
  server: {
    id: 'server',
    async generateImage() {
      throw new Error('Server render provider chưa được cấu hình. Provider keys phải nằm ở backend, không nằm trong client.');
    },
  },
};

export function getRenderProvider(id: RenderProviderId = 'mock-local'): RenderProvider {
  return providers[id];
}
