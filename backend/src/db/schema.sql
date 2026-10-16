-- Esquema de la base de datos de control de gastos personales

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'gray',
  es_predefinida INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monto REAL NOT NULL CHECK (monto > 0),
  fecha TEXT NOT NULL,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  descripcion TEXT DEFAULT '',
  es_gasto_hormiga INTEGER NOT NULL DEFAULT 0,
  es_comision_bancaria INTEGER NOT NULL DEFAULT 0,
  aplica_gmf INTEGER NOT NULL DEFAULT 0,
  gmf_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria_id);

-- Ingresos: dinero que entra (ej. pago de nómina), suma al saldo disponible.
CREATE TABLE IF NOT EXISTS ingresos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monto REAL NOT NULL CHECK (monto > 0),
  fecha TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);

-- Ahorros: dinero que apartas del saldo disponible para ir acumulándolo
-- (aporte) o que retomas cuando lo usas (retiro). Sigue siendo tuyo, pero deja
-- de contar como "disponible para gastar".
CREATE TABLE IF NOT EXISTS ahorros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monto REAL NOT NULL CHECK (monto > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('aporte', 'retiro')),
  fecha TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ahorros_fecha ON ahorros(fecha);

-- Fila única (id siempre 1): saldo con el que arranca el control de gastos, la
-- fecha a partir de la cual los gastos registrados empiezan a descontarse de él,
-- y la meta de ahorro opcional (0 = sin meta definida).
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  saldo_inicial REAL NOT NULL DEFAULT 0,
  fecha_saldo_inicial TEXT NOT NULL DEFAULT (date('now')),
  meta_ahorro REAL NOT NULL DEFAULT 0,
  capture_api_key TEXT,
  ingreso_mensual_referencia REAL NOT NULL DEFAULT 0,
  ingreso_quincenal_referencia REAL NOT NULL DEFAULT 0,
  periodo_presupuesto TEXT NOT NULL DEFAULT 'mensual' CHECK (periodo_presupuesto IN ('mensual', 'quincenal')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Presupuesto por categoría: cuánto de tu ingreso mensual de referencia le
-- asignas a cada categoría, como porcentaje (ej. 20 = 20% del ingreso). Una
-- categoría sin fila aquí simplemente no tiene presupuesto definido todavía.
CREATE TABLE IF NOT EXISTS presupuestos_categoria (
  categoria_id INTEGER PRIMARY KEY REFERENCES categorias(id) ON DELETE CASCADE,
  porcentaje_ingreso REAL NOT NULL CHECK (porcentaje_ingreso >= 0 AND porcentaje_ingreso <= 100),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Capturas pendientes: notificaciones de compra recibidas automáticamente (ej.
-- desde el celular vía MacroDroid) que todavía no se han confirmado como gasto.
-- Nunca se guardan directo en `gastos` — siempre pasan por revisión manual,
-- porque el texto de la notificación no trae categoría y el parseo puede fallar.
CREATE TABLE IF NOT EXISTS capturas_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monto REAL,
  comercio TEXT DEFAULT '',
  fecha TEXT NOT NULL,
  texto_original TEXT NOT NULL,
  origen TEXT NOT NULL DEFAULT 'notificacion',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'descartada')),
  gasto_id INTEGER REFERENCES gastos(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_capturas_estado ON capturas_pendientes(estado);
