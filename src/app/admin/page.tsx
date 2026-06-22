import Link from "next/link"
import { BarChart3, Package, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"

const adminLinks = [
  {
    title: "Dashboard",
    description: "Lihat ringkasan performa toko dan statistik harian.",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Produk",
    description: "Kelola daftar produk, harga, dan stok inventaris.",
    href: "/products",
    icon: Package,
  },
  {
    title: "Kasir",
    description: "Proses transaksi penjualan dari halaman kasir.",
    href: "/cashier",
    icon: ShoppingCart,
  },
]

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Pusat navigasi untuk mengelola aplikasi kasir.
          </p>
        </div>
        <BackButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminLinks.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.href}>
              <CardHeader className="space-y-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--accent)',
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{item.description}</p>
                <Button asChild className="w-full">
                  <Link href={item.href}>Buka {item.title}</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
