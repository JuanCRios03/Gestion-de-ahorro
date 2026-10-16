const path = require('path');
const express = require('express');
const { initializeDatabase } = require('./db');

const PERIOD_MAP = {
  week: 7,
  biweek: 15,
  month: 30,
  quarter: 90,
};

function toISODate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function getRangeByPeriod(period, referenceDate = new Date()) {
  const days = PERIOD_MAP[period] || PERIOD_MAP.month;
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);
  start.setDate(end.getDate() - (days - 1));
  return { from: toISODate(start), to: toISODate(end), period: period in PERIOD_MAP ? period : 'month' };
}

function parseBbvaNotification(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  const amountMatch = normalized.match(/(?:\$|COP\s*)([\d.,]+)/i);

  if (!amountMatch) {
    throw new Error('No se encontró monto en la notificación BBVA');
  }

  const amount = Number(amountMatch[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Monto inválido en la notificación BBVA');
  }

  const lowered = normalized.toLowerCase();
  const marker = lowered.includes(' en ') ? ' en ' : lowered.includes(' a ') ? ' a ' : null;
  let description = 'Compra detectada BBVA';
  if (marker) {
    const start = lowered.indexOf(marker) + marker.length;
    let end = normalized.indexOf('.', start);
    if (end === -1) end = normalized.indexOf(',', start);
    if (end === -1) end = normalized.length;
    const parsedDescription = normalized.slice(start, end).trim();
    if (parsedDescription) {
      description = parsedDescription;
    }
  }

  return { amount, description };
}

function createRateLimiter({ windowMs = 60000, maxRequests = 120 } = {}) {
  const bucket = new Map();
  return function rateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'local';
    const now = Date.now();
    const existing = bucket.get(key);

    if (!existing || now - existing.windowStart > windowMs) {
      bucket.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (existing.count >= maxRequests) {
      return res.status(429).json({ error: 'Demasiadas solicitudes, intenta de nuevo en unos segundos.' });
    }

    existing.count += 1;
    return next();
  };
}

function calculateBudgetByIncome(totalIncome) {
  const income = Number(totalIncome) || 0;
  return {
    income,
    needs: Number((income * 0.5).toFixed(2)),
    wants: Number((income * 0.3).toFixed(2)),
    savings: Number((income * 0.2).toFixed(2)),
    maxRecommendedExpenses: Number((income * 0.8).toFixed(2)),
  };
}

function sumInRange(db, table, from, to) {
  const row = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM ${table} WHERE date BETWEEN ? AND ?`).get(from, to);
  return Number(row.total || 0);
}

function createApp(db) {
  const app = express();
  const reactUmdPath = path.join(path.dirname(require.resolve('react/package.json')), 'umd');
  const reactDomUmdPath = path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd');

  app.use(express.json());
  app.use('/api', createRateLimiter());
  app.use('/vendor/react', express.static(reactUmdPath));
  app.use('/vendor/react-dom', express.static(reactDomUmdPath));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/incomes', (_req, res) => {
    const incomes = db.prepare('SELECT * FROM incomes ORDER BY date DESC, id DESC').all();
    res.json(incomes);
  });

  app.post('/api/incomes', (req, res) => {
    const { amount, source = 'Ingreso', date = toISODate() } = req.body || {};
    if (!(amount > 0)) return res.status(400).json({ error: 'amount debe ser mayor a 0' });

    const result = db.prepare('INSERT INTO incomes(amount, source, date) VALUES (?, ?, ?)').run(amount, source, date);
    const income = db.prepare('SELECT * FROM incomes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(income);
  });

  app.get('/api/expenses', (_req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, id DESC').all();
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const {
      amount,
      category = 'General',
      description = '',
      date = toISODate(),
      isSmallExpense = false,
      source = 'manual',
    } = req.body || {};

    if (!(amount > 0)) return res.status(400).json({ error: 'amount debe ser mayor a 0' });

    const result = db
      .prepare(
        `INSERT INTO expenses(amount, category, description, date, is_small_expense, source)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(amount, category, description, date, isSmallExpense ? 1 : 0, source);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(expense);
  });

  app.get('/api/savings-goals', (_req, res) => {
    const goals = db
      .prepare(
        `SELECT g.*, COALESCE(SUM(c.amount), 0) AS saved_amount
         FROM savings_goals g
         LEFT JOIN savings_contributions c ON c.goal_id = g.id
         GROUP BY g.id
         ORDER BY g.created_at DESC`
      )
      .all();
    res.json(goals);
  });

  app.post('/api/savings-goals', (req, res) => {
    const { name, targetAmount, targetDate = null } = req.body || {};
    if (!name || !(targetAmount > 0)) return res.status(400).json({ error: 'name y targetAmount son obligatorios' });

    const result = db
      .prepare('INSERT INTO savings_goals(name, target_amount, target_date) VALUES (?, ?, ?)')
      .run(name, targetAmount, targetDate);

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(goal);
  });

  app.post('/api/savings-goals/:id/contributions', (req, res) => {
    const goalId = Number(req.params.id);
    const { amount, date = toISODate() } = req.body || {};

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(goalId);
    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });
    if (!(amount > 0)) return res.status(400).json({ error: 'amount debe ser mayor a 0' });

    const result = db.prepare('INSERT INTO savings_contributions(goal_id, amount, date) VALUES (?, ?, ?)').run(goalId, amount, date);
    const contribution = db.prepare('SELECT * FROM savings_contributions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contribution);
  });

  app.post('/api/bbva-notifications', (req, res) => {
    const { text, date = toISODate() } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text es obligatorio' });

    try {
      const parsed = parseBbvaNotification(text);
      const notificationResult = db
        .prepare('INSERT INTO bbva_notifications(raw_text, parsed_amount, parsed_description, date) VALUES (?, ?, ?, ?)')
        .run(text, parsed.amount, parsed.description, date);

      const expenseResult = db
        .prepare(
          `INSERT INTO expenses(amount, category, description, date, is_small_expense, source)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(parsed.amount, 'Compra', parsed.description, date, parsed.amount < 20000 ? 1 : 0, 'bbva_notification');

      res.status(201).json({
        notificationId: notificationResult.lastInsertRowid,
        expenseId: expenseResult.lastInsertRowid,
        ...parsed,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/reports', (req, res) => {
    const { period = 'month', referenceDate } = req.query;
    const range = getRangeByPeriod(period, referenceDate || new Date());

    const totalIncome = sumInRange(db, 'incomes', range.from, range.to);
    const totalExpenses = sumInRange(db, 'expenses', range.from, range.to);
    const totalSavingsContributions = sumInRange(db, 'savings_contributions', range.from, range.to);
    const budget = calculateBudgetByIncome(totalIncome);

    const expensesByCategory = db
      .prepare(
        `SELECT category, ROUND(SUM(amount), 2) AS total
         FROM expenses
         WHERE date BETWEEN ? AND ?
         GROUP BY category
         ORDER BY total DESC`
      )
      .all(range.from, range.to);

    res.json({
      period: range.period,
      from: range.from,
      to: range.to,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        savingsContributions: totalSavingsContributions,
        balance: Number((totalIncome - totalExpenses - totalSavingsContributions).toFixed(2)),
      },
      budget,
      expensesByCategory,
      fourPerThousandEstimated: Number((totalExpenses * 0.004).toFixed(2)),
    });
  });

  app.get('/api/4x1000', (req, res) => {
    const amount = Number(req.query.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'amount inválido' });
    }

    return res.json({ amount, fourPerThousand: Number((amount * 0.004).toFixed(2)) });
  });

  return app;
}

function createServer({ dbPath = path.join(__dirname, '..', 'data', 'finance.db') } = {}) {
  const db = initializeDatabase(dbPath);
  const app = createApp(db);
  return { app, db };
}

function startServer(port = Number(process.env.PORT) || 3000) {
  const { app } = createServer();
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API disponible en http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  createServer,
  startServer,
  parseBbvaNotification,
  calculateBudgetByIncome,
  getRangeByPeriod,
};
