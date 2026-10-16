import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatCOP } from '../lib/format';
import SavingsFormModal from '../components/SavingsFormModal';
import SavingsGoalModal from '../components/SavingsGoalModal';
import SavingsRow from '../components/SavingsRow';

export default function Savings() {
  const { dataVersion, notifyChanged } = useApp();
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, ahorro: null, tipoInicial: 'aporte' });
  const [goalModal, setGoalModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      const [res, movs] = await Promise.all([api.getAhorroResumen(), api.getAhorros()]);
      if (cancelled) return;
      setResumen(res);
      setMovimientos(movs);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  const pct = resumen?.progresoPct;
  const pctClamped = pct !== null && pct !== undefined ? Math.min(Math.max(pct, 0), 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">🐷 Ahorros</h1>
        <p className="text-sm text-ink-muted">
          Dinero que apartas del saldo disponible para ir acumulándolo. Sigue siendo tuyo, solo que
          no cuenta como plata para gastar.
        </p>
      </div>

      {loading || !resumen ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-brand-700 bg-brand-950 p-6 text-white sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-200">Total ahorrado</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight [font-variant-numeric:tabular-nums] sm:text-5xl">
                  {formatCOP(resumen.totalAhorrado)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setFormModal({ open: true, ahorro: null, tipoInicial: 'aporte' })}
                  className="rounded-lg bg-good px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  + Aporte
                </button>
                <button
                  onClick={() => setFormModal({ open: true, ahorro: null, tipoInicial: 'retiro' })}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-brand-100 hover:bg-white/10"
                >
                  − Retiro
                </button>
              </div>
            </div>

            {resumen.metaAhorro > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-brand-200">
                  <span>
                    Meta: {formatCOP(resumen.metaAhorro)} · {pct}%
                  </span>
                  <button onClick={() => setGoalModal(true)} className="font-medium text-brand-100 hover:underline">
                    Editar meta
                  </button>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-good transition-all"
                    style={{ width: `${pctClamped}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 border-t border-white/10 pt-4">
                <button onClick={() => setGoalModal(true)} className="text-xs font-medium text-brand-100 hover:underline">
                  + Definir una meta de ahorro
                </button>
              </div>
            )}
          </div>

          <SavingsFormModal
            open={formModal.open}
            ahorro={formModal.ahorro}
            tipoInicial={formModal.tipoInicial}
            onClose={() => setFormModal({ open: false, ahorro: null, tipoInicial: 'aporte' })}
            onSaved={() => notifyChanged()}
          />

          <SavingsGoalModal
            open={goalModal}
            ahorro={resumen}
            onClose={() => setGoalModal(false)}
            onSaved={() => notifyChanged()}
          />

          <div className="rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="px-1 pt-4 text-sm font-semibold text-ink dark:text-ink-dark">Movimientos</h2>
            {movimientos.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">Aún no has registrado aportes ni retiros.</p>
            ) : (
              <div>
                {movimientos.map((m) => (
                  <SavingsRow
                    key={m.id}
                    ahorro={m}
                    onClick={(ahorro) => setFormModal({ open: true, ahorro, tipoInicial: ahorro.tipo })}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
