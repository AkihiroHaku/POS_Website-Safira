'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WeeklySalesChart } from '@/components/dashboard/weekly-sales-chart'
import { StatsCard } from '@/components/dashboard/stats-card'
import { StoreLogoMark } from '@/components/store/store-logo-mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db, getDashboardData, type StoreProfile } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Package,
  ReceiptText,
  ShoppingBasket,
  Store,
  Wallet,
} from 'lucide-react'

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dashData, profile] = await Promise.all([
          getDashboardData(),
          db.storeProfile.findFirst(),
        ])
        setData(dashData)
        setStoreProfile(profile)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const quickActions = [
    {
      title: 'Transaksi',
      description: 'Pantau ringkasan penjualan dan performa kas hari ini.',
      href: '/transactions',
      icon: ReceiptText,
    },
    {
      title: 'Produk',
      description: 'Kelola harga, stok, dan kategori barang toko.',
      href: '/products',
      icon: Boxes,
    },
    {
      title: 'POS Kasir',
      description: 'Buka layar kasir untuk checkout yang cepat dan rapi.',
      href: '/cashier',
      icon: Store,
    },
  ]

  if (loading || !data || !storeProfile) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="space-y-3 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Memuat dashboard...</p>
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
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-4">
              <StoreLogoMark
                logoUrl={storeProfile.logoUrl}
                storeName={storeProfile.storeName}
                className="h-16 w-16 rounded-[26px]"
                iconClassName="h-7 w-7"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {storeProfile.storeName}
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  {storeProfile.businessType ?? 'POS Toko Premium'}
                </p>
              </div>
            </div>
            <Badge className="mb-4 rounded-full border-0 bg-emerald-500/12 px-3 py-1 text-emerald-700 ring-0 dark:bg-emerald-500/15 dark:text-emerald-300">
              Dashboard POS {storeProfile.storeName}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--foreground)' }}>
              Dashboard kasir profesional untuk {storeProfile.businessType?.toLowerCase() ?? 'toko modern'}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base" style={{ color: 'var(--foreground-soft)' }}>
              Semua informasi penting harian {storeProfile.storeName} ada di satu layar: penjualan, stok kritis, akses cepat menu utama, dan grafik transaksi mingguan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              className="rounded-3xl border p-4"
              style={{
                borderColor: 'rgba(16, 185, 129, 0.2)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
                Pendapatan
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {formatCurrency(data.todayRevenue)}
              </p>
            </div>
            <div
              className="rounded-3xl border p-4 themed-transition"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-muted)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>
                Transaksi
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {new Intl.NumberFormat('id-ID').format(data.todayTransactions)}
              </p>
            </div>
            <div
              className="col-span-2 rounded-3xl border p-4 themed-transition sm:col-span-1"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-muted)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--foreground-muted)' }}>
                Stok Perlu Cek
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {new Intl.NumberFormat('id-ID').format(data.lowStockCount)} produk
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <Card
          className="rounded-[30px] border p-1 shadow-[0_20px_70px_-50px_rgba(239,68,68,0.7)]"
          style={{
            borderColor: data.lowStockCount > 0 ? 'var(--color-red-border)' : 'var(--color-emerald-border)',
            backgroundColor: data.lowStockCount > 0 ? 'var(--color-red-bg)' : 'var(--color-emerald-bg)',
          }}
        >
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: data.lowStockCount > 0 ? 'var(--color-red-icon-bg)' : 'var(--color-emerald-icon-bg)',
                  color: data.lowStockCount > 0 ? 'var(--color-red-icon)' : 'var(--color-emerald-icon)',
                }}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {data.lowStockCount > 0 ? 'Peringatan stok menipis' : 'Semua stok aman'}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-soft)' }}>
                  {data.lowStockCount > 0
                    ? `${data.lowStockCount} produk perlu perhatian, ${data.criticalStockCount} di antaranya sudah kritis.`
                    : 'Tidak ada produk dengan stok pack 5 atau kurang untuk saat ini.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="rounded-2xl px-4 py-3 text-right shadow-sm"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--foreground-muted)' }}>
                  Low Stock
                </p>
                <p className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  {new Intl.NumberFormat('id-ID').format(data.lowStockCount)}
                </p>
              </div>
              <Button asChild>
                <Link href="/products">Cek Produk</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Quick Access Menu
          </h2>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Akses cepat ke tiga area yang paling sering dipakai.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[28px] border p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 themed-transition"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-500" />
                </div>
                <h3 className="mt-6 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{action.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--foreground-muted)' }}>
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Statistik Hari Ini
          </h2>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Ringkasan operasional toko yang paling relevan untuk hari ini.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <StatsCard
            title="Pendapatan Harian"
            value={data.todayRevenue}
            format="currency"
            description="Total penjualan masuk hari ini"
            trend="up"
            icon={<BadgeDollarSign className="h-5 w-5" />}
          />
          <StatsCard
            title="Laba Harian"
            value={data.todayProfit}
            format="currency"
            description="Estimasi dari harga beli produk"
            trend={data.todayProfit >= 0 ? 'up' : 'down'}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatsCard
            title="Pengeluaran Harian"
            value={0}
            format="currency"
            description="Belum ada modul expense harian"
            trend="neutral"
            icon={<ShoppingBasket className="h-5 w-5" />}
          />
          <StatsCard
            title="Jumlah Transaksi"
            value={data.todayTransactions}
            description="Jumlah struk yang tersimpan"
            trend="up"
            icon={<ReceiptText className="h-5 w-5" />}
          />
          <StatsCard
            title="Item Terjual"
            value={data.todayItemsSold}
            description="Akumulasi qty pack terjual"
            trend="up"
            icon={<Package className="h-5 w-5" />}
          />
          <StatsCard
            title="Pelanggan Baru"
            value={0}
            description="Siap aktif saat modul pelanggan tersedia"
            trend="neutral"
            icon={<Store className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <Card
          className="rounded-[30px] border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Penjualan 7 Hari Terakhir</CardTitle>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Grafik transaksi mingguan yang diambil langsung dari database.
              </p>
            </div>
            <Badge className="rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-600 ring-0">
              Live Data
            </Badge>
          </CardHeader>
          <CardContent>
            <WeeklySalesChart data={data.weeklySales} />
          </CardContent>
        </Card>

        <Card
          className="rounded-[30px] border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CardHeader>
            <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>Produk Stok Menipis</CardTitle>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Daftar produk yang perlu segera dicek atau direstock.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <div
                className="rounded-[24px] border p-4 text-sm text-emerald-600"
                style={{ borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
              >
                Semua stok aman, belum ada produk dengan stok pack 5 atau kurang.
              </div>
            ) : (
              data.lowStockProducts.map((product) => {
                const isCritical = product.stockPack <= 2

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-[24px] border p-4"
                    style={{
                      borderColor: isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                      backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold" style={{ color: 'var(--foreground)' }}>{product.name}</p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {product.category?.name ?? 'Tanpa kategori'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={`rounded-full border-0 px-3 py-1 ring-0 ${
                          isCritical
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {isCritical ? 'Kritis' : 'Menipis'}
                      </Badge>
                      <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {product.stockPack} {product.unit ?? 'pack'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
