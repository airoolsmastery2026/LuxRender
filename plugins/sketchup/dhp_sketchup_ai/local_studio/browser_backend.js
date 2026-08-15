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

async function testBackend() {
  try {
    state.backendUrl = normalizeBackendUrl($('backendUrl').value || state.backendUrl);
    setJobStatus('Đang kiểm tra AI backend qua HTTPS browser…');
    const [health, local] = await Promise.all([
      backendFetch('/api/health', { method: 'GET' }, 20000),
      localHealth(),
    ]);
    const ready = health?.imageProvider && health.imageProvider !== 'unconfigured';
    const models = Array.isArray(health?.imageModels) ? health.imageModels : [health?.imageModel].filter(Boolean);
    const localLabel = local?.ok ? ` • local ${local.provider || 'AI'} sẵn sàng` : ' • local bridge chưa chạy';
    $('backendStatus').textContent = ready
      ? `Sẵn sàng • ${health.imageProvider} • ${models.join(' → ')} • auto failover${localLabel}`
      : `Backend chạy nhưng provider key chưa được cấu hình${localLabel}.`;
    setBadge($('providerBadge'), ready ? health.imageProvider : (local?.ok ? 'local AI' : 'Provider chưa cấu hình'), ready || local?.ok ? 'ok' : 'warn');
    state.providerConfigured = ready || !!local?.ok;
    setJobStatus(
      local?.ok
        ? `AI sẵn sàng • cloud trước, local ${local.provider || 'AI'} tự động khi cloud hết quota.`
        : (ready ? 'Cloud AI sẵn sàng • local bridge chưa chạy.' : 'Backend online nhưng chưa có provider key server-side.')
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
      setJobStatus('Cloud hết quota → đang chuyển sang Local AI / ComfyUI…');
      try {
        result = await backendFetchAt(LOCAL_RENDER_BRIDGE, '/api/render', { method: 'POST', body: requestBody }, 360000);
      } catch (localError) {
        throw new Error(`${cloudError.message} • Local fallback chưa sẵn sàng: ${localError.message}. Chạy LuxRender Local Bridge + ComfyUI.`);
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
