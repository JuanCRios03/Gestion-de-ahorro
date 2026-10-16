(function () {
  const { useEffect, useState } = React;

  function App() {
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [goals, setGoals] = useState([]);
    const [reportPeriod, setReportPeriod] = useState('month');
    const [report, setReport] = useState(null);
    const [fourInput, setFourInput] = useState('0');
    const [fourValue, setFourValue] = useState(0);
    const [selectedGoalId, setSelectedGoalId] = useState('');

    async function loadAll() {
      const [incomeRes, expenseRes, goalsRes] = await Promise.all([
        fetch('/api/incomes').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/savings-goals').then((r) => r.json()),
      ]);
      setIncomes(incomeRes);
      setExpenses(expenseRes);
      setGoals(goalsRes);
    }

    async function loadReport(period = reportPeriod) {
      const data = await fetch(`/api/reports?period=${period}`).then((r) => r.json());
      setReport(data);
    }

    useEffect(() => {
      loadAll();
      loadReport();
    }, []);

    async function submitJson(event, endpoint) {
      event.preventDefault();
      const form = new FormData(event.target);
      const payload = Object.fromEntries(form.entries());

      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });

      ['amount', 'targetAmount'].forEach((key) => {
        if (payload[key] !== undefined) payload[key] = Number(payload[key]);
      });
      payload.isSmallExpense = payload.isSmallExpense === 'on';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;

      event.target.reset();
      await loadAll();
      await loadReport();
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Registrar ingreso'),
        React.createElement(
          'form',
          { onSubmit: (e) => submitJson(e, '/api/incomes') },
          React.createElement('input', { name: 'source', placeholder: 'Fuente (salario, freelance...)', required: true }),
          React.createElement('input', { name: 'amount', type: 'number', step: '0.01', placeholder: 'Monto', required: true }),
          React.createElement('input', { name: 'date', type: 'date' }),
          React.createElement('button', { type: 'submit' }, 'Guardar ingreso')
        ),
        React.createElement(
          'ul',
          null,
          incomes.map((item) =>
            React.createElement('li', { key: `income-${item.id}` }, `${item.date} · ${item.source}: $${item.amount}`)
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Registrar gasto'),
        React.createElement(
          'form',
          { onSubmit: (e) => submitJson(e, '/api/expenses') },
          React.createElement('input', { name: 'category', placeholder: 'Categoría', required: true }),
          React.createElement('input', { name: 'description', placeholder: 'Descripción' }),
          React.createElement('input', { name: 'amount', type: 'number', step: '0.01', placeholder: 'Monto', required: true }),
          React.createElement('input', { name: 'date', type: 'date' }),
          React.createElement(
            'label',
            null,
            React.createElement('input', { name: 'isSmallExpense', type: 'checkbox' }),
            ' Gasto hormiga'
          ),
          React.createElement('button', { type: 'submit' }, 'Guardar gasto')
        ),
        React.createElement(
          'ul',
          null,
          expenses.map((item) =>
            React.createElement(
              'li',
              { key: `expense-${item.id}` },
              `${item.date} · ${item.category}: $${item.amount} `,
              item.is_small_expense ? React.createElement('span', { className: 'badge small' }, 'hormiga') : null,
              item.source === 'bbva_notification' ? React.createElement('span', { className: 'badge' }, 'BBVA') : null
            )
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Meta de ahorro'),
        React.createElement(
          'form',
          { onSubmit: (e) => submitJson(e, '/api/savings-goals') },
          React.createElement('input', { name: 'name', placeholder: 'Meta (viaje, fondo de emergencia...)', required: true }),
          React.createElement('input', { name: 'targetAmount', type: 'number', step: '0.01', placeholder: 'Monto meta', required: true }),
          React.createElement('input', { name: 'targetDate', type: 'date' }),
          React.createElement('button', { type: 'submit' }, 'Crear meta')
        ),
        React.createElement(
          'ul',
          null,
          goals.map((g) =>
            React.createElement(
              'li',
              { key: `goal-${g.id}` },
              `${g.name}: $${g.saved_amount} / $${g.target_amount}`
            )
          )
        ),
        React.createElement(
          'form',
          {
            onSubmit: async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const goalId = formData.get('goalId');
              const amount = Number(formData.get('amount'));
              if (!goalId || !(amount > 0)) return;

              await fetch(`/api/savings-goals/${goalId}/contributions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
              });
              e.target.reset();
              setSelectedGoalId('');
              await loadAll();
              await loadReport();
            },
          },
          React.createElement(
            'select',
            {
              name: 'goalId',
              value: selectedGoalId,
              onChange: (e) => setSelectedGoalId(e.target.value),
              required: true,
            },
            React.createElement('option', { value: '' }, 'Selecciona una meta'),
            goals.map((g) => React.createElement('option', { key: `goal-option-${g.id}`, value: g.id }, g.name))
          ),
          React.createElement('input', { name: 'amount', type: 'number', step: '0.01', placeholder: 'Aporte a meta', required: true }),
          React.createElement('button', { type: 'submit' }, 'Registrar aporte')
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Capturar compra desde notificación BBVA'),
        React.createElement(
          'form',
          {
            onSubmit: async (e) => {
              e.preventDefault();
              const text = new FormData(e.target).get('text');
              const response = await fetch('/api/bbva-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
              });
              if (!response.ok) return;
              e.target.reset();
              await loadAll();
              await loadReport();
            },
          },
          React.createElement('input', {
            name: 'text',
            placeholder: 'Ej: BBVA: Compra por $12.500 en TIENDA XYZ el 15/10',
            required: true,
          }),
          React.createElement('button', { type: 'submit' }, 'Capturar compra')
        )
      ),
      React.createElement(
        'section',
        { className: 'summary' },
        React.createElement('h2', null, 'Reportes y presupuesto según ingreso'),
        React.createElement(
          'select',
          {
            value: reportPeriod,
            onChange: async (e) => {
              setReportPeriod(e.target.value);
              await loadReport(e.target.value);
            },
          },
          React.createElement('option', { value: 'week' }, 'Semana'),
          React.createElement('option', { value: 'biweek' }, 'Quincena'),
          React.createElement('option', { value: 'month' }, 'Mes'),
          React.createElement('option', { value: 'quarter' }, 'Trimestre')
        ),
        report
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement('p', null, `Rango: ${report.from} a ${report.to}`),
              React.createElement('p', null, `Ingresos: $${report.totals.income}`),
              React.createElement('p', null, `Gastos: $${report.totals.expenses}`),
              React.createElement('p', null, `Ahorro registrado: $${report.totals.savingsContributions}`),
              React.createElement('p', null, `Balance: $${report.totals.balance}`),
              React.createElement('p', null, `Presupuesto recomendado (50/30/20):`),
              React.createElement('p', null, `Necesidades: $${report.budget.needs}`),
              React.createElement('p', null, `Deseos: $${report.budget.wants}`),
              React.createElement('p', null, `Ahorro: $${report.budget.savings}`),
              React.createElement('p', null, `4x1000 estimado por gastos del periodo: $${report.fourPerThousandEstimated}`),
              React.createElement(
                'ul',
                null,
                report.expensesByCategory.map((c) =>
                  React.createElement('li', { key: c.category }, `${c.category}: $${c.total}`)
                )
              )
            )
          : React.createElement('p', null, 'Cargando...')
      ),
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, 'Calculadora 4x1000'),
        React.createElement('input', {
          value: fourInput,
          onChange: (e) => setFourInput(e.target.value),
          placeholder: 'Monto base',
          type: 'number',
          step: '0.01',
        }),
        React.createElement(
          'button',
          {
            onClick: async () => {
              const result = await fetch(`/api/4x1000?amount=${encodeURIComponent(fourInput)}`).then((r) => r.json());
              setFourValue(result.fourPerThousand || 0);
            },
          },
          'Calcular'
        ),
        React.createElement('p', null, React.createElement('code', null, `4x1000 = $${fourValue}`))
      )
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
})();
