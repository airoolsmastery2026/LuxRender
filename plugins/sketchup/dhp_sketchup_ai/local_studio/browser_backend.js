// Browser transport for LuxRender backend.
// SketchUp's embedded Chromium handles HTTPS/TLS more reliably than Ruby Net::HTTP
// on some Windows installations. Provider credentials remain server-side.

function normalizeBackendUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

async function backendFetch(path, options = {}, timeoutMs = 240000) {
  const base = normalizeBackendUrl(state.backendUrl || $('backendUrl').value);
  if (!base) throw new Error('Chưa cấu hình LuxRender Backend URL.');
  if (!/^https:\/\//i.test(base) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base)) {
    throw new Error('Backend phải dùng HTTPS hoặc HTTP localhost.');
  }

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
      throw new Error(`${message}${attempts}${suffix}`);
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Kết nối AI backend quá thời gian chờ.');
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function testBackend() {
  try {
    state.backendUrl = normalizeBackendUrl($('backendUrl').value || state.backendUrl);
    setJobStatus('Đang kiểm tra AI backend qua HTTPS browser…');
    const health = await backendFetch('/api/health', { method: 'GET' }, 20000);
    const ready = health?.imageProvider && health.imageProvider !== 'unconfigured';
    const models = Array.isArray(health?.imageModels) ? health.imageModels : [health?.imageModel].filter(Boolean);
    $('backendStatus').textContent = ready
      ? `Sẵn sàng • ${health.imageProvider} • ${models.join(' → ')} • auto failover`
      : 'Backend chạy nhưng provider key chưa được cấu hình.';
    setBadge($('providerBadge'), ready ? health.imageProvider : 'Provider chưa cấu hình', ready ? 'ok' : 'warn');
    state.providerConfigured = ready;
    setJobStatus(ready ? 'AI backend sẵn sàng • tự chuyển model khi quota/model không khả dụng.' : 'Backend online nhưng chưa có provider key server-side.');
  } catch (error) {
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
  renderButton.disabled = true;
  try {
    setJobStatus('queued → uploading → generating → auto failover nếu cần…');
    const result = await backendFetch('/api/render', {
      method: 'POST',
      body: JSON.stringify({
        sourceDataUrl: state.sourceUrl,
        imagePrompt: $('imagePrompt').textContent,
        geometryInstruction: $('geometryPrompt').textContent,
        negativePrompt: $('negativePrompt').textContent,
        aspectRatio: state.aspectRatio,
        imageSize: '1K',
      }),
    }, 300000);

    if (!result?.imageUrl) throw new Error('AI backend không trả về ảnh.');
    showRender(result.imageUrl, result);
    setBadge($('providerBadge'), result.model || result.provider || 'AI ready', 'ok');
    const request = result.requestId ? ` • ${result.requestId}` : '';
    const failover = result?.metadata?.failoverCount ? ` • failover ${result.metadata.failoverCount}` : '';
    setJobStatus(`completed • ${result.model || 'AI Render'}${failover}${request}. Hãy Compare hoặc Lưu vào dự án.`);
  } catch (error) {
    setJobStatus(`failed • ${error.message || String(error)}`);
  } finally {
    renderButton.disabled = false;
  }
}
