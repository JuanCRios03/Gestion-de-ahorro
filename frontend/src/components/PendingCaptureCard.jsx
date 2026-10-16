import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatDateShort } from '../lib/format';

export default function PendingCaptureCard({ captura, categorias, onResolved }) {
  const [monto, setMonto] = useState(captura.monto !== null ? String(captura.monto) : '');
  const [fecha, setFecha] = useState(captura.fecha);
  const [categoriaId, setCategoriaId] = useState('');
  const [descripcion, setDescripcion] = useState(captura.comercio || '');
  const [esGastoHormiga, setEsGastoHormiga] = useState(false);
  const [aplicaGmf, setAplicaGmf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const faltaMonto = captura.monto === null;

  // `categorias` llega desde el contexto y puede seguir vacío en el primer
  // render; se completa acá (no en el useState inicial) para no quedar con la
  // categoría en blanco si el fetch de categorías todavía no había resuelto.
  useEffect(() => {
    if (categoriaId || categorias.length === 0) return;
    const hormiga = categorias.find((c) => c.nombre === 'Gastos hormiga');
    setCategoriaId(String((hormiga || categorias[0]).id));
  }, [categorias, categoriaId]);

  async function handleConfirmar(e) {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (!categoriaId) {
      setError('Selecciona una categoría');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.confirmarCaptura(captura.id, {
        monto: montoNum,
        fecha,
        categoria_id: Number(categoriaId),
        descripcion,
        es_gasto_hormiga: esGastoHormiga,
        aplica_gmf: aplicaGmf,
      });
      onResolved(captura.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDescartar() {
    setSaving(true);
    setError('');
    try {
      await api.descartarCaptura(captura.id);
      onResolved(captura.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-3 flex items-center justify-between text-xs text-ink-muted">
        <span>Notificación del {formatDateShort(captura.fecha)}</span>
        <span>{new Date(captura.created_at.replace(' ', 'T')).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <p className="mb-4 rounded-lg bg-page px-3 py-2 text-xs text-ink-secondary dark:bg-page-dark dark:text-ink-secondary-dark">
        {captura.texto_original}
      </p>

      <form onSubmit={handleConfirmar} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Monto {faltaMonto && <span className="text-alert dark:text-alert-dark">(no se pudo leer)</span>}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`w-full rounded-xl border bg-page py-2.5 pl-7 pr-3 text-lg font-semibold text-ink [font-variant-numeric:tabular-nums] outline-none focus:border-brand-500 dark:bg-page-dark dark:text-ink-dark ${
                  faltaMonto ? 'border-alert/50' : 'border-border dark:border-border-dark'
                }`}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Fecha
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Categoría
            </label>
            <select
              required
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Comercio / nota
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-xl border border-border bg-page px-3 py-2.5 text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
              placeholder="Ej. Almacenes Éxito"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-ink dark:text-ink-dark">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={esGastoHormiga}
              onChange={(e) => setEsGastoHormiga(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            🐜 Gasto hormiga
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={aplicaGmf}
              onChange={(e) => setAplicaGmf(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Aplica 4x1000
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert dark:bg-alert-soft-dark dark:text-alert-dark">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleDescartar}
            disabled={saving}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-black/5 disabled:opacity-50 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
          >
            Descartar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Confirmar gasto'}
          </button>
        </div>
      </form>
    </div>
  );
}
