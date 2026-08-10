export type GeometryLockMode = 'strict' | 'balanced' | 'creative';

export type MediaAsset = {
  id: string;
  projectId: string;
  kind: 'source' | 'render' | 'reference' | 'mask' | 'video';
  origin: 'upload' | 'sketchup' | 'generated';
  name: string;
  mimeType: string;
  url: string;
  scene?: string;
  createdAt: string;
};

export type SpatialProject = {
  id: string;
  name: string;
  geometryLock: GeometryLockMode;
  command: string;
  assets: MediaAsset[];
};

const STORAGE_KEY = 'luxrender.spatial.projects.v1';
const ACTIVE_KEY = 'luxrender.spatial.activeProject.v1';

function readProjects(): SpatialProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SpatialProject[];
  } catch {
    return [];
  }
}

function writeProjects(projects: SpatialProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getOrCreateActiveProject(name = 'SketchUp Project'): SpatialProject {
  const projects = readProjects();
  const activeId = localStorage.getItem(ACTIVE_KEY);
  const existing = projects.find(project => project.id === activeId);
  if (existing) return existing;

  const project: SpatialProject = {
    id: `sp-${Date.now()}`,
    name,
    geometryLock: 'strict',
    command: '',
    assets: [],
  };
  writeProjects([project, ...projects]);
  localStorage.setItem(ACTIVE_KEY, project.id);
  return project;
}

export function updateSpatialProject(project: SpatialProject): SpatialProject {
  const projects = readProjects();
  const next = projects.some(item => item.id === project.id)
    ? projects.map(item => item.id === project.id ? project : item)
    : [project, ...projects];
  writeProjects(next);
  localStorage.setItem(ACTIVE_KEY, project.id);
  return project;
}

export function addMediaAsset(project: SpatialProject, asset: Omit<MediaAsset, 'id' | 'projectId' | 'createdAt'>): SpatialProject {
  return updateSpatialProject({
    ...project,
    assets: [{
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      createdAt: new Date().toISOString(),
    }, ...project.assets],
  });
}
