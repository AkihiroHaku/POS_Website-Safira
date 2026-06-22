'use client'

import { useCallback, useEffect, useState, useTransition } from "react"
import { BellRing } from "lucide-react"
import { NotificationFeed } from "@/components/notifications/notification-feed"
import type { NotificationItem } from "@/components/notifications/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

type NotificationsPageClientProps = {
  initialNotifications: NotificationItem[]
  initialUnreadCount: number
  initialTotalCount: number
}

const PAGE_LIMIT = 50
const PAGE_POLL_INTERVAL = 45000

export function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
  initialTotalCount,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const [notifs, unread] = await Promise.all([
        db.notification.findMany(PAGE_LIMIT),
        db.notification.countUnread(),
      ])
      const mapped: NotificationItem[] = notifs.map(n => ({ ...n, isRead: n.isRead === 1 }))
      setNotifications(mapped)
      setUnreadCount(unread)
      setTotalCount(notifs.length)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => void loadNotifications(), PAGE_POLL_INTERVAL)
    return () => window.clearInterval(intervalId)
  }, [loadNotifications])

  const markAsRead = (id: string) => {
    startTransition(async () => {
      await db.notification.markRead(id)
      setNotifications(current => current.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(current => Math.max(0, current - 1))
      await loadNotifications()
    })
  }

  const markAllAsRead = () => {
    startTransition(async () => {
      await db.notification.markAllRead()
      setNotifications(current => current.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      await loadNotifications()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      {/* ─── Feed Card ─── */}
      <Card
        className="rounded-[30px] border"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Aktivitas Notifikasi</CardTitle>
            <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Semua alert penting toko, dari stok menipis sampai transaksi baru, tersusun dari yang terbaru.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationFeed
            notifications={notifications}
            unreadCount={unreadCount}
            totalCount={totalCount}
            isLoading={isLoading}
            isPending={isPending}
            onRefresh={() => void loadNotifications()}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
          />
        </CardContent>
      </Card>

      {/* ─── Ringkasan Card ─── */}
      <Card
        className="rounded-[30px] border"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <CardHeader>
          <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Ringkasan</CardTitle>
          <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Gambaran cepat untuk admin dan kasir.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Belum Dibaca */}
          <div
            className="rounded-[24px] border p-4"
            style={{ borderColor: 'var(--color-emerald-border)', backgroundColor: 'var(--color-emerald-bg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Belum Dibaca
            </p>
            <p className="mt-3 text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>{unreadCount}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--foreground-soft)' }}>
              Prioritas utama yang sebaiknya dicek lebih dulu oleh admin.
            </p>
          </div>

          {/* Total Riwayat */}
          <div
            className="rounded-[24px] border p-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>
              Total Riwayat
            </p>
            <p className="mt-3 text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>{totalCount}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--foreground-soft)' }}>
              Riwayat notifikasi yang sudah tercatat untuk operasional toko.
            </p>
          </div>

          {/* Sistem notifikasi aktif */}
          <div
            className="rounded-[24px] border border-dashed p-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Sistem notifikasi aktif
                </p>
                <p className="mt-1 text-sm leading-6" style={{ color: 'var(--foreground-soft)' }}>
                  Bell di navbar akan menampilkan badge real-time, preview 5 notifikasi terbaru, dan sinkron otomatis dari transaksi, stok, serta produk baru.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
