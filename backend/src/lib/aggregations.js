// Lógica de agregación de gastos por periodo. Aislada de las rutas HTTP para que
// sea fácil reutilizarla o añadir nuevas vistas temporales (ej. anual) en el futuro.
import { db } from '../db/connection.js';
import {
  PERIOD_RESOLVERS,
  getMonthsInRange,
  getMonthRange,
  getBiweeklyRange,
  monthLabel,
  todayISO,
} from './dateUtils.js';

function sumaGastos(start, end) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(monto), 0) AS total,
              COALESCE(SUM(gmf_amount), 0) AS gmfTotal,
              COALESCE(SUM(CASE WHEN es_gasto_hormiga = 1 THEN monto ELSE 0 END), 0) AS hormigaTotal,
              COUNT(*) AS cantidad
       FROM gastos WHERE fecha BETWEEN ? AND ?`
    )
    .get(start, end);
  return row;
}

function porCategoria(start, end) {
  return db
    .prepare(
      `SELECT c.id AS categoriaId, c.nombre, c.color, COALESCE(SUM(g.monto), 0) AS total, COUNT(g.id) AS cantidad
       FROM categorias c
       LEFT JOIN gastos g ON g.categoria_id = c.id AND g.fecha BETWEEN ? AND ?
       GROUP BY c.id
       HAVING total > 0
       ORDER BY total DESC`
    )
    .all(start, end);
}

function serieDiaria(start, end) {
  return db
    .prepare(
      `SELECT fecha, COALESCE(SUM(monto), 0) AS total
       FROM gastos WHERE fecha BETWEEN ? AND ?
       GROUP BY fecha ORDER BY fecha ASC`
    )
    .all(start, end);
}

export function resumenPeriodo(periodo, fechaRef = todayISO()) {
  const resolver = PERIOD_RESOLVERS[periodo];
  if (!resolver) throw new Error(`Periodo no soportado: ${periodo}`);

  const actual = resolver.current(fechaRef);
  const anterior = resolver.previous(fechaRef);

  const totalActual = sumaGastos(actual.start, actual.end);
  const totalAnterior = sumaGastos(anterior.start, anterior.end);
  const categorias = porCategoria(actual.start, actual.end);

  const variacionPct =
    totalAnterior.total > 0
      ? ((totalActual.total - totalAnterior.total) / totalAnterior.total) * 100
      : totalActual.total > 0
      ? 100
      : 0;

  return {
    periodo,
    rango: actual,
    rangoAnterior: anterior,
    total: totalActual.total,
    totalAnterior: totalAnterior.total,
    variacionPct: Math.round(variacionPct * 10) / 10,
    gmfTotal: totalActual.gmfTotal,
    hormigaTotal: totalActual.hormigaTotal,
    hormigaPct: totalActual.total > 0 ? Math.round((totalActual.hormigaTotal / totalActual.total) * 1000) / 10 : 0,
    cantidadTransacciones: totalActual.cantidad,
    categoriaTop: categorias[0] ?? null,
    categorias,
  };
}

export function serieTemporal(start, end) {
  return serieDiaria(start, end);
}

export function distribucionCategorias(start, end) {
  return porCategoria(start, end);
}

export function resumenTrimestre(fechaRef = todayISO()) {
  const { current, previous } = PERIOD_RESOLVERS.trimestre;
  const actual = current(fechaRef);
  const meses = getMonthsInRange(actual.start, actual.end).map((mes) => {
    const totales = sumaGastos(mes.start, mes.end);
    return {
      ...mes,
      label: monthLabel(mes.start),
      total: totales.total,
      gmfTotal: totales.gmfTotal,
      hormigaTotal: totales.hormigaTotal,
    };
  });
  const base = resumenPeriodo('trimestre', fechaRef);
  return { ...base, meses };
}

export function totalesGMF(start, end) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(gmf_amount), 0) AS totalGMF,
              COUNT(CASE WHEN gmf_amount > 0 THEN 1 END) AS transaccionesConGMF,
              COALESCE(SUM(monto), 0) AS totalGastos
       FROM gastos WHERE fecha BETWEEN ? AND ?`
    )
    .get(start, end);
  return {
    ...row,
    pctSobreTotal: row.totalGastos > 0 ? Math.round((row.totalGMF / row.totalGastos) * 1000) / 10 : 0,
  };
}

export function panelHormiga(start, end) {
  const total = sumaGastos(start, end);
  const porCat = db
    .prepare(
      `SELECT c.nombre, c.color, COALESCE(SUM(g.monto), 0) AS total, COUNT(g.id) AS cantidad
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id
       WHERE g.es_gasto_hormiga = 1 AND g.fecha BETWEEN ? AND ?
       GROUP BY c.id ORDER BY total DESC`
    )
    .all(start, end);
  const serie = db
    .prepare(
      `SELECT fecha, COALESCE(SUM(monto), 0) AS total
       FROM gastos WHERE es_gasto_hormiga = 1 AND fecha BETWEEN ? AND ?
       GROUP BY fecha ORDER BY fecha ASC`
    )
    .all(start, end);
  return {
    totalHormiga: total.hormigaTotal,
    totalGeneral: total.total,
    pctSobreTotal: total.total > 0 ? Math.round((total.hormigaTotal / total.total) * 1000) / 10 : 0,
    porCategoria: porCat,
    serie,
  };
}

function totalAhorradoNeto() {
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'aporte' THEN monto ELSE 0 END), 0) AS aportes,
         COALESCE(SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END), 0) AS retiros
       FROM ahorros`
    )
    .get();
  return row.aportes - row.retiros;
}

// Saldo disponible: arranca en `saldo_inicial`, se le suma cada ingreso (ej. un
// pago de nómina), se le resta cada gasto registrado —su monto más el 4x1000,
// si aplica— y también se le resta lo que tengas apartado en Ahorros (ese dinero
// sigue siendo tuyo, pero deja de contar como disponible para gastar). Todo esto
// sin importar la fecha de cada movimiento. `fecha_saldo_inicial` es solo
// informativa (desde cuándo es válido ese saldo de referencia); no filtra nada.
export function resumenSaldo() {
  const config = db.prepare('SELECT * FROM configuracion WHERE id = 1').get();
  const gastado = db
    .prepare(`SELECT COALESCE(SUM(monto + gmf_amount), 0) AS total FROM gastos`)
    .get().total;
  const ingresado = db.prepare(`SELECT COALESCE(SUM(monto), 0) AS total FROM ingresos`).get().total;
  const ahorrado = totalAhorradoNeto();

  return {
    saldoInicial: config.saldo_inicial,
    fechaSaldoInicial: config.fecha_saldo_inicial,
    totalGastado: gastado,
    totalIngresos: ingresado,
    totalAhorrado: ahorrado,
    saldoActual: config.saldo_inicial + ingresado - gastado - ahorrado,
  };
}

export function actualizarSaldoInicial(saldoInicial, fechaSaldoInicial) {
  db.prepare(
    `UPDATE configuracion SET saldo_inicial = ?, fecha_saldo_inicial = ?, updated_at = datetime('now') WHERE id = 1`
  ).run(saldoInicial, fechaSaldoInicial);
  return resumenSaldo();
}

// Ahorros: meta opcional (0 = sin meta) y progreso acumulado (aportes - retiros).
export function resumenAhorro() {
  const config = db.prepare('SELECT meta_ahorro FROM configuracion WHERE id = 1').get();
  const totalAhorrado = totalAhorradoNeto();
  return {
    metaAhorro: config.meta_ahorro,
    totalAhorrado,
    progresoPct:
      config.meta_ahorro > 0 ? Math.round((totalAhorrado / config.meta_ahorro) * 1000) / 10 : null,
  };
}

export function actualizarMetaAhorro(metaAhorro) {
  db.prepare(`UPDATE configuracion SET meta_ahorro = ?, updated_at = datetime('now') WHERE id = 1`).run(
    metaAhorro
  );
  return resumenAhorro();
}

// El presupuesto se puede medir por mes calendario o por quincena (útil si tu
// pago es quincenal) — cada uno con su propio ingreso de referencia, para no
// tener que convertir entre uno y otro. `periodo_presupuesto` en
// `configuracion` guarda cuál de los dos está activo en el Resumen y en la
// pestaña Presupuesto; ambos ingresos quedan guardados aunque solo uno esté
// activo, así se puede cambiar de vista sin perder lo ya configurado.
function rangoActivo(periodo, fechaRef) {
  return periodo === 'quincenal' ? getBiweeklyRange(fechaRef) : getMonthRange(fechaRef);
}

function configPresupuesto() {
  return db
    .prepare(
      `SELECT ingreso_mensual_referencia, ingreso_quincenal_referencia, periodo_presupuesto
       FROM configuracion WHERE id = 1`
    )
    .get();
}

// Cuánto llevas gastado en el periodo activo (mes o quincena) frente a tu
// ingreso de referencia para ese periodo (un número que tú defines, no se
// calcula solo de los Ingresos registrados, porque el ingreso real puede
// llegar en fechas irregulares y no siempre coincide con el periodo).
export function resumenPresupuesto(fechaRef = todayISO()) {
  const config = configPresupuesto();
  const periodo = config.periodo_presupuesto;
  const { start, end } = rangoActivo(periodo, fechaRef);
  const gastado = sumaGastos(start, end);
  const totalGastado = gastado.total + gastado.gmfTotal;
  const ingreso =
    periodo === 'quincenal' ? config.ingreso_quincenal_referencia : config.ingreso_mensual_referencia;

  return {
    periodo,
    ingresoMensual: config.ingreso_mensual_referencia,
    ingresoQuincenal: config.ingreso_quincenal_referencia,
    ingresoActivo: ingreso,
    rango: { start, end },
    gastadoPeriodo: totalGastado,
    pctGastado: ingreso > 0 ? Math.round((totalGastado / ingreso) * 1000) / 10 : null,
    restante: ingreso > 0 ? ingreso - totalGastado : null,
  };
}

export function actualizarPeriodoPresupuesto(periodo) {
  db.prepare(`UPDATE configuracion SET periodo_presupuesto = ?, updated_at = datetime('now') WHERE id = 1`).run(
    periodo
  );
  return resumenPresupuesto();
}

export function actualizarIngresoReferencia(periodo, monto) {
  const columna = periodo === 'quincenal' ? 'ingreso_quincenal_referencia' : 'ingreso_mensual_referencia';
  db.prepare(`UPDATE configuracion SET ${columna} = ?, updated_at = datetime('now') WHERE id = 1`).run(monto);
  return resumenPresupuesto();
}

// Sugerencia de referencia (no es una regla que se aplique sola): reparte el
// ingreso 50% necesidades / 30% gustos / 20% ahorro (el ahorro se maneja aparte
// en la sección Ahorros, así que aquí solo se sugiere el 80% que sí es gasto).
const PRESUPUESTO_SUGERIDO = {
  Alimentación: 20,
  Transporte: 10,
  Servicios: 12,
  Salud: 5,
  Entretenimiento: 8,
  'Gastos hormiga': 8,
  'Comisiones bancarias': 2,
  Otros: 5,
};

// Presupuesto por categoría: cada categoría con un % de ingreso asignado
// (tabla `presupuestos_categoria`) se compara contra lo gastado en ella
// durante el periodo activo (mes o quincena). Las categorías sin presupuesto
// definido se listan aparte, sin barra.
export function resumenPresupuestosCategoria(fechaRef = todayISO()) {
  const config = configPresupuesto();
  const periodo = config.periodo_presupuesto;
  const ingreso =
    periodo === 'quincenal' ? config.ingreso_quincenal_referencia : config.ingreso_mensual_referencia;
  const { start, end } = rangoActivo(periodo, fechaRef);

  const filas = db
    .prepare(
      `SELECT c.id AS categoriaId, c.nombre, c.color,
              p.porcentaje_ingreso AS porcentajeIngreso,
              COALESCE(SUM(CASE WHEN g.fecha BETWEEN ? AND ? THEN g.monto + g.gmf_amount ELSE 0 END), 0) AS gastado
       FROM categorias c
       LEFT JOIN presupuestos_categoria p ON p.categoria_id = c.id
       LEFT JOIN gastos g ON g.categoria_id = c.id
       GROUP BY c.id
       ORDER BY c.nombre ASC`
    )
    .all(start, end);

  const conPresupuesto = [];
  const sinPresupuesto = [];
  for (const fila of filas) {
    if (fila.porcentajeIngreso === null) {
      sinPresupuesto.push({
        categoriaId: fila.categoriaId,
        nombre: fila.nombre,
        color: fila.color,
        gastado: fila.gastado,
        sugerenciaPct: PRESUPUESTO_SUGERIDO[fila.nombre] ?? null,
      });
      continue;
    }
    const monto = ingreso > 0 ? (ingreso * fila.porcentajeIngreso) / 100 : 0;
    conPresupuesto.push({
      categoriaId: fila.categoriaId,
      nombre: fila.nombre,
      color: fila.color,
      porcentajeIngreso: fila.porcentajeIngreso,
      montoPresupuestado: monto,
      gastado: fila.gastado,
      pct: monto > 0 ? Math.round((fila.gastado / monto) * 1000) / 10 : null,
    });
  }

  return { periodo, ingresoActivo: ingreso, conPresupuesto, sinPresupuesto };
}

export function actualizarPresupuestoCategoria(categoriaId, porcentajeIngreso) {
  db.prepare(
    `INSERT INTO presupuestos_categoria (categoria_id, porcentaje_ingreso, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(categoria_id) DO UPDATE SET porcentaje_ingreso = excluded.porcentaje_ingreso, updated_at = datetime('now')`
  ).run(categoriaId, porcentajeIngreso);
  return resumenPresupuestosCategoria();
}

export function eliminarPresupuestoCategoria(categoriaId) {
  db.prepare('DELETE FROM presupuestos_categoria WHERE categoria_id = ?').run(categoriaId);
  return resumenPresupuestosCategoria();
}

// Aplica los porcentajes sugeridos solo a las categorías que todavía no
// tienen un presupuesto propio definido — nunca pisa lo que el usuario ya
// haya configurado a mano.
export function aplicarPresupuestoSugerido() {
  const categorias = db.prepare('SELECT id, nombre FROM categorias').all();
  const insert = db.prepare(
    `INSERT INTO presupuestos_categoria (categoria_id, porcentaje_ingreso, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(categoria_id) DO NOTHING`
  );
  for (const cat of categorias) {
    const sugerido = PRESUPUESTO_SUGERIDO[cat.nombre];
    if (sugerido !== undefined) insert.run(cat.id, sugerido);
  }
  return resumenPresupuestosCategoria();
}
