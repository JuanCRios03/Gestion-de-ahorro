import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db/connection.js';
import categoriasRouter from './routes/categorias.js';
import gastosRouter from './routes/gastos.js';
import analyticsRouter from './routes/analytics.js';
import exportRouter from './routes/export.js';
import configRouter from './routes/config.js';
import ingresosRouter from './routes/ingresos.js';
import ahorrosRouter from './routes/ahorros.js';
import capturasRouter from './routes/capturas.js';
import presupuestosRouter from './routes/presupuestos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/categorias', categoriasRouter);
app.use('/api/gastos', gastosRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/export', exportRouter);
app.use('/api/config', configRouter);
app.use('/api/ingresos', ingresosRouter);
app.use('/api/ahorros', ahorrosRouter);
app.use('/api/capturas', capturasRouter);
app.use('/api/presupuestos', presupuestosRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Si existe un build del frontend (frontend/dist), la API también lo sirve.
// Esto permite empaquetar todo en un solo proceso para la app de escritorio (Electron).
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API de control de gastos escuchando en http://localhost:${PORT}`);
});
