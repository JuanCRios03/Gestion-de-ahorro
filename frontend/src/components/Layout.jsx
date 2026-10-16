import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ExpenseFormModal from './ExpenseFormModal';
import { api } from '../lib/api';

const NAV_ITEMS = [
  { to: '/', label: 'Resumen', icon: '📊', end: true },
  { to: '/gastos', label: 'Gastos', icon: '🧾' },
  { to: '/ingresos', label: 'Ingresos', icon: '💰' },
  { to: '/presupuesto', label: 'Presupuesto', icon: '🎯' },
  { to: '/reportes', label: 'Reportes', icon: '📈' },
  { to: '/hormiga', label: 'Gastos hormiga', icon: '🐜' },
  { to: '/ahorros', label: 'Ahorros', icon: '🐷' },
];

// La barra inferior en celular no alcanza para los 7 — se queda con lo más
// frecuente; el resto (Presupuesto, Gastos hormiga) se llega desde enlaces en
// el Resumen o desde la barra lateral en escritorio.
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/', '/gastos', '/ingresos', '/reportes', '/ahorros'].includes(item.to)
);

function navClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-800 text-white'
      : 'text-ink-secondary hover:bg-black/5 dark:text-ink-secondary-dark dark:hover:bg-white/5'
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
    isActive ? 'text-brand-700 dark:text-brand-300' : 'text-ink-muted'
  }`;
}

export default function Layout() {
  const { openAdd, pendingCount } = useApp();

  return (
    <div className="min-h-screen bg-page dark:bg-page-dark">
      <div className="mx-auto flex max-w-6xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark sm:flex">
          <div className="mb-6 flex items-start justify-between px-2">
            <div>
              <p className="text-lg font-bold text-brand-900 dark:text-brand-200">Mis Finanzas</p>
              <p className="text-xs text-ink-muted">Control de gastos personal</p>
            </div>
            <NavLink
              to="/pendientes"
              className="relative shrink-0 rounded-lg p-1.5 text-lg hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Pendientes por confirmar"
            >
              🔔
              {pendingCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={openAdd}
            className="mb-2 rounded-xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900"
          >
            + Añadir gasto
          </button>
          <a
            href={api.exportUrl('csv')}
            download
            className="rounded-xl border border-border px-4 py-2.5 text-center text-xs font-medium text-ink-secondary hover:bg-black/5 dark:border-border-dark dark:text-ink-secondary-dark dark:hover:bg-white/5"
          >
            Exportar CSV
          </a>
        </aside>

        {/* Contenido */}
        <div className="flex-1 pb-24 sm:pb-8">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark sm:hidden">
            <p className="text-base font-bold text-brand-900 dark:text-brand-200">Mis Finanzas</p>
            <div className="flex items-center gap-3">
              <NavLink to="/pendientes" className="relative text-lg" aria-label="Pendientes por confirmar">
                🔔
                {pendingCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
              <a href={api.exportUrl('csv')} download className="text-xs font-medium text-brand-700 dark:text-brand-300">
                Exportar
              </a>
            </div>
          </header>
          <main className="p-4 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* FAB móvil */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-800 text-2xl text-white shadow-lg active:scale-95 sm:hidden"
        aria-label="Añadir gasto"
      >
        +
      </button>

      {/* Nav inferior móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border bg-surface py-2 dark:border-border-dark dark:bg-surface-dark sm:hidden">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={mobileNavClass}>
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <ExpenseFormModal />
    </div>
  );
}
