import CategoryBadge from './CategoryBadge';
import { formatCOP, formatDateShort } from '../lib/format';
import { useApp } from '../context/AppContext';

export default function ExpenseRow({ gasto }) {
  const { openEdit } = useApp();

  return (
    <button
      onClick={() => openEdit(gasto)}
      className="flex w-full items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0 hover:bg-black/[0.02] dark:border-border-dark dark:hover:bg-white/[0.03]"
    >
      <div className="w-16 shrink-0 text-xs text-ink-muted">{formatDateShort(gasto.fecha)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
          {gasto.descripcion || gasto.categoria_nombre}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <CategoryBadge nombre={gasto.categoria_nombre} color={gasto.categoria_color} />
          {gasto.es_gasto_hormiga && <span className="text-xs">🐜</span>}
          {gasto.aplica_gmf && (
            <span className="text-xs text-ink-muted">+{formatCOP(gasto.gmf_amount)} GMF</span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums] dark:text-ink-dark">
        {formatCOP(gasto.monto)}
      </div>
    </button>
  );
}
