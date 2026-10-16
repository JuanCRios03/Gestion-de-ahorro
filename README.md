# Mis Finanzas — Control de gastos personal

Aplicación personal (un solo usuario, sin login) para registrar gastos diarios,
incluyendo gastos hormiga, y entender cómo se comporta tu dinero por semana,
quincena, mes y trimestre. Incluye seguimiento del 4x1000 (GMF) y otras comisiones
bancarias como un gasto más dentro del análisis.

Se puede usar de dos formas: como **app de escritorio** (una ventana nativa de
Windows, recomendado para uso diario) o como **web app** en el navegador (dos
procesos, útil si quieres abrirla también desde el celular).

## Estructura del proyecto

```
backend/    API REST (Node.js + Express + SQLite nativo de Node)
frontend/   App React (Vite + Tailwind CSS + Recharts)
electron/   Ventana de escritorio que envuelve todo lo anterior
```

## Requisitos

- **Node.js 22.5 o superior** (usa el módulo nativo `node:sqlite`, incluido en Node
  desde la versión 22.5; no se necesita instalar ni compilar SQLite aparte).

Verifica tu versión con `node -v`. Este proyecto se probó con Node 24.

## Opción A: App de escritorio (recomendada)

Una sola ventana nativa, sin terminales que dejar abiertas ni pestañas del
navegador. Por dentro sigue siendo el mismo backend Express + SQLite: cada gasto
que agregues se guarda en el mismo archivo `backend/data/gastos.db`.

Instalación (una sola vez):

```bash
npm run setup          # instala dependencias de backend/, frontend/ y de electron/
```

No hace falta ningún paso extra para los datos: la primera vez que arranca el
backend crea `backend/data/gastos.db` automáticamente, vacío, solo con las
categorías predefinidas — listo para que registres tus propios gastos desde cero.

Si en algún momento quieres ver la app poblada con datos ficticios (por ejemplo
para probar antes de meter datos reales), corre `npm run seed` — pero ten en
cuenta que **borra todos los gastos que tengas guardados** y los reemplaza por
~100 días de ejemplo. Como precaución, si ya tienes gastos registrados el script
se niega a correr a menos que agregues `--force` (`npm run seed -- --force`); sin
ese flag no borra nada.

Para abrir la app cada vez:

```bash
npm run desktop        # compila el frontend y abre la ventana
```

o, si ya compilaste el frontend antes y no cambiaste nada del código:

```bash
npm start              # solo abre la ventana (más rápido)
```

Al abrirse, la ventana arranca la API (`backend/src/server.js`) con el Node.js
instalado en tu equipo y carga la interfaz apuntando a `http://localhost:4000`; al
cerrar la ventana, la API se cierra con ella. Los datos siguen viviendo en
`backend/data/gastos.db`, igual que en la Opción B.

> Nota: la ventana de escritorio usa Electron internamente, pero lanza el backend
> con el Node.js **del sistema** (no el que trae Electron incluido), porque
> `node:sqlite` requiere Node 22.5+ y el Node interno de Electron es más antiguo.
> Por eso Node.js debe estar instalado en el PATH aunque uses la app de escritorio.

## Opción B: Web app (dos procesos)

Útil si quieres registrar gastos también desde el celular en la misma red.
Se ejecutan **dos procesos**: la API (puerto 4000) y el frontend (puerto 5173).
Abre dos terminales.

### 1. Backend (API)

```bash
cd backend
npm install
npm run dev    # levanta la API en http://localhost:4000
```

La base de datos se crea automáticamente en `backend/data/gastos.db`, vacía y solo
con las categorías predefinidas (ver nota sobre `npm run seed` en la Opción A si
quieres datos de ejemplo en vez de empezar en blanco). Este archivo **es tu
información real** una vez que empieces a usar la app — no lo borres a menos que
quieras reiniciar todo. Es el mismo archivo que usa la app de escritorio (Opción A),
así que puedes alternar entre las dos sin perder datos.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev    # levanta la app en http://localhost:5173
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador (o en el celular,
si estás en la misma red y usas `npm run dev -- --host` para exponerlo).

El frontend está configurado para redirigir automáticamente las peticiones `/api/*`
hacia `http://localhost:4000` (ver `frontend/vite.config.js`), así que ambos deben
estar corriendo a la vez.

## Uso diario

- **Saldo disponible**: la tarjeta grande en el Resumen. Arranca en el "saldo
  inicial" que definas (botón "Editar saldo inicial") y debajo del número
  principal se ve el desglose completo: saldo inicial, ingresos y gastos que lo
  componen. Se le resta **todo** gasto que tengas registrado, sin importar su
  fecha — el 4x1000 incluido. La fecha que le pones al saldo es solo una nota
  tuya de cuándo era válido ese monto, no filtra nada. Si más adelante quieres
  re-sincronizarlo con tu banco, edítalo de nuevo con el monto actual.
- **Ingresos**: botón "+ Ingreso" en la misma tarjeta (o "+ Añadir ingreso" en la
  sección "Últimos ingresos"). Úsalo cuando te paguen o recibas cualquier dinero;
  suma directo al saldo disponible. Igual que los gastos, cada ingreso se puede
  editar o eliminar tocándolo en la lista.
- **Ahorros** (pestaña "Ahorros"): aparta dinero del saldo disponible para irlo
  acumulando con el botón "+ Aporte" — sigue siendo tuyo, solo que deja de contar
  como plata disponible para gastar. Si necesitas usarlo, "− Retiro" lo regresa al
  saldo disponible. Puedes definir una meta opcional ("+ Definir una meta de
  ahorro") para ver el progreso en barra y porcentaje. El saldo disponible del
  Resumen ya descuenta lo apartado en Ahorros — se ve reflejado en el desglose
  bajo la cifra principal.
- **Añadir un gasto**: botón "+ Añadir gasto" (barra lateral en escritorio, botón
  flotante circular en celular). Por defecto ya viene con la fecha de hoy y la
  categoría "Gastos hormiga" preseleccionada, pensado para registrar en 2-3 toques.
- **Editar o eliminar**: toca cualquier gasto en la lista de "Gastos" o en "Últimos
  gastos" del resumen; se abre el mismo formulario con las opciones de guardar o
  eliminar.
- **4x1000**: al registrar un gasto (por ejemplo un retiro), activa "Aplica 4x1000
  (GMF)" y la app calcula automáticamente el 0.4% y lo suma al total de comisiones,
  sin alterar el monto del gasto que registraste.
- **Reportes**: pestañas de semana / quincena / mes / trimestre, con flechas para
  moverte entre periodos y comparación contra el periodo anterior.
- **Gastos hormiga**: panel dedicado con el acumulado, el porcentaje que representan
  sobre el total del periodo y en qué categorías aparecen más.
- **Exportar**: botón "Exportar CSV" en la barra lateral (también disponible en
  `GET /api/export?format=json`).
- **Pendientes** (🔔 en la barra lateral): notificaciones de compra capturadas
  automáticamente desde el celular (ver guía de captura automática más abajo).
  Nunca se guardan solas como gasto — siempre hay que revisarlas y confirmarlas
  (o descartarlas) desde esta bandeja, porque la notificación no trae categoría
  y el texto se puede leer mal.
- **Presupuesto**: entiende tus gastos según lo que ganas, no solo en pesos —
  útil porque el mismo gasto pesa distinto si ganas 2 millones o 5. Se puede
  medir **por mes o por quincena** (botones "Mensual" / "Quincenal" en el
  Resumen o en la pestaña Presupuesto — útil si te pagan quincenal); cada uno
  guarda su propio ingreso de referencia, así que puedes cambiar de vista sin
  perder el otro valor. Define tu ingreso (botón "Definir ingreso" /
  "Editar") y aparece "llevas gastado el X% de tu ingreso" con barra de
  progreso (verde <80%, ámbar 80-100%, rojo >100%), calculado sobre el mes
  calendario o la quincena actual (1-15 / 16-fin de mes) según el modo activo.
  En la pestaña Presupuesto puedes además asignarle a cada categoría un % de
  ese ingreso como tope — hay un botón "Usar sugerencia para todas" que
  aplica un reparto típico (sin pisar lo que ya hayas configurado a mano)
  para no partir de cero. Esto es solo de referencia: no bloquea que
  registres un gasto aunque te pases del presupuesto.

## Captura automática de compras (BBVA + celular Android)

Esto es opcional. Permite que cada notificación de compra de BBVA en tu celular
llegue sola a la bandeja de "Pendientes" de la app, sin escribir nada a mano.
Nada de esto se comparte con nadie más que tus propios dispositivos.

### 1. Activa las notificaciones de compra en BBVA

En la app BBVA Colombia: **Configuración → Avisos y Alertas** → activa las
notificaciones push de compras con tarjeta. (Evita activar los SMS bancarios si
tu plan te cobra por mensaje — los push son gratis y es lo que vamos a usar).

### 2. Conecta tu celular y tu PC con Tailscale (gratis, privado)

[Tailscale](https://tailscale.com) crea una red privada cifrada solo entre tus
propios dispositivos — nadie más puede verla ni conectarse, y no se abre ningún
puerto a internet público.

1. Crea una cuenta gratis en tailscale.com (con tu Google/Microsoft/email).
2. Instala Tailscale en tu PC y abre sesión con esa cuenta.
3. Instala la app Tailscale en tu celular (Play Store) y abre sesión con la
   misma cuenta.
4. En la app de Tailscale del PC, copia la IP que te asigna (empieza por
   `100.`) — es la que vas a usar en el siguiente paso.

### 3. Arma la automatización en MacroDroid (celular)

1. Instala [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)
   desde Play Store (gratis).
2. Nueva macro → disparador **Notification Received**, filtra por la app BBVA.
3. Acción → **HTTP Request**:
   - Método: `POST`
   - URL: `http://100.x.x.x:4000/api/capturas` (la IP de Tailscale de tu PC del
     paso anterior)
   - Headers: `Content-Type: application/json` y `X-Api-Key: <tu key>`
   - Body: `{ "texto": "[nm_text]" }` (la variable del texto de la notificación
     — el nombre exacto de la variable puede variar según la versión de
     MacroDroid, revisa las variables disponibles del disparador de
     notificación).
4. Guarda la macro. Tu API key está en la app, en **Pendientes → Configurar la
   captura automática (MacroDroid)** — ahí mismo hay un botón para copiarla.

### 4. Probar y calibrar

Haz una compra pequeña de prueba y revisa **Pendientes** en la app — debería
aparecer sola en un par de segundos. El parseo del monto y el comercio
(`backend/src/lib/parseNotificacion.js`) está calibrado con el formato típico
de notificación bancaria colombiana, pero **nunca se probó con una notificación
real de BBVA** — es normal que al principio el monto o el comercio no se lean
bien. Si pasa, la notificación igual queda en Pendientes con el texto completo
para completarla a mano, y avísame el texto exacto para ajustar el parser.

Tu PC tiene que estar prendida y con la app abierta (`npm start`) para que las
capturas lleguen — si está apagada, MacroDroid simplemente no logrará conectar
y puedes reintentar luego, no se pierde la notificación original en tu celular.

## Notas técnicas

- **Presupuesto por ingreso**: `configuracion.periodo_presupuesto`
  (`'mensual'` o `'quincenal'`) decide cuál de los dos ingresos de referencia
  está activo — `ingreso_mensual_referencia` o `ingreso_quincenal_referencia`,
  ambos números que tú defines a mano (no se calculan solo de los Ingresos
  registrados, porque el ingreso real puede llegar en fechas irregulares).
  `presupuestos_categoria` guarda, por categoría, el % de ese ingreso asignado
  como tope; una categoría sin fila ahí simplemente no tiene presupuesto
  todavía. Toda la lógica de cálculo vive en
  `backend/src/lib/aggregations.js` (`resumenPresupuesto`,
  `resumenPresupuestosCategoria`), incluida la sugerencia 50/30/20 de
  `aplicarPresupuestoSugerido` — nunca sobrescribe un % que el usuario ya haya
  puesto a mano (usa `ON CONFLICT DO NOTHING`). El rango de fechas del periodo
  activo reutiliza `getMonthRange`/`getBiweeklyRange` de
  `backend/src/lib/dateUtils.js`, las mismas funciones que usan los Reportes.
- **Capturas automáticas**: `backend/src/routes/capturas.js` recibe el texto
  crudo vía `POST /api/capturas` (protegido con una API key generada sola en
  `configuracion.capture_api_key`), lo parsea con
  `backend/src/lib/parseNotificacion.js` y lo guarda en `capturas_pendientes`
  con `estado='pendiente'`. Nunca escribe directo en `gastos` — eso solo pasa
  al confirmar desde la bandeja de Pendientes (`POST /api/capturas/:id/confirmar`),
  que sí valida categoría y monto como cualquier gasto normal.
- **Base de datos**: SQLite vía el módulo nativo `node:sqlite` — cero dependencias
  nativas que compilar, cero configuración. El esquema vive en
  `backend/src/db/schema.sql` y se aplica automáticamente al arrancar.
- **Cálculo del 4x1000**: `backend/src/lib/gmf.js` (0.4% del monto, redondeado al
  peso). Se guarda por gasto en la columna `gmf_amount`, lo que permite sumarlo o
  filtrarlo en cualquier reporte sin tocar el monto original del gasto.
- **Agregaciones por periodo**: aisladas en `backend/src/lib/aggregations.js` y
  `backend/src/lib/dateUtils.js`, separadas de las rutas HTTP — añadir una vista
  nueva (por ejemplo anual) es cuestión de sumar un resolver de rango de fechas ahí.
- **Categorías y colores**: las categorías guardan un "slot" de color (`blue`,
  `orange`, `aqua`, etc.) en vez de un hex fijo; el frontend
  (`frontend/src/theme/palette.js`) resuelve el tono según modo claro/oscuro. El
  slot `red` queda reservado exclusivamente para alertas de gasto por encima del
  promedio — nunca se usa para identificar una categoría.
- **Exportar / respaldo**: `GET /api/export?format=csv|json` genera un volcado
  completo de todos los gastos con su categoría.
- **App de escritorio**: `electron/main.js` lanza `backend/src/server.js` como
  proceso hijo (con el Node del sistema, ver nota arriba) y abre una
  `BrowserWindow` apuntando a `http://localhost:4000/`. La API también sirve el
  build del frontend (`frontend/dist`) como archivos estáticos cuando existe —
  así todo corre en un solo servidor sin necesitar CORS ni un proxy aparte.

## Reiniciar los datos de ejemplo

Si quieres volver a generar los ~100 días de datos de ejemplo, **esto borra todos
tus gastos reales actuales** (las categorías, ingresos y ahorros no se tocan). Si ya
tienes gastos guardados, el script se niega a correr solo:

```bash
cd backend
npm run seed -- --force
```

Sin `--force` no hace nada si ya hay gastos registrados, precisamente para que este
comando no borre datos reales por accidente.
