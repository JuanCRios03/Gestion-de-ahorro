import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatCOP } from '../lib/format';
import BudgetMeter, { toneForPct } from '../components/BudgetMeter';
import PeriodToggle from '../components/PeriodToggle';
import IncomeReferenceModal from '../components/IncomeReferenceModal';
import { CategoryBudgetRowConfigured, CategoryBudgetRowSinPresupuesto } from '../components/CategoryBudgetRow';

export default function Budget() {
  const { dataVersion, notifyChanged } = useApp();
  const [presupuesto, setPresupuesto] = useState(null);
  const [porCategoria, setPorCategoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingIngreso, setEditingIngreso] = useState(false);
  const [aplicandoSugerido, setAplicandoSugerido] = useState(false);

  async function cargar() {
    setLoading(true);
    const [res, cats] = await Promise.all([api.getPresupuesto(), api.getPresupuestosCategoria()]);
    setPresupuesto(res);
    setPorCategoria(cats);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, [dataVersion]);

  async function handleChangePeriodo(periodo) {
    setLoading(true);
    await api.actualizarPeriodoPresupuesto(periodo);
    await cargar();
  }

  async function handleChangePct(categoriaId, pct) {
    const nuevo = await api.actualizarPresupuestoCategoria(categoriaId, pct);
    setPorCategoria(nuevo);
  }

  async function handleQuitar(categoriaId) {
    const nuevo = await api.eliminarPresupuestoCategoria(categoriaId);
    setPorCategoria(nuevo);
  }

  async function handleSugerido() {
    setAplicandoSugerido(true);
    const nuevo = await api.aplicarPresupuestoSugerido();
    setPorCategoria(nuevo);
    setAplicandoSugerido(false);
  }

  const tone = presupuesto ? toneForPct(presupuesto.pctGastado) : 'good';
  const gastadoLabel = presupuesto?.periodo === 'quincenal' ? 'Gastado esta quincena' : 'Gastado este mes';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Presupuesto</h1>
          <p className="text-sm text-ink-muted">
            Tus gastos entendidos según lo que ganas, no solo en pesos.
          </p>
        </div>
        {presupuesto && <PeriodToggle periodo={presupuesto.periodo} onChange={handleChangePeriodo} />}
      </div>

      {loading || !presupuesto || !porCategoria ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : !presupuesto.ingresoActivo ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center dark:border-border-dark dark:bg-surface-dark">
          <p className="mb-3 text-sm text-ink-muted">
            Todavía no has definido cuánto ganas
            {presupuesto.periodo === 'quincenal' ? ' por quincena' : ' al mes'}. Sin eso no hay con
            qué comparar tus gastos.
          </p>
          <button
            onClick={() => setEditingIngreso(true)}
            className="rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
          >
            Definir ingreso {presupuesto.periodo === 'quincenal' ? 'quincenal' : 'mensual'}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink-muted">
                  Ingreso {presupuesto.periodo === 'quincenal' ? 'por quincena' : 'mensual'} de referencia
                </p>
                <p className="text-xl font-semibold text-ink dark:text-ink-dark">
                  {formatCOP(presupuesto.ingresoActivo)}
                </p>
              </div>
              <button
                onClick={() => setEditingIngreso(true)}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-black/5 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
              >
                Editar
              </button>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">{gastadoLabel}</span>
                <span
                  className={`font-semibold ${
                    tone === 'critical'
                      ? 'text-alert dark:text-alert-dark'
                      : tone === 'warning'
                      ? 'text-warning dark:text-warning-dark'
                      : 'text-ink dark:text-ink-dark'
                  }`}
                >
                  {presupuesto.pctGastado}%
                </span>
              </div>
              <BudgetMeter pct={presupuesto.pctGastado} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="mb-1 text-sm font-semibold text-ink dark:text-ink-dark">Por categoría</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Cada categoría con presupuesto se compara contra el % de tu ingreso que le
              asignaste, sobre {presupuesto.periodo === 'quincenal' ? 'la quincena actual' : 'el mes actual'}.
            </p>

            {porCategoria.conPresupuesto.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                Aún no has definido presupuesto para ninguna categoría.
              </p>
            ) : (
              porCategoria.conPresupuesto.map((cat) => (
                <CategoryBudgetRowConfigured
                  key={cat.categoriaId}
                  cat={cat}
                  onChangePct={handleChangePct}
                  onQuitar={handleQuitar}
                />
              ))
            )}
          </div>

          {porCategoria.sinPresupuesto.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Sin presupuesto definido</h2>
                <button
                  onClick={handleSugerido}
                  disabled={aplicandoSugerido}
                  className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-300"
                >
                  {aplicandoSugerido ? 'Aplicando…' : 'Usar sugerencia para todas'}
                </button>
              </div>
              <p className="mb-3 text-xs text-ink-muted">
                Ponles un % del ingreso para empezar a llevarles el presupuesto, o usa la
                sugerencia (se calcula sola con base en categorías típicas, sin pisar lo que ya
                configuraste).
              </p>
              {porCategoria.sinPresupuesto.map((cat) => (
                <CategoryBudgetRowSinPresupuesto
                  key={cat.categoriaId}
                  cat={cat}
                  onDefinir={handleChangePct}
                  periodo={presupuesto.periodo}
                />
              ))}
            </div>
          )}
        </>
      )}

      <IncomeReferenceModal
        open={editingIngreso}
        presupuesto={presupuesto}
        onClose={() => setEditingIngreso(false)}
        onSaved={(nuevo) => {
          setPresupuesto(nuevo);
          notifyChanged();
        }}
      />
    </div>
  );
}
