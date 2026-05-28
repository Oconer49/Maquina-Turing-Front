const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/** Llama al backend y lanza Error si la respuesta no es OK. */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    throw new Error(detail || `Error HTTP ${res.status}`);
  }
  return data;
}

/** Cliente HTTP: máquinas, simulaciones, paso, ejecutar y reiniciar. */
export const api = {
  health: () => request('/health'),
  listMachines: () => request('/machines'),
  getMachine: (id, input) => request(`/machines/${id}${input != null ? `?input=${encodeURIComponent(input)}` : ''}`),
  createSimulation: (body) =>
    request('/simulations', { method: 'POST', body: JSON.stringify(body) }),
  getSimulation: (id) => request(`/simulations/${id}`),
  step: (id) => request(`/simulations/${id}/step`, { method: 'POST' }),
  run: (id, maxSteps) =>
    request(`/simulations/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ max_steps: maxSteps }),
    }),
  reset: (id) => request(`/simulations/${id}/reset`, { method: 'POST' }),
  deleteSimulation: (id) => request(`/simulations/${id}`, { method: 'DELETE' }),
};
