import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { todayISO } from '../lib/dateUtils';

function emptyForm() {
  return { monto: '', fecha: todayISO(), descripcion: '' };
}

export default function IncomeFormModal({ open, ingreso, onClose, onSaved }) {
  const editing = Boolean(ingreso);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (ingreso) {
      setForm({ monto: String(ingreso.monto), fecha: ingreso.fecha, descripcion: ingreso.descripcion || '' });
    } else {
      setForm(emptyForm());
    }
    setError('');
  }, [open, ingreso]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const monto = Number(form.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, monto };
      const saved = editing
        ? await api.actualizarIngreso(ingreso.id, payload)
        : await api.crearIngreso(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!ingreso) return;
    if (!confirm('¿Eliminar este ingreso?')) return;
    setSaving(true);
    try {
      await api.eliminarIngreso(ingreso.id);
      onSaved(null);
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
          <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">
            {editing ? 'Editar ingreso' : 'Nuevo ingreso'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Dinero que entra —un pago de nómina, una transferencia que recibiste— y que suma al
          saldo disponible.
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
                min="0.01"
                step="0.01"
                required
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-xl border border-border bg-page py-3 pl-7 pr-3 text-2xl font-semibold text-ink [font-variant-numeric:tabular-nums] outline-none focus:border-good dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Fecha
            </label>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-good dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Nota (opcional)
            </label>
            <input
              type="text"
              maxLength={140}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-good dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
              placeholder="Ej. Nómina agosto"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert dark:bg-alert-soft-dark dark:text-alert-dark">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {editing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl border border-alert/30 px-4 py-3 text-sm font-medium text-alert hover:bg-alert-soft disabled:opacity-50 dark:text-alert-dark dark:hover:bg-alert-soft-dark"
              >
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-good px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
