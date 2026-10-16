import { Router } from 'express';
import { db } from '../db/connection.js';

const router = Router();

// Slots de la paleta categórica validada, en el mismo orden que el frontend.
// "red" se excluye a propósito: queda reservado para alertas de gasto por encima del promedio.
const SLOTS_DISPONIBLES = ['blue', 'orange', 'aqua', 'yellow', 'magenta', 'green', 'violet'];

function siguienteSlot() {
  const usados = db.prepare('SELECT COUNT(*) AS c FROM categorias').get().c;
  return SLOTS_DISPONIBLES[usados % SLOTS_DISPONIBLES.length];
}

router.get('/', (req, res) => {
  const categorias = db
    .prepare('SELECT * FROM categorias ORDER BY es_predefinida DESC, nombre ASC')
    .all();
  res.json(categorias);
});

router.post('/', (req, res) => {
  const { nombre, color } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }
  try {
    const result = db
      .prepare('INSERT INTO categorias (nombre, color, es_predefinida) VALUES (?, ?, 0)')
      .run(nombre.trim(), color || siguienteSlot());
    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(categoria);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: 'No se pudo crear la categoría' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
  if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
  if (categoria.es_predefinida) {
    return res.status(400).json({ error: 'No se pueden eliminar las categorías predefinidas' });
  }
  const enUso = db.prepare('SELECT COUNT(*) AS c FROM gastos WHERE categoria_id = ?').get(id);
  if (enUso.c > 0) {
    return res.status(400).json({ error: 'No se puede eliminar: hay gastos registrados en esta categoría' });
  }
  db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
  res.status(204).end();
});

export default router;
