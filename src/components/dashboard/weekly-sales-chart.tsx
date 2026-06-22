'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface WeeklySalesChartProps {
  data: Array<{
    day: string
    revenue: number
  }>
}

export function WeeklySalesChart({ data }: WeeklySalesChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `Rp${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "#10b981", strokeOpacity: 0.3 }}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid var(--border)",
              background: "var(--popover-bg)",
              color: "var(--popover-text)",
              boxShadow: "var(--shadow-medium)",
            }}
            formatter={(value: number) => [formatCurrency(value), "Pendapatan"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#salesFill)"
            activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
