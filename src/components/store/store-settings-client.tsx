'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, ImagePlus, Settings2, Trash2 } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StoreLogoMark } from '@/components/store/store-logo-mark'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/utils'
import { db, type StoreProfile } from '@/lib/db'

const businessTypeOptions = ['Sembako', 'Retail', 'Cafe', 'Minimarket', 'Toko Kelontong', 'Lainnya']

type StoreProfileForm = {
  storeName: string
  ownerName: string
  address: string
  phoneNumber: string
  whatsappNumber: string
  logoUrl: string
  receiptFooter: string
  defaultTax: number
  defaultDiscount: number
  businessType: string
}

const initialForm: StoreProfileForm = {
  storeName: '',
  ownerName: '',
  address: '',
  phoneNumber: '',
  whatsappNumber: '',
  logoUrl: '',
  receiptFooter: '',
  defaultTax: 0,
  defaultDiscount: 0,
  businessType: 'Sembako',
}

function normalizeStoreProfile(profile: StoreProfile): StoreProfileForm {
  return {
    storeName: profile.storeName ?? '',
    ownerName: profile.ownerName ?? '',
    address: profile.address ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    whatsappNumber: profile.whatsappNumber ?? '',
    logoUrl: profile.logoUrl ?? '',
    receiptFooter: profile.receiptFooter ?? '',
    defaultTax: profile.defaultTax ?? 0,
    defaultDiscount: profile.defaultDiscount ?? 0,
    businessType: profile.businessType ?? 'Sembako',
  }
}

export function StoreSettingsClient() {
  const [form, setForm] = useState<StoreProfileForm>(initialForm)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function fetchProfile() {
    setLoading(true)
    try {
      const data = await db.storeProfile.findFirst()
      setProfileId(data.id)
      setForm(normalizeStoreProfile(data as StoreProfile))
    } catch (error) {
      console.error(error)
      toast.error((error as Error).message || 'Gagal memuat profil toko')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const logoPreview = useMemo(() => form.logoUrl || '', [form.logoUrl])

  function handleTextChange<K extends keyof StoreProfileForm>(key: K, value: StoreProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleExportBackup() {
    const blob = new Blob([JSON.stringify(form, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'backup-profil-toko-safina.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']

    if (!allowedTypes.includes(file.type)) {
      toast.error('Logo harus berformat PNG, JPG, atau JPEG')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error('Ukuran logo maksimal 1MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      handleTextChange('logoUrl', String(reader.result ?? ''))
      toast.success('Preview logo berhasil diperbarui. Simpan profil untuk menerapkan perubahan.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  async function handleRemoveLogo() {
    if (!logoPreview || !profileId) return
    setDeletingLogo(true)
    setErrorMessage('')
    try {
      await db.storeProfile.update(profileId, { logoUrl: null })
      setForm(prev => ({ ...prev, logoUrl: '' }))
      toast.success('Logo toko berhasil dihapus')
    } catch (error) {
      const message = (error as Error).message || 'Gagal menghapus logo toko'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setDeletingLogo(false)
    }
  }

  async function handleSubmit() {
    if (!profileId) return
    setSaving(true)
    setErrorMessage('')
    try {
      const updated = await db.storeProfile.update(profileId, {
        storeName: form.storeName,
        ownerName: form.ownerName || null,
        address: form.address || null,
        phoneNumber: form.phoneNumber || null,
        whatsappNumber: form.whatsappNumber || null,
        logoUrl: form.logoUrl || null,
        receiptFooter: form.receiptFooter || null,
        defaultTax: form.defaultTax,
        defaultDiscount: form.defaultDiscount,
        businessType: form.businessType || null,
      })
      setForm(normalizeStoreProfile(updated as StoreProfile))
      toast.success('Profil toko berhasil disimpan')
    } catch (error) {
      const message = (error as Error).message || 'Gagal menyimpan profil toko'
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat profil toko...</p>
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
            <Badge className="mb-4 rounded-full border-0 bg-emerald-500/12 px-3 py-1 text-emerald-700 ring-0 dark:bg-emerald-500/15 dark:text-emerald-300">
              Profil Toko
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--foreground)' }}>
              Atur identitas dan pengaturan utama toko.
            </h1>
            <p className="mt-3 text-sm leading-6 sm:text-base" style={{ color: 'var(--foreground-soft)' }}>
              Semua data ini dipakai di navbar, dashboard, halaman transaksi, dan dokumen struk atau export.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BackButton fallbackHref="/" />
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="mr-2 h-4 w-4" />
              Backup JSON
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Settings2 className="mr-2 h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Toko</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="storeName">Nama Toko</Label>
                <Input id="storeName" value={form.storeName} onChange={(event) => handleTextChange('storeName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Nama Pemilik</Label>
                <Input id="ownerName" value={form.ownerName} onChange={(event) => handleTextChange('ownerName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Jenis Usaha</Label>
                <Select value={form.businessType} onValueChange={(value) => handleTextChange('businessType', value)}>
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Pilih jenis usaha" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat Toko</Label>
                <Textarea id="address" rows={4} value={form.address} onChange={(event) => handleTextChange('address', event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontak Toko</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                <Input id="phoneNumber" value={form.phoneNumber} onChange={(event) => handleTextChange('phoneNumber', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">Nomor WhatsApp</Label>
                <Input id="whatsappNumber" value={form.whatsappNumber} onChange={(event) => handleTextChange('whatsappNumber', event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Struk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Catatan Footer Struk</Label>
                <Textarea
                  id="receiptFooter"
                  rows={4}
                  value={form.receiptFooter}
                  onChange={(event) => handleTextChange('receiptFooter', event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo Toko</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="overflow-hidden rounded-[28px] border p-5 themed-transition"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface-muted)',
                }}
              >
                {logoPreview ? (
                  <div
                    className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-[20px] border transition-all duration-300 themed-transition"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    <Image
                      src={logoPreview}
                      alt="Preview logo toko"
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-contain object-center p-6 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-44 items-center justify-center rounded-[20px] border border-dashed text-sm transition-all duration-300 themed-transition"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--foreground-muted)',
                    }}
                  >
                    Preview logo toko akan muncul di sini setelah diupload
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-3 rounded-[24px] border p-4 themed-transition"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface-muted)',
                }}
              >
                <StoreLogoMark
                  logoUrl={logoPreview}
                  storeName={form.storeName || 'Toko'}
                  className="h-14 w-14"
                  iconClassName="h-6 w-6"
                />
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {form.storeName || 'Nama toko belum diisi'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Logo ini akan dipakai di navbar, dashboard, struk, dan export PDF.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/70 px-5 py-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-1">
                  <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoUpload} />
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <span>{logoPreview ? 'Ganti Logo Toko' : 'Upload Logo Toko'}</span>
                  </div>
                </label>
                {logoPreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    disabled={deletingLogo}
                    className="sm:px-5"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingLogo ? 'Menghapus...' : 'Hapus Logo'}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format yang didukung: PNG, JPG, JPEG. Ukuran maksimal 1MB.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Pajak dan Diskon</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="defaultTax">Pajak Default (%)</Label>
                <Input
                  id="defaultTax"
                  type="number"
                  min="0"
                  max="100"
                  value={form.defaultTax}
                  onChange={(event) => handleTextChange('defaultTax', Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Diskon Default (%)</Label>
                <Input
                  id="defaultDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={form.defaultDiscount}
                  onChange={(event) => handleTextChange('defaultDiscount', Number(event.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="rounded-[24px] border p-4 themed-transition"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface-muted)',
                }}
              >
                <div className="flex items-center gap-3">
                  <StoreLogoMark
                    logoUrl={logoPreview}
                    storeName={form.storeName || 'Toko'}
                    className="h-12 w-12"
                    iconClassName="h-5 w-5"
                  />
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{form.storeName || 'Nama toko belum diisi'}</p>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{form.businessType || 'Jenis usaha belum diisi'}</p>
                  </div>
                </div>
              </div>
              {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
