import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function SavingsGoalModal({ open, ahorro, onClose, onSaved }) {
  const [meta, setMeta] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMeta(ahorro && ahorro.metaAhorro ? String(ahorro.metaAhorro) : '');
    setError('');
  }, [open, ahorro]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const valor = Number(meta || 0);
    if (!Number.isFinite(valor) || valor < 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const actualizado = await api.actualizarMetaAhorro(valor);
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
          <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">Meta de ahorro</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Cuánto quieres tener ahorrado en total. Déjalo en 0 si no quieres una meta, solo llevar
          la cuenta de lo que vas apartando.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Meta
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
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
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
            {saving ? 'Guardando…' : 'Guardar meta'}
          </button>
        </form>
      </div>
    </div>
  );
}
