function DeltaBadge({ pct, invert = false }) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  const isUp = pct > 0;
  const isFlat = Math.abs(pct) < 0.5;
  // Para gastos, subir es "malo" (alerta) y bajar es "bueno", salvo que se invierta.
  const bad = invert ? !isUp : isUp;
  const tone = isFlat ? 'ink-muted' : bad ? 'alert' : 'good';

  const toneClasses = {
    'ink-muted': 'text-ink-muted dark:text-ink-secondary-dark bg-black/5 dark:bg-white/5',
    alert: 'text-alert dark:text-alert-dark bg-alert-soft dark:bg-alert-soft-dark',
    good: 'text-good dark:text-good-dark bg-good/10',
  };

  const arrow = isFlat ? '→' : isUp ? '↑' : '↓';
  const label = isFlat ? 'igual' : isUp ? 'más' : 'menos';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(pct).toFixed(1)}% {label}
    </span>
  );
}

export default function StatCard({ label, value, delta, invertDelta = false, sub, accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? 'border-brand-700 bg-brand-900 text-white dark:border-brand-700'
          : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          accent ? 'text-brand-200' : 'text-ink-secondary dark:text-ink-secondary-dark'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight [font-variant-numeric:tabular-nums] ${
          accent ? 'text-white' : 'text-ink dark:text-ink-dark'
        }`}
      >
        {value}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {delta !== undefined && <DeltaBadge pct={delta} invert={invertDelta} />}
        {sub && (
          <span className={`text-xs ${accent ? 'text-brand-200' : 'text-ink-muted'}`}>{sub}</span>
        )}
      </div>
    </div>
  );
}
