'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  format?: "currency" | "number"
  description: string
  trend?: "up" | "down" | "neutral"
}

export function StatsCard({
  title,
  value,
  icon,
  format = "number",
  description,
  trend = "neutral",
}: StatsCardProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowRight

  return (
    <Card className="col-span-1 xl:col-span-2 transition-transform duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle
          className="text-sm font-medium"
          style={{ color: "var(--foreground-soft)" }}
        >
          {title}
        </CardTitle>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{
            borderColor: "rgba(16, 185, 129, 0.2)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          {typeof value === "number"
            ? format === "currency"
              ? formatCurrency(value)
              : new Intl.NumberFormat("id-ID").format(value)
            : value}
        </div>
        <p
          className="mt-3 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--foreground-muted)" }}
        >
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "opacity-40"
            )}
          />
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
