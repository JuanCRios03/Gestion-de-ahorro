import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CHROME, CATEGORICAL } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';
import { formatCOP, formatShortCOP, formatDateShort } from '../lib/format';

function CustomTooltip({ active, payload, label, chrome }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{ backgroundColor: chrome.surface, borderColor: chrome.gridline, color: chrome.primaryInk }}
    >
      <p className="font-semibold">{formatDateShort(label)}</p>
      <p style={{ color: chrome.secondaryInk }}>{formatCOP(payload[0].value)}</p>
    </div>
  );
}

export default function DailyTrendChart({ data }) {
  const mode = useColorMode();
  const chrome = CHROME[mode];
  const brand = CATEGORICAL.blue[mode];

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ink-muted">
        Sin datos en este periodo
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={data.length > 20 ? '15%' : '30%'}>
          <CartesianGrid vertical={false} stroke={chrome.gridline} strokeDasharray="0" />
          <XAxis
            dataKey="fecha"
            tickFormatter={formatDateShort}
            tick={{ fill: chrome.mutedInk, fontSize: 11 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatShortCOP}
            tick={{ fill: chrome.mutedInk, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip chrome={chrome} />} cursor={{ fill: chrome.gridline, opacity: 0.5 }} />
          <Bar dataKey="total" fill={brand} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
