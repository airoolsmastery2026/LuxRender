import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, Wand2, Sparkles } from 'lucide-react';
import { sketchUpBridge, SketchUpScene, SketchUpStatus } from '../services/sketchupBridge';
import { addMediaAsset, GeometryLockMode, getOrCreateActiveProject, MediaAsset, SpatialProject, updateSpatialProject } from '../services/spatialStudioStore';
import { buildPrompt } from '../services/promptBuilder';
import { RenderJob, runImageRenderJob } from '../services/renderJobs';

export const SketchUpImport: React.FC = () => {
  const [status, setStatus] = useState<SketchUpStatus>({ connected: false });
  const [scenes, setScenes] = useState<SketchUpScene[]>([]);
  const [scene, setScene] = useState('');
  const [preview, setPreview] = useState('');
  const [model, setModel] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [project, setProject] = useState<SpatialProject>(() => getOrCreateActiveProject());
  const [source, setSource] = useState<MediaAsset | null>(() => getOrCreateActiveProject().assets.find(a => a.kind === 'source') || null);
  const [job, setJob] = useState<RenderJob | null>(null);

  const prompt = useMemo(() => buildPrompt({ command: project.command, geometryLock: project.geometryLock, scene }), [project.command, project.geometryLock, scene]);

  const connect = async () => {
    setError('');
    const next = await sketchUpBridge.status();
    setStatus(next);
    if (!next.connected) return;
    try {
      const [list, info] = await Promise.all([sketchUpBridge.scenes(), sketchUpBridge.modelInfo()]);
      setScenes(list); setModel(info); if (list[0]) setScene(list[0].name);
      if (info?.title) setProject(current => updateSpatialProject({ ...current, name: String(info.title) || current.name }));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  useEffect(() => { connect(); }, []);
  const patchProject = (patch: Partial<SpatialProject>) => setProject(current => updateSpatialProject({ ...current, ...patch }));

  const capture = async () => {
    setBusy(true); setError('');
    try {
      const result = await sketchUpBridge.captureScene(scene);
      setPreview(result.dataUrl);
      const nextProject = addMediaAsset(project, {
        kind: 'source', origin: 'sketchup', name: `${String(model?.title || 'SketchUp')} • ${scene || 'Current View'}`,
        mimeType: 'image/png', url: result.dataUrl, scene: scene || 'Current View',
      });
      setProject(nextProject); setSource(nextProject.assets[0]);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const generate = async () => {
    if (!source) return;
    setBusy(true); setError('');
    try {
      const result = await runImageRenderJob({ project, sourceAsset: source, prompt, onStatus: setJob });
      setProject(result.project); setPreview(result.output.url);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return <div className="min-h-[100dvh] bg-dark-bg text-white p-5 md:p-10 overflow-y-auto">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.25em] text-brand-start">LuxRender CAD Bridge</p><h1 className="mt-2 text-3xl font-bold">SketchUp → LuxRender Studio</h1><p className="mt-2 text-sm text-gray-400">Capture → Geometry Lock → Prompt → Render Job → Version.</p></div>
        <button onClick={connect} className="rounded-xl border border-dark-border p-3 text-gray-300"><RefreshCw size={18}/></button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
        <section className="space-y-4 rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">{status.connected && <CheckCircle2 size={18} className="text-green-400"/>}{status.connected ? 'SketchUp đã kết nối' : 'Chưa kết nối SketchUp'}</div>
          {model && <div className="space-y-2 text-xs text-gray-400"><p>Project: <span className="text-white">{project.name}</span></p><p>Model: <span className="text-white">{String(model.title || 'Untitled')}</span></p><p>Bridge: <span className="text-white">127.0.0.1:{status.port}</span></p><p>Assets: <span className="text-white">{project.assets.length}</span></p>{job && <p>Job: <span className="text-white uppercase">{job.status}</span></p>}</div>}

          {status.connected && <>
            <label className="block text-xs text-gray-400">Scene</label>
            <select value={scene} onChange={e=>setScene(e.target.value)} className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-3 text-sm">{scenes.length ? scenes.map(s=><option key={s.name}>{s.name}</option>) : <option value="">Current View</option>}</select>
            <label className="block text-xs text-gray-400">Geometry Lock</label>
            <div className="grid grid-cols-3 gap-2">{(['strict','balanced','creative'] as GeometryLockMode[]).map(mode => <button key={mode} onClick={()=>patchProject({geometryLock: mode})} className={`rounded-lg border px-2 py-2 text-[11px] uppercase ${project.geometryLock===mode ? 'border-brand-start bg-brand-start/10 text-white' : 'border-dark-border text-gray-500'}`}>{mode}</button>)}</div>
            <label className="block text-xs text-gray-400">Lệnh thiết kế</label>
            <textarea value={project.command} onChange={e=>patchProject({command:e.target.value})} placeholder="Ví dụ: Đổi phòng này sang Japandi ấm, giữ nguyên cửa sổ và bố cục." className="min-h-28 w-full rounded-xl border border-dark-border bg-dark-bg p-3 text-sm text-white outline-none"/>
            <button onClick={capture} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black disabled:opacity-50"><Camera size={17}/>{busy ? 'Đang xử lý...' : 'Capture vào Project'}</button>
            <button onClick={generate} disabled={busy || !source} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-start py-3 font-semibold text-black disabled:opacity-40"><Sparkles size={17}/>Generate Version</button>
          </>}
          {!status.connected && <p className="text-xs leading-5 text-gray-500">Trong SketchUp, mở DHP SketchUp AI và chọn Open LuxRender để tạo phiên kết nối.</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </section>

        <div className="space-y-5">
          <section className="min-h-[420px] overflow-hidden rounded-2xl border border-dark-border bg-black/40 flex items-center justify-center">
            {preview ? <img src={preview} className="h-full max-h-[62vh] w-full object-contain" alt="LuxRender source or version"/> : <div className="text-center text-gray-600"><Camera className="mx-auto mb-3"/><p className="text-sm">Viewport SketchUp / render version sẽ xuất hiện ở đây</p></div>}
          </section>
          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="mb-3 flex items-center gap-2"><Wand2 size={17} className="text-brand-start"/><h2 className="font-semibold">Prompt Bundle</h2></div>
            <div className="space-y-3 text-xs"><div><p className="mb-1 text-gray-500">IMAGE PROMPT</p><p className="rounded-xl bg-dark-bg p-3 leading-5 text-gray-200">{prompt.imagePrompt}</p></div><div><p className="mb-1 text-gray-500">GEOMETRY</p><p className="rounded-xl bg-dark-bg p-3 leading-5 text-gray-300">{prompt.geometryInstruction}</p></div><div><p className="mb-1 text-gray-500">NEGATIVE</p><p className="rounded-xl bg-dark-bg p-3 leading-5 text-gray-400">{prompt.negativePrompt}</p></div></div>
          </section>
        </div>
      </div>
    </div>
  </div>;
};
