import { formatCOP, formatDateShort } from '../lib/format';

export default function IncomeRow({ ingreso, onClick }) {
  return (
    <button
      onClick={() => onClick(ingreso)}
      className="flex w-full items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0 hover:bg-black/[0.02] dark:border-border-dark dark:hover:bg-white/[0.03]"
    >
      <div className="w-16 shrink-0 text-xs text-ink-muted">{formatDateShort(ingreso.fecha)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
          {ingreso.descripcion || 'Ingreso'}
        </p>
      </div>
      <div className="shrink-0 text-sm font-semibold text-good [font-variant-numeric:tabular-nums]">
        + {formatCOP(ingreso.monto)}
      </div>
    </button>
  );
}
