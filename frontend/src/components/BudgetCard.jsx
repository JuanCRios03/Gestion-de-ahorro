import { Link } from 'react-router-dom';
import { formatCOP } from '../lib/format';
import BudgetMeter, { toneForPct } from './BudgetMeter';
import PeriodToggle from './PeriodToggle';

const MENSAJES = {
  good: (periodo) => `Vas bien esta ${periodo === 'quincenal' ? 'quincena' : 'mes'}.`,
  warning: () => 'Te estás acercando al límite de tu ingreso.',
  critical: () => 'Ya gastaste más de lo que ganas en este periodo.',
};

export default function BudgetCard({ presupuesto, onEdit, onChangePeriodo }) {
  if (!presupuesto) return null;

  const periodoLabel = presupuesto.periodo === 'quincenal' ? 'la quincena' : 'el mes';

  if (!presupuesto.ingresoActivo) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">¿Cuánto ganas?</h2>
          <PeriodToggle periodo={presupuesto.periodo} onChange={onChangePeriodo} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">
            Define tu ingreso {presupuesto.periodo === 'quincenal' ? 'por quincena' : 'mensual'} para
            ver tus gastos como porcentaje de lo que ganas, no solo en pesos.
          </p>
          <button
            onClick={onEdit}
            className="shrink-0 rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-900"
          >
            Definir ingreso
          </button>
        </div>
      </div>
    );
  }

  const tone = toneForPct(presupuesto.pctGastado);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">
          Presupuesto {presupuesto.periodo === 'quincenal' ? 'de la quincena' : 'del mes'}
        </h2>
        <div className="flex items-center gap-2">
          <PeriodToggle periodo={presupuesto.periodo} onChange={onChangePeriodo} size="sm" />
          <button onClick={onEdit} className="text-xs font-medium text-brand-700 dark:text-brand-300">
            Editar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p
          className={`text-2xl font-semibold [font-variant-numeric:tabular-nums] ${
            tone === 'critical'
              ? 'text-alert dark:text-alert-dark'
              : tone === 'warning'
              ? 'text-warning dark:text-warning-dark'
              : 'text-ink dark:text-ink-dark'
          }`}
        >
          {presupuesto.pctGastado}%
        </p>
        <p className="text-xs text-ink-muted">
          {formatCOP(presupuesto.gastadoPeriodo)} de {formatCOP(presupuesto.ingresoActivo)}
        </p>
      </div>

      <div className="mt-2">
        <BudgetMeter pct={presupuesto.pctGastado} />
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        {MENSAJES[tone](presupuesto.periodo)}{' '}
        {presupuesto.restante >= 0 && `Te quedan ${formatCOP(presupuesto.restante)} en ${periodoLabel}.`}
      </p>

      <Link to="/presupuesto" className="mt-3 inline-block text-xs font-medium text-brand-700 dark:text-brand-300">
        Ver presupuesto por categoría →
      </Link>
    </div>
  );
}
