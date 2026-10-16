import { Router } from 'express';
import { resumenSaldo, actualizarSaldoInicial } from '../lib/aggregations.js';
import { todayISO } from '../lib/dateUtils.js';

const router = Router();

router.get('/saldo', (req, res) => {
  res.json(resumenSaldo());
});

router.put('/saldo', (req, res) => {
  const { saldo_inicial, fecha_saldo_inicial } = req.body;
  const monto = Number(saldo_inicial);
  if (!Number.isFinite(monto)) {
    return res.status(400).json({ error: 'El saldo inicial debe ser un número' });
  }
  const fecha = fecha_saldo_inicial || todayISO();
  res.json(actualizarSaldoInicial(monto, fecha));
});

export default router;
