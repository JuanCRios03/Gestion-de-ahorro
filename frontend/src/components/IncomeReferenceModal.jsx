import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function IncomeReferenceModal({ open, presupuesto, onClose, onSaved }) {
  const [periodo, setPeriodo] = useState('mensual');
  const [valores, setValores] = useState({ mensual: '', quincenal: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !presupuesto) return;
    setPeriodo(presupuesto.periodo);
    setValores({
      mensual: presupuesto.ingresoMensual ? String(presupuesto.ingresoMensual) : '',
      quincenal: presupuesto.ingresoQuincenal ? String(presupuesto.ingresoQuincenal) : '',
    });
    setError('');
  }, [open, presupuesto]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const valor = Number(valores[periodo] || 0);
    if (!Number.isFinite(valor) || valor < 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const actualizado = await api.actualizarIngresoReferencia(periodo, valor);
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
          <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">Ingreso de referencia</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Lo que ganas típicamente. Puedes guardar un valor mensual y otro quincenal —así sirve si
          te pagan quincenal— y elegir cuál usar desde el Resumen o Presupuesto sin perder el otro.
        </p>

        <div className="mb-4 flex rounded-xl border border-border p-1 dark:border-border-dark">
          <button
            type="button"
            onClick={() => setPeriodo('mensual')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              periodo === 'mensual'
                ? 'bg-brand-800 text-white'
                : 'text-ink-secondary dark:text-ink-secondary-dark'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('quincenal')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              periodo === 'quincenal'
                ? 'bg-brand-800 text-white'
                : 'text-ink-secondary dark:text-ink-secondary-dark'
            }`}
          >
            Quincenal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Ingreso {periodo === 'mensual' ? 'mensual' : 'por quincena'}
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
                value={valores[periodo]}
                onChange={(e) => setValores({ ...valores, [periodo]: e.target.value })}
                className="w-full rounded-xl border border-border bg-page py-3 pl-7 pr-3 text-2xl font-semibold text-ink [font-variant-numeric:tabular-nums] outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
                placeholder="0"
              />
            </div>
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
            {saving ? 'Guardando…' : `Guardar ingreso ${periodo === 'mensual' ? 'mensual' : 'quincenal'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
