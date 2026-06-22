import { prisma } from '@/lib/prisma'

const defaultStoreProfile = {
  storeName: 'Kasir Toko Safina',
  ownerName: 'Pemilik Toko',
  address: 'Alamat toko belum diatur',
  phoneNumber: '',
  whatsappNumber: '',
  logoUrl: null,
  receiptFooter: 'Terima kasih sudah berbelanja di toko kami.',
  defaultTax: 0,
  defaultDiscount: 0,
  businessType: 'Sembako',
}

export async function getStoreProfile() {
  const existingProfile = await prisma.storeProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (existingProfile) {
    return existingProfile
  }

  return prisma.storeProfile.create({
    data: defaultStoreProfile,
  })
}

export { defaultStoreProfile }
