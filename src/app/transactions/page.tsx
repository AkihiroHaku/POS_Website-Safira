'use client'

import { useEffect, useState } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { SummaryCards } from '@/components/transactions/summary-cards'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { TransactionsWeeklySalesChart } from '@/components/transactions/weekly-sales-chart'
import type {
  PaymentMethodLabel,
  SummaryCardItem,
  TopSellingProduct,
  TransactionRecord,
  TransactionStatus,
  WeeklySalesPoint,
} from '@/components/transactions/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db, type StoreProfile, type Transaction } from '@/lib/db'
import {
  BadgeDollarSign,
  ReceiptText,
  Store,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

function formatInvoiceNumber(id: string, createdAt: string) {
  const date = createdAt.slice(0, 10).replace(/-/g, '')
  return `INV-${date}-${id.slice(-5).toUpperCase()}`
}

function mapPaymentMethod(method: string): PaymentMethodLabel {
  switch (method.toLowerCase()) {
    case 'qris': return 'QRIS'
    case 'transfer': return 'Transfer'
    default: return 'Tunai'
  }
}

function getStatus(createdAt: string): TransactionStatus {
  const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  return diffHours <= 1 ? 'Pending' : 'Selesai'
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export default function TransactionsPage() {
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [summaryCards, setSummaryCards] = useState<SummaryCardItem[]>([])
  const [weeklySales, setWeeklySales] = useState<WeeklySalesPoint[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        const last7Days = getLast7Days()
        const chartStart = last7Days[0]

        const [profile, allTx, weeklyTx] = await Promise.all([
          db.storeProfile.findFirst(),
          db.transaction.findMany(),
          db.transaction.findMany({
            startDate: chartStart.toISOString(),
            endDate: todayEnd.toISOString(),
          }),
        ])

        setStoreProfile(profile)

        const todayTx = allTx.filter(t => {
          const d = new Date(t.createdAt)
          return d >= todayStart && d <= todayEnd
        })

        // Summary cards
        const todayRevenue = todayTx.reduce((s, t) => s + t.total, 0)
        const todayItemsSold = todayTx.reduce((s, t) =>
          s + (t.items ?? []).reduce((is, item) => is + item.qtyPack, 0), 0)
        const estimatedProfit = todayTx.reduce((s, t) =>
          s + (t.items ?? []).reduce((is, item) => {
            const cost = (item.product?.purchasePrice ?? 0) * item.totalWeightKg
            return is + (item.subtotal - cost)
          }, 0), 0)

        setSummaryCards([
          {
            title: 'Total Transaksi Hari Ini',
            value: todayTx.length,
            format: 'number',
            description: 'Jumlah invoice aktif yang tercatat hari ini',
            trend: 'up',
            accent: 'emerald',
          },
          {
            title: 'Omzet Hari Ini',
            value: todayRevenue,
            format: 'currency',
            description: 'Total pendapatan kotor penjualan harian',
            trend: 'up',
            accent: 'blue',
          },
          {
            title: 'Total Item Terjual',
            value: todayItemsSold,
            format: 'number',
            description: 'Akumulasi seluruh qty pack yang keluar',
            trend: 'up',
            accent: 'amber',
          },
          {
            title: 'Estimasi Laba',
            value: estimatedProfit,
            format: 'currency',
            description: 'Estimasi margin dari harga beli produk',
            trend: estimatedProfit >= 0 ? 'up' : 'down',
            accent: 'violet',
          },
          {
            title: 'Jumlah Pelanggan',
            value: todayTx.length,
            format: 'number',
            description: 'Fallback pelanggan umum dari setiap transaksi',
            trend: 'neutral',
            accent: 'rose',
          },
        ])

        // Weekly sales chart
        const weekly: WeeklySalesPoint[] = last7Days.map(date => {
          const dayKey = date.toISOString().slice(0, 10)
          const dayTx = weeklyTx.filter(t => t.createdAt.slice(0, 10) === dayKey)
          return {
            day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
            revenue: dayTx.reduce((s, t) => s + t.total, 0),
            transactions: dayTx.length,
          }
        })
        setWeeklySales(weekly)

        // Map transactions to TransactionRecord[]
        const mappedTx: TransactionRecord[] = allTx.map(t => ({
          id: t.id,
          invoiceNumber: formatInvoiceNumber(t.id, t.createdAt),
          createdAt: t.createdAt,
          cashierName: 'Kasir Safina',
          customerName: 'Pelanggan Umum',
          itemCount: (t.items ?? []).reduce((s, item) => s + item.qtyPack, 0),
          total: t.total,
          paidAmount: t.paidAmount,
          changeAmount: t.changeAmount,
          paymentMethod: mapPaymentMethod(t.paymentMethod),
          status: getStatus(t.createdAt),
          items: (t.items ?? []).map(item => ({
            id: item.id,
            productName: item.product?.name ?? 'Produk',
            qtyPack: item.qtyPack,
            totalWeightKg: item.totalWeightKg,
            pricePerKg: item.pricePerKg,
            subtotal: item.subtotal,
          })),
        }))
        setTransactions(mappedTx)

        // Top products
        const productSales = new Map<string, { name: string; qty: number }>()
        for (const t of allTx) {
          for (const item of (t.items ?? [])) {
            const existing = productSales.get(item.productId)
            if (existing) {
              existing.qty += item.qtyPack
            } else {
              productSales.set(item.productId, {
                name: item.product?.name ?? 'Produk',
                qty: item.qtyPack,
              })
            }
          }
        }

        const top: TopSellingProduct[] = [...productSales.entries()]
          .map(([id, { name, qty }]) => ({ id, name, quantitySold: qty }))
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, 5)
          .filter(p => p.quantitySold > 0)
        setTopProducts(top)
      } catch (err) {
        console.error('Transactions load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !storeProfile) {
    return (
      <div className="mx-auto flex w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-center py-20">
          <div className="space-y-3 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Memuat data transaksi...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8">
      <section
        className="overflow-hidden rounded-[32px] border p-5 backdrop-blur-xl sm:p-7"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-full border-0 bg-emerald-500/12 px-3 py-1 text-emerald-700 ring-0 dark:bg-emerald-500/15 dark:text-emerald-300">
              Laporan Transaksi {storeProfile.storeName}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--foreground)' }}>
              Transaksi
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: 'var(--foreground-soft)' }}>
              Pantau seluruh riwayat penjualan dan laporan transaksi {storeProfile.storeName} dalam satu layar profesional yang siap dipakai admin maupun kasir.
            </p>
          </div>
          <div className="flex items-center justify-end">
            <BackButton fallbackHref="/" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div
            className="rounded-3xl border p-4"
            style={{ borderColor: 'rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.08)' }}
          >
            <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">Omzet</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Hari Ini</p>
          </div>
          <div
            className="rounded-3xl border p-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
          >
            <ReceiptText className="h-5 w-5" style={{ color: 'var(--foreground-muted)' }} />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>Riwayat</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Invoice</p>
          </div>
          <div
            className="col-span-2 rounded-3xl border p-4 sm:col-span-1"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
          >
            <Store className="h-5 w-5" style={{ color: 'var(--foreground-muted)' }} />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>Operasional</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{storeProfile.storeName}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>Ringkasan Hari Ini</h2>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Statistik utama dari data transaksi harian yang tersimpan di database.
          </p>
        </div>
        <SummaryCards items={summaryCards} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Performa Penjualan Mingguan</CardTitle>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Grafik omzet 7 hari terakhir dengan sumber data langsung dari transaksi toko.
            </p>
          </CardHeader>
          <CardContent>
            <TransactionsWeeklySalesChart data={weeklySales} />
          </CardContent>
        </Card>

        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Panel Monitoring</CardTitle>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Halaman ini dipakai admin untuk memantau histori penjualan, detail invoice, dan export laporan.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-3xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>Top Produk</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{topProducts.length}</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>Produk aktif pada ranking penjualan.</p>
            </div>
            <div
              className="rounded-3xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>Total Riwayat</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{transactions.length}</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>Invoice tersimpan dan siap dicetak ulang.</p>
            </div>
            <div
              className="rounded-3xl border p-4 sm:col-span-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>Insight</p>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--foreground-soft)' }}>
                Sistem transaksi ini sudah siap untuk presentasi final project dengan filter cepat, modal detail invoice, grafik penjualan, dan export laporan dalam format CSV maupun PDF.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <TransactionTable
        transactions={transactions}
        topProducts={topProducts}
        storeProfile={{
          storeName: storeProfile.storeName,
          ownerName: storeProfile.ownerName,
          address: storeProfile.address,
          phoneNumber: storeProfile.phoneNumber,
          whatsappNumber: storeProfile.whatsappNumber,
          logoUrl: storeProfile.logoUrl,
          receiptFooter: storeProfile.receiptFooter,
          businessType: storeProfile.businessType,
          defaultTax: storeProfile.defaultTax,
          defaultDiscount: storeProfile.defaultDiscount,
        }}
      />
    </div>
  )
}
