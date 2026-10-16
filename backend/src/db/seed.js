// Genera datos de ejemplo (últimos ~100 días) para ver el dashboard funcionando
// desde el primer momento. Ejecutar con: npm run seed
//
// ADVERTENCIA: esto BORRA todos los gastos reales que tengas guardados y los
// reemplaza por datos ficticios. Por seguridad, si ya hay gastos registrados,
// este script se niega a correr a menos que se pase --force explícitamente:
//   npm run seed -- --force
import { db } from './connection.js';
import { calcularGMF } from '../lib/gmf.js';
import { toISODate, addDays, todayISO } from '../lib/dateUtils.js';

const categorias = db.prepare('SELECT id, nombre FROM categorias').all();
const catId = (nombre) => categorias.find((c) => c.nombre === nombre).id;

const existentes = db.prepare('SELECT COUNT(*) AS c FROM gastos').get().c;
const force = process.argv.includes('--force');
if (existentes > 0 && !force) {
  console.error(
    `\nYa tienes ${existentes} gasto(s) registrado(s). "npm run seed" los borraría todos y los ` +
      `reemplazaría por datos de ejemplo ficticios.\n\n` +
      `Si de verdad quieres hacer eso, corre:\n  npm run seed -- --force\n\n` +
      `Si lo que quieres es empezar de cero, borra tus gastos uno por uno desde la app, o pide ` +
      `explícitamente "vacía la base de datos" en vez de "seed".\n`
  );
  process.exit(1);
}

console.log('Limpiando gastos existentes...');
db.prepare('DELETE FROM gastos').run();

const insert = db.prepare(
  `INSERT INTO gastos
    (monto, fecha, categoria_id, descripcion, es_gasto_hormiga, es_comision_bancaria, aplica_gmf, gmf_amount, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function agregarGasto({ monto, fecha, categoria, descripcion, hormiga = false, comision = false, gmf = false }) {
  const gmfAmount = gmf ? calcularGMF(monto) : 0;
  insert.run(
    monto,
    fecha,
    catId(categoria),
    descripcion,
    hormiga ? 1 : 0,
    comision ? 1 : 0,
    gmf ? 1 : 0,
    gmfAmount,
    `${fecha} 12:00:00`
  );
}

const HORMIGA_ITEMS = [
  ['Café de la mañana', 4500, 8000],
  ['Snack en la tienda', 3000, 7000],
  ['Aplicación de streaming', 8000, 25000],
  ['Domicilio pequeño', 6000, 15000],
  ['Dulces / gaseosa', 2500, 6000],
  ['Parqueadero', 3000, 8000],
  ['Propina', 2000, 5000],
];

const ALIMENTACION_ITEMS = [
  ['Mercado de la semana', 60000, 180000],
  ['Almuerzo ejecutivo', 12000, 22000],
  ['Cena restaurante', 35000, 90000],
  ['Frutas y verduras', 15000, 40000],
];

const TRANSPORTE_ITEMS = [
  ['Recarga transporte público', 15000, 40000],
  ['Viaje app de transporte', 8000, 25000],
  ['Gasolina', 60000, 150000],
];

const ENTRETENIMIENTO_ITEMS = [
  ['Cine', 15000, 35000],
  ['Salida con amigos', 30000, 90000],
  ['Concierto / evento', 50000, 150000],
];

const SALUD_ITEMS = [
  ['Droguería', 10000, 45000],
  ['Consulta médica', 50000, 150000],
];

const start = addDays(todayISO(), -100);

for (let fecha = start; fecha <= todayISO(); fecha = addDays(fecha, 1)) {
  const d = new Date(fecha);
  const diaMes = Number(fecha.split('-')[2]);

  // Gastos hormiga: muy frecuentes, casi todos los días 1-3
  const nHormiga = randInt(0, 3);
  for (let i = 0; i < nHormiga; i++) {
    const [desc, min, max] = pick(HORMIGA_ITEMS);
    agregarGasto({
      monto: randInt(min, max),
      fecha,
      categoria: 'Gastos hormiga',
      descripcion: desc,
      hormiga: true,
    });
  }

  // Alimentación: casi diario
  if (Math.random() < 0.7) {
    const [desc, min, max] = pick(ALIMENTACION_ITEMS);
    agregarGasto({ monto: randInt(min, max), fecha, categoria: 'Alimentación', descripcion: desc });
  }

  // Transporte: entre semana más frecuente
  const esFinDeSemana = d.getDay() === 0 || d.getDay() === 6;
  if (!esFinDeSemana && Math.random() < 0.6) {
    const [desc, min, max] = pick(TRANSPORTE_ITEMS);
    agregarGasto({ monto: randInt(min, max), fecha, categoria: 'Transporte', descripcion: desc });
  }

  // Entretenimiento: ocasional, más fines de semana
  if (esFinDeSemana && Math.random() < 0.4) {
    const [desc, min, max] = pick(ENTRETENIMIENTO_ITEMS);
    agregarGasto({ monto: randInt(min, max), fecha, categoria: 'Entretenimiento', descripcion: desc });
  }

  // Salud: poco frecuente
  if (Math.random() < 0.05) {
    const [desc, min, max] = pick(SALUD_ITEMS);
    agregarGasto({ monto: randInt(min, max), fecha, categoria: 'Salud', descripcion: desc });
  }

  // Servicios: fijos a inicio de mes
  if (diaMes === 3) {
    agregarGasto({ monto: randInt(80000, 150000), fecha, categoria: 'Servicios', descripcion: 'Arriendo / servicios públicos' });
  }
  if (diaMes === 5) {
    agregarGasto({ monto: randInt(30000, 60000), fecha, categoria: 'Servicios', descripcion: 'Internet y telefonía' });
  }

  // Retiros / transferencias sujetas a 4x1000, ocasional
  if (Math.random() < 0.08) {
    const monto = randInt(100000, 400000);
    agregarGasto({
      monto,
      fecha,
      categoria: 'Comisiones bancarias',
      descripcion: 'Retiro cajero',
      comision: true,
      gmf: true,
    });
  }

  // Cuota de manejo mensual con GMF
  if (diaMes === 15) {
    const monto = randInt(15000, 25000);
    agregarGasto({
      monto,
      fecha,
      categoria: 'Comisiones bancarias',
      descripcion: 'Cuota de manejo tarjeta',
      comision: true,
      gmf: true,
    });
  }
}

const total = db.prepare('SELECT COUNT(*) AS c FROM gastos').get();
console.log(`Datos de ejemplo insertados: ${total.c} gastos entre ${start} y ${todayISO()}.`);
