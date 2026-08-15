// Browser transport for LuxRender backend.
// SketchUp's embedded Chromium handles HTTPS/TLS more reliably than Ruby Net::HTTP
// on some Windows installations. Provider credentials remain server-side.

const LOCAL_RENDER_BRIDGE = 'http://127.0.0.1:8787';

function normalizeBackendUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function validateBackendBase(base) {
  if (!base) throw new Error('Chưa cấu hình LuxRender Backend URL.');
  if (!/^https:\/\//i.test(base) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base)) {
    throw new Error('Backend phải dùng HTTPS hoặc HTTP localhost.');
  }
}

async function backendFetchAt(baseUrl, path, options = {}, timeoutMs = 240000) {
  const base = normalizeBackendUrl(baseUrl);
  validateBackendBase(base);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, {
      mode: 'cors',
      cache: 'no-store',
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    let payload = {};
    const text = await response.text();
    if (text) {
      try { payload = JSON.parse(text); }
      catch (_error) { throw new Error(`Backend trả dữ liệu không hợp lệ (HTTP ${response.status}).`); }
    }

    if (!response.ok) {
      const message = payload?.error || `Backend HTTP ${response.status}`;
      const attempts = Array.isArray(payload?.attemptedModels) && payload.attemptedModels.length
        ? ` • models: ${payload.attemptedModels.map((item) => `${item.model}:${item.status || 'ERR'}`).join(' → ')}`
        : '';
      const suffix = payload?.requestId ? ` • ${payload.requestId}` : '';
      const error = new Error(`${message}${attempts}${suffix}`);
      error.status = response.status;
      error.payload = payload;
      error.backendUrl = base;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Kết nối AI backend quá thời gian chờ.');
      timeoutError.backendUrl = base;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function backendFetch(path, options = {}, timeoutMs = 240000) {
  const base = normalizeBackendUrl(state.backendUrl || $('backendUrl').value);
  return backendFetchAt(base, path, options, timeoutMs);
}

function shouldTryLocalFallback(error) {
  const payload = error?.payload || {};
  const text = String(error?.message || '').toLowerCase();
  if (payload?.quotaExhausted) return true;
  if (error?.status === 429) return true;
  return text.includes('quota') || text.includes('resource_exhausted') || text.includes('không còn gemini image model');
}

async function localHealth() {
  try {
    return await backendFetchAt(LOCAL_RENDER_BRIDGE, '/api/health', { method: 'GET' }, 2500);
  } catch (_error) {
    return null;
  }
}

function localRuntimeLabel(runtime) {
  if (!runtime) return 'Chưa kiểm tra Local AI.';
  if (runtime.ready) return `Local AI Ready${runtime.checkpoint ? ` • ${runtime.checkpoint}` : ''}`;
  if (runtime.bridge_running && !runtime.comfy_running) return 'Bridge đã chạy • ComfyUI chưa chạy ở :8188';
  if (runtime.bridge_running) return 'Bridge + ComfyUI đã chạy • thiếu checkpoint tương thích';
  if (!runtime.node) return 'Thiếu Node.js 18+';
  return runtime.message || 'Local AI chưa sẵn sàng.';
}

async function refreshLocalRuntimeStatus() {
  try {
    const runtime = await rpc('lux_local_runtime_status');
    const el = $('localRuntimeStatus');
    if (el) el.textContent = localRuntimeLabel(runtime);
    return runtime;
  } catch (error) {
    const el = $('localRuntimeStatus');
    if (el) el.textContent = error.message || String(error);
    return null;
  }
}

async function runLocalDiagnostics() {
  const button = $('diagnoseLocalRuntime');
  if (button) button.disabled = true;
  try {
    setJobStatus('Đang chạy Local AI Self-Test…');
    const result = await rpc('lux_local_runtime_diagnostics');
    const output = $('localDiagnostics');
    if (output) {
      const lines = (result.checks || []).map((item) => `${item.ok ? 'PASS' : 'FAIL'} • ${item.id} • ${item.message}`);
      output.textContent = [result.summary || '', ...lines].filter(Boolean).join('\n');
      output.hidden = false;
    }
    if ($('localRuntimeStatus')) $('localRuntimeStatus').textContent = localRuntimeLabel(result.status);
    setJobStatus(result.ready ? 'Local AI Self-Test PASS • hệ local đã sẵn sàng.' : 'Local AI Self-Test chưa PASS • xem mục FAIL để xử lý.');
    return result;
  } catch (error) {
    setJobStatus(`Self-Test lỗi • ${error.message || String(error)}`);
    throw error;
  } finally {
    if (button) button.disabled = false;
  }
}

async function startLocalRuntime() {
  const button = $('startLocalRuntime');
  if (button) button.disabled = true;
  try {
    setJobStatus('Đang khởi động LuxRender Local Runtime…');
    const runtime = await rpc('lux_local_runtime_start');
    const el = $('localRuntimeStatus');
    if (el) el.textContent = localRuntimeLabel(runtime);
    if (runtime.ready) {
      setBadge($('providerBadge'), 'local AI', 'ok');
      setJobStatus('Local AI Ready • ComfyUI + checkpoint đã sẵn sàng.');
    } else {
      setJobStatus(runtime.message || 'Local Runtime đã khởi động nhưng ComfyUI/checkpoint chưa sẵn sàng.');
    }
    return runtime;
  } finally {
    if (button) button.disabled = false;
  }
}

async function ensureLocalRuntime() {
  let local = await localHealth();
  if (local?.ok) return local;

  const runtime = await startLocalRuntime();
  if (!runtime?.ready) {
    throw new Error(localRuntimeLabel(runtime));
  }
  local = await localHealth();
  if (!local?.ok) throw new Error('Local Bridge đã khởi động nhưng Chromium chưa kết nối được 127.0.0.1:8787.');
  return local;
}

function installLocalRuntimeControls() {
  const backendSection = $('backendStatus')?.closest('section');
  if (!backendSection || $('localRuntimeStatus')) return;

  const title = document.createElement('div');
  title.className = 'section-title';
  title.style.marginTop = '12px';
  title.textContent = 'Local AI Runtime';

  const row = document.createElement('div');
  row.className = 'button-row';
  const start = document.createElement('button');
  start.id = 'startLocalRuntime';
  start.textContent = 'Khởi động Local AI';
  const check = document.createElement('button');
  check.id = 'checkLocalRuntime';
  check.textContent = 'Kiểm tra';
  const diagnose = document.createElement('button');
  diagnose.id = 'diagnoseLocalRuntime';
  diagnose.textContent = 'Self-Test';
  row.append(start, check, diagnose);

  const status = document.createElement('div');
  status.id = 'localRuntimeStatus';
  status.className = 'muted';
  status.textContent = 'Đang kiểm tra Local AI…';

  const diagnostics = document.createElement('pre');
  diagnostics.id = 'localDiagnostics';
  diagnostics.className = 'context-output';
  diagnostics.hidden = true;

  backendSection.append(title, row, status, diagnostics);
  start.addEventListener('click', () => startLocalRuntime().catch((error) => setJobStatus(error.message || String(error))));
  check.addEventListener('click', refreshLocalRuntimeStatus);
  diagnose.addEventListener('click', () => runLocalDiagnostics().catch(() => {}));
  window.setTimeout(refreshLocalRuntimeStatus, 150);
}

async function testBackend() {
  try {
    state.backendUrl = normalizeBackendUrl($('backendUrl').value || state.backendUrl);
    setJobStatus('Đang kiểm tra AI backend qua HTTPS browser…');
    const [health, local, nativeLocal] = await Promise.all([
      backendFetch('/api/health', { method: 'GET' }, 20000),
      localHealth(),
      rpc('lux_local_runtime_status').catch(() => null),
    ]);
    const ready = health?.imageProvider && health.imageProvider !== 'unconfigured';
    const models = Array.isArray(health?.imageModels) ? health.imageModels : [health?.imageModel].filter(Boolean);
    const localReady = !!local?.ok;
    const localLabel = localReady ? ` • local ${local.provider || 'AI'} sẵn sàng` : ` • ${localRuntimeLabel(nativeLocal)}`;
    $('backendStatus').textContent = ready
      ? `Sẵn sàng • ${health.imageProvider} • ${models.join(' → ')} • auto failover${localLabel}`
      : `Backend chạy nhưng provider key chưa được cấu hình${localLabel}.`;
    setBadge($('providerBadge'), ready ? health.imageProvider : (localReady ? 'local AI' : 'Provider chưa cấu hình'), ready || localReady ? 'ok' : 'warn');
    state.providerConfigured = ready || localReady;
    if ($('localRuntimeStatus')) $('localRuntimeStatus').textContent = localRuntimeLabel(nativeLocal);
    setJobStatus(
      localReady
        ? `AI sẵn sàng • cloud trước, local ${local.provider || 'AI'} tự động khi cloud hết quota.`
        : (ready ? 'Cloud AI sẵn sàng • Local Runtime sẽ tự khởi động nếu cloud hết quota.' : 'Backend online nhưng chưa có provider key server-side.')
    );
  } catch (error) {
    const local = await localHealth();
    if (local?.ok) {
      state.providerConfigured = true;
      setBadge($('providerBadge'), 'local AI', 'ok');
      $('backendStatus').textContent = `Cloud lỗi • Local ${local.provider || 'AI'} sẵn sàng tại ${LOCAL_RENDER_BRIDGE}`;
      setJobStatus('Cloud không khả dụng nhưng Local AI đã sẵn sàng.');
      return;
    }
    state.providerConfigured = false;
    setBadge($('providerBadge'), 'AI backend lỗi', 'warn');
    $('backendStatus').textContent = error.message || String(error);
    setJobStatus(error.message || String(error));
  }
}

async function renderAI() {
  buildPromptBundle();
  if (!state.sourceUrl) return setJobStatus('Hãy Capture viewport trước khi Render AI.');

  state.backendUrl = normalizeBackendUrl($('backendUrl').value || state.backendUrl);
  if (!state.backendUrl) return setJobStatus('Hãy nhập và lưu LuxRender Backend URL trước.');

  const renderButton = $('prepareJob');
  const requestBody = JSON.stringify({
    sourceDataUrl: state.sourceUrl,
    imagePrompt: $('imagePrompt').textContent,
    geometryInstruction: $('geometryPrompt').textContent,
    negativePrompt: $('negativePrompt').textContent,
    aspectRatio: state.aspectRatio,
    imageSize: '1K',
  });

  renderButton.disabled = true;
  try {
    let result;
    try {
      setJobStatus('queued → cloud Gemini → auto failover model nếu cần…');
      result = await backendFetch('/api/render', { method: 'POST', body: requestBody }, 300000);
    } catch (cloudError) {
      if (!shouldTryLocalFallback(cloudError)) throw cloudError;
      setJobStatus('Cloud hết quota → tự khởi động Local AI…');
      try {
        await ensureLocalRuntime();
        setJobStatus('Local AI Ready → ComfyUI đang render…');
        result = await backendFetchAt(LOCAL_RENDER_BRIDGE, '/api/render', { method: 'POST', body: requestBody }, 360000);
      } catch (localError) {
        throw new Error(`${cloudError.message} • Local fallback: ${localError.message}`);
      }
    }

    if (!result?.imageUrl) throw new Error('AI backend không trả về ảnh.');
    showRender(result.imageUrl, result);
    setBadge($('providerBadge'), result.model || result.provider || 'AI ready', 'ok');
    const request = result.requestId ? ` • ${result.requestId}` : '';
    const failover = result?.metadata?.failoverCount ? ` • failover ${result.metadata.failoverCount}` : '';
    const transport = result?.metadata?.transport ? ` • ${result.metadata.transport}` : '';
    setJobStatus(`completed • ${result.model || result.provider || 'AI Render'}${failover}${transport}${request}. Hãy Compare hoặc Lưu vào dự án.`);
  } catch (error) {
    setJobStatus(`failed • ${error.message || String(error)}`);
  } finally {
    renderButton.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', installLocalRuntimeControls);
