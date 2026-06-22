'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Tag, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/utils'
import { db } from '@/lib/db'

type CategoryWithCount = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count: { products: number }
}

const pageSize = 8

type CategoryFormState = { name: string; description: string }
const initialFormState: CategoryFormState = { name: '', description: '' }

function formatDate(dateString: string | Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(dateString))
}

export function CategoriesPageClient() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(initialFormState)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null)
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await db.category.findMany()
      const filtered = search.trim()
        ? data.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.description ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : data
      setCategories(filtered)
    } catch (error) {
      console.error(error)
      toast.error((error as Error).message || 'Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => { fetchCategories(); setPage(1) }, 250)
    return () => clearTimeout(timer)
  }, [fetchCategories])

  const totalProducts = useMemo(
    () => categories.reduce((sum, c) => sum + c._count.products, 0),
    [categories]
  )
  const recentlyAdded = useMemo(
    () => [...categories].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4),
    [categories]
  )

  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const currentRows = categories.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function closeModal() {
    setModalType(null); setSelectedCategory(null)
    setCategoryForm(initialFormState); setErrorMessage('')
  }
  function openCreateModal() {
    setCategoryForm(initialFormState); setSelectedCategory(null)
    setErrorMessage(''); setModalType('create')
  }
  function openEditModal(category: CategoryWithCount) {
    setSelectedCategory(category)
    setCategoryForm({ name: category.name, description: category.description ?? '' })
    setErrorMessage(''); setModalType('edit')
  }
  function openDeleteModal(category: CategoryWithCount) {
    setSelectedCategory(category); setErrorMessage(''); setModalType('delete')
  }

  async function handleSubmitCategory() {
    setIsSubmitting(true); setErrorMessage('')
    try {
      if (modalType === 'edit' && selectedCategory) {
        await db.category.update(selectedCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description || null,
        })
      } else {
        const existing = await db.category.findByName(categoryForm.name)
        if (existing) throw new Error('Nama kategori sudah digunakan')
        await db.category.create({ name: categoryForm.name, description: categoryForm.description || null })
      }
      toast.success(modalType === 'edit' ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan')
      closeModal(); await fetchCategories()
    } catch (error) {
      const message = (error as Error).message || 'Kategori gagal disimpan'
      setErrorMessage(message); toast.error(message)
    } finally { setIsSubmitting(false) }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return
    setIsSubmitting(true); setErrorMessage('')
    try {
      await db.category.delete(selectedCategory.id)
      toast.success('Kategori berhasil dihapus')
      closeModal(); await fetchCategories()
    } catch (error) {
      const message = (error as Error).message || 'Kategori gagal dihapus'
      setErrorMessage(message); toast.error(message)
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8">

      {/* ─── Hero ─── */}
      <section
        className="overflow-hidden rounded-[32px] border p-5 backdrop-blur-xl sm:p-7"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 rounded-full border-0 bg-emerald-500/12 px-3 py-1 text-emerald-700 ring-0 dark:bg-emerald-500/15 dark:text-emerald-300">
              Manajemen Kategori
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--foreground)' }}>
              Kelola kategori produk untuk operasional toko.
            </h1>
            <p className="mt-3 text-sm leading-6 sm:text-base" style={{ color: 'var(--foreground-soft)' }}>
              Atur kategori agar produk lebih rapi, mudah dicari, dan siap dipakai oleh admin maupun kasir.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BackButton fallbackHref="/products" />
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kategori
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Stats row ─── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
        {/* Search card */}
        <Card
          className="rounded-[28px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Cari Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-4 top-4 h-4 w-4" style={{ color: 'var(--foreground-muted)' }} />
              <Input
                className="pl-11"
                placeholder="Cari nama atau deskripsi kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Kategori */}
        <Card
          className="rounded-[28px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Total Kategori</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {categories.length}
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Kategori aktif di database.</p>
          </CardContent>
        </Card>

        {/* Total Produk */}
        <Card
          className="rounded-[28px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Total Produk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {totalProducts}
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Produk sudah terhubung ke kategori.</p>
          </CardContent>
        </Card>
      </section>

      {/* ─── Table + Sidebar ─── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Daftar Kategori */}
        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Daftar Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Memuat kategori...</p>
            ) : (
              <>
                <div className="overflow-hidden rounded-[26px] border" style={{ borderColor: 'var(--border)' }}>
                  <Table>
                    <TableHeader>
                      <TableRow
                        style={{ backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)' }}
                        className="hover:bg-transparent"
                      >
                        <TableHead style={{ color: 'var(--foreground-muted)' }}>Nama Kategori</TableHead>
                        <TableHead style={{ color: 'var(--foreground-muted)' }}>Deskripsi</TableHead>
                        <TableHead className="text-right" style={{ color: 'var(--foreground-muted)' }}>Jumlah Produk</TableHead>
                        <TableHead style={{ color: 'var(--foreground-muted)' }}>Tanggal Dibuat</TableHead>
                        <TableHead className="text-right" style={{ color: 'var(--foreground-muted)' }}>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center" style={{ color: 'var(--foreground-muted)' }}>
                            Belum ada kategori yang cocok dengan pencarian ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentRows.map((category) => (
                          <TableRow key={category.id} style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                            <TableCell className="font-semibold">{category.name}</TableCell>
                            <TableCell className="max-w-sm" style={{ color: 'var(--foreground-soft)' }}>
                              {category.description || 'Tidak ada deskripsi'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                {category._count.products} produk
                              </Badge>
                            </TableCell>
                            <TableCell style={{ color: 'var(--foreground-soft)' }}>{formatDate(category.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditModal(category)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => openDeleteModal(category)}>Hapus</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Sebelumnya
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Kategori Terbaru */}
        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--foreground)' }}>Kategori Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentlyAdded.length === 0 ? (
              <div
                className="rounded-[24px] border border-dashed p-4 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
              >
                Belum ada kategori baru untuk ditampilkan.
              </div>
            ) : (
              recentlyAdded.map((category) => (
                <div
                  key={category.id}
                  className="rounded-[24px] border p-4"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{category.name}</p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {category.description || 'Kategori tanpa deskripsi'}
                      </p>
                    </div>
                    <Tag className="h-5 w-5 shrink-0 text-emerald-500" />
                  </div>
                  <div
                    className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em]"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <span>{formatDate(category.createdAt)}</span>
                    <span>{category._count.products} produk</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─── Create / Edit Modal ─── */}
      <Modal
        open={modalType === 'create' || modalType === 'edit'}
        title={modalType === 'edit' ? 'Edit Kategori' : 'Tambah Kategori'}
        description="Simpan kategori yang rapi agar produk lebih mudah dikelola."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
            <Button type="button" onClick={handleSubmitCategory} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : modalType === 'edit' ? 'Simpan Perubahan' : 'Simpan Kategori'}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="category-name">Nama Kategori</Label>
          <Input
            id="category-name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Contoh: Minuman Dingin"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-description">Deskripsi</Label>
          <Textarea
            id="category-description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Jelaskan fungsi kategori ini untuk tim toko."
            rows={4}
          />
        </div>
        {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
      </Modal>

      {/* ─── Delete Modal ─── */}
      <Modal
        open={modalType === 'delete'}
        title="Hapus Kategori"
        description="Tindakan ini tidak bisa dibatalkan. Sistem akan menolak penghapusan jika kategori masih dipakai produk."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteCategory} disabled={isSubmitting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </>
        }
      >
        <div className="rounded-[24px] border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Kategori <span className="font-semibold">{selectedCategory?.name}</span> akan dihapus permanen.
        </div>
        {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
      </Modal>
    </div>
  )
}
