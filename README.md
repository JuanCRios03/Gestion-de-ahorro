# Gestión de ahorro (local)

App de escritorio para controlar gastos personales (incluyendo gastos hormiga), ingresos, metas de ahorro, presupuesto según ingreso, reportes (semana/quincena/mes/trimestre), cálculo del 4x1000 y captura de compras desde notificaciones BBVA.

## Stack

- Electron (desktop)
- React (UI)
- Express (API local)
- SQLite (persistencia local)

## Ejecutar

```bash
npm install
npm start
```

La app inicia la API local en `http://localhost:3000` y abre la ventana de Electron.

## Tests

```bash
npm test
```

## Endpoints principales

- `POST /api/incomes` y `GET /api/incomes`
- `POST /api/expenses` y `GET /api/expenses`
- `POST /api/savings-goals` y `GET /api/savings-goals`
- `POST /api/savings-goals/:id/contributions`
- `POST /api/bbva-notifications`
- `GET /api/reports?period=week|biweek|month|quarter`
- `GET /api/4x1000?amount=...`
