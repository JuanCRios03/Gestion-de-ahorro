import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import PendingCaptureCard from '../components/PendingCaptureCard';

export default function Pending() {
  const { categorias, notifyChanged } = useApp();
  const [capturas, setCapturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  async function cargar() {
    setLoading(true);
    const [caps, cfg] = await Promise.all([api.getCapturas('pendiente'), api.getCapturasConfig()]);
    setCapturas(caps);
    setApiKey(cfg.apiKey);
    setLoading(false);
    if (caps.length === 0) setShowSetup(true);
  }

  useEffect(() => {
    cargar();
  }, []);

  function handleResolved(id) {
    setCapturas((prev) => prev.filter((c) => c.id !== id));
    notifyChanged();
  }

  function copiarKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">📥 Pendientes por confirmar</h1>
        <p className="text-sm text-ink-muted">
          Notificaciones de compra capturadas automáticamente desde tu celular. Revísalas y
          confírmalas para que cuenten como gasto real.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
        <button
          onClick={() => setShowSetup((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-ink dark:text-ink-dark"
        >
          Configurar la captura automática (MacroDroid)
          <span className="text-ink-muted">{showSetup ? '▲' : '▼'}</span>
        </button>

        {showSetup && (
          <div className="mt-4 space-y-4 text-sm text-ink-secondary dark:text-ink-secondary-dark">
            <p>
              En MacroDroid: <strong>Nueva macro</strong> → disparador <strong>Notificación recibida</strong>{' '}
              (app BBVA) → acción <strong>HTTP Request</strong> con estos datos:
            </p>

            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">URL (cambia la IP por la de Tailscale de tu PC)</p>
              <code className="block rounded-lg bg-page px-3 py-2 text-xs text-ink dark:bg-page-dark dark:text-ink-dark">
                POST http://&lt;IP-tailscale-de-tu-PC&gt;:4000/api/capturas
              </code>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">Headers</p>
              <code className="block rounded-lg bg-page px-3 py-2 text-xs text-ink dark:bg-page-dark dark:text-ink-dark">
                Content-Type: application/json
                <br />
                X-Api-Key: {apiKey}
              </code>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-ink-muted">Body (usa la variable de texto de la notificación de MacroDroid)</p>
              <code className="block rounded-lg bg-page px-3 py-2 text-xs text-ink dark:bg-page-dark dark:text-ink-dark">
                {'{ "texto": "[nm_text]" }'}
              </code>
            </div>

            <button
              onClick={copiarKey}
              className="rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-900"
            >
              {copied ? 'Copiada ✓' : 'Copiar API key'}
            </button>

            <p className="text-xs text-ink-muted">
              Esta key solo protege quién puede *enviar* capturas nuevas — sin ella, cualquier
              dispositivo en tu red Tailscale podría intentar registrar gastos falsos.
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : capturas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center dark:border-border-dark dark:bg-surface-dark">
          <p className="text-sm text-ink-muted">
            No hay notificaciones pendientes por revisar. En cuanto MacroDroid mande una, aparece aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {capturas.map((c) => (
            <PendingCaptureCard key={c.id} captura={c} categorias={categorias} onResolved={handleResolved} />
          ))}
        </div>
      )}
    </div>
  );
}
