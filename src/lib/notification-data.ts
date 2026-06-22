import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ensureAutoNotifications } from "@/lib/notifications"

export const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect
}>

export async function getNotificationPayload(limit = 5) {
  await ensureAutoNotifications()

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 5

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      select: notificationSelect,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: safeLimit,
    }),
    prisma.notification.count({
      where: {
        isRead: false,
      },
    }),
    prisma.notification.count(),
  ])

  return {
    notifications,
    unreadCount,
    totalCount,
  }
}
