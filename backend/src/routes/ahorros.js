import { Router } from 'express';
import { db } from '../db/connection.js';
import { resumenAhorro, actualizarMetaAhorro } from '../lib/aggregations.js';
import { todayISO } from '../lib/dateUtils.js';

const router = Router();

router.get('/resumen', (req, res) => {
  res.json(resumenAhorro());
});

router.put('/meta', (req, res) => {
  const meta = Number(req.body.meta_ahorro);
  if (!Number.isFinite(meta) || meta < 0) {
    return res.status(400).json({ error: 'La meta debe ser un número mayor o igual a 0' });
  }
  res.json(actualizarMetaAhorro(meta));
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM ahorros ORDER BY fecha DESC, id DESC').all();
  res.json(rows);
});

function validarPayload(body) {
  const errores = [];
  const monto = Number(body.monto);
  if (!Number.isFinite(monto) || monto <= 0) errores.push('El monto debe ser un número mayor a 0');
  if (!body.fecha) errores.push('La fecha es obligatoria');
  if (!['aporte', 'retiro'].includes(body.tipo)) errores.push('El tipo debe ser "aporte" o "retiro"');
  return errores;
}

router.post('/', (req, res) => {
  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const { monto, tipo, fecha = todayISO(), descripcion = '' } = req.body;
  const result = db
    .prepare('INSERT INTO ahorros (monto, tipo, fecha, descripcion) VALUES (?, ?, ?, ?)')
    .run(Number(monto), tipo, fecha, descripcion);

  const row = db.prepare('SELECT * FROM ahorros WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM ahorros WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Movimiento no encontrado' });

  const errores = validarPayload(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; ') });

  const { monto, tipo, fecha, descripcion = '' } = req.body;
  db.prepare(
    `UPDATE ahorros SET monto = ?, tipo = ?, fecha = ?, descripcion = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(Number(monto), tipo, fecha, descripcion, req.params.id);

  const row = db.prepare('SELECT * FROM ahorros WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM ahorros WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Movimiento no encontrado' });
  db.prepare('DELETE FROM ahorros WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
