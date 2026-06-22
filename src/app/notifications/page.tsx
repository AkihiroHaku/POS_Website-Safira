'use client'

import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { NotificationsPageClient } from '@/components/notifications/notifications-page-client'
import { BackButton } from '@/components/ui/back-button'
import { db, type Notification, syncAllAutoNotifications } from '@/lib/db'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        await syncAllAutoNotifications()
        const [notifs, unread] = await Promise.all([
          db.notification.findMany(50),
          db.notification.countUnread(),
        ])
        setNotifications(notifs)
        setUnreadCount(unread)
        setTotalCount(notifs.length)
      } catch (err) {
        console.error('Notifications load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const mappedNotifications = notifications.map(n => ({
    ...n,
    isRead: n.isRead === 1,
  }))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8">
      {/* Hero section */}
      <section
        className="overflow-hidden rounded-[32px] border p-5 backdrop-blur-xl sm:p-7"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(16,185,129,0.10)', color: 'var(--color-emerald-icon)' }}
            >
              <BellRing className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--foreground)' }}>
              Notifikasi Operasional
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base" style={{ color: 'var(--foreground-soft)' }}>
              Pantau semua alert penting toko dalam satu halaman, mulai dari stok menipis, transaksi baru, sampai pengingat sistem.
            </p>
          </div>
          <BackButton fallbackHref="/" />
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="space-y-3 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Memuat notifikasi...</p>
          </div>
        </div>
      ) : (
        <NotificationsPageClient
          initialNotifications={mappedNotifications}
          initialUnreadCount={unreadCount}
          initialTotalCount={totalCount}
        />
      )}
    </div>
  )
}
