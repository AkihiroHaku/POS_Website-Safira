'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NotificationBell } from '@/components/layout/notification-bell'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Settings, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoreLogoMark } from '@/components/store/store-logo-mark'
import { db, type StoreProfile } from '@/lib/db'

export default function Navbar() {
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null)

  useEffect(() => {
    db.storeProfile.findFirst()
      .then(setStoreProfile)
      .catch(console.error)
  }, [])

  const storeName = storeProfile?.storeName ?? 'Kasir UMKM'
  const businessType = storeProfile?.businessType ?? 'POS Toko Premium'
  const logoUrl = storeProfile?.logoUrl ?? null

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b px-4 py-3 backdrop-blur-xl themed-transition"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--navbar-border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StoreLogoMark
            logoUrl={logoUrl}
            storeName={storeName}
            className="h-11 w-11"
            iconClassName="h-5 w-5"
          />
          <div className="min-w-0">
            <Link
              href="/"
              className="block truncate text-base font-semibold tracking-tight sm:text-lg themed-transition"
              style={{ color: "var(--foreground)" }}
            >
              {storeName}
            </Link>
            <div
              className="flex items-center gap-1 text-xs themed-transition"
              style={{ color: "var(--foreground-muted)" }}
            >
              <Store className="h-3.5 w-3.5" />
              <span>{businessType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href="/store-settings" aria-label="Pengaturan toko">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </nav>
  )
}
