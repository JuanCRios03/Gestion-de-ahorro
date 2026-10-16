const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createServer } = require('../src/server');

test('reports should aggregate totals by selected period', async () => {
  const { app, db } = createServer({ dbPath: ':memory:' });

  db.prepare('INSERT INTO incomes(amount, source, date) VALUES (?, ?, ?)').run(1000000, 'Salario', '2026-10-10');
  db.prepare('INSERT INTO expenses(amount, category, description, date, is_small_expense, source) VALUES (?, ?, ?, ?, ?, ?)').run(
    20000,
    'Transporte',
    'Taxi',
    '2026-10-10',
    1,
    'manual'
  );

  const response = await request(app).get('/api/reports?period=month&referenceDate=2026-10-16');

  assert.equal(response.status, 200);
  assert.equal(response.body.totals.income, 1000000);
  assert.equal(response.body.totals.expenses, 20000);
  assert.equal(response.body.fourPerThousandEstimated, 80);
  assert.equal(response.body.period, 'month');

  db.close();
});

test('bbva notification should create expense entry', async () => {
  const { app, db } = createServer({ dbPath: ':memory:' });

  const response = await request(app)
    .post('/api/bbva-notifications')
    .send({ text: 'BBVA: Compra por $12.500 en TIENDA XYZ el 15/10' });

  assert.equal(response.status, 201);
  assert.equal(response.body.amount, 12500);

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(response.body.expenseId);
  assert.equal(expense.source, 'bbva_notification');
  assert.equal(expense.is_small_expense, 1);

  db.close();
});

test('4x1000 endpoint should calculate value', async () => {
  const { app, db } = createServer({ dbPath: ':memory:' });

  const response = await request(app).get('/api/4x1000?amount=500000');

  assert.equal(response.status, 200);
  assert.equal(response.body.fourPerThousand, 2000);

  db.close();
});
