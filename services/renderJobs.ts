import { PromptBundle } from './promptBuilder';
import { getRenderProvider, RenderProviderId } from './aiRouter';
import { addMediaAsset, MediaAsset, SpatialProject } from './spatialStudioStore';

export type RenderJobStatus = 'queued' | 'analyzing' | 'generating' | 'completed' | 'failed' | 'cancelled';

export type RenderJob = {
  id: string;
  projectId: string;
  sourceAssetId: string;
  status: RenderJobStatus;
  provider: RenderProviderId;
  prompt: PromptBundle;
  createdAt: string;
  updatedAt: string;
  error?: string;
  outputAssetId?: string;
};

const STORAGE_KEY = 'luxrender.render.jobs.v1';

function readJobs(): RenderJob[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RenderJob[]; }
  catch { return []; }
}

function writeJobs(jobs: RenderJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function saveJob(job: RenderJob): RenderJob {
  const jobs = readJobs();
  const next = jobs.some(item => item.id === job.id)
    ? jobs.map(item => item.id === job.id ? job : item)
    : [job, ...jobs];
  writeJobs(next);
  return job;
}

function transition(job: RenderJob, status: RenderJobStatus, patch: Partial<RenderJob> = {}): RenderJob {
  return saveJob({ ...job, ...patch, status, updatedAt: new Date().toISOString() });
}

export function listRenderJobs(projectId?: string): RenderJob[] {
  const jobs = readJobs();
  return projectId ? jobs.filter(job => job.projectId === projectId) : jobs;
}

export async function runImageRenderJob(args: {
  project: SpatialProject;
  sourceAsset: MediaAsset;
  prompt: PromptBundle;
  provider?: RenderProviderId;
  onStatus?: (job: RenderJob) => void;
}): Promise<{ job: RenderJob; project: SpatialProject; output: MediaAsset }> {
  const now = new Date().toISOString();
  let job: RenderJob = saveJob({
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: args.project.id,
    sourceAssetId: args.sourceAsset.id,
    status: 'queued',
    provider: args.provider || 'mock-local',
    prompt: args.prompt,
    createdAt: now,
    updatedAt: now,
  });
  args.onStatus?.(job);

  try {
    job = transition(job, 'analyzing'); args.onStatus?.(job);
    await Promise.resolve();
    job = transition(job, 'generating'); args.onStatus?.(job);

    const result = await getRenderProvider(job.provider).generateImage({
      sourceUrl: args.sourceAsset.url,
      prompt: args.prompt,
    });

    const nextProject = addMediaAsset(args.project, {
      kind: 'render',
      origin: 'generated',
      name: `Render • ${args.sourceAsset.scene || args.sourceAsset.name}`,
      mimeType: 'image/png',
      url: result.imageUrl,
      scene: args.sourceAsset.scene,
    });
    const output = nextProject.assets[0];
    job = transition(job, 'completed', { outputAssetId: output.id });
    args.onStatus?.(job);
    return { job, project: nextProject, output };
  } catch (error) {
    job = transition(job, 'failed', { error: error instanceof Error ? error.message : String(error) });
    args.onStatus?.(job);
    throw error;
  }
}
