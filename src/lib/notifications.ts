import { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

type DbClient = PrismaClient | Prisma.TransactionClient

type NotificationPriority = "high" | "medium" | "low"

const LARGE_TRANSACTION_THRESHOLD = 1_000_000

function getTodayRange() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function getWeekKey(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start.toISOString().slice(0, 10)
}

function invoiceNumberFromTransaction(id: string, createdAt: Date) {
  const date = createdAt.toISOString().slice(0, 10).replace(/-/g, "")
  return `INV-${date}-${id.slice(-5).toUpperCase()}`
}

function buildType(baseType: string, reference: string) {
  return `${baseType}:${reference}`
}

function normalizePaymentMethod(method: string) {
  switch (method.toLowerCase()) {
    case "qris":
      return "QRIS"
    case "transfer":
      return "Transfer"
    default:
      return "Tunai"
  }
}

async function syncNotification(
  db: DbClient,
  input: {
    type: string
    title: string
    message: string
    priority: NotificationPriority
    resetReadOnUpdate?: boolean
  }
) {
  const existing = await db.notification.findUnique({
    where: { type: input.type },
    select: {
      id: true,
      title: true,
      message: true,
      priority: true,
      isRead: true,
    },
  })

  if (!existing) {
    return db.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority,
      },
    })
  }

  const hasChanged =
    existing.title !== input.title ||
    existing.message !== input.message ||
    existing.priority !== input.priority

  if (!hasChanged) {
    return existing
  }

  return db.notification.update({
    where: { type: input.type },
    data: {
      title: input.title,
      message: input.message,
      priority: input.priority,
      ...(input.resetReadOnUpdate ? { isRead: false } : {}),
    },
  })
}

async function createNotificationIfMissing(
  db: DbClient,
  input: {
    type: string
    title: string
    message: string
    priority: NotificationPriority
  }
) {
  const existing = await db.notification.findUnique({
    where: { type: input.type },
    select: { id: true },
  })

  if (existing) {
    return existing
  }

  return db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      priority: input.priority,
    },
  })
}

export async function createProductAddedNotification(db: DbClient, product: { id: string; name: string }) {
  await createNotificationIfMissing(db, {
    type: buildType("PRODUCT_ADDED", product.id),
    title: "Produk baru ditambahkan",
    message: `Produk baru "${product.name}" berhasil ditambahkan ke inventaris toko.`,
    priority: "low",
  })
}

export async function createTransactionNotifications(
  db: DbClient,
  transaction: { id: string; total: number; createdAt: Date; paymentMethod: string }
) {
  const invoiceNumber = invoiceNumberFromTransaction(transaction.id, transaction.createdAt)

  await createNotificationIfMissing(db, {
    type: buildType("NEW_TRANSACTION", transaction.id),
    title: "Transaksi baru berhasil",
    message: `Transaksi baru berhasil: ${invoiceNumber} via ${normalizePaymentMethod(transaction.paymentMethod)}.`,
    priority: "medium",
  })

  if (transaction.total > LARGE_TRANSACTION_THRESHOLD) {
    await createNotificationIfMissing(db, {
      type: buildType("LARGE_TRANSACTION", transaction.id),
      title: "Penjualan besar terdeteksi",
      message: `Penjualan besar ${formatCurrency(transaction.total)} berhasil dicatat pada ${invoiceNumber}.`,
      priority: "high",
    })
  }
}

export async function syncLowStockNotifications(db: DbClient = prisma) {
  const [lowStockProducts, existingLowStockNotifications] = await Promise.all([
    db.product.findMany({
      where: { stockPack: { lte: 5 } },
      select: {
        id: true,
        name: true,
        stockPack: true,
        unit: true,
      },
      orderBy: [{ stockPack: "asc" }, { name: "asc" }],
    }),
    db.notification.findMany({
      where: {
        type: {
          startsWith: "LOW_STOCK:",
        },
      },
      select: {
        id: true,
        type: true,
      },
    }),
  ])

  const activeTypes = new Set(lowStockProducts.map((product) => buildType("LOW_STOCK", product.id)))
  const staleTypes = existingLowStockNotifications
    .filter((notification) => !activeTypes.has(notification.type))
    .map((notification) => notification.type)

  if (staleTypes.length > 0) {
    await db.notification.deleteMany({
      where: {
        type: {
          in: staleTypes,
        },
      },
    })
  }

  for (const product of lowStockProducts) {
    await syncNotification(db, {
      type: buildType("LOW_STOCK", product.id),
      title: "Stok menipis",
      message: `Stok ${product.name} tinggal ${product.stockPack} ${product.unit ?? "pack"}.`,
      priority: product.stockPack <= 2 ? "high" : "medium",
      resetReadOnUpdate: true,
    })
  }
}

export async function ensureDailySummaryNotification(db: DbClient = prisma) {
  const { start, end } = getTodayRange()
  const dayKey = start.toISOString().slice(0, 10)
  const type = buildType("DAILY_SUMMARY", dayKey)

  const revenueResult = await db.transaction.aggregate({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      total: true,
    },
  })

  const revenue = revenueResult._sum.total ?? 0

  await syncNotification(db, {
    type,
    title: "Ringkasan harian",
    message: `Pendapatan hari ini mencapai ${formatCurrency(revenue)}.`,
    priority: "medium",
  })
}

export async function ensureSystemReminderNotification(db: DbClient = prisma) {
  const today = new Date()
  const type = buildType("SYSTEM_REMINDER", getWeekKey(today))

  await syncNotification(db, {
    type,
    title: "Pengingat sistem",
    message: "Backup data mingguan disarankan hari ini untuk menjaga keamanan data toko.",
    priority: "low",
  })
}

export async function ensureAutoNotifications(db: DbClient = prisma) {
  await syncLowStockNotifications(db)
  await ensureDailySummaryNotification(db)
  await ensureSystemReminderNotification(db)
}
