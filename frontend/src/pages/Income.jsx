import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatCOP } from '../lib/format';
import IncomeRow from '../components/IncomeRow';
import IncomeFormModal from '../components/IncomeFormModal';

export default function Income() {
  const { dataVersion, notifyChanged } = useApp();
  const [filtros, setFiltros] = useState({ start: '', end: '' });
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, ingreso: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getIngresos(filtros).then((data) => {
      if (cancelled) return;
      setIngresos(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filtros, dataVersion]);

  const total = ingresos.reduce((acc, i) => acc + i.monto, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Ingresos</h1>
          <p className="text-sm text-ink-muted">
            {ingresos.length} registros · {formatCOP(total)}
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, ingreso: null })}
          className="rounded-xl bg-good px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + Añadir ingreso
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-3 dark:border-border-dark dark:bg-surface-dark">
        <input
          type="date"
          value={filtros.start}
          onChange={(e) => setFiltros({ ...filtros, start: e.target.value })}
          className="rounded-lg border border-border bg-page px-2.5 py-1.5 text-sm text-ink dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
        />
        <span className="self-center text-sm text-ink-muted">a</span>
        <input
          type="date"
          value={filtros.end}
          onChange={(e) => setFiltros({ ...filtros, end: e.target.value })}
          className="rounded-lg border border-border bg-page px-2.5 py-1.5 text-sm text-ink dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
        />
        {(filtros.start || filtros.end) && (
          <button
            onClick={() => setFiltros({ start: '', end: '' })}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Cargando…</p>
        ) : ingresos.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No hay ingresos con estos filtros.</p>
        ) : (
          ingresos.map((i) => (
            <IncomeRow key={i.id} ingreso={i} onClick={(ingreso) => setModal({ open: true, ingreso })} />
          ))
        )}
      </div>

      <IncomeFormModal
        open={modal.open}
        ingreso={modal.ingreso}
        onClose={() => setModal({ open: false, ingreso: null })}
        onSaved={() => notifyChanged()}
      />
    </div>
  );
}
