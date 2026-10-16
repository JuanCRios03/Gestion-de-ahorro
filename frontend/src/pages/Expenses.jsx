import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatCOP } from '../lib/format';
import { todayISO } from '../lib/dateUtils';
import ExpenseRow from '../components/ExpenseRow';

function inicioDeMesActual() {
  const hoy = todayISO();
  return `${hoy.slice(0, 7)}-01`;
}

export default function Expenses() {
  const { categorias, dataVersion, openAdd } = useApp();
  const [filtros, setFiltros] = useState({ start: inicioDeMesActual(), end: '', categoria_id: '', hormiga: '' });
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getGastos(filtros).then((data) => {
      if (cancelled) return;
      setGastos(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filtros, dataVersion]);

  const total = gastos.reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Gastos</h1>
          <p className="text-sm text-ink-muted">{gastos.length} registros · {formatCOP(total)}</p>
        </div>
        <button
          onClick={openAdd}
          className="hidden rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900 sm:block"
        >
          + Añadir gasto
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
        <select
          value={filtros.categoria_id}
          onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
          className="rounded-lg border border-border bg-page px-2.5 py-1.5 text-sm text-ink dark:border-border-dark dark:bg-page-dark dark:text-ink-dark"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 rounded-lg border border-border bg-page px-2.5 py-1.5 text-sm text-ink dark:border-border-dark dark:bg-page-dark dark:text-ink-dark">
          <input
            type="checkbox"
            checked={filtros.hormiga === '1'}
            onChange={(e) => setFiltros({ ...filtros, hormiga: e.target.checked ? '1' : '' })}
            className="accent-brand-600"
          />
          🐜 Solo hormiga
        </label>
        {(filtros.start || filtros.end || filtros.categoria_id || filtros.hormiga) && (
          <button
            onClick={() => setFiltros({ start: '', end: '', categoria_id: '', hormiga: '' })}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Cargando…</p>
        ) : gastos.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No hay gastos con estos filtros.</p>
        ) : (
          gastos.map((g) => <ExpenseRow key={g.id} gasto={g} />)
        )}
      </div>
    </div>
  );
}
