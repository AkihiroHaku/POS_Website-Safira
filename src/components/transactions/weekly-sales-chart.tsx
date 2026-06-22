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
import type { WeeklySalesPoint } from "@/components/transactions/types"

interface TransactionsWeeklySalesChartProps {
  data: WeeklySalesPoint[]
}

export function TransactionsWeeklySalesChart({
  data,
}: TransactionsWeeklySalesChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="transactionRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200/70 dark:stroke-slate-800/80"
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
          />
          <YAxis
            tickFormatter={(value) => `Rp${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-slate-500 dark:text-slate-400"
          />
          <Tooltip
            cursor={{ stroke: "#10b981", strokeOpacity: 0.3 }}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              background: "rgba(15, 23, 42, 0.96)",
              color: "#e2e8f0",
              boxShadow: "0 24px 48px -24px rgba(15, 23, 42, 0.9)",
            }}
            formatter={(value: number, name: string) => [
              name === "revenue"
                ? formatCurrency(value)
                : new Intl.NumberFormat("id-ID").format(value),
              name === "revenue" ? "Omzet" : "Transaksi",
            ]}
            labelFormatter={(label) => `Hari ${label}`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#transactionRevenueFill)"
            activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
