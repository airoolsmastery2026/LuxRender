import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw } from 'lucide-react';
import { sketchUpBridge, SketchUpScene, SketchUpStatus } from '../services/sketchupBridge';

export const SketchUpImport: React.FC = () => {
  const [status, setStatus] = useState<SketchUpStatus>({ connected: false });
  const [scenes, setScenes] = useState<SketchUpScene[]>([]);
  const [scene, setScene] = useState('');
  const [preview, setPreview] = useState('');
  const [model, setModel] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setError('');
    const next = await sketchUpBridge.status(); setStatus(next);
    if (!next.connected) return;
    try {
      const [list, info] = await Promise.all([sketchUpBridge.scenes(), sketchUpBridge.modelInfo()]);
      setScenes(list); setModel(info); if (list[0]) setScene(list[0].name);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => { connect(); }, []);

  const capture = async () => {
    setBusy(true); setError('');
    try {
      const result = await sketchUpBridge.captureScene(scene);
      setPreview(result.dataUrl);
      sessionStorage.setItem('luxrender.sketchup.source', result.dataUrl);
      sessionStorage.setItem('luxrender.sketchup.scene', scene || 'Current View');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return <div className="min-h-[100dvh] bg-dark-bg text-white p-5 md:p-10 overflow-y-auto">
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-brand-start">LuxRender CAD Bridge</p><h1 className="mt-2 text-3xl font-bold">Import từ SketchUp</h1><p className="mt-2 text-sm text-gray-400">Scene → viewport → source asset, không qua NBOX.</p></div><button onClick={connect} className="rounded-xl border border-dark-border p-3 text-gray-300"><RefreshCw size={18}/></button></div>
      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">{status.connected && <CheckCircle2 size={18} className="text-green-400"/>}{status.connected ? 'SketchUp đã kết nối' : 'Chưa kết nối SketchUp'}</div>
          {model && <div className="mt-4 space-y-2 text-xs text-gray-400"><p>Model: <span className="text-white">{String(model.title || 'Untitled')}</span></p><p>Bridge: <span className="text-white">127.0.0.1:{status.port}</span></p><p>Plugin: <span className="text-white">v{status.version || '?'}</span></p></div>}
          {status.connected && <><label className="mt-5 block text-xs text-gray-400">Scene</label><select value={scene} onChange={e=>setScene(e.target.value)} className="mt-2 w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-3 text-sm">{scenes.length ? scenes.map(s=><option key={s.name}>{s.name}</option>) : <option value="">Current View</option>}</select><button onClick={capture} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black disabled:opacity-50"><Camera size={17}/>{busy ? 'Đang capture...' : 'Capture vào LuxRender'}</button></>}
          {!status.connected && <p className="mt-4 text-xs leading-5 text-gray-500">Mở LuxRender bằng nút Open LuxRender trong DHP SketchUp AI. Plugin sẽ truyền cổng bridge qua URL.</p>}
          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
        </section>
        <section className="min-h-[420px] overflow-hidden rounded-2xl border border-dark-border bg-black/40 flex items-center justify-center">
          {preview ? <img src={preview} className="h-full max-h-[70vh] w-full object-contain" alt="SketchUp source"/> : <div className="text-center text-gray-600"><Camera className="mx-auto mb-3"/><p className="text-sm">Viewport SketchUp sẽ xuất hiện ở đây</p></div>}
        </section>
      </div>
    </div>
  </div>;
};
