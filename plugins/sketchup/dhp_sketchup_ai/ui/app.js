const $ = (s) => document.querySelector(s);

async function refresh() {
  try {
    const info = await DHPBridge.call('get_model_info');
    $('#model').textContent = info.title || 'Untitled';
    $('#meta').textContent = `${info.scenes.length} scene • ${info.materials_count} material • ${info.selection_count} selected`;
    const select = $('#scene');
    const previous = select.value;
    select.innerHTML = '<option value="">Current view</option>' + info.scenes.map(s => `<option value="${escapeAttr(s.name)}">${escapeHtml(s.name)}</option>`).join('');
    if ([...select.options].some(o => o.value === previous)) select.value = previous;
    await refreshServerStatus();
    setStatus('Sẵn sàng');
  } catch (e) { setStatus(e.message); }
}

async function refreshServerStatus() {
  try {
    const state = await DHPBridge.call('server_status');
    $('#syncBadge').textContent = state.running ? `Sync :${state.port}` : 'Sync off';
    $('#syncBadge').classList.toggle('on', !!state.running);
  } catch (_) {}
}

async function capture() {
  setStatus('Đang chụp viewport…');
  try {
    const scene = $('#scene').value;
    if (scene) await DHPBridge.call('activate_scene', { name: scene });
    const result = await DHPBridge.call('capture_view', { width: 1600, height: 900 });
    $('#preview').src = result.dataUrl;
    $('#preview').hidden = false;
    setStatus('Đã chụp viewport 1600×900');
  } catch(e) { setStatus(e.message); }
}

async function openAI() {
  setStatus('Đang khởi động LuxRender bridge…');
  try {
    const result = await DHPBridge.call('start_sync');
    await refreshServerStatus();
    setStatus(`LuxRender đã mở • syncPort ${result.port}`);
  } catch(e) { setStatus(e.message); }
}

async function savePreview() {
  const src = $('#preview').src;
  if (!src || !src.startsWith('data:')) return setStatus('Chưa có ảnh preview để lưu');
  try {
    const result = await DHPBridge.call('save_image', { dataUrl: src, filename: 'dhp_sketchup_capture.png' });
    setStatus(result.path ? `Đã lưu: ${result.path}` : 'Đã hủy lưu ảnh');
  } catch(e) { setStatus(e.message); }
}

function setStatus(message) { $('#status').textContent = message; }
function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function escapeAttr(v) { return escapeHtml(v); }

document.addEventListener('DOMContentLoaded', () => {
  $('#refresh').onclick = refresh;
  $('#capture').onclick = capture;
  $('#openAI').onclick = openAI;
  $('#save').onclick = savePreview;
  document.querySelectorAll('.chip').forEach(btn => btn.onclick = () => {
    const prompt = $('#prompt');
    prompt.value = prompt.value ? `${prompt.value}\n${btn.dataset.prompt}` : btn.dataset.prompt;
    prompt.focus();
  });
  refresh();
});
