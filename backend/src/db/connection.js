import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'gastos.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migración simple: agrega columnas nuevas a tablas que ya existían antes de
// que se introdujeran (SQLite no soporta "ADD COLUMN IF NOT EXISTS").
const configColumns = db.prepare("PRAGMA table_info(configuracion)").all();
if (!configColumns.some((c) => c.name === 'meta_ahorro')) {
  db.exec('ALTER TABLE configuracion ADD COLUMN meta_ahorro REAL NOT NULL DEFAULT 0');
}
if (!configColumns.some((c) => c.name === 'capture_api_key')) {
  db.exec('ALTER TABLE configuracion ADD COLUMN capture_api_key TEXT');
}
if (!configColumns.some((c) => c.name === 'ingreso_mensual_referencia')) {
  db.exec('ALTER TABLE configuracion ADD COLUMN ingreso_mensual_referencia REAL NOT NULL DEFAULT 0');
}
if (!configColumns.some((c) => c.name === 'ingreso_quincenal_referencia')) {
  db.exec('ALTER TABLE configuracion ADD COLUMN ingreso_quincenal_referencia REAL NOT NULL DEFAULT 0');
}
if (!configColumns.some((c) => c.name === 'periodo_presupuesto')) {
  db.exec("ALTER TABLE configuracion ADD COLUMN periodo_presupuesto TEXT NOT NULL DEFAULT 'mensual'");
}

// El valor de "color" es un slot de la paleta categórica validada (ver frontend/src/theme/palette.js),
// no un hex directo: así el frontend puede resolver el tono correcto para modo claro/oscuro.
// El slot "red" queda reservado exclusivamente para alertas (gastos que exceden el promedio).
const CATEGORIAS_PREDEFINIDAS = [
  { nombre: 'Alimentación', color: 'blue' },
  { nombre: 'Transporte', color: 'aqua' },
  { nombre: 'Entretenimiento', color: 'violet' },
  { nombre: 'Servicios', color: 'green' },
  { nombre: 'Salud', color: 'magenta' },
  { nombre: 'Gastos hormiga', color: 'orange' },
  { nombre: 'Comisiones bancarias', color: 'yellow' },
  { nombre: 'Otros', color: 'gray' },
];

const countRow = db.prepare('SELECT COUNT(*) AS c FROM categorias').get();
if (countRow.c === 0) {
  const insert = db.prepare(
    'INSERT INTO categorias (nombre, color, es_predefinida) VALUES (?, ?, 1)'
  );
  for (const cat of CATEGORIAS_PREDEFINIDAS) {
    insert.run(cat.nombre, cat.color);
  }
}

const configRow = db.prepare('SELECT COUNT(*) AS c FROM configuracion').get();
if (configRow.c === 0) {
  db.prepare(
    'INSERT INTO configuracion (id, saldo_inicial, capture_api_key) VALUES (1, 0, ?)'
  ).run(crypto.randomBytes(24).toString('hex'));
} else {
  const existing = db.prepare('SELECT capture_api_key FROM configuracion WHERE id = 1').get();
  if (!existing.capture_api_key) {
    db.prepare('UPDATE configuracion SET capture_api_key = ? WHERE id = 1').run(
      crypto.randomBytes(24).toString('hex')
    );
  }
}

export default db;
