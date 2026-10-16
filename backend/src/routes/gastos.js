import { Router } from 'express';
import { db } from '../db/connection.js';
import { calcularGMF } from '../lib/gmf.js';
import { todayISO } from '../lib/dateUtils.js';

const router = Router();

function serializar(row) {
  return {
    ...row,
    es_gasto_hormiga: !!row.es_gasto_hormiga,
    es_comision_bancaria: !!row.es_comision_bancaria,
    aplica_gmf: !!row.aplica_gmf,
  };
}

// GET /api/gastos?start=&end=&categoria_id=&hormiga=1
router.get('/', (req, res) => {
  const { start, end, categoria_id, hormiga } = req.query;
  const clauses = [];
  const params = [];

  if (start) {
    clauses.push('fecha >= ?');
    params.push(start);
  }
  if (end) {
    clauses.push('fecha <= ?');
    params.push(end);
  }
  if (categoria_id) {
    clauses.push('categoria_id = ?');
    params.push(categoria_id);
  }
  if (hormiga === '1' || hormiga === 'true') {
    clauses.push('es_gasto_hormiga = 1');
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT g.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id
       ${where}
       ORDER BY g.fecha DESC, g.id DESC`
    )
    .all(...params);

  res.json(rows.map(serializar));
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT g.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json(serializar(row));
});

function validarPayload(body) {
  const errores = [];
  const monto = Number(body.monto);
  if (!Number.isFinite(monto) || monto <= 0) errores.push('El monto debe ser un número mayor a 0');
  if (!body.fecha) errores.push('La fecha es obligatoria');
  if (!body.categoria_id) errores.push('La categoría es obligatoria');
  return errores;
}

router.post('/', (req, res) => {
  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const {
    monto,
    fecha = todayISO(),
    categoria_id,
    descripcion = '',
    es_gasto_hormiga = false,
    es_comision_bancaria = false,
    aplica_gmf = false,
  } = req.body;

  const gmfAmount = aplica_gmf ? calcularGMF(Number(monto)) : 0;

  const result = db
    .prepare(
      `INSERT INTO gastos
        (monto, fecha, categoria_id, descripcion, es_gasto_hormiga, es_comision_bancaria, aplica_gmf, gmf_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      Number(monto),
      fecha,
      categoria_id,
      descripcion,
      es_gasto_hormiga ? 1 : 0,
      es_comision_bancaria ? 1 : 0,
      aplica_gmf ? 1 : 0,
      gmfAmount
    );

  const row = db
    .prepare(
      `SELECT g.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json(serializar(row));
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Gasto no encontrado' });

  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const {
    monto,
    fecha,
    categoria_id,
    descripcion = '',
    es_gasto_hormiga = false,
    es_comision_bancaria = false,
    aplica_gmf = false,
  } = req.body;

  const gmfAmount = aplica_gmf ? calcularGMF(Number(monto)) : 0;

  db.prepare(
    `UPDATE gastos SET
      monto = ?, fecha = ?, categoria_id = ?, descripcion = ?,
      es_gasto_hormiga = ?, es_comision_bancaria = ?, aplica_gmf = ?, gmf_amount = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    Number(monto),
    fecha,
    categoria_id,
    descripcion,
    es_gasto_hormiga ? 1 : 0,
    es_comision_bancaria ? 1 : 0,
    aplica_gmf ? 1 : 0,
    gmfAmount,
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT g.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = ?`
    )
    .get(req.params.id);
  res.json(serializar(row));
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Gasto no encontrado' });
  db.prepare('DELETE FROM gastos WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
