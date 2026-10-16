import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { addDays, todayISO, parseISODate } from '../lib/dateUtils';
import { formatCOP, formatDateShort, capitalize } from '../lib/format';
import StatCard from '../components/StatCard';
import PeriodSelector from '../components/PeriodSelector';
import DailyTrendChart from '../components/DailyTrendChart';
import { colorForSlot } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';

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

export default function AntExpenses() {
  const { dataVersion } = useApp();
  const mode = useColorMode();
  const [periodo, setPeriodo] = useState('mes');
  const [anchor, setAnchor] = useState(todayISO());
  const [resumen, setResumen] = useState(null);
  const [hormiga, setHormiga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const res = await api.getResumen(periodo, anchor);
      const h = await api.getHormiga(res.rango.start, res.rango.end);
      if (cancelled) return;
      setResumen(res);
      setHormiga(h);
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

  const pct = hormiga?.pctSobreTotal ?? 0;
  const meterColor = pct >= 25 ? 'var(--color-alert)' : pct >= 15 ? 'var(--color-brand-500)' : 'var(--color-good)';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">🐜 Gastos hormiga</h1>
        <p className="text-sm text-ink-muted">
          Compras pequeñas y frecuentes: solas no parecen mucho, juntas se comen el presupuesto.
        </p>
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

      {loading || !hormiga || !resumen || resumen.periodo !== periodo ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total en gastos hormiga" value={formatCOP(hormiga.totalHormiga)} accent />
            <StatCard label="Total del periodo" value={formatCOP(hormiga.totalGeneral)} />
            <StatCard label="Transacciones" value={String(hormiga.serie.reduce((a) => a + 1, 0))} sub="días con gasto hormiga" />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">% del presupuesto que representan</h2>
              <span className="text-2xl font-bold [font-variant-numeric:tabular-nums]" style={{ color: meterColor }}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/40">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: meterColor }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {pct >= 25
                ? 'Los gastos hormiga están consumiendo una parte importante de tu presupuesto.'
                : pct >= 15
                ? 'Vas bien, pero vale la pena vigilar estos pequeños gastos.'
                : 'Los gastos hormiga están bajo control en este periodo.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Evolución de gastos hormiga</h2>
            <DailyTrendChart data={hormiga.serie} />
          </div>

          {hormiga.porCategoria.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Dónde aparecen más</h2>
              <ul className="space-y-2">
                {hormiga.porCategoria.map((c) => (
                  <li key={c.nombre} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colorForSlot(c.color, mode) }}
                    />
                    <span className="flex-1 text-ink-secondary dark:text-ink-secondary-dark">{c.nombre}</span>
                    <span className="text-ink-muted">{c.cantidad} veces</span>
                    <span className="w-24 text-right font-medium text-ink [font-variant-numeric:tabular-nums] dark:text-ink-dark">
                      {formatCOP(c.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
