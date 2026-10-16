import { Router } from 'express';
import { db } from '../db/connection.js';
import { todayISO } from '../lib/dateUtils.js';

const router = Router();

router.get('/', (req, res) => {
  const { start, end } = req.query;
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
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM ingresos ${where} ORDER BY fecha DESC, id DESC`).all(...params);
  res.json(rows);
});

function validarPayload(body) {
  const errores = [];
  const monto = Number(body.monto);
  if (!Number.isFinite(monto) || monto <= 0) errores.push('El monto debe ser un número mayor a 0');
  if (!body.fecha) errores.push('La fecha es obligatoria');
  return errores;
}

router.post('/', (req, res) => {
  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const { monto, fecha = todayISO(), descripcion = '' } = req.body;
  const result = db
    .prepare('INSERT INTO ingresos (monto, fecha, descripcion) VALUES (?, ?, ?)')
    .run(Number(monto), fecha, descripcion);

  const row = db.prepare('SELECT * FROM ingresos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM ingresos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Ingreso no encontrado' });

  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const { monto, fecha, descripcion = '' } = req.body;
  db.prepare(
    `UPDATE ingresos SET monto = ?, fecha = ?, descripcion = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(Number(monto), fecha, descripcion, req.params.id);

  const row = db.prepare('SELECT * FROM ingresos WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM ingresos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Ingreso no encontrado' });
  db.prepare('DELETE FROM ingresos WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
