export default function PeriodToggle({ periodo, onChange, size = 'md' }) {
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 dark:border-border-dark">
      <button
        type="button"
        onClick={() => onChange('mensual')}
        className={`rounded-md font-medium transition-colors ${padding} ${
          periodo === 'mensual'
            ? 'bg-brand-800 text-white'
            : 'text-ink-secondary dark:text-ink-secondary-dark'
        }`}
      >
        Mensual
      </button>
      <button
        type="button"
        onClick={() => onChange('quincenal')}
        className={`rounded-md font-medium transition-colors ${padding} ${
          periodo === 'quincenal'
            ? 'bg-brand-800 text-white'
            : 'text-ink-secondary dark:text-ink-secondary-dark'
        }`}
      >
        Quincenal
      </button>
    </div>
  );
}
