import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { colorForSlot, CHROME } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';
import { formatCOP } from '../lib/format';

function CustomTooltip({ active, payload, chrome }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{ backgroundColor: chrome.surface, borderColor: chrome.gridline, color: chrome.primaryInk }}
    >
      <p className="font-semibold">{d.nombre}</p>
      <p style={{ color: chrome.secondaryInk }}>{formatCOP(d.total)}</p>
    </div>
  );
}

export default function CategoryPieChart({ data }) {
  const mode = useColorMode();
  const chrome = CHROME[mode];

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-muted">
        Sin datos en este periodo
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nombre"
              innerRadius="62%"
              outerRadius="98%"
              paddingAngle={2}
              cornerRadius={3}
              stroke={chrome.surface}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.categoriaId} fill={colorForSlot(entry.color, mode)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip chrome={chrome} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? (d.total / total) * 100 : 0;
          return (
            <li key={d.categoriaId} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorForSlot(d.color, mode) }}
              />
              <span className="flex-1 truncate text-ink-secondary dark:text-ink-secondary-dark">
                {d.nombre}
              </span>
              <span className="font-medium text-ink [font-variant-numeric:tabular-nums] dark:text-ink-dark">
                {formatCOP(d.total)}
              </span>
              <span className="w-10 text-right text-xs text-ink-muted [font-variant-numeric:tabular-nums]">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
