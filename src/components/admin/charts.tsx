"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const C = {
  primary: "#b3234f",
  magenta: "#c8336b",
  orange: "#ff9a3d",
  grid: "#f0e0e3",
  text: "#756568",
  hover: "#fdeff1",
};

const ghs = (v: unknown) =>
  `GHS ${Number(v ?? 0).toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;

const tooltipStyle = {
  borderRadius: 12,
  border: `1px solid ${C.grid}`,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 12,
};

const axisTick = { fontSize: 12, fill: C.text };
const compact = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function MonthlyRevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  const empty = data.every((d) => d.revenue === 0);
  return (
    <div className="h-72 w-full">
      {empty ? (
        <Empty text="No paid orders yet" />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.grid} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={compact} width={44} />
            <Tooltip
              cursor={{ fill: C.hover }}
              contentStyle={tooltipStyle}
              formatter={(v) => [ghs(v), "Revenue"]}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={d.label} fill={i === data.length - 1 ? C.orange : C.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DailyRevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  const empty = data.every((d) => d.revenue === 0);
  return (
    <div className="h-72 w-full">
      {empty ? (
        <Empty text="No paid orders in the last 30 days" />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={C.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              interval={4}
            />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={compact} width={44} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [ghs(v), "Revenue"]} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={C.primary}
              strokeWidth={2.5}
              fill="url(#dailyFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function RevenueSplitChart({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((s, d) => s + d.value, 0);
  const colors = [C.primary, C.orange, C.magenta];

  if (rows.length === 0) {
    return (
      <div className="h-56">
        <Empty text="No paid orders yet" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={3}
              stroke="none"
            >
              {rows.map((r, i) => (
                <Cell key={r.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => ghs(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              {r.name}
            </span>
            <span className="text-muted-foreground">
              {ghs(r.value)} · {Math.round((r.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopProductsChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <div className="h-72 w-full">
      {data.length === 0 ? (
        <Empty text="No shop sales yet" />
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <Tooltip
              cursor={{ fill: C.hover }}
              contentStyle={tooltipStyle}
              formatter={(v) => [ghs(v), "Revenue"]}
            />
            <Bar dataKey="revenue" fill={C.primary} radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
