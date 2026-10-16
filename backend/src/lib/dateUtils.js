// Utilidades de fechas y cálculo de límites de periodo (semana, quincena, mes, trimestre).
// Todas las fechas se manejan como strings 'YYYY-MM-DD' en horario local, sin zona horaria,
// para evitar desfases de un día por conversión UTC.

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

// Semana ISO: lunes a domingo
export function getWeekRange(dateStr) {
  const d = parseISODate(dateStr);
  const dow = d.getDay(); // 0=domingo
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toISODate(start), end: toISODate(end) };
}

export function getPreviousWeekRange(dateStr) {
  const { start } = getWeekRange(dateStr);
  const prevAnchor = addDays(start, -1);
  return getWeekRange(prevAnchor);
}

// Quincena: 1-15 o 16-fin de mes
export function getBiweeklyRange(dateStr) {
  const d = parseISODate(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  if (d.getDate() <= 15) {
    return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m, 15)) };
  }
  const lastDay = new Date(y, m + 1, 0).getDate();
  return { start: toISODate(new Date(y, m, 16)), end: toISODate(new Date(y, m, lastDay)) };
}

export function getPreviousBiweeklyRange(dateStr) {
  const { start } = getBiweeklyRange(dateStr);
  const prevAnchor = addDays(start, -1);
  return getBiweeklyRange(prevAnchor);
}

export function getMonthRange(dateStr) {
  const d = parseISODate(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m, lastDay)) };
}

export function getPreviousMonthRange(dateStr) {
  const d = parseISODate(dateStr);
  const prevMonthAnchor = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return getMonthRange(toISODate(prevMonthAnchor));
}

// Trimestre calendario: Ene-Mar, Abr-Jun, Jul-Sep, Oct-Dic
export function getQuarterRange(dateStr) {
  const d = parseISODate(dateStr);
  const y = d.getFullYear();
  const qStartMonth = Math.floor(d.getMonth() / 3) * 3;
  const start = new Date(y, qStartMonth, 1);
  const end = new Date(y, qStartMonth + 3, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

export function getPreviousQuarterRange(dateStr) {
  const { start } = getQuarterRange(dateStr);
  const prevAnchor = addDays(start, -1);
  return getQuarterRange(prevAnchor);
}

export function getMonthsInRange(startStr, endStr) {
  const start = parseISODate(startStr);
  const end = parseISODate(endStr);
  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(getMonthRange(toISODate(cursor)));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function monthLabel(dateStr) {
  const d = parseISODate(dateStr);
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export const PERIOD_RESOLVERS = {
  semana: { current: getWeekRange, previous: getPreviousWeekRange },
  quincena: { current: getBiweeklyRange, previous: getPreviousBiweeklyRange },
  mes: { current: getMonthRange, previous: getPreviousMonthRange },
  trimestre: { current: getQuarterRange, previous: getPreviousQuarterRange },
};
