import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { todayISO } from '../lib/dateUtils';
import { formatCOP } from '../lib/format';

const GMF_RATE = 0.004;

function emptyForm(categorias) {
  const hormiga = categorias.find((c) => c.nombre === 'Gastos hormiga');
  return {
    monto: '',
    fecha: todayISO(),
    categoria_id: hormiga ? String(hormiga.id) : categorias[0] ? String(categorias[0].id) : '',
    descripcion: '',
    es_gasto_hormiga: false,
    es_comision_bancaria: false,
    aplica_gmf: false,
  };
}

export default function ExpenseFormModal() {
  const { categorias, modal, closeModal, notifyChanged } = useApp();
  const { open, gasto } = modal;
  const editing = Boolean(gasto);

  const [form, setForm] = useState(() => emptyForm(categorias));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (gasto) {
      setForm({
        monto: String(gasto.monto),
        fecha: gasto.fecha,
        categoria_id: String(gasto.categoria_id),
        descripcion: gasto.descripcion || '',
        es_gasto_hormiga: gasto.es_gasto_hormiga,
        es_comision_bancaria: gasto.es_comision_bancaria,
        aplica_gmf: gasto.aplica_gmf,
      });
    } else {
      setForm(emptyForm(categorias));
    }
    setError('');
  }, [open, gasto, categorias]);

  const gmfPreview = useMemo(() => {
    const monto = Number(form.monto);
    if (!form.aplica_gmf || !Number.isFinite(monto) || monto <= 0) return 0;
    return Math.round(monto * GMF_RATE);
  }, [form.monto, form.aplica_gmf]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const monto = Number(form.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (!form.categoria_id) {
      setError('Selecciona una categoría');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, monto, categoria_id: Number(form.categoria_id) };
      if (editing) {
        await api.actualizarGasto(gasto.id, payload);
      } else {
        await api.crearGasto(payload);
      }
      notifyChanged();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!gasto) return;
    if (!confirm('¿Eliminar este gasto?')) return;
    setSaving(true);
    try {
      await api.eliminarGasto(gasto.id);
      notifyChanged();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={closeModal}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-xl dark:border-border-dark dark:bg-surface-dark sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">
            {editing ? 'Editar gasto' : 'Nuevo gasto'}
          </h2>
          <button
            onClick={closeModal}
            className="rounded-full p-1.5 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

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
                inputMode="numeric"
                type="number"
                min="1"
                step="1"
                required
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-xl border border-border bg-page py-3 pl-7 pr-3 text-2xl font-semibold text-ink [font-variant-numeric:tabular-nums] outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
                Fecha
              </label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
                Categoría
              </label>
              <select
                required
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
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
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
              placeholder="Ej. Café con Ana"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border p-3 dark:border-border-dark">
            <label className="flex items-center justify-between text-sm text-ink dark:text-ink-dark">
              <span>🐜 Es un gasto hormiga</span>
              <input
                type="checkbox"
                checked={form.es_gasto_hormiga}
                onChange={(e) => setForm({ ...form, es_gasto_hormiga: e.target.checked })}
                className="h-5 w-5 accent-brand-600"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-ink dark:text-ink-dark">
              <span>🏦 Es comisión bancaria</span>
              <input
                type="checkbox"
                checked={form.es_comision_bancaria}
                onChange={(e) => setForm({ ...form, es_comision_bancaria: e.target.checked })}
                className="h-5 w-5 accent-brand-600"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-ink dark:text-ink-dark">
              <span>Aplica 4x1000 (GMF)</span>
              <input
                type="checkbox"
                checked={form.aplica_gmf}
                onChange={(e) => setForm({ ...form, aplica_gmf: e.target.checked })}
                className="h-5 w-5 accent-brand-600"
              />
            </label>
            {form.aplica_gmf && (
              <p className="text-xs text-ink-muted">
                4x1000 calculado: <span className="font-semibold text-ink dark:text-ink-dark">{formatCOP(gmfPreview)}</span>{' '}
                (se suma al análisis de comisiones, no al monto del gasto)
              </p>
            )}
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
              className="flex-1 rounded-xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
