'use client'

import { cn, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import type { SummaryCardItem } from "@/components/transactions/types"

const accentStyles = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue:    "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  amber:   "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  violet:  "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  rose:    "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
} as const

interface SummaryCardsProps {
  items: SummaryCardItem[]
}

export function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      {items.map((item) => {
        const TrendIcon =
          item.trend === "up"
            ? ArrowUpRight
            : item.trend === "down"
              ? ArrowDownRight
              : ArrowRight

        return (
          <Card
            key={item.title}
            className="rounded-[28px] border backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
                  {item.title}
                </CardTitle>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                    accentStyles[item.accent]
                  )}
                >
                  Hari Ini
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                {item.format === "currency"
                  ? formatCurrency(item.value)
                  : new Intl.NumberFormat("id-ID").format(item.value)}
              </div>
              <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                <TrendIcon
                  className={cn(
                    "h-3.5 w-3.5",
                    item.trend === "up" && "text-emerald-500",
                    item.trend === "down" && "text-rose-500",
                    item.trend === "neutral" && "text-slate-400"
                  )}
                />
                {item.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
