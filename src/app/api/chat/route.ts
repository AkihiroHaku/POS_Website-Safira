import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(2000, 'Pesan terlalu panjang'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
})

interface StoreContext {
  storeName: string
  businessType: string
  address: string
  phoneNumber: string
  lowStockItems: Array<{ name: string; stock: number; unit: string; category?: string }>
  totalProducts: number
  totalCategories: number
  categoriesList: Array<{ name: string; productCount: number }>
  todayRevenue: number
  todayProfit: number
  todayTransactionCount: number
  todayItemsSold: number
  recentTransactions: Array<{ time: string; total: string; paymentMethod: string; itemCount: number }>
  weeklyRevenueSummary: Array<{ date: string; total: string }>
}

async function gatherStoreContext(): Promise<StoreContext | null> {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [
      profile,
      lowStockProducts,
      totalProducts,
      totalCategories,
      categories,
      todayTransactions,
      weeklyTransactions,
    ] = await Promise.all([
      prisma.storeProfile.findFirst({ orderBy: { createdAt: 'asc' } }),
      prisma.product.findMany({
        where: { stockPack: { lte: 5 } },
        include: { category: true },
        orderBy: { stockPack: 'asc' },
        take: 20,
      }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.category.findMany({
        select: {
          name: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
        take: 20,
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  purchasePrice: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
            lte: todayEnd,
          },
        },
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const todayRevenue = todayTransactions.reduce((acc, tx) => acc + tx.total, 0)
    const todayItemsSold = todayTransactions.reduce(
      (acc, tx) => acc + tx.items.reduce((sum, item) => sum + item.qtyPack, 0),
      0
    )

    const todayProfit = todayTransactions.reduce((acc, tx) => {
      const txProfit = tx.items.reduce((sum, item) => {
        const cost = (item.product?.purchasePrice ?? 0) * item.totalWeightKg
        return sum + (item.subtotal - cost)
      }, 0)
      return acc + txProfit
    }, 0)

    const recentTransactions = todayTransactions.slice(0, 5).map((tx) => ({
      time: tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      total: formatCurrency(tx.total),
      paymentMethod: tx.paymentMethod.toUpperCase(),
      itemCount: tx.items.length,
    }))

    // Weekly summary grouping
    const dayMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, 0)
    }

    weeklyTransactions.forEach((tx) => {
      const key = tx.createdAt.toISOString().slice(0, 10)
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) ?? 0) + tx.total)
      }
    })

    const weeklyRevenueSummary = Array.from(dayMap.entries()).map(([dateStr, sum]) => {
      const dateObj = new Date(dateStr)
      return {
        date: dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        total: formatCurrency(sum),
      }
    })

    return {
      storeName: profile?.storeName ?? 'Kasir Toko Safira',
      businessType: profile?.businessType ?? 'Sembako & Ritel',
      address: profile?.address ?? 'Belum diatur',
      phoneNumber: profile?.phoneNumber || profile?.whatsappNumber || 'Belum diatur',
      lowStockItems: lowStockProducts.map((p) => ({
        name: p.name,
        stock: p.stockPack,
        unit: p.unit ?? 'pack',
        category: p.category?.name,
      })),
      totalProducts,
      totalCategories,
      categoriesList: categories.map((c) => ({
        name: c.name,
        productCount: c._count.products,
      })),
      todayRevenue,
      todayProfit,
      todayTransactionCount: todayTransactions.length,
      todayItemsSold,
      recentTransactions,
      weeklyRevenueSummary,
    }
  } catch (error) {
    console.error('Failed to gather store context from DB:', error)
    return null
  }
}

function constructSystemPrompt(context: StoreContext | null): string {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let storeDataText = 'Informasi database saat ini sedang tidak dapat diakses.'

  if (context) {
    const lowStockList =
      context.lowStockItems.length > 0
        ? context.lowStockItems
            .map(
              (p) =>
                `- ${p.name} (Sisa: ${p.stock} ${p.unit}${p.category ? ` | Kategori: ${p.category}` : ''})`
            )
            .join('\n')
        : 'Semua produk memiliki stok di atas 5 pack (aman).'

    const categoryList =
      context.categoriesList.length > 0
        ? context.categoriesList.map((c) => `${c.name} (${c.productCount} produk)`).join(', ')
        : 'Belum ada kategori terdaftar.'

    const recentTxList =
      context.recentTransactions.length > 0
        ? context.recentTransactions
            .map((tx) => `- Pukul ${tx.time}: ${tx.total} (${tx.paymentMethod}, ${tx.itemCount} jenis item)`)
            .join('\n')
        : 'Belum ada transaksi hari ini.'

    const weeklyList = context.weeklyRevenueSummary
      .map((w) => `${w.date}: ${w.total}`)
      .join(' | ')

    storeDataText = `
=== DATA REAL-TIME TOKO (${dateStr}) ===
- Nama Toko: ${context.storeName}
- Jenis Usaha: ${context.businessType}
- Alamat: ${context.address}
- Kontak: ${context.phoneNumber}
- Total Produk Terdaftar: ${context.totalProducts} produk
- Total Kategori: ${context.totalCategories} kategori [${categoryList}]

--- PERFORMA PENJUALAN HARI INI ---
- Jumlah Transaksi Hari Ini: ${context.todayTransactionCount} transaksi
- Total Pendapatan / Omset Hari Ini: ${formatCurrency(context.todayRevenue)}
- Estimasi Laba Bersih Hari Ini: ${formatCurrency(context.todayProfit)}
- Total Item Terjual Hari Ini: ${context.todayItemsSold} item

--- TRANSAKSI TERAKHIR HARI INI ---
${recentTxList}

--- TREN PENDAPATAN 7 HARI TERAKHIR ---
${weeklyList}

--- PRODUK DENGAN STOK MENIPIS (<= 5 pack) ---
${lowStockList}
`
  }

  return `Kamu adalah "Asisten Toko Pintar", AI chatbot pintar untuk aplikasi Kasir Toko UMKM Safira.

TUGAS UTAMA:
1. Membantu pemilik toko dan kasir menjawab pertanyaan seputar stok produk, omset/pendapatan, laba bersih, transaksi, dan data toko secara akurat.
2. Memberikan saran bisnis yang praktis (misalnya peringatan untuk restock produk yang hampir habis atau tips penjualan).
3. Berbicara dengan bahasa Indonesia yang ramah, sopan, profesional, ringkas, dan jelas.

PANDUAN FORMAT:
- Selalu sebutkan nominal uang dalam format Rupiah, contoh: "Rp 150.000".
- Gunakan bullet points atau daftar bernomor jika menyampaikan beberapa informasi.
- Jika pengguna menanyakan data faktual (stok, laba, omset, transaksi), gunakan HANYA data yang tercantum pada konteks toko di bawah. Jangan mengarang data angka.
- Jika data tidak ditemukan atau produk tidak ada dalam daftar stok menipis, sampaikan bahwa produk tersebut tidak tercatat menipis atau cek menu Produk untuk data lengkap.
- Jika ditanya hal umum di luar toko kasir, jawab secara ramah namun ingatkan bahwa kamu adalah asisten kasir toko.

${storeDataText}
`
}

async function callGeminiApi(
  apiKey: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']

  const contents = [
    ...history.slice(-8).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ]

  let lastError: Error | null = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000,
          },
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.warn(`Gemini model ${model} failed with status ${response.status}:`, errorBody)
        lastError = new Error(`HTTP ${response.status}: ${errorBody}`)
        continue
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && typeof text === 'string') {
        return text.trim()
      }
    } catch (err) {
      console.warn(`Gemini model ${model} request threw error:`, err)
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError ?? new Error('Semua model Gemini tidak dapat diakses saat ini.')
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = chatRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Format pesan tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { message, history = [] } = parsed.data
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your_api_key_here') {
      return NextResponse.json({
        reply:
          'Halo! Fitur AI Chatbot Kasir Toko Safira membutuhkan Google Gemini API Key.\n\n' +
          'Silakan tambahkan `GEMINI_API_KEY=AIzaSy...` di file `.env` proyek Anda.\n' +
          'Anda dapat memperoleh API Key secara gratis di Google AI Studio (https://aistudio.google.com/apikey).',
      })
    }

    const storeContext = await gatherStoreContext()
    const systemPrompt = constructSystemPrompt(storeContext)

    try {
      const reply = await callGeminiApi(apiKey, systemPrompt, history, message)
      return NextResponse.json({ reply })
    } catch (geminiError: unknown) {
      console.error('Gemini API execution error:', geminiError)
      const errMessage = geminiError instanceof Error ? geminiError.message : String(geminiError)

      if (errMessage.includes('API_KEY_INVALID') || errMessage.includes('403')) {
        return NextResponse.json({
          reply:
            '⚠️ API Key Gemini yang Anda gunakan tampaknya tidak valid atau tidak memiliki izin akses. Harap periksa kembali `GEMINI_API_KEY` di file `.env`.',
        })
      }

      if (errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('429')) {
        return NextResponse.json({
          reply:
            '⏳ Kuota permintaan Gemini API sedang penuh atau mencapai limit. Silakan tunggu beberapa saat lagi sebelum mencoba kembali.',
        })
      }

      return NextResponse.json({
        reply:
          'Maaf, terjadi kendala saat menghubungi layanan AI. Silakan coba lagi beberapa saat lagi.',
      })
    }
  } catch (error) {
    console.error('Unhandled chat route error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    )
  }
}
