import { Router } from 'express';
import {
  resumenPresupuesto,
  actualizarPeriodoPresupuesto,
  actualizarIngresoReferencia,
  resumenPresupuestosCategoria,
  actualizarPresupuestoCategoria,
  eliminarPresupuestoCategoria,
  aplicarPresupuestoSugerido,
} from '../lib/aggregations.js';

const router = Router();

function validarPeriodo(periodo) {
  return periodo === 'mensual' || periodo === 'quincenal';
}

router.get('/resumen', (req, res) => {
  res.json(resumenPresupuesto());
});

router.put('/periodo', (req, res) => {
  if (!validarPeriodo(req.body.periodo)) {
    return res.status(400).json({ error: 'El periodo debe ser "mensual" o "quincenal"' });
  }
  res.json(actualizarPeriodoPresupuesto(req.body.periodo));
});

router.put('/ingreso', (req, res) => {
  const { periodo } = req.body;
  const monto = Number(req.body.monto);
  if (!validarPeriodo(periodo)) {
    return res.status(400).json({ error: 'El periodo debe ser "mensual" o "quincenal"' });
  }
  if (!Number.isFinite(monto) || monto < 0) {
    return res.status(400).json({ error: 'El ingreso debe ser un número mayor o igual a 0' });
  }
  res.json(actualizarIngresoReferencia(periodo, monto));
});

router.get('/categorias', (req, res) => {
  res.json(resumenPresupuestosCategoria());
});

router.put('/categorias/:categoriaId', (req, res) => {
  const pct = Number(req.body.porcentaje_ingreso);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
  }
  res.json(actualizarPresupuestoCategoria(Number(req.params.categoriaId), pct));
});

router.delete('/categorias/:categoriaId', (req, res) => {
  res.json(eliminarPresupuestoCategoria(Number(req.params.categoriaId)));
});

router.post('/categorias/sugerido', (req, res) => {
  res.json(aplicarPresupuestoSugerido());
});

export default router;
