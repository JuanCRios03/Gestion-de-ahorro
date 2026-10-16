import { Router } from 'express';
import { db } from '../db/connection.js';

const router = Router();

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

// GET /api/export?format=csv|json
router.get('/', (req, res) => {
  const { format = 'json' } = req.query;
  const rows = db
    .prepare(
      `SELECT g.id, g.fecha, c.nombre AS categoria, g.monto, g.descripcion,
              g.es_gasto_hormiga, g.es_comision_bancaria, g.aplica_gmf, g.gmf_amount, g.created_at
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id
       ORDER BY g.fecha DESC, g.id DESC`
    )
    .all();

  if (format === 'csv') {
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.csv"');
    return res.send(csv);
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="gastos.json"');
  res.json(rows);
});

export default router;
