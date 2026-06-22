"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/ui/back-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { productSchema, type ProductSchema } from "@/lib/validators"
import { toast } from "@/lib/utils"
import { db, type Category, type Product } from "@/lib/db"
import { Tags } from "lucide-react"

type CategoryWithCount = Category & { _count: { products: number } }
type ProductWithCategory = Product

function EditProductForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id") ?? ""

  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [product, setProduct] = useState<ProductWithCategory | null>(null)

  const form = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: null,
      purchasePrice: 0,
      sellingPricePerKg: 0,
      weightPerPack: 1,
      stockPack: 0,
      unit: "pack",
      supplier: "",
    },
  })

  useEffect(() => {
    if (!id) return
    async function bootstrap() {
      try {
        const [categoriesData, productData] = await Promise.all([
          db.category.findMany(),
          db.product.findUnique(id),
        ])
        setCategories(categoriesData)
        if (productData) {
          setProduct(productData)
          form.reset({
            name: productData.name,
            categoryId: productData.categoryId ?? null,
            purchasePrice: productData.purchasePrice ?? 0,
            sellingPricePerKg: productData.sellingPricePerKg,
            weightPerPack: productData.weightPerPack,
            stockPack: productData.stockPack,
            unit: productData.unit ?? "pack",
            supplier: productData.supplier ?? "",
          })
        }
      } catch {
        toast.error("Gagal memuat data produk")
      } finally {
        setBooting(false)
      }
    }
    bootstrap()
  }, [form, id])

  async function onSubmit(data: ProductSchema) {
    setLoading(true)
    try {
      await db.product.update(id, data)
      toast.success("Produk berhasil diperbarui")
      router.push("/products")
    } catch (error) {
      toast.error((error as Error).message || "Gagal memperbarui produk")
    } finally {
      setLoading(false)
    }
  }

  if (booting) {
    return <div className="p-6 text-sm text-slate-500">Memuat data produk...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Produk</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Ubah data produk {product?.name ?? ""}.
          </p>
        </div>
        <BackButton fallbackHref="/products" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                value={form.watch("categoryId") ?? "none"}
                onValueChange={(value) =>
                  form.setValue("categoryId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300"
              >
                <Tags className="h-3.5 w-3.5" />
                Kelola kategori
              </Link>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Harga Beli</Label>
              <Input id="purchasePrice" type="number" step="100" {...form.register("purchasePrice", { valueAsNumber: true })} />
              {form.formState.errors.purchasePrice && (
                <p className="text-xs text-red-500">{form.formState.errors.purchasePrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPricePerKg">Harga Jual per Kg</Label>
              <Input id="sellingPricePerKg" type="number" step="100" {...form.register("sellingPricePerKg", { valueAsNumber: true })} />
              {form.formState.errors.sellingPricePerKg && (
                <p className="text-xs text-red-500">{form.formState.errors.sellingPricePerKg.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightPerPack">Berat per Pack (kg)</Label>
              <Input id="weightPerPack" type="number" step="0.1" {...form.register("weightPerPack", { valueAsNumber: true })} />
              {form.formState.errors.weightPerPack && (
                <p className="text-xs text-red-500">{form.formState.errors.weightPerPack.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockPack">Stok Pack</Label>
              <Input id="stockPack" type="number" {...form.register("stockPack", { valueAsNumber: true })} />
              {form.formState.errors.stockPack && (
                <p className="text-xs text-red-500">{form.formState.errors.stockPack.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Satuan</Label>
              <Input id="unit" {...form.register("unit")} />
              {form.formState.errors.unit && (
                <p className="text-xs text-red-500">{form.formState.errors.unit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" {...form.register("supplier")} />
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/products")}>
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Menyimpan..." : "Update Produk"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Suspense boundary required because useSearchParams() needs it in static export
export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat...</div>}>
      <EditProductForm />
    </Suspense>
  )
}
