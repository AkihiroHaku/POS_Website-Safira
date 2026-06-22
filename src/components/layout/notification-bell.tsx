'use client'

import { useCallback, useEffect, useState, useTransition } from "react"
import { Bell } from "lucide-react"
import { NotificationFeed } from "@/components/notifications/notification-feed"
import type { NotificationPayload } from "@/components/notifications/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { db, syncAllAutoNotifications } from "@/lib/db"

const PREVIEW_LIMIT = 5
const POLL_INTERVAL = 30000

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationPayload["notifications"]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const applyPayload = (payload: NotificationPayload) => {
    setNotifications(payload.notifications)
    setUnreadCount(payload.unreadCount)
    setTotalCount(payload.totalCount)
  }

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      await syncAllAutoNotifications()
      const [notifs, unread] = await Promise.all([
        db.notification.findMany(PREVIEW_LIMIT),
        db.notification.countUnread(),
      ])
      const mapped = notifs.slice(0, PREVIEW_LIMIT).map(n => ({
        ...n,
        isRead: n.isRead === 1,
      }))
      setNotifications(mapped)
      setUnreadCount(unread)
      setTotalCount(notifs.length)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()

    const intervalId = window.setInterval(() => {
      void loadNotifications()
    }, POLL_INTERVAL)

    return () => window.clearInterval(intervalId)
  }, [loadNotifications])

  const markAsRead = (id: string) => {
    startTransition(async () => {
      await db.notification.markRead(id)
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      )
      setUnreadCount((current) => Math.max(0, current - 1))
      await loadNotifications()
    })
  }

  const markAllAsRead = () => {
    startTransition(async () => {
      await db.notification.markAllRead()
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      )
      setUnreadCount(0)
      await loadNotifications()
    })
  }

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)

        if (open) {
          void loadNotifications()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur transition hover:-translate-y-0.5 themed-transition"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--foreground-soft)',
            boxShadow: 'var(--shadow-soft)',
          }}
          aria-label="Buka notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white shadow-[0_10px_20px_-12px_rgba(16,185,129,0.9)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
          <span
            className={cn(
              "absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 transition-opacity",
              unreadCount > 0 ? "opacity-100" : "opacity-0"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[calc(100vw-2rem)] max-w-[380px] rounded-[28px] border p-4 backdrop-blur-xl"
        style={{
          backgroundColor: 'var(--popover-bg)',
          borderColor: 'var(--popover-border)',
          boxShadow: 'var(--shadow-medium)',
        }}
      >
        <NotificationFeed
          notifications={notifications}
          unreadCount={unreadCount}
          totalCount={totalCount}
          compact
          isLoading={isLoading}
          isPending={isPending}
          onRefresh={() => void loadNotifications()}
          onMarkAllAsRead={markAllAsRead}
          onMarkAsRead={markAsRead}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
