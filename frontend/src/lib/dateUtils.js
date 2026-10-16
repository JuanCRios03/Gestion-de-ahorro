// Réplica ligera de las utilidades de fecha del backend, para construir rangos en el cliente
// (ej. filtro de fechas personalizado) sin depender de una llamada al servidor.

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, days) {
  const d = parseISODate(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function todayISO() {
  return toISODate(new Date());
}
