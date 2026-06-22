'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackButton } from '@/components/ui/back-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Search, Plus, Tags, Trash2 } from 'lucide-react'
import { formatCurrency, toast } from '@/lib/utils'
import { db, type Product } from '@/lib/db'

type CategoryWithCount = { id: string; name: string; _count: { products: number } }
type ProductWithCategory = Product

interface ProductList {
  products: ProductWithCategory[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<ProductList | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null)

  // Refs so fetchProducts stays stable without capturing stale closures
  const searchRef = useRef(search)
  const categoryIdRef = useRef(categoryId)
  const initialLoad = useRef(true)
  const skipPageEffect = useRef(false)

  useEffect(() => { searchRef.current = search }, [search])
  useEffect(() => { categoryIdRef.current = categoryId }, [categoryId])

  // Stable — never recreated, reads from refs
  const fetchProducts = useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const { products, total } = await db.product.findMany({
        page: pageNum,
        limit: 10,
        search: searchRef.current,
        categoryId: categoryIdRef.current,
      })
      const pages = Math.max(1, Math.ceil(total / 10))
      setProductsList({ products, pagination: { page: pageNum, limit: 10, total, pages } })
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }, []) // stable reference

  const fetchCategories = useCallback(async () => {
    try {
      const data = await db.category.findMany()
      setCategories(data)
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat kategori')
    }
  }, [])

  // 1. Initial load — runs once because both callbacks are stable
  useEffect(() => {
    fetchCategories()
    fetchProducts(1)
  }, [fetchCategories, fetchProducts])

  // 2. Filter changes (search / category) — debounced, resets to page 1
  useEffect(() => {
    if (initialLoad.current) return // skip — initial load handled above
    const timer = setTimeout(() => {
      skipPageEffect.current = true // prevent page effect from double-fetching
      setPage(1)
      fetchProducts(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, categoryId, fetchProducts])

  // 3. Pagination — only fires when user clicks prev/next
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false
      return
    }
    if (skipPageEffect.current) {
      skipPageEffect.current = false
      return
    }
    fetchProducts(page)
  }, [page, fetchProducts])

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setLoading(true)
    try {
      await db.product.delete(deleteTarget.id)
      toast.success('Produk berhasil dihapus')
      setDeleteTarget(null)
      if (productsList?.products.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchProducts(page)
      }
    } catch (error) {
      console.error(error)
      toast.error((error as Error).message || 'Terjadi kesalahan saat menghapus produk')
    } finally {
      setLoading(false)
    }
  }

  if (!productsList) {
    return (
      <div className="mx-auto flex w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Memuat data produk...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Manajemen Produk</h1>
          <p style={{ color: 'var(--foreground-soft)' }}>Kelola stok, kategori, dan harga produk toko dengan tampilan yang rapi.</p>
        </div>
        <div className="flex gap-3">
          <BackButton fallbackHref="/" />
          <Link href="/categories">
            <Button variant="outline">
              <Tags className="mr-2 h-4 w-4" />
              Kelola Kategori
            </Button>
          </Link>
          <Link href="/products/add">
            <Button className="shadow-[0_18px_34px_-20px_rgba(5,150,105,0.7)]">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cari Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nama atau supplier..."
                  className="pl-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={categoryId || 'all'}
                onValueChange={(value) => setCategoryId(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat._count.products})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>{productsList.pagination.total}</div>
            <p className="text-sm" style={{ color: 'var(--foreground-soft)' }}>Total produk tersimpan di inventaris.</p>
            <Badge className="w-fit rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-600">
              {productsList.products.length} ditampilkan
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Memuat data produk...</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-[26px] border" style={{ borderColor: 'var(--border)' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: 'var(--surface-muted)' }}>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Harga Beli</TableHead>
                      <TableHead className="text-right">Harga Jual/kg</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsList.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-semibold">{product.name}</TableCell>
                        <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.purchasePrice || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.sellingPricePerKg)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              product.stockPack <= 5
                                ? 'rounded-full border-0 bg-red-500/10 px-3 py-1 text-red-600'
                                : 'rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-600'
                            }
                          >
                            {product.stockPack} {product.unit ?? 'pack'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/products/edit?id=${product.id}`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            <Button variant="destructive" size="sm" onClick={() => {
                              setDeleteTarget(product)
                            }}>
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--foreground-soft)' }}>
                  Halaman {productsList.pagination.page} dari {productsList.pagination.pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={productsList.pagination.page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={productsList.pagination.page === productsList.pagination.pages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Produk ini mungkin sudah memiliki riwayat transaksi. Menghapus produk dapat memengaruhi data lama. Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-[24px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            Produk <span className="font-semibold">{deleteTarget?.name}</span> akan dihapus permanen jika belum pernah dipakai dalam transaksi.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} disabled={loading}>
              Batal
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleDelete()}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {loading ? 'Menghapus...' : 'Tetap Hapus'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

