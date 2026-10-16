import { Link } from 'react-router-dom';
import { formatCOP, formatDateLong } from '../lib/format';

function Breakdown({ label, value, sign }) {
  return (
    <div>
      <p className="text-xs text-brand-200">{label}</p>
      <p className="mt-0.5 text-lg font-semibold [font-variant-numeric:tabular-nums] text-white">
        {sign}
        {formatCOP(value)}
      </p>
    </div>
  );
}

export default function BalanceHero({ saldo, onEdit, onAddIncome }) {
  if (!saldo) return null;
  const negativo = saldo.saldoActual < 0;

  return (
    <div className="rounded-2xl border border-brand-700 bg-brand-950 p-6 text-white sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-200">Saldo disponible</p>
          <p
            className={`mt-1 text-4xl font-semibold tracking-tight [font-variant-numeric:tabular-nums] sm:text-5xl ${
              negativo ? 'text-alert-dark' : 'text-white'
            }`}
          >
            {formatCOP(saldo.saldoActual)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            onClick={onAddIncome}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-brand-100 hover:bg-white/10"
          >
            + Ingreso
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-brand-100 hover:bg-white/10"
          >
            Editar saldo inicial
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">
        <Breakdown label={`Saldo inicial (${formatDateLong(saldo.fechaSaldoInicial)})`} value={saldo.saldoInicial} sign="" />
        <Breakdown label="Ingresos" value={saldo.totalIngresos} sign="+ " />
        <Breakdown label="Gastos" value={saldo.totalGastado} sign="− " />
        <Breakdown label="Ahorrado" value={saldo.totalAhorrado} sign="− " />
      </div>

      {negativo && (
        <p className="mt-3 text-xs font-medium text-alert-dark">
          Tus gastos ya superaron el saldo inicial más lo que has ingresado.
        </p>
      )}

      <Link to="/ahorros" className="mt-4 inline-block text-xs font-medium text-brand-100 hover:underline">
        Ver ahorros →
      </Link>
    </div>
  );
}
