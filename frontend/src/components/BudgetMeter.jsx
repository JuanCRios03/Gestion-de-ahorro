// Barra de progreso de presupuesto. El relleno lleva la severidad
// (bien / alerta / excedido); el texto del porcentaje siempre acompaña el
// color, nunca depende solo de él.
const TONES = {
  good: {
    bar: 'bg-good',
    text: 'text-good dark:text-good-dark',
    track: 'bg-good/15',
  },
  warning: {
    bar: 'bg-warning-dark',
    text: 'text-warning dark:text-warning-dark',
    track: 'bg-warning/15 dark:bg-warning-dark/15',
  },
  critical: {
    bar: 'bg-alert dark:bg-alert-dark',
    text: 'text-alert dark:text-alert-dark',
    track: 'bg-alert/10 dark:bg-alert-dark/15',
  },
};

export function toneForPct(pct) {
  if (pct === null || pct === undefined) return 'good';
  if (pct >= 100) return 'critical';
  if (pct >= 80) return 'warning';
  return 'good';
}

export default function BudgetMeter({ pct, size = 'md' }) {
  const tone = toneForPct(pct);
  const t = TONES[tone];
  const width = pct === null || pct === undefined ? 0 : Math.min(pct, 100);
  const height = size === 'sm' ? 'h-2' : 'h-2.5';

  return (
    <div className={`w-full overflow-hidden rounded-full ${height} ${t.track}`}>
      <div
        className={`h-full rounded-full transition-all ${t.bar}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
