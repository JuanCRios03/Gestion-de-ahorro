import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CHROME, CATEGORICAL } from '../theme/palette';
import { useColorMode } from '../lib/useColorMode';
import { formatCOP, formatShortCOP, capitalize } from '../lib/format';

function CustomTooltip({ active, payload, chrome }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{ backgroundColor: chrome.surface, borderColor: chrome.gridline, color: chrome.primaryInk }}
    >
      <p className="font-semibold">{capitalize(d.label)}</p>
      <p style={{ color: chrome.secondaryInk }}>{formatCOP(d.total)}</p>
    </div>
  );
}

export default function QuarterMonthChart({ meses }) {
  const mode = useColorMode();
  const chrome = CHROME[mode];
  const brand = CATEGORICAL.blue[mode];

  const data = meses.map((m) => ({ ...m, shortLabel: capitalize(m.label.split(' de')[0]) }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke={chrome.gridline} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: chrome.mutedInk, fontSize: 12 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatShortCOP}
            tick={{ fill: chrome.mutedInk, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip chrome={chrome} />} cursor={{ fill: chrome.gridline, opacity: 0.5 }} />
          <Bar dataKey="total" fill={brand} radius={[4, 4, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
