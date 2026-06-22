export type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationPayload = {
  notifications: NotificationItem[]
  unreadCount: number
  totalCount: number
}
