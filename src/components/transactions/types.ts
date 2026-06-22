export type TransactionStatus = "Selesai" | "Pending" | "Dibatalkan"
export type PaymentMethodLabel = "Tunai" | "QRIS" | "Transfer"
export type QuickFilter = "all" | "today" | "week" | "month"

export interface TransactionLineItem {
  id: string
  productName: string
  qtyPack: number
  totalWeightKg: number
  pricePerKg: number
  subtotal: number
}

export interface TransactionRecord {
  id: string
  invoiceNumber: string
  createdAt: string
  cashierName: string
  customerName: string
  itemCount: number
  total: number
  paidAmount: number
  changeAmount: number
  paymentMethod: PaymentMethodLabel
  status: TransactionStatus
  items: TransactionLineItem[]
}

export interface SummaryCardItem {
  title: string
  value: number
  format?: "currency" | "number"
  description: string
  trend?: "up" | "down" | "neutral"
  accent: "emerald" | "blue" | "amber" | "violet" | "rose"
}

export interface WeeklySalesPoint {
  day: string
  revenue: number
  transactions: number
}

export interface TopSellingProduct {
  id: string
  name: string
  quantitySold: number
}
