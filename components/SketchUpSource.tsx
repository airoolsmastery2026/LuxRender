import React, { useEffect, useState } from 'react';
import { Box, Camera, RefreshCw } from 'lucide-react';
import { sketchUpBridge, SketchUpScene, SketchUpStatus } from '../services/sketchupBridge';

type Props = { onCapture: (file: File) => void };

export const SketchUpSource: React.FC<Props> = ({ onCapture }) => {
  const [status, setStatus] = useState<SketchUpStatus>({ connected: false });
  const [scenes, setScenes] = useState<SketchUpScene[]>([]);
  const [scene, setScene] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    const next = await sketchUpBridge.status();
    setStatus(next);
    if (!next.connected) return setScenes([]);
    try {
      const list = await sketchUpBridge.scenes();
      setScenes(list);
      if (!scene && list[0]) setScene(list[0].name);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  useEffect(() => { refresh(); }, []);

  const capture = async () => {
    setBusy(true); setError('');
    try {
      const result = await sketchUpBridge.captureScene(scene);
      const response = await fetch(result.dataUrl);
      const blob = await response.blob();
      onCapture(new File([blob], `sketchup-${Date.now()}.png`, { type: blob.type || 'image/png' }));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return <div className="mt-4 rounded-2xl border border-dark-border bg-dark-surface p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Box size={20} className="text-brand-start"/><div><p className="text-sm font-semibold text-white">SketchUp</p><p className="text-xs text-gray-500">{status.connected ? `Đã kết nối • v${status.version || '?'}` : 'Chưa kết nối'}</p></div></div>
      <button onClick={refresh} className="p-2 text-gray-400 hover:text-white" title="Kiểm tra lại"><RefreshCw size={17}/></button>
    </div>
    {status.connected && <div className="mt-4 flex gap-2">
      <select value={scene} onChange={e => setScene(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white">
        {scenes.length ? scenes.map(s => <option key={s.name} value={s.name}>{s.name}</option>) : <option value="">Current View</option>}
      </select>
      <button disabled={busy} onClick={capture} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"><Camera size={16}/>{busy ? 'Đang lấy...' : 'Capture'}</button>
    </div>}
    {!status.connected && <p className="mt-3 text-xs text-gray-500">Trong SketchUp, mở DHP SketchUp AI và chọn Open LuxRender để tạo phiên kết nối.</p>}
    {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
  </div>;
};
