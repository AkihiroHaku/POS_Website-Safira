/**
 * db.ts — Database abstraction layer
 *
 * Di Android: pakai @capacitor-community/sqlite (native SQLite)
 * Di browser/dev: pakai sql.js langsung (WebAssembly) via db-web.ts
 *
 * API interface mirip Prisma agar migrasi minimal.
 */

import { Capacitor } from '@capacitor/core'
import { formatCurrency } from './utils'

// ─────────────────────────────────────────────
// Unified DB interface (subset yang dipakai)
// ─────────────────────────────────────────────

interface DBAdapter {
  query<T>(sql: string, params?: unknown[]): Promise<{ values: T[] }>
  run(sql: string, params?: unknown[]): Promise<void>
  execute(sql: string): Promise<void>
  executeSet(statements: Array<{ statement: string; values?: unknown[] }>): Promise<void>
}

// ─────────────────────────────────────────────
// SQLite connection singleton
// ─────────────────────────────────────────────

let _adapter: DBAdapter | null = null
let _initPromise: Promise<DBAdapter> | null = null

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export async function getDb(): Promise<DBAdapter> {
  if (_adapter) return _adapter
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const platform = Capacitor.getPlatform()

    if (platform === 'web') {
      // ── Browser: gunakan sql.js langsung (tanpa Capacitor/jeep-sqlite) ──
      const { getWebDb } = await import('./db-web')
      const webDb = await getWebDb()

      // Bungkus agar sesuai interface DBAdapter
      const adapter: DBAdapter = {
        query: <T>(sql: string, params?: unknown[]) =>
          webDb.query<T>(sql, params) as Promise<{ values: T[] }>,
        run: (sql: string, params?: unknown[]) => webDb.run(sql, params),
        execute: (sql: string) => webDb.execute(sql),
        executeSet: (statements) => webDb.executeSet(statements),
      }
      await initSchema(adapter)
      _adapter = adapter
      return adapter
    } else {
      // ── Android/iOS: gunakan Capacitor SQLite native ──
      const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
      const sqlite = new SQLiteConnection(CapacitorSQLite)
      const conn = await sqlite.createConnection('kasir_umkm', false, 'no-encryption', 1, false)
      await conn.open()

      const adapter: DBAdapter = {
        query: async <T>(sql: string, params?: unknown[]) => {
          const result = await conn.query(sql, params as (string | number | null)[])
          return { values: (result.values ?? []) as T[] }
        },
        run: async (sql: string, params?: unknown[]) => {
          await conn.run(sql, params as (string | number | null)[])
        },
        execute: async (sql: string) => {
          await conn.execute(sql)
        },
        executeSet: async (statements) => {
          await conn.executeSet(
            statements.map(s => ({ statement: s.statement, values: (s.values ?? []) as (string | number | null)[] }))
          )
        },
      }
      await initSchema(adapter)
      _adapter = adapter
      return adapter
    }
  })()

  return _initPromise
}

// ─────────────────────────────────────────────

export type Category = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  name: string
  categoryId: string | null
  purchasePrice: number | null
  sellingPricePerKg: number
  weightPerPack: number
  stockPack: number
  unit: string | null
  supplier: string | null
  createdAt: string
  updatedAt: string
  category?: Category | null
}

export type Transaction = {
  id: string
  total: number
  paymentMethod: string
  paidAmount: number
  changeAmount: number
  createdAt: string
  items?: TransactionItem[]
}

export type TransactionItem = {
  id: string
  transactionId: string
  productId: string
  qtyPack: number
  totalWeightKg: number
  pricePerKg: number
  subtotal: number
  product?: Pick<Product, 'id' | 'name' | 'purchasePrice'>
}

export type StoreProfile = {
  id: string
  storeName: string
  ownerName: string | null
  address: string | null
  phoneNumber: string | null
  whatsappNumber: string | null
  logoUrl: string | null
  receiptFooter: string | null
  defaultTax: number | null
  defaultDiscount: number | null
  businessType: string | null
  createdAt: string
  updatedAt: string
}

export type Notification = {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: number // 0 or 1 in SQLite
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// Schema initialization
// ─────────────────────────────────────────────

async function initSchema(db: DBAdapter): Promise<void> {
  // sql.js tidak support multiple statements dalam satu execute,
  // jadi kita eksekusi per statement
  const statements = [
    'PRAGMA foreign_keys=ON',
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS store_profiles (
      id TEXT PRIMARY KEY,
      storeName TEXT NOT NULL,
      ownerName TEXT,
      address TEXT,
      phoneNumber TEXT,
      whatsappNumber TEXT,
      logoUrl TEXT,
      receiptFooter TEXT,
      defaultTax REAL DEFAULT 0,
      defaultDiscount REAL DEFAULT 0,
      businessType TEXT DEFAULT 'Sembako',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT,
      purchasePrice REAL,
      sellingPricePerKg REAL NOT NULL,
      weightPerPack REAL NOT NULL DEFAULT 1,
      stockPack INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'pack',
      supplier TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      total REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      paidAmount REAL NOT NULL,
      changeAmount REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transactionId TEXT NOT NULL,
      productId TEXT NOT NULL,
      qtyPack INTEGER NOT NULL,
      totalWeightKg REAL NOT NULL,
      pricePerKg REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stock_logs (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      type TEXT NOT NULL,
      qty INTEGER NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL UNIQUE,
      priority TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead, createdAt)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stockPack)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(createdAt)',
  ]

  for (const sql of statements) {
    await db.execute(sql)
  }
}

// ─────────────────────────────────────────────
// Helper: run query and return rows
// ─────────────────────────────────────────────

async function query<T>(sql: string, params: (string | number | null)[] = []): Promise<T[]> {
  const db = await getDb()
  const result = await db.query<T>(sql, params)
  return result.values ?? []
}

async function run(sql: string, params: (string | number | null)[] = []): Promise<void> {
  const db = await getDb()
  await db.run(sql, params)
}


// ─────────────────────────────────────────────
// Category operations
// ─────────────────────────────────────────────

async function categoryFindMany(): Promise<(Category & { _count: { products: number } })[]> {
  const rows = await query<Category & { productCount: number }>(`
    SELECT c.*, COUNT(p.id) as productCount
    FROM categories c
    LEFT JOIN products p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `)
  return rows.map(r => ({ ...r, _count: { products: r.productCount } }))
}

async function categoryFindUnique(id: string): Promise<Category | null> {
  const rows = await query<Category>('SELECT * FROM categories WHERE id = ?', [id])
  return rows[0] ?? null
}

async function categoryFindByName(name: string): Promise<Category | null> {
  const rows = await query<Category>('SELECT * FROM categories WHERE name = ?', [name])
  return rows[0] ?? null
}

async function categoryCreate(data: { name: string; description?: string | null }): Promise<Category> {
  const id = generateId()
  const ts = now()
  await run(
    'INSERT INTO categories (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.description ?? null, ts, ts]
  )
  return { id, name: data.name, description: data.description ?? null, createdAt: ts, updatedAt: ts }
}

async function categoryUpdate(id: string, data: { name?: string; description?: string | null }): Promise<Category> {
  const ts = now()
  const fields: string[] = []
  const params: (string | null)[] = []
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description ?? null) }
  fields.push('updatedAt = ?'); params.push(ts)
  params.push(id)
  await run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params)
  const updated = await categoryFindUnique(id)
  return updated!
}

async function categoryDelete(id: string): Promise<void> {
  await run('DELETE FROM categories WHERE id = ?', [id])
}

// ─────────────────────────────────────────────
// Product operations
// ─────────────────────────────────────────────

interface ProductFindManyOptions {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
  orderBy?: string
}

async function productFindMany(options: ProductFindManyOptions = {}): Promise<{ products: Product[]; total: number }> {
  const { search = '', categoryId = '', page = 1, limit = 10 } = options
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (search) {
    conditions.push('(p.name LIKE ? OR p.supplier LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (categoryId) {
    conditions.push('p.categoryId = ?')
    params.push(categoryId)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRows = await query<{ total: number }>(`SELECT COUNT(*) as total FROM products p ${where}`, params)
  const total = countRows[0]?.total ?? 0

  const offset = (page - 1) * limit
  const rows = await query<Product & { categoryName?: string; categoryDescription?: string }>(`
    SELECT p.*, c.name as categoryName, c.description as categoryDescription
    FROM products p
    LEFT JOIN categories c ON c.id = p.categoryId
    ${where}
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset])

  const products = rows.map(r => ({
    ...r,
    category: r.categoryName ? {
      id: r.categoryId!,
      name: r.categoryName,
      description: r.categoryDescription ?? null,
      createdAt: '',
      updatedAt: '',
    } : null,
  }))

  return { products, total }
}

async function productFindUnique(id: string): Promise<Product | null> {
  const rows = await query<Product & { categoryName?: string }>(`
    SELECT p.*, c.name as categoryName
    FROM products p
    LEFT JOIN categories c ON c.id = p.categoryId
    WHERE p.id = ?
  `, [id])
  if (!rows[0]) return null
  const r = rows[0]
  return {
    ...r,
    category: r.categoryName ? { id: r.categoryId!, name: r.categoryName, description: null, createdAt: '', updatedAt: '' } : null,
  }
}

async function productFindAll(): Promise<Product[]> {
  return query<Product>(`
    SELECT p.*, c.name as categoryName
    FROM products p
    LEFT JOIN categories c ON c.id = p.categoryId
    ORDER BY p.name ASC
  `)
}

interface ProductCreateData {
  name: string
  categoryId?: string | null
  purchasePrice?: number | null
  sellingPricePerKg: number
  weightPerPack?: number
  stockPack?: number
  unit?: string | null
  supplier?: string | null
}

async function productCreate(data: ProductCreateData): Promise<Product> {
  const id = generateId()
  const ts = now()
  await run(
    `INSERT INTO products (id, name, categoryId, purchasePrice, sellingPricePerKg, weightPerPack, stockPack, unit, supplier, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.categoryId ?? null, data.purchasePrice ?? null,
     data.sellingPricePerKg, data.weightPerPack ?? 1, data.stockPack ?? 0,
     data.unit ?? 'pack', data.supplier ?? null, ts, ts]
  )
  return productFindUnique(id) as Promise<Product>
}

async function productUpdate(id: string, data: Partial<ProductCreateData & { stockPack: number }>): Promise<Product> {
  const ts = now()
  const fields: string[] = []
  const params: (string | number | null)[] = []

  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
  if (data.categoryId !== undefined) { fields.push('categoryId = ?'); params.push(data.categoryId ?? null) }
  if (data.purchasePrice !== undefined) { fields.push('purchasePrice = ?'); params.push(data.purchasePrice ?? null) }
  if (data.sellingPricePerKg !== undefined) { fields.push('sellingPricePerKg = ?'); params.push(data.sellingPricePerKg) }
  if (data.weightPerPack !== undefined) { fields.push('weightPerPack = ?'); params.push(data.weightPerPack) }
  if (data.stockPack !== undefined) { fields.push('stockPack = ?'); params.push(data.stockPack) }
  if (data.unit !== undefined) { fields.push('unit = ?'); params.push(data.unit ?? null) }
  if (data.supplier !== undefined) { fields.push('supplier = ?'); params.push(data.supplier ?? null) }

  fields.push('updatedAt = ?'); params.push(ts)
  params.push(id)

  await run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params)
  return productFindUnique(id) as Promise<Product>
}

async function productDelete(id: string): Promise<void> {
  // Check if product has transactions
  const items = await query<{ id: string }>('SELECT id FROM transaction_items WHERE productId = ? LIMIT 1', [id])
  if (items.length > 0) {
    throw new Error('Produk tidak bisa dihapus karena sudah digunakan dalam transaksi.')
  }
  await run('DELETE FROM products WHERE id = ?', [id])
}

// ─────────────────────────────────────────────
// Transaction operations
// ─────────────────────────────────────────────

interface CartItem {
  product: {
    id: string
    sellingPricePerKg: number
    weightPerPack: number
    stockPack: number
  }
  qtyPack: number
}

async function transactionCreate(cart: CartItem[], paidAmount: number): Promise<Transaction> {
  const db = await getDb()

  // Validate stock
  let total = 0
  const productIds = cart.map(i => i.product.id)
  const placeholders = productIds.map(() => '?').join(',')
  const dbProducts = await query<Product>(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds)
  const productMap = new Map(dbProducts.map(p => [p.id, p]))

  for (const item of cart) {
    const p = productMap.get(item.product.id)
    if (!p) throw new Error(`Produk tidak ditemukan: ${item.product.id}`)
    if (item.qtyPack > p.stockPack) throw new Error(`Stok "${p.name}" tidak cukup`)
    total += item.qtyPack * p.weightPerPack * p.sellingPricePerKg
  }

  if (paidAmount < total) throw new Error('Jumlah bayar belum cukup')

  const transactionId = generateId()
  const ts = now()
  const changeAmount = paidAmount - total

  // Execute as a batch (SQLite doesn't have BEGIN/COMMIT in the same way)
  const statements = []

  statements.push({
    statement: `INSERT INTO transactions (id, total, paymentMethod, paidAmount, changeAmount, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    values: [transactionId, total, 'cash', paidAmount, changeAmount, ts],
  })

  for (const item of cart) {
    const p = productMap.get(item.product.id)!
    const totalWeightKg = item.qtyPack * p.weightPerPack
    const subtotal = totalWeightKg * p.sellingPricePerKg
    const itemId = generateId()

    statements.push({
      statement: `INSERT INTO transaction_items (id, transactionId, productId, qtyPack, totalWeightKg, pricePerKg, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values: [itemId, transactionId, p.id, item.qtyPack, totalWeightKg, p.sellingPricePerKg, subtotal],
    })

    statements.push({
      statement: `UPDATE products SET stockPack = stockPack - ?, updatedAt = ? WHERE id = ?`,
      values: [item.qtyPack, ts, p.id],
    })
  }

  await db.executeSet(statements)

  // Sync notifications after checkout
  await syncNotificationsAfterTransaction({ id: transactionId, total, createdAt: ts, paymentMethod: 'cash' })

  return {
    id: transactionId,
    total,
    paymentMethod: 'cash',
    paidAmount,
    changeAmount,
    createdAt: ts,
  }
}

async function transactionFindMany(options: { startDate?: string; endDate?: string } = {}): Promise<Transaction[]> {
  let sql = `
    SELECT t.*, 
      (SELECT json_group_array(json_object(
        'id', ti.id, 'productId', ti.productId, 'qtyPack', ti.qtyPack,
        'totalWeightKg', ti.totalWeightKg, 'pricePerKg', ti.pricePerKg,
        'subtotal', ti.subtotal, 'productName', p.name, 'purchasePrice', p.purchasePrice
      )) FROM transaction_items ti LEFT JOIN products p ON p.id = ti.productId WHERE ti.transactionId = t.id) as itemsJson
    FROM transactions t
  `
  const params: string[] = []

  if (options.startDate && options.endDate) {
    sql += ' WHERE t.createdAt >= ? AND t.createdAt <= ?'
    params.push(options.startDate, options.endDate)
  }

  sql += ' ORDER BY t.createdAt DESC'

  const rows = await query<Transaction & { itemsJson: string }>(sql, params)
  return rows.map(r => ({
    ...r,
    items: r.itemsJson ? JSON.parse(r.itemsJson) : [],
  }))
}

// ─────────────────────────────────────────────
// StoreProfile operations
// ─────────────────────────────────────────────

const DEFAULT_STORE_PROFILE = {
  storeName: 'Kasir Toko Safina',
  ownerName: 'Pemilik Toko',
  address: 'Alamat toko belum diatur',
  phoneNumber: '',
  whatsappNumber: '',
  logoUrl: null,
  receiptFooter: 'Terima kasih sudah berbelanja di toko kami.',
  defaultTax: 0,
  defaultDiscount: 0,
  businessType: 'Sembako',
}

async function storeProfileFindFirst(): Promise<StoreProfile> {
  const rows = await query<StoreProfile>('SELECT * FROM store_profiles ORDER BY createdAt ASC LIMIT 1')
  if (rows[0]) return rows[0]

  // Create default
  const id = generateId()
  const ts = now()
  const d = DEFAULT_STORE_PROFILE
  await run(
    `INSERT INTO store_profiles (id, storeName, ownerName, address, phoneNumber, whatsappNumber, logoUrl, receiptFooter, defaultTax, defaultDiscount, businessType, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, d.storeName, d.ownerName, d.address, d.phoneNumber, d.whatsappNumber,
     d.logoUrl, d.receiptFooter, d.defaultTax, d.defaultDiscount, d.businessType, ts, ts]
  )
  return { id, ...d, createdAt: ts, updatedAt: ts }
}

async function storeProfileUpdate(id: string, data: Partial<Omit<StoreProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StoreProfile> {
  const ts = now()
  const fields: string[] = []
  const params: (string | number | null)[] = []

  const keys = ['storeName', 'ownerName', 'address', 'phoneNumber', 'whatsappNumber', 'logoUrl', 'receiptFooter', 'defaultTax', 'defaultDiscount', 'businessType'] as const
  for (const key of keys) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(data[key] as string | number | null)
    }
  }

  fields.push('updatedAt = ?'); params.push(ts)
  params.push(id)
  await run(`UPDATE store_profiles SET ${fields.join(', ')} WHERE id = ?`, params)

  const rows = await query<StoreProfile>('SELECT * FROM store_profiles WHERE id = ?', [id])
  return rows[0]!
}

// ─────────────────────────────────────────────
// Notification operations
// ─────────────────────────────────────────────

async function notificationFindMany(limit = 50): Promise<Notification[]> {
  return query<Notification>(
    'SELECT * FROM notifications ORDER BY updatedAt DESC, createdAt DESC LIMIT ?',
    [limit]
  )
}

async function notificationCountUnread(): Promise<number> {
  const rows = await query<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE isRead = 0')
  return rows[0]?.count ?? 0
}

async function notificationFindByType(type: string): Promise<Notification | null> {
  const rows = await query<Notification>('SELECT * FROM notifications WHERE type = ?', [type])
  return rows[0] ?? null
}

async function notificationUpsert(data: {
  type: string
  title: string
  message: string
  priority: string
  resetRead?: boolean
}): Promise<void> {
  const existing = await notificationFindByType(data.type)
  const ts = now()

  if (!existing) {
    const id = generateId()
    await run(
      'INSERT INTO notifications (id, title, message, type, priority, isRead, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
      [id, data.title, data.message, data.type, data.priority, ts, ts]
    )
    return
  }

  const hasChanged = existing.title !== data.title || existing.message !== data.message || existing.priority !== data.priority
  if (!hasChanged) return

  await run(
    `UPDATE notifications SET title = ?, message = ?, priority = ?, updatedAt = ?${data.resetRead ? ', isRead = 0' : ''} WHERE type = ?`,
    [data.title, data.message, data.priority, ts, data.type]
  )
}

async function notificationMarkRead(id: string): Promise<void> {
  await run('UPDATE notifications SET isRead = 1, updatedAt = ? WHERE id = ?', [now(), id])
}

async function notificationMarkAllRead(): Promise<void> {
  await run('UPDATE notifications SET isRead = 1, updatedAt = ?', [now()])
}

async function notificationDeleteByTypes(types: string[]): Promise<void> {
  if (types.length === 0) return
  const placeholders = types.map(() => '?').join(',')
  await run(`DELETE FROM notifications WHERE type IN (${placeholders})`, types)
}

// ─────────────────────────────────────────────
// Notification sync helpers
// ─────────────────────────────────────────────

async function syncNotificationsAfterTransaction(transaction: {
  id: string; total: number; createdAt: string; paymentMethod: string
}): Promise<void> {
  const date = transaction.createdAt.slice(0, 10).replace(/-/g, '')
  const invoiceNumber = `INV-${date}-${transaction.id.slice(-5).toUpperCase()}`

  await notificationUpsert({
    type: `NEW_TRANSACTION:${transaction.id}`,
    title: 'Transaksi baru berhasil',
    message: `Transaksi baru berhasil: ${invoiceNumber} via Tunai.`,
    priority: 'medium',
  })

  if (transaction.total > 1_000_000) {
    await notificationUpsert({
      type: `LARGE_TRANSACTION:${transaction.id}`,
      title: 'Penjualan besar terdeteksi',
      message: `Penjualan besar ${formatCurrency(transaction.total)} berhasil dicatat pada ${invoiceNumber}.`,
      priority: 'high',
    })
  }

  await syncAllAutoNotifications()
}

export async function syncAllAutoNotifications(): Promise<void> {
  // Low stock
  const lowStockProducts = await query<Product>(
    'SELECT * FROM products WHERE stockPack <= 5 ORDER BY stockPack ASC, name ASC'
  )
  const existingLowStock = await query<{ type: string }>(
    "SELECT type FROM notifications WHERE type LIKE 'LOW_STOCK:%'"
  )
  const activeTypes = new Set(lowStockProducts.map(p => `LOW_STOCK:${p.id}`))
  const staleTypes = existingLowStock.map(n => n.type).filter(t => !activeTypes.has(t))
  await notificationDeleteByTypes(staleTypes)

  for (const product of lowStockProducts) {
    await notificationUpsert({
      type: `LOW_STOCK:${product.id}`,
      title: 'Stok menipis',
      message: `Stok ${product.name} tinggal ${product.stockPack} ${product.unit ?? 'pack'}.`,
      priority: product.stockPack <= 2 ? 'high' : 'medium',
      resetRead: true,
    })
  }

  // Daily summary
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
  const dayKey = todayStart.toISOString().slice(0, 10)

  const todayRevenue = await query<{ total: number }>(
    'SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE createdAt >= ? AND createdAt <= ?',
    [todayStart.toISOString(), todayEnd.toISOString()]
  )
  const revenue = todayRevenue[0]?.total ?? 0

  await notificationUpsert({
    type: `DAILY_SUMMARY:${dayKey}`,
    title: 'Ringkasan harian',
    message: `Pendapatan hari ini mencapai ${formatCurrency(revenue)}.`,
    priority: 'medium',
  })
}

// ─────────────────────────────────────────────
// Dashboard data
// ─────────────────────────────────────────────

export async function getDashboardData() {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
  const chartStart = last7Days[0]

  const [products, todayTxRows, weeklyTxRows] = await Promise.all([
    query<Product>('SELECT id, name, stockPack, unit, categoryId FROM products ORDER BY stockPack ASC, name ASC'),
    query<Transaction & { itemsJson: string }>(`
      SELECT t.*, 
        (SELECT json_group_array(json_object('qtyPack', ti.qtyPack, 'subtotal', ti.subtotal, 'totalWeightKg', ti.totalWeightKg, 'purchasePrice', p.purchasePrice))
         FROM transaction_items ti LEFT JOIN products p ON p.id = ti.productId WHERE ti.transactionId = t.id) as itemsJson
      FROM transactions t WHERE t.createdAt >= ? AND t.createdAt <= ?
    `, [todayStart.toISOString(), todayEnd.toISOString()]),
    query<{ createdAt: string; total: number }>(
      'SELECT createdAt, total FROM transactions WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt ASC',
      [chartStart.toISOString(), todayEnd.toISOString()]
    ),
  ])

  const todayTransactions = todayTxRows.map(r => ({
    ...r,
    items: r.itemsJson ? JSON.parse(r.itemsJson) : [],
  }))

  const lowStockProducts = products.filter(p => p.stockPack <= 5).slice(0, 8)
  const todayRevenue = todayTransactions.reduce((s, t) => s + t.total, 0)
  const todayItemsSold = todayTransactions.reduce((s, t) => s + t.items.reduce((is: number, item: {qtyPack: number}) => is + item.qtyPack, 0), 0)
  const todayProfit = todayTransactions.reduce((s, t) => s + t.items.reduce((is: number, item: { subtotal: number; totalWeightKg: number; purchasePrice: number | null }) => {
    const cost = (item.purchasePrice ?? 0) * item.totalWeightKg
    return is + (item.subtotal - cost)
  }, 0), 0)

  const weeklySales = last7Days.map(date => {
    const dayKey = date.toISOString().slice(0, 10)
    const revenue = weeklyTxRows
      .filter(t => t.createdAt.slice(0, 10) === dayKey)
      .reduce((s, t) => s + t.total, 0)
    return { day: date.toLocaleDateString('id-ID', { weekday: 'short' }), revenue }
  })

  return {
    totalProducts: products.length,
    todayRevenue,
    todayProfit,
    todayTransactions: todayTransactions.length,
    todayItemsSold,
    lowStockCount: lowStockProducts.length,
    criticalStockCount: lowStockProducts.filter(p => p.stockPack <= 2).length,
    lowStockProducts,
    weeklySales,
  }
}

// ─────────────────────────────────────────────
// Public db object (Prisma-like API)
// ─────────────────────────────────────────────

export const db = {
  category: {
    findMany: categoryFindMany,
    findUnique: categoryFindUnique,
    findByName: categoryFindByName,
    create: categoryCreate,
    update: categoryUpdate,
    delete: categoryDelete,
  },
  product: {
    findMany: productFindMany,
    findUnique: productFindUnique,
    findAll: productFindAll,
    create: productCreate,
    update: productUpdate,
    delete: productDelete,
  },
  transaction: {
    findMany: transactionFindMany,
    create: transactionCreate,
  },
  storeProfile: {
    findFirst: storeProfileFindFirst,
    update: storeProfileUpdate,
  },
  notification: {
    findMany: notificationFindMany,
    countUnread: notificationCountUnread,
    markRead: notificationMarkRead,
    markAllRead: notificationMarkAllRead,
    syncAll: syncAllAutoNotifications,
  },
}
