"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { useCartStore } from "@/store/cartStore"
import { db, type Product, type StoreProfile } from "@/lib/db"
import { formatCurrency, toast } from "@/lib/utils"

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paidAmount, setPaidAmount] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const { items, addItem, updateQty, removeItem, clearCart, getTotal } = useCartStore()

  useEffect(() => {
    db.storeProfile.findFirst()
      .then(setStoreProfile)
      .catch(console.error)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      try {
        const all = await db.product.findAll()
        const filtered = search
          ? all.filter(p =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              (p.supplier ?? '').toLowerCase().includes(search.toLowerCase())
            )
          : all
        setProducts(filtered)
      } catch {
        toast.error("Gagal memuat produk")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [search, refreshKey])

  async function handleCheckout() {
    const numericPaidAmount = Number(paidAmount)
    const total = getTotal()

    if (items.length === 0) {
      toast.error("Keranjang masih kosong")
      return
    }

    if (!Number.isFinite(numericPaidAmount) || numericPaidAmount < total) {
      toast.error("Jumlah bayar belum cukup")
      return
    }

    setCheckingOut(true)
    try {
      await db.transaction.create(items, numericPaidAmount)
      clearCart()
      setPaidAmount("")
      setRefreshKey(k => k + 1)
      toast.success("Transaksi berhasil disimpan")
    } catch (err) {
      toast.error((err as Error).message || "Checkout gagal")
    } finally {
      setCheckingOut(false)
    }
  }

  const total = getTotal()
  const change = Math.max(0, Number(paidAmount || 0) - total)
  const storeName = storeProfile?.storeName ?? "Kasir"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kasir</h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Tambahkan produk ke keranjang lalu selesaikan transaksi untuk {storeName}.
          </p>
        </div>
        <BackButton fallbackHref="/" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pilih Produk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Cari nama produk..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={product.stockPack <= 0}
                    className={`rounded-xl border p-4 text-left transition themed-transition ${
                      product.stockPack <= 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-emerald-500 hover:bg-emerald-500/5'
                    }`}
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                    onClick={() => addItem({ product, qtyPack: 1 })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                          {product.category?.name ?? "Tanpa kategori"}
                        </p>
                      </div>
                      <Badge variant={product.stockPack <= 5 ? "destructive" : "default"}>
                        {product.stockPack} {product.unit ?? "pack"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-medium text-emerald-600">
                      {formatCurrency(product.sellingPricePerKg)} / kg
                    </p>
                    {product.stockPack <= 0 ? (
                      <p className="mt-2 text-xs text-red-500">Stok kosong</p>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keranjang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada item di keranjang.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="space-y-3 rounded-xl border p-4 themed-transition"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--surface-muted)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {formatCurrency(item.product.sellingPricePerKg)} / kg
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.product.id)}
                    >
                      Hapus
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateQty(item.product.id, item.qtyPack - 1)}
                    >
                      -
                    </Button>
                    <span className="min-w-12 text-center text-sm font-medium">
                      {item.qtyPack} pack
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateQty(item.product.id, item.qtyPack + 1)}
                    >
                      +
                    </Button>
                  </div>

                  <p className="text-sm text-slate-500">
                    Subtotal:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(
                        item.qtyPack *
                          item.product.weightPerPack *
                          item.product.sellingPricePerKg
                      )}
                    </span>
                  </p>
                </div>
              ))
            )}

            <div
              className="space-y-3 border-t pt-4 themed-transition"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Input
                type="number"
                min="0"
                placeholder="Jumlah bayar"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
              />
              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--foreground-muted)' }}>
                <span>Kembalian</span>
                <span>{formatCurrency(change)}</span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? "Memproses..." : "Bayar Sekarang"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
