import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { todayISO } from '../lib/dateUtils';

export default function EditBalanceModal({ open, saldo, onClose, onSaved }) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMonto(saldo ? String(saldo.saldoInicial) : '');
    setFecha(saldo ? saldo.fechaSaldoInicial : todayISO());
    setError('');
  }, [open, saldo]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor < 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const actualizado = await api.actualizarSaldo({ saldo_inicial: valor, fecha_saldo_inicial: fecha });
      onSaved(actualizado);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-6 shadow-xl dark:border-border-dark dark:bg-surface-dark sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">Saldo inicial</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          El monto del que se parte. <strong>Todos</strong> los gastos que tengas registrados
          (incluido el 4x1000) y todo lo que tengas apartado en Ahorros se descuentan de este
          saldo; los ingresos se suman. La fecha de abajo es solo una referencia tuya de cuándo
          era válido ese monto.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Monto
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                $
              </span>
              <input
                autoFocus
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full rounded-xl border border-border bg-page py-3 pl-7 pr-3 text-2xl font-semibold text-ink [font-variant-numeric:tabular-nums] outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Fecha de referencia (no filtra gastos, es solo tu nota)
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert dark:bg-alert-soft-dark dark:text-alert-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar saldo'}
          </button>
        </form>
      </div>
    </div>
  );
}
