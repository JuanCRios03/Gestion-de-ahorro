import { formatCOP, formatDateShort } from '../lib/format';

export default function SavingsRow({ ahorro, onClick }) {
  const esAporte = ahorro.tipo === 'aporte';
  return (
    <button
      onClick={() => onClick(ahorro)}
      className="flex w-full items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0 hover:bg-black/[0.02] dark:border-border-dark dark:hover:bg-white/[0.03]"
    >
      <div className="w-16 shrink-0 text-xs text-ink-muted">{formatDateShort(ahorro.fecha)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
          {ahorro.descripcion || (esAporte ? 'Aporte a ahorros' : 'Retiro de ahorros')}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            esAporte
              ? 'bg-good/10 text-good'
              : 'bg-alert-soft text-alert dark:bg-alert-soft-dark dark:text-alert-dark'
          }`}
        >
          {esAporte ? 'Aporte' : 'Retiro'}
        </span>
      </div>
      <div
        className={`shrink-0 text-sm font-semibold [font-variant-numeric:tabular-nums] ${
          esAporte ? 'text-good' : 'text-alert dark:text-alert-dark'
        }`}
      >
        {esAporte ? '+ ' : '− '}
        {formatCOP(ahorro.monto)}
      </div>
    </button>
  );
}
