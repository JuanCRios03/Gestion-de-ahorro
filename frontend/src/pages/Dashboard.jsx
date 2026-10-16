import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { todayISO } from '../lib/dateUtils';
import { formatCOP, capitalize } from '../lib/format';
import StatCard from '../components/StatCard';
import DailyTrendChart from '../components/DailyTrendChart';
import ExpenseRow from '../components/ExpenseRow';
import IncomeRow from '../components/IncomeRow';
import BalanceHero from '../components/BalanceHero';
import EditBalanceModal from '../components/EditBalanceModal';
import IncomeFormModal from '../components/IncomeFormModal';
import BudgetCard from '../components/BudgetCard';
import IncomeReferenceModal from '../components/IncomeReferenceModal';

export default function Dashboard() {
  const { dataVersion, openAdd, notifyChanged } = useApp();
  const [resumen, setResumen] = useState(null);
  const [serie, setSerie] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [saldo, setSaldo] = useState(null);
  const [presupuesto, setPresupuesto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSaldo, setEditingSaldo] = useState(false);
  const [incomeModal, setIncomeModal] = useState({ open: false, ingreso: null });
  const [editingIngresoReferencia, setEditingIngresoReferencia] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const hoy = todayISO();
      const res = await api.getResumen('mes', hoy);
      const [ser, gastos, saldoRes, ingresosRes, presupuestoRes] = await Promise.all([
        api.getSerie(res.rango.start, res.rango.end),
        api.getGastos({ start: res.rango.start, end: res.rango.end }),
        api.getSaldo(),
        api.getIngresos(),
        api.getPresupuesto(),
      ]);
      if (cancelled) return;
      setResumen(res);
      setSerie(ser);
      setRecientes(gastos.slice(0, 6));
      setSaldo(saldoRes);
      setIngresos(ingresosRes.slice(0, 5));
      setPresupuesto(presupuestoRes);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  async function handleChangePeriodo(periodo) {
    const nuevo = await api.actualizarPeriodoPresupuesto(periodo);
    setPresupuesto(nuevo);
  }

  if (loading || !resumen) {
    return <div className="text-sm text-ink-muted">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Resumen</h1>
          <p className="text-sm text-ink-muted">{capitalize(new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }))}</p>
        </div>
        <button
          onClick={openAdd}
          className="hidden rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900 sm:block"
        >
          + Añadir gasto
        </button>
      </div>

      <BalanceHero
        saldo={saldo}
        onEdit={() => setEditingSaldo(true)}
        onAddIncome={() => setIncomeModal({ open: true, ingreso: null })}
      />

      <BudgetCard
        presupuesto={presupuesto}
        onEdit={() => setEditingIngresoReferencia(true)}
        onChangePeriodo={handleChangePeriodo}
      />

      <IncomeReferenceModal
        open={editingIngresoReferencia}
        presupuesto={presupuesto}
        onClose={() => setEditingIngresoReferencia(false)}
        onSaved={(nuevo) => {
          setPresupuesto(nuevo);
          notifyChanged();
        }}
      />

      <EditBalanceModal
        open={editingSaldo}
        saldo={saldo}
        onClose={() => setEditingSaldo(false)}
        onSaved={(nuevo) => {
          setSaldo(nuevo);
          notifyChanged();
        }}
      />

      <IncomeFormModal
        open={incomeModal.open}
        ingreso={incomeModal.ingreso}
        onClose={() => setIncomeModal({ open: false, ingreso: null })}
        onSaved={() => notifyChanged()}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total gastado este mes"
          value={formatCOP(resumen.total)}
          delta={resumen.variacionPct}
          sub="vs. mes anterior"
        />
        <StatCard
          label="Categoría con más gasto"
          value={resumen.categoriaTop ? resumen.categoriaTop.nombre : '—'}
          sub={resumen.categoriaTop ? formatCOP(resumen.categoriaTop.total) : ''}
        />
        <Link to="/hormiga" className="block">
          <StatCard
            label="🐜 Gastos hormiga"
            value={formatCOP(resumen.hormigaTotal)}
            sub={`${resumen.hormigaPct}% del total del mes`}
          />
        </Link>
        <StatCard
          label="4x1000 y comisiones"
          value={formatCOP(resumen.gmfTotal)}
          sub="lo corrido del mes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Evolución diaria del mes</h2>
            <Link to="/reportes" className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Ver reportes →
            </Link>
          </div>
          <DailyTrendChart data={serie} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Últimos gastos</h2>
            <Link to="/gastos" className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Ver todos →
            </Link>
          </div>
          {recientes.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Aún no has registrado gastos.</p>
          ) : (
            <div>
              {recientes.map((g) => (
                <ExpenseRow key={g.id} gasto={g} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Últimos ingresos</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIncomeModal({ open: true, ingreso: null })}
              className="text-xs font-medium text-brand-700 dark:text-brand-300"
            >
              + Añadir ingreso
            </button>
            <Link to="/ingresos" className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Ver todos →
            </Link>
          </div>
        </div>
        {ingresos.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Aún no has registrado ingresos.</p>
        ) : (
          <div>
            {ingresos.map((i) => (
              <IncomeRow
                key={i.id}
                ingreso={i}
                onClick={(ingreso) => setIncomeModal({ open: true, ingreso })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
