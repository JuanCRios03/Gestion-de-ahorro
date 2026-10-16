import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categorias, setCategorias] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [modal, setModal] = useState({ open: false, gasto: null });
  const [pendingCount, setPendingCount] = useState(0);

  const cargarCategorias = useCallback(async () => {
    const data = await api.getCategorias();
    setCategorias(data);
  }, []);

  const cargarPendientes = useCallback(async () => {
    try {
      const data = await api.getCapturas('pendiente');
      setPendingCount(data.length);
    } catch {
      // si la API aún no responde (arranque), simplemente no actualiza
    }
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    cargarPendientes();
    // Las capturas llegan desde el celular, fuera de cualquier acción en la
    // app — se revisan periódicamente para que el contador no quede viejo.
    const interval = setInterval(cargarPendientes, 20000);
    return () => clearInterval(interval);
  }, [cargarPendientes, dataVersion]);

  const notifyChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  const openAdd = useCallback(() => setModal({ open: true, gasto: null }), []);
  const openEdit = useCallback((gasto) => setModal({ open: true, gasto }), []);
  const closeModal = useCallback(() => setModal({ open: false, gasto: null }), []);

  const value = {
    categorias,
    cargarCategorias,
    dataVersion,
    notifyChanged,
    modal,
    openAdd,
    openEdit,
    closeModal,
    pendingCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
