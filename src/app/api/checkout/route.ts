import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createTransactionNotifications, ensureAutoNotifications } from '@/lib/notifications'

const checkoutSchema = z.object({
  cart: z
    .array(
      z.object({
        product: z.object({
          id: z.string(),
          sellingPricePerKg: z.number().nonnegative(),
          weightPerPack: z.number().positive(),
          stockPack: z.number().nonnegative(),
        }),
        qtyPack: z.number().int().positive(),
      })
    )
    .min(1, 'Keranjang tidak boleh kosong'),
  paidAmount: z.number().nonnegative(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { cart, paidAmount } = parsed.data

    const productIds = cart.map((item) => item.product.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((product) => [product.id, product]))

    let total = 0

    for (const item of cart) {
      const product = productMap.get(item.product.id)
      if (!product) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan: ${item.product.id}` },
          { status: 400 }
        )
      }

      if (item.qtyPack > product.stockPack) {
        return NextResponse.json(
          {
            error: `Stok produk "${product.name}" tidak cukup`,
            details: { productId: product.id, available: product.stockPack },
          },
          { status: 400 }
        )
      }

      total += item.qtyPack * product.weightPerPack * product.sellingPricePerKg
    }

    if (paidAmount < total) {
      return NextResponse.json(
        { error: 'Jumlah bayar belum cukup', details: { total, paidAmount } },
        { status: 400 }
      )
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          total,
          paymentMethod: 'cash',
          paidAmount,
          changeAmount: paidAmount - total,
        },
      })

      const createItems = cart.map((item) => {
        const product = productMap.get(item.product.id)!
        const totalWeightKg = item.qtyPack * product.weightPerPack
        const subtotal = totalWeightKg * product.sellingPricePerKg

        return tx.transactionItem.create({
          data: {
            transactionId: createdTransaction.id,
            productId: product.id,
            qtyPack: item.qtyPack,
            totalWeightKg,
            pricePerKg: product.sellingPricePerKg,
            subtotal,
          },
        })
      })

      const updateStocks = cart.map((item) => {
        const product = productMap.get(item.product.id)!
        return tx.product.update({
          where: { id: product.id },
          data: { stockPack: product.stockPack - item.qtyPack },
        })
      })

      await Promise.all([...createItems, ...updateStocks])

      return createdTransaction
    })

    await createTransactionNotifications(prisma, transaction)
    await ensureAutoNotifications()

    return NextResponse.json({ success: true, transactionId: transaction.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
