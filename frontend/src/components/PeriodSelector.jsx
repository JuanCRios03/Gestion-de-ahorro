const PERIODOS = [
  { key: 'semana', label: 'Semana' },
  { key: 'quincena', label: 'Quincena' },
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
];

export default function PeriodSelector({ periodo, onChangePeriodo, onPrev, onNext, onToday, rangeLabel }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl border border-border bg-surface p-1 dark:border-border-dark dark:bg-surface-dark">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChangePeriodo(p.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              periodo === p.key
                ? 'bg-brand-800 text-white'
                : 'text-ink-secondary hover:bg-black/5 dark:text-ink-secondary-dark dark:hover:bg-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          onClick={onPrev}
          className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-ink-secondary hover:bg-black/5 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
          aria-label="Periodo anterior"
        >
          ←
        </button>
        <button
          onClick={onToday}
          className="min-w-40 rounded-lg px-2 py-1.5 text-center text-sm font-medium text-ink dark:text-ink-dark"
        >
          {rangeLabel}
        </button>
        <button
          onClick={onNext}
          className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-ink-secondary hover:bg-black/5 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
          aria-label="Periodo siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}
