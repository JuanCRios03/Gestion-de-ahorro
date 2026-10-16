import { Router } from 'express';
import {
  resumenPeriodo,
  resumenTrimestre,
  serieTemporal,
  distribucionCategorias,
  totalesGMF,
  panelHormiga,
} from '../lib/aggregations.js';
import { todayISO, getMonthRange } from '../lib/dateUtils.js';

const router = Router();

// GET /api/analytics/resumen?periodo=semana|quincena|mes|trimestre&fecha=YYYY-MM-DD
router.get('/resumen', (req, res) => {
  const { periodo = 'mes', fecha = todayISO() } = req.query;
  try {
    if (periodo === 'trimestre') {
      return res.json(resumenTrimestre(fecha));
    }
    res.json(resumenPeriodo(periodo, fecha));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/analytics/serie?start=&end=
router.get('/serie', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start y end son obligatorios' });
  res.json(serieTemporal(start, end));
});

// GET /api/analytics/categorias?start=&end=
router.get('/categorias', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start y end son obligatorios' });
  res.json(distribucionCategorias(start, end));
});

// GET /api/analytics/gmf?start=&end=
router.get('/gmf', (req, res) => {
  let { start, end } = req.query;
  if (!start || !end) {
    const mes = getMonthRange(todayISO());
    start = mes.start;
    end = mes.end;
  }
  res.json(totalesGMF(start, end));
});

// GET /api/analytics/hormiga?start=&end=
router.get('/hormiga', (req, res) => {
  let { start, end } = req.query;
  if (!start || !end) {
    const mes = getMonthRange(todayISO());
    start = mes.start;
    end = mes.end;
  }
  res.json(panelHormiga(start, end));
});

export default router;
