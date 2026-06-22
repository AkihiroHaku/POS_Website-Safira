// SQLite-compatible types (dates as ISO strings, not Date objects)
import type {
  Category,
  Product,
  StoreProfile,
  Transaction,
  TransactionItem,
} from '@/lib/db'

export type { Category, Product, StoreProfile, Transaction, TransactionItem }

export type ProductWithCategory = Product

export type CategoryWithCount = Category & {
  _count: {
    products: number
  }
}

export type StoreProfileExportPayload = Pick<
  StoreProfile,
  | 'storeName'
  | 'ownerName'
  | 'address'
  | 'phoneNumber'
  | 'whatsappNumber'
  | 'logoUrl'
  | 'receiptFooter'
  | 'businessType'
  | 'defaultTax'
  | 'defaultDiscount'
>

export type CartItem = {
  product: ProductWithCategory
  qtyPack: number
}

export type StockLog = {
  id: string
  productId: string
  type: string
  qty: number
  note: string | null
  createdAt: string
}

export type StockType = 'IN' | 'OUT'

export interface DashboardStats {
  totalProducts: number
  todayTransactions: number
  todayRevenue: number
  lowStockCount: number
}
