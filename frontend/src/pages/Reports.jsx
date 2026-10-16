import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { addDays, todayISO, parseISODate } from '../lib/dateUtils';
import { formatCOP, formatDateShort, capitalize } from '../lib/format';
import StatCard from '../components/StatCard';
import PeriodSelector from '../components/PeriodSelector';
import CategoryPieChart from '../components/CategoryPieChart';
import DailyTrendChart from '../components/DailyTrendChart';
import QuarterMonthChart from '../components/QuarterMonthChart';

function rangeLabel(periodo, resumen) {
  if (!resumen) return '';
  const { rango } = resumen;
  if (periodo === 'mes') {
    return capitalize(parseISODate(rango.start).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }));
  }
  if (periodo === 'trimestre') {
    const q = Math.floor(parseISODate(rango.start).getMonth() / 3) + 1;
    return `Trimestre ${q} · ${parseISODate(rango.start).getFullYear()}`;
  }
  return `${formatDateShort(rango.start)} – ${formatDateShort(rango.end)}`;
}

export default function Reports() {
  const { dataVersion } = useApp();
  const [periodo, setPeriodo] = useState('mes');
  const [anchor, setAnchor] = useState(todayISO());
  const [resumen, setResumen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [serie, setSerie] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const res = await api.getResumen(periodo, anchor);
      const [cats, ser] = await Promise.all([
        api.getCategoriasDistribucion(res.rango.start, res.rango.end),
        periodo === 'trimestre' ? Promise.resolve([]) : api.getSerie(res.rango.start, res.rango.end),
      ]);
      if (cancelled) return;
      setResumen(res);
      setCategorias(cats);
      setSerie(ser);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [periodo, anchor, dataVersion]);

  function handlePrev() {
    if (!resumen) return;
    setAnchor(resumen.rangoAnterior.start);
  }
  function handleNext() {
    if (!resumen) return;
    setAnchor(addDays(resumen.rango.end, 1));
  }
  function handleToday() {
    setAnchor(todayISO());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">Reportes</h1>
        <p className="text-sm text-ink-muted">Analiza tus gastos por periodo</p>
      </div>

      <PeriodSelector
        periodo={periodo}
        onChangePeriodo={(p) => {
          setPeriodo(p);
          setAnchor(todayISO());
        }}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        rangeLabel={rangeLabel(periodo, resumen)}
      />

      {loading || !resumen || resumen.periodo !== periodo ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total del periodo" value={formatCOP(resumen.total)} delta={resumen.variacionPct} sub="vs. periodo anterior" accent />
            <StatCard label="Periodo anterior" value={formatCOP(resumen.totalAnterior)} />
            <StatCard
              label="Gastos hormiga"
              value={formatCOP(resumen.hormigaTotal)}
              sub={`${resumen.hormigaPct}% del total`}
            />
            <StatCard label="4x1000 y comisiones" value={formatCOP(resumen.gmfTotal)} />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">
              {periodo === 'trimestre' ? 'Comparación mensual del trimestre' : 'Evolución diaria'}
            </h2>
            {periodo === 'trimestre' ? (
              <QuarterMonthChart meses={resumen.meses} />
            ) : (
              <DailyTrendChart data={serie} />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="mb-4 text-sm font-semibold text-ink dark:text-ink-dark">Distribución por categoría</h2>
            <CategoryPieChart data={categorias} />
          </div>
        </>
      )}
    </div>
  );
}
