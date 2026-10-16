import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import AntExpenses from './pages/AntExpenses';
import Savings from './pages/Savings';
import Pending from './pages/Pending';
import Income from './pages/Income';
import Budget from './pages/Budget';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gastos" element={<Expenses />} />
            <Route path="/ingresos" element={<Income />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/hormiga" element={<AntExpenses />} />
            <Route path="/ahorros" element={<Savings />} />
            <Route path="/pendientes" element={<Pending />} />
            <Route path="/presupuesto" element={<Budget />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
