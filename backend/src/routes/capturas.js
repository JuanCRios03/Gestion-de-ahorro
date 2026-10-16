import { Router } from 'express';
import { db } from '../db/connection.js';
import { parseNotificacion } from '../lib/parseNotificacion.js';
import { calcularGMF } from '../lib/gmf.js';
import { todayISO } from '../lib/dateUtils.js';

const router = Router();

function getApiKey() {
  return db.prepare('SELECT capture_api_key FROM configuracion WHERE id = 1').get().capture_api_key;
}

// Requiere la API key SOLO para recibir capturas nuevas desde el celular — el
// resto de la app (listar/confirmar/descartar) ya se usa desde la misma
// interfaz local, igual que todo lo demás.
function requireApiKey(req, res, next) {
  const provided = req.get('X-Api-Key');
  if (!provided || provided !== getApiKey()) {
    return res.status(401).json({ error: 'API key inválida o ausente' });
  }
  next();
}

// GET /api/capturas/config — la API key para configurar MacroDroid, y la URL completa.
router.get('/config', (req, res) => {
  res.json({ apiKey: getApiKey() });
});

// POST /api/capturas — recibe el texto crudo de una notificación (desde MacroDroid).
// Protegido por API key: cualquier otro dispositivo en la red no puede escribir aquí.
router.post('/', requireApiKey, (req, res) => {
  const { texto, fecha } = req.body;
  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: 'El texto de la notificación es obligatorio' });
  }

  const { monto, comercio } = parseNotificacion(texto);
  const result = db
    .prepare(
      `INSERT INTO capturas_pendientes (monto, comercio, fecha, texto_original, origen)
       VALUES (?, ?, ?, ?, 'notificacion')`
    )
    .run(monto, comercio, fecha || todayISO(), texto.trim());

  const row = db.prepare('SELECT * FROM capturas_pendientes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// GET /api/capturas?estado=pendiente — para la bandeja de revisión en la app.
router.get('/', (req, res) => {
  const { estado = 'pendiente' } = req.query;
  const rows = db
    .prepare('SELECT * FROM capturas_pendientes WHERE estado = ? ORDER BY id DESC')
    .all(estado);
  res.json(rows);
});

// POST /api/capturas/:id/confirmar — crea el gasto real con los datos revisados/completados.
router.post('/:id/confirmar', (req, res) => {
  const captura = db.prepare('SELECT * FROM capturas_pendientes WHERE id = ?').get(req.params.id);
  if (!captura) return res.status(404).json({ error: 'Captura no encontrada' });
  if (captura.estado !== 'pendiente') {
    return res.status(400).json({ error: 'Esta captura ya fue procesada' });
  }

  const {
    monto,
    fecha = captura.fecha,
    categoria_id,
    descripcion = captura.comercio || '',
    es_gasto_hormiga = false,
    es_comision_bancaria = false,
    aplica_gmf = false,
  } = req.body;

  const montoNum = Number(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
  }
  if (!categoria_id) {
    return res.status(400).json({ error: 'La categoría es obligatoria' });
  }

  const gmfAmount = aplica_gmf ? calcularGMF(montoNum) : 0;
  const insert = db
    .prepare(
      `INSERT INTO gastos
        (monto, fecha, categoria_id, descripcion, es_gasto_hormiga, es_comision_bancaria, aplica_gmf, gmf_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      montoNum,
      fecha,
      categoria_id,
      descripcion,
      es_gasto_hormiga ? 1 : 0,
      es_comision_bancaria ? 1 : 0,
      aplica_gmf ? 1 : 0,
      gmfAmount
    );

  db.prepare(
    `UPDATE capturas_pendientes SET estado = 'confirmada', gasto_id = ? WHERE id = ?`
  ).run(insert.lastInsertRowid, captura.id);

  const gasto = db
    .prepare(
      `SELECT g.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = ?`
    )
    .get(insert.lastInsertRowid);
  res.status(201).json(gasto);
});

// POST /api/capturas/:id/descartar — falso positivo, duplicado, etc.
router.post('/:id/descartar', (req, res) => {
  const captura = db.prepare('SELECT * FROM capturas_pendientes WHERE id = ?').get(req.params.id);
  if (!captura) return res.status(404).json({ error: 'Captura no encontrada' });
  db.prepare(`UPDATE capturas_pendientes SET estado = 'descartada' WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

export default router;
