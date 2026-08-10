(function () {
  let seq = 0;
  const pending = new Map();
  window.DHPBridge = {
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = `dhp-${Date.now()}-${++seq}`;
        pending.set(id, { resolve, reject });
        window.sketchup.dhp_rpc(JSON.stringify({ id, method, params }));
      });
    },
    _resolve(raw) {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const job = pending.get(msg.id);
      if (!job) return;
      pending.delete(msg.id);
      if (msg.ok) job.resolve(msg.payload);
      else job.reject(new Error((msg.payload && msg.payload.message) || 'Bridge error'));
    }
  };
})();
