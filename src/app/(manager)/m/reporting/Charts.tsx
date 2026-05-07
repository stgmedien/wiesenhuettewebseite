"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLOR = "#2F4A35";
const COLOR_SOFT = "#5b8a64";
const COLORS = ["#2F4A35", "#a87d3a", "#5b8a64", "#bd9b5d", "#446d4f"];

const eur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

export function RevenueByMonth({
  data,
}: {
  data: { month: string; revenueCents: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C8CEC4" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${(v / 100 / 1000).toFixed(0)}k €`} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v) => eur(Number(v))}
          contentStyle={{ borderRadius: 8, border: "1px solid #C8CEC4" }}
        />
        <Bar dataKey="revenueCents" fill={COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OccupancyByMonth({
  data,
}: {
  data: { month: string; occupancyPct: number; nightsBooked: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C8CEC4" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(v) => `${Number(v).toFixed(1)} %`}
          contentStyle={{ borderRadius: 8, border: "1px solid #C8CEC4" }}
        />
        <Line
          type="monotone"
          dataKey="occupancyPct"
          stroke={COLOR}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLOR }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusBreakdown({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(props: { name?: string; value?: number }) =>
            `${props.name ?? ""} (${props.value ?? 0})`
          }
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CancellationRate({
  data,
}: {
  data: { month: string; cancellationPct: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C8CEC4" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v) => `${Number(v).toFixed(1)} %`} />
        <Bar dataKey="cancellationPct" fill={COLOR_SOFT} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
