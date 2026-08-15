const $ = (id) => document.getElementById(id);

const state = {
  scene: '',
  aspectRatio: '16:9',
  fov: 35,
  geometryLock: 'strict',
  sourceUrl: '',
  model: null,
  providerConfigured: false,
};

const RATIOS = ['16:9', '1:1', '4:3', '4:5', '5:4'];
const GEOMETRY = ['strict', 'balanced', 'creative'];
let nativeSeq = 0;
const nativePending = new Map();

window.LuxNativeResolve = (raw) => {
  const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const pending = nativePending.get(msg.id);
  if (!pending) return;
  nativePending.delete(msg.id);
  if (msg.ok) pending.resolve(msg.payload);
  else pending.reject(new Error((msg.payload && msg.payload.message) || 'SketchUp bridge error'));
};

function nativeRpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = `lux-${Date.now()}-${++nativeSeq}`;
    nativePending.set(id, { resolve, reject });
    window.sketchup.lux_rpc(JSON.stringify({ id, method, params }));
    window.setTimeout(() => {
      if (!nativePending.has(id)) return;
      nativePending.delete(id);
      reject(new Error('SketchUp bridge timeout'));
    }, 180000);
  });
}

async function httpRpc(method, params) {
  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });
  if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
  const payload = await response.json();
  if (payload && payload.error) throw new Error(payload.error);
  return payload;
}

async function rpc(method, params = {}) {
  if (window.sketchup && typeof window.sketchup.lux_rpc === 'function') {
    return nativeRpc(method, params);
  }
  return httpRpc(method, params);
}

function setBadge(el, label, mode = '') {
  el.textContent = label;
  el.className = `badge ${mode}`.trim();
}

function setJobStatus(message) {
  $('jobStatus').textContent = message;
}

function button(text, active, onClick) {
  const el = document.createElement('button');
  el.className = active ? 'chip active' : 'chip';
  el.textContent = text;
  el.addEventListener('click', onClick);
  return el;
}

function renderRatioButtons() {
  const root = $('ratioButtons');
  root.replaceChildren();
  RATIOS.forEach((ratio) => {
    root.appendChild(button(ratio, state.aspectRatio === ratio, async () => {
      try {
        state.aspectRatio = ratio;
        renderRatioButtons();
        await rpc('lux_set_aspect_ratio', { value: ratio });
        setJobStatus(`Aspect ratio: ${ratio}`);
      } catch (error) { setJobStatus(error.message || String(error)); }
    }));
  });
}

function renderGeometryButtons() {
  const root = $('geometryButtons');
  root.replaceChildren();
  GEOMETRY.forEach((mode) => {
    root.appendChild(button(mode.toUpperCase(), state.geometryLock === mode, () => {
      state.geometryLock = mode;
      renderGeometryButtons();
      buildPromptBundle();
    }));
  });
}

function geometryInstruction() {
  if (state.geometryLock === 'strict') return 'Preserve walls, doors, windows, camera, proportions and object positions. No geometry drift.';
  if (state.geometryLock === 'balanced') return 'Preserve architectural structure and camera while allowing controlled design and material improvements.';
  return 'Preserve the core spatial identity but allow broader design changes and creative layout proposals.';
}

function buildPromptBundle() {
  const command = $('prompt').value.trim() || 'Create a photorealistic architectural visualization.';
  const scene = state.scene || 'Current View';
  $('imagePrompt').textContent = `Scene: ${scene}. ${command} Architectural photography, realistic materials, physically plausible lighting, high detail.`;
  $('geometryPrompt').textContent = geometryInstruction();
  $('negativePrompt').textContent = 'warped walls, distorted perspective, duplicate furniture, floating objects, broken geometry, text artifacts, low-detail materials';
}

async function refresh() {
  try {
    const [status, model, camera, controlPlane] = await Promise.all([
      rpc('lux_status'),
      rpc('lux_get_model_info'),
      rpc('lux_get_camera'),
      rpc('lux_control_plane_status').catch(() => ({ configured: false })),
    ]);

    state.model = model;
    state.aspectRatio = model.aspect_ratio || state.aspectRatio;
    state.fov = Number(camera.fov || model.fov || 35);
    state.providerConfigured = !!controlPlane.configured;

    $('modelMeta').textContent = `${model.title || 'Untitled'} • ${model.scenes.length} scene • ${model.materials_count} material • ${model.selection_count} selected • bridge :${status.port}`;
    setBadge($('bridgeBadge'), `Bridge :${status.port}`, 'ok');
    setBadge($('providerBadge'), state.providerConfigured ? 'AI backend configured' : 'AI backend chưa cấu hình', state.providerConfigured ? 'ok' : 'warn');

    const select = $('scene');
    select.replaceChildren();
    const current = document.createElement('option');
    current.value = '';
    current.textContent = 'Current View';
    select.appendChild(current);
    model.scenes.forEach((scene) => {
      const option = document.createElement('option');
      option.value = scene.name;
      option.textContent = scene.name;
      select.appendChild(option);
    });
    if (model.active_scene && [...select.options].some((o) => o.value === model.active_scene)) {
      select.value = model.active_scene;
      state.scene = model.active_scene;
    }

    $('fov').value = String(Math.round(state.fov));
    $('fovValue').textContent = `${Math.round(state.fov)}°`;
    renderRatioButtons();
    renderGeometryButtons();
    buildPromptBundle();
    setJobStatus('Sẵn sàng. LuxRender Local Studio đang chạy native trong SketchUp.');
  } catch (error) {
    setBadge($('bridgeBadge'), 'Bridge lỗi', 'warn');
    setJobStatus(error.message || String(error));
  }
}

async function capture() {
  try {
    setJobStatus('Đang capture viewport từ SketchUp…');
    const result = await rpc('lux_capture_scene', { name: state.scene, aspectRatio: state.aspectRatio });
    state.sourceUrl = result.dataUrl;
    $('sourceImage').src = state.sourceUrl;
    $('sourceImage').hidden = false;
    $('emptyState').hidden = true;
    $('captureMeta').textContent = `${state.scene || 'Current View'} • ${state.aspectRatio} • FOV ${Math.round(state.fov)}°`;
    setJobStatus('Capture hoàn tất.');
  } catch (error) { setJobStatus(error.message || String(error)); }
}

async function loadScenePreviews() {
  try {
    setJobStatus('Đang tạo scene previews…');
    const previews = await rpc('lux_get_scene_previews', { width: 320, height: 200 });
    const grid = $('sceneGrid');
    grid.replaceChildren();
    previews.forEach((item) => {
      const card = document.createElement('button');
      card.className = 'scene-card';
      const image = document.createElement('img');
      image.src = item.dataUrl;
      image.alt = item.name;
      const label = document.createElement('span');
      label.textContent = item.name;
      card.append(image, label);
      card.addEventListener('click', async () => {
        state.scene = item.name;
        $('scene').value = item.name;
        await capture();
      });
      grid.appendChild(card);
    });
    setJobStatus(`Đã tạo ${previews.length} scene preview.`);
  } catch (error) { setJobStatus(error.message || String(error)); }
}

async function readContext() {
  try {
    const [selection, materials] = await Promise.all([rpc('lux_get_selection'), rpc('lux_get_materials')]);
    $('contextOutput').textContent = JSON.stringify({ selection, materials }, null, 2);
    setJobStatus(`Đã đọc ${selection.length} selection và ${materials.length} material.`);
  } catch (error) { setJobStatus(error.message || String(error)); }
}

async function saveSource() {
  if (!state.sourceUrl) return setJobStatus('Chưa có ảnh để lưu.');
  try {
    const safeScene = (state.scene || 'current-view').replace(/[^0-9A-Za-z_-]+/g, '-');
    const result = await rpc('lux_save_image', { dataUrl: state.sourceUrl, filename: `luxrender-${safeScene}.png` });
    setJobStatus(result.path ? `Đã lưu: ${result.path}` : 'Đã hủy lưu ảnh.');
  } catch (error) { setJobStatus(error.message || String(error)); }
}

function prepareRenderJob() {
  buildPromptBundle();
  if (!state.sourceUrl) return setJobStatus('Hãy Capture viewport trước khi chuẩn bị Render Job.');
  if (!state.providerConfigured) return setJobStatus('Render Job đã sẵn sàng về prompt/context. AI backend chưa cấu hình server-side; plugin không chứa API key.');
  setJobStatus('AI backend đã cấu hình. Bước tiếp theo là gửi media-job qua Control Plane.');
}

document.addEventListener('DOMContentLoaded', () => {
  $('scene').addEventListener('change', (event) => { state.scene = event.target.value; buildPromptBundle(); });
  $('fov').addEventListener('input', (event) => { state.fov = Number(event.target.value); $('fovValue').textContent = `${state.fov}°`; });
  $('fov').addEventListener('change', async () => {
    try { await rpc('lux_set_field_of_view', { value: state.fov }); setJobStatus(`FOV: ${state.fov}°`); }
    catch (error) { setJobStatus(error.message || String(error)); }
  });
  $('prompt').addEventListener('input', buildPromptBundle);
  $('capture').addEventListener('click', capture);
  $('loadScenes').addEventListener('click', loadScenePreviews);
  $('context').addEventListener('click', readContext);
  $('save').addEventListener('click', saveSource);
  $('refresh').addEventListener('click', refresh);
  $('prepareJob').addEventListener('click', prepareRenderJob);
  refresh();
});
