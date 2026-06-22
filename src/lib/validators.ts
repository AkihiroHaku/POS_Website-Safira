import { z } from 'zod'

const optionalCategoryId = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return null
    }

    return value
  },
  z.string().min(1, 'Kategori wajib dipilih').nullable()
)

const optionalSupplier = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  },
  z.string().optional()
)

export const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  categoryId: optionalCategoryId,
  purchasePrice: z.number().min(0, 'Harga beli tidak boleh negatif'),
  sellingPricePerKg: z.number().min(0, 'Harga jual tidak boleh negatif'),
  weightPerPack: z.number().min(0.1, 'Berat pack minimal 0.1kg'),
  stockPack: z.number().min(0, 'Stok tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pack'),
  supplier: optionalSupplier
})

export type ProductSchema = z.infer<typeof productSchema>

const optionalTextField = (fieldLabel: string, maxLength = 255) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value
      }

      const trimmed = value.trim()
      return trimmed === '' ? undefined : trimmed
    },
    z.string().max(maxLength, `${fieldLabel} terlalu panjang`).optional()
  )

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(80, 'Nama kategori maksimal 80 karakter'),
  description: optionalTextField('Deskripsi kategori', 200),
})

export type CategorySchema = z.infer<typeof categorySchema>

export const storeProfileSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, 'Nama toko minimal 2 karakter')
    .max(100, 'Nama toko maksimal 100 karakter'),
  ownerName: optionalTextField('Nama pemilik', 100),
  address: optionalTextField('Alamat toko', 300),
  phoneNumber: optionalTextField('Nomor telepon', 30),
  whatsappNumber: optionalTextField('Nomor WhatsApp', 30),
  logoUrl: z
    .preprocess(
      (value) => {
        if (value === null) {
          return null
        }

        if (typeof value !== 'string') {
          return value
        }

        const trimmed = value.trim()
        return trimmed === '' ? null : trimmed
      },
      z
        .string()
        .max(2_000_000, 'Ukuran logo terlalu besar')
        .nullable()
    ),
  receiptFooter: optionalTextField('Catatan struk', 200),
  defaultTax: z.coerce
    .number({ invalid_type_error: 'Pajak harus berupa angka' })
    .min(0, 'Pajak tidak boleh negatif')
    .max(100, 'Pajak maksimal 100%'),
  defaultDiscount: z.coerce
    .number({ invalid_type_error: 'Diskon harus berupa angka' })
    .min(0, 'Diskon tidak boleh negatif')
    .max(100, 'Diskon maksimal 100%'),
  businessType: optionalTextField('Jenis usaha', 50),
})

export type StoreProfileSchema = z.infer<typeof storeProfileSchema>

