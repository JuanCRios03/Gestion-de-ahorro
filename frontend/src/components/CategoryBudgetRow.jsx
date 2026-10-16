import { useState } from 'react';
import { formatCOP } from '../lib/format';
import { colorForSlot } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';
import BudgetMeter from './BudgetMeter';

export function CategoryBudgetRowConfigured({ cat, ingresoMensual, onChangePct, onQuitar }) {
  const mode = useColorMode();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(cat.porcentajeIngreso));
  const [saving, setSaving] = useState(false);

  async function guardar() {
    const pct = Number(valor);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    setSaving(true);
    await onChangePct(cat.categoriaId, pct);
    setSaving(false);
    setEditando(false);
  }

  return (
    <div className="border-b border-border py-4 last:border-0 dark:border-border-dark">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: colorForSlot(cat.color, mode) }}
          />
          <span className="truncate text-sm font-medium text-ink dark:text-ink-dark">{cat.nombre}</span>
        </div>

        {editando ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              autoFocus
              type="number"
              min="0"
              max="100"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && guardar()}
              className="w-16 rounded-lg border border-border bg-page px-2 py-1 text-right text-sm text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
            />
            <span className="text-xs text-ink-muted">%</span>
            <button
              onClick={guardar}
              disabled={saving}
              className="rounded-lg bg-brand-800 px-2 py-1 text-xs font-medium text-white hover:bg-brand-900 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <button
              onClick={() => setEditando(true)}
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              {cat.porcentajeIngreso}% del ingreso
            </button>
            <button onClick={() => onQuitar(cat.categoriaId)} className="text-ink-muted hover:text-alert">
              Quitar
            </button>
          </div>
        )}
      </div>

      <BudgetMeter pct={cat.pct} />

      <div className="mt-1.5 flex items-center justify-between text-xs text-ink-muted">
        <span>
          {formatCOP(cat.gastado)} de {formatCOP(cat.montoPresupuestado)}
        </span>
        <span>{cat.pct !== null ? `${cat.pct}%` : '—'}</span>
      </div>
    </div>
  );
}

export function CategoryBudgetRowSinPresupuesto({ cat, onDefinir, periodo }) {
  const mode = useColorMode();
  const [valor, setValor] = useState(cat.sugerenciaPct !== null ? String(cat.sugerenciaPct) : '');
  const [saving, setSaving] = useState(false);

  async function definir() {
    const pct = Number(valor);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    setSaving(true);
    await onDefinir(cat.categoriaId, pct);
    setSaving(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0 dark:border-border-dark">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colorForSlot(cat.color, mode) }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">{cat.nombre}</p>
          <p className="text-xs text-ink-muted">
            Gastado {periodo === 'quincenal' ? 'esta quincena' : 'este mes'}: {formatCOP(cat.gastado)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="100"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && definir()}
          placeholder={cat.sugerenciaPct !== null ? String(cat.sugerenciaPct) : '0'}
          className="w-16 rounded-lg border border-border bg-page px-2 py-1 text-right text-sm text-ink outline-none focus:border-brand-500 dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
        />
        <span className="text-xs text-ink-muted">%</span>
        <button
          onClick={definir}
          disabled={saving || !valor}
          className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-ink-secondary hover:bg-black/5 disabled:opacity-50 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
        >
          Definir
        </button>
      </div>
    </div>
  );
}
