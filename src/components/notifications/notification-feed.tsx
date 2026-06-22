'use client'

import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  CircleDollarSign,
  Loader2,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  X,
  ArrowLeft,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NotificationItem } from "@/components/notifications/types"
import Link from "next/link"

type NotificationFeedProps = {
  notifications: NotificationItem[]
  unreadCount: number
  totalCount: number
  compact?: boolean
  isLoading?: boolean
  isPending?: boolean
  onRefresh?: () => void
  onMarkAllAsRead: () => void
  onMarkAsRead: (id: string) => void
}

function getBaseType(type: string) {
  return type.split(":")[0]
}

function getNotificationAppearance(notification: NotificationItem) {
  const baseType = getBaseType(notification.type)
  switch (baseType) {
    case "LOW_STOCK":
      return {
        icon: AlertTriangle,
        iconClassName: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
        badgeClassName: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        label: notification.priority === "high" ? "Kritis" : "Stok Menipis",
        accentColor: "#ef4444",
      }
    case "NEW_TRANSACTION":
      return {
        icon: ReceiptText,
        iconClassName: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
        badgeClassName: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        label: "Transaksi Baru",
        accentColor: "#0ea5e9",
      }
    case "LARGE_TRANSACTION":
      return {
        icon: CircleDollarSign,
        iconClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
        badgeClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        label: "Penjualan Besar",
        accentColor: "#10b981",
      }
    case "DAILY_SUMMARY":
      return {
        icon: BellRing,
        iconClassName: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
        badgeClassName: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        label: "Ringkasan Harian",
        accentColor: "#8b5cf6",
      }
    case "PRODUCT_ADDED":
      return {
        icon: PackagePlus,
        iconClassName: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
        badgeClassName: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        label: "Produk Baru",
        accentColor: "#f59e0b",
      }
    default:
      return {
        icon: ShieldCheck,
        iconClassName: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        badgeClassName: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        label: "Sistem",
        accentColor: "#64748b",
      }
  }
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" })
  const abs = Math.abs(diffMinutes)
  if (abs < 60) return rtf.format(diffMinutes, "minute")
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour")
  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day")
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

/* ────────────────────────────────────────────────────────
   DETAIL PANEL (Gmail-style)
──────────────────────────────────────────────────────── */
function NotificationDetail({
  notification,
  onClose,
  onMarkAsRead,
  isPending,
}: {
  notification: NotificationItem
  onClose: () => void
  onMarkAsRead: (id: string) => void
  isPending: boolean
}) {
  const appearance = getNotificationAppearance(notification)
  const Icon = appearance.icon

  return (
    <div
      className="flex h-full flex-col rounded-[24px] border"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      {/* Detail header */}
      <div
        className="flex items-center justify-between gap-3 rounded-t-[24px] px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition hover:opacity-70"
          style={{ color: 'var(--foreground-muted)', backgroundColor: 'var(--surface-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        {!notification.isRead && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => onMarkAsRead(notification.id)}
            disabled={isPending}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Tandai dibaca
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        {/* Accent bar */}
        <div
          className="mb-5 h-1 w-16 rounded-full"
          style={{ backgroundColor: appearance.accentColor }}
        />

        {/* Badge row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", appearance.badgeClassName)}>
            {appearance.label}
          </span>
          {!notification.isRead && (
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white">
              Baru
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold leading-tight sm:text-2xl" style={{ color: 'var(--foreground)' }}>
          {notification.title}
        </h2>

        {/* Date */}
        <p className="mt-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
          {formatFullDate(notification.createdAt)}
        </p>

        {/* Divider */}
        <div className="my-5" style={{ borderTop: '1px solid var(--border)' }} />

        {/* Icon + message */}
        <div className="flex items-start gap-4">
          <div className={cn("mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", appearance.iconClassName)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-base leading-7" style={{ color: 'var(--foreground-soft)' }}>
              {notification.message}
            </p>

            {/* Extra metadata block */}
            <div
              className="mt-6 rounded-2xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--foreground-muted)' }}>
                Detail Notifikasi
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Tipe</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{appearance.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Prioritas</span>
                  <span className="font-medium capitalize" style={{ color: 'var(--foreground)' }}>{notification.priority}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Status</span>
                  <span className="font-medium" style={{ color: notification.isRead ? 'var(--foreground-muted)' : '#10b981' }}>
                    {notification.isRead ? "Sudah dibaca" : "Belum dibaca"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Waktu</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{formatRelativeTime(notification.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   MAIN FEED
──────────────────────────────────────────────────────── */
export function NotificationFeed({
  notifications,
  unreadCount,
  totalCount,
  compact = false,
  isLoading = false,
  isPending = false,
  onRefresh,
  onMarkAllAsRead,
  onMarkAsRead,
}: NotificationFeedProps) {
  const [selected, setSelected] = useState<NotificationItem | null>(null)

  function handleOpen(notification: NotificationItem) {
    setSelected(notification)
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  function handleClose() {
    setSelected(null)
  }

  /* Compact mode (navbar popover) — no detail panel */
  if (compact) {
    return (
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3 px-1 pb-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifikasi</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onMarkAllAsRead} disabled={unreadCount === 0 || isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tandai semua
          </Button>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {notifications.map((n) => {
            const appearance = getNotificationAppearance(n)
            const Icon = appearance.icon
            return (
              <div
                key={n.id}
                className="cursor-pointer rounded-[20px] border p-3 transition hover:scale-[1.01]"
                style={n.isRead
                  ? { borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }
                  : { borderColor: 'var(--color-emerald-border)', backgroundColor: 'var(--color-emerald-bg)' }
                }
                onClick={() => { if (!n.isRead) onMarkAsRead(n.id) }}
              >
                <div className="flex items-start gap-2">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", appearance.iconClassName)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{n.title}</p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--foreground-muted)' }}>{n.message}</p>
                  </div>
                  {!n.isRead && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500 mt-1" />}
                </div>
              </div>
            )
          })}
        </div>

        {totalCount > 0 && (
          <Button asChild variant="outline" className="mt-4 w-full rounded-2xl">
            <Link href="/notifications">Lihat semua notifikasi</Link>
          </Button>
        )}
      </div>
    )
  }

  /* ── Full-page mode: Gmail-style split view ── */
  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-start justify-between gap-3 pb-5">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifikasi</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onMarkAllAsRead} disabled={unreadCount === 0 || isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tandai semua
          </Button>
        </div>
      </div>

      {/* Split view */}
      {notifications.length === 0 ? (
        <div
          className="rounded-[24px] border border-dashed px-4 py-8 text-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--foreground-muted)' }}>
            <BellRing className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Tidak ada notifikasi baru</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            Aktivitas toko penting akan muncul di sini secara otomatis.
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-3 transition-all", selected ? "lg:grid-cols-[380px_1fr]" : "grid-cols-1")}>
          {/* ── Left: notification list ── */}
          <div className="space-y-2">
            {notifications.map((notification) => {
              const appearance = getNotificationAppearance(notification)
              const Icon = appearance.icon
              const isSelected = selected?.id === notification.id

              return (
                <div
                  key={notification.id}
                  onClick={() => handleOpen(notification)}
                  className={cn(
                    "group cursor-pointer rounded-[20px] border p-4 transition-all duration-200 hover:shadow-md",
                    isSelected && "ring-2 ring-emerald-500/40",
                    !notification.isRead && "font-medium"
                  )}
                  style={
                    isSelected
                      ? { borderColor: 'var(--color-emerald-border)', backgroundColor: 'var(--color-emerald-bg)' }
                      : notification.isRead
                        ? { borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }
                        : { borderColor: 'var(--color-emerald-border)', backgroundColor: 'var(--color-emerald-bg)' }
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", appearance.iconClassName)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("truncate text-sm", notification.isRead ? "font-medium" : "font-semibold")} style={{ color: 'var(--foreground)' }}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-[11px]" style={{ color: 'var(--foreground-muted)' }}>
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Right: detail panel ── */}
          {selected && (
            <div className="sticky top-4 max-h-[600px]">
              <NotificationDetail
                notification={selected}
                onClose={handleClose}
                onMarkAsRead={onMarkAsRead}
                isPending={isPending}
              />
            </div>
          )}
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Memperbarui status notifikasi...
        </div>
      )}
    </div>
  )
}
