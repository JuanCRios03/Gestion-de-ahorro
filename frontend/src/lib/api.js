const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Categorías
  getCategorias: () => request('/categorias'),
  crearCategoria: (data) => request('/categorias', { method: 'POST', body: JSON.stringify(data) }),
  eliminarCategoria: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),

  // Gastos
  getGastos: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/gastos${suffix}`);
  },
  crearGasto: (data) => request('/gastos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarGasto: (id, data) => request(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarGasto: (id) => request(`/gastos/${id}`, { method: 'DELETE' }),

  // Analítica
  getResumen: (periodo, fecha) => request(`/analytics/resumen?periodo=${periodo}&fecha=${fecha}`),
  getSerie: (start, end) => request(`/analytics/serie?start=${start}&end=${end}`),
  getCategoriasDistribucion: (start, end) => request(`/analytics/categorias?start=${start}&end=${end}`),
  getGMF: (start, end) => request(`/analytics/gmf?start=${start}&end=${end}`),
  getHormiga: (start, end) => request(`/analytics/hormiga?start=${start}&end=${end}`),

  // Saldo
  getSaldo: () => request('/config/saldo'),
  actualizarSaldo: (data) => request('/config/saldo', { method: 'PUT', body: JSON.stringify(data) }),

  // Ingresos
  getIngresos: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/ingresos${suffix}`);
  },
  crearIngreso: (data) => request('/ingresos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarIngreso: (id, data) => request(`/ingresos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarIngreso: (id) => request(`/ingresos/${id}`, { method: 'DELETE' }),

  // Ahorros
  getAhorroResumen: () => request('/ahorros/resumen'),
  actualizarMetaAhorro: (meta_ahorro) =>
    request('/ahorros/meta', { method: 'PUT', body: JSON.stringify({ meta_ahorro }) }),
  getAhorros: () => request('/ahorros'),
  crearAhorro: (data) => request('/ahorros', { method: 'POST', body: JSON.stringify(data) }),
  actualizarAhorro: (id, data) => request(`/ahorros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarAhorro: (id) => request(`/ahorros/${id}`, { method: 'DELETE' }),

  // Capturas automáticas (notificaciones bancarias)
  getCapturasConfig: () => request('/capturas/config'),
  getCapturas: (estado = 'pendiente') => request(`/capturas?estado=${estado}`),
  confirmarCaptura: (id, data) =>
    request(`/capturas/${id}/confirmar`, { method: 'POST', body: JSON.stringify(data) }),
  descartarCaptura: (id) => request(`/capturas/${id}/descartar`, { method: 'POST' }),

  // Presupuesto según el ingreso (mensual o quincenal)
  getPresupuesto: () => request('/presupuestos/resumen'),
  actualizarPeriodoPresupuesto: (periodo) =>
    request('/presupuestos/periodo', { method: 'PUT', body: JSON.stringify({ periodo }) }),
  actualizarIngresoReferencia: (periodo, monto) =>
    request('/presupuestos/ingreso', { method: 'PUT', body: JSON.stringify({ periodo, monto }) }),
  getPresupuestosCategoria: () => request('/presupuestos/categorias'),
  actualizarPresupuestoCategoria: (categoriaId, porcentaje_ingreso) =>
    request(`/presupuestos/categorias/${categoriaId}`, {
      method: 'PUT',
      body: JSON.stringify({ porcentaje_ingreso }),
    }),
  eliminarPresupuestoCategoria: (categoriaId) =>
    request(`/presupuestos/categorias/${categoriaId}`, { method: 'DELETE' }),
  aplicarPresupuestoSugerido: () => request('/presupuestos/categorias/sugerido', { method: 'POST' }),

  exportUrl: (format) => `${BASE}/export?format=${format}`,
};
