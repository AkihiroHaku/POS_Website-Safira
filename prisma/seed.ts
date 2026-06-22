import { PrismaClient, Category, Product, StoreProfile } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Toko Safina Sembako data...');

  // Categories
  const categoriesData: Pick<Category, 'name' | 'description'>[] = [
    { name: 'Beras', description: 'Kategori aneka beras premium dan ekonomis.' },
    { name: 'Minyak', description: 'Kategori minyak goreng dan turunannya.' },
    { name: 'Gula', description: 'Kategori gula pasir, gula merah, dan pemanis.' },
    { name: 'Mie Instan', description: 'Kategori mie instan untuk penjualan harian.' },
    { name: 'Snack', description: 'Kategori makanan ringan dan camilan.' },
    { name: 'Minuman', description: 'Kategori minuman kemasan dingin maupun suhu ruang.' },
    { name: 'Bumbu Dapur', description: 'Kategori bumbu, penyedap, dan kebutuhan dapur.' }
  ];

  await prisma.category.createMany({
    data: categoriesData,
    skipDuplicates: true,
  });
  console.log(`Created ${categoriesData.length} categories`);

  const storeProfileData: Omit<StoreProfile, 'id' | 'createdAt' | 'updatedAt'> = {
    storeName: 'Kasir Toko Safina',
    ownerName: 'Ibu Safina',
    address: 'Jl. Contoh Usaha No. 12, Jakarta',
    phoneNumber: '021000000',
    whatsappNumber: '6281234567890',
    logoUrl: null,
    receiptFooter: 'Terima kasih sudah berbelanja di Toko Safina.',
    defaultTax: 0,
    defaultDiscount: 0,
    businessType: 'Sembako',
  };

  const existingStoreProfile = await prisma.storeProfile.findFirst();
  if (!existingStoreProfile) {
    await prisma.storeProfile.create({ data: storeProfileData });
  }

  // Sample sembako products
  const productsData: Array<
    Pick<Product, 'name' | 'purchasePrice' | 'sellingPricePerKg' | 'weightPerPack' | 'stockPack' | 'unit' | 'supplier'> & {
      categoryName: string
    }
  > = [
    // Beras
    { name: 'Beras 5kg Premium', categoryName: 'Beras', purchasePrice: 12000, sellingPricePerKg: 13000, weightPerPack: 5, stockPack: 25, unit: 'pack', supplier: 'PT Beras Sejahtera' },
    { name: 'Beras 10kg', categoryName: 'Beras', purchasePrice: 11500, sellingPricePerKg: 12500, weightPerPack: 10, stockPack: 15, unit: 'karung', supplier: 'UD Beras Jaya' },
    
    // Minyak
    { name: 'Minyak Goreng 1L', categoryName: 'Minyak', purchasePrice: 14000, sellingPricePerKg: 15000, weightPerPack: 0.9, stockPack: 40, unit: 'botol', supplier: 'PT Minyak Nusantara' },
    { name: 'Minyak 2L', categoryName: 'Minyak', purchasePrice: 13500, sellingPricePerKg: 14500, weightPerPack: 1.8, stockPack: 20, unit: 'botol', supplier: 'Sumber Makmur' },
    
    // Gula
    { name: 'Gula Pasir 1kg', categoryName: 'Gula', purchasePrice: 13000, sellingPricePerKg: 14000, weightPerPack: 1, stockPack: 50, unit: 'pack', supplier: 'PT Gula Sejahtera' },
    { name: 'Gula Merah 500g', categoryName: 'Gula', purchasePrice: 16000, sellingPricePerKg: 17000, weightPerPack: 0.5, stockPack: 30, unit: 'pack', supplier: 'Bapak Suroto' },
    
    // Mie
    { name: 'Indomie Goreng', categoryName: 'Mie Instan', purchasePrice: 3000, sellingPricePerKg: 3500, weightPerPack: 0.085, stockPack: 100, unit: 'pcs', supplier: 'Indofood Distributor' },
    { name: 'Mie Sedaap', categoryName: 'Mie Instan', purchasePrice: 2800, sellingPricePerKg: 3200, weightPerPack: 0.085, stockPack: 80, unit: 'pcs', supplier: 'Wings Group' },
    
    // Snack
    { name: 'Chitato 40g', categoryName: 'Snack', purchasePrice: 4000, sellingPricePerKg: 4500, weightPerPack: 0.04, stockPack: 60, unit: 'pcs', supplier: 'PT Indofood' },
    
    // Minuman
    { name: 'Teh Botol Sosro 350ml', categoryName: 'Minuman', purchasePrice: 5000, sellingPricePerKg: 6000, weightPerPack: 0.35, stockPack: 70, unit: 'botol', supplier: 'Sosro' },
    { name: 'Aqua 600ml', categoryName: 'Minuman', purchasePrice: 3000, sellingPricePerKg: 3500, weightPerPack: 0.6, stockPack: 90, unit: 'botol', supplier: 'Danone' },
    
    // Bumbu
    { name: 'Royco Ayam 1kg', categoryName: 'Bumbu Dapur', purchasePrice: 25000, sellingPricePerKg: 28000, weightPerPack: 1, stockPack: 20, unit: 'pack', supplier: 'Unilever' },
    { name: 'Garam 500g', categoryName: 'Bumbu Dapur', purchasePrice: 2000, sellingPricePerKg: 2500, weightPerPack: 0.5, stockPack: 40, unit: 'pack', supplier: 'Local' }
  ];

  // Get category IDs
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map(allCategories.map(c => [c.name, c.id]));

  const finalProducts = productsData.map(p => ({
    name: p.name,
    purchasePrice: p.purchasePrice,
    sellingPricePerKg: p.sellingPricePerKg,
    weightPerPack: p.weightPerPack,
    stockPack: p.stockPack,
    unit: p.unit,
    supplier: p.supplier,
    categoryId: catMap.get(p.categoryName) || null
  }));

  await prisma.product.createMany({
    data: finalProducts,
    skipDuplicates: true,
  });
  console.log(`Created ${finalProducts.length} products`);

  console.log('✅ Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

