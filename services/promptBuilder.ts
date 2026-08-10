import { GeometryLockMode } from './spatialStudioStore';

export type PromptInput = {
  command: string;
  scene?: string;
  geometryLock: GeometryLockMode;
};

export type PromptBundle = {
  imagePrompt: string;
  negativePrompt: string;
  geometryInstruction: string;
};

const geometryMap: Record<GeometryLockMode, string> = {
  strict: 'Preserve walls, doors, windows, object positions, camera, scale and proportions. Do not alter architectural geometry.',
  balanced: 'Preserve the architectural structure, camera and key object positions while allowing controlled design refinement.',
  creative: 'Keep the scene identity and major architectural anchors, but allow broader layout and styling changes.',
};

export function buildPrompt(input: PromptInput): PromptBundle {
  const command = input.command.trim() || 'Create a photorealistic architectural visualization with high material fidelity.';
  const geometryInstruction = geometryMap[input.geometryLock];
  const context = input.scene ? `Source scene: ${input.scene}.` : '';

  return {
    imagePrompt: [context, command, geometryInstruction, 'Photorealistic architectural visualization, realistic lighting, physically plausible materials, clean perspective, high detail.'].filter(Boolean).join(' '),
    geometryInstruction,
    negativePrompt: 'distorted geometry, warped walls, bent lines, duplicate furniture, floating objects, incorrect perspective, broken proportions, low detail, text artifacts',
  };
}
